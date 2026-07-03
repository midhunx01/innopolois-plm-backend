import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { lifecycleEnum, sourcingTypeEnum, availabilityEnum } from "./enum";
import { materialCategories } from "./material-categories";
import { subtypes } from "./subtypes";
import { majorSpecs } from "./major-specs";
import { grades } from "./grades";
import { users } from "./users";

// The Material Master record (FRD §3, §5) — the single source of truth. Every
// BOM line references one of these. `part_number` is the intelligent code
// TT-SS-MM-DDDD and is the unique business identifier. The code-segment fields
// (material_type, sub_type, etc.) are denormalised from the master tables at
// create time so listings/exports match the frontend `Part` contract directly.
export const parts = pgTable(
  "parts",
  {
    id: uuid("id").primaryKey(),

    // ── Intelligent material code (FRD §4) ──────────────────────────────────
    part_number: varchar("part_number", { length: 32 }).notNull(),
    category_id: uuid("category_id")
      .references(() => materialCategories.id)
      .notNull(),
    subtype_id: uuid("subtype_id")
      .references(() => subtypes.id)
      .notNull(),
    major_spec_id: uuid("major_spec_id").references(() => majorSpecs.id),
    grade_id: uuid("grade_id").references(() => grades.id),

    // Denormalised code segments + display names (mirror the frontend contract).
    material_type: varchar("material_type", { length: 4 }).notNull(), // TT
    sub_type: varchar("sub_type", { length: 80 }).notNull(), // subtype name
    sub_type_code: varchar("sub_type_code", { length: 4 }).notNull(), // SS
    major_spec: varchar("major_spec", { length: 4 }).default("").notNull(), // MM
    detail_spec: varchar("detail_spec", { length: 8 }).default("").notNull(), // DDDD
    category: varchar("category", { length: 80 }).notNull(), // category name

    // ── Basic information (FRD §5) ──────────────────────────────────────────
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").default("").notNull(),
    material: varchar("material", { length: 120 }).default("").notNull(),
    finish: varchar("finish", { length: 120 }).default("").notNull(),
    revision: varchar("revision", { length: 16 }).default("A").notNull(),
    lifecycle: lifecycleEnum("lifecycle").default("Concept").notNull(),
    sourcing: sourcingTypeEnum("sourcing").default("Buy").notNull(),
    weight_kg: numeric("weight_kg", { precision: 14, scale: 3 })
      .default("0")
      .notNull(),

    // ── Commercial information (FRD §5) ─────────────────────────────────────
    unit_cost: numeric("unit_cost", { precision: 16, scale: 2 })
      .default("0")
      .notNull(),
    last_purchase_price: numeric("last_purchase_price", {
      precision: 16,
      scale: 2,
    })
      .default("0")
      .notNull(),
    lead_time_days: integer("lead_time_days").default(0).notNull(),
    // Preferred vendors (Vendor Master) are a many-to-many relation — see the
    // `part_vendors` join table.
    manufacturer_part_number: varchar("manufacturer_part_number", {
      length: 120,
    })
      .default("")
      .notNull(),
    make: varchar("make", { length: 120 }).default("").notNull(),
    model: varchar("model", { length: 120 }).default("").notNull(),
    drawing_ref: varchar("drawing_ref", { length: 120 }).default("").notNull(),

    // ── Inventory information (FRD §5) ──────────────────────────────────────
    availability: availabilityEnum("availability")
      .default("Out of Stock")
      .notNull(),
    stock_qty: numeric("stock_qty", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    reorder_point: numeric("reorder_point", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    min_stock: numeric("min_stock", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    max_stock: numeric("max_stock", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    stock_location: varchar("stock_location", { length: 80 })
      .default("")
      .notNull(),
    uom: varchar("uom", { length: 16 }).default("Nos").notNull(),

    // ── Classification / metadata ───────────────────────────────────────────
    compliance: jsonb("compliance").$type<string[]>().default([]).notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    owner_id: uuid("owner_id").references(() => users.id),
    thumbnail_hue: smallint("thumbnail_hue").default(210).notNull(),
    where_used_count: integer("where_used_count").default(0).notNull(),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    partNumberUnique: uniqueIndex("parts_part_number_unique")
      .on(table.part_number)
      .where(sql`${table.deleted_at} is null`),
    categoryIndex: index("parts_category_idx").on(table.category_id),
    subtypeIndex: index("parts_subtype_idx").on(table.subtype_id),
    nameIndex: index("parts_name_idx").on(table.name),
  })
);

export type Part = InferSelectModel<typeof parts>;
export type NewPart = InferInsertModel<typeof parts>;
