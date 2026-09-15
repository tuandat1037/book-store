/**
 * Ngưỡng cảnh báo tồn kho dùng chung cho Dashboard và Quản Lý Kho.
 * Còn ≤ ngưỡng  -> "sắp hết"
 * Bằng 0 cuốn   -> "hết hàng"
 * Lớn hơn ngưỡng -> "còn hàng"
 */
export const LOW_STOCK_THRESHOLD = 100;

/** Trạng thái kho của một cuốn sách */
export type StockStatus = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';

export function getStockStatus(stock: number, threshold: number = LOW_STOCK_THRESHOLD): StockStatus {
  const value = Number(stock) || 0;
  if (value <= 0) return 'OUT_OF_STOCK';
  if (value <= threshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}
