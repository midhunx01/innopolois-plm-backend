import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";

// Material Type master (FRD §3, §4 "TT"). The 14 configurable categories.
// Administrators may add/edit/delete. `type_code` is the 2-letter TT segment of
// the intelligent material code.
export const materialCategories = pgTable(
  "material_categories",
  {
    id: uuid("id").primaryKey(),

    name: varchar("name", { length: 80 }).notNull(),
    type_code: varchar("type_code", { length: 4 }).notNull(), // TT
    default_uom: varchar("default_uom", { length: 16 }).default("Nos").notNull(),

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
    typeCodeUnique: uniqueIndex("material_categories_type_code_unique")
      .on(table.type_code)
      .where(sql`${table.deleted_at} is null`),
    nameUnique: uniqueIndex("material_categories_name_unique")
      .on(table.name)
      .where(sql`${table.deleted_at} is null`),
  })
);

export type MaterialCategory = InferSelectModel<typeof materialCategories>;
export type NewMaterialCategory = InferInsertModel<typeof materialCategories>;
