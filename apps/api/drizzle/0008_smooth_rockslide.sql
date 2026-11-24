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
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_criterion_id_scoring_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."scoring_criteria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_judge_id_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_evaluation_scores_evaluation_criterion" ON "evaluation_scores" USING btree ("evaluation_id","criterion_id");--> statement-breakpoint
CREATE INDEX "idx_evaluation_scores_criterion_id" ON "evaluation_scores" USING btree ("criterion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_evaluations_submission_judge" ON "evaluations" USING btree ("submission_id","judge_id");--> statement-breakpoint
CREATE INDEX "idx_evaluations_judge_id" ON "evaluations" USING btree ("judge_id");--> statement-breakpoint
CREATE INDEX "idx_evaluations_submission_id" ON "evaluations" USING btree ("submission_id");