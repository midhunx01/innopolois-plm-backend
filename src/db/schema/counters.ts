import { pgTable, varchar, integer } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Atomic sequence store for human-readable document numbers (project numbers,
// BOM numbers, …). Incremented via INSERT ... ON CONFLICT DO UPDATE so concurrent
// callers never collide. Key examples: "project:2026", "bom".
export const counters = pgTable("counters", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: integer("value").default(0).notNull(),
});

export type Counter = InferSelectModel<typeof counters>;
export type NewCounter = InferInsertModel<typeof counters>;
