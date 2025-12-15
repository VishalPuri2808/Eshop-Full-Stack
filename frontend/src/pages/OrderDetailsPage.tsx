import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchOrder, markOrderReceived } from '../api';
import { OrderDto } from '../types';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchOrder(Number(id)).then(setOrder);
  }, [id]);

  if (!order) return <div>Loading...</div>;

  const onReceived = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      await markOrderReceived(Number(id));
      const refreshed = await fetchOrder(Number(id));
      setOrder(refreshed);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Order #{order.id}</h2>
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      <div>Status: {order.status}</div>
      <div>Tracking: {order.trackingNumber}</div>
      <div>Country: {order.country}</div>
      <div>Placed: {new Date(order.createdAt).toLocaleString()}</div>
      {order.status !== 'complete' && (
        <button className="button" disabled={loading} onClick={onReceived} style={{ marginTop: 8 }}>
          {loading ? 'Updating…' : 'Mark as received'}
        </button>
      )}
      <h3>Items</h3>
      <table className="table">
        <thead>
          <tr><th>Name</th><th>Qty</th><th>Price</th></tr>
        </thead>
        <tbody>
          {order.items?.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>${item.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8, fontWeight: 700 }}>Total: ${order.total.toFixed(2)}</div>
    </div>
  );
}
