CREATE TABLE "contest_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"contest_id" uuid NOT NULL,
	"kind" varchar(40) NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_status_valid";--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "require_negative_proof" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "proof_type" varchar(20);--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "proof_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "proof_deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "proof_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "proof_verified_by" uuid;--> statement-breakpoint
ALTER TABLE "contest_notifications" ADD CONSTRAINT "contest_notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_notifications" ADD CONSTRAINT "contest_notifications_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contest_notifications_recipient" ON "contest_notifications" USING btree ("recipient_id","created_at");--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_proof_verified_by_users_id_fk" FOREIGN KEY ("proof_verified_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submission_proof_type_valid" CHECK ("submissions"."proof_type" is null or "submissions"."proof_type" in ('negative', 'contact_sheet'));--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_status_valid" CHECK ("submissions"."status" IN (
    'PENDING_AI',
    'PROOF_REQUESTED',
    'PROOF_SUBMITTED',
    'VERIFIED',
    'SUSPICIOUS',
    'FLAGGED',
    'APPROVED',
    'DISQUALIFIED'
  ));