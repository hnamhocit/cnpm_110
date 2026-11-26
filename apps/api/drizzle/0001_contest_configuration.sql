CREATE SEQUENCE "public"."contest_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "code" varchar(50) DEFAULT 'CON-' || to_char(now() AT TIME ZONE 'UTC', 'YYYY') || '-' || to_char(nextval('contest_code_seq'), 'FM9999999999999999900') NOT NULL;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "theme" varchar(255);--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "rules" text;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "judging_start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "judging_deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "rounds" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "contests" ADD COLUMN "awards" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_contests_code" ON "contests" USING btree ("code");--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_configuration_schedule" CHECK (
      ("contests"."judging_start_at" IS NULL AND "contests"."judging_deadline_at" IS NULL AND "contests"."published_at" IS NULL)
      OR ("contests"."start_at" IS NOT NULL AND "contests"."end_at" IS NOT NULL
        AND "contests"."judging_start_at" IS NOT NULL AND "contests"."judging_deadline_at" IS NOT NULL
        AND "contests"."published_at" IS NOT NULL
        AND "contests"."start_at" < "contests"."end_at" AND "contests"."end_at" < "contests"."judging_start_at"
        AND "contests"."judging_start_at" < "contests"."judging_deadline_at" AND "contests"."judging_deadline_at" < "contests"."published_at")
    );