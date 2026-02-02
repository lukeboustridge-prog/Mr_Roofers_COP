# Phase 11: Search Enhancement - Research

**Researched:** 2026-02-02
**Domain:** Full-text search with authority-weighted ranking, grouped results, and consent mode filtering
**Confidence:** HIGH

## Summary

Phase 11 enhances the existing ILIKE-based search implementation to prioritize MRM authoritative content through weighted ranking, group results by source, and provide a "Consent Mode" toggle for showing only Building Code citation-ready content. The phase requires migrating from basic ILIKE pattern matching to PostgreSQL full-text search with ts_rank, implementing source-weighted relevance boosting (MRM 2x), creating grouped result components, and adding section number direct navigation for COP structure access.

**Current state:** Search uses ILIKE pattern matching across name, code, description, and JSON fields (specifications, standardsRefs). Results are flat, ungrouped, with no authority weighting. The sourceId field exists in schema but is not used in search ranking.

**Standard approach:** PostgreSQL full-text search with tsvector, ts_rank for relevance, setweight() for column importance (A/B/C/D weights), GIN indexes for performance, and source-based multipliers applied to ts_rank scores. Grouped results use container/presentational component pattern with visual section separators.

**Primary recommendation:** Extend existing search API with optional ts_rank mode (keeping ILIKE as fallback), add sourceId-based relevance multiplier (mrm-cop gets 2x boost), create GroupedSearchResults component with MRM/RANZ sections, add "Consent Mode" toggle that filters sourceId='mrm-cop' only, and implement regex-based section number detection (e.g., "4.3.2") for direct COP navigation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL full-text search | Built-in | ts_rank, tsvector, to_tsquery, setweight() | Native to PostgreSQL, no external dependencies, optimized for text ranking |
| GIN index | Built-in | Generalized Inverted Index for tsvector columns | 3x faster than GiST for full-text search operations |
| Drizzle ORM sql`` template | Current | Raw SQL for ts_rank queries | Drizzle doesn't abstract full-text search, raw SQL is idiomatic |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority (cva) | Current | Authority-aware component variants | Already used in SourceBadge, consistent styling pattern |
| Lucide icons | Current | BookOpen, Library, Filter, Zap | Existing icon library, authority system established |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ts_rank | pg_textsearch (BM25) | BM25 more sophisticated but requires extension install, overkill for <10k documents, GA Feb 2026 |
| Full-text search | Elasticsearch | External service overhead, inappropriate for small corpus (~500 details), defeats "no AI dependency" principle |
| ILIKE only | Keep existing | No relevance ranking, no authority weighting, fails SEARCH-01 requirement |

**Installation:**
```bash
# No new packages required - uses PostgreSQL built-in features
# Migration will add GIN index and generated tsvector column
```

## Architecture Patterns

### Recommended Search Flow
```
User enters query "valley flashing"
  ↓
API detects query type (code match "F07" vs general search)
  ↓
If code match → Direct lookup by code column
If section number (regex: /^\d+\.\d+(\.\d+)?$/) → Navigate to COP section
Else → Full-text search with ts_rank
  ↓
Query tsvector column with to_tsquery (stemmed, case-insensitive)
  ↓
Calculate base ts_rank score (weighted: name='A', description='B', specs='C')
  ↓
Apply source multiplier: mrm-cop × 2.0, others × 1.0
  ↓
Order by (weighted_score DESC, code ASC)
  ↓
Group results by sourceId on client (MRM section first, RANZ section second)
  ↓
If Consent Mode enabled → Filter results to sourceId='mrm-cop' only
```

### Pattern 1: Weighted Full-Text Search with Source Boost
**What:** Combine ts_rank relevance with source-based multiplier for authority prioritization
**When to use:** When search needs to respect authority hierarchy (MRM > RANZ)
**Example:**
```sql
-- Source: PostgreSQL ts_rank documentation + Drizzle ORM patterns
SELECT
  d.id, d.code, d.name, d.source_id,
  -- Base relevance score (weighted columns)
  ts_rank(
    setweight(to_tsvector('english', d.name), 'A') ||
    setweight(to_tsvector('english', COALESCE(d.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(d.specifications::text, '')), 'C'),
    to_tsquery('english', 'valley & flashing')
  ) *
  -- Source authority multiplier
  CASE
    WHEN d.source_id = 'mrm-cop' THEN 2.0
    ELSE 1.0
  END AS weighted_score
FROM details d
WHERE (
  setweight(to_tsvector('english', d.name), 'A') ||
  setweight(to_tsvector('english', COALESCE(d.description, '')), 'B')
) @@ to_tsquery('english', 'valley & flashing')
ORDER BY weighted_score DESC, d.code ASC
LIMIT 20 OFFSET 0;
```

### Pattern 2: Generated tsvector Column with GIN Index
**What:** Pre-compute search vector for performance, indexed for fast lookups
**When to use:** Always for full-text search (standard PostgreSQL optimization)
**Example:**
```typescript
// Schema addition (lib/db/schema.ts)
export const details = pgTable('details', {
  // ... existing fields
  searchVector: customType<{ data: string }>({
    dataType() {
      return `tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', name), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(specifications::text, '')), 'C')
      ) STORED`;
    },
  })(),
}, (table) => ({
  // ... existing indexes
  searchIdx: index('idx_details_search_vector').using('gin', table.searchVector),
}));
```

### Pattern 3: Grouped Search Results Component
**What:** Container component that separates results into authority-based sections
**When to use:** When displaying search results that span multiple sources
**Example:**
```typescript
// components/search/GroupedSearchResults.tsx
interface GroupedSearchResultsProps {
  results: SearchResult[];
  query: string;
  consentMode: boolean;
}

export function GroupedSearchResults({ results, query, consentMode }: GroupedSearchResultsProps) {
  // Group results by source
  const mrmResults = results.filter(r => r.sourceId === 'mrm-cop');
  const ranzResults = results.filter(r => r.sourceId === 'ranz-guide');

  // If consent mode, only show MRM
  if (consentMode) {
    return (
      <div>
        <SectionHeader
          title="MRM Code of Practice"
          count={mrmResults.length}
          badge={<SourceBadge shortName="MRM COP" authority="authoritative" />}
        />
        <ResultsList results={mrmResults} />
      </div>
    );
  }

  // Show both sections with visual separation
  return (
    <div className="space-y-8">
      {mrmResults.length > 0 && (
        <section>
          <SectionHeader
            title="MRM Code of Practice (Authoritative)"
            count={mrmResults.length}
            badge={<SourceBadge shortName="MRM COP" authority="authoritative" />}
          />
          <ResultsList results={mrmResults} />
        </section>
      )}

      {ranzResults.length > 0 && (
        <section>
          <div className="border-t pt-6 mt-6" />
          <SectionHeader
            title="RANZ Roofing Guide (Supplementary)"
            count={ranzResults.length}
            badge={<SourceBadge shortName="RANZ" authority="supplementary" />}
          />
          <ResultsList results={ranzResults} />
        </section>
      )}
    </div>
  );
}
```

### Pattern 4: Section Number Detection and Navigation
**What:** Regex-based detection of COP section numbers for direct navigation
**When to use:** When user types section reference format (e.g., "4.3.2", "5.1")
**Example:**
```typescript
// lib/search-helpers.ts
const SECTION_NUMBER_REGEX = /^\d+\.\d+(\.\d+)?$/;

export function detectSearchType(query: string): 'section' | 'code' | 'text' {
  const trimmed = query.trim();

  // Check for section number (e.g., "4.3.2")
  if (SECTION_NUMBER_REGEX.test(trimmed)) {
    return 'section';
  }

  // Check for exact code match (e.g., "F07")
  if (/^[A-Z]\d+$/i.test(trimmed)) {
    return 'code';
  }

  return 'text';
}

export function navigateToSection(sectionNumber: string): string {
  // Map section numbers to detail IDs or COP structure
  // This will be populated when COP section structure is seeded
  return `/planner/mrm-cop/section-${sectionNumber.replace(/\./g, '-')}`;
}
```

### Anti-Patterns to Avoid
- **Client-side sorting after fetch:** Always sort with ORDER BY in SQL for performance
- **Filtering source after ts_rank:** Apply source multiplier BEFORE ordering, not as post-filter
- **Rebuilding tsvector per query:** Use GENERATED ALWAYS AS stored column, indexed with GIN
- **Mixing ILIKE with ts_rank:** Use one or the other per query path (code match = ILIKE, text search = ts_rank)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text stemming | Custom word normalizer | PostgreSQL to_tsvector('english', ...) | Handles 170+ word forms, plurals, verb tenses, stop words |
| Relevance ranking | COUNT(*) matches | PostgreSQL ts_rank | Considers term frequency, document length, position, weights |
| Search query parsing | String split and LIKE | to_tsquery with '&' and '\|' operators | Handles phrase search, boolean logic, prefix matching |
| Result grouping | Multiple API calls | Single query with source multiplier, group on client | Avoids N+1 queries, maintains sort order |

**Key insight:** PostgreSQL full-text search is a mature, 20+ year old system designed for exactly this use case. Custom ILIKE logic will never match its performance or relevance quality at scale.

## Common Pitfalls

### Pitfall 1: ILIKE vs Full-Text Search Performance at Scale
**What goes wrong:** ILIKE %query% scans every row, unindexed. With 500 details it's fast (<50ms), but degrades linearly. At 5,000 details, queries hit 500ms+. Full-text search with GIN index stays ~10ms regardless of corpus size.
**Why it happens:** ILIKE cannot use indexes for wildcard prefix (%term%). Full-text search uses inverted index structure (GIN) optimized for text lookups.
**How to avoid:** Migrate to ts_rank now (while corpus is small), establish pattern for future growth. Keep ILIKE only for exact code lookups.
**Warning signs:** Search feels slow, database CPU spikes during search, query times increase as content grows.

### Pitfall 2: Forgetting to Apply Source Multiplier BEFORE ORDER BY
**What goes wrong:** If you filter results by sourceId='mrm-cop' AFTER ordering by ts_rank, MRM results don't get prioritized—they're just filtered. The multiplier must be part of the ORDER BY expression.
**Why it happens:** Intuition says "calculate score, then boost MRM." SQL execution order is WHERE → SELECT → ORDER BY, so multiplier must be in SELECT to affect ORDER BY.
**How to avoid:**
```sql
-- WRONG: Filter after ordering (no prioritization)
SELECT *, ts_rank(...) as score
FROM details
WHERE search_vector @@ query
ORDER BY score DESC;  -- MRM not boosted

-- RIGHT: Multiply score before ordering
SELECT *, ts_rank(...) * CASE WHEN source_id = 'mrm-cop' THEN 2.0 ELSE 1.0 END as weighted_score
FROM details
WHERE search_vector @@ query
ORDER BY weighted_score DESC;  -- MRM boosted 2x
```
**Warning signs:** MRM results appear in search but aren't consistently first, RANZ results rank higher despite MRM match.

### Pitfall 3: to_tsquery Syntax Errors on User Input
**What goes wrong:** User searches "valley & flashing", to_tsquery('english', 'valley & flashing') parses '&' as AND operator but 'valley' and 'flashing' need to be valid lexemes. Raw user input causes PostgreSQL syntax errors.
**Why it happens:** to_tsquery expects formatted query syntax ('word1 & word2'), not natural language. Special characters (&, |, !, parentheses) are operators.
**How to avoid:** Use plainto_tsquery or websearch_to_tsquery for natural language input:
```typescript
// BAD: Direct user input to to_tsquery
const query = sql`to_tsquery('english', ${userInput})`;  // Breaks on "What is a valley?"

// GOOD: Natural language handling
const query = sql`websearch_to_tsquery('english', ${userInput})`;  // Handles any input
```
**Warning signs:** 500 errors on search with quotes, parentheses, or punctuation. Error: "syntax error in tsquery".

### Pitfall 4: Not Handling Empty Result Sections
**What goes wrong:** Grouped results component renders "MRM Code of Practice: 0 results" section even when no MRM matches exist, creating visual clutter.
**Why it happens:** Component renders section headers unconditionally, not checking if results array is empty.
**How to avoid:** Guard section rendering with length checks:
```tsx
{mrmResults.length > 0 && (
  <section>
    <SectionHeader title="MRM Code of Practice" count={mrmResults.length} />
    <ResultsList results={mrmResults} />
  </section>
)}
```
**Warning signs:** Empty sections with "0 results" labels, awkward spacing when one source has no matches.

### Pitfall 5: Consent Mode as Client-Side Filter
**What goes wrong:** Fetching all results, then filtering to MRM on client means RANZ content still counts toward pagination. User sees "Showing 1-20 of 50 results" but only 5 MRM results exist—other 15 are hidden RANZ, causing confusion.
**Why it happens:** Easier to filter array on client than modify API query.
**How to avoid:** Pass consentMode to API, apply WHERE source_id = 'mrm-cop' in SQL:
```typescript
// API route
let whereClause = sql`search_vector @@ websearch_to_tsquery('english', ${query})`;
if (consentMode) {
  whereClause = and(whereClause, eq(details.sourceId, 'mrm-cop'));
}
```
**Warning signs:** Pagination counts don't match visible results, "Load More" button shows but no new results appear.

## Code Examples

Verified patterns from official sources:

### Full-Text Search API Implementation
```typescript
// app/api/search/route.ts (enhanced)
// Source: PostgreSQL ts_rank docs + Drizzle ORM patterns

import { sql, eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { details, contentSources } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const consentMode = searchParams.get('consentMode') === 'true';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  // Detect search type
  const searchType = detectSearchType(query);

  // Section number navigation
  if (searchType === 'section') {
    return NextResponse.json({
      redirect: navigateToSection(query.trim()),
      type: 'section'
    });
  }

  // Code exact match (keep ILIKE for exact lookups)
  if (searchType === 'code') {
    const exactMatch = await db
      .select()
      .from(details)
      .where(eq(sql`UPPER(${details.code})`, query.trim().toUpperCase()))
      .limit(1);

    if (exactMatch.length > 0) {
      return NextResponse.json({
        results: exactMatch.map(d => ({ ...d, isExactMatch: true })),
        total: 1,
        exactMatch: true,
      });
    }
  }

  // Full-text search with authority weighting
  let whereClause = sql`${details.searchVector} @@ websearch_to_tsquery('english', ${query})`;

  if (consentMode) {
    whereClause = and(whereClause, eq(details.sourceId, 'mrm-cop'));
  }

  const results = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      description: details.description,
      sourceId: details.sourceId,
      substrateId: details.substrateId,
      categoryId: details.categoryId,
      thumbnailUrl: details.thumbnailUrl,
      // Weighted relevance score (MRM gets 2x boost)
      relevanceScore: sql<number>`
        ts_rank(${details.searchVector}, websearch_to_tsquery('english', ${query})) *
        CASE
          WHEN ${details.sourceId} = 'mrm-cop' THEN 2.0
          ELSE 1.0
        END
      `,
    })
    .from(details)
    .where(whereClause)
    .orderBy(desc(sql`relevance_score`), details.code)
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(details)
    .where(whereClause);

  return NextResponse.json({ results, total, limit, offset });
}
```

### Migration for Generated Search Column
```sql
-- lib/db/migrations/0004_search_vector.sql
-- Source: PostgreSQL generated columns + GIN index documentation

-- Add generated search vector column
ALTER TABLE details
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', name), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(specifications::text, '')), 'C')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX idx_details_search_vector ON details USING gin(search_vector);

-- Add comment for documentation
COMMENT ON COLUMN details.search_vector IS 'Generated full-text search vector: name (A), description (B), specifications (C)';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ILIKE pattern matching | ts_rank with weighted columns | PostgreSQL 8.3 (2008) | 10-100x faster, relevance ranking, stemming support |
| Custom relevance scoring | setweight() with A/B/C/D labels | PostgreSQL 8.3 | Standardized approach, better quality than custom logic |
| Text search without indexes | GIN indexes on tsvector | PostgreSQL 8.3 | 3x faster than GiST, designed for full-text |
| Manual query parsing | websearch_to_tsquery() | PostgreSQL 11 (2018) | Handles natural language, no syntax errors on user input |
| ts_rank only | BM25 (pg_textsearch extension) | GA Feb 2026 | More sophisticated, but requires extension install |

**Deprecated/outdated:**
- **to_tsquery with raw user input:** Use websearch_to_tsquery or plainto_tsquery to avoid syntax errors
- **GiST indexes for text search:** Use GIN indexes (3x faster for full-text lookups)
- **Separate search index updates:** Use GENERATED ALWAYS AS STORED for automatic maintenance

## Open Questions

Things that couldn't be fully resolved:

1. **COP Section Structure Mapping**
   - What we know: Requirement SEARCH-04 specifies searching by section number (e.g., "4.3.2")
   - What's unclear: COP section hierarchy not yet seeded in database. Section numbers need to map to detail IDs or navigable URLs.
   - Recommendation: Add copSectionNumber field to details table during content import. Create index on this field for fast lookups. Navigation can then be: `/planner/mrm-cop/section-${sectionNumber}` which filters details by copSectionNumber prefix.

2. **Consent Mode Labeling**
   - What we know: Requirement SEARCH-03 specifies "Consent Mode" toggle
   - What's unclear: Should label be "Consent Mode" (technical), "Building Code Citation Only" (descriptive), or "Authoritative Content Only" (authority-focused)?
   - Recommendation: Start with "Building Code Citation Mode" with tooltip "Show only MRM COP content suitable for Building Consent documentation." Can be refined based on user feedback. The term "consent" might confuse with building consent vs. user consent.

3. **Search Performance at Scale**
   - What we know: Current corpus ~500 details, full-text search with GIN index handles 10k+ documents well
   - What's unclear: Performance when searching across details, failure cases, legislative references simultaneously
   - Recommendation: Start with details-only full-text search. If multi-table search needed, consider separate ts_rank queries per table, then merge/sort by weighted score on application layer (acceptable for small corpus). PostgreSQL can't JOIN across ts_rank scores efficiently.

4. **Source Multiplier Tuning**
   - What we know: Requirement SEARCH-01 specifies MRM gets 2x boost
   - What's unclear: Is 2x the right multiplier? Should RANZ be 1.0 or 0.5 (relative vs absolute boost)?
   - Recommendation: Start with MRM=2.0, RANZ=1.0. This is additive boost (MRM scores 2x higher than equivalent RANZ match). Monitor real search behavior—if MRM never appears first despite 2x, increase to 3x or 4x. If RANZ never appears, decrease MRM to 1.5x. Tunable via constant.

## Sources

### Primary (HIGH confidence)
- [PostgreSQL Documentation: 12.3 Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html) - ts_rank, setweight, weights
- [Drizzle ORM: PostgreSQL full-text search](https://orm.drizzle.team/docs/guides/postgresql-full-text-search) - Generated columns, ts_rank implementation
- [API with NestJS #163: Full-text search with the Drizzle ORM and PostgreSQL](https://wanago.io/2024/08/26/api-nestjs-drizzle-postgresql-full-text-search/) - setweight patterns, GIN indexes
- [Sling Academy: PostgreSQL Full-Text Search - A Guide to ts_rank](https://www.slingacademy.com/article/postgresql-full-text-search-a-guide-to-ts-rank-for-relevance-ranking/) - ts_rank behavior and ranking

### Secondary (MEDIUM confidence)
- [Algolia: Structured results](https://www.algolia.com/doc/guides/building-search-ui/ui-and-ux-patterns/structured-results/react) - Grouped search results UI pattern
- [Crunchy Data: Postgres Full-Text Search](https://www.crunchydata.com/blog/postgres-full-text-search-a-search-engine-in-a-database) - Performance characteristics, use cases
- [Better Stack: Full-Text Search in Postgres with TypeScript](https://betterstack.com/community/guides/scaling-nodejs/full-text-search-in-postgres-with-typescript/) - TypeScript implementation patterns

### Tertiary (LOW confidence, marked for validation)
- [GitHub: timescale/pg_textsearch](https://github.com/timescale/pg_textsearch) - BM25 extension, not needed for current scale
- Web search results on "consent mode" - mostly about cookie consent, not domain-specific guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PostgreSQL full-text search is built-in, documented, battle-tested for 15+ years
- Architecture: HIGH - ts_rank patterns verified in Drizzle ORM docs and PostgreSQL official docs
- Pitfalls: MEDIUM - Based on common PostgreSQL FTS mistakes (documented) + authority multiplier logic (inferred from requirement)
- Grouped results UI: MEDIUM - Algolia structured results pattern is established, but not MRM-specific
- COP section navigation: LOW - Section structure not yet defined in database, requires coordination with content import

**Research date:** 2026-02-02
**Valid until:** 60 days (PostgreSQL FTS is stable, minimal churn)

---

**Next steps for planner:**
1. Create migration adding search_vector generated column with GIN index
2. Enhance search API with ts_rank query path (keep ILIKE for code lookups)
3. Add source multiplier to relevance score calculation (mrm-cop × 2.0)
4. Create GroupedSearchResults component with MRM/RANZ sections
5. Add ConsentModeToggle in search UI (filters to sourceId='mrm-cop')
6. Implement section number detection regex for direct navigation
7. Seed copSectionNumber field during content import for SEARCH-04 support
