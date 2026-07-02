# Material Master API — Frontend Guide

**Module 1 · Material Master (FRD §3–6)**

This document covers the **Material Master** module for frontend development. It starts with **Category Management** (Material Types). Additional sub-modules (Subtypes, Major Specs, Grades, Units, Parts) will be added as separate sections.

---

## 1. Conventions (read first)

### Base URL
```
http://<host>:<port>/api
```
All endpoints in this document are relative to `/api`.

### Authentication
Every Material Master endpoint requires a **Bearer JWT** in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Obtain the token from `POST /api/auth/login`. If the token is missing or malformed you get **401**; if it is expired/invalid you also get **401**.

> **Password-change gate:** If the logged-in user still holds a temporary "must change password" token, every non-allow-listed request returns **403** with `code: "PASSWORD_CHANGE_REQUIRED"`. The UI must redirect the user to the set-password flow before calling Material Master APIs.

### Authorization (roles)
- **Read** endpoints (`GET`): any authenticated user.
- **Write** endpoints (`POST`, `PATCH`, `DELETE`): **Administrator only** (FRD §6 — "Only administrators shall create or modify master data").

A non-admin calling a write endpoint gets **403 Access denied**.

### Standard response envelope

**Success** — always this shape:
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
```
`data` is an object or an array depending on the endpoint.

**Error** — always this shape:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```
(The password-change error additionally carries a `code` field.)

### HTTP status codes used
| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Successful GET / PATCH / DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation failed / malformed JSON / invalid UUID |
| 401 | Unauthorized | Missing / invalid / expired token |
| 403 | Forbidden | Not an Administrator, or password change required |
| 404 | Not Found | Resource ID does not exist |
| 409 | Conflict | Duplicate `name` or `type_code` |
| 500 | Internal Error | Unexpected server error |

---

## 2. Category Management (Material Types)

A **Category** = a *Material Type* (FRD §3–4). These are the top-level classification of every material (e.g. "Fasteners", "Raw Metal"). There are ~14 configurable categories out of the box, and Administrators may add / edit / delete them.

The `type_code` is important: it is the **`TT` segment of the intelligent material code**. Codes are stored **uppercase** and **trimmed** (the server normalizes them), and must be unique.

### 2.1 The Category object
```json
{
  "id": "018f...-uuid-v7",
  "name": "Fasteners",
  "type_code": "FS",
  "default_uom": "Nos",
  "is_active": true,
  "created_at": "2026-07-02T10:15:00.000Z",
  "updated_at": "2026-07-02T10:15:00.000Z",
  "deleted_at": null
}
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | string (UUID v7) | Server-generated. Use in path params. |
| `name` | string | Unique (among non-deleted). 1–80 chars. |
| `type_code` | string | Unique (among non-deleted). 1–4 chars. Stored UPPERCASE. The `TT` code segment. |
| `default_uom` | string | Default unit of measure. Defaults to `"Nos"`. Max 16 chars. |
| `is_active` | boolean | Defaults to `true`. Use to hide a category from pickers without deleting it. |
| `created_at` | ISO 8601 string | Server-set. |
| `updated_at` | ISO 8601 string | Server-set. |
| `deleted_at` | ISO 8601 string / null | Soft-delete marker. Always `null` in API results (deleted rows are hidden). |

---

### 2.2 Create a category
Create a new Material Type.

```
POST /api/material-categories
```
**Auth:** Administrator

**Request body**
```json
{
  "name": "Fasteners",
  "type_code": "FS",
  "default_uom": "Nos",
  "is_active": true
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `name` | ✅ | string, 1–80 chars |
| `type_code` | ✅ | string, 1–4 chars (normalized to uppercase server-side) |
| `default_uom` | ❌ | string, 1–16 chars. Defaults to `"Nos"` if omitted |
| `is_active` | ❌ | boolean. Defaults to `true` |

> Any field not in this list is rejected → **400** "Unexpected fields in create-category request".

**Success — 201**
```json
{
  "success": true,
  "message": "Category created",
  "data": {
    "id": "018f...",
    "name": "Fasteners",
    "type_code": "FS",
    "default_uom": "Nos",
    "is_active": true,
    "created_at": "2026-07-02T10:15:00.000Z",
    "updated_at": "2026-07-02T10:15:00.000Z",
    "deleted_at": null
  }
}
```

**Errors**
- `400` — missing/invalid field (e.g. `"name is required"`, `"type_code must be at most 4 characters"`).
- `409` — `"A category with type code \"FS\" already exists"` or `"A category named \"Fasteners\" already exists"`.

---

### 2.3 List all categories
Returns all non-deleted categories, sorted by `name` ascending.

```
GET /api/material-categories
```
**Auth:** Any authenticated user

> Note: this endpoint returns the **full list** (no pagination and no query filters). Filter/search client-side, or use `is_active` to render active vs. inactive.

**Success — 200**
```json
{
  "success": true,
  "message": "Categories retrieved",
  "data": [
    {
      "id": "018f...",
      "name": "Fasteners",
      "type_code": "FS",
      "default_uom": "Nos",
      "is_active": true,
      "created_at": "2026-07-02T10:15:00.000Z",
      "updated_at": "2026-07-02T10:15:00.000Z",
      "deleted_at": null
    }
  ]
}
```

---

### 2.4 Get a single category
```
GET /api/material-categories/:id
```
**Auth:** Any authenticated user

**Path params:** `id` — category UUID.

**Success — 200**
```json
{
  "success": true,
  "message": "Category retrieved",
  "data": { "id": "018f...", "name": "Fasteners", "...": "..." }
}
```

**Errors**
- `400` — `id` is not a valid UUID.
- `404` — `"Category not found"`.

---

### 2.5 Update a category
Partial update — send only the fields you want to change.

```
PATCH /api/material-categories/:id
```
**Auth:** Administrator

**Path params:** `id` — category UUID.

**Request body** (all fields optional, at least send one)
```json
{
  "name": "Fasteners & Hardware",
  "type_code": "FS",
  "default_uom": "Set",
  "is_active": false
}
```
Same field rules as create. Unknown fields → **400** "Unexpected fields in update-category request".

**Success — 200**
```json
{
  "success": true,
  "message": "Category updated",
  "data": { "id": "018f...", "name": "Fasteners & Hardware", "...": "..." }
}
```

**Errors**
- `400` — invalid UUID or invalid field value.
- `404` — `"Category not found"`.
- `409` — new `name` / `type_code` collides with another category.

---

### 2.6 Delete a category
**Soft delete** — the row is marked deleted and disappears from all listings, but is retained in the database.

```
DELETE /api/material-categories/:id
```
**Auth:** Administrator

**Path params:** `id` — category UUID.

**Success — 200**
```json
{
  "success": true,
  "message": "Category deleted",
  "data": { "message": "Category deleted successfully" }
}
```

**Errors**
- `400` — invalid UUID.
- `404` — `"Category not found"` (also returned if it was already deleted).

---

### 2.7 List subtypes of a category (nested)
Convenience endpoint to fetch all Subtypes that belong to a given category. (Full Subtype CRUD lives under `/api/subtypes` — documented in the Subtypes section.)

```
GET /api/material-categories/:categoryId/subtypes
```
**Auth:** Any authenticated user

**Path params:** `categoryId` — category UUID.

**Success — 200**
```json
{
  "success": true,
  "message": "Subtypes retrieved",
  "data": [ { "id": "...", "category_id": "018f...", "name": "Bolts", "...": "..." } ]
}
```

**Errors**
- `400` — invalid UUID.
- `404` — parent category not found.

---

## 3. Quick reference — Category endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/material-categories` | Admin | Create category |
| `GET` | `/api/material-categories` | Any | List all categories |
| `GET` | `/api/material-categories/:id` | Any | Get one category |
| `PATCH` | `/api/material-categories/:id` | Admin | Update category |
| `DELETE` | `/api/material-categories/:id` | Admin | Soft-delete category |
| `GET` | `/api/material-categories/:categoryId/subtypes` | Any | List subtypes of a category |

---

## 4. Frontend implementation notes

- **Uppercase codes:** `type_code` is normalized server-side, so `"fs"` and `"FS"` are the same. You may uppercase in the UI for consistency, but it isn't required.
- **Uniqueness UX:** Handle `409` on both create and update to show inline "already exists" errors on the `name` and `type_code` fields. The `error` message tells you which one collided.
- **Active toggle:** Prefer setting `is_active: false` over deleting when a category should stop appearing in new-material pickers but must remain valid for existing materials/history.
- **Dropdowns:** Use `GET /api/material-categories` to populate Material Type selectors. Filter `is_active === true` for creation forms.
- **Field validation (mirror server rules):** `name` 1–80 chars, `type_code` 1–4 chars, `default_uom` ≤16 chars. Validating client-side avoids round-trip 400s.
- **No pagination:** The list endpoint returns everything; safe because categories are a small, bounded set (~14).
