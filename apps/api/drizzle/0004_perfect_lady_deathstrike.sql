CREATE TABLE "submission_ai_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"phash_hex" varchar(16),
	"ai_generated_probability" numeric(5, 4) NOT NULL,
	"is_ai_flagged" boolean DEFAULT false NOT NULL,
	"duplicate_suspect_id" uuid,
	"duplicate_similarity_score" numeric(5, 4),
	"film_grain_score" numeric(5, 4),
	"predicted_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"flag_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_ai_analyses_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
CREATE TABLE "submission_moderation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"moderator_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"previous_status" varchar(40) NOT NULL,
	"new_status" varchar(40) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "submission_ai_analyses" ADD CONSTRAINT "submission_ai_analyses_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_ai_analyses" ADD CONSTRAINT "submission_ai_analyses_duplicate_suspect_id_submissions_id_fk" FOREIGN KEY ("duplicate_suspect_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_moderation_logs" ADD CONSTRAINT "submission_moderation_logs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_moderation_logs" ADD CONSTRAINT "submission_moderation_logs_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_analyses_submission_id" ON "submission_ai_analyses" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_ai_analyses_is_flagged" ON "submission_ai_analyses" USING btree ("is_ai_flagged");--> statement-breakpoint
CREATE INDEX "idx_moderation_logs_submission_id" ON "submission_moderation_logs" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_logs_moderator_id" ON "submission_moderation_logs" USING btree ("moderator_id");--> statement-breakpoint
CREATE INDEX "idx_contests_is_deleted" ON "contests" USING btree ("is_deleted");