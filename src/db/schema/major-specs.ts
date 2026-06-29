import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";

// Major Specification master (FRD §6, "MM"). Nominal sizes / pressure ratings
// that form the 3rd segment of the material code (e.g. 15 = 15 mm).
export const majorSpecs = pgTable(
  "major_specs",
  {
    id: uuid("id").primaryKey(),

    code: varchar("code", { length: 4 }).notNull(), // MM
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
    codeUnique: uniqueIndex("major_specs_code_unique")
      .on(table.code)
      .where(sql`${table.deleted_at} is null`),
  })
);

export type MajorSpec = InferSelectModel<typeof majorSpecs>;
export type NewMajorSpec = InferInsertModel<typeof majorSpecs>;
