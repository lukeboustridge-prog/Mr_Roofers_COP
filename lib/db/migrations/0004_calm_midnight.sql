CREATE TABLE "cop_section_details" (
	"section_id" text NOT NULL,
	"detail_id" text NOT NULL,
	"relationship_type" text NOT NULL,
	"notes" text,
	CONSTRAINT "cop_section_details_section_id_detail_id_pk" PRIMARY KEY("section_id","detail_id")
);
--> statement-breakpoint
CREATE TABLE "cop_section_htg" (
	"section_id" text NOT NULL,
	"htg_id" text NOT NULL,
	"relevance" text,
	"notes" text,
	CONSTRAINT "cop_section_htg_section_id_htg_id_pk" PRIMARY KEY("section_id","htg_id")
);
--> statement-breakpoint
CREATE TABLE "cop_section_images" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"image_filename" text NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"image_type" text,
	"sort_order" integer DEFAULT 0,
	"dimensions" jsonb
);
--> statement-breakpoint
CREATE TABLE "cop_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"section_number" text NOT NULL,
	"chapter_number" integer NOT NULL,
	"parent_id" text,
	"title" text NOT NULL,
	"level" integer NOT NULL,
	"sort_order" integer NOT NULL,
	"pdf_pages" jsonb,
	"has_content" boolean DEFAULT false,
	"source_id" text DEFAULT 'mrm-cop',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "cop_sections_section_number_unique" UNIQUE("section_number")
);
--> statement-breakpoint
CREATE TABLE "htg_content" (
	"id" text PRIMARY KEY NOT NULL,
	"source_document" text NOT NULL,
	"guide_name" text NOT NULL,
	"content" text,
	"images" jsonb,
	"pdf_page" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "details" ADD COLUMN "images" jsonb;--> statement-breakpoint
ALTER TABLE "details" ADD COLUMN "search_vector" text;--> statement-breakpoint
ALTER TABLE "cop_section_details" ADD CONSTRAINT "cop_section_details_section_id_cop_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."cop_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cop_section_details" ADD CONSTRAINT "cop_section_details_detail_id_details_id_fk" FOREIGN KEY ("detail_id") REFERENCES "public"."details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cop_section_htg" ADD CONSTRAINT "cop_section_htg_section_id_cop_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."cop_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cop_section_htg" ADD CONSTRAINT "cop_section_htg_htg_id_htg_content_id_fk" FOREIGN KEY ("htg_id") REFERENCES "public"."htg_content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cop_section_images" ADD CONSTRAINT "cop_section_images_section_id_cop_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."cop_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cop_sections" ADD CONSTRAINT "cop_sections_source_id_content_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."content_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cop_section_details_section" ON "cop_section_details" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_cop_section_details_detail" ON "cop_section_details" USING btree ("detail_id");--> statement-breakpoint
CREATE INDEX "idx_cop_section_images_section" ON "cop_section_images" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_cop_section_images_filename" ON "cop_section_images" USING btree ("image_filename");--> statement-breakpoint
CREATE INDEX "idx_cop_sections_chapter" ON "cop_sections" USING btree ("chapter_number");--> statement-breakpoint
CREATE INDEX "idx_cop_sections_parent" ON "cop_sections" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_cop_sections_number" ON "cop_sections" USING btree ("section_number");--> statement-breakpoint
CREATE INDEX "idx_htg_content_source" ON "htg_content" USING btree ("source_document");