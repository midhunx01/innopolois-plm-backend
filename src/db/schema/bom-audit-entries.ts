import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { bomStageEnum } from "./enum";
import { projectBoms } from "./project-boms";
import { users } from "./users";

// Approval audit trail (FRD §10) — "Every approval shall record Date, Time,
// User, Comments." One row per workflow transition. `from_stage`/`to_stage`
// capture the movement; `action` is advance | reject.
export const bomAuditEntries = pgTable(
  "bom_audit_entries",
  {
    id: uuid("id").primaryKey(),

    bom_id: uuid("bom_id")
      .references(() => projectBoms.id, { onDelete: "cascade" })
      .notNull(),

    from_stage: bomStageEnum("from_stage").notNull(),
    to_stage: bomStageEnum("to_stage").notNull(),
    action: text("action").notNull(), // "advance" | "reject"
    comment: text("comment").default("").notNull(),

    user_id: uuid("user_id").references(() => users.id),

    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    bomIndex: index("bom_audit_bom_idx").on(table.bom_id),
  })
);

export type BomAuditEntry = InferSelectModel<typeof bomAuditEntries>;
export type NewBomAuditEntry = InferInsertModel<typeof bomAuditEntries>;
