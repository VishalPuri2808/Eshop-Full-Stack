import { Router } from 'express';
import { setAuthCookie, signToken, requireAuth, AuthRequest } from '../auth';
import { User } from '../types';
import { findUserByEmail, registerUser } from '../excelDb';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, name, country, phone, shippingAddress, shippingCity, shippingCountry, billingAddress, billingCity, billingCountry, cardNumber, cardType } = req.body;
  if (!email || !name || !country) {
    return res.status(400).json({ message: 'email, name, and country are required' });
  }
  const existing = findUserByEmail(email);
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const created = registerUser({
    email,
    name,
    country,
    phone,
    shippingAddress,
    shippingCity,
    shippingCountry,
    billingAddress,
    billingCity,
    billingCountry,
    cardNumber,
    cardType
  });
  if (!created) return res.status(500).json({ message: 'User creation failed' });

  const token = signToken({ userId: created.id, isAdmin: !!created.isAdmin });
  setAuthCookie(res, token);
  return res.json({ user: created });
});

router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const user = findUserByEmail(email);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const token = signToken({ userId: user.id, isAdmin: !!user.isAdmin });
  setAuthCookie(res, token);
  return res.json({ user });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('eshop_token');
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

export default router;
