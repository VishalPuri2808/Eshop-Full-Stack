"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../auth");
const excelDb_1 = require("../excelDb");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    const { email, name, country, phone, shippingAddress, shippingCity, shippingCountry, billingAddress, billingCity, billingCountry, cardNumber, cardType } = req.body;
    if (!email || !name || !country) {
        return res.status(400).json({ message: 'email, name, and country are required' });
    }
    const existing = (0, excelDb_1.findUserByEmail)(email);
    if (existing)
        return res.status(400).json({ message: 'Email already registered' });
    const created = (0, excelDb_1.registerUser)({
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
    if (!created)
        return res.status(500).json({ message: 'User creation failed' });
    const token = (0, auth_1.signToken)({ userId: created.id, isAdmin: !!created.isAdmin });
    (0, auth_1.setAuthCookie)(res, token);
    return res.json({ user: created });
});
router.post('/login', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: 'Email required' });
    const user = (0, excelDb_1.findUserByEmail)(email);
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    const token = (0, auth_1.signToken)({ userId: user.id, isAdmin: !!user.isAdmin });
    (0, auth_1.setAuthCookie)(res, token);
    return res.json({ user });
});
router.post('/logout', (_req, res) => {
    res.clearCookie('eshop_token');
    res.json({ message: 'Logged out' });
});
router.get('/me', auth_1.requireAuth, async (req, res) => {
    return res.json({ user: req.user });
});
exports.default = router;
