import {
  pgTable,
  uuid,
  numeric,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { priceSourceEnum } from "./enum";
import { parts } from "./parts";
import { suppliers } from "./suppliers";
import { purchaseOrders } from "./purchase-orders";

// Append-only price ledger for a material (FRD §5). One row per price event: the
// manual value captured at material creation (`Initial`) and every realised
// vendor goods-receipt (`Purchase`). The material's `last_purchase_price` /
// `last_purchase_date` mirror the most recent row.
export const partPriceHistory = pgTable(
  "part_price_history",
  {
    id: uuid("id").primaryKey(),
    part_id: uuid("part_id")
      .references(() => parts.id, { onDelete: "cascade" })
      .notNull(),

    unit_price: numeric("unit_price", { precision: 16, scale: 2 })
      .default("0")
      .notNull(),
    source: priceSourceEnum("source").default("Purchase").notNull(),

    // Purchase context (null for an `Initial` manual entry).
    vendor_id: uuid("vendor_id").references(() => suppliers.id),
    purchase_order_id: uuid("purchase_order_id").references(
      () => purchaseOrders.id
    ),
    // Denormalised reference (PO number, or "Initial") + received quantity.
    reference: varchar("reference", { length: 64 }).default("").notNull(),
    quantity: numeric("quantity", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),

    // When the price took effect (manual capture date, or goods-receipt date).
    effective_date: timestamp("effective_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    partIndex: index("part_price_history_part_idx").on(table.part_id),
    effectiveIndex: index("part_price_history_effective_idx").on(
      table.effective_date
    ),
  })
);

export type PartPriceHistory = InferSelectModel<typeof partPriceHistory>;
export type NewPartPriceHistory = InferInsertModel<typeof partPriceHistory>;
