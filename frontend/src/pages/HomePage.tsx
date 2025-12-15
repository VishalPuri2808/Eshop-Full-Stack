import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addToCart, fetchProducts } from '../api';
import { Product } from '../types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  useEffect(() => {
    fetchProducts({ search, page }).then(res => {
      setProducts(res.items);
      setTotal(res.total);
    });
  }, [search, page]);

  const onAdd = async (id: number) => {
    await addToCart(id, 1);
    alert('Added to cart');
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="panel toolbar">
        <div style={{ flex: 1 }}>
          <input
            className="input"
            placeholder="Search products"
            value={search}
            onChange={e => { setPage(1); setSearch(e.target.value); }}
          />
        </div>
        <div className="pill">{total} products</div>
      </div>
      <div className="grid">
        {products.map(p => (
          <div className="card product-card" key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>{p.name}</h3>
              <span className="chip">${p.price.toFixed(2)}</span>
            </div>
            <div className="product-meta" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              <span className="muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <strong style={{ color: '#e2e8f0' }}>Est. Delivery</strong>
                <span>{p.estimatedDelivery || '7-12 days'}</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Link to={`/products/${p.id}`} className="button" style={{ textAlign: 'center', flex: 1 }}>Details</Link>
              <button className="button ghost" onClick={() => onAdd(p.id)}>Add</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="button ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
        <span className="muted">Page {page} / {totalPages}</span>
        <button className="button ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}
