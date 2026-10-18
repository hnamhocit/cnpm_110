ALTER TABLE "submissions" RENAME COLUMN "user_id" TO "participant_id";--> statement-breakpoint
ALTER TABLE "submissions" RENAME COLUMN "image_key" TO "image_original_path";--> statement-breakpoint
ALTER TABLE "submissions" RENAME COLUMN "proof_key" TO "negative_proof_path";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP CONSTRAINT "film_metadata_focal_length_positive";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP CONSTRAINT "film_metadata_frame_number_non_negative";--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_image_key_not_empty";--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_status_valid";--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_film_roll_id_film_rolls_id_fk";
--> statement-breakpoint
DROP INDEX "idx_submissions_user_id";--> statement-breakpoint
DROP INDEX "idx_submissions_film_roll_id";--> statement-breakpoint
ALTER TABLE "film_metadata" ALTER COLUMN "frame_number" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "status" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "status" SET DEFAULT 'PENDING_AI';--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "film_brand" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "film_stock" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "film_format" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "iso_rated" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "iso_shot" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "camera_body" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "roll_id" varchar(100);--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "dev_lab_name" varchar(150);--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "dev_chemistry" varchar(50);--> statement-breakpoint
ALTER TABLE "film_metadata" ADD COLUMN "scanner_model" varchar(150);--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "contest_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "image_preview_path" text;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "file_size_bytes" bigint;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_participant_id_users_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_submissions_contest_id" ON "submissions" USING btree ("contest_id");--> statement-breakpoint
CREATE INDEX "idx_submissions_participant_id" ON "submissions" USING btree ("participant_id");--> statement-breakpoint
ALTER TABLE "film_metadata" DROP COLUMN "camera";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP COLUMN "aperture";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP COLUMN "shutter_speed";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP COLUMN "focal_length_mm";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP COLUMN "lab_name";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP COLUMN "scan_details";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP COLUMN "captured_at";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "film_metadata" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN "film_roll_id";--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN "submitted_at";--> statement-breakpoint
ALTER TABLE "film_metadata" ADD CONSTRAINT "film_metadata_iso_rated_positive" CHECK ("film_metadata"."iso_rated" > 0);--> statement-breakpoint
ALTER TABLE "film_metadata" ADD CONSTRAINT "film_metadata_iso_shot_positive" CHECK ("film_metadata"."iso_shot" > 0);--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_original_path_not_empty" CHECK (length(trim("submissions"."image_original_path")) > 0);--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_file_size_positive" CHECK ("submissions"."file_size_bytes" > 0);--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_width_positive" CHECK ("submissions"."width" > 0);--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_height_positive" CHECK ("submissions"."height" > 0);--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_status_valid" CHECK ("submissions"."status" IN (
        'PENDING_AI', 'FLAGGED', 'APPROVED', 'DISQUALIFIED'
      ));