CREATE TABLE "cameras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(150) NOT NULL,
	"camera_type" varchar(30) NOT NULL,
	"supported_format" varchar(20) DEFAULT '135' NOT NULL,
	"default_lens_mount" varchar(50),
	"has_fixed_lens" boolean DEFAULT false NOT NULL,
	"fixed_lens_specs" varchar(150),
	"shutter_mechanism" varchar(30) DEFAULT 'MECHANICAL' NOT NULL,
	"production_start_year" integer,
	"production_end_year" integer,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "cameras_code_unique" UNIQUE("code"),
	CONSTRAINT "cameras_status_enum" CHECK ("cameras"."status" IN ('DRAFT', 'ACTIVE', 'DEPRECATED'))
);
--> statement-breakpoint
CREATE TABLE "film_labs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"city" varchar(100) NOT NULL,
	"address" text,
	"website_url" varchar(255),
	"email" varchar(150),
	"phone" varchar(30),
	"supported_processes" varchar(20)[] NOT NULL,
	"scanners" varchar(50)[] NOT NULL,
	"is_verified_partner" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "film_labs_code_unique" UNIQUE("code"),
	CONSTRAINT "film_labs_status_enum" CHECK ("film_labs"."status" IN ('DRAFT', 'ACTIVE', 'DEPRECATED'))
);
--> statement-breakpoint
CREATE TABLE "film_stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"name" varchar(150) NOT NULL,
	"nominal_iso" integer NOT NULL,
	"process" varchar(20) NOT NULL,
	"color_type" varchar(30) NOT NULL,
	"supported_formats" varchar(20)[] DEFAULT ARRAY['135']::varchar[] NOT NULL,
	"is_dx_coded" boolean DEFAULT true NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "film_stocks_code_unique" UNIQUE("code"),
	CONSTRAINT "film_stocks_iso_range" CHECK ("film_stocks"."nominal_iso" >= 6 AND "film_stocks"."nominal_iso" <= 12800),
	CONSTRAINT "film_stocks_process_enum" CHECK ("film_stocks"."process" IN ('C-41', 'B&W', 'E-6', 'ECN-2')),
	CONSTRAINT "film_stocks_status_enum" CHECK ("film_stocks"."status" IN ('DRAFT', 'ACTIVE', 'DEPRECATED'))
);
--> statement-breakpoint
CREATE TABLE "lenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(150) NOT NULL,
	"mount_type" varchar(50) NOT NULL,
	"focal_length_min_mm" numeric(6, 2) NOT NULL,
	"focal_length_max_mm" numeric(6, 2),
	"is_prime" boolean DEFAULT true NOT NULL,
	"max_aperture" numeric(3, 1) NOT NULL,
	"min_aperture" numeric(3, 1),
	"format_coverage" varchar(20)[] DEFAULT ARRAY['135']::varchar[] NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "lenses_code_unique" UNIQUE("code"),
	CONSTRAINT "lenses_status_enum" CHECK ("lenses"."status" IN ('DRAFT', 'ACTIVE', 'DEPRECATED'))
);
--> statement-breakpoint
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_labs" ADD CONSTRAINT "film_labs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_labs" ADD CONSTRAINT "film_labs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_stocks" ADD CONSTRAINT "film_stocks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_stocks" ADD CONSTRAINT "film_stocks_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lenses" ADD CONSTRAINT "lenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lenses" ADD CONSTRAINT "lenses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cameras_brand_model" ON "cameras" USING btree (LOWER("brand"),LOWER("model")) WHERE "cameras"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_cameras_filter" ON "cameras" USING btree ("brand","camera_type","supported_format","status") WHERE "cameras"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_film_labs_name_city" ON "film_labs" USING btree (LOWER("name"),LOWER("city"),"country_code") WHERE "film_labs"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_film_labs_location" ON "film_labs" USING btree ("country_code","city","is_verified_partner","status") WHERE "film_labs"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_film_labs_processes" ON "film_labs" USING gin ("supported_processes");--> statement-breakpoint
CREATE INDEX "idx_film_labs_scanners" ON "film_labs" USING gin ("scanners");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_film_stocks_brand_name_iso" ON "film_stocks" USING btree (LOWER("brand"),LOWER("name"),"nominal_iso") WHERE "film_stocks"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_film_stocks_lookup" ON "film_stocks" USING btree ("brand","process","status") WHERE "film_stocks"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_film_stocks_formats" ON "film_stocks" USING gin ("supported_formats");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_lenses_brand_model_mount" ON "lenses" USING btree (LOWER("brand"),LOWER("model"),LOWER("mount_type")) WHERE "lenses"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "idx_lenses_mount_prime" ON "lenses" USING btree ("mount_type","is_prime","status") WHERE "lenses"."is_deleted" = false;