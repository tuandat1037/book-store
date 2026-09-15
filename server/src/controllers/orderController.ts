import { Response } from 'express';
import { query, queryOne } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { evaluatePromotion } from './promotionController.js';

export async function createOrder(req: AuthRequest, res: Response) {
  try {
    const {
      customer_name, customer_email, customer_phone,
      shipping_address, shipping_province, shipping_district, shipping_ward,
      notes, payment_method, promo_code, items
    } = req.body;

    if (!customer_name || !customer_email || !customer_phone || !shipping_address || !shipping_province || !shipping_district || !shipping_ward) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống' });
    }

    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const book = await queryOne('SELECT * FROM books WHERE id = ? AND status = "ACTIVE"', [item.book_id]);
      if (!book) {
        return res.status(400).json({ message: `Sách với ID ${item.book_id} không tồn tại hoặc đã bị ẩn` });
      }
      if (book.stock < item.quantity) {
        return res.status(400).json({ message: `Sách "${book.title}" không đủ số lượng tồn kho (còn ${book.stock})` });
      }

      const coverImg = await queryOne('SELECT image_url FROM book_images WHERE book_id = ? ORDER BY is_primary DESC LIMIT 1', [book.id]);

      const itemPrice = book.sale_price !== null && book.sale_price < book.price ? book.sale_price : book.price;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        book_id: book.id,
        book_title: book.title,
        book_image: coverImg ? coverImg.image_url : '',
        price: itemPrice,
        quantity: item.quantity,
        total_price: itemTotal,
        current_stock: book.stock,
        sold_quantity: book.sold_quantity
      });
    }

    let discount_amount = 0;
    let appliedPromo: any = null;
    if (promo_code && String(promo_code).trim()) {
      const promo = await queryOne('SELECT * FROM promotions WHERE code = ?', [String(promo_code).trim().toUpperCase()]);
      const result = evaluatePromotion(promo, subtotal);
      if (result.ok) {
        discount_amount = result.discount_amount;
        appliedPromo = promo;
      } else if (promo) {
        // Mã có tồn tại nhưng không dùng được (hết hạn, chưa tới ngày, hết lượt, chưa đủ giá trị đơn)
        return res.status(400).json({ message: result.message });
      }
    }

    const shipping_fee = subtotal >= 200000 ? 0 : 20000;
    const total_amount = Math.max(0, subtotal - discount_amount + shipping_fee);

    const order_code = 'DH' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
    const userId = req.user?.id || null;

    const resOrder = await query(
      `INSERT INTO orders (order_code, user_id, customer_name, customer_email, customer_phone, shipping_address, shipping_province, shipping_district, shipping_ward, notes, subtotal, discount_amount, shipping_fee, total_amount, payment_method, payment_status, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [order_code, userId, customer_name, customer_email, customer_phone, shipping_address, shipping_province, shipping_district, shipping_ward, notes || '', subtotal, discount_amount, shipping_fee, total_amount, payment_method || 'COD', payment_method === 'BANKING' ? 'PAID' : 'UNPAID']
    );

    const orderId = (resOrder as any)[0]?.insertId || (resOrder as any).insertId;

    for (const item of validatedItems) {
      await query(
        'INSERT INTO order_items (order_id, book_id, book_title, book_image, price, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.book_id, item.book_title, item.book_image, item.price, item.quantity, item.total_price]
      );

      // Deduct stock and increment sold_quantity
      await query(
        'UPDATE books SET stock = stock - ?, sold_quantity = sold_quantity + ? WHERE id = ?',
        [item.quantity, item.quantity, item.book_id]
      );
    }

    // Xóa giỏ hàng của đúng người vừa đặt (đăng nhập: theo user_id, khách vãng lai: theo session)
    const sessionId = (req.headers['x-session-id'] as string) || 'guest-session';
    const cart = userId
      ? await queryOne('SELECT id FROM carts WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId])
      : await queryOne('SELECT id FROM carts WHERE session_id = ? ORDER BY id DESC LIMIT 1', [sessionId]);
    if (cart) {
      await query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    }

    // Ghi nhận đã dùng mã khuyến mãi
    if (appliedPromo) {
      await query('UPDATE promotions SET times_used = times_used + 1 WHERE id = ?', [appliedPromo.id]);
    }

    res.status(201).json({
      message: 'Đặt hàng thành công',
      orderId,
      orderCode: order_code,
      totalAmount: total_amount,
      discountAmount: discount_amount
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role_name;

    let sql = 'SELECT * FROM orders';
    const params: any[] = [];

    if (role === 'CUSTOMER') {
      sql += ' WHERE user_id = ? ORDER BY id DESC';
      params.push(userId);
    } else {
      sql += ' ORDER BY id DESC';
    }

    const orders = await query(sql, params);

    for (const order of orders) {
      const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

      // Kèm tồn kho hiện tại của từng sách để nhân viên đối chiếu khi xác nhận đơn
      for (const item of items) {
        const book = await queryOne(
          'SELECT b.stock, b.status, b.deleted_at FROM books b WHERE b.id = ?',
          [item.book_id]
        );
        item.current_stock = book ? Number(book.stock) : 0;
        item.book_available = !!book && !book.deleted_at && book.status === 'ACTIVE';
      }

      order.items = items;
    }

    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getOrderById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const order = await queryOne('SELECT * FROM orders WHERE id = ? OR order_code = ?', [id, id]);

    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    order.items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Nhân viên kiểm tra thông tin đơn hàng trước khi xác nhận:
 * thông tin liên hệ, địa chỉ giao hàng và tình trạng tồn kho của từng cuốn sách.
 */
export async function getOrderVerification(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const order = await queryOne('SELECT * FROM orders WHERE id = ? OR order_code = ?', [id, id]);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

    const warnings: string[] = [];

    // 1. Kiểm tra thông tin liên hệ
    const phone = String(order.customer_phone || '').trim();
    const phoneValid = /^[0-9+\-\s().]{8,20}$/.test(phone);
    if (!phone) warnings.push('Đơn hàng thiếu số điện thoại liên hệ');
    else if (!phoneValid) warnings.push(`Số điện thoại "${phone}" không hợp lệ`);

    const email = String(order.customer_email || '').trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!email) warnings.push('Đơn hàng thiếu email liên hệ');
    else if (!emailValid) warnings.push(`Email "${email}" không hợp lệ`);

    // 2. Kiểm tra địa chỉ giao hàng
    const addressParts = [
      order.shipping_address,
      order.shipping_ward,
      order.shipping_district,
      order.shipping_province
    ].map((p: any) => String(p || '').trim());
    const addressValid = addressParts.every((p) => p.length > 0);
    if (!addressValid) warnings.push('Địa chỉ giao hàng chưa đầy đủ (thiếu địa chỉ / phường / quận / tỉnh)');

    // 3. Kiểm tra tồn kho từng cuốn sách
    const checkedItems: any[] = [];
    let hasStockProblem = false;

    for (const item of items) {
      const book = await queryOne(
        'SELECT b.id, b.title, b.stock, b.status, b.deleted_at FROM books b WHERE b.id = ?',
        [item.book_id]
      );

      const available = !!book && !book.deleted_at && book.status === 'ACTIVE';
      const currentStock = book ? Number(book.stock) : 0;

      if (!available) {
        hasStockProblem = true;
        warnings.push(`Sách "${item.book_title}" đã ngừng bán, không thể giao cho khách`);
      }

      checkedItems.push({
        ...item,
        current_stock: currentStock,
        book_available: available
      });
    }

    res.json({
      order: { ...order, items: checkedItems },
      checks: {
        phone_valid: phoneValid,
        email_valid: emailValid,
        address_valid: addressValid,
        stock_ok: !hasStockProblem,
        can_confirm: !hasStockProblem && order.order_status === 'PENDING',
        item_count: checkedItems.length,
        total_quantity: checkedItems.reduce((sum, i) => sum + Number(i.quantity || 0), 0)
      },
      warnings
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Xác nhận đơn hàng: PENDING -> CONFIRMED.
 * Chỉ cho phép khi đã kiểm tra và không còn sách nào ngừng bán.
 */
export async function confirmOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const order = await queryOne('SELECT * FROM orders WHERE id = ? OR order_code = ?', [id, id]);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (order.order_status === 'CONFIRMED') {
      return res.json({
        message: `Đơn hàng #${order.order_code} đã ở trạng thái "Đã xác nhận"`,
        already_confirmed: true,
        order_status: 'CONFIRMED'
      });
    }

    if (order.order_status !== 'PENDING') {
      return res.status(400).json({
        message: `Chỉ có thể xác nhận đơn hàng đang ở trạng thái "Chờ xác nhận". Đơn này đang ở trạng thái "${translateStatus(order.order_status)}"`
      });
    }

    // Kiểm tra lại tồn kho trước khi xác nhận
    const items = await query('SELECT book_id, book_title, quantity FROM order_items WHERE order_id = ?', [order.id]);
    for (const item of items) {
      const book = await queryOne('SELECT b.id, b.stock, b.status, b.deleted_at FROM books b WHERE b.id = ?', [item.book_id]);
      if (!book || book.deleted_at || book.status !== 'ACTIVE') {
        return res.status(400).json({
          message: `Không thể xác nhận: sách "${item.book_title}" đã ngừng bán. Vui lòng liên hệ khách hàng để hủy hoặc đổi sách.`
        });
      }
    }

    await query(
      'UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['CONFIRMED', order.id]
    );

    res.json({
      message: `Đã xác nhận đơn hàng #${order.order_code}. Sẵn sàng chuyển sang bước đóng gói.`,
      already_confirmed: false,
      order_status: 'CONFIRMED'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

/** Nhãn tiếng Việt của trạng thái đơn hàng */
function translateStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang đóng gói',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Đã giao thành công',
    CANCELLED: 'Đã hủy'
  };
  return map[status] || status;
}

/** Các trạng thái được phép hủy đơn (chưa giao thành công, chưa hủy) */
const CANCELLABLE_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPING', 'PENDING'];

/**
 * Hủy đơn hàng: bắt buộc nhập lý do, chuyển trạng thái sang "Đã hủy"
 * và hoàn lại số lượng tồn kho cho tất cả sách trong đơn.
 */
export async function cancelOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    if (!trimmedReason) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do hủy đơn hàng' });
    }
    if (trimmedReason.length < 5) {
      return res.status(400).json({ message: 'Lý do hủy đơn tối thiểu 5 ký tự' });
    }
    if (trimmedReason.length > 500) {
      return res.status(400).json({ message: 'Lý do hủy đơn tối đa 500 ký tự' });
    }

    const order = await queryOne('SELECT * FROM orders WHERE id = ? OR order_code = ?', [id, id]);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    // Đã hủy rồi thì không hoàn kho lần nữa
    if (order.order_status === 'CANCELLED') {
      return res.status(400).json({
        message: `Đơn hàng #${order.order_code} đã được hủy trước đó${order.cancel_reason ? ` (Lý do: ${order.cancel_reason})` : ''}`
      });
    }

    if (!CANCELLABLE_STATUSES.includes(order.order_status)) {
      const why = order.order_status === 'DELIVERED'
        ? 'Đơn đã giao thành công cho khách, không thể hủy. Hãy xử lý theo quy trình trả hàng.'
        : `Đơn đang ở trạng thái "${translateStatus(order.order_status)}" nên không thể hủy`;
      return res.status(400).json({ message: why });
    }

    const items = await query('SELECT book_id, book_title, quantity FROM order_items WHERE order_id = ?', [order.id]);
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Đơn hàng không có sách nào để hoàn kho' });
    }

    // Lưu lại tồn kho trước khi hoàn, để trả về cho giao diện đối chiếu
    const restored: any[] = [];

    for (const item of items) {
      const book = await queryOne('SELECT b.id, b.title, b.stock FROM books b WHERE b.id = ?', [item.book_id]);
      if (!book) continue;

      const before = Number(book.stock || 0);
      const qty = Number(item.quantity || 0);

      await query(
        'UPDATE books SET stock = stock + ?, sold_quantity = GREATEST(0, sold_quantity - ?) WHERE id = ?',
        [qty, qty, item.book_id]
      );

      restored.push({
        book_id: book.id,
        book_title: book.title,
        quantity: qty,
        stock_before: before,
        stock_after: before + qty
      });
    }

    // Đơn đã thanh toán trước đó thì chuyển sang trạng thái cần hoàn tiền
    const shouldRefund = order.payment_status === 'PAID';
    const newPaymentStatus = shouldRefund ? 'REFUNDED' : order.payment_status;

    await query(
      'UPDATE orders SET order_status = ?, payment_status = ?, cancel_reason = ?, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['CANCELLED', newPaymentStatus, trimmedReason, order.id]
    );

    const totalRestored = restored.reduce((sum, r) => sum + r.quantity, 0);

    res.json({
      message: `Đã hủy đơn hàng #${order.order_code} và hoàn lại ${totalRestored} cuốn sách vào kho`,
      order_status: 'CANCELLED',
      cancel_reason: trimmedReason,
      refunded: shouldRefund,
      restored_items: restored,
      total_restored: totalRestored
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
    if (order_status && !validStatuses.includes(order_status)) {
      return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
    }

    // Hủy đơn phải đi qua PUT /orders/:id/cancel để bắt buộc có lý do và hoàn kho đúng 1 lần
    if (order_status === 'CANCELLED') {
      return res.status(400).json({
        message: 'Vui lòng dùng chức năng "Hủy đơn hàng" và nhập lý do hủy để hệ thống hoàn lại tồn kho'
      });
    }

    const currentOrder = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
    if (!currentOrder) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });

    if (currentOrder.order_status === 'CANCELLED') {
      return res.status(400).json({
        message: `Đơn hàng #${currentOrder.order_code} đã bị hủy, không thể đổi sang trạng thái khác`
      });
    }

    if (order_status === 'DELIVERED' && currentOrder.order_status !== 'SHIPPING') {
      return res.status(400).json({ message: 'Chỉ có thể xác nhận giao thành công cho đơn đang ở trạng thái "Đang giao hàng"' });
    }

    // Chỉ gửi 1 trong 2 trường cũng phải chạy: mysql2 không nhận undefined, phải dùng null
    // để COALESCE giữ nguyên giá trị cũ.
    await query(
      'UPDATE orders SET order_status = COALESCE(?, order_status), payment_status = COALESCE(?, payment_status), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [order_status ?? null, payment_status ?? null, id]
    );

    res.json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
