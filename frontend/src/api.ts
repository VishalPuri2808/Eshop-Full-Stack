import axios from 'axios';
import { CartItemDto, OrderDto, Product, User } from './types';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true
});

export async function registerUser(data: { email: string; name: string; country: string; phone?: string; shippingAddress?: string; shippingCity?: string; shippingCountry?: string; }) {
  const res = await client.post<{ user: User }>('/auth/register', data);
  return res.data.user;
}

export async function login(email: string) {
  const res = await client.post<{ user: User }>('/auth/login', { email });
  return res.data.user;
}

export async function fetchMe() {
  const res = await client.get<{ user: User }>('/auth/me');
  return res.data.user;
}

export async function logout() {
  await client.post('/auth/logout');
}

export async function fetchProducts(params: { search?: string; page?: number }) {
  const res = await client.get<{ items: Product[]; total: number; page: number; pageSize: number }>('/products', { params });
  return res.data;
}

export async function fetchProduct(id: number) {
  const res = await client.get<{ product: Product }>(`/products/${id}`);
  return res.data.product;
}

export async function fetchCart() {
  const res = await client.get<{ items: CartItemDto[] }>('/cart');
  return res.data.items;
}

export async function addToCart(productId: number, quantity: number) {
  await client.post('/cart', { productId, quantity });
}

export async function updateCartItem(id: number, quantity: number) {
  await client.put(`/cart/${id}`, { quantity });
}

export async function deleteCartItem(id: number) {
  await client.delete(`/cart/${id}`);
}

export async function checkout(payload: { shippingAddress?: string; shippingCity?: string; shippingCountry?: string; billingAddress?: string; billingCity?: string; billingCountry?: string; phone?: string; cardNumber?: string; cardType?: string; deliveryCharge?: number; }) {
  const res = await client.post<{ orderId: number; trackingNumber: string; total: number }>('/orders', payload);
  return res.data;
}

export async function fetchOrders() {
  const res = await client.get<{ orders: OrderDto[] }>('/orders');
  return res.data.orders;
}

export async function fetchOrder(id: number) {
  const res = await client.get<{ order: OrderDto }>(`/orders/${id}`);
  return res.data.order;
}

export async function markOrderReceived(id: number) {
  await client.post(`/orders/${id}/received`);
}

export async function fetchAdminOrders() {
  const res = await client.get<{ orders: OrderDto[] }>('/admin/orders');
  return res.data.orders;
}

export async function completeOrder(id: number) {
  await client.post(`/admin/orders/${id}/complete`);
}

