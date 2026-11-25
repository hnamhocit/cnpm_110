ALTER TABLE "scoring_criteria" ALTER COLUMN "weight" SET DATA TYPE numeric(7, 4);--> statement-breakpoint
ALTER TABLE "scoring_criteria" ALTER COLUMN "weight" SET DEFAULT '1';