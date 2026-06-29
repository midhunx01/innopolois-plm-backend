import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  numeric,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { lifecycleEnum, projectStageEnum } from "./enum";
import { users } from "./users";

// Project — the top-level engineering deliverable (FRD §8, frontend `Product`).
// Each project moves through the lifecycle stages (Enquiry → Completed) and owns
// one or more BOM documents (Engineering / Procurement / Final Released).
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey(),

    project_number: varchar("project_number", { length: 32 }).notNull(), // INP-2026-0001
    name: varchar("name", { length: 200 }).notNull(),
    customer: varchar("customer", { length: 160 }).default("").notNull(),
    family: varchar("family", { length: 80 }).default("").notNull(),
    category: varchar("category", { length: 80 }).default("").notNull(),
    description: text("description").default("").notNull(),

    engineer_id: uuid("engineer_id").references(() => users.id),
    owner_id: uuid("owner_id").references(() => users.id),

    stage: projectStageEnum("stage").default("Enquiry").notNull(),
    lifecycle: lifecycleEnum("lifecycle").default("Concept").notNull(),
    revision: varchar("revision", { length: 16 }).default("A").notNull(),
    version: varchar("version", { length: 16 }).default("1.0").notNull(),

    // Commercial estimates (FRD §1 price estimation / quotation).
    unit_cost: numeric("unit_cost", { precision: 18, scale: 2 })
      .default("0")
      .notNull(), // estimated project cost (rolled from BOM)
    target_cost: numeric("target_cost", { precision: 18, scale: 2 })
      .default("0")
      .notNull(),
    quoted_price: numeric("quoted_price", { precision: 18, scale: 2 })
      .default("0")
      .notNull(), // msrp / quote
    margin_pct: numeric("margin_pct", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),

    health: smallint("health").default(100).notNull(), // 0-100
    open_changes: integer("open_changes").default(0).notNull(),
    thumbnail_hue: smallint("thumbnail_hue").default(210).notNull(),

    enquiry_date: timestamp("enquiry_date", { withTimezone: true }),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    numberUnique: uniqueIndex("projects_number_unique")
      .on(table.project_number)
      .where(sql`${table.deleted_at} is null`),
    stageIndex: index("projects_stage_idx").on(table.stage),
    customerIndex: index("projects_customer_idx").on(table.customer),
  })
);

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;
