---
phase: 31-cross-linking-system
plan: 01
subsystem: encyclopedia
tags: [regex, cross-linking, reference-resolver, map, text-processing]

# Dependency graph
requires:
  - phase: 29-encyclopedia-foundation
    provides: "COP chapter JSON structure (public/cop/chapter-{N}.json) and types/cop.ts CopSection interface"
  - phase: 30-content-composition
    provides: "Article composition architecture and encyclopedia types"
provides:
  - "ReferenceMap: In-memory Map<sectionNumber, url> with O(1) lookup (~1,121 entries)"
  - "resolveReference(): Section number to encyclopedia URL resolver"
  - "crossLinkContent(): Text-to-CrossLinkSegment[] transformer with link budget and first-mention rule"
  - "CrossLinkSegment type for React rendering of linked/plain text"
affects: [31-02-cross-linking-system, 32-navigation-architecture, encyclopedia-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns: [singleton-map-pattern, regex-alternation-text-processing, segment-array-rendering]

key-files:
  created:
    - lib/encyclopedia/reference-resolver.ts
    - lib/encyclopedia/cross-link-engine.ts
  modified:
    - types/encyclopedia.ts

key-decisions:
  - "Singleton Map pattern for reference resolver — builds once from 19 chapter JSONs on first call, cached for subsequent requests"
  - "Combined regex with 5 alternation patterns for single-pass O(n) text processing"
  - "Case-insensitive matching via character classes ([Ss][Ee]{2}, [Aa]s) rather than /i flag to keep bare number pattern precise"
  - "CrossLinkSegment union type (text|link) for clean React rendering without dangerouslySetInnerHTML"

patterns-established:
  - "Reference resolver singleton: Server-side only module using fs.readFileSync with module-level cache"
  - "Cross-link segment array: Text processing returns typed segment array for safe React rendering"
  - "Link density control: Max 5 per paragraph + first-mention-only prevents blue text soup"

# Metrics
duration: 5min
completed: 2026-02-12
---

# Phase 31 Plan 01: Reference Resolver and Cross-Link Engine Summary

**ReferenceResolver with O(1) Map lookup from 1,121 COP sections and CrossLinkEngine with 5-pattern regex detection, link budget, and first-mention-only rule**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-12T03:21:51Z
- **Completed:** 2026-02-12T03:27:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Built in-memory Map from all 19 COP chapter JSONs with 1,121 entries for O(1) section-to-URL lookup
- Created CrossLinkEngine detecting 5 reference patterns: See/see/SEE, refer to [Section], As/as specified/described in, Section, bare X.Y.Z
- Enforced link density controls: max 5 links per paragraph with first-mention-only rule across paragraphs
- Added ReferenceMap and CrossLinkSegment types to encyclopedia type system

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ReferenceResolver with in-memory Map** - `0fc47c0` (feat)
2. **Task 2: Create CrossLinkEngine with regex detection** - `26f91ea` (feat)

## Files Created/Modified
- `lib/encyclopedia/reference-resolver.ts` - Server-side singleton Map builder from 19 chapter JSONs with resolveReference() for O(1) lookup
- `lib/encyclopedia/cross-link-engine.ts` - Text-to-segment transformer with 5-pattern combined regex, link budget (max 5/paragraph), first-mention-only rule
- `types/encyclopedia.ts` - Added ReferenceMap type alias and CrossLinkSegment discriminated union type

## Decisions Made
- Singleton Map pattern for reference resolver: builds once from 19 chapter JSONs (~56KB memory), cached at module level for all subsequent calls
- Combined regex with 5 alternation patterns in priority order for efficient single-pass matching
- Case-insensitive matching via character classes rather than /i flag to keep bare number pattern precise and avoid false positives
- CrossLinkSegment as discriminated union type (text|link) for type-safe React rendering without innerHTML
- Adjacent text segments merged for rendering efficiency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed case-insensitive matching for "As specified/described in" pattern**
- **Found during:** Task 2 (CrossLinkEngine)
- **Issue:** Original regex used lowercase `as` which missed "As specified in 5.1A" (capital A at sentence start)
- **Fix:** Changed `as\s+` to `[Aa]s\s+` in the regex pattern
- **Files modified:** lib/encyclopedia/cross-link-engine.ts
- **Verification:** Test confirmed "As specified in 5.1A" now matches correctly
- **Committed in:** 26f91ea (Task 2 commit)

**2. [Rule 1 - Bug] Fixed bare section number pattern to handle 2-level references**
- **Found during:** Task 2 (CrossLinkEngine)
- **Issue:** Original bare pattern required `\d+\.\d+(?:\.\d+)+` (3+ levels), missing "5.1A" style 2-level references
- **Fix:** Changed to `\d+\.\d+(?:\.\d+)*[A-Z]?` to match 2+ level section numbers
- **Files modified:** lib/encyclopedia/cross-link-engine.ts
- **Verification:** Test confirmed "5.1A" bare reference now matches
- **Committed in:** 26f91ea (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correct pattern matching. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Reference resolver and cross-link engine ready for integration into encyclopedia rendering pipeline
- Plan 31-02 can wire crossLinkContent into ArticleContent component for rendering cross-linked COP text
- All types exported from types/encyclopedia.ts for downstream consumption

---
*Phase: 31-cross-linking-system*
*Completed: 2026-02-12*
