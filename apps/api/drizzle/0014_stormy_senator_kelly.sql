CREATE TABLE "account_challenges" (
	"account_id" uuid NOT NULL,
	"purpose" varchar(20) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "account_challenges_account_id_purpose_pk" PRIMARY KEY("account_id","purpose")
);
--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "permissions_configured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(16);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "account_challenges" ADD CONSTRAINT "account_challenges_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_account_challenges_token" ON "account_challenges" USING btree ("purpose","token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_verified_phone_unique" ON "users" USING btree ("phone_number") WHERE "users"."phone_verified_at" IS NOT NULL;