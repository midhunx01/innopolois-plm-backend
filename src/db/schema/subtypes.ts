import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { materialCategories } from "./material-categories";

// Subtype master (FRD §6, "SS"). Each subtype belongs to a material category
// (e.g. Mechanical Bought-out → Valve / Pump / Bearing). `code` is the 2-letter
// SS segment of the intelligent material code; unique within its category.
export const subtypes = pgTable(
  "subtypes",
  {
    id: uuid("id").primaryKey(),

    category_id: uuid("category_id")
      .references(() => materialCategories.id, { onDelete: "cascade" })
      .notNull(),

    name: varchar("name", { length: 80 }).notNull(),
    code: varchar("code", { length: 4 }).notNull(), // SS

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
    categoryIndex: index("subtypes_category_idx").on(table.category_id),
    codePerCategoryUnique: uniqueIndex("subtypes_category_code_unique")
      .on(table.category_id, table.code)
      .where(sql`${table.deleted_at} is null`),
  })
);

export type Subtype = InferSelectModel<typeof subtypes>;
export type NewSubtype = InferInsertModel<typeof subtypes>;
