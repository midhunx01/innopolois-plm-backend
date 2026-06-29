import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { purchaseOrders } from "./purchase-orders";
import { parts } from "./parts";

// A Purchase Order line. extended_price = quantity * unit_price. received_qty is
// updated on goods receipt (drives the PO's received_pct).
export const poLines = pgTable(
  "po_lines",
  {
    id: uuid("id").primaryKey(),

    po_id: uuid("po_id")
      .references(() => purchaseOrders.id, { onDelete: "cascade" })
      .notNull(),
    part_id: uuid("part_id")
      .references(() => parts.id)
      .notNull(),

    line_no: integer("line_no").default(0).notNull(),
    part_number: varchar("part_number", { length: 32 }).notNull(),
    description: varchar("description", { length: 200 }).default("").notNull(),
    quantity: numeric("quantity", { precision: 16, scale: 3 })
      .default("1")
      .notNull(),
    uom: varchar("uom", { length: 16 }).default("Nos").notNull(),
    unit_price: numeric("unit_price", { precision: 16, scale: 2 })
      .default("0")
      .notNull(),
    extended_price: numeric("extended_price", { precision: 18, scale: 2 })
      .default("0")
      .notNull(),
    received_qty: numeric("received_qty", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    poIndex: index("po_lines_po_idx").on(table.po_id),
  })
);

export type PoLine = InferSelectModel<typeof poLines>;
export type NewPoLine = InferInsertModel<typeof poLines>;
