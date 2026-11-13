CREATE TYPE "public"."poll_results_visibility" AS ENUM('HIDDEN', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."poll_status" AS ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."poll_type" AS ENUM('LEADERSHIP_ELECTION', 'KINGDOM_DECISION');--> statement-breakpoint
CREATE TABLE "poll_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"action" varchar(64) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"label" varchar(120) NOT NULL,
	"short_description" varchar(280) DEFAULT '' NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"image_url" varchar(512),
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"citizen_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "poll_votes_poll_citizen_unique" UNIQUE("poll_id","citizen_id")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"type" "poll_type" NOT NULL,
	"status" "poll_status" DEFAULT 'DRAFT' NOT NULL,
	"results_visibility" "poll_results_visibility" DEFAULT 'HIDDEN' NOT NULL,
	"scheduled_start_at" timestamp with time zone,
	"scheduled_end_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"opened_at" timestamp with time zone,
	"opened_by" uuid,
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"results_published_at" timestamp with time zone,
	"published_by" uuid,
	"results_withdrawn_at" timestamp with time zone,
	"withdrawn_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "poll_audit_logs" ADD CONSTRAINT "poll_audit_logs_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_audit_logs" ADD CONSTRAINT "poll_audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_poll_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."poll_options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_citizen_id_citizens_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."citizens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_withdrawn_by_users_id_fk" FOREIGN KEY ("withdrawn_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "poll_audit_logs_poll_idx" ON "poll_audit_logs" USING btree ("poll_id","created_at");--> statement-breakpoint
CREATE INDEX "poll_audit_logs_actor_idx" ON "poll_audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "poll_options_poll_order_idx" ON "poll_options" USING btree ("poll_id","display_order");--> statement-breakpoint
CREATE INDEX "poll_votes_poll_idx" ON "poll_votes" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "poll_votes_option_idx" ON "poll_votes" USING btree ("option_id");--> statement-breakpoint
CREATE INDEX "poll_votes_citizen_idx" ON "poll_votes" USING btree ("citizen_id");--> statement-breakpoint
CREATE INDEX "polls_status_visibility_idx" ON "polls" USING btree ("status","results_visibility");--> statement-breakpoint
CREATE INDEX "polls_type_idx" ON "polls" USING btree ("type");--> statement-breakpoint
CREATE INDEX "polls_created_at_idx" ON "polls" USING btree ("created_at");
