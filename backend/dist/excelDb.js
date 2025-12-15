"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRows = getAllRows;
exports.listProducts = listProducts;
exports.getProduct = getProduct;
exports.listUsers = listUsers;
exports.findUserByEmail = findUserByEmail;
exports.registerUser = registerUser;
exports.getCart = getCart;
exports.addToCart = addToCart;
exports.updateCartItem = updateCartItem;
exports.deleteCartItem = deleteCartItem;
exports.placeOrder = placeOrder;
exports.listOrders = listOrders;
exports.listAllOrders = listAllOrders;
exports.markOrderComplete = markOrderComplete;
exports.markOrderReceived = markOrderReceived;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xlsx_1 = __importDefault(require("xlsx"));
const utils_1 = require("./utils");
const DATASET_NAMES = ['EShop Dataset.xlsx', 'eshop_dataset.xlsx', 'dataset.xlsx'];
const DATA_PATH = datasetPath();
const CARTS_PATH = path_1.default.resolve(__dirname, '..', 'data', 'carts.json');
const ORDER_STATUS_PATH = path_1.default.resolve(__dirname, '..', 'data', 'orderStatus.json');
function datasetPath() {
    const candidates = DATASET_NAMES.flatMap(name => [
        path_1.default.resolve(process.cwd(), name),
        path_1.default.resolve(__dirname, '..', name),
        path_1.default.resolve(__dirname, '..', 'data', name)
    ]);
    const found = candidates.find(p => fs_1.default.existsSync(p));
    if (!found)
        throw new Error('EShop Dataset.xlsx not found. Place it in repo root or backend/data');
    return found;
}
function readRows() {
    const wb = xlsx_1.default.readFile(DATA_PATH);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return xlsx_1.default.utils.sheet_to_json(sheet, { defval: '' });
}
function writeRows(rows) {
    const wb = xlsx_1.default.utils.book_new();
    const sheet = xlsx_1.default.utils.json_to_sheet(rows);
    xlsx_1.default.utils.book_append_sheet(wb, sheet, 'Orders');
    xlsx_1.default.writeFile(wb, DATA_PATH);
}
function parsePrice(value) {
    if (typeof value === 'number')
        return value;
    return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
}
function ensureCartStorage() {
    const dir = path_1.default.dirname(CARTS_PATH);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    if (!fs_1.default.existsSync(CARTS_PATH))
        fs_1.default.writeFileSync(CARTS_PATH, JSON.stringify({}), 'utf-8');
}
function readCarts() {
    try {
        ensureCartStorage();
        const raw = fs_1.default.readFileSync(CARTS_PATH, 'utf-8');
        return JSON.parse(raw || '{}');
    }
    catch {
        return {};
    }
}
function writeCarts(carts) {
    ensureCartStorage();
    fs_1.default.writeFileSync(CARTS_PATH, JSON.stringify(carts, null, 2), 'utf-8');
}
function ensureOrderStatusStorage() {
    const dir = path_1.default.dirname(ORDER_STATUS_PATH);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    if (!fs_1.default.existsSync(ORDER_STATUS_PATH))
        fs_1.default.writeFileSync(ORDER_STATUS_PATH, JSON.stringify({}), 'utf-8');
}
function readOrderStatus() {
    try {
        ensureOrderStatusStorage();
        const raw = fs_1.default.readFileSync(ORDER_STATUS_PATH, 'utf-8');
        const map = JSON.parse(raw || '{}');
        // normalize older values to the new schema
        Object.keys(map).forEach(key => {
            if (map[key] === 'pending')
                map[key] = 'pending';
            if (map[key] !== 'complete')
                map[key] = 'pending';
        });
        return map;
    }
    catch {
        return {};
    }
}
function writeOrderStatus(map) {
    ensureOrderStatusStorage();
    fs_1.default.writeFileSync(ORDER_STATUS_PATH, JSON.stringify(map, null, 2), 'utf-8');
}
function statusMapWithAutoComplete(rows) {
    const map = readOrderStatus();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let changed = false;
    rows.forEach(r => {
        const idStr = String(Number(r.ID) || 0);
        if (!idStr || idStr === '0')
            return;
        const created = new Date(r.PurchaseDate);
        if (Number.isNaN(created.getTime()))
            return;
        if (created < startOfMonth && map[idStr] !== 'complete') {
            map[idStr] = 'complete';
            changed = true;
        }
    });
    if (changed)
        writeOrderStatus(map);
    return map;
}
function normalizeProfile(row) {
    return {
        shippingAddress: row.ShippingAddress || '',
        shippingCity: row.ShippingCity || '',
        shippingCountry: row.ShippingCountry || '',
        billingAddress: row.BillingAddress || '',
        billingCity: row.BillingCity || '',
        billingCountry: row.BillingCountry || '',
        phone: row['Phone#'] || '',
        cardNumber: row['Card#'] || '',
        cardType: row.CardType || ''
    };
}
function getProfileForEmail(email) {
    const rows = readRows().filter(r => (r.Email || '').toLowerCase() === email.toLowerCase());
    if (!rows.length)
        return {};
    // Use the newest entry (highest ID) as the profile source.
    const latest = rows.reduce((a, b) => (Number(a.ID) || 0) > (Number(b.ID) || 0) ? a : b);
    return normalizeProfile(latest);
}
function getAllRows() {
    return readRows();
}
function listProducts() {
    const rows = readRows();
    const leadStats = new Map();
    for (const row of rows) {
        const name = row.ItemName || 'Item';
        const lead = leadDays(row);
        if (lead !== undefined) {
            const curr = leadStats.get(name) || { sum: 0, count: 0 };
            curr.sum += lead;
            curr.count += 1;
            leadStats.set(name, curr);
        }
    }
    const seen = new Map();
    for (const row of rows) {
        const name = row.ItemName || 'Item';
        if (seen.has(name))
            continue;
        const stat = leadStats.get(name);
        const avgLead = stat && stat.count > 0 ? stat.sum / stat.count : undefined;
        seen.set(name, {
            id: seen.size + 1,
            name,
            description: `Shipped from ${row.ShippedFrom || 'Unknown'}. Manufactured in ${row.ManufacturedFrom || 'Unknown'}.`,
            price: parsePrice(row.PricePerItem),
            category: row.ManufacturedFrom || 'General',
            imageUrl: '',
            stock: 999,
            country: row.ShippingCountry || 'US',
            shippedFrom: row.ShippedFrom || row.ShippingCountry || 'US',
            estimatedDelivery: '',
            leadTimeDays: avgLead
        });
    }
    return Array.from(seen.values());
}
function leadDays(row) {
    const purchase = Date.parse(row.PurchaseDate);
    const est = Date.parse(row.EstimatedDelivery);
    if (Number.isNaN(purchase) || Number.isNaN(est))
        return undefined;
    const diff = est - purchase;
    if (diff <= 0)
        return undefined;
    return Math.round(diff / (1000 * 60 * 60 * 24));
}
function getProduct(productId) {
    const products = listProducts();
    return products.find(p => p.id === productId);
}
function listUsers() {
    const rows = readRows();
    const map = new Map();
    for (const row of rows) {
        const email = row.Email?.trim();
        if (!email)
            continue;
        if (map.has(email))
            continue;
        const profile = normalizeProfile(row);
        map.set(email, {
            id: map.size + 1,
            email,
            name: `${row.FirstName} ${row.LastName}`.trim() || 'Customer',
            country: row.ShippingCountry || row.BillingCountry || 'US',
            isAdmin: 0,
            createdAt: new Date().toISOString(),
            phone: profile.phone,
            shippingAddress: profile.shippingAddress,
            shippingCity: profile.shippingCity,
            shippingCountry: profile.shippingCountry,
            billingAddress: profile.billingAddress,
            billingCity: profile.billingCity,
            billingCountry: profile.billingCountry,
            cardNumber: profile.cardNumber,
            cardType: profile.cardType
        });
    }
    map.set('admin@example.com', {
        id: map.size + 1,
        email: 'admin@example.com',
        name: 'Admin User',
        country: 'US',
        isAdmin: 1,
        createdAt: new Date().toISOString()
    });
    return Array.from(map.values());
}
function findUserByEmail(email) {
    return listUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}
function registerUser(data) {
    const existing = findUserByEmail(data.email);
    if (existing)
        return existing;
    const rows = readRows();
    const maxId = rows.reduce((m, r) => Math.max(m, Number(r.ID) || 0), 0);
    const nowIso = new Date().toISOString();
    const [firstName, ...rest] = data.name.split(' ');
    const lastName = rest.join(' ');
    const newRow = {
        ID: maxId + 1,
        FirstName: firstName || data.name,
        LastName: lastName,
        ShippingAddress: data.shippingAddress || '',
        ShippingCity: data.shippingCity || '',
        ShippingCountry: data.shippingCountry || data.country,
        'Card#': data.cardNumber || '',
        CardType: data.cardType || '',
        BillingCity: data.billingCity || '',
        BillingAddress: data.billingAddress || '',
        BillingCountry: data.billingCountry || data.country,
        'Tracking#': (0, utils_1.generateTrackingNumber)(data.country),
        ItemName: 'Account Setup',
        PricePerItem: '0 $',
        PurchaseDate: nowIso,
        EstimatedDelivery: nowIso,
        ItemAmount: 0,
        ShippedFrom: data.shippingCountry || data.country,
        ManufacturedFrom: data.billingCountry || data.country,
        'Phone#': data.phone || '',
        Email: data.email
    };
    rows.push(newRow);
    writeRows(rows);
    return findUserByEmail(data.email);
}
function getCart(userId) {
    const carts = readCarts();
    return carts[String(userId)] || [];
}
function addToCart(userId, productId, quantity) {
    const carts = readCarts();
    const items = carts[String(userId)] || [];
    const existing = items.find(i => i.productId === productId);
    if (existing)
        existing.quantity += quantity;
    else
        items.push({ productId, quantity });
    carts[String(userId)] = items;
    writeCarts(carts);
}
function updateCartItem(userId, itemId, quantity) {
    const carts = readCarts();
    const items = carts[String(userId)] || [];
    const item = items[itemId];
    if (item)
        item.quantity = quantity;
    carts[String(userId)] = items;
    writeCarts(carts);
}
function deleteCartItem(userId, itemId) {
    const carts = readCarts();
    const items = carts[String(userId)] || [];
    items.splice(itemId, 1);
    carts[String(userId)] = items;
    writeCarts(carts);
}
function placeOrder(user, input) {
    const carts = readCarts();
    const cart = carts[String(user.id)] || [];
    if (!cart.length)
        throw new Error('Cart is empty');
    const rows = readRows();
    const products = listProducts();
    const maxId = rows.reduce((m, r) => Math.max(m, Number(r.ID) || 0), 0);
    const orderId = maxId + 1;
    const tracking = (0, utils_1.generateTrackingNumber)(user.country || 'US');
    const nowIso = new Date().toISOString();
    const createdRows = [];
    const storedProfile = getProfileForEmail(user.email);
    const profile = {
        shippingAddress: input.shippingAddress || storedProfile.shippingAddress || '',
        shippingCity: input.shippingCity || storedProfile.shippingCity || '',
        shippingCountry: input.shippingCountry || storedProfile.shippingCountry || user.country || 'US',
        billingAddress: input.billingAddress || storedProfile.billingAddress || '',
        billingCity: input.billingCity || storedProfile.billingCity || '',
        billingCountry: input.billingCountry || storedProfile.billingCountry || user.country || 'US',
        phone: input.phone || storedProfile.phone || '',
        cardNumber: input.cardNumber || storedProfile.cardNumber || '',
        cardType: input.cardType || storedProfile.cardType || ''
    };
    const digits = (profile.cardNumber || '').replace(/\D/g, '');
    if (digits.length !== 15) {
        throw new Error('Card number must be exactly 15 digits');
    }
    const subtotal = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + ((product?.price || 0) * item.quantity);
    }, 0);
    const deliveryBase = typeof input.deliveryCharge === 'number' ? input.deliveryCharge : undefined;
    const delivery = (() => {
        if (deliveryBase !== undefined && deliveryBase >= 7 && deliveryBase <= 15)
            return deliveryBase;
        return 7 + Math.random() * 8; // 7 to 15
    })();
    const deliveryRounded = Math.round(delivery * 100) / 100;
    const tax = Math.round(subtotal * 0.07 * 100) / 100;
    for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (!product)
            continue;
        const [firstName, ...rest] = user.name.split(' ');
        const lastName = rest.join(' ');
        const newRow = {
            ID: orderId,
            FirstName: firstName || user.name,
            LastName: lastName,
            ShippingAddress: profile.shippingAddress || '',
            ShippingCity: profile.shippingCity || '',
            ShippingCountry: profile.shippingCountry || user.country || 'US',
            'Card#': profile.cardNumber || '',
            CardType: profile.cardType || '',
            BillingCity: profile.billingCity || '',
            BillingAddress: profile.billingAddress || '',
            BillingCountry: profile.billingCountry || user.country || 'US',
            'Tracking#': tracking,
            ItemName: product.name,
            PricePerItem: `${product.price} $`,
            PurchaseDate: nowIso,
            EstimatedDelivery: nowIso,
            ItemAmount: item.quantity,
            ShippedFrom: product.country || 'US',
            ManufacturedFrom: product.category || '',
            'Phone#': profile.phone || '',
            Email: user.email
        };
        rows.push(newRow);
        createdRows.push(newRow);
    }
    // append tax and delivery as separate line items to preserve totals in dataset
    const baseChargeRow = {
        ID: orderId,
        FirstName: user.name.split(' ')[0] || user.name,
        LastName: user.name.split(' ').slice(1).join(' '),
        ShippingAddress: profile.shippingAddress || '',
        ShippingCity: profile.shippingCity || '',
        ShippingCountry: profile.shippingCountry || user.country || 'US',
        'Card#': profile.cardNumber || '',
        CardType: profile.cardType || '',
        BillingCity: profile.billingCity || '',
        BillingAddress: profile.billingAddress || '',
        BillingCountry: profile.billingCountry || user.country || 'US',
        'Tracking#': tracking,
        PurchaseDate: nowIso,
        EstimatedDelivery: nowIso,
        ItemAmount: 1,
        ShippedFrom: profile.shippingCountry || user.country || 'US',
        ManufacturedFrom: profile.billingCountry || user.country || 'US',
        'Phone#': profile.phone || '',
        Email: user.email
    };
    const taxRow = {
        ...baseChargeRow,
        ItemName: 'Tax (7%)',
        PricePerItem: `${tax.toFixed(2)} $`
    };
    const deliveryRow = {
        ...baseChargeRow,
        ItemName: 'Delivery Charge',
        PricePerItem: `${deliveryRounded.toFixed(2)} $`
    };
    rows.push(taxRow, deliveryRow);
    createdRows.push(taxRow, deliveryRow);
    writeRows(rows);
    delete carts[String(user.id)];
    writeCarts(carts);
    return { orderId, tracking, rows: createdRows };
}
function listOrders(user) {
    const allRows = readRows();
    const rows = allRows.filter(r => r.Email?.toLowerCase() === user.email.toLowerCase());
    const statusMap = statusMapWithAutoComplete(allRows);
    const grouped = new Map();
    for (const r of rows) {
        const id = Number(r.ID) || 0;
        if (!grouped.has(id))
            grouped.set(id, []);
        grouped.get(id).push(r);
    }
    const orders = Array.from(grouped.entries()).map(([id, items]) => {
        const total = items.reduce((s, it) => s + parsePrice(it.PricePerItem) * (Number(it.ItemAmount) || 1), 0);
        const status = statusMap[String(id)] || 'pending';
        return {
            id,
            userId: user.id,
            userName: user.name,
            status,
            total,
            trackingNumber: items[0]['Tracking#'] || '',
            country: items[0].ShippingCountry || user.country,
            createdAt: items[0].PurchaseDate || '',
            updatedAt: items[0].EstimatedDelivery || '',
            items: items.map((it, idx) => ({
                id: idx + 1,
                productId: productsIndex(it.ItemName),
                quantity: Number(it.ItemAmount) || 1,
                price: parsePrice(it.PricePerItem),
                name: it.ItemName
            }))
        };
    }).filter(o => o.total > 0);
    return orders;
}
function productsIndex(name) {
    const products = listProducts();
    const p = products.find(x => x.name === name);
    return p?.id || 0;
}
function listAllOrders() {
    const users = listUsers();
    const map = new Map();
    users.forEach(u => map.set(u.email.toLowerCase(), u));
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const allRows = readRows();
    const statusMap = statusMapWithAutoComplete(allRows);
    const rows = allRows.filter(r => {
        const created = new Date(r.PurchaseDate);
        if (Number.isNaN(created.getTime()))
            return false;
        return created.getMonth() === month && created.getFullYear() === year;
    });
    const grouped = new Map();
    for (const r of rows) {
        const id = Number(r.ID) || 0;
        if (!grouped.has(id))
            grouped.set(id, []);
        grouped.get(id).push(r);
    }
    const orders = Array.from(grouped.entries()).map(([id, items]) => {
        const user = map.get((items[0].Email || '').toLowerCase());
        const total = items.reduce((s, it) => s + parsePrice(it.PricePerItem) * (Number(it.ItemAmount) || 1), 0);
        const status = statusMap[String(id)] || 'pending';
        return {
            id,
            userId: user?.id || 0,
            userName: user?.name || 'Customer',
            status,
            total,
            trackingNumber: items[0]['Tracking#'] || '',
            country: items[0].ShippingCountry || user?.country,
            createdAt: items[0].PurchaseDate || '',
            updatedAt: items[0].EstimatedDelivery || '',
            items: items.map((it, idx) => ({
                id: idx + 1,
                productId: productsIndex(it.ItemName),
                quantity: Number(it.ItemAmount) || 1,
                price: parsePrice(it.PricePerItem),
                name: it.ItemName
            }))
        };
    }).filter(o => o.total > 0);
    return orders;
}
function markOrderComplete(id) {
    const statusMap = readOrderStatus();
    statusMap[String(id)] = 'complete';
    writeOrderStatus(statusMap);
    return true;
}
function markOrderReceived(id, user) {
    // require the order to belong to the user unless caller is admin
    if (user && !user.isAdmin) {
        const owned = listOrders(user).some(o => o.id === id);
        if (!owned)
            return false;
    }
    return markOrderComplete(id);
}
