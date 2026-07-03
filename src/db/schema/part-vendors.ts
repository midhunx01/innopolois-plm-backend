import {
  pgTable,
  uuid,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { parts } from "./parts";
import { suppliers } from "./suppliers";

// Preferred vendors for a Material Master record (FRD §5). A material may have
// several preferred vendors, so this is a plain many-to-many join between
// `parts` and the Vendor Master (`suppliers`). `vendor_id` follows the same
// convention as `bom_lines.vendor_id`. The unique index prevents listing the
// same vendor twice for one material.
export const partVendors = pgTable(
  "part_vendors",
  {
    id: uuid("id").primaryKey(),
    part_id: uuid("part_id")
      .references(() => parts.id, { onDelete: "cascade" })
      .notNull(),
    vendor_id: uuid("vendor_id")
      .references(() => suppliers.id)
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    partVendorUnique: uniqueIndex("part_vendors_part_vendor_unique").on(
      table.part_id,
      table.vendor_id
    ),
    partIndex: index("part_vendors_part_idx").on(table.part_id),
    vendorIndex: index("part_vendors_vendor_idx").on(table.vendor_id),
  })
);

export type PartVendor = InferSelectModel<typeof partVendors>;
export type NewPartVendor = InferInsertModel<typeof partVendors>;
