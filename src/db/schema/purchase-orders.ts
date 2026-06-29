import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { poStatusEnum, priorityEnum } from "./enum";
import { suppliers } from "./suppliers";
import { rfqs } from "./rfqs";
import { quotations } from "./quotations";
import { projects } from "./projects";
import { users } from "./users";

// Purchase Order (FRD §13, frontend `PurchaseOrder`). May be raised from an
// awarded quotation or manually. Receipt updates received_pct + status; the
// actual stock posting is handled by the Inventory module (FRD §14).
export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").primaryKey(),

    number: varchar("number", { length: 32 }).notNull(), // PO-0001
    supplier_id: uuid("supplier_id")
      .references(() => suppliers.id)
      .notNull(),
    supplier_name: varchar("supplier_name", { length: 160 }).notNull(),

    rfq_id: uuid("rfq_id").references(() => rfqs.id),
    quotation_id: uuid("quotation_id").references(() => quotations.id),
    project_id: uuid("project_id").references(() => projects.id),

    status: poStatusEnum("status").default("Draft").notNull(),
    priority: priorityEnum("priority").default("Medium").notNull(),
    on_time_risk: varchar("on_time_risk", { length: 16 })
      .default("Low")
      .notNull(),

    line_items: integer("line_items").default(0).notNull(),
    total_value: numeric("total_value", { precision: 18, scale: 2 })
      .default("0")
      .notNull(),
    received_pct: numeric("received_pct", { precision: 5, scale: 2 })
      .default("0")
      .notNull(),

    ordered_date: timestamp("ordered_date", { withTimezone: true }),
    expected_date: timestamp("expected_date", { withTimezone: true }),
    owner_id: uuid("owner_id").references(() => users.id),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    numberUnique: uniqueIndex("purchase_orders_number_unique")
      .on(table.number)
      .where(sql`${table.deleted_at} is null`),
    supplierIndex: index("purchase_orders_supplier_idx").on(table.supplier_id),
    statusIndex: index("purchase_orders_status_idx").on(table.status),
  })
);

export type PurchaseOrder = InferSelectModel<typeof purchaseOrders>;
export type NewPurchaseOrder = InferInsertModel<typeof purchaseOrders>;
