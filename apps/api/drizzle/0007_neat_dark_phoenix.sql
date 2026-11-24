CREATE TABLE "contest_judges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"judge_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_judge_id_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contest_judges_judge_id" ON "contest_judges" USING btree ("judge_id");--> statement-breakpoint
CREATE INDEX "idx_contest_judges_category_id" ON "contest_judges" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_contest_judges_contest_id" ON "contest_judges" USING btree ("contest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_contest_judges_active" ON "contest_judges" USING btree ("category_id","judge_id") WHERE "contest_judges"."is_active" = true;