ALTER TABLE "submissions" DROP CONSTRAINT "submissions_status_valid";--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_status_valid" CHECK ("submissions"."status" IN (
    'PENDING_AI',
    'VERIFIED',
    'SUSPICIOUS',
    'FLAGGED',
    'APPROVED',
    'DISQUALIFIED'
  ));