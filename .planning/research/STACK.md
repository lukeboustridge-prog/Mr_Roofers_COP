# Technology Stack: Multi-Source Content Integration

**Project:** Master Roofers Code of Practice - Unified COP Architecture
**Researched:** 2026-01-31
**Mode:** Focused research on data linking patterns for MRM/RANZ integration

## Executive Summary

This research addresses four specific schema requirements for integrating MRM COP (authoritative technical standards) with RANZ Roofing Guide (practical installation instructions):

1. **Multi-source document integration** where MRM is the authoritative source
2. **Many-to-many content linking** between MRM topics and RANZ installation guides
3. **Dynamic content availability flags** (has 3D, has images, has steps)
4. **Source attribution for legislative citation** (Building Code references)

The existing schema already has good foundations (contentSources, sourceId on details, detailCrossReferences). The recommended approach builds on these rather than replacing them.

---

## 1. Authoritative Source Pattern

### Current State

The existing `details` table has `sourceId` referencing `contentSources`:

```typescript
// Current: Each detail belongs to ONE source
details.sourceId → contentSources.id  // 'mrm-cop' or 'ranz-guide'
```

This works for **distinct content** but not for **linked content** where:
- MRM F07 (Valley Flashing) should link to RANZ-F07 (Valley Installation Guide)
- The MRM entry is authoritative for citing in Building Code contexts
- The RANZ entry provides practical installation steps

### Recommended Pattern: Primary/Supplementary Linking Table

Create a dedicated linking table that establishes authoritative relationships:

```typescript
// NEW TABLE: Content Linking with Authoritative Hierarchy
export const detailLinks = pgTable('detail_links', {
  id: text('id').primaryKey(),                    // e.g., 'link-f07-valley'
  primaryDetailId: text('primary_detail_id')      // MRM detail (authoritative)
    .references(() => details.id).notNull(),
  supplementaryDetailId: text('supplementary_detail_id')  // RANZ detail
    .references(() => details.id).notNull(),
  linkType: text('link_type').notNull(),          // 'installation_guide' | 'technical_supplement' | 'alternative'
  matchConfidence: text('match_confidence'),       // 'exact' | 'partial' | 'related'
  notes: text('notes'),                           // Admin notes on relationship
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  primaryIdx: index('idx_detail_links_primary').on(table.primaryDetailId),
  supplementaryIdx: index('idx_detail_links_supplementary').on(table.supplementaryDetailId),
  uniqueLink: index('idx_detail_links_unique').on(table.primaryDetailId, table.supplementaryDetailId),
}));
```

**Why this pattern over updating detailCrossReferences:**

The existing `detailCrossReferences` table uses `relationshipType` for generic relationships ('junction', 'alternative', 'companion'). The new `detailLinks` table:

1. **Explicitly models authority** - `primaryDetailId` is always the authoritative source
2. **Supports asymmetric relationships** - MRM cites RANZ, but RANZ references back differently
3. **Includes match quality** - `matchConfidence` helps UI show "(Exact match)" vs "(Related guide)"
4. **Separates concerns** - Cross-references are peer relationships; links are hierarchical

### Migration Path

```sql
-- Migration: 0002_add_detail_links.sql

-- Create the detail_links table
CREATE TABLE IF NOT EXISTS "detail_links" (
  "id" text PRIMARY KEY,
  "primary_detail_id" text NOT NULL REFERENCES "details"("id") ON DELETE CASCADE,
  "supplementary_detail_id" text NOT NULL REFERENCES "details"("id") ON DELETE CASCADE,
  "link_type" text NOT NULL,
  "match_confidence" text,
  "notes" text,
  "created_at" timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_detail_links_primary" ON "detail_links" ("primary_detail_id");
CREATE INDEX IF NOT EXISTS "idx_detail_links_supplementary" ON "detail_links" ("supplementary_detail_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_detail_links_unique" ON "detail_links" ("primary_detail_id", "supplementary_detail_id");

-- Prevent self-linking
ALTER TABLE "detail_links" ADD CONSTRAINT "no_self_link"
  CHECK ("primary_detail_id" != "supplementary_detail_id");
```

### Query Pattern for Unified Detail View

```typescript
// Get MRM detail with linked RANZ installation guide
export async function getDetailWithSupplements(mrmDetailId: string) {
  const [detail] = await db
    .select()
    .from(details)
    .where(eq(details.id, mrmDetailId))
    .limit(1);

  if (!detail) return null;

  // Get linked RANZ guides
  const linkedGuides = await db
    .select({
      link: detailLinks,
      supplement: details,
    })
    .from(detailLinks)
    .innerJoin(details, eq(detailLinks.supplementaryDetailId, details.id))
    .where(eq(detailLinks.primaryDetailId, mrmDetailId));

  // Get steps from RANZ if MRM has no steps
  let stepsSource = detail;
  let stepsFromSupplementary = false;

  if (linkedGuides.length > 0) {
    const [primarySteps] = await db
      .select({ count: count() })
      .from(detailSteps)
      .where(eq(detailSteps.detailId, mrmDetailId));

    if (primarySteps.count === 0) {
      // Use first linked guide's steps
      stepsSource = linkedGuides[0].supplement;
      stepsFromSupplementary = true;
    }
  }

  return {
    ...detail,
    linkedGuides: linkedGuides.map(lg => ({
      ...lg.supplement,
      linkType: lg.link.linkType,
      matchConfidence: lg.link.matchConfidence,
    })),
    stepsFromSupplementary,
  };
}
```

---

## 2. Many-to-Many Content Linking

### Current State

The `detailCrossReferences` table provides basic many-to-many:

```typescript
// Existing: Symmetric peer relationships
detailCrossReferences: (detailId, relatedDetailId, relationshipType)
```

### Recommended Enhancement: Keep Both Tables

**detailCrossReferences** - For peer relationships within same source:
- MRM ridge detail links to MRM ridge cap detail
- RANZ penetration links to RANZ flashing

**detailLinks** - For cross-source authoritative relationships:
- MRM technical spec links to RANZ installation guide
- MRM warning links to RANZ preventive procedure

### Drizzle Relations Definition

```typescript
// Add to schema.ts
export const detailLinksRelations = relations(detailLinks, ({ one }) => ({
  primaryDetail: one(details, {
    fields: [detailLinks.primaryDetailId],
    references: [details.id],
    relationName: 'primaryDetail',
  }),
  supplementaryDetail: one(details, {
    fields: [detailLinks.supplementaryDetailId],
    references: [details.id],
    relationName: 'supplementaryDetail',
  }),
}));

// Extend details relations
export const detailsRelations = relations(details, ({ many }) => ({
  // Existing relations...
  steps: many(detailSteps),
  warnings: many(warningConditions),
  failureLinks: many(detailFailureLinks),
  crossReferences: many(detailCrossReferences),

  // NEW: Links where this detail is authoritative
  supplementedBy: many(detailLinks, { relationName: 'primaryDetail' }),

  // NEW: Links where this detail supplements another
  supplements: many(detailLinks, { relationName: 'supplementaryDetail' }),
}));
```

### Link Type Taxonomy

| Link Type | Use Case | Example |
|-----------|----------|---------|
| `installation_guide` | RANZ provides step-by-step for MRM spec | MRM F07 → RANZ-F07 |
| `technical_supplement` | Additional technical detail | MRM Ridge → MRM Ridge Cap |
| `alternative` | Different approach to same problem | Valley Type A → Valley Type B |
| `prerequisite` | Must complete first | Membrane → Substrate Prep |
| `related_failure` | Case law about same component | F07 → Failure Case 2024-035 |

---

## 3. Content Availability Flags

### Current State

Content availability is inferred at query time by checking for nulls or empty arrays:

```typescript
// Current: Check at runtime
const hasModel = detail.modelUrl !== null;
const hasSteps = (detail.steps?.length ?? 0) > 0;
```

### Recommended Pattern: Computed Columns (Virtual)

PostgreSQL 17+ supports virtual generated columns. For Neon (PostgreSQL 16 as of Jan 2026), use **stored generated columns** or **query-time computation**.

**Option A: Stored Generated Columns (PostgreSQL 12+)**

```sql
-- Add to details table
ALTER TABLE "details"
  ADD COLUMN "has_model" boolean GENERATED ALWAYS AS ("model_url" IS NOT NULL) STORED,
  ADD COLUMN "has_thumbnail" boolean GENERATED ALWAYS AS ("thumbnail_url" IS NOT NULL) STORED;
```

Limitation: Can't compute based on related tables (steps count, warnings count).

**Option B: Materialized View (Recommended for Complex Flags)**

```sql
-- Create materialized view for content availability
CREATE MATERIALIZED VIEW "detail_content_flags" AS
SELECT
  d.id,
  d.model_url IS NOT NULL AS has_model,
  d.thumbnail_url IS NOT NULL AS has_thumbnail,
  COALESCE(step_counts.count, 0) > 0 AS has_steps,
  COALESCE(step_counts.count, 0) AS step_count,
  COALESCE(warning_counts.count, 0) > 0 AS has_warnings,
  COALESCE(warning_counts.count, 0) AS warning_count,
  COALESCE(failure_counts.count, 0) > 0 AS has_failures,
  COALESCE(failure_counts.count, 0) AS failure_count,
  COALESCE(link_counts.count, 0) > 0 AS has_linked_guides,
  COALESCE(link_counts.count, 0) AS linked_guide_count
FROM details d
LEFT JOIN (
  SELECT detail_id, COUNT(*) as count
  FROM detail_steps GROUP BY detail_id
) step_counts ON d.id = step_counts.detail_id
LEFT JOIN (
  SELECT detail_id, COUNT(*) as count
  FROM warning_conditions GROUP BY detail_id
) warning_counts ON d.id = warning_counts.detail_id
LEFT JOIN (
  SELECT detail_id, COUNT(*) as count
  FROM detail_failure_links GROUP BY detail_id
) failure_counts ON d.id = failure_counts.detail_id
LEFT JOIN (
  SELECT primary_detail_id, COUNT(*) as count
  FROM detail_links GROUP BY primary_detail_id
) link_counts ON d.id = link_counts.primary_detail_id;

-- Create unique index for fast refresh
CREATE UNIQUE INDEX ON "detail_content_flags" (id);

-- Refresh after content changes
-- REFRESH MATERIALIZED VIEW CONCURRENTLY "detail_content_flags";
```

**Option C: Query-Time Computation (Simplest, Recommended for Now)**

Since the app already computes counts at query time, enhance the existing pattern:

```typescript
// Enhanced query returning all availability flags
export async function getDetailsWithFlags(
  categoryId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  const detailsList = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      description: details.description,
      modelUrl: details.modelUrl,
      thumbnailUrl: details.thumbnailUrl,
      sourceId: details.sourceId,
    })
    .from(details)
    .where(eq(details.categoryId, categoryId))
    .orderBy(asc(details.code))
    .limit(limit)
    .offset(offset);

  // Batch fetch all counts in parallel
  const detailIds = detailsList.map(d => d.id);

  const [stepCounts, warningCounts, failureCounts, linkCounts] = await Promise.all([
    db.select({ detailId: detailSteps.detailId, count: count() })
      .from(detailSteps)
      .where(inArray(detailSteps.detailId, detailIds))
      .groupBy(detailSteps.detailId),
    db.select({ detailId: warningConditions.detailId, count: count() })
      .from(warningConditions)
      .where(inArray(warningConditions.detailId, detailIds))
      .groupBy(warningConditions.detailId),
    db.select({ detailId: detailFailureLinks.detailId, count: count() })
      .from(detailFailureLinks)
      .where(inArray(detailFailureLinks.detailId, detailIds))
      .groupBy(detailFailureLinks.detailId),
    db.select({ detailId: detailLinks.primaryDetailId, count: count() })
      .from(detailLinks)
      .where(inArray(detailLinks.primaryDetailId, detailIds))
      .groupBy(detailLinks.primaryDetailId),
  ]);

  // Build lookup maps
  const stepMap = new Map(stepCounts.map(s => [s.detailId, Number(s.count)]));
  const warningMap = new Map(warningCounts.map(w => [w.detailId, Number(w.count)]));
  const failureMap = new Map(failureCounts.map(f => [f.detailId, Number(f.count)]));
  const linkMap = new Map(linkCounts.map(l => [l.detailId, Number(l.count)]));

  return detailsList.map(detail => ({
    ...detail,
    // Content availability flags
    hasModel: detail.modelUrl !== null,
    hasThumbnail: detail.thumbnailUrl !== null,
    hasSteps: (stepMap.get(detail.id) ?? 0) > 0,
    hasWarnings: (warningMap.get(detail.id) ?? 0) > 0,
    hasFailures: (failureMap.get(detail.id) ?? 0) > 0,
    hasLinkedGuides: (linkMap.get(detail.id) ?? 0) > 0,
    // Counts for badges
    stepCount: stepMap.get(detail.id) ?? 0,
    warningCount: warningMap.get(detail.id) ?? 0,
    failureCount: failureMap.get(detail.id) ?? 0,
    linkedGuideCount: linkMap.get(detail.id) ?? 0,
  }));
}
```

### Recommendation

Use **Option C (Query-Time Computation)** initially:
- Simplest to implement with existing patterns
- N+1 query issue solved with batch fetching
- No materialized view refresh complexity

Upgrade to **Option B (Materialized View)** if:
- Listings become slow (>500ms for 20 items)
- Content rarely changes (refresh can be batched)

---

## 4. Source Attribution for Legislative Citation

### Current State

Standards references stored as JSONB in details:

```typescript
standardsRefs: jsonb('standards_refs').$type<Array<{
  code: string;      // e.g., 'E2/AS1'
  clause: string;    // e.g., 'Table 20'
  title: string;     // Description
}>>(),
```

### Enhanced Pattern for Legislative Citation

For Building Code compliance contexts, citations need:
- **Citation format**: NZ Building Code uses specific format
- **Version tracking**: Acceptable Solutions are versioned (E2/AS1 Amendment 15)
- **Authority level**: Building Code vs Acceptable Solution vs Verification Method

```typescript
// ENHANCED: Legislative references table (normalized)
export const legislativeReferences = pgTable('legislative_references', {
  id: text('id').primaryKey(),                    // e.g., 'e2-as1-table20'
  code: text('code').notNull(),                   // 'E2/AS1'
  version: text('version'),                       // 'Amendment 15 (2022)'
  clause: text('clause').notNull(),               // 'Table 20'
  title: text('title').notNull(),                 // 'Flashing Dimensions'
  authorityLevel: text('authority_level').notNull(), // 'building_code' | 'acceptable_solution' | 'verification_method' | 'determination'
  sourceUrl: text('source_url'),                  // MBIE building.govt.nz URL
  effectiveDate: timestamp('effective_date'),     // When this version became active
  supersededBy: text('superseded_by')             // Reference to newer version
    .references(() => legislativeReferences.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  codeIdx: index('idx_leg_refs_code').on(table.code),
  levelIdx: index('idx_leg_refs_level').on(table.authorityLevel),
}));

// Link table: details to legislative references
export const detailLegislativeLinks = pgTable('detail_legislative_links', {
  detailId: text('detail_id').references(() => details.id).notNull(),
  legislativeRefId: text('legislative_ref_id')
    .references(() => legislativeReferences.id).notNull(),
  context: text('context'),                       // 'compliance' | 'guidance' | 'exception'
  notes: text('notes'),                           // Additional context
}, (table) => ({
  pk: primaryKey({ columns: [table.detailId, table.legislativeRefId] }),
}));
```

### Migration for Existing Standards Refs

```sql
-- Migration: 0003_legislative_references.sql

-- Create legislative references table
CREATE TABLE IF NOT EXISTS "legislative_references" (
  "id" text PRIMARY KEY,
  "code" text NOT NULL,
  "version" text,
  "clause" text NOT NULL,
  "title" text NOT NULL,
  "authority_level" text NOT NULL,
  "source_url" text,
  "effective_date" timestamp,
  "superseded_by" text REFERENCES "legislative_references"("id"),
  "created_at" timestamp DEFAULT now()
);

-- Create linking table
CREATE TABLE IF NOT EXISTS "detail_legislative_links" (
  "detail_id" text NOT NULL REFERENCES "details"("id") ON DELETE CASCADE,
  "legislative_ref_id" text NOT NULL REFERENCES "legislative_references"("id") ON DELETE CASCADE,
  "context" text,
  "notes" text,
  PRIMARY KEY ("detail_id", "legislative_ref_id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_leg_refs_code" ON "legislative_references" ("code");
CREATE INDEX IF NOT EXISTS "idx_leg_refs_level" ON "legislative_references" ("authority_level");

-- Migrate existing standards_refs from JSONB to normalized table
-- This should be done via a script, not raw SQL, to handle JSONB parsing
```

### Migration Script Pattern

```typescript
// scripts/migrate-standards-refs.ts
async function migrateStandardsRefs() {
  // Get all details with standards_refs
  const detailsWithRefs = await db
    .select({ id: details.id, standardsRefs: details.standardsRefs })
    .from(details)
    .where(isNotNull(details.standardsRefs));

  for (const detail of detailsWithRefs) {
    const refs = detail.standardsRefs as Array<{code: string; clause: string; title: string}>;

    for (const ref of refs) {
      const refId = `${ref.code.toLowerCase().replace(/\//g, '-')}-${ref.clause.toLowerCase().replace(/\s/g, '-')}`;

      // Upsert legislative reference
      await db.insert(legislativeReferences)
        .values({
          id: refId,
          code: ref.code,
          clause: ref.clause,
          title: ref.title,
          authorityLevel: inferAuthorityLevel(ref.code), // 'E2/AS1' → 'acceptable_solution'
        })
        .onConflictDoNothing();

      // Create link
      await db.insert(detailLegislativeLinks)
        .values({
          detailId: detail.id,
          legislativeRefId: refId,
          context: 'compliance',
        })
        .onConflictDoNothing();
    }
  }
}

function inferAuthorityLevel(code: string): string {
  if (code.match(/^[A-Z]\d+$/)) return 'building_code';        // E2, B2
  if (code.includes('/AS')) return 'acceptable_solution';      // E2/AS1
  if (code.includes('/VM')) return 'verification_method';      // E2/VM1
  return 'determination';
}
```

### Citation Display Format

```typescript
// Format citation for display
export function formatCitation(ref: LegislativeReference): string {
  const parts = [ref.code];
  if (ref.version) parts.push(ref.version);
  if (ref.clause) parts.push(ref.clause);
  return parts.join(' ');
}

// Example output: "E2/AS1 Amendment 15 (2022) Table 20"
```

---

## Schema Changes Summary

### New Tables

| Table | Purpose | Priority |
|-------|---------|----------|
| `detail_links` | MRM↔RANZ authoritative linking | High - Core integration |
| `legislative_references` | Normalized standards refs | Medium - Improves citation |
| `detail_legislative_links` | Link details to refs | Medium - Pairs with above |

### Modified Tables

| Table | Change | Purpose |
|-------|--------|---------|
| `details` | Add `has_*` columns (optional) | Content flags if needed |
| `detail_steps` | No changes | - |
| `content_sources` | Add `is_authoritative` boolean | Flag MRM as citable |

### Migration Order

1. **0002_add_detail_links.sql** - Create linking table
2. **0003_legislative_references.sql** - Create citation tables
3. **Script: populate-detail-links.ts** - Map MRM→RANZ by code matching
4. **Script: migrate-standards-refs.ts** - Normalize existing refs

---

## Preserved Functionality

All existing functionality continues to work:

| Feature | Current Implementation | After Migration |
|---------|----------------------|-----------------|
| Detail viewing | `getDetailById()` | Same, optionally enhanced with linked guides |
| Search | Full-text on details | Same |
| Source filtering | `sourceId` filter | Same |
| Cross-references | `detailCrossReferences` | Still works for peer links |
| Failure links | `detailFailureLinks` | Unchanged |
| Favorites/History | User-specific tables | Unchanged |

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Detail Links Table | HIGH | Standard pattern, proven in similar systems |
| Content Flags | MEDIUM | Query-time computation is safe; materialized view is optimization |
| Legislative References | HIGH | Normalizing JSONB to tables is standard practice |
| Migration Safety | HIGH | All changes are additive; no existing columns modified |

---

## Sources

- [Polymorphic Associations in Drizzle ORM](https://jose-gutierrez.com/en/articles/polymorphic-associations-in-nestjs-with-postgresql-drizzle-orm) - Pattern for linking different entity types
- [PostgreSQL Generated Columns](https://www.postgresql.org/docs/current/ddl-generated-columns.html) - Computed column options
- [Many-to-Many Database Relationships](https://www.beekeeperstudio.io/blog/many-to-many-database-relationships-complete-guide) - Junction table patterns
- [Legal Citation Standards](https://en.wikipedia.org/wiki/Legal_citation) - Authority hierarchy for citations
- [Schema.org mainEntity Pattern](https://schema.org/docs/datamodel.html) - Authoritative source designation
