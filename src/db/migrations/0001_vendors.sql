CREATE TYPE "public"."supplier_status" AS ENUM('Approved', 'Preferred', 'Conditional', 'Under Review');--> statement-breakpoint
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
CREATE UNIQUE INDEX "suppliers_code_unique" ON "suppliers" USING btree ("code") WHERE "suppliers"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "suppliers_name_idx" ON "suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "suppliers_status_idx" ON "suppliers" USING btree ("status");--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;