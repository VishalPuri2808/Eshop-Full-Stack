import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addToCart, fetchProduct } from '../api';
import { Product } from '../types';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!id) return;
    fetchProduct(Number(id)).then(setProduct).catch(() => setProduct(null));
  }, [id]);

  if (!product) return <div>Loading...</div>;

  const add = async () => {
    await addToCart(product.id, qty);
    alert('Added to cart');
  };

  return (
    <div className="card">
      <h2>{product.name}</h2>
      <p className="muted" style={{ marginTop: 4 }}>{product.description}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
        <span className="chip" style={{ fontSize: 16 }}>${product.price.toFixed(2)}</span>
        <span className="muted">Est. Delivery: {product.estimatedDelivery || '7-12 days'}</span>
      </div>
      <label>
        Quantity
        <input className="input" type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} />
      </label>
      <button className="button" onClick={add} style={{ marginTop: 8 }}>Add to cart</button>
    </div>
  );
}
