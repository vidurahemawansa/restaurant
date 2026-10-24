# Kitchen Ledger

Fast restaurant management for Sri Lankan kitchens.

**Design principle:** minimum data entry + maximum automatic reporting.

Staff should enter a purchase or end-of-day sales in under 10 seconds.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite
- Tailwind CSS

## Quick start

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you can do

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Today sales/spend/profit, major costs, month vs last month |
| **Tickets** | Open/closed orders with item names on each card |
| **Purchase** | Tap item → amount → save (multi-line). Supplier/qty optional |
| **Sales** | Enter quantities sold; revenue from menu prices |
| **Bill scan** | Photograph handwritten Sinhala bill → AI extract → review → save |
| **Expenses** | Rent, utilities, and other non-food costs |
| **Salaries** | Employee payments |
| **Costs** | Major cost analysis by item & category |
| **Trends** | Daily / weekly / monthly spend for chicken, rice, fish… |
| **Items** | Purchase item master |

## Purchase flow (MVP)

Required: **date** (defaults today), **item**, **amount**.

Optional (More details): quantity, invoice #, payment method, notes, supplier.

## Authentication & roles

Multi-tenant with 3 roles:

| Role | Access |
|------|--------|
| **Super Admin** | All restaurants, users, platform stats |
| **Restaurant Admin** | Own restaurant: sales, purchases, expenses, employees, reports |
| **Employee** | Own salary & payment history only |

### Seeded accounts (after `npm run db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | vishwanath.wgv2h@gmail.com | Admin@123 |
| Restaurant Admin | owner@demo.com | Demo@123 |
| Employee | kamal@demo.com | Demo@123 |

Configure via `.env`: `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, etc.

### New restaurant owner flow

1. `/register` → create account
2. `/register/restaurant` → register restaurant
3. Dashboard

## Handwritten bill OCR

On the **Sales** page, use **Scan Handwritten Bill**:

1. Take a photo or upload an image (JPEG/PNG/WebP, max 10 MB)
2. AI extracts items (Sinhala/English/mixed handwriting)
3. Review and edit items, quantities, prices
4. Confirm — creates a normal `Sale` transaction

Requires `OPENAI_API_KEY` in `.env` (server-side only; never exposed to the browser).

```bash
# .env
OPENAI_API_KEY=sk-...
# optional: OPENAI_BILL_MODEL=gpt-4o
```

Flow: `POST /api/bills/scan` (extract only) → user review → `POST /api/transactions` (save).

## Schema notes

Quantity, unit, unit price, and supplier are optional now but stored when provided — ready for inventory, recipe costing, and food-cost % later.
