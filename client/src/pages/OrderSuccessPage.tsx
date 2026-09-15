import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, Truck, FileText } from 'lucide-react';
import api from '../services/api';
import { Order } from '../types';
import { formatVND, formatDate } from '../utils/format';

export const OrderSuccessPage: React.FC = () => {
  const { orderCode } = useParams<{ orderCode: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderCode) {
      api.get(`/orders/${orderCode}`)
        .then((res) => setOrder(res.data.order))
        .catch((err) => console.error(err));
    }
  }, [orderCode]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center space-y-6 shadow-sm">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-green-600 tracking-wider">Đặt Hàng Thành Công!</span>
          <h1 className="text-2xl font-black text-gray-900">Cảm ơn bạn đã tin tưởng NXB Kim Đồng</h1>
          <p className="text-xs text-gray-500">
            Mã đơn hàng của bạn là: <span className="font-bold text-kimdong-red">{orderCode}</span>
          </p>
        </div>

        {order && (
          <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 border border-gray-100 text-xs">
            <div className="flex justify-between border-b border-gray-200 pb-3">
              <span className="text-gray-500">Khách hàng:</span>
              <span className="font-bold text-gray-800">{order.customer_name}</span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-3">
              <span className="text-gray-500">Địa chỉ giao hàng:</span>
              <span className="font-bold text-gray-800 text-right">{order.shipping_address}, {order.shipping_province}</span>
            </div>

            <div className="flex justify-between border-b border-gray-200 pb-3">
              <span className="text-gray-500">Hình thức thanh toán:</span>
              <span className="font-bold text-gray-800">{order.payment_method === 'COD' ? 'Thanh toán COD' : 'Chuyển khoản VietQR'}</span>
            </div>

            <div className="flex justify-between text-sm pt-1">
              <span className="font-bold text-gray-800">Tổng tiền thanh toán:</span>
              <span className="font-black text-kimdong-red text-base">{formatVND(order.total_amount)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/account"
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs px-6 py-3 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Xem lịch sử đơn hàng</span>
          </Link>

          <Link
            to="/books"
            className="w-full sm:w-auto bg-kimdong-red hover:bg-kimdong-darkred text-white font-extrabold text-xs px-8 py-3 rounded-md shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Tiếp tục mua sắm</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};
