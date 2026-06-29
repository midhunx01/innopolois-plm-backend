# Innopolis PLM — Backend

BOM & Procurement / PLM backend for **Innopolis Bio Innovations**. The
Material Master is the single source of truth ("Engineering Data Backbone");
Project BOM, Vendors, Procurement, Inventory and Reports build around it.

Implements the Innopolis BOM FRD v1.0. **Module 1 (Material Master, FRD §3–6)
is implemented**; the remaining modules follow the same layered pattern.

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

## Demo logins (after `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@innopolis.bio | admin123 |
| Engineering | engineer@innopolis.bio | engineer123 |
| Commercial | commercial@innopolis.bio | commercial123 |
| Purchase | purchase@innopolis.bio | purchase123 |
| Stores | stores@innopolis.bio | stores123 |
| Management | management@innopolis.bio | management123 |
