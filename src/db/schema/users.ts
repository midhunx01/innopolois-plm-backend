import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  smallint,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { userRoleEnum } from "./enum";

// Internal application users (FRD §17). Single company — no tenant scoping.
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),

    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    password_hash: text("password_hash").notNull(),

    role: userRoleEnum("role").notNull(),
    team: varchar("team", { length: 80 }),
    initials: varchar("initials", { length: 4 }),
    hue: smallint("hue").default(210).notNull(),

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
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  })
);

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
