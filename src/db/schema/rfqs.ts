import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { rfqModeEnum, rfqStatusEnum } from "./enum";
import { projects } from "./projects";
import { projectBoms } from "./project-boms";
import { users } from "./users";

// Request for Quotation (FRD §12, frontend `Rfq`). Generated from a released BOM
// (or ad hoc) and issued to one or more vendors. `vendor_ids` holds the invited
// vendors (kept inline to match the frontend contract). rfq_lines holds the
// items to be quoted.
export const rfqs = pgTable(
  "rfqs",
  {
    id: uuid("id").primaryKey(),

    number: varchar("number", { length: 32 }).notNull(), // RFQ-0001
    title: varchar("title", { length: 200 }).notNull(),
    mode: rfqModeEnum("mode").default("Vendor-wise").notNull(),
    status: rfqStatusEnum("status").default("Draft").notNull(),

    project_id: uuid("project_id").references(() => projects.id),
    bom_id: uuid("bom_id").references(() => projectBoms.id),
    category: varchar("category", { length: 80 }).default("").notNull(),

    vendor_ids: jsonb("vendor_ids").$type<string[]>().default([]).notNull(),
    line_items: integer("line_items").default(0).notNull(),
    est_value: numeric("est_value", { precision: 18, scale: 2 })
      .default("0")
      .notNull(),
    quotes_expected: integer("quotes_expected").default(0).notNull(),
    quotes_received: integer("quotes_received").default(0).notNull(),

    required_date: timestamp("required_date", { withTimezone: true }),
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
    numberUnique: uniqueIndex("rfqs_number_unique")
      .on(table.number)
      .where(sql`${table.deleted_at} is null`),
    statusIndex: index("rfqs_status_idx").on(table.status),
  })
);

export type Rfq = InferSelectModel<typeof rfqs>;
export type NewRfq = InferInsertModel<typeof rfqs>;
