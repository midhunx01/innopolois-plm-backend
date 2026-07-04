import {
  pgTable,
  uuid,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { parts } from "./parts";
import { resourceSpecs } from "./resource-specs";

// Resource specs for a Material Master record (FRD §5). A material may have
// several resource specs, so this is a plain many-to-many join between `parts`
// and the Resource Spec master. The unique index prevents listing the same
// resource spec twice for one material.
export const partResourceSpecs = pgTable(
  "part_resource_specs",
  {
    id: uuid("id").primaryKey(),
    part_id: uuid("part_id")
      .references(() => parts.id, { onDelete: "cascade" })
      .notNull(),
    resource_spec_id: uuid("resource_spec_id")
      .references(() => resourceSpecs.id)
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    partResourceSpecUnique: uniqueIndex(
      "part_resource_specs_part_spec_unique"
    ).on(table.part_id, table.resource_spec_id),
    partIndex: index("part_resource_specs_part_idx").on(table.part_id),
    resourceSpecIndex: index("part_resource_specs_spec_idx").on(
      table.resource_spec_id
    ),
  })
);

export type PartResourceSpec = InferSelectModel<typeof partResourceSpecs>;
export type NewPartResourceSpec = InferInsertModel<typeof partResourceSpecs>;
