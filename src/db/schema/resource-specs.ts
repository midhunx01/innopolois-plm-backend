import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";

// Resource Specification master (FRD §6). A predefined, admin-managed list a
// material can reference. A material may carry several resource specs — see the
// `part_resource_specs` join table.
export const resourceSpecs = pgTable(
  "resource_specs",
  {
    id: uuid("id").primaryKey(),

    code: varchar("code", { length: 24 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").default("").notNull(),

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
    codeUnique: uniqueIndex("resource_specs_code_unique")
      .on(table.code)
      .where(sql`${table.deleted_at} is null`),
  })
);

export type ResourceSpec = InferSelectModel<typeof resourceSpecs>;
export type NewResourceSpec = InferInsertModel<typeof resourceSpecs>;
