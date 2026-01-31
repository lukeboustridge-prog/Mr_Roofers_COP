# Phase 7: Data Model Foundation - Research

**Researched:** 2026-01-31
**Domain:** PostgreSQL schema design, Drizzle ORM, cross-source content linking
**Confidence:** HIGH

## Summary

This phase establishes the database infrastructure for unifying MRM COP (251 authoritative technical details) with RANZ Guide (61 installation guides with 3D models) while preserving source hierarchy and enabling topic-based navigation.

The research confirms that the existing schema provides solid foundations (`contentSources`, `sourceId` fields, `detailCrossReferences`). The required enhancements are additive - no breaking changes to existing tables. Four new tables address the requirements: `detail_links` for authority hierarchy (DATA-01), `topics` + `category_topics` for semantic grouping (DATA-02), and `legislative_references` + `detail_legislative_links` for normalized citations (DATA-03).

**Primary recommendation:** Implement the three-table topic system first (topics, category_topics, and update detail_links), as this enables unified navigation. Legislative reference normalization can follow as a data quality enhancement.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.1 | Type-safe SQL ORM | Already in project, PostgreSQL-native |
| drizzle-kit | (companion) | Migration generation | Standard Drizzle workflow |
| @neondatabase/serverless | existing | Serverless PostgreSQL | Already configured for Neon |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | existing | Schema validation | Validate migration scripts input |
| nanoid | existing | ID generation | Generate `id` fields for new records |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw SQL migrations | Drizzle push | Push is faster but less auditable; use `generate` for production |
| Junction table for detail_links | JSON array on details | JSON is simpler but loses referential integrity |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
npm run db:generate  # Generate migration files
npm run db:push      # For development iteration
```

## Architecture Patterns

### Recommended Project Structure
```
lib/db/
  schema.ts                    # ADD: topics, categoryTopics, detailLinks, legislativeReferences
  migrations/
    0002_topics_and_links.sql  # NEW: topic system + detail links
    0003_legislative_refs.sql  # NEW: normalized citations (optional)
scripts/
  populate-topics.ts           # NEW: Seed topics and map categories
  populate-detail-links.ts     # NEW: Create MRM-RANZ links
  migrate-standards-refs.ts    # NEW: Normalize existing JSONB refs
```

### Pattern 1: Authority-Preserving Detail Links

**What:** Junction table with explicit primary/supplementary relationship
**When to use:** Linking MRM (authoritative) details to RANZ (supplementary) guides
**Example:**
```typescript
// Source: STACK.md research + Drizzle v2 many-to-many pattern
export const detailLinks = pgTable('detail_links', {
  id: text('id').primaryKey(),
  primaryDetailId: text('primary_detail_id')
    .references(() => details.id, { onDelete: 'cascade' }).notNull(),
  supplementaryDetailId: text('supplementary_detail_id')
    .references(() => details.id, { onDelete: 'cascade' }).notNull(),
  linkType: text('link_type').notNull(),  // 'installation_guide' | 'technical_supplement' | 'alternative'
  matchConfidence: text('match_confidence'), // 'exact' | 'partial' | 'related'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  primaryIdx: index('idx_detail_links_primary').on(table.primaryDetailId),
  supplementaryIdx: index('idx_detail_links_supplementary').on(table.supplementaryDetailId),
  noSelfLink: check('no_self_link', sql`primary_detail_id != supplementary_detail_id`),
}));
```

### Pattern 2: Topic-Based Category Grouping

**What:** Many-to-many between categories and semantic topics
**When to use:** Enabling "show all flashings from all sources" navigation
**Example:**
```typescript
// Source: ARCHITECTURE.md research
export const topics = pgTable('topics', {
  id: text('id').primaryKey(),           // e.g., 'flashings'
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  sortOrder: integer('sort_order').default(0),
});

export const categoryTopics = pgTable('category_topics', {
  categoryId: text('category_id')
    .references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  topicId: text('topic_id')
    .references(() => topics.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.categoryId, table.topicId] }),
}));
```

### Pattern 3: Normalized Legislative References

**What:** Separate table for NZBC citations with proper versioning
**When to use:** When citations need version tracking and authority levels
**Example:**
```typescript
// Source: STACK.md research + NZ Building Code citation format
export const legislativeReferences = pgTable('legislative_references', {
  id: text('id').primaryKey(),                    // 'e2-as1-table20'
  code: text('code').notNull(),                   // 'E2/AS1'
  edition: text('edition'),                       // '4th'
  amendment: text('amendment'),                   // 'Amd 10' (for older versions)
  clause: text('clause').notNull(),               // 'Table 20'
  title: text('title').notNull(),
  authorityLevel: text('authority_level').notNull(), // 'building_code' | 'acceptable_solution' | 'verification_method'
  sourceUrl: text('source_url'),
  effectiveDate: timestamp('effective_date'),
  supersededBy: text('superseded_by').references(() => legislativeReferences.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  codeIdx: index('idx_leg_refs_code').on(table.code),
}));

export const detailLegislativeLinks = pgTable('detail_legislative_links', {
  detailId: text('detail_id')
    .references(() => details.id, { onDelete: 'cascade' }).notNull(),
  legislativeRefId: text('legislative_ref_id')
    .references(() => legislativeReferences.id, { onDelete: 'cascade' }).notNull(),
  context: text('context'),  // 'compliance' | 'guidance' | 'exception'
}, (table) => ({
  pk: primaryKey({ columns: [table.detailId, table.legislativeRefId] }),
}));
```

### Anti-Patterns to Avoid
- **Merging sources into single table:** Keep MRM and RANZ details distinct with `sourceId`, link via `detail_links`
- **Modifying existing detailCrossReferences:** That table is for peer relationships; new `detail_links` is for hierarchy
- **Eager loading all related content:** Use lazy loading for "Related" tab queries
- **Storing authority in details table:** Authority comes from `contentSources` table, not duplicated per detail

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ID generation | Custom UUID logic | `nanoid()` or `crypto.randomUUID()` | Already used in project, consistent format |
| Migration files | Manual SQL files | `drizzle-kit generate` | Type-safe, catches schema drift |
| NZBC code parsing | Regex for E2/AS1 | Pattern matching from STACK.md | Standard format: `{clause}/AS{num}` or `{clause}/VM{num}` |
| Topic matching | Manual category-topic mapping | Seed script with explicit mappings | Controlled, auditable, reversible |

**Key insight:** The existing `detailCrossReferences` table handles peer relationships. The new `detail_links` table adds authority hierarchy without changing existing functionality.

## Common Pitfalls

### Pitfall 1: Circular References in detail_links
**What goes wrong:** Detail A links to B, B links back to A as supplementary
**Why it happens:** No validation on insert
**How to avoid:** Add CHECK constraint `primary_detail_id != supplementary_detail_id`, query for existing links before inserting reverse
**Warning signs:** Query returns same detail as both primary and supplementary

### Pitfall 2: Orphaned Category-Topic Mappings
**What goes wrong:** Topic references category that doesn't exist (after category deletion)
**Why it happens:** Missing cascade delete
**How to avoid:** Use `onDelete: 'cascade'` on foreign keys
**Warning signs:** Query for topic returns empty despite having mappings in category_topics

### Pitfall 3: NZBC Citation Format Inconsistency
**What goes wrong:** Same clause stored as "E2/AS1 Table 20", "E2/AS1, Table 20", "E2 AS1 Table 20"
**Why it happens:** Free-text input without normalization
**How to avoid:** Use separate fields (`code`, `edition`, `clause`), format on display
**Warning signs:** Search for "E2/AS1 Table 20" misses records stored with different formatting

### Pitfall 4: Substrate Preservation (DATA-04)
**What goes wrong:** Empty substrates removed during cleanup, breaking future content
**Why it happens:** Automated cleanup scripts target empty records
**How to avoid:** Substrates are seeded data - never delete. Add `is_core: boolean` flag if needed
**Warning signs:** Substrate dropdown shows fewer than 6 options

## Code Examples

Verified patterns from official sources and existing codebase:

### Query: Get All Details for a Topic (Unified View)
```typescript
// Source: ARCHITECTURE.md pattern, adapted for current schema
async function getDetailsByTopic(topicId: string, options?: {
  sourceId?: string;
  limit?: number;
  offset?: number;
}) {
  const { sourceId, limit = 20, offset = 0 } = options ?? {};

  // Get categories mapped to this topic
  const topicCategories = await db
    .select({ categoryId: categoryTopics.categoryId })
    .from(categoryTopics)
    .where(eq(categoryTopics.topicId, topicId));

  if (topicCategories.length === 0) return [];

  const categoryIds = topicCategories.map(c => c.categoryId);

  // Build query
  let query = db
    .select()
    .from(details)
    .where(inArray(details.categoryId, categoryIds))
    .orderBy(asc(details.code))
    .limit(limit)
    .offset(offset);

  if (sourceId) {
    query = query.where(and(
      inArray(details.categoryId, categoryIds),
      eq(details.sourceId, sourceId)
    ));
  }

  return query;
}
```

### Query: Get Detail with Linked Guides (Authority Hierarchy)
```typescript
// Source: STACK.md getDetailWithSupplements pattern
async function getDetailWithLinks(detailId: string) {
  const [detail] = await db
    .select()
    .from(details)
    .where(eq(details.id, detailId))
    .limit(1);

  if (!detail) return null;

  // Get supplementary content (RANZ guides for MRM details)
  const supplements = await db
    .select({
      link: detailLinks,
      detail: details,
    })
    .from(detailLinks)
    .innerJoin(details, eq(detailLinks.supplementaryDetailId, details.id))
    .where(eq(detailLinks.primaryDetailId, detailId));

  // Get where this detail supplements another (MRM details for RANZ guides)
  const supplementsTo = await db
    .select({
      link: detailLinks,
      detail: details,
    })
    .from(detailLinks)
    .innerJoin(details, eq(detailLinks.primaryDetailId, details.id))
    .where(eq(detailLinks.supplementaryDetailId, detailId));

  return {
    ...detail,
    supplements: supplements.map(s => ({
      ...s.detail,
      linkType: s.link.linkType,
      matchConfidence: s.link.matchConfidence,
    })),
    supplementsTo: supplementsTo.map(s => ({
      ...s.detail,
      linkType: s.link.linkType,
    })),
  };
}
```

### Migration: Topics and Detail Links
```sql
-- Source: Derived from ARCHITECTURE.md and STACK.md patterns
-- Migration: 0002_topics_and_links.sql

-- Topics for semantic grouping
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

-- Detail links with authority hierarchy
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

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_detail_links_primary" ON "detail_links" ("primary_detail_id");
CREATE INDEX IF NOT EXISTS "idx_detail_links_supplementary" ON "detail_links" ("supplementary_detail_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_detail_links_unique" ON "detail_links" ("primary_detail_id", "supplementary_detail_id");
```

### NZBC Citation Formatting
```typescript
// Source: MBIE building.govt.nz citation format research
interface LegislativeRef {
  code: string;      // 'E2/AS1'
  edition?: string;  // '4th'
  amendment?: string; // 'Amd 10'
  clause: string;    // 'Table 20'
}

function formatNZBCCitation(ref: LegislativeRef): string {
  const parts: string[] = [ref.code];

  if (ref.edition) {
    parts.push(`(${ref.edition} edition)`);
  } else if (ref.amendment) {
    parts.push(`(${ref.amendment})`);
  }

  if (ref.clause) {
    parts.push(ref.clause);
  }

  return parts.join(' ');
}

// Examples:
// { code: 'E2/AS1', edition: '4th', clause: 'Table 20' }
// => "E2/AS1 (4th edition) Table 20"
//
// { code: 'E2/AS1', amendment: 'Amd 10', clause: '8.4.8' }
// => "E2/AS1 (Amd 10) 8.4.8"

function inferAuthorityLevel(code: string): string {
  if (code.match(/^[A-Z]\d+$/)) return 'building_code';       // E2, B2
  if (code.includes('/AS')) return 'acceptable_solution';     // E2/AS1
  if (code.includes('/VM')) return 'verification_method';     // E2/VM1
  return 'determination';
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| E2/AS1 3rd edition | E2/AS1 4th edition | 28 July 2025 | New edition structure, must track version |
| Single-source COP | Multi-source with authority | This phase | MRM primary, RANZ supplementary |
| JSONB standards_refs | Normalized legislative_references | This phase | Enables proper citation format |

**Deprecated/outdated:**
- E2/AS1 3rd edition (Amendment 10): Valid until 31 July 2026, then deprecated
- Storing citations as free-text JSONB: Still works but loses version tracking

## Open Questions

Things that couldn't be fully resolved:

1. **Topic-Category Mapping Accuracy**
   - What we know: MRM has 5 categories, RANZ has 5 categories, zero overlap by ID
   - What's unclear: Exact semantic mapping (does RANZ "penetrations-corrugated" map to MRM "penetrations"?)
   - Recommendation: Create explicit mapping table with human review, not automated matching

2. **Detail Link Matching Criteria**
   - What we know: STACK.md suggests code/name matching
   - What's unclear: What threshold for "partial" vs "related" confidence?
   - Recommendation: Start with manual curation, build heuristics from patterns

3. **Legislative Reference Migration Priority**
   - What we know: Existing `standardsRefs` JSONB contains references
   - What's unclear: How many unique references exist? What's the cleanup effort?
   - Recommendation: Phase 2 work - topic system first, then legislative normalization

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM Relations v2](https://orm.drizzle.team/docs/relations-v2) - Many-to-many junction patterns with `through()` syntax
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations) - `drizzle-kit generate` workflow
- [MBIE E2/AS1 4th Edition](https://www.building.govt.nz/building-code-compliance/e-moisture/e2-external-moisture/acceptable-solutions-and-verification-methods) - Current edition effective 28 July 2025
- [Building CodeHub E2/AS1](https://codehub.building.govt.nz/resources/e2as1-amd-7) - Citation format patterns

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` - Prior research on detail_links schema pattern
- `.planning/research/ARCHITECTURE.md` - Prior research on topic-based navigation
- `lib/db/schema.ts` - Current schema structure (verified)
- `scripts/analyze-content-structure.ts` - Current data statistics

### Tertiary (LOW confidence)
- WebSearch results on Drizzle many-to-many patterns - Community patterns, some outdated

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing Drizzle ORM already in project
- Architecture patterns: HIGH - Based on existing schema analysis and prior research
- Legislative references: MEDIUM - NZBC format verified, migration path untested
- Topic mappings: MEDIUM - Pattern clear, specific mappings need human review

**Research date:** 2026-01-31
**Valid until:** 30 days (stable domain, additive changes only)
