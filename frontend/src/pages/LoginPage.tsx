import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('US');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingCountry, setShippingCountry] = useState('US');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(email);
      } else {
        await register({
          email,
          name,
          country,
          phone,
          shippingAddress,
          shippingCity,
          shippingCountry
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to authenticate');
    }
  };

  return (
    <div className="app-main" style={{ maxWidth: 440 }}>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <div className="pill" style={{ marginBottom: 8 }}>{mode === 'login' ? 'Welcome back' : 'Join the shop'}</div>
          <h1 style={{ margin: 0 }}>{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
        </div>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="muted">Email</span>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          {mode === 'register' && (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="muted">Name</span>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="muted">Country (2 letters)</span>
                <input className="input" value={country} onChange={e => setCountry(e.target.value)} required maxLength={2} />
              </label>
              <div className="muted" style={{ marginTop: 4 }}>Shipping</div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="muted">Address</span>
                <input className="input" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="muted">City</span>
                  <input className="input" value={shippingCity} onChange={e => setShippingCity(e.target.value)} />
                </label>
                <label style={{ width: 96, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="muted">Country</span>
                  <input className="input" value={shippingCountry} onChange={e => setShippingCountry(e.target.value)} maxLength={2} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="muted">Phone</span>
                  <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                </label>
              </div>
            </>
          )}
          {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
          <button className="button" type="submit">{mode === 'login' ? 'Continue' : 'Create account'}</button>
          <button type="button" className="link-btn" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
