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
import { quotationStatusEnum } from "./enum";
import { rfqs } from "./rfqs";
import { suppliers } from "./suppliers";

// A vendor's quotation against an RFQ (FRD §13, frontend `Quotation`). One per
// (rfq, vendor). `rank`/`score` are filled by the comparison engine (rank 1 =
// recommended; score 0-100, higher = better value).
export const quotations = pgTable(
  "quotations",
  {
    id: uuid("id").primaryKey(),

    rfq_id: uuid("rfq_id")
      .references(() => rfqs.id, { onDelete: "cascade" })
      .notNull(),
    vendor_id: uuid("vendor_id")
      .references(() => suppliers.id)
      .notNull(),
    vendor_name: varchar("vendor_name", { length: 160 }).notNull(),

    status: quotationStatusEnum("status").default("Received").notNull(),
    total_value: numeric("total_value", { precision: 18, scale: 2 })
      .default("0")
      .notNull(),
    lead_time_days: integer("lead_time_days").default(0).notNull(),
    payment_terms: varchar("payment_terms", { length: 80 })
      .default("")
      .notNull(),
    validity_days: integer("validity_days").default(30).notNull(),
    delivery_terms: varchar("delivery_terms", { length: 120 })
      .default("")
      .notNull(),
    line_count: integer("line_count").default(0).notNull(),

    rank: integer("rank").default(0).notNull(),
    score: numeric("score", { precision: 5, scale: 2 }).default("0").notNull(),

    received_at: timestamp("received_at", { withTimezone: true })
      .defaultNow()
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
    rfqVendorUnique: uniqueIndex("quotations_rfq_vendor_unique")
      .on(table.rfq_id, table.vendor_id)
      .where(sql`${table.deleted_at} is null`),
    rfqIndex: index("quotations_rfq_idx").on(table.rfq_id),
  })
);

export type Quotation = InferSelectModel<typeof quotations>;
export type NewQuotation = InferInsertModel<typeof quotations>;
