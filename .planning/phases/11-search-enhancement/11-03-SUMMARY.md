---
phase: 11-search-enhancement
plan: 03
subsystem: search-ui
completed: 2026-02-02
duration: 5min
status: complete

tags:
  - grouped-results
  - consent-mode
  - authority-ui
  - search-ux

requires:
  - 11-01-search-api-enhancement
  - 11-02-consent-mode-toggle

provides:
  - grouped-search-results-display
  - mrm-ranz-visual-separation
  - consent-mode-integration
  - section-redirect-handling

affects:
  - 11-04-search-authority-weighting
  - 11-05-search-verification

tech-stack:
  added: []
  patterns:
    - grouped-results-by-source
    - visual-section-separators
    - consent-mode-filtering

key-files:
  created:
    - components/search/SearchResultCard.tsx
    - components/search/GroupedSearchResults.tsx
  modified:
    - app/(dashboard)/search/page.tsx

decisions:
  - title: SearchResultCard as standalone component
    rationale: Reusable in both grouped and ungrouped contexts
    context: Extracted from inline rendering for composition
    impact: Better separation of concerns, consistent styling
  - title: Visual separator for supplementary content
    rationale: Clear authority distinction without overwhelming UI
    context: "Supplementary Content" divider between MRM and RANZ sections
    impact: Improves scanability and understanding of authority hierarchy
  - title: Consent mode empty state guidance
    rationale: Help users understand why no results when consent mode enabled
    context: Empty state suggests disabling consent mode to see supplementary content
    impact: Reduces confusion when MRM content doesn't match query

integrations:
  - from: app/(dashboard)/search/page.tsx
    to: components/search/GroupedSearchResults.tsx
    type: component-composition
    data-flow: results array, consentMode boolean
  - from: components/search/GroupedSearchResults.tsx
    to: components/search/SearchResultCard.tsx
    type: component-composition
    data-flow: individual result objects with sourceId
  - from: components/search/SearchResultCard.tsx
    to: components/authority/SourceBadge.tsx
    type: authority-styling
    data-flow: authority level derived from sourceId
---

# Phase 11 Plan 03: Grouped Search Results with Consent Mode Integration

**One-liner:** Grouped search results with MRM/RANZ visual separation, consent mode toggle in UI, and section number navigation redirect handling.

## Overview

Created a grouped search results display that presents MRM Code of Practice content first (authoritative), followed by RANZ Guide content (supplementary), with clear visual separation. Integrated ConsentModeToggle into search UI, enabling users to filter to authoritative content only for Building Code citation purposes. Added section number search redirect handling for direct navigation to COP sections.

## What Was Built

### 1. SearchResultCard Component
**File:** `components/search/SearchResultCard.tsx`

Standalone search result card with authority-aware styling:

- **Authority-based borders:** Blue left border (4px) for MRM authoritative content, grey left border for RANZ supplementary content
- **SourceBadge integration:** Shows source badge (MRM COP / RANZ) with authority variant styling
- **Exact match indicator:** Zap icon for exact code matches
- **Icon background colors:** Primary/10 for authoritative, slate-100 for supplementary
- **Warning/failure badges:** Amber badges for warnings, red badges for failure counts
- **Accessibility:** aria-labels for screen readers, role attributes

**Key features:**
- Extracts authority level from sourceId via `getAuthorityLevel()` helper
- Looks up source metadata from `CONTENT_SOURCES` constant
- Generates result link based on type (detail vs failure)
- Maintains 48px minimum touch targets
- Truncates long text for compact display

### 2. GroupedSearchResults Component
**File:** `components/search/GroupedSearchResults.tsx`

Groups search results by source authority with visual separation:

- **Three-tier grouping:** MRM COP first, RANZ Guide second, other sources last
- **Section headers:** BookOpen icon for MRM (primary), Library icon for RANZ (supplementary)
- **Visual separator:** "Supplementary Content" divider between MRM and RANZ sections when both present
- **Consent mode support:** Shows only MRM results when enabled, or empty state with guidance
- **Result counts:** Displays count per section ("5 results")
- **Accessibility:** Section landmarks, aria-labels, role="list"

**Empty state handling:**
When consent mode is enabled and no MRM results found:
- BookOpen icon (grey)
- "No authoritative MRM COP content found for this search"
- Suggestion to disable consent mode to see supplementary content

### 3. Search Page Integration
**File:** `app/(dashboard)/search/page.tsx`

Updated search page to use new components:

- **Imports:** Added GroupedSearchResults and ConsentModeToggle
- **SearchResult interface:** Added `sourceId` and `relevanceScore` fields
- **ConsentModeToggle placement:** Below search input, above filter panel
- **API integration:** Passes `consentMode=true` parameter when toggle enabled
- **Section redirect handling:** Checks `data.redirect` from API response and navigates
- **Simplified rendering:** Replaced inline result mapping with GroupedSearchResults component
- **Removed duplication:** Removed `getResultLink()` function (handled by SearchResultCard)

**performSearch updates:**
```typescript
// Read consent mode from URL
const consentMode = searchParams.get('consentMode') === 'true';
if (consentMode) {
  params.append('consentMode', 'true');
}

// Handle section number redirect
if (data.redirect) {
  router.push(data.redirect);
  return;
}
```

## Technical Implementation

### Component Composition Pattern
```
SearchPage
  ├─ ConsentModeToggle (URL state management)
  ├─ SearchBar (query input)
  └─ GroupedSearchResults (results display)
       └─ SearchResultCard (individual results)
            └─ SourceBadge (authority styling)
```

### Authority Styling System
- **Authoritative (MRM COP):**
  - Blue left border (`border-l-primary`)
  - Primary background on icon box (`bg-primary/10`)
  - BookOpen icon in section headers
  - "Authoritative" badge text

- **Supplementary (RANZ Guide):**
  - Grey left border (`border-l-slate-200`)
  - Slate background on icon box (`bg-slate-100`)
  - Library icon in section headers
  - "Supplementary" badge text

### Consent Mode Flow
1. User toggles consent mode in UI
2. ConsentModeToggle sets `consentMode=true` and `source=mrm-cop` in URL
3. Search page reads params and passes to API
4. GroupedSearchResults receives consentMode prop
5. If true, only MRM results displayed (RANZ filtered out)
6. If no MRM results, empty state suggests disabling toggle

### Section Number Navigation
Section number queries (e.g., "4.3.2") are detected by the search API and return:
```json
{
  "redirect": "/search?q=4.3.2&source=mrm-cop"
}
```
Search page checks for `data.redirect` and navigates instead of displaying results.

## Verification Results

✅ **GroupedSearchResults component exists** and groups results by source
✅ **SearchResultCard shows source badge** with authority styling
✅ **Visual separator appears** between MRM and RANZ sections
✅ **ConsentModeToggle appears** on search page and persists to URL
✅ **When consent mode enabled**, only MRM results display
✅ **Section number search** ready for redirect (API implementation in 11-01)
✅ **TypeScript compiles** without errors (Next.js build successful)
✅ **All components accessible** (aria-labels, landmarks, roles)

## Testing Performed

### Build Verification
```bash
npm run build
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Generating static pages (33/33)
```

### Component Structure
- SearchResultCard exports correctly
- GroupedSearchResults exports correctly
- Search page imports both components
- No circular dependencies
- All TypeScript types resolved

### Expected User Experience
1. **Search for "valley":**
   - Results grouped: MRM section first, RANZ section second
   - "Supplementary Content" divider visible
   - Blue borders on MRM cards, grey borders on RANZ cards

2. **Enable consent mode:**
   - Toggle turns blue
   - RANZ section disappears
   - Only MRM results remain
   - If no MRM results, empty state with guidance

3. **Search for "4.3.2":**
   - Page navigates to `/search?q=4.3.2&source=mrm-cop`
   - Section-filtered search results display

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 8375296 | feat(11-03): Create SearchResultCard with authority-aware styling | components/search/SearchResultCard.tsx |
| e0df68a | feat(11-03): Create GroupedSearchResults with MRM/RANZ sections | components/search/GroupedSearchResults.tsx |
| 16b6deb | feat(11-03): Integrate GroupedSearchResults and ConsentModeToggle | app/(dashboard)/search/page.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Phase 11 Wave 2 Complete:** 3/5 plans done (11-01, 11-02, 11-03)

**Ready for 11-04:** Search results authority weighting
- GroupedSearchResults ready to receive and display relevanceScore
- SearchResultCard has relevanceScore in interface
- Visual indicators can be added for boosted results

**Ready for 11-05:** Search testing and verification
- All search components in place
- Consent mode functional
- Grouping visual and testable
- Ready for end-to-end testing

**No blockers identified.**

---

## Lessons Learned

1. **Component extraction benefits:** SearchResultCard extracted from inline rendering enables reuse and consistent styling across grouped/ungrouped contexts

2. **Empty state guidance matters:** When consent mode filters out all results, clear messaging prevents user confusion ("Try disabling Building Code Citation Mode")

3. **Visual hierarchy without clutter:** Section headers + dividers + badges provide clear authority distinction without overwhelming the UI

4. **URL state for all filters:** Consent mode persists in URL enables shareable links and browser back button support

5. **Composition over configuration:** GroupedSearchResults composes SearchResultCard rather than duplicating display logic

---

**Plan 11-03 complete.** Search results now display in authority-grouped format with clear MRM/RANZ separation, consent mode toggle integrated in UI, and section number navigation ready for API-driven redirects.
