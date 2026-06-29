import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  numeric,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { supplierStatusEnum } from "./enum";

// Vendor Master (FRD §7) — matches the frontend `Supplier` contract. Vendors are
// referenced by Material Master (preferred supplier) and, later, by Procurement
// (RFQ/PO). Performance metrics (rating, on-time %, spend, open POs) are stored
// here and maintained operationally by the Procurement/Inventory modules.
export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey(),

    code: varchar("code", { length: 24 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),

    // ── Classification ───────────────────────────────────────────────────────
    country: varchar("country", { length: 80 }).default("India").notNull(),
    region: varchar("region", { length: 40 }).default("Domestic").notNull(),
    category: varchar("category", { length: 80 }).default("").notNull(),
    categories_supplied: jsonb("categories_supplied")
      .$type<string[]>()
      .default([])
      .notNull(),
    tier: smallint("tier").default(3).notNull(), // 1 | 2 | 3

    // ── Contact (FRD §7) ─────────────────────────────────────────────────────
    contact: varchar("contact", { length: 120 }).default("").notNull(),
    email: varchar("email", { length: 254 }).default("").notNull(),
    phone: varchar("phone", { length: 40 }).default("").notNull(),
    address: text("address").default("").notNull(),
    gst_vat: varchar("gst_vat", { length: 40 }).default("").notNull(),

    // ── Commercial terms ─────────────────────────────────────────────────────
    payment_terms: varchar("payment_terms", { length: 80 })
      .default("")
      .notNull(),
    lead_time_avg: integer("lead_time_avg").default(0).notNull(),

    // ── Performance metrics ──────────────────────────────────────────────────
    rating: numeric("rating", { precision: 3, scale: 2 }).default("0").notNull(), // 0-5
    on_time_pct: numeric("on_time_pct", { precision: 5, scale: 2 })
      .default("0")
      .notNull(),
    quality_pct: numeric("quality_pct", { precision: 5, scale: 2 })
      .default("0")
      .notNull(),
    risk_score: numeric("risk_score", { precision: 5, scale: 2 })
      .default("0")
      .notNull(), // 0-100, higher = riskier
    parts_supplied: integer("parts_supplied").default(0).notNull(),
    open_pos: integer("open_pos").default(0).notNull(),
    annual_spend: numeric("annual_spend", { precision: 18, scale: 2 })
      .default("0")
      .notNull(),

    // ── Status (FRD §7) ──────────────────────────────────────────────────────
    status: supplierStatusEnum("status").default("Under Review").notNull(),
    approved: boolean("approved").default(false).notNull(),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    codeUnique: uniqueIndex("suppliers_code_unique")
      .on(table.code)
      .where(sql`${table.deleted_at} is null`),
    nameIndex: index("suppliers_name_idx").on(table.name),
    statusIndex: index("suppliers_status_idx").on(table.status),
  })
);

export type Supplier = InferSelectModel<typeof suppliers>;
export type NewSupplier = InferInsertModel<typeof suppliers>;
