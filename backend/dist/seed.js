"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildDbFromDataset = rebuildDbFromDataset;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xlsx_1 = __importDefault(require("xlsx"));
const db_1 = require("./db");
const utils_1 = require("./utils");
const DATASET_NAMES = ['EShop Dataset.xlsx', 'eshop_dataset.xlsx', 'dataset.xlsx'];
function datasetPath() {
    const candidates = DATASET_NAMES.flatMap(name => [
        path_1.default.resolve(process.cwd(), name),
        path_1.default.resolve(__dirname, '..', name),
        path_1.default.resolve(__dirname, '..', 'data', name)
    ]);
    const found = candidates.find(p => fs_1.default.existsSync(p));
    if (found)
        return found;
    throw new Error('EShop Dataset.xlsx not found. Place it in repo root or backend/data');
}
function parsePrice(value) {
    if (typeof value === 'number')
        return value;
    return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
}
function parseDate(value) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
async function rebuildDbFromDataset() {
    const dsPath = datasetPath();
    const wb = xlsx_1.default.readFile(dsPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx_1.default.utils.sheet_to_json(sheet, { defval: '' });
    await (0, db_1.resetSchema)();
    // Aggregate unique users, products, and orders
    const users = new Map();
    const products = new Map();
    const orders = new Map();
    for (const row of rows) {
        const email = String(row.Email || '').trim();
        const name = `${(row.FirstName || '').trim()} ${(row.LastName || '').trim()}`.trim() || 'Customer';
        const country = String(row.ShippingCountry || row.BillingCountry || 'US').trim();
        if (!users.has(email)) {
            users.set(email, {
                id: 0,
                email,
                name,
                country,
                isAdmin: 0,
                createdAt: new Date().toISOString()
            });
        }
        const productName = String(row.ItemName || 'Item').trim();
        if (!products.has(productName)) {
            products.set(productName, {
                id: products.size + 1,
                name: productName,
                description: `Shipped from ${row.ShippedFrom || 'Unknown'}. Manufactured in ${row.ManufacturedFrom || 'Unknown'}.`,
                price: parsePrice(row.PricePerItem),
                category: row.ManufacturedFrom || 'General',
                imageUrl: '',
                stock: 500,
                country
            });
        }
        const orderId = Number(row.ID);
        if (!orders.has(orderId)) {
            orders.set(orderId, {
                userEmail: email,
                trackingNumber: row['Tracking#'] || (0, utils_1.generateTrackingNumber)(country),
                country,
                createdAt: parseDate(row.PurchaseDate),
                items: []
            });
        }
        orders.get(orderId).items.push({
            productName,
            quantity: Number(row.ItemAmount || 1),
            price: parsePrice(row.PricePerItem)
        });
    }
    // Insert users
    const userIdByEmail = new Map();
    for (const user of users.values()) {
        await (0, db_1.run)('INSERT INTO users (email, name, country, is_admin, phone, shipping_address, shipping_city, billing_address, billing_city, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [user.email, user.name, user.country, 0, '', '', '', '', '', user.createdAt]);
        const inserted = await (0, db_1.get)('SELECT last_insert_rowid() as id');
        userIdByEmail.set(user.email, inserted?.id || 0);
    }
    // Insert products
    await (0, db_1.seedProducts)(Array.from(products.values()));
    // Insert orders and order items
    for (const [orderId, order] of orders) {
        const userId = userIdByEmail.get(order.userEmail);
        if (!userId)
            continue;
        const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await (0, db_1.run)('INSERT INTO orders (id, user_id, status, total, tracking_number, country, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [orderId, userId, 'complete', total, order.trackingNumber, order.country, order.createdAt, order.createdAt]);
        for (const item of order.items) {
            const productId = products.get(item.productName)?.id;
            if (!productId)
                continue;
            await (0, db_1.run)('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [orderId, productId, item.quantity, item.price]);
        }
    }
}
// Export back to Excel is intentionally omitted to keep the dataset read-only.
