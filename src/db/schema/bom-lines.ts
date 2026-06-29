import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sourcingTypeEnum } from "./enum";
import { projectBoms } from "./project-boms";
import { parts } from "./parts";
import { suppliers } from "./suppliers";

// A BOM line item (FRD §9, frontend `BomNode`). References a Material Master
// record; cost/spec fields are snapshotted at add-time so the BOM cost is stable
// even if the material's price later changes. `parent_line_id` + `level` allow
// future multi-level (sub-assembly) BOMs without a schema change.
export const bomLines = pgTable(
  "bom_lines",
  {
    id: uuid("id").primaryKey(),

    bom_id: uuid("bom_id")
      .references(() => projectBoms.id, { onDelete: "cascade" })
      .notNull(),
    part_id: uuid("part_id")
      .references(() => parts.id)
      .notNull(),

    find_number: integer("find_number").default(0).notNull(), // item number
    level: integer("level").default(1).notNull(),
    parent_line_id: uuid("parent_line_id"),

    // Snapshot of the material at add-time (frontend BomNode fields).
    part_number: varchar("part_number", { length: 32 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description").default("").notNull(),
    category: varchar("category", { length: 80 }).default("").notNull(),
    uom: varchar("uom", { length: 16 }).default("Nos").notNull(),
    unit_cost: numeric("unit_cost", { precision: 16, scale: 2 })
      .default("0")
      .notNull(),
    procurement: sourcingTypeEnum("procurement").default("Buy").notNull(),
    lead_time_days: integer("lead_time_days").default(0).notNull(),
    material_revision: varchar("material_revision", { length: 16 })
      .default("A")
      .notNull(),

    // Line-specific (FRD §9).
    quantity: numeric("quantity", { precision: 16, scale: 3 })
      .default("1")
      .notNull(),
    extended_cost: numeric("extended_cost", { precision: 18, scale: 2 })
      .default("0")
      .notNull(), // quantity * unit_cost
    ref_designator: varchar("ref_designator", { length: 80 })
      .default("")
      .notNull(),
    remarks: text("remarks").default("").notNull(),
    buying_notes: text("buying_notes").default("").notNull(),
    drawing_ref: varchar("drawing_ref", { length: 120 }).default("").notNull(),
    // Selected vendor for this line (specific/general — FRD §9, procedure p5).
    vendor_id: uuid("vendor_id").references(() => suppliers.id),
    is_critical: boolean("is_critical").default(false).notNull(),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    bomIndex: index("bom_lines_bom_idx").on(table.bom_id),
    partIndex: index("bom_lines_part_idx").on(table.part_id),
  })
);

export type BomLine = InferSelectModel<typeof bomLines>;
export type NewBomLine = InferInsertModel<typeof bomLines>;
