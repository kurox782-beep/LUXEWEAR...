export interface ProductImage {
  id?: number;
  product_id?: number;
  image_url: string;
  is_main: number | boolean;
  display_order: number;
}

export interface ProductVariant {
  id?: number;
  product_id?: number;
  size: string;
  color: string;
  stock: number;
  sku?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category_id: number | null;
  category_name?: string;
  category_slug?: string;
  description: string;
  materials?: string;
  care_instructions?: string;
  price: number;
  sale_price: number | null;
  sku?: string;
  stock: number;
  is_featured: number;
  is_new_arrival: number;
  is_best_seller: number;
  is_active: number;
  is_seed?: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  is_active: number;
  product_count?: number;
}

export interface Review {
  id: number;
  product_id: number;
  product_name?: string;
  product_slug?: string;
  product_image?: string;
  user_name: string;
  user_email?: string;
  rating: number;
  comment: string;
  image_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface RatingStats {
  totalReviews: number;
  averageRating: string;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface CartItem {
  id: string; // composite key: `${productId}-${size}-${color}`
  productId: number;
  name: string;
  slug: string;
  image: string;
  price: number; // locked unit price
  originalPrice: number;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  product_slug: string;
  size: string;
  color: string;
  quantity: number;
  price_at_purchase: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discount: number;
  coupon_code?: string;
  total: number;
  status: 'WHATSAPP_PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  whatsapp_opened: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  is_active: number;
  usage_count: number;
  expires_at?: string;
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingReviews: number;
  productViews: number;
  addToCartEvents: number;
  checkoutEvents: number;
  recentOrders: Order[];
}

export interface AdminAuditLog {
  id: number;
  admin_id: number;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}
