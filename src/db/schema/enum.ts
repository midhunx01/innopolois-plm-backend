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

// ── Vendor approval status (FRD §7, frontend `Supplier.status`) ───────────────
export const supplierStatusEnum = pgEnum("supplier_status", [
  "Approved",
  "Preferred",
  "Conditional",
  "Under Review",
]);
export type SupplierStatus = (typeof supplierStatusEnum.enumValues)[number];

// ── Project lifecycle stage (FRD §1, frontend `ProjectStage`) ─────────────────
export const projectStageEnum = pgEnum("project_stage", [
  "Enquiry",
  "Technical Evaluation",
  "Quotation",
  "Project Order",
  "Detailed Engineering",
  "Final BOM",
  "Purchase Release",
  "Procurement",
  "Fulfilment",
  "Completed",
]);
export type ProjectStage = (typeof projectStageEnum.enumValues)[number];

// ── BOM approval workflow stage (FRD §10, frontend `BomStage`) ────────────────
export const bomStageEnum = pgEnum("bom_stage", [
  "Draft",
  "Technical Review",
  "Commercial Review",
  "Approved",
  "Released for Purchase",
]);
export type BomStage = (typeof bomStageEnum.enumValues)[number];

// Ordered list used by the workflow engine to compute the next stage.
export const BOM_STAGES: BomStage[] = [
  "Draft",
  "Technical Review",
  "Commercial Review",
  "Approved",
  "Released for Purchase",
];

// ── BOM type (FRD §8) ─────────────────────────────────────────────────────────
export const bomTypeEnum = pgEnum("bom_type", [
  "Engineering",
  "Procurement",
  "Final Released",
]);
export type BomType = (typeof bomTypeEnum.enumValues)[number];

// ── Priority (used by POs; frontend `EcoPriority`) ────────────────────────────
export const priorityEnum = pgEnum("priority", [
  "Low",
  "Medium",
  "High",
  "Critical",
]);
export type Priority = (typeof priorityEnum.enumValues)[number];

// ── RFQ mode (FRD §12, frontend `RfqMode`) ────────────────────────────────────
export const rfqModeEnum = pgEnum("rfq_mode", [
  "Vendor-wise",
  "Category-wise",
  "Package-wise",
  "Single Item",
  "Bulk",
]);
export type RfqMode = (typeof rfqModeEnum.enumValues)[number];

// ── RFQ status (FRD §12, frontend `RfqStatus`) ────────────────────────────────
export const rfqStatusEnum = pgEnum("rfq_status", [
  "Draft",
  "Sent",
  "Quotes In",
  "Comparison",
  "Awarded",
  "Closed",
]);
export type RfqStatus = (typeof rfqStatusEnum.enumValues)[number];

// ── Quotation status (FRD §13, frontend `QuotationStatus`) ────────────────────
export const quotationStatusEnum = pgEnum("quotation_status", [
  "Pending",
  "Received",
  "Under Review",
  "Awarded",
  "Rejected",
]);
export type QuotationStatus = (typeof quotationStatusEnum.enumValues)[number];

// ── Purchase Order status (FRD §13, frontend `PoStatus`) ──────────────────────
export const poStatusEnum = pgEnum("po_status", [
  "Draft",
  "Pending Approval",
  "Open",
  "Partially Received",
  "Received",
  "Closed",
  "Cancelled",
]);
export type PoStatus = (typeof poStatusEnum.enumValues)[number];

// ── Inventory (FRD §14, frontend `Warehouse`) ─────────────────────────────────
export const warehouseTypeEnum = pgEnum("warehouse_type", [
  "Distribution",
  "Manufacturing",
  "Buffer",
  "Transit",
]);
export type WarehouseType = (typeof warehouseTypeEnum.enumValues)[number];

// Append-only stock ledger movement types.
export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "opening",
  "purchase",
  "sale_consumption",
  "adjustment",
  "wastage",
  "transfer_in",
  "transfer_out",
]);
export type StockMovementType =
  (typeof stockMovementTypeEnum.enumValues)[number];

export const stockDirectionEnum = pgEnum("stock_direction", ["in", "out"]);
export type StockDirection = (typeof stockDirectionEnum.enumValues)[number];

// Goods-receipt inspection (FRD §14 — rejected stock must not enter inventory).
export const inspectionStatusEnum = pgEnum("inspection_status", [
  "Pending",
  "Accepted",
  "Rejected",
]);
export type InspectionStatus =
  (typeof inspectionStatusEnum.enumValues)[number];

// Source of a material price-history entry: the manual value captured at
// material creation, vs. a realised vendor purchase (goods receipt).
export const priceSourceEnum = pgEnum("price_source", ["Initial", "Purchase"]);
export type PriceSource = (typeof priceSourceEnum.enumValues)[number];
