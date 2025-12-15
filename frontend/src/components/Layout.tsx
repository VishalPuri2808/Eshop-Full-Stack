import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '';
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo"><Link to="/">E-Shop</Link></div>
        {user && (
          <nav>
            <Link to="/">Home</Link>
            <Link to="/checkout">Cart/Checkout</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/me">Profile</Link>
            {user.isAdmin ? <Link to="/admin">Admin</Link> : null}
          </nav>
        )}
        <div className="spacer" />
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="pill" style={{ color: '#fff' }}>
              <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: '50%', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.12)', fontWeight: 700 }}>
                {initials || 'U'}
              </span>
              <div>
                <div style={{ fontWeight: 700 }}>{user.name}</div>
                <div className="muted" style={{ lineHeight: 1 }}>{user.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="button ghost">Logout</button>
          </div>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
