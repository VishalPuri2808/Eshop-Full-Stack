import { Router } from 'express';
import { AuthRequest, requireAuth } from '../auth';
import { getCart, addToCart, updateCartItem, deleteCartItem, getProduct } from '../excelDb';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const cart = getCart(userId);
  const items = cart.map((item, idx) => {
    const prod = getProduct(item.productId);
    return {
      id: idx,
      productId: item.productId,
      quantity: item.quantity,
      name: prod?.name || '',
      price: prod?.price || 0,
      imageUrl: prod?.imageUrl || ''
    };
  });
  return res.json({ items });
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { productId, quantity } = req.body;
  const qty = Number(quantity || 1);
  if (!productId || qty <= 0) return res.status(400).json({ message: 'productId and positive quantity required' });
  const product = getProduct(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  addToCart(userId, productId, qty);
  return res.json({ message: 'Added to cart' });
});

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = Number(req.params.id);
  const qty = Number(req.body.quantity);
  if (qty <= 0) return res.status(400).json({ message: 'Quantity must be positive' });
  const cart = getCart(userId);
  if (!cart[id]) return res.status(404).json({ message: 'Cart item not found' });
  updateCartItem(userId, id, qty);
  return res.json({ message: 'Updated' });
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const id = Number(req.params.id);
  deleteCartItem(userId, id);
  return res.json({ message: 'Removed' });
});

export default router;
