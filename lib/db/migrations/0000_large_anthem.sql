CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"substrate_id" text,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "checklists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"detail_id" text,
	"project_ref" text,
	"items" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "detail_failure_links" (
	"detail_id" text NOT NULL,
	"failure_case_id" text NOT NULL,
	CONSTRAINT "detail_failure_links_detail_id_failure_case_id_pk" PRIMARY KEY("detail_id","failure_case_id")
);
--> statement-breakpoint
CREATE TABLE "detail_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"detail_id" text,
	"step_number" integer NOT NULL,
	"instruction" text NOT NULL,
	"image_url" text,
	"caution_note" text
);
--> statement-breakpoint
CREATE TABLE "details" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"substrate_id" text,
	"category_id" text,
	"subcategory_id" text,
	"model_url" text,
	"thumbnail_url" text,
	"specifications" jsonb,
	"standards_refs" jsonb,
	"ventilation_reqs" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "details_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "failure_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"substrate_tags" jsonb,
	"detail_tags" jsonb,
	"failure_type" text,
	"nzbc_clauses" jsonb,
	"outcome" text,
	"summary" text,
	"source_url" text,
	"decision_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "failure_cases_case_id_unique" UNIQUE("case_id")
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "substrates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "user_favourites" (
	"user_id" text NOT NULL,
	"detail_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_favourites_user_id_detail_id_pk" PRIMARY KEY("user_id","detail_id")
);
--> statement-breakpoint
CREATE TABLE "user_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"detail_id" text,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image_url" text,
	"preferences" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warning_conditions" (
	"id" text PRIMARY KEY NOT NULL,
	"detail_id" text,
	"condition_type" text NOT NULL,
	"condition_value" text NOT NULL,
	"warning_text" text NOT NULL,
	"severity" text DEFAULT 'warning',
	"nzbc_ref" text
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_substrate_id_substrates_id_fk" FOREIGN KEY ("substrate_id") REFERENCES "public"."substrates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_detail_id_details_id_fk" FOREIGN KEY ("detail_id") REFERENCES "public"."details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detail_failure_links" ADD CONSTRAINT "detail_failure_links_detail_id_details_id_fk" FOREIGN KEY ("detail_id") REFERENCES "public"."details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detail_failure_links" ADD CONSTRAINT "detail_failure_links_failure_case_id_failure_cases_id_fk" FOREIGN KEY ("failure_case_id") REFERENCES "public"."failure_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detail_steps" ADD CONSTRAINT "detail_steps_detail_id_details_id_fk" FOREIGN KEY ("detail_id") REFERENCES "public"."details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "details" ADD CONSTRAINT "details_substrate_id_substrates_id_fk" FOREIGN KEY ("substrate_id") REFERENCES "public"."substrates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "details" ADD CONSTRAINT "details_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "details" ADD CONSTRAINT "details_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favourites" ADD CONSTRAINT "user_favourites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favourites" ADD CONSTRAINT "user_favourites_detail_id_details_id_fk" FOREIGN KEY ("detail_id") REFERENCES "public"."details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_history" ADD CONSTRAINT "user_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_history" ADD CONSTRAINT "user_history_detail_id_details_id_fk" FOREIGN KEY ("detail_id") REFERENCES "public"."details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warning_conditions" ADD CONSTRAINT "warning_conditions_detail_id_details_id_fk" FOREIGN KEY ("detail_id") REFERENCES "public"."details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_checklists_user" ON "checklists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_details_substrate" ON "details" USING btree ("substrate_id");--> statement-breakpoint
CREATE INDEX "idx_details_category" ON "details" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_history_user" ON "user_history" USING btree ("user_id");