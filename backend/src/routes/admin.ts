import { Router } from 'express';
import { requireAdmin, AuthRequest } from '../auth';
import { listAllOrders, markOrderComplete } from '../excelDb';

const router = Router();

router.get('/orders', requireAdmin, async (_req: AuthRequest, res) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const orders = listAllOrders().filter(o => {
    if (o.status === 'complete') return false;
    const created = new Date(o.createdAt);
    if (Number.isNaN(created.getTime())) return false;
    return created.getMonth() === month && created.getFullYear() === year;
  });
  return res.json({ orders });
});

router.post('/orders/:id/complete', requireAdmin, async (req: AuthRequest, res) => {
  const orderId = Number(req.params.id);
  const ok = markOrderComplete(orderId);
  if (!ok) return res.status(404).json({ message: 'Order not found' });
  return res.json({ message: 'Marked complete' });
});

export default router;
