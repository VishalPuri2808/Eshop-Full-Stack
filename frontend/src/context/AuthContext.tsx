import { createContext, useContext, useEffect, useState } from 'react';
import { fetchMe, login as loginApi, logout as logoutApi, registerUser } from '../api';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  register: (input: { email: string; name: string; country: string; phone?: string; shippingAddress?: string; shippingCity?: string; shippingCountry?: string; }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string) => {
    const u = await loginApi(email);
    setUser(u);
  };

  const register = async (input: { email: string; name: string; country: string; phone?: string; shippingAddress?: string; shippingCity?: string; shippingCountry?: string; }) => {
    const u = await registerUser(input);
    setUser(u);
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
