CREATE TABLE "judging_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"position" integer NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"advance_count" integer,
	"required_judges" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	CONSTRAINT "judging_round_values" CHECK ("judging_rounds"."position" > 0 and "judging_rounds"."start_at" < "judging_rounds"."deadline_at"
    and "judging_rounds"."required_judges" > 0 and ("judging_rounds"."advance_count" is null or "judging_rounds"."advance_count" > 0))
);
--> statement-breakpoint
CREATE TABLE "judging_round_entries" (
	"round_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	CONSTRAINT "judging_round_entries_round_id_submission_id_pk" PRIMARY KEY("round_id","submission_id")
);
--> statement-breakpoint
DROP INDEX "uq_contest_judges_active";--> statement-breakpoint
DROP INDEX "uq_evaluations_submission_judge";--> statement-breakpoint
ALTER TABLE "contest_judges" ADD COLUMN "round_id" uuid;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "round_id" uuid;--> statement-breakpoint
ALTER TABLE "judging_rounds" ADD CONSTRAINT "judging_rounds_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judging_round_entries" ADD CONSTRAINT "judging_round_entries_round_id_judging_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."judging_rounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judging_round_entries" ADD CONSTRAINT "judging_round_entries_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_round_contest_position" ON "judging_rounds" USING btree ("contest_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_round_id_contest" ON "judging_rounds" USING btree ("id","contest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_round_active_contest" ON "judging_rounds" USING btree ("contest_id") WHERE "judging_rounds"."started_at" is not null and "judging_rounds"."locked_at" is null;--> statement-breakpoint
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_round_contest_fk" FOREIGN KEY ("round_id","contest_id") REFERENCES "public"."judging_rounds"("id","contest_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_round_id_judging_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."judging_rounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_contest_judges_round_active" ON "contest_judges" USING btree ("round_id","category_id","judge_id") WHERE "contest_judges"."round_id" is not null and "contest_judges"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_evaluations_round_submission_judge" ON "evaluations" USING btree ("round_id","submission_id","judge_id") WHERE "evaluations"."round_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_contest_judges_active" ON "contest_judges" USING btree ("category_id","judge_id") WHERE "contest_judges"."round_id" is null and "contest_judges"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_evaluations_submission_judge" ON "evaluations" USING btree ("submission_id","judge_id") WHERE "evaluations"."round_id" is null;