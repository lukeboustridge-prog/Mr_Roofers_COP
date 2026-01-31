# Architecture Patterns: MRM-RANZ Content Integration

**Domain:** Multi-source COP content unification
**Researched:** 2026-01-31
**Confidence:** HIGH (based on codebase analysis)

## Executive Summary

The integration challenge is unifying two independent content sources (MRM COP with 251 technical details + RANZ Guide with 61 installation guides) into a coherent user experience where MRM provides the structural backbone and RANZ provides rich 3D installation guides that can be mapped onto MRM topics.

**Key insight:** The sources are complementary, not competing. MRM has breadth (251 details, warnings, case law). RANZ has depth (61 details with 3D models, stage-synchronized steps). The architecture should let users see "here's everything we have on this topic" regardless of source.

## Current State Analysis

### Existing Schema Capabilities

The schema already supports multi-source content:

```
contentSources (id, name, shortName)
    |
    +-- substrates.sourceId (nullable = universal)
    +-- categories.sourceId (nullable = universal)
    +-- details.sourceId (required)
```

**Current content distribution:**
| Source | Details | Steps | Warnings | 3D Models | Images |
|--------|---------|-------|----------|-----------|--------|
| mrm-cop | 251 | 528 | 159 | 0 | 431 |
| ranz-guide | 61 | 287 | 0 | 61 | 0 |

**Current category structure:**
- MRM: 5 categories (drainage, flashings, junctions, penetrations, ventilation)
- RANZ: 5 categories (flashings, penetrations-corrugated, penetrations-rib, cladding-horizontal, cladding-vertical)
- Overlap: 0 shared category IDs

### The Integration Problem

Users navigating the app currently see siloed content:
1. Navigate to "Flashings" category under Long-Run Metal
2. See only MRM flashings OR only RANZ flashings (depending on category ID)
3. Miss the rich 3D installation guides if viewing MRM structure

**Goal:** Navigate once, see all related content from both sources.

## Recommended Architecture

### Pattern 1: Topic-Based Unified Categories

Create topic entities that group semantically-related categories from multiple sources.

```
                    ┌─────────────────────────────────┐
                    │            topics               │
                    │  id: 'flashings'                │
                    │  name: 'Flashings'              │
                    │  description: 'Wall, apron...'  │
                    └─────────────┬───────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        v                         v                         v
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ lrm-flashings │       │ ranz-flashings│       │ membrane-...  │
│ sourceId: mrm │       │ sourceId: ranz│       │ (future)      │
│ 47 details    │       │ 30 details    │       │               │
└───────────────┘       └───────────────┘       └───────────────┘
```

**New table:**
```typescript
export const topics = pgTable('topics', {
  id: text('id').primaryKey(),           // 'flashings'
  name: text('name').notNull(),           // 'Flashings'
  description: text('description'),
  iconUrl: text('icon_url'),
  sortOrder: integer('sort_order').default(0),
});

export const categoryTopics = pgTable('category_topics', {
  categoryId: text('category_id').references(() => categories.id).notNull(),
  topicId: text('topic_id').references(() => topics.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.categoryId, table.topicId] }),
}));
```

**Why this pattern:**
- Preserves existing category IDs (no breaking changes)
- Allows many-to-many: one RANZ category can map to multiple topics
- Additive: new sources just link their categories to existing topics
- Query becomes: "Give me all details where category.topicId = X"

### Pattern 2: Detail Cross-References (Already Exists)

The schema already has `detailCrossReferences` for linking related details:

```typescript
export const detailCrossReferences = pgTable('detail_cross_references', {
  detailId: text('detail_id').references(() => details.id).notNull(),
  relatedDetailId: text('related_detail_id').references(() => details.id).notNull(),
  relationshipType: text('relationship_type').notNull(),
  notes: text('notes'),
});
```

**Relationship types to use:**
| Type | Meaning | Example |
|------|---------|---------|
| `installation-guide` | RANZ detail is installation guide for MRM detail | MRM "Valley Flashing" -> RANZ "F07 Valley" |
| `alternative` | Different approaches to same problem | Crimped vs welted ridge |
| `companion` | Should be considered together | Apron + step flashing |
| `supersedes` | Newer version/approach | Updated NZBC compliance |

**Why this pattern:**
- Already in schema, zero migration
- Bidirectional queries supported
- Notes field captures context ("RANZ F07 provides 3D installation steps")

### Pattern 3: Content Capability Flags

Add computed/denormalized flags to details for UI filtering:

```typescript
// Option A: Computed at query time
interface DetailWithCapabilities {
  ...detail,
  has3DModel: boolean,          // modelUrl != null
  hasSteps: boolean,            // steps.length > 0
  hasWarnings: boolean,         // warningConditions.length > 0
  hasCaseLaw: boolean,          // failureLinks.length > 0
  hasImages: boolean,           // thumbnailUrl != null OR steps have images
  relatedGuideId: string | null // First linked RANZ installation guide
}

// Option B: Denormalized columns (for performance)
export const details = pgTable('details', {
  ...existing,
  has3DModel: boolean('has_3d_model').default(false),
  hasSteps: boolean('has_steps').default(false),
  hasWarnings: boolean('has_warnings').default(false),
  hasCaseLaw: boolean('has_case_law').default(false),
  imageCount: integer('image_count').default(0),
});
```

**Recommendation:** Option A (computed) for now. Only denormalize if query performance becomes an issue with 1000+ details.

## Component Architecture

### Unified Detail Page

The DetailViewer component should dynamically compose sections based on available content:

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: Code + Name + Source Badges (MRM, RANZ)                │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  3D Model Viewer (if detail.modelUrl OR relatedGuide.modelUrl)  │
│  │  Shows: RANZ 3D model with step sync                            │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  Quick Stats: Pitch | Warnings | Case Law | Has 3D | Has Steps   │
├──────────────────────────────────────────────────────────────────┤
│  Ventilation Checks (always visible per spec)                    │
├──────────────────────────────────────────────────────────────────┤
│  Tabs:                                                           │
│  ┌─────────┬──────────────┬──────────┬────────────┬───────────┐ │
│  │Overview │ Installation │ Warnings │ References │ Related   │ │
│  └─────────┴──────────────┴──────────┴────────────┴───────────┘ │
│                                                                  │
│  [Overview Tab]                                                  │
│  - MRM Description + Specifications                              │
│  - MRM Images (full gallery, not just thumbnail)                 │
│  - Case Law summary                                              │
│                                                                  │
│  [Installation Tab]                                              │
│  - Primary: RANZ steps if linked guide exists                    │
│  - Fallback: MRM steps if no RANZ guide                          │
│  - 3D sync if RANZ guide                                         │
│                                                                  │
│  [Related Tab] <- NEW                                            │
│  - Linked installation guides (cross-source)                     │
│  - Alternative approaches                                        │
│  - Companion details                                             │
└──────────────────────────────────────────────────────────────────┘
```

### Topic-Unified Category Page

The category page should show details from all sources that map to the topic:

```
┌──────────────────────────────────────────────────────────────────┐
│  Flashings (Topic)                                               │
│  "Wall, apron, barge, step, and ridge flashings"                 │
├──────────────────────────────────────────────────────────────────┤
│  Source Tabs: [All] [MRM COP] [RANZ Guide]                       │
├──────────────────────────────────────────────────────────────────┤
│  Filters: [Has 3D] [Has Steps] [Has Warnings] [Has Case Law]     │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Detail Card                                              │   │
│  │  ┌─────┐  F01 Wall Bottom                                │   │
│  │  │thumb│  Wall flashings and cladding junction           │   │
│  │  └─────┘  [MRM] [RANZ] [3D] [12 steps] [2 warnings]     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ...                                                             │
└──────────────────────────────────────────────────────────────────┘
```

### New Components Needed

| Component | Purpose | Priority |
|-----------|---------|----------|
| `TopicCategoryPage` | Unified view across sources | P0 |
| `ContentCapabilityBadges` | Visual indicators for 3D, steps, etc. | P0 |
| `RelatedGuidesSection` | Show cross-source linked content | P1 |
| `ImageGallery` | Full MRM image display (not just thumbnails) | P1 |
| `SourceTabs` | Filter by content source | P2 |

## Data Model Changes

### Required Migrations

**Migration 1: Topics table**
```sql
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE category_topics (
  category_id TEXT NOT NULL REFERENCES categories(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  PRIMARY KEY (category_id, topic_id)
);
```

**Migration 2: Initial topic mappings**
```sql
-- Create unified topics
INSERT INTO topics (id, name, description, sort_order) VALUES
  ('flashings', 'Flashings', 'Wall, apron, barge, step, parapet, and ridge flashings', 1),
  ('penetrations', 'Penetrations', 'Pipe, vent, skylight, and equipment penetrations', 2),
  ('ridges-hips', 'Ridges & Hips', 'Ridge and hip cappings and flashings', 3),
  ('valleys', 'Valleys', 'Valley gutters and flashing systems', 4),
  ('junctions', 'Junctions', 'Roof-to-wall and roof-to-roof intersections', 5),
  ('drainage', 'Drainage', 'Gutters, downpipes, and capacity calculations', 6),
  ('ventilation', 'Ventilation', 'Roof space ventilation and condensation control', 7),
  ('cladding', 'Cladding', 'Wall and roof cladding installation', 8);

-- Map existing categories to topics
INSERT INTO category_topics (category_id, topic_id) VALUES
  ('lrm-flashings', 'flashings'),
  ('ranz-flashings', 'flashings'),
  ('lrm-penetrations', 'penetrations'),
  ('ranz-penetrations-corrugated', 'penetrations'),
  ('ranz-penetrations-rib', 'penetrations'),
  ('lrm-junctions', 'junctions'),
  ('lrm-drainage', 'drainage'),
  ('lrm-ventilation', 'ventilation'),
  ('ranz-cladding-horizontal', 'cladding'),
  ('ranz-cladding-vertical', 'cladding');
```

**Migration 3: Populate cross-references**
```sql
-- Link RANZ installation guides to MRM details
-- This requires semantic matching (detail name similarity)
-- Best done via script, not raw SQL
```

### No Breaking Changes

All changes are additive:
- Existing routes continue to work
- Existing detail pages render correctly
- New topic-based routes are optional enhancement

## Query Patterns

### Get all details for a topic (unified view)

```typescript
async function getDetailsByTopic(topicId: string, options: {
  sourceId?: string;
  has3DModel?: boolean;
  hasWarnings?: boolean;
}) {
  // Get all categories for this topic
  const topicCategories = await db
    .select({ categoryId: categoryTopics.categoryId })
    .from(categoryTopics)
    .where(eq(categoryTopics.topicId, topicId));

  const categoryIds = topicCategories.map(c => c.categoryId);

  // Build where clause
  let whereClause = or(...categoryIds.map(id => eq(details.categoryId, id)));

  if (options.sourceId) {
    whereClause = and(whereClause, eq(details.sourceId, options.sourceId));
  }

  // Query details with capability counts
  const results = await db.select({
    ...details,
    stepCount: sql`(SELECT COUNT(*) FROM detail_steps WHERE detail_id = details.id)`,
    warningCount: sql`(SELECT COUNT(*) FROM warning_conditions WHERE detail_id = details.id)`,
    failureCount: sql`(SELECT COUNT(*) FROM detail_failure_links WHERE detail_id = details.id)`,
  })
  .from(details)
  .where(whereClause);

  return results;
}
```

### Get detail with related guides

```typescript
async function getDetailWithRelatedContent(detailId: string) {
  const detail = await getDetailById(detailId);

  // Get linked installation guides
  const relatedGuides = await db
    .select({
      relatedDetail: details,
      relationshipType: detailCrossReferences.relationshipType,
      notes: detailCrossReferences.notes,
    })
    .from(detailCrossReferences)
    .innerJoin(details, eq(detailCrossReferences.relatedDetailId, details.id))
    .where(eq(detailCrossReferences.detailId, detailId));

  // Also get reverse references (this detail is someone's guide)
  const referencedBy = await db
    .select({
      parentDetail: details,
      relationshipType: detailCrossReferences.relationshipType,
    })
    .from(detailCrossReferences)
    .innerJoin(details, eq(detailCrossReferences.detailId, details.id))
    .where(eq(detailCrossReferences.relatedDetailId, detailId));

  return {
    ...detail,
    relatedGuides,
    referencedBy,
  };
}
```

## Four Content Scenarios

The architecture handles all four scenarios:

| Scenario | Example | Rendering |
|----------|---------|-----------|
| **MRM-only** | "5.2.1 Gutter Capacity" | MRM description, specs, steps, warnings, images. No 3D. |
| **RANZ-only** | "GCV01 Vertical Corner" | RANZ steps with 3D sync. No MRM content. |
| **Both linked** | "F07 Valley" | MRM specs/warnings + RANZ 3D installation guide. Best of both. |
| **Neither** | New topic area | Empty state with "content coming soon" message. |

### Rendering Logic

```typescript
function DetailPage({ detail, relatedGuides }) {
  const ranzGuide = relatedGuides.find(g =>
    g.relationshipType === 'installation-guide' &&
    g.relatedDetail.sourceId === 'ranz-guide'
  );

  return (
    <div>
      {/* 3D Model: Use RANZ if linked, otherwise check detail itself */}
      {(ranzGuide?.relatedDetail.modelUrl || detail.modelUrl) && (
        <Model3DViewer
          modelUrl={ranzGuide?.relatedDetail.modelUrl || detail.modelUrl}
          stageMetadata={ranzGuide ? getStageMetadata(ranzGuide.relatedDetail.id) : null}
        />
      )}

      {/* Installation steps: Prefer RANZ for 3D sync, fallback to MRM */}
      <Tabs>
        <TabContent value="installation">
          {ranzGuide ? (
            <StepByStep
              steps={ranzGuide.relatedDetail.steps}
              has3DSync={true}
            />
          ) : detail.steps?.length > 0 ? (
            <StepByStep steps={detail.steps} />
          ) : (
            <EmptyState message="Installation steps coming soon" />
          )}
        </TabContent>
      </Tabs>

      {/* Warnings: Always from MRM (RANZ has 0) */}
      {detail.warnings?.length > 0 && (
        <WarningsSection warnings={detail.warnings} />
      )}

      {/* Related tab shows cross-references */}
      <RelatedGuidesSection
        guides={relatedGuides}
        currentSource={detail.sourceId}
      />
    </div>
  );
}
```

## Build Order Recommendation

### Phase 1: Data Layer (Week 1)
1. Add `topics` and `category_topics` tables
2. Create migration with initial topic mappings
3. Write script to populate `detailCrossReferences` based on code/name matching
4. Add query functions: `getDetailsByTopic`, `getDetailWithRelatedContent`

### Phase 2: UI Components (Week 1-2)
1. Create `ContentCapabilityBadges` component
2. Add "Related" tab to DetailViewer
3. Create `TopicCategoryPage` for unified navigation
4. Add `ImageGallery` component for MRM images

### Phase 3: Navigation Updates (Week 2)
1. Update substrate page to show topics (not raw categories)
2. Add source filter to category page
3. Update breadcrumbs for topic navigation
4. Add capability filters to search

### Phase 4: Data Population (Week 2)
1. Run cross-reference population script
2. Validate all RANZ guides linked to appropriate MRM details
3. QA test all four content scenarios
4. Document any unmapped content

## Source Attribution Preservation

Both sources' identity is preserved through:

1. **SourceBadge component** - Already exists, shows "MRM" or "RANZ" badges
2. **SourceAttribution component** - Already exists, shows in References tab
3. **Detail listing badges** - Show which sources contribute to a topic
4. **Cross-reference notes** - Explain relationship ("RANZ F07 provides 3D installation guide")

No content is "merged" - it's linked. Users always know where content came from.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Content Duplication
**What:** Copying RANZ content into MRM details or vice versa
**Why bad:** Creates sync issues, unclear attribution, data bloat
**Instead:** Use cross-references to link, not copy

### Anti-Pattern 2: Source-Specific Routes
**What:** `/planner/mrm/flashings` vs `/planner/ranz/flashings`
**Why bad:** Forces users to know which source has what
**Instead:** `/planner/flashings` shows all sources, filter optional

### Anti-Pattern 3: Eager Loading All Related Content
**What:** Fetching all cross-references on every detail load
**Why bad:** Performance hit, especially for details with many relationships
**Instead:** Lazy load related content when "Related" tab is selected

### Anti-Pattern 4: Schema Over-Normalization
**What:** Creating separate tables for every capability flag
**Why bad:** Query complexity, join explosion
**Instead:** Compute capabilities from existing data, denormalize only if needed

## Sources

This architecture analysis is based on:
- Schema review: `lib/db/schema.ts` (current tables and relationships)
- Query patterns: `lib/db/queries.ts` (existing data access)
- UI components: `components/details/DetailViewer.tsx` (current rendering)
- Import scripts: `lib/db/import-mrm.ts`, `lib/db/import-ranz.ts` (data structure)

**Confidence level: HIGH** - All recommendations derive from existing codebase patterns.
