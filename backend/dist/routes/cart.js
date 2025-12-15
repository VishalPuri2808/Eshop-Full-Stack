"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../auth");
const excelDb_1 = require("../excelDb");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.id;
    const cart = (0, excelDb_1.getCart)(userId);
    const items = cart.map((item, idx) => {
        const prod = (0, excelDb_1.getProduct)(item.productId);
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
router.post('/', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const qty = Number(quantity || 1);
    if (!productId || qty <= 0)
        return res.status(400).json({ message: 'productId and positive quantity required' });
    const product = (0, excelDb_1.getProduct)(productId);
    if (!product)
        return res.status(404).json({ message: 'Product not found' });
    (0, excelDb_1.addToCart)(userId, productId, qty);
    return res.json({ message: 'Added to cart' });
});
router.put('/:id', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.id;
    const id = Number(req.params.id);
    const qty = Number(req.body.quantity);
    if (qty <= 0)
        return res.status(400).json({ message: 'Quantity must be positive' });
    const cart = (0, excelDb_1.getCart)(userId);
    if (!cart[id])
        return res.status(404).json({ message: 'Cart item not found' });
    (0, excelDb_1.updateCartItem)(userId, id, qty);
    return res.json({ message: 'Updated' });
});
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.id;
    const id = Number(req.params.id);
    (0, excelDb_1.deleteCartItem)(userId, id);
    return res.json({ message: 'Removed' });
});
exports.default = router;
