# Innopolis PLM — Backend

BOM & Procurement / PLM backend for **Innopolis Bio Innovations**. The
Material Master is the single source of truth ("Engineering Data Backbone");
Project BOM, Vendors, Procurement, Inventory and Reports build around it.

Implements the Innopolis BOM FRD v1.0 — **all six modules**: Material Master
(§3–6), Project BOM (§8–10), Vendor Database (§7), Procurement (§11–13),
Inventory (§14) and Reports & Analytics (§15).

## Stack

- **Express 5** + TypeScript (ESM)
- **Drizzle ORM** + PostgreSQL
- **TypeBox + Ajv** request validation · **Zod** env validation
- **JWT** (self-issued HS256) auth + role-based authorization
- **pino** logging · **uuidv7** ids

## Architecture (layered vertical slices)

```
src/
  api/
    routes/        # Express routers (auth, masters, parts)
    controller/    # validate → call service → ApiResponse
    dto/           # TypeBox Create/Update DTOs
    middlewares/   # authenticate (JWT) + authorize (roles)
  service/         # business logic (material code generation, etc.)
  repository/      # Drizzle queries (soft-delete, scoped)
  db/schema/       # tables + enums + inferred types
  util/            # logger, error, validator, response, helpers
  config/          # Zod-validated env
  scripts/         # system-init (seed admin) + seed-masters
```

## Getting started

```bash
npm install
cp .env.example .env          # then edit DB_URL + JWT_SECRET
npm run db:push               # create tables
npm run seed                  # load 14 categories, subtypes, specs, grades, units + demo users
npm run dev                   # http://localhost:7100
```

## Material code (FRD §4)

Every material gets an intelligent code `TT-SS-MM-DDDD` generated from the
selected master records:

| Segment | Meaning           | Source table          |
|---------|-------------------|-----------------------|
| `TT`    | Material Type     | `material_categories` |
| `SS`    | Subtype           | `subtypes`            |
| `MM`    | Major Spec        | `major_specs`         |
| `DDDD`  | Detailed Spec     | `grades`              |

e.g. `MB-VA-15-3040` = Mechanical Bought-out · Valve · 15 mm · SS 304.

## API — Module 1: Material Master

| Method | Path | Roles |
|--------|------|-------|
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | any |
| GET/POST/PATCH/DELETE | `/api/material-categories[/:id]` | read: any · write: Administrator |
| GET | `/api/material-categories/:categoryId/subtypes` | any |
| POST/GET/PATCH/DELETE | `/api/subtypes[/:id]` | write: Administrator |
| GET/POST/PATCH/DELETE | `/api/major-specs[/:id]` | write: Administrator |
| GET/POST/PATCH/DELETE | `/api/grades[/:id]` | write: Administrator |
| GET/POST/PATCH/DELETE | `/api/units[/:id]` | write: Administrator |
| GET/POST/PATCH/DELETE | `/api/parts[/:id]` | read: any · write: Engineering |

`GET /api/parts` supports `?search=&categoryId=&subtypeId=&lifecycle=&availability=&sourcing=&page=&pageSize=`.

## API — Module 3: Vendor Database

| Method | Path | Roles |
|--------|------|-------|
| GET/POST/PATCH/DELETE | `/api/suppliers[/:id]` | read: any · write: Purchase |

`GET /api/suppliers` supports `?search=&status=&country=&region=&category=&approved=&tier=&page=&pageSize=`.
Materials link to a vendor via `parts.supplier_id` (FK → `suppliers.id`).

## API — Module 2: Project BOM

| Method | Path | Roles |
|--------|------|-------|
| GET/POST/PATCH/DELETE | `/api/projects[/:id]` | read: any · write: Engineering |
| GET/POST/PATCH/DELETE | `/api/project-boms[/:id]` | read: any · write: Engineering |
| POST | `/api/project-boms/:id/transition` | stage-gated (see below) |
| GET/POST | `/api/project-boms/:bomId/lines` | read: any · add: Engineering |
| PATCH/DELETE | `/api/bom-lines/:id` | Engineering |

- Project numbers auto-generate as `INP-{year}-{seq}`; BOM numbers as `BOM-{seq}`.
- BOM lines snapshot the material (code, name, cost, lead time) at add-time;
  `GET /api/project-boms/:id` returns the BOM with its `lines` and `audit` trail
  and live aggregates (`line_items`, `total_value`, `unique_materials`,
  `critical_items`, `long_lead_items`).
- Lines are editable only while the BOM is in **Draft**.

**Approval workflow (FRD §10)** — `POST /:id/transition` with `{action:"advance"|"reject", comment?}`:

```
Draft ──▶ Technical Review ──▶ Commercial Review ──▶ Approved ──▶ Released for Purchase
 (Engineering)    (Engineering)        (Commercial)      (Purchase)
```

Each stage may be actioned only by the role above (or Administrator); `reject`
sends the BOM back to Draft. Every transition is recorded in `bom_audit_entries`
(from/to stage, action, user, comment, timestamp).

**BOM analysis (FRD §11 / procedure p6)** — `GET /api/project-boms/:id/analysis?groupBy=category|vendor|leadtime|procurement`
returns each group's cost total + share of the BOM (e.g. which category takes the most money).

## API — Module 4: Procurement

| Method | Path | Roles |
|--------|------|-------|
| GET/POST/PATCH/DELETE | `/api/rfqs[/:id]` | read: any · write: Purchase |
| POST | `/api/rfqs/:id/send` | Purchase |
| GET/POST | `/api/rfqs/:id/quotations` | read: any · record: Purchase |
| GET | `/api/rfqs/:id/comparison` | Purchase, Commercial |
| GET | `/api/quotations/:id` | any |
| POST | `/api/quotations/:id/award` | Purchase, Commercial |
| GET/POST/DELETE | `/api/purchase-orders[/:id]` | read: any · write: Purchase |
| POST | `/api/purchase-orders/:id/status` | Purchase |
| POST | `/api/purchase-orders/:id/receive` | Purchase, Stores |

**Procure-to-receive flow (FRD §12–14):**

```
RFQ (from released BOM or ad hoc) ──send──▶ Vendors submit Quotations
   ──▶ Comparison (auto rank by total, score) ──▶ Award winner
   ──▶ Purchase Order (Draft→Pending Approval→Open) ──▶ Goods Receipt
       (Partially Received → Received, drives received_pct)
```

- RFQ numbers `RFQ-{seq}`, PO numbers `PO-{seq}`.
- `GET /api/rfqs/:id` returns the RFQ with `lines` + `quotations`; comparison
  ranks cheapest = rank 1 / score 100.
- A PO can be raised from an awarded quotation (`from_quotation_id`) or manually.
  Receipt updates per-line `received_qty` + the PO `received_pct`, and posts
  accepted goods into stock when a `warehouse_id` is supplied (see Inventory).

## API — Module 5: Inventory

| Method | Path | Roles |
|--------|------|-------|
| GET/POST/PATCH/DELETE | `/api/warehouses[/:id]` | read: any · write: Stores |
| GET | `/api/inventory` | any (stock balances) |
| GET | `/api/inventory/movements` | any (stock ledger) |
| GET | `/api/inventory/alerts` | any (≤ reorder point) |
| POST | `/api/inventory/opening` | Stores |
| POST | `/api/inventory/adjust` | Stores (in/out, wastage) |
| POST | `/api/inventory/transfer` | Stores (between warehouses) |

- `stock_balances` holds on-hand per (material, warehouse); `stock_movements`
  is the append-only ledger. Every posting keeps the Material Master's
  `stock_qty` + `availability` in sync and recomputes `status`
  (In Stock / Low Stock / Out of Stock vs reorder point).
- **PO receipt → stock (FRD §14):** `POST /api/purchase-orders/:id/receive`
  with `{warehouse_id, lines:[{po_line_id, received_qty, rejected_qty?}]}` posts
  the accepted qty (received − rejected) as a `purchase` movement; rejected goods
  are recorded but never enter available inventory.
- `GET /api/warehouses/:id` returns the warehouse with a live stock summary
  (sku count, stock value, low-stock items).

## API — Module 6: Reports & Analytics

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/reports/dashboard` | executive KPIs (counts, stock value, BOMs by stage) |
| GET | `/api/reports/procurement/purchase-value` | PO count + value per status |
| GET | `/api/reports/procurement/vendor-performance` | vendor ratings + actual PO spend |
| GET | `/api/reports/inventory/stock-value` | stock value + SKUs per warehouse |
| GET | `/api/reports/commercial/vendor-spend` | spend grouped by vendor |
| GET | `/api/reports/commercial/project-cost` | rolled BOM cost per project |

## Demo logins (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@innopolis.bio | admin123 |
| Engineering | engineer@innopolis.bio | engineer123 |
| Commercial | commercial@innopolis.bio | commercial123 |
| Purchase | purchase@innopolis.bio | purchase123 |
| Stores | stores@innopolis.bio | stores123 |
| Management | management@innopolis.bio | management123 |
