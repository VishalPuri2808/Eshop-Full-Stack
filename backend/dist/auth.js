"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.setAuthCookie = setAuthCookie;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const excelDb_1 = require("./excelDb");
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const COOKIE_NAME = 'eshop_token';
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
function setAuthCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax'
    });
}
async function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.[COOKIE_NAME];
        if (!token)
            return res.status(401).json({ message: 'Not authenticated' });
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        let user;
        if (decoded.email) {
            user = (0, excelDb_1.findUserByEmail)(decoded.email);
        }
        else {
            user = (0, excelDb_1.listUsers)().find(u => u.id === decoded.userId);
        }
        if (!user)
            return res.status(401).json({ message: 'User not found' });
        req.user = user;
        return next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}
async function requireAdmin(req, res, next) {
    await requireAuth(req, res, async () => {
        if (!req.user?.isAdmin)
            return res.status(403).json({ message: 'Admin only' });
        return next();
    });
}
