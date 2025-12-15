import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchOrders } from '../api';
import { OrderDto } from '../types';

export default function UserPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);

  useEffect(() => {
    fetchOrders().then(setOrders);
  }, []);

  const summary = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="card">
      <h2>User Profile</h2>
      <div>Name: {user?.name}</div>
      <div>Email: {user?.email}</div>
      <div>Country: {user?.country}</div>
      <div>Role: {user?.isAdmin ? 'Admin' : 'User'}</div>
      <h3>Order Summary</h3>
      {!orders.length && <p>No orders yet.</p>}
      {Object.entries(summary).map(([status, count]) => (
        <div key={status}>{status}: {count}</div>
      ))}
    </div>
  );
}
