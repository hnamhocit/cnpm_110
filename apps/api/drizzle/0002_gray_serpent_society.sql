CREATE TABLE "film_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"camera" varchar(150),
	"lens" varchar(150),
	"aperture" varchar(30),
	"shutter_speed" varchar(30),
	"focal_length_mm" integer,
	"frame_number" integer,
	"lab_name" varchar(150),
	"scan_details" text,
	"captured_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "film_metadata_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "film_metadata_focal_length_positive" CHECK ("film_metadata"."focal_length_mm" > 0),
	CONSTRAINT "film_metadata_frame_number_non_negative" CHECK ("film_metadata"."frame_number" >= 0)
);
--> statement-breakpoint
CREATE TABLE "film_rolls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"film_stock" varchar(150) NOT NULL,
	"iso" integer NOT NULL,
	"format" varchar(50) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "film_rolls_iso_positive" CHECK ("film_rolls"."iso" > 0)
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"film_roll_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"image_key" text NOT NULL,
	"proof_key" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_status_valid" CHECK ("submissions"."status" IN (
        'draft', 'submitted', 'approved', 'rejected'
      )),
	CONSTRAINT "submissions_title_not_empty" CHECK (length(trim("submissions"."title")) > 0),
	CONSTRAINT "submissions_image_key_not_empty" CHECK (length(trim("submissions"."image_key")) > 0)
);
--> statement-breakpoint
ALTER TABLE "film_metadata" ADD CONSTRAINT "film_metadata_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_rolls" ADD CONSTRAINT "film_rolls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_film_roll_id_film_rolls_id_fk" FOREIGN KEY ("film_roll_id") REFERENCES "public"."film_rolls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_film_rolls_user_id" ON "film_rolls" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_submissions_user_id" ON "submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_category_id" ON "submissions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_film_roll_id" ON "submissions" USING btree ("film_roll_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_status" ON "submissions" USING btree ("status");