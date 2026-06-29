import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  inspectionStatusEnum,
  stockDirectionEnum,
  stockMovementTypeEnum,
} from "./enum";
import { parts } from "./parts";
import { warehouses } from "./warehouses";
import { users } from "./users";

// Append-only stock ledger (FRD §14). Every change to on-hand stock is one row;
// stock_balances is the running total. `reference`/`reference_id` link a movement
// back to its source (e.g. a PO receipt). Rejected receipt qty is recorded for
// traceability but never increases on-hand.
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey(),

    part_id: uuid("part_id")
      .references(() => parts.id)
      .notNull(),
    warehouse_id: uuid("warehouse_id")
      .references(() => warehouses.id)
      .notNull(),

    type: stockMovementTypeEnum("type").notNull(),
    direction: stockDirectionEnum("direction").notNull(),
    quantity: numeric("quantity", { precision: 16, scale: 3 }).notNull(),
    unit_cost: numeric("unit_cost", { precision: 16, scale: 2 })
      .default("0")
      .notNull(),

    inspection_status: inspectionStatusEnum("inspection_status"),
    rejected_qty: numeric("rejected_qty", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    batch: varchar("batch", { length: 60 }).default("").notNull(),

    reference: varchar("reference", { length: 64 }).default("").notNull(),
    reference_id: uuid("reference_id"),
    note: text("note").default("").notNull(),

    user_id: uuid("user_id").references(() => users.id),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    partIndex: index("stock_movements_part_idx").on(table.part_id),
    warehouseIndex: index("stock_movements_warehouse_idx").on(
      table.warehouse_id
    ),
    typeIndex: index("stock_movements_type_idx").on(table.type),
  })
);

export type StockMovement = InferSelectModel<typeof stockMovements>;
export type NewStockMovement = InferInsertModel<typeof stockMovements>;
