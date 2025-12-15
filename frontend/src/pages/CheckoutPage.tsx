import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkout, deleteCartItem, fetchCart, updateCartItem } from '../api';
import { CartItemDto } from '../types';

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItemDto[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingCountry, setShippingCountry] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState('VISA');
  const [deliveryCharge] = useState(() => {
    const val = 7 + Math.random() * 8;
    return Math.round(val * 100) / 100;
  });
  const navigate = useNavigate();

  const load = () => fetchCart().then(setItems);
  useEffect(() => { load(); }, []);

  const onQtyChange = async (id: number, quantity: number) => {
    await updateCartItem(id, quantity);
    load();
  };

  const onDelete = async (id: number) => {
    await deleteCartItem(id);
    load();
  };

  const onCheckout = async () => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length !== 15) {
      alert('Card number must be exactly 15 digits.');
      return;
    }
    const res = await checkout({
      shippingAddress,
      shippingCity,
      shippingCountry,
      billingAddress,
      billingCity,
      billingCountry,
      phone,
      cardNumber,
      cardType,
      deliveryCharge
    });
    alert(`Order placed with tracking ${res.trackingNumber}`);
    navigate(`/orders/${res.orderId}`);
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.07 * 100) / 100;
  const total = subtotal + tax + deliveryCharge;

  if (!items.length) {
    return (
      <div className="card">
        <h2>Checkout</h2>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Checkout</h2>
      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div>{item.name}</div>
            <div>${item.price.toFixed(2)}</div>
          </div>
          <input
            className="input"
            style={{ width: 80 }}
            type="number"
            min={1}
            value={item.quantity}
            onChange={e => onQtyChange(item.id, Number(e.target.value))}
          />
          <button className="button" onClick={() => onDelete(item.id)}>Remove</button>
        </div>
      ))}
      <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="muted">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="muted">Tax (7%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="muted">Delivery</span>
          <span>${deliveryCharge.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
      <div className="muted" style={{ marginTop: 12 }}>Shipping</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 240, color: '#0f172a', background: '#e8edf6', fontWeight: 600 }} placeholder="Address" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />
        <input className="input" style={{ width: 200, color: '#0f172a', background: '#e8edf6', fontWeight: 600 }} placeholder="City" value={shippingCity} onChange={e => setShippingCity(e.target.value)} />
        <input className="input" style={{ width: 120, color: '#0f172a', background: '#e8edf6', fontWeight: 600 }} placeholder="Country" value={shippingCountry} onChange={e => setShippingCountry(e.target.value)} />
      </div>

      <div className="muted" style={{ marginTop: 12 }}>Billing</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 240, color: '#0f172a', background: '#e8edf6', fontWeight: 600}} placeholder="Address" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} />
        <input className="input" style={{ width: 200, color: '#0f172a', background: '#e8edf6', fontWeight: 600}} placeholder="City" value={billingCity} onChange={e => setBillingCity(e.target.value)} />
        <input className="input" style={{ width: 120, color: '#0f172a', background: '#e8edf6', fontWeight: 600}} placeholder="Country" value={billingCountry} onChange={e => setBillingCountry(e.target.value)} />
      </div>

      <div className="muted" style={{ marginTop: 12 }}>Payment</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 180, color: '#0f172a', background: '#e8edf6', fontWeight: 600 }} value={cardType} onChange={e => setCardType(e.target.value)}>
          <option style={{ color: '#0f172a' }} value="Amex">Amex</option>
          <option style={{ color: '#0f172a' }} value="VISA">VISA</option>
          <option style={{ color: '#0f172a' }} value="Master">Master</option>
          <option style={{ color: '#0f172a' }} value="Other">Other</option>
        </select>
        <input
          className="input"
          style={{ flex: 1, minWidth: 260, color: '#0f172a', background: '#e8edf6', fontWeight: 600 }}
          placeholder="Enter 15-Digit Card Number"
          value={cardNumber}
          onChange={e => setCardNumber(e.target.value)}
        />
        <input
          className="input"
          style={{ width: 200, color: '#0f172a', background: '#e8edf6', fontWeight: 600 }}
          placeholder="Phone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      </div>
      <button className="button" onClick={onCheckout} disabled={!items.length} style={{ marginTop: 8 }}>Place Order</button>
    </div>
  );
}
