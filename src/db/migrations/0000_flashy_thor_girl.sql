CREATE TYPE "public"."availability" AS ENUM('In Stock', 'Low Stock', 'Backorder', 'Out of Stock');--> statement-breakpoint
CREATE TYPE "public"."bom_stage" AS ENUM('Draft', 'Technical Review', 'Commercial Review', 'Approved', 'Released for Purchase');--> statement-breakpoint
CREATE TYPE "public"."bom_type" AS ENUM('Engineering', 'Procurement', 'Final Released');--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('Pending', 'Accepted', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."lifecycle" AS ENUM('Concept', 'In Design', 'In Review', 'Released', 'Production', 'Obsolete');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('Draft', 'Pending Approval', 'Open', 'Partially Received', 'Received', 'Closed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('Low', 'Medium', 'High', 'Critical');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('Enquiry', 'Technical Evaluation', 'Quotation', 'Project Order', 'Detailed Engineering', 'Final BOM', 'Purchase Release', 'Procurement', 'Fulfilment', 'Completed');--> statement-breakpoint
CREATE TYPE "public"."quotation_status" AS ENUM('Pending', 'Received', 'Under Review', 'Awarded', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."rfq_mode" AS ENUM('Vendor-wise', 'Category-wise', 'Package-wise', 'Single Item', 'Bulk');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('Draft', 'Sent', 'Quotes In', 'Comparison', 'Awarded', 'Closed');--> statement-breakpoint
CREATE TYPE "public"."sourcing_type" AS ENUM('Make', 'Buy', 'Standard');--> statement-breakpoint
CREATE TYPE "public"."stock_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('opening', 'purchase', 'sale_consumption', 'adjustment', 'wastage', 'transfer_in', 'transfer_out');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('Approved', 'Preferred', 'Conditional', 'Under Review');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('Administrator', 'Engineering', 'Commercial', 'Purchase', 'Stores', 'Management');--> statement-breakpoint
CREATE TYPE "public"."warehouse_type" AS ENUM('Distribution', 'Manufacturing', 'Buffer', 'Transit');--> statement-breakpoint
CREATE TABLE "bom_audit_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"bom_id" uuid NOT NULL,
	"from_stage" "bom_stage" NOT NULL,
	"to_stage" "bom_stage" NOT NULL,
	"action" text NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bom_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"bom_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"find_number" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"parent_line_id" uuid,
	"part_number" varchar(32) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" varchar(80) DEFAULT '' NOT NULL,
	"uom" varchar(16) DEFAULT 'Nos' NOT NULL,
	"unit_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"procurement" "sourcing_type" DEFAULT 'Buy' NOT NULL,
	"lead_time_days" integer DEFAULT 0 NOT NULL,
	"material_revision" varchar(16) DEFAULT 'A' NOT NULL,
	"quantity" numeric(16, 3) DEFAULT '1' NOT NULL,
	"extended_cost" numeric(18, 2) DEFAULT '0' NOT NULL,
	"ref_designator" varchar(80) DEFAULT '' NOT NULL,
	"remarks" text DEFAULT '' NOT NULL,
	"buying_notes" text DEFAULT '' NOT NULL,
	"drawing_ref" varchar(120) DEFAULT '' NOT NULL,
	"vendor_id" uuid,
	"is_critical" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"label" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"team" varchar(80),
	"initials" varchar(4),
	"hue" smallint DEFAULT 210 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "material_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"type_code" varchar(4) NOT NULL,
	"default_uom" varchar(16) DEFAULT 'Nos' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subtypes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"code" varchar(4) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "major_specs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(4) NOT NULL,
	"label" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(16) NOT NULL,
	"name" varchar(60) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(24) NOT NULL,
	"name" varchar(160) NOT NULL,
	"country" varchar(80) DEFAULT 'India' NOT NULL,
	"region" varchar(40) DEFAULT 'Domestic' NOT NULL,
	"category" varchar(80) DEFAULT '' NOT NULL,
	"categories_supplied" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tier" smallint DEFAULT 3 NOT NULL,
	"contact" varchar(120) DEFAULT '' NOT NULL,
	"email" varchar(254) DEFAULT '' NOT NULL,
	"phone" varchar(40) DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"gst_vat" varchar(40) DEFAULT '' NOT NULL,
	"payment_terms" varchar(80) DEFAULT '' NOT NULL,
	"lead_time_avg" integer DEFAULT 0 NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0' NOT NULL,
	"on_time_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"quality_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"risk_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"parts_supplied" integer DEFAULT 0 NOT NULL,
	"open_pos" integer DEFAULT 0 NOT NULL,
	"annual_spend" numeric(18, 2) DEFAULT '0' NOT NULL,
	"status" "supplier_status" DEFAULT 'Under Review' NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"part_number" varchar(32) NOT NULL,
	"category_id" uuid NOT NULL,
	"subtype_id" uuid NOT NULL,
	"major_spec_id" uuid,
	"grade_id" uuid,
	"material_type" varchar(4) NOT NULL,
	"sub_type" varchar(80) NOT NULL,
	"sub_type_code" varchar(4) NOT NULL,
	"major_spec" varchar(4) DEFAULT '' NOT NULL,
	"detail_spec" varchar(8) DEFAULT '' NOT NULL,
	"category" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"material" varchar(120) DEFAULT '' NOT NULL,
	"finish" varchar(120) DEFAULT '' NOT NULL,
	"revision" varchar(16) DEFAULT 'A' NOT NULL,
	"lifecycle" "lifecycle" DEFAULT 'Concept' NOT NULL,
	"sourcing" "sourcing_type" DEFAULT 'Buy' NOT NULL,
	"weight_kg" numeric(14, 3) DEFAULT '0' NOT NULL,
	"unit_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"last_purchase_price" numeric(16, 2) DEFAULT '0' NOT NULL,
	"lead_time_days" integer DEFAULT 0 NOT NULL,
	"supplier_id" uuid,
	"manufacturer_part_number" varchar(120) DEFAULT '' NOT NULL,
	"make" varchar(120) DEFAULT '' NOT NULL,
	"model" varchar(120) DEFAULT '' NOT NULL,
	"drawing_ref" varchar(120) DEFAULT '' NOT NULL,
	"availability" "availability" DEFAULT 'Out of Stock' NOT NULL,
	"stock_qty" numeric(16, 3) DEFAULT '0' NOT NULL,
	"reorder_point" numeric(16, 3) DEFAULT '0' NOT NULL,
	"min_stock" numeric(16, 3) DEFAULT '0' NOT NULL,
	"max_stock" numeric(16, 3) DEFAULT '0' NOT NULL,
	"stock_location" varchar(80) DEFAULT '' NOT NULL,
	"uom" varchar(16) DEFAULT 'Nos' NOT NULL,
	"compliance" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"owner_id" uuid,
	"thumbnail_hue" smallint DEFAULT 210 NOT NULL,
	"where_used_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_number" varchar(32) NOT NULL,
	"name" varchar(200) NOT NULL,
	"customer" varchar(160) DEFAULT '' NOT NULL,
	"family" varchar(80) DEFAULT '' NOT NULL,
	"category" varchar(80) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"engineer_id" uuid,
	"owner_id" uuid,
	"stage" "project_stage" DEFAULT 'Enquiry' NOT NULL,
	"lifecycle" "lifecycle" DEFAULT 'Concept' NOT NULL,
	"revision" varchar(16) DEFAULT 'A' NOT NULL,
	"version" varchar(16) DEFAULT '1.0' NOT NULL,
	"unit_cost" numeric(18, 2) DEFAULT '0' NOT NULL,
	"target_cost" numeric(18, 2) DEFAULT '0' NOT NULL,
	"quoted_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"margin_pct" numeric(6, 2) DEFAULT '0' NOT NULL,
	"health" smallint DEFAULT 100 NOT NULL,
	"open_changes" integer DEFAULT 0 NOT NULL,
	"thumbnail_hue" smallint DEFAULT 210 NOT NULL,
	"enquiry_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "project_boms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"number" varchar(32) NOT NULL,
	"project_id" uuid NOT NULL,
	"bom_type" "bom_type" DEFAULT 'Engineering' NOT NULL,
	"stage" "bom_stage" DEFAULT 'Draft' NOT NULL,
	"revision" varchar(16) DEFAULT 'A' NOT NULL,
	"line_items" integer DEFAULT 0 NOT NULL,
	"unique_materials" integer DEFAULT 0 NOT NULL,
	"total_value" numeric(18, 2) DEFAULT '0' NOT NULL,
	"critical_items" integer DEFAULT 0 NOT NULL,
	"long_lead_items" integer DEFAULT 0 NOT NULL,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"number" varchar(32) NOT NULL,
	"title" varchar(200) NOT NULL,
	"mode" "rfq_mode" DEFAULT 'Vendor-wise' NOT NULL,
	"status" "rfq_status" DEFAULT 'Draft' NOT NULL,
	"project_id" uuid,
	"bom_id" uuid,
	"category" varchar(80) DEFAULT '' NOT NULL,
	"vendor_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"line_items" integer DEFAULT 0 NOT NULL,
	"est_value" numeric(18, 2) DEFAULT '0' NOT NULL,
	"quotes_expected" integer DEFAULT 0 NOT NULL,
	"quotes_received" integer DEFAULT 0 NOT NULL,
	"required_date" timestamp with time zone,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rfq_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"rfq_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"bom_line_id" uuid,
	"line_no" integer DEFAULT 0 NOT NULL,
	"part_number" varchar(32) NOT NULL,
	"description" varchar(200) DEFAULT '' NOT NULL,
	"specification" text DEFAULT '' NOT NULL,
	"quantity" numeric(16, 3) DEFAULT '1' NOT NULL,
	"uom" varchar(16) DEFAULT 'Nos' NOT NULL,
	"buying_notes" text DEFAULT '' NOT NULL,
	"required_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"rfq_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_name" varchar(160) NOT NULL,
	"status" "quotation_status" DEFAULT 'Received' NOT NULL,
	"total_value" numeric(18, 2) DEFAULT '0' NOT NULL,
	"lead_time_days" integer DEFAULT 0 NOT NULL,
	"payment_terms" varchar(80) DEFAULT '' NOT NULL,
	"validity_days" integer DEFAULT 30 NOT NULL,
	"delivery_terms" varchar(120) DEFAULT '' NOT NULL,
	"line_count" integer DEFAULT 0 NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quotation_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"quotation_id" uuid NOT NULL,
	"rfq_line_id" uuid NOT NULL,
	"part_number" varchar(32) DEFAULT '' NOT NULL,
	"quantity" numeric(16, 3) DEFAULT '1' NOT NULL,
	"unit_price" numeric(16, 2) DEFAULT '0' NOT NULL,
	"extended_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"lead_time_days" integer DEFAULT 0 NOT NULL,
	"remarks" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"number" varchar(32) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"supplier_name" varchar(160) NOT NULL,
	"rfq_id" uuid,
	"quotation_id" uuid,
	"project_id" uuid,
	"status" "po_status" DEFAULT 'Draft' NOT NULL,
	"priority" "priority" DEFAULT 'Medium' NOT NULL,
	"on_time_risk" varchar(16) DEFAULT 'Low' NOT NULL,
	"line_items" integer DEFAULT 0 NOT NULL,
	"total_value" numeric(18, 2) DEFAULT '0' NOT NULL,
	"received_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"ordered_date" timestamp with time zone,
	"expected_date" timestamp with time zone,
	"owner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "po_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"po_id" uuid NOT NULL,
	"part_id" uuid NOT NULL,
	"line_no" integer DEFAULT 0 NOT NULL,
	"part_number" varchar(32) NOT NULL,
	"description" varchar(200) DEFAULT '' NOT NULL,
	"quantity" numeric(16, 3) DEFAULT '1' NOT NULL,
	"uom" varchar(16) DEFAULT 'Nos' NOT NULL,
	"unit_price" numeric(16, 2) DEFAULT '0' NOT NULL,
	"extended_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"received_qty" numeric(16, 3) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(24) NOT NULL,
	"name" varchar(120) NOT NULL,
	"type" "warehouse_type" DEFAULT 'Distribution' NOT NULL,
	"city" varchar(80) DEFAULT '' NOT NULL,
	"country" varchar(80) DEFAULT 'India' NOT NULL,
	"capacity_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_balances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"part_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"part_number" varchar(32) NOT NULL,
	"part_name" varchar(200) NOT NULL,
	"warehouse_code" varchar(24) NOT NULL,
	"on_hand" numeric(16, 3) DEFAULT '0' NOT NULL,
	"reserved" numeric(16, 3) DEFAULT '0' NOT NULL,
	"available" numeric(16, 3) DEFAULT '0' NOT NULL,
	"incoming" numeric(16, 3) DEFAULT '0' NOT NULL,
	"reorder_point" numeric(16, 3) DEFAULT '0' NOT NULL,
	"unit_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"uom" varchar(16) DEFAULT 'Nos' NOT NULL,
	"status" "availability" DEFAULT 'Out of Stock' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"part_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"direction" "stock_direction" NOT NULL,
	"quantity" numeric(16, 3) NOT NULL,
	"unit_cost" numeric(16, 2) DEFAULT '0' NOT NULL,
	"inspection_status" "inspection_status",
	"rejected_qty" numeric(16, 3) DEFAULT '0' NOT NULL,
	"batch" varchar(60) DEFAULT '' NOT NULL,
	"reference" varchar(64) DEFAULT '' NOT NULL,
	"reference_id" uuid,
	"note" text DEFAULT '' NOT NULL,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bom_audit_entries" ADD CONSTRAINT "bom_audit_entries_bom_id_project_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."project_boms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_audit_entries" ADD CONSTRAINT "bom_audit_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_bom_id_project_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."project_boms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_vendor_id_suppliers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtypes" ADD CONSTRAINT "subtypes_category_id_material_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."material_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_category_id_material_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."material_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_subtype_id_subtypes_id_fk" FOREIGN KEY ("subtype_id") REFERENCES "public"."subtypes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_major_spec_id_major_specs_id_fk" FOREIGN KEY ("major_spec_id") REFERENCES "public"."major_specs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_engineer_id_users_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_boms" ADD CONSTRAINT "project_boms_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_boms" ADD CONSTRAINT "project_boms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_bom_id_project_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."project_boms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_lines" ADD CONSTRAINT "rfq_lines_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_lines" ADD CONSTRAINT "rfq_lines_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_lines" ADD CONSTRAINT "rfq_lines_bom_line_id_bom_lines_id_fk" FOREIGN KEY ("bom_line_id") REFERENCES "public"."bom_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_vendor_id_suppliers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_lines" ADD CONSTRAINT "quotation_lines_rfq_line_id_rfq_lines_id_fk" FOREIGN KEY ("rfq_line_id") REFERENCES "public"."rfq_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_lines" ADD CONSTRAINT "po_lines_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_lines" ADD CONSTRAINT "po_lines_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bom_audit_bom_idx" ON "bom_audit_entries" USING btree ("bom_id");--> statement-breakpoint
CREATE INDEX "bom_lines_bom_idx" ON "bom_lines" USING btree ("bom_id");--> statement-breakpoint
CREATE INDEX "bom_lines_part_idx" ON "bom_lines" USING btree ("part_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grades_code_unique" ON "grades" USING btree ("code") WHERE "grades"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_type_code_unique" ON "material_categories" USING btree ("type_code") WHERE "material_categories"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_name_unique" ON "material_categories" USING btree ("name") WHERE "material_categories"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "subtypes_category_idx" ON "subtypes" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subtypes_category_code_unique" ON "subtypes" USING btree ("category_id","code") WHERE "subtypes"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "major_specs_code_unique" ON "major_specs" USING btree ("code") WHERE "major_specs"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "units_code_unique" ON "units" USING btree ("code") WHERE "units"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_code_unique" ON "suppliers" USING btree ("code") WHERE "suppliers"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "suppliers_name_idx" ON "suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "suppliers_status_idx" ON "suppliers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "parts_part_number_unique" ON "parts" USING btree ("part_number") WHERE "parts"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "parts_category_idx" ON "parts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "parts_subtype_idx" ON "parts" USING btree ("subtype_id");--> statement-breakpoint
CREATE INDEX "parts_name_idx" ON "parts" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_number_unique" ON "projects" USING btree ("project_number") WHERE "projects"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "projects_stage_idx" ON "projects" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "projects_customer_idx" ON "projects" USING btree ("customer");--> statement-breakpoint
CREATE UNIQUE INDEX "project_boms_number_unique" ON "project_boms" USING btree ("number") WHERE "project_boms"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "project_boms_project_idx" ON "project_boms" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_boms_stage_idx" ON "project_boms" USING btree ("stage");--> statement-breakpoint
CREATE UNIQUE INDEX "rfqs_number_unique" ON "rfqs" USING btree ("number") WHERE "rfqs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "rfqs_status_idx" ON "rfqs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rfq_lines_rfq_idx" ON "rfq_lines" USING btree ("rfq_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_rfq_vendor_unique" ON "quotations" USING btree ("rfq_id","vendor_id") WHERE "quotations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "quotations_rfq_idx" ON "quotations" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "quotation_lines_quotation_idx" ON "quotation_lines" USING btree ("quotation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_orders_number_unique" ON "purchase_orders" USING btree ("number") WHERE "purchase_orders"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "purchase_orders_supplier_idx" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "po_lines_po_idx" ON "po_lines" USING btree ("po_id");--> statement-breakpoint
CREATE UNIQUE INDEX "warehouses_code_unique" ON "warehouses" USING btree ("code") WHERE "warehouses"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_balances_part_warehouse_unique" ON "stock_balances" USING btree ("part_id","warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_balances_warehouse_idx" ON "stock_balances" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_balances_part_idx" ON "stock_balances" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "stock_movements_part_idx" ON "stock_movements" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "stock_movements_warehouse_idx" ON "stock_movements" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_movements_type_idx" ON "stock_movements" USING btree ("type");