-- Phase 7: Topics, Detail Links, and Legislative References
-- Adds cross-source linking infrastructure (DATA-01, DATA-02, DATA-03)
-- Applied via drizzle-kit push on 2026-02-01

-- Topics for semantic grouping (DATA-02)
CREATE TABLE IF NOT EXISTS "topics" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "icon_url" text,
  "sort_order" integer DEFAULT 0
);

-- Category-to-Topic mapping (many-to-many)
CREATE TABLE IF NOT EXISTS "category_topics" (
  "category_id" text NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "topic_id" text NOT NULL REFERENCES "topics"("id") ON DELETE CASCADE,
  PRIMARY KEY ("category_id", "topic_id")
);

-- Detail links with authority hierarchy (DATA-01)
-- Primary = MRM authoritative detail, Supplementary = RANZ supporting content
CREATE TABLE IF NOT EXISTS "detail_links" (
  "id" text PRIMARY KEY,
  "primary_detail_id" text NOT NULL REFERENCES "details"("id") ON DELETE CASCADE,
  "supplementary_detail_id" text NOT NULL REFERENCES "details"("id") ON DELETE CASCADE,
  "link_type" text NOT NULL,
  "match_confidence" text,
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "no_self_link" CHECK ("primary_detail_id" != "supplementary_detail_id")
);

CREATE INDEX IF NOT EXISTS "idx_detail_links_primary" ON "detail_links" ("primary_detail_id");
CREATE INDEX IF NOT EXISTS "idx_detail_links_supplementary" ON "detail_links" ("supplementary_detail_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_detail_links_unique" ON "detail_links" ("primary_detail_id", "supplementary_detail_id");

-- Legislative references normalization (DATA-03)
CREATE TABLE IF NOT EXISTS "legislative_references" (
  "id" text PRIMARY KEY,
  "code" text NOT NULL,
  "edition" text,
  "amendment" text,
  "clause" text NOT NULL,
  "title" text NOT NULL,
  "authority_level" text NOT NULL,
  "source_url" text,
  "effective_date" timestamp,
  "superseded_by" text REFERENCES "legislative_references"("id"),
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_leg_refs_code" ON "legislative_references" ("code");

-- Detail-to-LegislativeReference mapping
CREATE TABLE IF NOT EXISTS "detail_legislative_links" (
  "detail_id" text NOT NULL REFERENCES "details"("id") ON DELETE CASCADE,
  "legislative_ref_id" text NOT NULL REFERENCES "legislative_references"("id") ON DELETE CASCADE,
  "context" text,
  PRIMARY KEY ("detail_id", "legislative_ref_id")
);
