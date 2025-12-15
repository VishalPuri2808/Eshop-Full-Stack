"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../auth");
const excelDb_1 = require("../excelDb");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.id;
    const orders = (0, excelDb_1.listOrders)(req.user);
    return res.json({ orders });
});
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    const orderId = Number(req.params.id);
    const userId = req.user.id;
    const orders = (0, excelDb_1.listOrders)(req.user);
    const order = orders.find(o => o.id === orderId);
    if (!order)
        return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== userId && !req.user.isAdmin)
        return res.status(403).json({ message: 'Forbidden' });
    return res.json({ order });
});
router.post('/:id/received', auth_1.requireAuth, async (req, res) => {
    const orderId = Number(req.params.id);
    const ok = (0, excelDb_1.markOrderReceived)(orderId, req.user);
    if (!ok)
        return res.status(404).json({ message: 'Order not found' });
    return res.json({ message: 'Marked received' });
});
router.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { shippingAddress, shippingCity, shippingCountry, billingAddress, billingCity, billingCountry, phone, cardNumber, cardType, deliveryCharge } = req.body || {};
        const { orderId, tracking, rows } = (0, excelDb_1.placeOrder)(req.user, {
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
    }
    catch (err) {
        return res.status(400).json({ message: err?.message || 'Unable to place order' });
    }
});
exports.default = router;
