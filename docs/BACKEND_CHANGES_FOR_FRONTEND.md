# Backend Changes — Frontend Action Required

**Date:** 2026-07-03 · **Audience:** Frontend developer

Three backend updates change the API contract. Each is summarized here with exactly what the frontend needs to do.

- **Part A — User attribution (audit trail & owners):** person names now come back on the record itself; stop resolving them via the admin-only users list.
- **Part B — PO receipt & status (bug F1):** `Received` can no longer be faked; the receive call now requires a warehouse.
- **Part C — Multiple preferred vendors per material:** `supplier_id` is replaced by a `vendor_ids[]` list.

Parts A and B are **live after a server rebuild/restart**. **Part C also requires a database migration** (`npm run db:push`) — see that section.

---

## Part A · User attribution is now returned inline

### The problem this fixes
Audit-trail and owner names were only visible to **Administrators**. The UI resolved a `user_id`/`owner_id` → name by fetching `GET /api/users`, which is **Administrator-only** (returns `403` for every other role). So non-admin users saw blank actors (e.g. the BOM approval audit trail showed no name/avatar).

### What changed
The affected read endpoints now **join the user and return their display fields directly** on each record — no separate lookup needed. Fields are additive; existing id fields are unchanged.

The three display fields (matching the login `user` shape) are:

| Field | Type | Use |
|-------|------|-----|
| `*_name` | string \| null | Display name |
| `*_initials` | string \| null | Avatar text |
| `*_hue` | number \| null | Avatar colour (HSL hue) |

### Endpoints & new fields

| Endpoint | Where | New fields |
|----------|-------|-----------|
| `GET /api/project-boms/:id` | each `audit[]` entry | `user_name`, `user_initials`, `user_hue` |
| `GET /api/project-boms/:id` | BOM object | `owner_name`, `owner_initials`, `owner_hue` |
| `POST /api/project-boms/:id/transition` | each `audit[]` entry | `user_name`, `user_initials`, `user_hue` |
| `GET /api/inventory/movements` | each `rows[]` movement | `user_name`, `user_initials`, `user_hue` |
| `GET /api/purchase-orders/:id` | PO object | `owner_name`, `owner_initials`, `owner_hue` |
| `GET /api/projects/:id` | project object | `owner_*` **and** `engineer_*` |
| `GET /api/rfqs/:id` | RFQ object | `owner_name`, `owner_initials`, `owner_hue` |
| `GET /api/parts/:id` | part object | `owner_name`, `owner_initials`, `owner_hue` |

### Example — BOM audit trail
```jsonc
// GET /api/project-boms/018f... → data.audit[]
{
  "id": "018f...",
  "from_stage": "Commercial Review",
  "to_stage": "Approved",
  "action": "advance",
  "comment": "QA advance by Commercial",
  "user_id": "018e...",
  "created_at": "2026-07-02T17:44:00.000Z",
  "user_name": "Test Commercial",   // ← new
  "user_initials": "TC",            // ← new
  "user_hue": 150                   // ← new
}
```

### Frontend action
1. **Stop calling `GET /api/users`** to resolve actor/owner names. Read the fields straight off the record:
   ```js
   entry.user_name / entry.user_initials / entry.user_hue     // audit rows, stock movements
   po.owner_name / project.engineer_name / rfq.owner_name     // detail views
   ```
2. **Handle `null`** — a field is `null` only if that user was later hard-deleted. Fall back to e.g. "Unknown user".
3. After switching, the actor/avatar renders for **every role**, not just Administrator.

### Scope note (so there are no surprises)
Only **detail views** (`GET .../:id`) and the **movements list** were enriched — those are the screens that display a person. The paginated **list/table** endpoints (`GET /api/projects`, `/api/purchase-orders`, `/api/rfqs`, `/api/parts`, `/api/project-boms`) were **not** changed. If any table needs owner names, tell backend which one and it can be extended.

---

## Part B · Purchase Order receipt & status (bug F1)

Background: POs were reaching `Received` with **no stock movement**. Root causes and the resulting contract changes:

### B1 · `Received` / `Partially Received` can no longer be set via the status pipeline
`POST /api/purchase-orders/:id/status` **rejects** `Received` and `Partially Received` with `400`:
> `"Received" is set by recording a goods receipt, not by the status pipeline. Receive goods via POST /api/purchase-orders/:id/receive.`

These two states are **receipt-derived** — they are set *only* by the receive endpoint, which posts real stock and computes `received_pct` from actual quantities.

**Allowed manual status transitions now:**

| From | Can move to (via `/status`) |
|------|------------------------------|
| `Draft` | `Pending Approval`, `Open`, `Cancelled` |
| `Pending Approval` | `Open`, `Draft`, `Cancelled` |
| `Open` | `Cancelled` |
| `Partially Received` | `Closed` (short-close), `Cancelled` |
| `Received` | `Closed` |
| `Closed` / `Cancelled` | — (terminal) |

To advance a PO through receiving, call the **receive** endpoint (below), not `/status`.

### B2 · `warehouse_id` is now REQUIRED on receive
`POST /api/purchase-orders/:id/receive` now requires `warehouse_id`. Omitting it returns `400`:
> `"warehouse_id is required to receive goods"`

This guarantees every receipt posts stock into a real warehouse — a receipt can never flip a PO to `Received` without inventory actually moving. *(The receive dialog already sends a warehouse, so no UI change is expected — this just formalizes it.)*

### B3 · `received_qty` is GROSS (unchanged behaviour, stated explicitly)
On each receive line, `received_qty` is the **gross** quantity delivered (accepted **plus** rejected). The backend books `accepted = received_qty − rejected_qty` into stock; rejected units are recorded on the movement but never enter on-hand.

> **Send `received_qty = accepted + rejected`.** (This is the F1a fix — sending only the accepted amount under-books stock and leaves the line falsely open.)

### Receive request — correct shape
```jsonc
// POST /api/purchase-orders/018f.../receive     role: Purchase or Stores
{
  "warehouse_id": "018f...",          // REQUIRED
  "lines": [
    {
      "po_line_id": "018f...",
      "received_qty": 7,               // GROSS: 6 accepted + 1 rejected
      "rejected_qty": 1,              // optional, defaults 0
      "batch": "LOT-2026-07"          // optional
    }
  ]
}
```
Result for the example: line records **7/7** (closed), **6** units enter stock in the warehouse, **1** excluded. When all lines are fully received the PO becomes `Received`; otherwise `Partially Received`.

### Frontend action
1. Never send `Received`/`Partially Received` to `/status` — drive receiving through `/receive`.
2. Always include `warehouse_id` in the receive payload.
3. Send `received_qty` as **accepted + rejected** (gross).

---

## Part C · Materials now support multiple preferred vendors

### The problem this fixes
A material could only reference **one** preferred vendor (`supplier_id`). Procurement needs several approved vendors per material.

### What changed — ⚠️ breaking + requires a DB migration
The single `supplier_id` field on a material is **replaced** by a list, `vendor_ids`. This is a many-to-many relation (`part_vendors` join table). Apply the migration on deploy (`npm run db:push`); the old `supplier_id` column is dropped, so any previously-stored preferred vendor is not carried over.

**Create / update** `POST` / `PATCH /api/parts`
```jsonc
{
  // ...other material fields...
  "vendor_ids": ["<vendorUuid>", "<vendorUuid>"]   // replaces supplier_id
}
```
- `vendor_ids` is optional; every id must be an existing vendor → else **400**.
- On `PATCH`: **omit** `vendor_ids` to leave the vendor list untouched; send `[]` to clear it.

**Read** `GET /api/parts/:id` (and create/update responses) now return:

| Field | Type | Use |
|-------|------|-----|
| `vendor_ids` | string[] | Vendor UUIDs, in the order they were set |
| `preferred_vendors` | vendor[] | Full vendor objects for direct display |

`supplier_id` no longer exists on the material — remove any reads/writes of it.

### Frontend action
1. Change the material form's vendor picker from single-select to **multi-select**, sending `vendor_ids: string[]`.
2. Render preferred vendors from `preferred_vendors` (or `vendor_ids`) on the material detail view.
3. Remove all reads/writes of the old `supplier_id` field on materials.

---

## Quick checklist

- [ ] Read actor/owner names from the record fields; remove the `GET /api/users` lookup for name resolution.
- [ ] Fall back gracefully when a `*_name` field is `null`.
- [ ] Remove any UI path that sets PO status to `Received`/`Partially Received` directly.
- [ ] Ensure the receive payload always includes `warehouse_id`.
- [ ] Confirm receive sends **gross** `received_qty` (accepted + rejected).
- [ ] Switch the material vendor picker to multi-select sending `vendor_ids[]`; stop using `supplier_id`.
