# E-Shop Full Stack Application


## Tech stack
- Backend: Node.js, Express, JWT cookies, XLSX (Excel read/write)
- Frontend: React, React Router, Axios, Vite

## Project structure
- `backend/` – API server reading/writing `EShop Dataset.xlsx`, serves built frontend
- `frontend/` – React SPA (auth, products, cart/checkout, orders, profile, admin)
- `backend/data/EShop Dataset.xlsx` – required dataset (or place in repo root)

## Setup (one-time online, then offline)
1. Place `EShop Dataset.xlsx` in `backend/data/` (or repo root). This file is the source of truth; the app appends new orders to it.
2. From `backend/`: `npm install`
3. From `frontend/`: `npm install`
4. From `backend/`: `npm run start:all`
   - Builds frontend, copies `frontend/dist` into `backend/frontend-dist`, then starts the server.
5. Dev mode: backend `npm run dev`; frontend `npm run dev` (proxies `/api` to 4000)


## Running
- Backend: `npm start` (from `backend/`, sync frontend dist first)
- Frontend dev: `npm run dev` in `frontend/` (port 5173)

## Authentication
- Email-only login. Register requires `email`, `name`, `country` (2-letter). Admin user: `admin@example.com` (in-memory, Excel-derived users are source of truth).

## Pages / flows
- Login / Register (email-only)
- Home: browse/search products (25 per page), add to cart
- Product details: view and add quantity
- Checkout: edit cart, place order (appends rows to Excel); response returns the full Excel-shaped rows written
- Orders list + Order details: shows tracking number `Unq#########CC`
- User page: profile + order summary
- Use admin@example.com as a username to login into admin section.
- Admin page: view incomplete orders and mark complete (logical only; Excel rows already marked completed by default).
- Admin dashboard filters to the current month, let admin user opens order details (items, totals, tracking), and mark orders complete from the details view.

## Environment
- `PORT` default 4000

## Notes
- Source of dataset is `EShop Dataset.xlsx`; 
- If changed frontend build path, update `FRONTEND_DIST` in `backend/src/index.ts`.
