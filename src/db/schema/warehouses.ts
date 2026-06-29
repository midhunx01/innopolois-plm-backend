import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { warehouseTypeEnum } from "./enum";

// Warehouse / store location (FRD §14, frontend `Warehouse`). SKU count, stock
// value and low-stock totals are computed from stock_balances at read time.
export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id").primaryKey(),

    code: varchar("code", { length: 24 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    type: warehouseTypeEnum("type").default("Distribution").notNull(),
    city: varchar("city", { length: 80 }).default("").notNull(),
    country: varchar("country", { length: 80 }).default("India").notNull(),
    capacity_pct: numeric("capacity_pct", { precision: 5, scale: 2 })
      .default("0")
      .notNull(),
    lat: numeric("lat", { precision: 9, scale: 6 }),
    lng: numeric("lng", { precision: 9, scale: 6 }),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    codeUnique: uniqueIndex("warehouses_code_unique")
      .on(table.code)
      .where(sql`${table.deleted_at} is null`),
  })
);

export type Warehouse = InferSelectModel<typeof warehouses>;
export type NewWarehouse = InferInsertModel<typeof warehouses>;
