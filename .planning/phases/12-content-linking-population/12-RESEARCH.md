# Phase 12: Content Linking Population - Research

**Researched:** 2026-02-02
**Domain:** Content linking, string similarity, admin UI patterns, E2E testing
**Confidence:** HIGH

## Summary

This phase focuses on populating the `detail_links` table with MRM-to-RANZ links and providing admin tools to manage these links. The existing infrastructure is well-established:
- `detail_links` table exists with `primaryDetailId`, `supplementaryDetailId`, `linkType`, and `matchConfidence` columns
- Query functions for CRUD operations exist in `lib/db/queries/detail-links.ts`
- `DetailViewer` already integrates linked content (3D models, steps) and displays `RelatedContentTab`
- Admin UI patterns are established with `DataTable` component and admin routing

The main work is:
1. Auto-suggestion script that matches MRM and RANZ details by code similarity
2. Admin UI for reviewing/approving suggested links and manual link management
3. E2E tests covering all four content scenarios

**Primary recommendation:** Use `string-similarity` npm package for code matching (lightweight, no dependencies), build on existing admin patterns with `DataTable`, and implement suggestion-then-approval workflow.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `string-similarity` | ^4.0 | String comparison (Sorensen-Dice) | Lightweight, zero deps, returns 0-1 similarity score |
| drizzle-orm | ^0.45.1 | Database queries | Already in project, type-safe |
| Playwright | ^1.58.0 | E2E testing | Already configured in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | existing | Generate link IDs | Already used for link IDs |
| zod | ^4.3.6 | API validation | Already in project for form validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| string-similarity | Fuse.js | Fuse is better for fuzzy search across many fields, overkill for code matching |
| string-similarity | fast-fuzzy | More features but heavier, not needed for simple code comparison |

**Installation:**
```bash
npm install string-similarity @types/string-similarity
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  suggest-detail-links.ts       # Auto-suggestion script (CLI)
app/(admin)/admin/links/
  page.tsx                      # Link management list
  suggestions/page.tsx          # Pending suggestions review
  [id]/page.tsx                 # Edit/view single link
components/admin/
  LinkSuggestionCard.tsx        # Suggestion with approve/reject
  LinkPreview.tsx               # Visual preview of link result
lib/db/queries/
  detail-links.ts               # Extended with suggestion queries
tests/
  content-scenarios.spec.ts     # E2E for all 4 scenarios
```

### Pattern 1: Suggestion-Then-Approval Workflow
**What:** Script generates suggestions with confidence scores, admin reviews and approves
**When to use:** Content linking where automated matches need human verification
**Example:**
```typescript
// scripts/suggest-detail-links.ts
interface LinkSuggestion {
  mrmDetailId: string;
  mrmCode: string;
  ranzDetailId: string;
  ranzCode: string;
  matchConfidence: 'exact' | 'partial' | 'related';
  similarityScore: number;
  status: 'pending' | 'approved' | 'rejected';
}

// Exact match: codes are identical (F07 -> F07)
// Partial match: similarity > 0.7 (F07 -> F07A)
// Related: similarity > 0.5 (F07 -> F08)
```

### Pattern 2: Primary/Supplementary Link Direction
**What:** MRM is always primary (authoritative), RANZ is always supplementary
**When to use:** Every link creation
**Example:**
```typescript
// From existing detail-links.ts
await createDetailLink(
  mrmDetailId,      // primaryDetailId - always MRM
  ranzDetailId,     // supplementaryDetailId - always RANZ
  'installation_guide',
  'exact'
);
```

### Pattern 3: Admin Table with Actions
**What:** Use existing DataTable pattern with custom actions for link management
**When to use:** All admin list views
**Example:**
```typescript
// Follows existing admin/details/page.tsx pattern
<DataTable
  columns={linkColumns}
  data={links}
  getRowKey={(item) => item.id}
  onDelete={handleDeleteLink}
  viewHref={(item) => `/admin/links/${item.id}`}
/>
```

### Anti-Patterns to Avoid
- **Bidirectional link creation:** Don't create two records for one conceptual link. The schema uses `primaryDetailId` and `supplementaryDetailId` to represent direction.
- **Automatic approval:** Don't auto-approve suggestions without admin review, even for "exact" matches, as code similarity doesn't guarantee semantic equivalence.
- **Orphan link cleanup:** Don't leave links when source details are deleted. The schema has `ON DELETE CASCADE`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| String similarity | Custom Levenshtein | `string-similarity` | Edge cases, Unicode handling |
| Admin tables | Custom table | `DataTable` component | Already built, consistent UX |
| E2E testing | Custom test framework | Playwright | Already configured, cross-browser |
| Link ID generation | UUID v4 manual | `nanoid` | Already in use, shorter IDs |

**Key insight:** The project already has robust admin patterns and the `detail_links` infrastructure. This phase is about populating data and providing review UI, not building new systems.

## Common Pitfalls

### Pitfall 1: Matching by name instead of code
**What goes wrong:** Names vary significantly between sources even for same concept
**Why it happens:** Seems intuitive to match "Valley Flashing" to "Valley Flashing Guide"
**How to avoid:** Primary matching by code (F07 -> F07), use name only as secondary signal
**Warning signs:** Many false positives with low semantic relevance

### Pitfall 2: Not handling missing content scenarios
**What goes wrong:** UI breaks when detail has no 3D model, no steps, or no linked content
**Why it happens:** Only testing with fully-populated test data
**How to avoid:** E2E tests must cover all four scenarios explicitly
**Warning signs:** Null reference errors, empty tabs, missing attribution

### Pitfall 3: Duplicate link creation
**What goes wrong:** Same MRM-RANZ pair linked multiple times
**Why it happens:** Running suggestion script multiple times
**How to avoid:** Use `ON CONFLICT DO NOTHING` or check existence before insert
**Warning signs:** Duplicate entries in admin table, inflated "Related" counts

### Pitfall 4: Wrong authority direction
**What goes wrong:** RANZ set as primary, MRM as supplementary
**Why it happens:** Confusion about which source is authoritative
**How to avoid:** Script enforces MRM = primary, RANZ = supplementary
**Warning signs:** Wrong source badges, inverted attribution

## Code Examples

### String Similarity Matching
```typescript
// scripts/suggest-detail-links.ts
import stringSimilarity from 'string-similarity';

function getMatchConfidence(mrmCode: string, ranzCode: string): {
  confidence: 'exact' | 'partial' | 'related' | null;
  score: number;
} {
  const score = stringSimilarity.compareTwoStrings(
    mrmCode.toUpperCase(),
    ranzCode.toUpperCase()
  );

  if (mrmCode.toUpperCase() === ranzCode.toUpperCase()) {
    return { confidence: 'exact', score: 1.0 };
  }
  if (score >= 0.7) {
    return { confidence: 'partial', score };
  }
  if (score >= 0.5) {
    return { confidence: 'related', score };
  }
  return { confidence: null, score };
}
```

### Suggestion Generation Script
```typescript
// scripts/suggest-detail-links.ts
async function generateSuggestions() {
  const mrmDetails = await db
    .select({ id: details.id, code: details.code, name: details.name })
    .from(details)
    .where(eq(details.sourceId, 'mrm-cop'));

  const ranzDetails = await db
    .select({ id: details.id, code: details.code, name: details.name })
    .from(details)
    .where(eq(details.sourceId, 'ranz-guide'));

  const suggestions: LinkSuggestion[] = [];

  for (const mrm of mrmDetails) {
    for (const ranz of ranzDetails) {
      const { confidence, score } = getMatchConfidence(mrm.code, ranz.code);
      if (confidence) {
        suggestions.push({
          mrmDetailId: mrm.id,
          mrmCode: mrm.code,
          ranzDetailId: ranz.id,
          ranzCode: ranz.code,
          matchConfidence: confidence,
          similarityScore: score,
          status: 'pending',
        });
      }
    }
  }

  return suggestions;
}
```

### Link CRUD API
```typescript
// app/api/admin/links/route.ts
import { createDetailLink, deleteDetailLink } from '@/lib/db/queries/detail-links';

export async function POST(request: Request) {
  const { primaryDetailId, supplementaryDetailId, linkType, matchConfidence } =
    await request.json();

  const link = await createDetailLink(
    primaryDetailId,
    supplementaryDetailId,
    linkType,
    matchConfidence
  );

  return Response.json(link);
}
```

### E2E Test for Content Scenarios
```typescript
// tests/content-scenarios.spec.ts
test.describe('Content Linking Scenarios', () => {
  test('MRM-only detail shows no 3D model, shows warnings', async ({ page }) => {
    // Detail with MRM source, no linked RANZ, no modelUrl
    await page.goto('/detail/mrm-only-detail-id');
    await expect(page.locator('[data-testid="3d-viewer"]')).not.toBeVisible();
    await expect(page.getByText(/warnings/i)).toBeVisible();
  });

  test('RANZ-only detail shows 3D model, no warnings', async ({ page }) => {
    // Detail with RANZ source, has modelUrl, no warnings
    await page.goto('/detail/ranz-only-detail-id');
    await expect(page.locator('[data-testid="3d-viewer"]')).toBeVisible();
    await expect(page.getByText(/warnings/i)).not.toBeVisible();
  });

  test('Linked detail shows borrowed model with attribution', async ({ page }) => {
    // MRM detail linked to RANZ guide with 3D model
    await page.goto('/detail/linked-mrm-detail-id');
    await expect(page.locator('[data-testid="3d-viewer"]')).toBeVisible();
    await expect(page.getByText(/provided by/i)).toBeVisible();
  });

  test('Unlinked detail shows placeholder', async ({ page }) => {
    // Detail with no source, no links, no model
    await page.goto('/detail/standalone-detail-id');
    await expect(page.getByText(/no.*model.*available/i)).toBeVisible();
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual link entry | Suggested + approved | This phase | Faster population, fewer errors |
| Single-source content | Cross-source linking | Phase 7/10 | Richer detail views |

**Deprecated/outdated:**
- The `detail_cross_references` table exists but is for same-source references (junction details), not cross-source linking. Use `detail_links` for MRM-RANZ linking.

## Open Questions

1. **Suggestion persistence**
   - What we know: Script generates suggestions, admin approves
   - What's unclear: Should suggestions be stored in DB or just generated on-demand?
   - Recommendation: Store in memory during admin session, approved links go to `detail_links` table. No new table needed.

2. **Bulk approval**
   - What we know: Many exact matches will need approval
   - What's unclear: Should admin be able to approve all exact matches at once?
   - Recommendation: Yes, add "Approve All Exact" button but require confirmation

3. **Link type determination**
   - What we know: `linkType` can be 'installation_guide', 'technical_supplement', 'alternative'
   - What's unclear: How to determine which type for auto-suggestions
   - Recommendation: Default to 'installation_guide' for auto-suggestions, allow admin to change

## Sources

### Primary (HIGH confidence)
- Existing codebase: `lib/db/queries/detail-links.ts` - verified CRUD functions
- Existing codebase: `lib/db/schema.ts` - verified table structure
- Existing codebase: `components/details/RelatedContentTab.tsx` - verified UI integration
- Existing codebase: `components/admin/DataTable.tsx` - verified admin pattern
- Existing codebase: `tests/navigation.spec.ts` - verified Playwright patterns

### Secondary (MEDIUM confidence)
- [Fuse.js documentation](https://www.fusejs.io/) - fuzzy search patterns (verified via WebFetch)
- [Drizzle ORM relations](https://orm.drizzle.team/docs/relations) - many-to-many patterns

### Tertiary (LOW confidence)
- [string-similarity npm](https://www.npmjs.com/package/string-similarity) - API details from WebSearch
- [Content approval workflow patterns](https://planable.io/blog/content-approval-workflow/) - general workflow guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - based on existing project patterns and npm ecosystem knowledge
- Architecture: HIGH - extends existing admin patterns, no new paradigms
- Pitfalls: HIGH - derived from codebase analysis and common linking issues

**Research date:** 2026-02-02
**Valid until:** 30 days (stable domain, no fast-moving dependencies)
