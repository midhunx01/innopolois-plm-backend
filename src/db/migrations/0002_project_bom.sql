CREATE TYPE "public"."bom_stage" AS ENUM('Draft', 'Technical Review', 'Commercial Review', 'Approved', 'Released for Purchase');--> statement-breakpoint
CREATE TYPE "public"."bom_type" AS ENUM('Engineering', 'Procurement', 'Final Released');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('Enquiry', 'Technical Evaluation', 'Quotation', 'Project Order', 'Detailed Engineering', 'Final BOM', 'Purchase Release', 'Procurement', 'Fulfilment', 'Completed');--> statement-breakpoint
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
ALTER TABLE "bom_audit_entries" ADD CONSTRAINT "bom_audit_entries_bom_id_project_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."project_boms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_audit_entries" ADD CONSTRAINT "bom_audit_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_bom_id_project_boms_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."project_boms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_vendor_id_suppliers_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_engineer_id_users_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_boms" ADD CONSTRAINT "project_boms_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_boms" ADD CONSTRAINT "project_boms_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bom_audit_bom_idx" ON "bom_audit_entries" USING btree ("bom_id");--> statement-breakpoint
CREATE INDEX "bom_lines_bom_idx" ON "bom_lines" USING btree ("bom_id");--> statement-breakpoint
CREATE INDEX "bom_lines_part_idx" ON "bom_lines" USING btree ("part_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_number_unique" ON "projects" USING btree ("project_number") WHERE "projects"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "projects_stage_idx" ON "projects" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "projects_customer_idx" ON "projects" USING btree ("customer");--> statement-breakpoint
CREATE UNIQUE INDEX "project_boms_number_unique" ON "project_boms" USING btree ("number") WHERE "project_boms"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "project_boms_project_idx" ON "project_boms" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_boms_stage_idx" ON "project_boms" USING btree ("stage");