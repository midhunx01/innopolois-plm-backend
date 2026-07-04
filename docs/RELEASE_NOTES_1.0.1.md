# Release Notes — v1.0.1

**Release date:** 2026-07-04
**Component:** Innopolis PLM backend (`innopolis-plm-backend`)
**Previous version:** 1.0.0

This release adds support for **multiple preferred vendors per material** and
renames the material `description` field to `remarks`. Both changes touch the
Material Master API contract and require a database migration.

---

## Highlights

| # | Change | Type | Migration |
|---|--------|------|-----------|
| 1 | Materials can have **multiple preferred vendors** | ✨ Feature · ⚠️ breaking | Required |
| 2 | Material `description` → `remarks` | 🔧 Change · ⚠️ breaking | Required |

---

## 1. Multiple preferred vendors per material ✨

Previously a material referenced a **single** preferred vendor (`supplier_id`).
A material can now list **several** preferred vendors.

**What changed**
- The single `parts.supplier_id` foreign key is replaced by a many-to-many join
  table, `part_vendors` (a material ↔ vendor relation).
- The API field is now `vendor_ids` — an array of vendor UUIDs — matching the
  `vendor_id` convention already used on BOM lines.
- BOM lines default their vendor to the material's **first** preferred vendor
  when one isn't chosen explicitly.

**API contract**
```jsonc
// POST / PATCH /api/parts
{
  // ...other material fields...
  "vendor_ids": ["<vendorUuid>", "<vendorUuid>"]   // replaces supplier_id
}
```
- `vendor_ids` is optional; every id must be an existing vendor → else **400**.
- On `PATCH`: **omit** `vendor_ids` to leave the list unchanged; send `[]` to clear it.

Single-material reads (`GET /api/parts/:id`, and create/update responses) now return:

| Field | Type | Use |
|-------|------|-----|
| `vendor_ids` | string[] | Vendor UUIDs, in the order they were set |
| `preferred_vendors` | vendor[] | Full vendor objects for direct display |

> ⚠️ **Breaking:** `supplier_id` no longer exists on a material. The migration
> **drops** the old column — any previously-stored single preferred vendor is
> **not** carried over (accepted for this MVP). Re-assign vendors after upgrade.

---

## 2. Material `description` renamed to `remarks` 🔧

The free-text `description` field on a **material** is renamed to `remarks`
(same `text` type, same behaviour).

**API contract**
```jsonc
// POST / PATCH /api/parts
{
  // ...other material fields...
  "remarks": "2-way ball valve"   // was: "description"
}
```
- The material `search` parameter still matches this field (now `remarks`).
- This is a **column rename**, so existing values **are preserved**.

> ⚠️ **Breaking (naming only):** the request/response field name changes from
> `description` to `remarks`. **Scope is the material only** — the `description`
> fields on **BOM lines** and **projects** are unchanged.

---

## Database migrations

Two migrations ship with this release (in `src/db/migrations/`):

| Migration | Effect |
|-----------|--------|
| `0001_glamorous_ma_gnuci.sql` | Create `part_vendors`; drop `parts.supplier_id` |
| `0002_material_remarks.sql` | Rename `parts.description` → `parts.remarks` |

**Apply on deploy:**
```bash
npm run db:push
```

> ⚠️ Migration `0001` **drops** `parts.supplier_id`. Take a backup first if any
> preferred-vendor data must be retained.

---

## Upgrade checklist

**Backend / deploy**
- [ ] Pull `v1.0.1`, `npm install`, rebuild.
- [ ] Back up the database (migration `0001` is destructive on `parts.supplier_id`).
- [ ] Run `npm run db:push`.
- [ ] Restart the service.

**Frontend**
- [ ] Change the material vendor picker from single-select to **multi-select**;
      send `vendor_ids: string[]` instead of `supplier_id`.
- [ ] Render preferred vendors from `preferred_vendors` (or `vendor_ids`).
- [ ] Rename the material `description` field → `remarks` on create/update and
      read views.
- [ ] Remove all reads/writes of the old `supplier_id` field on materials.

Full frontend migration detail: `BACKEND_CHANGES_FOR_FRONTEND.md` (Parts C & D).

---

## Affected endpoints

| Endpoint | Change |
|----------|--------|
| `POST /api/parts` | `supplier_id` → `vendor_ids[]`; `description` → `remarks` |
| `PATCH /api/parts/:id` | `supplier_id` → `vendor_ids[]`; `description` → `remarks` |
| `GET /api/parts/:id` | returns `vendor_ids` + `preferred_vendors`; `remarks` replaces `description` |
| `GET /api/parts` | `search` matches `remarks` (was `description`) |

No other modules changed their contract. Purchase Orders keep their own single
`supplier_id`; BOM lines and RFQ lines keep their own `vendor_id` / `description`.
