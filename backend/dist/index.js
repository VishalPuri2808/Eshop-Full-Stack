"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const cart_1 = __importDefault(require("./routes/cart"));
const orders_1 = __importDefault(require("./routes/orders"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const FRONTEND_DIST = path_1.default.resolve(__dirname, '..', 'frontend-dist');
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/cart', cart_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/admin', admin_1.default);
// Serve built frontend if present
app.use(express_1.default.static(FRONTEND_DIST));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/'))
        return next();
    const indexPath = path_1.default.join(FRONTEND_DIST, 'index.html');
    res.sendFile(indexPath, err => {
        if (err)
            next();
    });
});
async function start() {
    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
}
start().catch(err => {
    console.error('Failed to start server', err);
    process.exit(1);
});
