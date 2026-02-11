---
phase: 21-mrm-cop-excerpt-fallback
plan: 01
subsystem: content-quality
status: complete
tags:
  - cop-excerpts
  - mrm-details
  - content-pipeline
  - section-references
dependency_graph:
  requires:
    - "20-01 (RANZ steps primary logic)"
    - "COP chapter JSON files (public/cop/chapter-N.json)"
  provides:
    - "COP excerpt resolution utility (lib/cop-excerpt.ts)"
    - "resolveCopExcerpts function"
    - "CopExcerptData type definition"
    - "Excerpt data pipeline to DetailViewer"
  affects:
    - "Planner detail page (resolves excerpts for MRM-only details)"
    - "Fixer detail page (resolves excerpts for MRM-only details)"
    - "DetailViewer (accepts copExcerpts prop)"
tech_stack:
  added:
    - "lib/cop-excerpt.ts - Server-side COP section resolution"
  patterns:
    - "Recursive section search with subsection support"
    - "Sentence-boundary text truncation"
    - "Chapter JSON caching to avoid redundant file reads"
    - "Deep-link URL generation (/cop/N#section-N.N.N)"
key_files:
  created:
    - path: "lib/cop-excerpt.ts"
      purpose: "Resolves COP section excerpts from step instructions"
      exports: ["resolveCopExcerpts", "CopExcerptData", "parseSectionNumber", "findSectionInChapter", "truncateToSentence"]
  modified:
    - path: "components/details/DetailViewer.tsx"
      changes:
        - "Added copExcerpts prop (CopExcerptData[])"
        - "Added hasCopExcerpts computed flag"
        - "Import CopExcerptData type"
    - path: "app/(dashboard)/planner/[substrate]/[category]/[detailId]/page.tsx"
      changes:
        - "Import resolveCopExcerpts"
        - "Resolve excerpts for MRM-only details (no linked RANZ steps)"
        - "Pass copExcerpts to DetailViewer"
    - path: "app/(dashboard)/fixer/[detailId]/page.tsx"
      changes:
        - "Import resolveCopExcerpts"
        - "Resolve excerpts for MRM-only details"
        - "Pass copExcerpts to DetailViewer"
decisions:
  - decision: "Use fs.readFileSync for chapter JSON loading (server-side only)"
    rationale: "Detail pages are server components - no client-side execution needed"
  - decision: "Cache loaded chapters in Map during resolution"
    rationale: "Details can reference multiple sections from same chapter - avoid redundant file reads"
  - decision: "Section number pattern: /^(\\d+(?:\\.\\d+)*[A-Z]?)/"
    rationale: "Matches 5.1, 5.1A, 8.5.4, 1 - handles letter suffixes for subsections"
  - decision: "Truncate excerpts to ~200 chars at sentence boundary"
    rationale: "Provides context without overwhelming user - complete sentences read better"
  - decision: "Only resolve for MRM-only details (no linked RANZ steps)"
    rationale: "RANZ steps are actionable instructions - COP excerpts are fallback for section-refs"
  - decision: "hasCopExcerpts flag prepared but unused in Plan 01"
    rationale: "Data pipeline established - UI rendering is Plan 02 scope"
metrics:
  duration_minutes: 4.5
  tasks_completed: 2
  files_created: 1
  files_modified: 3
  commits: 2
  completed_at: "2026-02-11T05:08:03Z"
---

# Phase 21 Plan 01: COP Excerpt Resolution Utility Summary

**One-liner:** Server-side COP section resolution utility that parses step instructions, loads chapter JSON, and returns excerpt data (title, truncated content, deep-link) for MRM-only details.

## What Was Built

Created the data pipeline to resolve COP section references from MRM detail step instructions into structured excerpt data with titles, truncated content, and deep-links to the full COP section.

### Core Components

**1. lib/cop-excerpt.ts (157 lines)**
- `parseSectionNumber(instruction)` - Regex-based section number extraction (handles 5.1, 5.1A, 8.5.4, etc.)
- `findSectionInChapter(sections, sectionNumber)` - Recursive search through sections/subsections
- `truncateToSentence(text, maxLength=200)` - Smart truncation at sentence boundaries
- `resolveCopExcerpts(steps)` - Main function: loads chapter JSON, finds sections, builds excerpt data
- `CopExcerptData` interface - Structured excerpt format with deep-link URL

**2. Detail Page Integration**
- Planner and Fixer detail pages now resolve excerpts for MRM-only details (those without linked RANZ guide steps)
- DetailViewer accepts `copExcerpts` prop (CopExcerptData[])
- Computed flag `hasCopExcerpts` prepared for Plan 02 UI rendering

### Data Flow

```
Detail Page (Server Component)
  ↓
Check: Has steps? No linked RANZ steps?
  ↓ YES (MRM-only detail)
resolveCopExcerpts(detail.steps)
  ↓
For each step:
  → parseSectionNumber("5.1A Ridge-Hip Junction") → "5.1A"
  → Determine chapter: 5
  → Load chapter-5.json (cached if already loaded)
  → findSectionInChapter(sections, "5.1A")
  → Build CopExcerptData:
      - title: "Ridge-Hip Junction"
      - excerpt: "First ~200 chars of section content..."
      - deepLinkUrl: "/cop/5#section-5.1A"
      - chapterNumber: 5
      - chapterTitle: "Metal Roofing"
  ↓
Pass copExcerpts[] to DetailViewer
  ↓
(Plan 02: Render excerpts in UI)
```

## Technical Details

### Section Number Parsing

**Supported patterns:**
- "5.1" → 5.1
- "5.1A Ridge-Hip Junction" → 5.1A
- "8.5.4" → 8.5.4
- "1" → 1
- "4.7 Gutter Capacity Calculator" → 4.7

**Rejected patterns:**
- "ROOF DRAINAGE" → null (no leading section number)
- "Install flashing..." → null (installation instruction, not section ref)

### Chapter JSON Loading

- Path: `public/cop/chapter-{N}.json` (N = 1-19)
- Uses `readFileSync` (server-side only, synchronous is acceptable)
- Caches loaded chapters in Map to avoid redundant reads when detail has multiple steps from same chapter
- Gracefully skips if chapter file missing or section not found

### Excerpt Truncation

- Target: ~200 characters
- Strategy: Find last sentence-ending (`. ` or `.\n`) within maxLength
- Fallback: If no sentence boundary, truncate at word boundary + "..."
- Result: Complete sentences that provide context without overwhelming user

## Verification Results

**Build:** PASSED (npm run build)
- TypeScript compilation: ✓
- ESLint: ✓ (unused hasCopExcerpts flagged and suppressed with comment)
- All routes compiled successfully

**Type Safety:**
- CopExcerptData interface exported from lib/cop-excerpt.ts
- DetailViewer accepts CopExcerptData[] as optional prop
- Server components resolve excerpts server-side only (no client bundle impact)

**Integration Points:**
- Planner detail page resolves excerpts: ✓
- Fixer detail page resolves excerpts: ✓
- DetailViewer accepts copExcerpts prop: ✓
- hasCopExcerpts flag computed: ✓

## Coverage

**MRM-only details affected:** 190 details (those without RANZ linked guide with steps)

These details currently show section-ref steps like:
- "5.1"
- "5.1A Ridge-Hip Junction"
- "8.5.4"
- "ROOF DRAINAGE"

With Plan 01 complete, the data is now resolved:
- Section number parsed
- COP chapter JSON loaded
- Section title found
- Content excerpt truncated
- Deep-link URL generated

Plan 02 will render this data in the UI.

## Deviations from Plan

None - plan executed exactly as written.

All tasks completed:
1. Created lib/cop-excerpt.ts with all specified functions ✓
2. Wired excerpts into planner and fixer detail pages ✓
3. DetailViewer accepts copExcerpts prop ✓
4. Build passes cleanly ✓

## Impact Assessment

**User-facing:** None (yet)
- Data pipeline established
- No UI changes in Plan 01
- Plan 02 will render excerpts for MRM-only details

**Developer-facing:** Positive
- Clean server-side utility for COP section resolution
- Reusable functions (parseSectionNumber, findSectionInChapter, truncateToSentence)
- Type-safe CopExcerptData interface
- Chapter caching optimization

**Technical debt:** None introduced
- No client-side bundle impact (server-only utility)
- No breaking changes to existing functionality
- Follows existing patterns (COP chapter JSON loading, detail page structure)

## Next Steps (Plan 02)

1. Render COP excerpts in DetailViewer Installation tab
2. Add "View Full Section" deep-link buttons
3. Show chapter + section number context
4. Handle case where no excerpts resolved (all steps are non-section-refs)
5. Visual differentiation from RANZ installation steps

## Self-Check: PASSED

### Files Created

```bash
[ -f "C:\Users\LukeBoustridge\Projects\RANZ\Master Roofers Code of Practice\lib\cop-excerpt.ts" ] && echo "FOUND: lib/cop-excerpt.ts" || echo "MISSING: lib/cop-excerpt.ts"
```
**Result:** FOUND: lib/cop-excerpt.ts

### Commits Exist

```bash
git log --oneline --all | grep -q "d28db14" && echo "FOUND: d28db14" || echo "MISSING: d28db14"
git log --oneline --all | grep -q "8c85cd7" && echo "FOUND: 8c85cd7" || echo "MISSING: 8c85cd7"
```
**Result:**
- FOUND: d28db14 (Create COP excerpt resolution utility)
- FOUND: 8c85cd7 (Wire COP excerpts into detail pages)

### Exports Verified

lib/cop-excerpt.ts exports:
- ✓ resolveCopExcerpts (main function)
- ✓ CopExcerptData (type interface)
- ✓ parseSectionNumber (helper)
- ✓ findSectionInChapter (helper)
- ✓ truncateToSentence (helper)

DetailViewer accepts:
- ✓ copExcerpts prop (CopExcerptData[])

Detail pages call:
- ✓ Planner page imports and calls resolveCopExcerpts
- ✓ Fixer page imports and calls resolveCopExcerpts
- ✓ Both pass copExcerpts to DetailViewer

**All verification checks passed.**

---

**Completed:** 2026-02-11T05:08:03Z
**Duration:** 4.5 minutes
**Commits:** d28db14, 8c85cd7
**Status:** Ready for Plan 02 (COP excerpt UI rendering)
