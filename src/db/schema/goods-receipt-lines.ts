import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { goodsReceipts } from "./goods-receipts";
import { poLines } from "./po-lines";
import { parts } from "./parts";

// A line on a Goods Receipt Note: the quantity of a PO line received in this
// delivery. `accepted_qty = received_qty - rejected_qty` is what entered stock.
export const goodsReceiptLines = pgTable(
  "goods_receipt_lines",
  {
    id: uuid("id").primaryKey(),
    receipt_id: uuid("receipt_id")
      .references(() => goodsReceipts.id, { onDelete: "cascade" })
      .notNull(),
    po_line_id: uuid("po_line_id")
      .references(() => poLines.id)
      .notNull(),
    part_id: uuid("part_id")
      .references(() => parts.id)
      .notNull(),
    part_number: varchar("part_number", { length: 32 }).default("").notNull(),

    received_qty: numeric("received_qty", { precision: 16, scale: 3 }).notNull(),
    rejected_qty: numeric("rejected_qty", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    accepted_qty: numeric("accepted_qty", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    batch: varchar("batch", { length: 60 }).default("").notNull(),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    receiptIndex: index("goods_receipt_lines_receipt_idx").on(table.receipt_id),
  })
);

export type GoodsReceiptLine = InferSelectModel<typeof goodsReceiptLines>;
export type NewGoodsReceiptLine = InferInsertModel<typeof goodsReceiptLines>;
