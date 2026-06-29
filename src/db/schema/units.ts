import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";

// Unit of Measure master (FRD §6). e.g. Nos, Mtr, Ltr, Kg.
export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey(),

    code: varchar("code", { length: 16 }).notNull(),
    name: varchar("name", { length: 60 }).notNull(),

    is_active: boolean("is_active").default(true).notNull(),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    codeUnique: uniqueIndex("units_code_unique")
      .on(table.code)
      .where(sql`${table.deleted_at} is null`),
  })
);

export type Unit = InferSelectModel<typeof units>;
export type NewUnit = InferInsertModel<typeof units>;
