"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../auth");
const excelDb_1 = require("../excelDb");
const router = (0, express_1.Router)();
router.get('/orders', auth_1.requireAdmin, async (_req, res) => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const orders = (0, excelDb_1.listAllOrders)().filter(o => {
        if (o.status === 'complete')
            return false;
        const created = new Date(o.createdAt);
        if (Number.isNaN(created.getTime()))
            return false;
        return created.getMonth() === month && created.getFullYear() === year;
    });
    return res.json({ orders });
});
router.post('/orders/:id/complete', auth_1.requireAdmin, async (req, res) => {
    const orderId = Number(req.params.id);
    const ok = (0, excelDb_1.markOrderComplete)(orderId);
    if (!ok)
        return res.status(404).json({ message: 'Order not found' });
    return res.json({ message: 'Marked complete' });
});
exports.default = router;
