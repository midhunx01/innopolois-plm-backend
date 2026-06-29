import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { rfqs } from "./rfqs";
import { parts } from "./parts";
import { bomLines } from "./bom-lines";

// A line on an RFQ (FRD §12 — Item Description, Specification, Quantity, Buying
// Notes, Required Delivery). References a Material Master record; may originate
// from a BOM line.
export const rfqLines = pgTable(
  "rfq_lines",
  {
    id: uuid("id").primaryKey(),

    rfq_id: uuid("rfq_id")
      .references(() => rfqs.id, { onDelete: "cascade" })
      .notNull(),
    part_id: uuid("part_id")
      .references(() => parts.id)
      .notNull(),
    bom_line_id: uuid("bom_line_id").references(() => bomLines.id),

    line_no: integer("line_no").default(0).notNull(),
    part_number: varchar("part_number", { length: 32 }).notNull(),
    description: varchar("description", { length: 200 }).default("").notNull(),
    specification: text("specification").default("").notNull(),
    quantity: numeric("quantity", { precision: 16, scale: 3 })
      .default("1")
      .notNull(),
    uom: varchar("uom", { length: 16 }).default("Nos").notNull(),
    buying_notes: text("buying_notes").default("").notNull(),
    required_date: timestamp("required_date", { withTimezone: true }),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    rfqIndex: index("rfq_lines_rfq_idx").on(table.rfq_id),
  })
);

export type RfqLine = InferSelectModel<typeof rfqLines>;
export type NewRfqLine = InferInsertModel<typeof rfqLines>;
