CREATE TYPE "public"."po_status" AS ENUM('Draft', 'Pending Approval', 'Open', 'Partially Received', 'Received', 'Closed', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('Low', 'Medium', 'High', 'Critical');--> statement-breakpoint
CREATE TYPE "public"."quotation_status" AS ENUM('Pending', 'Received', 'Under Review', 'Awarded', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."rfq_mode" AS ENUM('Vendor-wise', 'Category-wise', 'Package-wise', 'Single Item', 'Bulk');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('Draft', 'Sent', 'Quotes In', 'Comparison', 'Awarded', 'Closed');--> statement-breakpoint
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
CREATE UNIQUE INDEX "rfqs_number_unique" ON "rfqs" USING btree ("number") WHERE "rfqs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "rfqs_status_idx" ON "rfqs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rfq_lines_rfq_idx" ON "rfq_lines" USING btree ("rfq_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotations_rfq_vendor_unique" ON "quotations" USING btree ("rfq_id","vendor_id") WHERE "quotations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "quotations_rfq_idx" ON "quotations" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "quotation_lines_quotation_idx" ON "quotation_lines" USING btree ("quotation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_orders_number_unique" ON "purchase_orders" USING btree ("number") WHERE "purchase_orders"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "purchase_orders_supplier_idx" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "po_lines_po_idx" ON "po_lines" USING btree ("po_id");