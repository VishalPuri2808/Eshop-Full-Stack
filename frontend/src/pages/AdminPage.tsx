import { useEffect, useState } from 'react';
import { completeOrder, fetchAdminOrders } from '../api';
import { OrderDto } from '../types';

export default function AdminPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  const load = () => fetchAdminOrders().then(os => {
    setOrders(os);
    if (selectedOrder) {
      const updated = os.find(o => o.id === selectedOrder.id);
      setSelectedOrder(updated || null);
    }
  });
  useEffect(() => {
    setLoading(true);
    setError('');
    load()
      .catch(err => setError(err?.response?.data?.message || 'Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const markComplete = async (id: number) => {
    await completeOrder(id);
    setLoading(true);
    await load().finally(() => setLoading(false));
  };

  return (
    <div className="card">
      <h2>Admin Orders</h2>
      {error && <p style={{ color: '#fca5a5' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <button className="button ghost" onClick={() => { setLoading(true); setError(''); load().finally(() => setLoading(false)); }}>Refresh</button>
        {loading && <span className="muted">Loading…</span>}
      </div>
      {!orders.length && <p>No pending orders.</p>}
      <table className="table">
        <thead>
          <tr><th>ID</th><th>User</th><th>Total</th><th>Status</th><th>Placed</th><th>Action</th></tr>
        </thead>
        <tbody>
          {orders.filter(o => o.status !== 'complete').map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{(o.userName || '').split(' ')[0] || o.userId}</td>
              <td>${o.total.toFixed(2)}</td>
              <td>{o.status}</td>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
              <td><button className="button" onClick={() => setSelectedOrder(o)}>View details</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div style={{ marginTop: 24 }} className="card">
          <h3>Order #{selectedOrder.id}</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
            <div><strong>User:</strong> {selectedOrder.userId}</div>
            <div><strong>Status:</strong> {selectedOrder.status}</div>
            <div><strong>Total:</strong> ${selectedOrder.total.toFixed(2)}</div>
            <div><strong>Placed:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
            <div><strong>Tracking:</strong> {selectedOrder.trackingNumber}</div>
          </div>
          <button className="button" disabled={loading} onClick={() => markComplete(selectedOrder.id)}>
            {loading ? 'Updating…' : 'Mark complete'}
          </button>
          <h4 style={{ marginTop: 12 }}>Items</h4>
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Qty</th><th>Price</th></tr>
            </thead>
            <tbody>
              {selectedOrder.items?.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
