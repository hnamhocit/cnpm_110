CREATE TABLE "account_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"reason" text,
	"changes" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_challenges" (
	"account_id" uuid NOT NULL,
	"purpose" varchar(20) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "account_challenges_account_id_purpose_pk" PRIMARY KEY("account_id","purpose")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"session_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"permissions_configured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"avatar_url" text,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"phone_number" varchar(16),
	"email_verified_at" timestamp with time zone,
	"phone_verified_at" timestamp with time zone,
	"verification_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contest_judges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"judge_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"locked_at" timestamp with time zone,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"max_score" numeric(5, 2) DEFAULT '10' NOT NULL,
	"weight" numeric(5, 4) DEFAULT '1' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scoring_criteria_weight_range" CHECK ("scoring_criteria"."weight" > 0 AND "scoring_criteria"."weight" <= 1),
	CONSTRAINT "scoring_criteria_max_score_positive" CHECK ("scoring_criteria"."max_score" > 0)
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
CREATE TABLE "film_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"film_brand" varchar(100) NOT NULL,
	"film_stock" varchar(150) NOT NULL,
	"film_format" varchar(50) NOT NULL,
	"iso_rated" integer NOT NULL,
	"iso_shot" integer NOT NULL,
	"camera_body" varchar(150) NOT NULL,
	"lens" varchar(150),
	"roll_id" varchar(100),
	"frame_number" varchar(20),
	"dev_lab_name" varchar(150),
	"dev_chemistry" varchar(50),
	"scanner_model" varchar(150),
	CONSTRAINT "film_metadata_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "film_metadata_iso_rated_positive" CHECK ("film_metadata"."iso_rated" > 0),
	CONSTRAINT "film_metadata_iso_shot_positive" CHECK ("film_metadata"."iso_shot" > 0)
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
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"rejection_reason" text,
	"image_original_path" text NOT NULL,
	"image_preview_path" text,
	"negative_proof_path" text,
	"file_size_bytes" bigint,
	"width" integer,
	"height" integer,
	"status" varchar(30) DEFAULT 'PENDING_AI' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_status_valid" CHECK ("submissions"."status" IN (
    'PENDING_AI',
    'VERIFIED',
    'SUSPICIOUS',
    'FLAGGED',
    'APPROVED',
    'DISQUALIFIED'
  )),
	CONSTRAINT "submissions_title_not_empty" CHECK (length(trim("submissions"."title")) > 0),
	CONSTRAINT "submissions_original_path_not_empty" CHECK (length(trim("submissions"."image_original_path")) > 0),
	CONSTRAINT "submissions_file_size_positive" CHECK ("submissions"."file_size_bytes" > 0),
	CONSTRAINT "submissions_width_positive" CHECK ("submissions"."width" > 0),
	CONSTRAINT "submissions_height_positive" CHECK ("submissions"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "ai_analysis_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_analysis_jobs_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
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
CREATE TABLE "evaluation_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"criterion_id" uuid NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evaluation_scores_score_non_negative" CHECK ("evaluation_scores"."score" >= 0)
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"judge_id" uuid NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_categories_id_contest" ON "categories" USING btree ("id","contest_id");--> statement-breakpoint
ALTER TABLE "account_audit_logs" ADD CONSTRAINT "account_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_audit_logs" ADD CONSTRAINT "account_audit_logs_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_challenges" ADD CONSTRAINT "account_challenges_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_judge_id_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_category_contest_fk" FOREIGN KEY ("category_id","contest_id") REFERENCES "public"."categories"("id","contest_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_criteria" ADD CONSTRAINT "scoring_criteria_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_rolls" ADD CONSTRAINT "film_rolls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_metadata" ADD CONSTRAINT "film_metadata_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_moderation_logs" ADD CONSTRAINT "submission_moderation_logs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_moderation_logs" ADD CONSTRAINT "submission_moderation_logs_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_participant_id_users_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_category_contest_fk" FOREIGN KEY ("category_id","contest_id") REFERENCES "public"."categories"("id","contest_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis_jobs" ADD CONSTRAINT "ai_analysis_jobs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_ai_analyses" ADD CONSTRAINT "submission_ai_analyses_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_ai_analyses" ADD CONSTRAINT "submission_ai_analyses_duplicate_suspect_id_submissions_id_fk" FOREIGN KEY ("duplicate_suspect_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_criterion_id_scoring_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."scoring_criteria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_judge_id_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_account_challenges_token" ON "account_challenges" USING btree ("purpose","token_hash");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_session_id" ON "refresh_tokens" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_role_id" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_verified_phone_unique" ON "users" USING btree ("phone_number") WHERE "users"."phone_verified_at" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_categories_contest_id" ON "categories" USING btree ("contest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_categories_contest_name" ON "categories" USING btree ("contest_id","name");--> statement-breakpoint
CREATE INDEX "idx_contest_judges_judge_id" ON "contest_judges" USING btree ("judge_id");--> statement-breakpoint
CREATE INDEX "idx_contest_judges_category_id" ON "contest_judges" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_contest_judges_contest_id" ON "contest_judges" USING btree ("contest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_contest_judges_active" ON "contest_judges" USING btree ("category_id","judge_id") WHERE "contest_judges"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_contests_created_by" ON "contests" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_contests_status" ON "contests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contests_is_deleted" ON "contests" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "idx_scoring_criteria_category_id" ON "scoring_criteria" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_scoring_criteria_category_name" ON "scoring_criteria" USING btree ("category_id","name");--> statement-breakpoint
CREATE INDEX "idx_film_rolls_user_id" ON "film_rolls" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_logs_submission_id" ON "submission_moderation_logs" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_logs_moderator_id" ON "submission_moderation_logs" USING btree ("moderator_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_contest_id" ON "submissions" USING btree ("contest_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_category_id" ON "submissions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_participant_id" ON "submissions" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_status" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_analysis_jobs_status" ON "ai_analysis_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_analyses_submission_id" ON "submission_ai_analyses" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_ai_analyses_is_flagged" ON "submission_ai_analyses" USING btree ("is_ai_flagged");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_evaluation_scores_evaluation_criterion" ON "evaluation_scores" USING btree ("evaluation_id","criterion_id");--> statement-breakpoint
CREATE INDEX "idx_evaluation_scores_criterion_id" ON "evaluation_scores" USING btree ("criterion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_evaluations_submission_judge" ON "evaluations" USING btree ("submission_id","judge_id");--> statement-breakpoint
CREATE INDEX "idx_evaluations_judge_id" ON "evaluations" USING btree ("judge_id");--> statement-breakpoint
CREATE INDEX "idx_evaluations_submission_id" ON "evaluations" USING btree ("submission_id");