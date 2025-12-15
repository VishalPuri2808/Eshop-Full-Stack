import { Router } from 'express';
import { Product } from '../types';
import { requireAuth, AuthRequest } from '../auth';
import { listProducts, getProduct } from '../excelDb';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const search = String(req.query.search || '').trim();
  const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
  const pageSize = 25; // enforced limit
  const offset = (page - 1) * pageSize;
  const params: unknown[] = [];
  let where = '';
  if (search) {
    where = 'WHERE name LIKE ?';
    params.push(`%${search}%`);
  }
  params.push(pageSize, offset);

  let items = listProducts();
  if (search) {
    items = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }
  const userCountry = req.user?.country;
  items = items.map(p => ({
    ...p,
    estimatedDelivery: computeEstimate(p, userCountry)
  }));
  const total = items.length;
  items = items.slice(offset, offset + pageSize);
  return res.json({ items, total, page, pageSize });
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const productId = Number(req.params.id);
  const product = getProduct(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const userCountry = req.user?.country;
  return res.json({ product: { ...product, estimatedDelivery: computeEstimate(product, userCountry) } });
});

function computeEstimate(p: Product, userCountry?: string) {
  const days = p.leadTimeDays && p.leadTimeDays > 0 ? Math.round(p.leadTimeDays) : 9;
  const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return target.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default router;
