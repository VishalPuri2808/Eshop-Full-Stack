import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { Product, User } from './types';
import { resetSchema, run, seedProducts, get } from './db';
import { generateTrackingNumber } from './utils';

const DATASET_NAMES = ['EShop Dataset.xlsx', 'eshop_dataset.xlsx', 'dataset.xlsx'];

function datasetPath(): string {
  const candidates = DATASET_NAMES.flatMap(name => [
    path.resolve(process.cwd(), name),
    path.resolve(__dirname, '..', name),
    path.resolve(__dirname, '..', 'data', name)
  ]);
  const found = candidates.find(p => fs.existsSync(p));
  if (found) return found;
  throw new Error('EShop Dataset.xlsx not found. Place it in repo root or backend/data');
}

interface DatasetRow {
  ID: number;
  FirstName: string;
  LastName: string;
  ShippingAddress: string;
  ShippingCity: string;
  ShippingCountry: string;
  'Card#': string;
  CardType: string;
  BillingCity: string;
  BillingAddress: string;
  BillingCountry: string;
  'Tracking#': string;
  ItemName: string;
  PricePerItem: string;
  PurchaseDate: string;
  EstimatedDelivery: string;
  ItemAmount: number;
  ShippedFrom: string;
  ManufacturedFrom: string;
  'Phone#': string;
  Email: string;
  [key: string]: any;
}

function parsePrice(value: string | number): number {
  if (typeof value === 'number') return value;
  return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
}

function parseDate(value: string): string {
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function rebuildDbFromDataset() {
  const dsPath = datasetPath();
  const wb = xlsx.readFile(dsPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: DatasetRow[] = xlsx.utils.sheet_to_json(sheet, { defval: '' }) as DatasetRow[];

  await resetSchema();

  // Aggregate unique users, products, and orders
  const users = new Map<string, User>();
  const products = new Map<string, Product>();
  const orders = new Map<number, { userEmail: string; trackingNumber: string; country: string; createdAt: string; items: { productName: string; quantity: number; price: number }[] }>();

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
      } as User);
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
        trackingNumber: row['Tracking#'] || generateTrackingNumber(country),
        country,
        createdAt: parseDate(row.PurchaseDate),
        items: []
      });
    }

    orders.get(orderId)!.items.push({
      productName,
      quantity: Number(row.ItemAmount || 1),
      price: parsePrice(row.PricePerItem)
    });
  }

  // Insert users
  const userIdByEmail = new Map<string, number>();
  for (const user of users.values()) {
    await run(
      'INSERT INTO users (email, name, country, is_admin, phone, shipping_address, shipping_city, billing_address, billing_city, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user.email, user.name, user.country, 0, '', '', '', '', '', user.createdAt]
    );
    const inserted = await get<{ id: number }>('SELECT last_insert_rowid() as id');
    userIdByEmail.set(user.email, inserted?.id || 0);
  }

  // Insert products
  await seedProducts(Array.from(products.values()));

  // Insert orders and order items
  for (const [orderId, order] of orders) {
    const userId = userIdByEmail.get(order.userEmail);
    if (!userId) continue;
    const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await run(
      'INSERT INTO orders (id, user_id, status, total, tracking_number, country, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, userId, 'complete', total, order.trackingNumber, order.country, order.createdAt, order.createdAt]
    );

    for (const item of order.items) {
      const productId = products.get(item.productName)?.id;
      if (!productId) continue;
      await run(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, productId, item.quantity, item.price]
      );
    }
  }
}

// Export back to Excel is intentionally omitted to keep the dataset read-only.
