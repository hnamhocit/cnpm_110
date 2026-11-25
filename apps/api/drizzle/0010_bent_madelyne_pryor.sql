ALTER TABLE "contest_judges" ADD COLUMN "locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "locked_at";