"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.run = run;
exports.get = get;
exports.all = all;
exports.resetSchema = resetSchema;
exports.seedProducts = seedProducts;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sqlite3_1 = __importDefault(require("sqlite3"));
sqlite3_1.default.verbose();
const DATA_DIR = path_1.default.resolve(__dirname, '..', 'data');
// New database file derived from EShop Dataset.xlsx
const DB_FILE = path_1.default.join(DATA_DIR, 'eshop_dataset.db');
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
exports.db = new sqlite3_1.default.Database(DB_FILE);
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        exports.db.run(sql, params, function (err) {
            if (err)
                return reject(err);
            resolve();
        });
    });
}
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        exports.db.get(sql, params, (err, row) => {
            if (err)
                return reject(err);
            resolve(row);
        });
    });
}
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        exports.db.all(sql, params, (err, rows) => {
            if (err)
                return reject(err);
            resolve(rows);
        });
    });
}
async function resetSchema() {
    await run('PRAGMA foreign_keys = OFF');
    await run('DROP TABLE IF EXISTS order_items');
    await run('DROP TABLE IF EXISTS orders');
    await run('DROP TABLE IF EXISTS cart_items');
    await run('DROP TABLE IF EXISTS products');
    await run('DROP TABLE IF EXISTS users');
    await run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    phone TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    billing_address TEXT,
    billing_city TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
    await run(`CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    country TEXT
  )`);
    await run(`CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);
    await run(`CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    total REAL NOT NULL,
    tracking_number TEXT NOT NULL,
    country TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
    await run(`CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);
    await run('PRAGMA foreign_keys = ON');
}
async function seedProducts(products) {
    const insert = exports.db.prepare(`INSERT INTO products (id, name, description, price, category, image_url, stock, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    await new Promise((resolve, reject) => {
        exports.db.serialize(() => {
            for (const p of products) {
                insert.run([
                    p.id,
                    p.name,
                    p.description ?? '',
                    p.price,
                    p.category ?? '',
                    p.imageUrl ?? '',
                    p.stock ?? 0,
                    p.country ?? ''
                ]);
            }
            insert.finalize(err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    });
}
