export interface Book {
  id: number;
  category_id: number;
  author_id: number;
  publisher_id: number;
  title: string;
  slug: string;
  import_price: number;
  price: number;
  sale_price?: number;
  stock: number;
  sold_quantity: number;
  publication_year: number;
  num_pages: number;
  cover_type: string;
  dimensions: string;
  weight: number;
  description: string;
  is_featured: boolean | number;
  is_new: boolean | number;
  is_bestseller: boolean | number;
  status: string;
  cover_image?: string;
  author_name?: string;
  category_name?: string;
  publisher_name?: string;
  rating_avg?: number;
  review_count?: number;
}

export interface Category {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  display_order?: number;
  book_count?: number;
  children?: Category[];
}

export interface Author {
  id: number;
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
  book_count?: number;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  phone?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  avatar?: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  book_id: number;
  quantity: number;
  title: string;
  slug: string;
  price: number;
  sale_price?: number;
  stock: number;
  cover_image?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  book_id: number;
  book_title: string;
  book_image?: string;
  price: number;
  quantity: number;
  total_price: number;
  current_stock?: number;
  book_available?: boolean;
}

export interface Order {
  id: number;
  order_code: string;
  user_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_province: string;
  shipping_district: string;
  shipping_ward: string;
  notes?: string;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: 'COD' | 'BANKING' | 'MOMO';
  payment_status: 'UNPAID' | 'PAID' | 'REFUNDED';
  order_status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  items?: OrderItem[];
}

export interface Review {
  id: number;
  book_id: number;
  user_id: number;
  user_name?: string;
  rating: number;
  comment?: string;
  is_verified_purchase?: number;
  created_at: string;
}

/** Sách đã mua với đơn hoàn thành — dùng cho nút "Đánh giá" ở Đơn hàng của tôi */
export interface ReviewableBook {
  book_id: number;
  book_title: string;
  book_image?: string;
  book_slug?: string;
  order_code: string;
  purchased_at: string;
  has_reviewed: boolean;
  my_rating: number | null;
}

export interface ManagedUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  role_id: number;
  role_name?: string;
  created_at?: string;
}

export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  avatar?: string;
  role_id: number;
  role_name?: string;
  created_at?: string;
  // Thống kê mua hàng
  order_count?: number;
  cancelled_count?: number;
  total_spent?: number;
  last_order_at?: string | null;
}

export interface Promotion {
  id?: number;
  code: string;
  title: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  min_order_value?: number | null;
  max_discount?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  times_used?: number;
  is_active?: number | boolean;
  created_at?: string;
}

export interface Banner {
  id?: number;
  title: string;
  subtitle?: string;
  badge?: string;
  cta_text?: string;
  cta_link: string;
  theme?: string;
  image_url?: string;
  display_order?: number;
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
}
