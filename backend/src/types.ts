export interface User {
  id: number;
  email: string;
  name: string;
  country: string;
  isAdmin: number; // 1 for admin, 0 for regular
  createdAt: string;
  phone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  billingAddress?: string;
  billingCity?: string;
  billingCountry?: string;
  cardNumber?: string;
  cardType?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  country?: string;
  shippedFrom?: string;
  estimatedDelivery?: string;
  leadTimeDays?: number;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  userName?: string;
  status: string;
  total: number;
  trackingNumber: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
}
