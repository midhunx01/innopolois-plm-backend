CREATE TYPE "public"."availability" AS ENUM('In Stock', 'Low Stock', 'Backorder', 'Out of Stock');--> statement-breakpoint
CREATE TYPE "public"."lifecycle" AS ENUM('Concept', 'In Design', 'In Review', 'Released', 'Production', 'Obsolete');--> statement-breakpoint
CREATE TYPE "public"."sourcing_type" AS ENUM('Make', 'Buy', 'Standard');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('Administrator', 'Engineering', 'Commercial', 'Purchase', 'Stores', 'Management');--> statement-breakpoint
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
ALTER TABLE "subtypes" ADD CONSTRAINT "subtypes_category_id_material_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."material_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_category_id_material_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."material_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_subtype_id_subtypes_id_fk" FOREIGN KEY ("subtype_id") REFERENCES "public"."subtypes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_major_spec_id_major_specs_id_fk" FOREIGN KEY ("major_spec_id") REFERENCES "public"."major_specs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "grades_code_unique" ON "grades" USING btree ("code") WHERE "grades"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_type_code_unique" ON "material_categories" USING btree ("type_code") WHERE "material_categories"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "material_categories_name_unique" ON "material_categories" USING btree ("name") WHERE "material_categories"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "subtypes_category_idx" ON "subtypes" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subtypes_category_code_unique" ON "subtypes" USING btree ("category_id","code") WHERE "subtypes"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "major_specs_code_unique" ON "major_specs" USING btree ("code") WHERE "major_specs"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "units_code_unique" ON "units" USING btree ("code") WHERE "units"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "parts_part_number_unique" ON "parts" USING btree ("part_number") WHERE "parts"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "parts_category_idx" ON "parts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "parts_subtype_idx" ON "parts" USING btree ("subtype_id");--> statement-breakpoint
CREATE INDEX "parts_name_idx" ON "parts" USING btree ("name");