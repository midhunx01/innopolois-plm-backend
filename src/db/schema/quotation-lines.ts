import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { quotations } from "./quotations";
import { rfqLines } from "./rfq-lines";

// A vendor's price for one RFQ line. extended_price = quantity * unit_price.
export const quotationLines = pgTable(
  "quotation_lines",
  {
    id: uuid("id").primaryKey(),

    quotation_id: uuid("quotation_id")
      .references(() => quotations.id, { onDelete: "cascade" })
      .notNull(),
    rfq_line_id: uuid("rfq_line_id")
      .references(() => rfqLines.id)
      .notNull(),

    part_number: varchar("part_number", { length: 32 }).default("").notNull(),
    quantity: numeric("quantity", { precision: 16, scale: 3 })
      .default("1")
      .notNull(),
    unit_price: numeric("unit_price", { precision: 16, scale: 2 })
      .default("0")
      .notNull(),
    extended_price: numeric("extended_price", { precision: 18, scale: 2 })
      .default("0")
      .notNull(),
    lead_time_days: integer("lead_time_days").default(0).notNull(),
    remarks: text("remarks").default("").notNull(),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    quotationIndex: index("quotation_lines_quotation_idx").on(
      table.quotation_id
    ),
  })
);

export type QuotationLine = InferSelectModel<typeof quotationLines>;
export type NewQuotationLine = InferInsertModel<typeof quotationLines>;
