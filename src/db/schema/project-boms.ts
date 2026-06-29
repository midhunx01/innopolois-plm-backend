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
import { bomStageEnum, bomTypeEnum } from "./enum";
import { projects } from "./projects";
import { users } from "./users";

// Project BOM document (FRD §8–10, frontend `ProjectBom`). A project may have
// several (Engineering / Procurement / Final Released). Moves through the
// approval workflow Draft → Technical Review → Commercial Review → Approved →
// Released for Purchase (bom_audit_entries records each transition). Aggregate
// counters (line_items, total_value, …) are recomputed on every line change.
export const projectBoms = pgTable(
  "project_boms",
  {
    id: uuid("id").primaryKey(),

    number: varchar("number", { length: 32 }).notNull(), // BOM-0001
    project_id: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),

    bom_type: bomTypeEnum("bom_type").default("Engineering").notNull(),
    stage: bomStageEnum("stage").default("Draft").notNull(),
    revision: varchar("revision", { length: 16 }).default("A").notNull(),

    // Denormalised aggregates (kept in sync by the service for fast listing).
    line_items: integer("line_items").default(0).notNull(),
    unique_materials: integer("unique_materials").default(0).notNull(),
    total_value: numeric("total_value", { precision: 18, scale: 2 })
      .default("0")
      .notNull(),
    critical_items: integer("critical_items").default(0).notNull(),
    long_lead_items: integer("long_lead_items").default(0).notNull(),

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
    numberUnique: uniqueIndex("project_boms_number_unique")
      .on(table.number)
      .where(sql`${table.deleted_at} is null`),
    projectIndex: index("project_boms_project_idx").on(table.project_id),
    stageIndex: index("project_boms_stage_idx").on(table.stage),
  })
);

export type ProjectBom = InferSelectModel<typeof projectBoms>;
export type NewProjectBom = InferInsertModel<typeof projectBoms>;
