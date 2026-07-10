import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { purchaseOrders } from "./purchase-orders";
import { warehouses } from "./warehouses";
import { users } from "./users";

// Goods Receipt Note (GRN) header (FRD §14). One record per goods-receipt event
// against a PO — a PO received in several partial deliveries has several GRNs.
// The per-line quantities live in `goods_receipt_lines`; on-hand stock is booked
// via `stock_movements`.
export const goodsReceipts = pgTable(
  "goods_receipts",
  {
    id: uuid("id").primaryKey(),
    grn_number: varchar("grn_number", { length: 24 }).notNull(), // GRN-0001

    po_id: uuid("po_id")
      .references(() => purchaseOrders.id, { onDelete: "cascade" })
      .notNull(),
    warehouse_id: uuid("warehouse_id")
      .references(() => warehouses.id)
      .notNull(),
    received_by: uuid("received_by").references(() => users.id),

    note: varchar("note", { length: 500 }).default("").notNull(),

    received_at: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    poIndex: index("goods_receipts_po_idx").on(table.po_id),
  })
);

export type GoodsReceipt = InferSelectModel<typeof goodsReceipts>;
export type NewGoodsReceipt = InferInsertModel<typeof goodsReceipts>;
