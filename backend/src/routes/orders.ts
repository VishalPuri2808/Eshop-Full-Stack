import { Router } from 'express';
import { AuthRequest, requireAuth } from '../auth';
import { placeOrder, listOrders, markOrderReceived } from '../excelDb';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const orders = listOrders(req.user!);
  return res.json({ orders });
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const orderId = Number(req.params.id);
  const userId = req.user!.id;
  const orders = listOrders(req.user!);
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId !== userId && !req.user!.isAdmin) return res.status(403).json({ message: 'Forbidden' });
  return res.json({ order });
});

router.post('/:id/received', requireAuth, async (req: AuthRequest, res) => {
  const orderId = Number(req.params.id);
  const ok = markOrderReceived(orderId, req.user!);
  if (!ok) return res.status(404).json({ message: 'Order not found' });
  return res.json({ message: 'Marked received' });
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { shippingAddress, shippingCity, shippingCountry, billingAddress, billingCity, billingCountry, phone, cardNumber, cardType, deliveryCharge } = req.body || {};
    const { orderId, tracking, rows } = placeOrder(req.user!, {
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
    return res.json({
      orderId,
      trackingNumber: tracking,
      rows // full dataset-shaped rows that were appended
    });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message || 'Unable to place order' });
  }
});

export default router;
