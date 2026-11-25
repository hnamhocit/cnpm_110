ALTER TABLE "contest_judges" DROP CONSTRAINT "contest_judges_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "scoring_criteria" ALTER COLUMN "weight" SET DATA TYPE numeric(5, 4);--> statement-breakpoint
ALTER TABLE "scoring_criteria" ALTER COLUMN "weight" SET DEFAULT '1';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_categories_id_contest" ON "categories" USING btree ("id","contest_id");--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_category_contest_fk" FOREIGN KEY ("category_id","contest_id") REFERENCES "public"."categories"("id","contest_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_category_contest_fk" FOREIGN KEY ("category_id","contest_id") REFERENCES "public"."categories"("id","contest_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_criteria" ADD CONSTRAINT "scoring_criteria_weight_range" CHECK ("scoring_criteria"."weight" > 0 AND "scoring_criteria"."weight" <= 1);--> statement-breakpoint
ALTER TABLE "scoring_criteria" ADD CONSTRAINT "scoring_criteria_max_score_positive" CHECK ("scoring_criteria"."max_score" > 0);