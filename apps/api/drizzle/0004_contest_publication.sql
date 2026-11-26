CREATE TABLE "contest_publications" (
	"contest_id" uuid PRIMARY KEY NOT NULL,
	"round_id" uuid NOT NULL,
	"contest_name" varchar(150) NOT NULL,
	"published_by" uuid NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"action" varchar(25) DEFAULT 'PUBLISH_RESULTS' NOT NULL,
	"tie_breaks" jsonb NOT NULL,
	"entries" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contest_publications" ADD CONSTRAINT "contest_publications_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_publications" ADD CONSTRAINT "contest_publications_round_id_judging_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."judging_rounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_publications" ADD CONSTRAINT "contest_publications_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;