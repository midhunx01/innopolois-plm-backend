CREATE TYPE "public"."inspection_status" AS ENUM('Pending', 'Accepted', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."stock_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('opening', 'purchase', 'sale_consumption', 'adjustment', 'wastage', 'transfer_in', 'transfer_out');--> statement-breakpoint
CREATE TYPE "public"."warehouse_type" AS ENUM('Distribution', 'Manufacturing', 'Buffer', 'Transit');--> statement-breakpoint
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
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "warehouses_code_unique" ON "warehouses" USING btree ("code") WHERE "warehouses"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_balances_part_warehouse_unique" ON "stock_balances" USING btree ("part_id","warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_balances_warehouse_idx" ON "stock_balances" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_balances_part_idx" ON "stock_balances" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "stock_movements_part_idx" ON "stock_movements" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "stock_movements_warehouse_idx" ON "stock_movements" USING btree ("warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_movements_type_idx" ON "stock_movements" USING btree ("type");