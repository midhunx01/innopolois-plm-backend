import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { availabilityEnum } from "./enum";
import { parts } from "./parts";
import { warehouses } from "./warehouses";

// On-hand stock per (material, warehouse) — frontend `InventoryRecord`. Mutated
// only by stock movements; `available` = on_hand - reserved.
export const stockBalances = pgTable(
  "stock_balances",
  {
    id: uuid("id").primaryKey(),

    part_id: uuid("part_id")
      .references(() => parts.id)
      .notNull(),
    warehouse_id: uuid("warehouse_id")
      .references(() => warehouses.id)
      .notNull(),

    part_number: varchar("part_number", { length: 32 }).notNull(),
    part_name: varchar("part_name", { length: 200 }).notNull(),
    warehouse_code: varchar("warehouse_code", { length: 24 }).notNull(),

    on_hand: numeric("on_hand", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    reserved: numeric("reserved", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    available: numeric("available", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    incoming: numeric("incoming", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    reorder_point: numeric("reorder_point", { precision: 16, scale: 3 })
      .default("0")
      .notNull(),
    unit_cost: numeric("unit_cost", { precision: 16, scale: 2 })
      .default("0")
      .notNull(),
    uom: varchar("uom", { length: 16 }).default("Nos").notNull(),
    status: availabilityEnum("status").default("Out of Stock").notNull(),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    partWarehouseUnique: uniqueIndex("stock_balances_part_warehouse_unique").on(
      table.part_id,
      table.warehouse_id
    ),
    warehouseIndex: index("stock_balances_warehouse_idx").on(table.warehouse_id),
    partIndex: index("stock_balances_part_idx").on(table.part_id),
  })
);

export type StockBalance = InferSelectModel<typeof stockBalances>;
export type NewStockBalance = InferInsertModel<typeof stockBalances>;
