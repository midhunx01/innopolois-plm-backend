import { pgEnum } from "drizzle-orm/pg-core";

// ── User roles (FRD §17) ─────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "Administrator",
  "Engineering",
  "Commercial",
  "Purchase",
  "Stores",
  "Management",
]);
export type Role = (typeof userRoleEnum.enumValues)[number];

// ── Material / Part lifecycle (frontend `Lifecycle`) ─────────────────────────
export const lifecycleEnum = pgEnum("lifecycle", [
  "Concept",
  "In Design",
  "In Review",
  "Released",
  "Production",
  "Obsolete",
]);
export type Lifecycle = (typeof lifecycleEnum.enumValues)[number];

// ── Sourcing (Make / Buy / Standard) ─────────────────────────────────────────
export const sourcingTypeEnum = pgEnum("sourcing_type", [
  "Make",
  "Buy",
  "Standard",
]);
export type SourcingType = (typeof sourcingTypeEnum.enumValues)[number];

// ── Stock availability ───────────────────────────────────────────────────────
export const availabilityEnum = pgEnum("availability", [
  "In Stock",
  "Low Stock",
  "Backorder",
  "Out of Stock",
]);
export type Availability = (typeof availabilityEnum.enumValues)[number];
