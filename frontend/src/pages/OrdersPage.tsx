import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../api';
import { OrderDto } from '../types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  useEffect(() => {
    fetchOrders().then(setOrders);
  }, []);

  return (
    <div className="card">
      <h2>My Orders</h2>
      {!orders.length && <p>No orders yet.</p>}
      <ul>
        {orders.map(o => (
          <li key={o.id} style={{ marginBottom: 8 }}>
            <Link to={`/orders/${o.id}`}>Order #{o.id}</Link> — {o.status} — ${o.total.toFixed(2)} — {new Date(o.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
