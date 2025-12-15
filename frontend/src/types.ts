export interface User {
  id: number;
  email: string;
  name: string;
  country: string;
  isAdmin: number;
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

export interface CartItemDto {
  id: number;
  productId: number;
  quantity: number;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface OrderItemDto {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  name: string;
}

export interface OrderDto {
  id: number;
  userId: number;
  userName?: string;
  status: string;
  total: number;
  trackingNumber: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItemDto[];
}

