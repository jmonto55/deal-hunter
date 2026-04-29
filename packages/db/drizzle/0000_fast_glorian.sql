CREATE TYPE "public"."operation_type" AS ENUM('venta', 'arriendo', 'arriendo_venta');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('nuevo', 'usado', 'en_proyecto');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('apartamento', 'casa', 'apartaestudio', 'penthouse', 'lote', 'oficina', 'local', 'bodega', 'finca', 'casa_campestre');--> statement-breakpoint
CREATE TABLE "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"property_type" "property_type" NOT NULL,
	"operation_type" "operation_type" NOT NULL,
	"property_status" "property_status",
	"price_cop" bigint NOT NULL,
	"admin_fee_cop" bigint,
	"price_per_m2_cop" bigint,
	"area_built_m2" integer NOT NULL,
	"area_private_m2" integer,
	"area_total_m2" integer,
	"bedrooms" smallint DEFAULT 0 NOT NULL,
	"bathrooms" smallint DEFAULT 0 NOT NULL,
	"parking_spaces" smallint,
	"floor" smallint,
	"total_floors" smallint,
	"year_built" smallint,
	"stratum" smallint,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"address" text,
	"neighborhood" text,
	"commune" text,
	"city" text NOT NULL,
	"department" text,
	"country" text DEFAULT 'CO' NOT NULL,
	"has_elevator" boolean DEFAULT false NOT NULL,
	"has_pool" boolean DEFAULT false NOT NULL,
	"has_gym" boolean DEFAULT false NOT NULL,
	"has_security" boolean DEFAULT false NOT NULL,
	"has_balcony" boolean DEFAULT false NOT NULL,
	"is_furnished" boolean DEFAULT false NOT NULL,
	"pets_allowed" boolean DEFAULT false NOT NULL,
	"source" text,
	"source_url" text,
	"source_id" text,
	"images" text[],
	"market_price_cop" bigint,
	"discount_pct" numeric(5, 2),
	"roi_annual_pct" numeric(5, 2),
	"deal_score" smallint,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_exclusive" boolean DEFAULT false NOT NULL,
	"listed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "deals_city_idx" ON "deals" USING btree ("city");--> statement-breakpoint
CREATE INDEX "deals_property_type_idx" ON "deals" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "deals_operation_type_idx" ON "deals" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "deals_price_cop_idx" ON "deals" USING btree ("price_cop");--> statement-breakpoint
CREATE INDEX "deals_created_at_idx" ON "deals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deals_lat_lng_idx" ON "deals" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX "deals_source_unique_idx" ON "deals" USING btree ("source","source_id");