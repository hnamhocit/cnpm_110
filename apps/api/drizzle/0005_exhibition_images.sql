CREATE TABLE "exhibition_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"master_key" text NOT NULL,
	"webp_key" text,
	"watermark_applied" boolean DEFAULT false NOT NULL,
	"copyright_text" text,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"error_message" text,
	"published_by" uuid,
	"published_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exhibition_images_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "exhibition_images_status_valid" CHECK ("exhibition_images"."status" IN ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'PUBLISHED', 'ARCHIVED')),
	CONSTRAINT "exhibition_images_published_ready" CHECK ("exhibition_images"."status" <> 'PUBLISHED' OR ("exhibition_images"."webp_key" IS NOT NULL AND "exhibition_images"."watermark_applied" = true))
);
--> statement-breakpoint
ALTER TABLE "exhibition_images" ADD CONSTRAINT "exhibition_images_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibition_images" ADD CONSTRAINT "exhibition_images_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibition_images" ADD CONSTRAINT "exhibition_images_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exhibition_images_contest_status" ON "exhibition_images" USING btree ("contest_id","status");--> statement-breakpoint
CREATE INDEX "idx_exhibition_images_status" ON "exhibition_images" USING btree ("status");
