# Innopolis PLM — Frontend Developer API Guide

This is the contract for building the frontend against the Innopolis BOM/PLM
backend. It covers auth, conventions, every endpoint, request/response shapes,
enums, and the key workflows.

> The existing UI repo (`innopolis-plm`, Next.js + Tauri) was built on mock data.
> This guide maps those screens onto the **real** API. Field names here are the
> source of truth.

> **Updated 2026-07-03:** actor/owner names now returned inline on detail views,
> the BOM audit trail and stock movements (see Gotcha 6); PO `Received` /
> `Partially Received` can no longer be set via `/status` and `warehouse_id` is
> now required on receive (see §7). Full rationale in
> `BACKEND_CHANGES_FOR_FRONTEND.md`.

> **Updated 2026-07-04 (v1.0.1):** materials now support **multiple preferred
> vendors** — the single `supplier_id` is replaced by a `vendor_ids[]` list
> (reads also return `preferred_vendors`); and the material `description` field
> is renamed to `remarks`. Both need a DB migration. See `RELEASE_NOTES_1.0.1.md`
> and `BACKEND_CHANGES_FOR_FRONTEND.md`.

---

## 1. Conventions

> **Postman:** import [`docs/Innopolis-PLM.postman_collection.json`](Innopolis-PLM.postman_collection.json).
> Set `{{baseUrl}}`, run **Auth → Login** (it stores the JWT), then run folders
> top-to-bottom — create requests capture IDs into collection variables so the
> whole flow chains automatically. Switch the login email/password to test roles.

**Base URL:** `http://<host>:7100` (default port `7100`). All API routes are under `/api`.

**Auth:** every endpoint except `POST /api/auth/login` and `GET /health` requires:
```
Authorization: Bearer <jwt>
```

**Content type:** `application/json` for all request bodies.

### Response envelope

Success:
```json
{ "success": true, "message": "Material created", "data": { ... } }
```

Paginated list:
```json
{
  "success": true,
  "message": "Materials retrieved",
  "data": [ ... ],
  "meta": { "page": 1, "pageSize": 50, "total": 213, "totalPages": 5 }
}
```

Error:
```json
{ "success": false, "error": "name is required" }
```

### HTTP status codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Validation error / bad request (see `error`) |
| 401 | Missing/invalid/expired token |
| 403 | Authenticated but role not allowed |
| 404 | Not found |
| 409 | Conflict (duplicate code, illegal delete) |
| 500 | Server error |

### ⚠️ Gotchas (read these)

1. **Numbers come back as strings.** All money/quantity fields (`unit_cost`,
   `total_value`, `on_hand`, `quantity`, `extended_cost`, …) are JSON **strings**
   (Postgres `numeric`). Parse with `Number(x)` before maths/formatting.
2. **Field names are `snake_case`** (e.g. `part_number`, `unit_cost`,
   `lead_time_days`). The mock UI used `camelCase` — add a mapping layer or
   rename as you wire real data.
3. **Dates are ISO‑8601 strings** (e.g. `2026-06-29T08:30:00.000Z`), nullable
   where noted.
4. **IDs are UUIDv7** strings (sortable by creation time).
5. **Codes are generated server-side** — never send `part_number`,
   `project_number`, `number` (BOM/RFQ/PO); they’re assigned on create.
6. **Actor/owner names come back inline** — detail views and the audit trail
   now return `*_name` / `*_initials` / `*_hue` for the relevant user(s). **Do
   not** resolve `user_id`/`owner_id` via `GET /api/users` (Administrator-only —
   403 for other roles). Read the fields directly; they’re `null` only if that
   user was later hard-deleted (fall back to “Unknown user”).

---

## 2. Roles & access (FRD §17)

`Administrator · Engineering · Commercial · Purchase · Stores · Management`

- **Administrator** bypasses all role checks (full access).
- Reads are generally open to any authenticated user.
- Writes are role-gated per module (noted on each endpoint).
- Some actions are **stage-gated** (BOM approval, PO status) — the allowed role
  depends on the record’s current state, enforced server-side; a `403`/`400`
  comes back if the current user/stage isn’t permitted.

Use roles to drive the sidebar/route guards (the mock `navForRole` already does
this — keep that mapping).

---

## 3. Auth

### `POST /api/auth/login`  (public)
```json
{ "email": "engineer@innopolis.bio", "password": "engineer123" }
```
→
```json
{ "success": true, "message": "Login successful",
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "...", "name": "Elena Vasquez", "email": "engineer@innopolis.bio",
              "role": "Engineering", "team": "Engineering", "initials": "EV", "hue": 172 }
  } }
```
Store the token; send it on every request. It expires per `JWT_EXPIRES_IN` (default 12h) → on `401`, redirect to login.

### `GET /api/auth/me`
Returns the current user object (same shape as `data.user` above).

### Password model — temporary password + forced first-login change

There is **no routine self-service password change**. Passwords are admin-managed.
A newly **created** user logs in with the password the admin set (no forced
change). When an admin **resets** a password, it becomes temporary and the user
must set their own password on next login.

**`POST /api/auth/set-password`**  (authenticated, only while flagged)
```json
{ "current_password": "<the temporary password>", "new_password": "their-own-secret" }
```
Returns `{ token, user }` — a **fresh, unrestricted token** (use it going forward).
Wrong temp → `401`. Calling it when the account is **not** flagged → `403`
(“Password changes are managed by your administrator”).

**The `must_change_password` flag & the gate.** `POST /api/auth/login` returns
`data.must_change_password`. When `true`, the issued token is **restricted**:
every endpoint **except** `/api/auth/login`, `/api/auth/set-password`,
`/api/auth/me`, `/health` returns:
```json
{ "success": false, "error": "Password change required...", "code": "PASSWORD_CHANGE_REQUIRED" }
```
with HTTP `403`. **Frontend:** on login, if `must_change_password` is `true` (or
on any `403` with `code: "PASSWORD_CHANGE_REQUIRED"`), route the user to a
“set new password” screen and call `set-password`; then store the returned token
and continue.

### User management — `/api/users` (Administrator only)
| Method | Path | Body / notes |
|--------|------|--------------|
| `POST` | `/api/users` | `{ name, email, password, role, team?, initials?, hue? }` — the user logs in with this `password` directly (**no** forced change on create); `initials` auto-derived |
| `GET` | `/api/users` *(paginated)* | params: `search` (name/email), `role`, `page`, `pageSize` |
| `GET` | `/api/users/:id` | one user |
| `PATCH` | `/api/users/:id` | profile only: `name, email, role, team, hue, is_active` (**no password here**) |
| `POST` | `/api/users/:id/reset-password` | `{ temporary_password? }` — sets a temp password + flags the user; if omitted, one is **generated and returned** as `data.temporary_password` (share it once) |
| `DELETE` | `/api/users/:id` | deactivate (soft delete) — user can no longer log in |

`role` ∈ Administrator · Engineering · Commercial · Purchase · Stores · Management.
The **`password_hash` is never returned**. Guards (→ `400`): you can’t
deactivate/delete **your own** account, and the **last active Administrator**
can’t be demoted, deactivated, or deleted.

**Demo logins** (after seeding): `admin@…/admin123`, `engineer@…/engineer123`,
`commercial@…/commercial123`, `purchase@…/purchase123`, `stores@…/stores123`,
`management@…/management123` (all `@innopolis.bio`).

---

## 4. Module 1 — Material Master (FRD §3–6)

The single source of truth for materials. The **intelligent code**
`TT-SS-MM-DDDD` is built from four master tables:

| Segment | Source endpoint | Field |
|---------|-----------------|-------|
| `TT` Material Type | `/api/material-categories` | `type_code` |
| `SS` Subtype | `/api/material-categories/:id/subtypes` | `code` |
| `MM` Major Spec | `/api/major-specs` | `code` |
| `DDDD` Detail Spec | `/api/grades` | `code` |

e.g. `MB-VA-15-3040` = Mechanical Bought-out · Valve · 15 mm · SS 304.

### Master tables (admin-only writes; reads open)

| Resource | Endpoints | Key fields |
|----------|-----------|-----------|
| Categories | `GET/POST /api/material-categories`, `GET/PATCH/DELETE /api/material-categories/:id` | `name`, `type_code`, `default_uom`, `is_active` |
| Subtypes | `GET /api/material-categories/:categoryId/subtypes`, `POST /api/subtypes`, `GET/PATCH/DELETE /api/subtypes/:id` | `category_id`, `name`, `code`, `is_active` |
| Major specs | `GET/POST /api/major-specs`, `GET/PATCH/DELETE /api/major-specs/:id` | `code`, `label`, `is_active` |
| Grades | `GET/POST /api/grades`, `GET/PATCH/DELETE /api/grades/:id` | `code`, `label`, `is_active` |
| Units | `GET/POST /api/units`, `GET/PATCH/DELETE /api/units/:id` | `code`, `name`, `is_active` |
| Resource specs | `GET/POST /api/resource-specs`, `GET/PATCH/DELETE /api/resource-specs/:id` | `code`, `name`, `description`, `is_active` |

Use these to populate the dropdowns on the “create material” form. Admins can
append new options (FRD §6). A material can have **multiple** resource specs —
render `GET /api/resource-specs` as a multi-select and submit `resource_spec_ids[]`.

### Materials — `/api/parts`

**Create** `POST /api/parts` (role: Engineering)
```json
{
  "category_id": "uuid", "subtype_id": "uuid",
  "major_spec_id": "uuid?", "grade_id": "uuid?",
  "name": "SS304 Ball Valve 15mm",
  "remarks": "", "material": "", "finish": "", "revision": "A",
  "lifecycle": "Concept", "sourcing": "Buy",
  "weight_kg": 1.2, "unit_cost": 1250.5, "last_purchase_price": 0,
  "lead_time_days": 21, "vendor_ids": ["uuid", "uuid"],
  "resource_spec_ids": ["uuid", "uuid"],
  "manufacturer_part_number": "", "make": "", "model": "", "drawing_ref": "",
  "availability": "Out of Stock",
  "stock_qty": 0, "reorder_point": 5, "min_stock": 0, "max_stock": 0,
  "stock_location": "", "uom": "Nos",
  "compliance": ["ASME"], "tags": ["critical-path"], "thumbnail_hue": 210
}
```
Only `category_id`, `subtype_id`, `name` are required. `part_number` is generated
and returned. **Code fields (`category_id`, `subtype_id`, `major_spec_id`,
`grade_id`) are immutable** — omit them on update (sending them → 400).

**Preferred vendors are many-to-many.** Send `vendor_ids` as an array of
vendor UUIDs (each must exist → else 400). On `PATCH`, omit `vendor_ids` to
leave the vendor list unchanged, or send `[]` to clear it. `GET /api/parts/:id`
returns the resolved list as `vendor_ids` (UUIDs) plus `preferred_vendors`
(full vendor objects).

**Resource specs are many-to-many** (same behaviour as vendors). Send
`resource_spec_ids` as an array of resource-spec UUIDs from
`GET /api/resource-specs` (each must exist → else 400). On `PATCH`, omit to
leave unchanged, or send `[]` to clear. `GET /api/parts/:id` returns
`resource_spec_ids` (UUIDs) plus `resource_specs` (full objects).

**List** `GET /api/parts` *(paginated)* — query params:
`search` (code/name/remarks/drawing/make), `categoryId`, `subtypeId`,
`lifecycle`, `availability`, `sourcing`, `page`, `pageSize`.

**Other:** `GET /api/parts/:id` (adds owner fields `owner_name`,
`owner_initials`, `owner_hue`, vendor fields `vendor_ids`,
`preferred_vendors`, and resource-spec fields `resource_spec_ids`,
`resource_specs`), `PATCH /api/parts/:id` (Engineering),
`DELETE /api/parts/:id` (soft delete).

**Response shape (`Part`):** `id, part_number, category_id, subtype_id,
major_spec_id, grade_id, material_type, sub_type, sub_type_code, major_spec,
detail_spec, category, name, remarks, material, finish, revision, lifecycle,
sourcing, weight_kg, unit_cost, last_purchase_price, lead_time_days,
manufacturer_part_number, make, model, drawing_ref, availability, stock_qty,
reorder_point, min_stock, max_stock, stock_location, uom, compliance[], tags[],
owner_id, thumbnail_hue, where_used_count, created_at, updated_at`. Single-record
reads (`GET /api/parts/:id`, create/update responses) additionally include
`vendor_ids` (UUID[]) + `preferred_vendors` (vendor objects) and
`resource_spec_ids` (UUID[]) + `resource_specs` (resource-spec objects).

**Enums:** `lifecycle` = Concept · In Design · In Review · Released · Production ·
Obsolete. `sourcing` = Make · Buy · Standard. `availability` = In Stock ·
Low Stock · Backorder · Out of Stock.

---

## 5. Module 3 — Vendor Database (FRD §7)

`/api/suppliers` — reads open; writes role **Purchase**.

**List** `GET /api/suppliers` *(paginated)* — params: `search` (name/code/email),
`status`, `country`, `region`, `category`, `approved` (`true`/`false`), `tier`,
`page`, `pageSize`.

**Create/Update** body (only `code`, `name` required):
```json
{ "code": "V-INOX", "name": "Inox Valves Pvt Ltd",
  "country": "India", "region": "Domestic", "category": "Mechanical Bought-out",
  "categories_supplied": ["Mechanical Bought-out","Pipe Fittings"],
  "tier": 1, "contact": "S. Mehta", "email": "sales@inox.in", "phone": "...",
  "address": "...", "gst_vat": "27AABCI...", "payment_terms": "30 days",
  "lead_time_avg": 21, "rating": 4.6, "on_time_pct": 94.5, "quality_pct": 97.2,
  "risk_score": 18, "annual_spend": 0, "status": "Preferred", "approved": true }
```
`tier` ∈ {1,2,3}. `status` = Approved · Preferred · Conditional · Under Review.
`CRUD`: `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`.

---

## 6. Module 2 — Project BOM (FRD §8–10)

### Projects — `/api/projects` (writes: Engineering)
**Create** (only `name` required): `{ name, customer?, family?, category?,
description?, engineer_id?, stage?, lifecycle?, revision?, version?,
target_cost?, quoted_price?, thumbnail_hue? }`. `project_number` auto =
`INP-{year}-{seq}`.
**List** `GET /api/projects` *(paginated)*: `search`, `stage`, `customer`, `page`, `pageSize`.
`GET/PATCH/DELETE /api/projects/:id`. **`GET /:id`** adds people fields:
`owner_name/owner_initials/owner_hue` **and** `engineer_name/engineer_initials/engineer_hue`.
**`stage`** (ProjectStage): Enquiry · Technical Evaluation · Quotation ·
Project Order · Detailed Engineering · Final BOM · Purchase Release ·
Procurement · Fulfilment · Completed.

### BOMs — `/api/project-boms` (writes: Engineering)
- `POST /` → `{ project_id, bom_type?, revision? }`. `number` auto = `BOM-{seq}`,
  starts at stage **Draft**. `bom_type` = Engineering · Procurement · Final Released.
- `GET /` *(paginated)*: `projectId`, `stage`, `page`, `pageSize`.
- `GET /:id` → **detail**: BOM + `lines[]` + `audit[]` + owner fields
  (`owner_name`, `owner_initials`, `owner_hue`). Each `audit[]` entry carries the
  actor fields (`user_name`, `user_initials`, `user_hue`).
- `PATCH /:id` → `{ bom_type?, revision? }` (not when Released).
- `DELETE /:id` (Draft only, or Administrator).

**BOM response:** `id, number, project_id, bom_type, stage, revision,
line_items, unique_materials, total_value, critical_items, long_lead_items,
owner_id, created_at, updated_at` (+ `lines`, `audit` on detail).

### BOM lines
- `POST /api/project-boms/:bomId/lines` (Engineering, BOM must be Draft):
  `{ part_id, quantity, vendor_id?, ref_designator?, remarks?, buying_notes?,
  drawing_ref?, is_critical?, unit_cost? }`. The material is **snapshotted**
  (part_number/name/cost/lead time copied); `extended_cost = quantity × unit_cost`.
- `GET /api/project-boms/:bomId/lines`
- `PATCH /api/bom-lines/:id`, `DELETE /api/bom-lines/:id` (Engineering, Draft only)

**Line fields:** `id, bom_id, part_id, find_number, level, parent_line_id,
part_number, name, description, category, uom, unit_cost, procurement,
lead_time_days, material_revision, quantity, extended_cost, ref_designator,
remarks, buying_notes, drawing_ref, vendor_id, is_critical`.

### Approval workflow — `POST /api/project-boms/:id/transition`
Body: `{ "action": "advance" | "reject", "comment": "..." }`
```
Draft ─▶ Technical Review ─▶ Commercial Review ─▶ Approved ─▶ Released for Purchase
(Engineering)   (Engineering)      (Commercial)      (Purchase)
```
- `advance` moves to the next stage; the role above must match the **current**
  stage (Administrator always allowed). Can’t submit an empty BOM; can’t advance
  past the last stage.
- `reject` sends the BOM back to **Draft**.
- Returns the updated BOM + `audit[]`. Each audit entry:
  `{ from_stage, to_stage, action, comment, user_id, created_at,
  user_name, user_initials, user_hue }` — the actor's display fields are
  included, so render the name/avatar straight from the entry.
- **Lines lock** once the BOM leaves Draft.

### BOM analysis — `GET /api/project-boms/:id/analysis?groupBy=`
`groupBy` = `category` | `vendor` | `leadtime` | `procurement`. Returns:
```json
{ "bomId":"...", "dimension":"category", "total":"12800.00",
  "groups":[ { "key":"Mechanical Bought-out", "lineItems":2,
               "totalValue":"12800.00", "pctOfTotal":100 } ] }
```
Drives the “BOM by supplier / category / lead-time / cost” views (FRD §11).

---

## 7. Module 4 — Procurement (FRD §11–13)

### RFQ — `/api/rfqs` (writes: Purchase)
- `POST /` — generate from a released BOM **or** ad hoc:
```json
{ "title": "Fermenter valves", "mode": "Vendor-wise",
  "vendor_ids": ["uuid","uuid"],
  "from_bom_id": "uuid",          // copies the BOM's lines
  "category": "Piping",            // with mode=Category-wise, filters BOM lines
  "required_date": "2026-08-01T00:00:00Z",
  "lines": [ { "part_id":"uuid", "quantity":4, "specification":"", "buying_notes":"" } ] // if no from_bom_id
}
```
  `number` auto = `RFQ-{seq}`, starts **Draft**. `mode` = Vendor-wise ·
  Category-wise · Package-wise · Single Item · Bulk.
- `GET /` *(paginated)*: `search`, `status`, `projectId`, `page`, `pageSize`.
- `GET /:id` → detail: RFQ + `lines[]` + `quotations[]` + owner fields
  (`owner_name`, `owner_initials`, `owner_hue`).
- `PATCH /:id` (Draft only), `DELETE /:id` (Draft only).
- `POST /:id/send` → Draft → **Sent** (issue to vendors).
- **`status`** (RfqStatus): Draft · Sent · Quotes In · Comparison · Awarded · Closed.

### Quotations
- `POST /api/rfqs/:id/quotations` (Purchase) — record a vendor’s quote (RFQ must
  be sent; one per vendor):
```json
{ "vendor_id":"uuid", "lead_time_days":20, "payment_terms":"30 days",
  "validity_days":30, "delivery_terms":"FOR site",
  "lines":[ { "rfq_line_id":"uuid", "unit_price":1150, "lead_time_days":20, "remarks":"" } ] }
```
  Totals computed server-side; bumps `quotes_received` and moves RFQ Sent→Quotes In.
- `GET /api/rfqs/:id/quotations`
- `GET /api/rfqs/:id/comparison` (Purchase, Commercial) → ranked list:
```json
{ "rfqId":"...", "recommended": { ...cheapest }, "quotations":[ { "rank":1, "score":100, ... } ] }
```
  Cheapest = rank 1, score 100; others scaled. Sets RFQ → Comparison.
- `GET /api/quotations/:id` → quotation + `lines[]`.
- `POST /api/quotations/:id/award` (Purchase, Commercial) → winner Awarded, rest
  Rejected, RFQ → Awarded.
- **`status`** (QuotationStatus): Pending · Received · Under Review · Awarded · Rejected.

### Purchase Orders — `/api/purchase-orders` (writes: Purchase)
- `POST /` — from an awarded quotation **or** manual:
```json
{ "from_quotation_id": "uuid" }
// — or —
{ "supplier_id":"uuid", "project_id":"uuid?", "priority":"High",
  "expected_date":"2026-08-15T00:00:00Z",
  "lines":[ { "part_id":"uuid", "quantity":20, "unit_price":4800 } ] }
```
  `number` auto = `PO-{seq}`, starts **Draft**. `priority` = Low·Medium·High·Critical.
- `GET /` *(paginated)*: `search`, `status`, `supplierId`, `page`, `pageSize`.
- `GET /:id` → PO + `lines[]` + owner fields (`owner_name`, `owner_initials`,
  `owner_hue`).
- `POST /:id/status` → `{ "status": "Open" }`. **Manual** transitions only:
  `Draft→Pending Approval→Open`, `Partially Received→Closed` (short-close),
  `Received→Closed`; `Cancelled` from any non-terminal. Illegal jumps → 400.
  ⚠️ **`Received` and `Partially Received` are NOT settable here** — they are
  set only by recording a goods receipt. Posting either to `/status` returns 400
  (“…set by recording a goods receipt, not by the status pipeline…”). Drive
  receiving through `/receive`, not `/status`.
- `POST /:id/receive` (Purchase, Stores) → goods receipt (see Inventory §8).
- `DELETE /:id` (Draft/Cancelled only).
- **`status`** (PoStatus): Draft · Pending Approval · Open · Partially Received ·
  Received · Closed · Cancelled.

---

## 8. Module 5 — Inventory (FRD §14)

### Warehouses — `/api/warehouses` (writes: Stores)
CRUD. Create body (only `code`,`name` required): `{ code, name, type?, city?,
country?, capacity_pct?, lat?, lng? }`. `type` = Distribution · Manufacturing ·
Buffer · Transit. `GET /:id` returns the warehouse **plus a live summary**:
`skuCount`, `stockValue`, `lowStockItems`.

### Stock — `/api/inventory`
- `GET /` *(paginated)* — stock balances (one per part+warehouse). Params:
  `search`, `warehouseId`, `partId`, `status`, `lowStock` (`true`), `page`, `pageSize`.
  Balance fields: `id, part_id, warehouse_id, part_number, part_name,
  warehouse_code, on_hand, reserved, available, incoming, reorder_point,
  unit_cost, uom, status`.
- `GET /movements` *(paginated)* — the stock ledger. Params: `partId`,
  `warehouseId`, `type`, `page`, `pageSize`. Movement fields: `type, direction,
  quantity, unit_cost, inspection_status, rejected_qty, batch, reference,
  reference_id, note, user_id, created_at, user_name, user_initials, user_hue`.
  (The acting user's display fields are included — render them directly.)
  `type` = opening · purchase ·
  sale_consumption · adjustment · wastage · transfer_in · transfer_out.
- `GET /alerts` — balances at/below reorder point.
- `POST /opening` (Stores) → `{ part_id, warehouse_id, quantity, unit_cost?,
  reorder_point?, batch?, note? }`.
- `POST /adjust` (Stores) → `{ part_id, warehouse_id, direction:"in"|"out",
  quantity, wastage?, note? }`.
- `POST /transfer` (Stores) → `{ part_id, from_warehouse_id, to_warehouse_id,
  quantity, note? }`.

Every posting updates the balance, derives `status` (In Stock / Low Stock /
Out of Stock vs reorder point), and **syncs the material’s `stock_qty` +
`availability`**. Drawing more than on-hand → 400.

### PO goods receipt → stock
`POST /api/purchase-orders/:id/receive` (Purchase, Stores):
```json
{ "warehouse_id": "uuid",
  "lines": [ { "po_line_id":"uuid", "received_qty":20, "rejected_qty":2, "batch":"B-77" } ] }
```
- **`warehouse_id` is REQUIRED** — omitting it → 400 (“warehouse_id is required
  to receive goods”). Every receipt posts stock into a real warehouse; a PO can
  never reach `Received` without inventory actually moving.
- **`received_qty` is GROSS** — the total delivered = **accepted + rejected**.
  The backend books `accepted = received_qty − rejected_qty` into stock as a
  `purchase` movement; **rejected qty never enters inventory** (FRD §14). So to
  accept 18 and reject 2, send `received_qty: 20, rejected_qty: 2`.
- Updates each line’s `received_qty` and the PO `received_pct` / status — the PO
  becomes `Received` when every line is fully received, else `Partially Received`.
  This is the **only** way to reach those two statuses (see §7 `/status`).

---

## 9. Module 6 — Reports & Analytics (FRD §15)

All `GET`, any authenticated role (the UI surfaces the role-relevant ones).

| Endpoint | Returns |
|----------|---------|
| `/api/reports/dashboard` | `{ projects, materials, vendors, openRfqs, openPurchaseOrders, stockValue, lowStockItems, committedPoValue, bomsByStage:[{stage,count}] }` |
| `/api/reports/procurement/purchase-value` | `[{ status, count, value }]` |
| `/api/reports/procurement/vendor-performance` | `[{ id, name, code, tier, rating, onTimePct, qualityPct, riskScore, status, poCount, poSpend }]` |
| `/api/reports/inventory/stock-value` | `[{ warehouseId, code, name, skuCount, stockValue, lowStockItems }]` |
| `/api/reports/commercial/vendor-spend` | `[{ supplierId, supplierName, poCount, spend }]` |
| `/api/reports/commercial/project-cost` | `[{ projectId, projectNumber, name, customer, stage, bomCount, bomValue }]` |

---

## 10. End-to-end flow (happy path)

```
1. Login                          POST /api/auth/login
2. Create material masters        POST /api/material-categories ... /api/parts
3. Create a project               POST /api/projects
4. Create a BOM + add lines       POST /api/project-boms ; POST /:id/lines
5. Submit through approvals       POST /api/project-boms/:id/transition (×4)
6. Analyse the BOM                GET  /api/project-boms/:id/analysis?groupBy=category
7. Raise + send an RFQ            POST /api/rfqs (from_bom_id) ; POST /:id/send
8. Record vendor quotes           POST /api/rfqs/:id/quotations
9. Compare + award                GET  /api/rfqs/:id/comparison ; POST /api/quotations/:id/award
10. Raise a PO                    POST /api/purchase-orders (from_quotation_id)
11. Open + receive into stock     POST /:id/status {Open} ; POST /:id/receive {warehouse_id,...}
12. Dashboards & reports          GET  /api/reports/*
```

---

## 11. Suggested frontend data layer

- One `apiFetch(path, opts)` wrapper that injects the `Authorization` header,
  parses the envelope, throws on `success:false`, and redirects to login on 401.
- A `toNumber()` helper applied at the model boundary for all numeric fields.
- React Query keys per resource (`['parts', filters]`, `['bom', id]`, …);
  invalidate the BOM detail after line mutations and transitions (aggregates and
  stage change server-side).
- Drive the sidebar/route guards from the logged-in `role` (reuse the mock
  `navForRole`).
