import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";

// Material Grade / Detailed Specification master (FRD §6, "DDDD"). Forms the
// 4th segment of the material code (e.g. 3040 = SS 304).
export const grades = pgTable(
  "grades",
  {
    id: uuid("id").primaryKey(),

    code: varchar("code", { length: 8 }).notNull(), // DDDD
    label: varchar("label", { length: 80 }).notNull(),

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
    codeUnique: uniqueIndex("grades_code_unique")
      .on(table.code)
      .where(sql`${table.deleted_at} is null`),
  })
);

export type Grade = InferSelectModel<typeof grades>;
export type NewGrade = InferInsertModel<typeof grades>;
