---
phase: 14-basic-cop-reader
plan: 02
subsystem: cop-reader
tags: [cop, react, server-components, next-image, recursion, r2]

requires:
  - "14-01 (COP types, chapter reader route structure)"
  - "13-02 (chapter JSON files with images array and R2 URLs)"
  - "next/image with **.r2.dev in remotePatterns"

provides:
  - "CopImage component for rendering technical diagrams"
  - "SectionRenderer component for recursive section hierarchy"
  - "Automatic content deduplication (strips section number + title)"
  - "Inline image rendering with captions"
  - "Scroll-to-top navigation"

affects:
  - "15-* (section deep-linking will use section-${number} IDs)"
  - "Future COP search (section IDs enable fragment links)"

tech-stack:
  added: []
  patterns:
    - "Recursive React Server Components for nested data structures"
    - "Dynamic heading tag rendering (h2-h6) based on section level"
    - "Regex-based content deduplication with escaped special chars"
    - "Next.js Image responsive sizing with sizes attribute"

key-files:
  created:
    - components/cop/CopImage.tsx
    - components/cop/SectionRenderer.tsx
  modified:
    - app/(dashboard)/cop/[chapterNumber]/page.tsx

key-decisions:
  - decision: "Strip leading section number + title from content using regex"
    rationale: "COP JSON has duplicate section number/title at start of content field"
    alternatives: "Render as-is (shows duplicate), pre-process JSON during build"
    date: 2026-02-08
  - decision: "Skip heading for level-1 sections (page h1 already shows chapter title)"
    rationale: "Avoids duplicate h1+h2 with identical text"
    alternatives: "Always render heading, render as h2 with different styling"
    date: 2026-02-08
  - decision: "Use Record<'h2'|'h3'|'h4'|'h5'|'h6', string> for headingStyles"
    rationale: "TypeScript type safety for dynamic heading tag lookup"
    alternatives: "Inline className per level, switch statement"
    date: 2026-02-08

metrics:
  duration: "3min 25sec"
  completed: 2026-02-08
---

# Phase 14 Plan 02: Recursive Section Renderer Summary

> Recursive SectionRenderer and CopImage components enable hierarchical content rendering with inline technical diagrams from Cloudflare R2.

## One-Liner

Recursive Server Component rendering for nested COP sections (h2-h6 hierarchy) with Next.js Image integration for R2-hosted technical diagrams, automatic content deduplication, and scroll-to-top navigation.

## Performance

**Duration:** 3min 25sec
**Tasks:** 2/2 completed
**Commits:** 2 task commits + 1 metadata commit (pending)

**Timing Breakdown:**
- Task 1 (CopImage + SectionRenderer components): ~125 seconds
- Task 2 (Wire into chapter page): ~80 seconds

## Accomplishments

### Task 1: Create CopImage and SectionRenderer Components
**Commit:** b292ba8

Created two Server Components for enhanced chapter rendering:

**components/cop/CopImage.tsx:**
- Renders COP technical diagrams using Next.js Image component
- Props: `{ image: CopImageType, chapterNumber: number, sectionNumber: string }`
- Uses full R2 URL directly from JSON (no getPublicUrl() needed)
- Responsive sizing: `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 720px"`
- Quality 80, rounded border, figcaption for non-empty captions
- Alt text fallback: "COP Chapter {N} Section {X.Y.Z} diagram"

**components/cop/SectionRenderer.tsx:**
- Recursively renders CopSection and all subsections
- Dynamic heading hierarchy: level 1 → h2, level 2 → h3, ..., level 5+ → h6
- Heading styles by level (text-xl/lg/base/sm, bold/semibold, varying margins)
- Level-1 section heading skipped (page h1 already shows chapter title)
- Content deduplication: strips leading section number + title using regex with escaped special chars
- Renders inline images from `section.images[]` array
- Recursive subsection rendering
- Section IDs for future deep-linking: `id="section-${section.number}"`

**Key Implementation Details:**
- `headingStyles` typed as `Record<'h2'|'h3'|'h4'|'h5'|'h6', string>` for type safety
- `getHeadingClassName(level)` helper function for dynamic className lookup
- `stripLeadingNumberAndTitle()` escapes regex special chars (dots in section numbers, brackets in titles)
- HeadingTag typed as `'h2' | 'h3' | 'h4' | 'h5' | 'h6'` (not generic keyof JSX.IntrinsicElements)

### Task 2: Wire SectionRenderer into Chapter Reader Page
**Commit:** 617f3af

Updated chapter reader page to use recursive rendering:

**app/(dashboard)/cop/[chapterNumber]/page.tsx:**
- Added import: `import { SectionRenderer } from '@/components/cop/SectionRenderer'`
- Replaced basic `space-y-8` section iteration with `SectionRenderer` component map
- Each section renders recursively with `chapterData.chapterNumber` passed down
- Added visual separator `<hr className="border-slate-200 my-6" />` between header and content
- Added scroll-to-top anchor at bottom: `<a href="#">Back to top</a>` with slate-400 text

**Preserved from Plan 01:**
- Back link to /cop grid
- h1 with "Chapter {N}: {title}"
- Version badge and section count
- Container max-w-4xl
- fs.readFileSync JSON loading
- notFound() validation
- Server Component architecture

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | CopImage and SectionRenderer components | b292ba8 | components/cop/CopImage.tsx, components/cop/SectionRenderer.tsx |
| 2 | Integrate SectionRenderer into chapter page | 617f3af | app/(dashboard)/cop/[chapterNumber]/page.tsx |

## Files Created

**React Server Components:**
- `components/cop/CopImage.tsx` (28 lines) - Next.js Image wrapper for COP diagrams
- `components/cop/SectionRenderer.tsx` (84 lines) - Recursive section renderer

**Total:** 2 files created, 112 lines of code

## Files Modified

**Chapter Reader Route:**
- `app/(dashboard)/cop/[chapterNumber]/page.tsx` - Replaced basic rendering with SectionRenderer, added hr separator and scroll-to-top link

## Decisions Made

### 1. Content Deduplication via Regex Stripping
**Context:** COP JSON content field often starts with duplicate section number and title (e.g., "1.1 \nDisclaimer and Copyright \nAlthough the information...")

**Decision:** Strip leading section number + title from content before rendering using regex with escaped special characters.

**Implementation:**
```typescript
const escapedNumber = sectionNumber.replace(/\./g, '\\.');
const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(`^${escapedNumber}\\s*\\n${escapedTitle}\\s*\\n`, 'i');
const stripped = content.replace(regex, '').trim();
```

**Rationale:**
- Eliminates duplicate text (section heading + content both show "1.1 Disclaimer and Copyright")
- Preserves unique content after title line
- Handles special chars in section numbers (dots) and titles (parentheses, brackets)
- Fallback to original content if stripping fails or produces empty string

**Alternative considered:** Pre-process JSON during build (Phase 13-02) - would require re-extraction of all chapters

**Impact:** Clean content rendering without visual duplication

### 2. Skip Heading for Level-1 Sections
**Context:** Level-1 sections are chapter root nodes (e.g., "1 Introduction") - page h1 already shows "Chapter 1: Introduction"

**Decision:** `if (section.level === 1)` → skip heading, render only content, images, and subsections

**Rationale:**
- Avoids duplicate h1+h2 with identical text
- Page h1 serves as chapter title
- Level-1 content is often just chapter preamble (rendered directly)
- Subsections (level 2+) render as h3+

**Alternative considered:** Always render heading with different styling - still creates visual duplication

**Impact:** Clean chapter structure without redundant headings

### 3. TypeScript Type Safety for Dynamic Heading Tags
**Context:** HeadingTag must be rendered dynamically based on section level (h2-h6)

**Decision:** Type HeadingTag as `'h2' | 'h3' | 'h4' | 'h5' | 'h6'` union type, not generic `keyof JSX.IntrinsicElements`

**Rationale:**
- Prevents TypeScript error: "Property 'map' is missing" (conflict with other JSX elements like <Image>)
- Ensures headingStyles lookup is type-safe
- Restricts to valid heading levels only (no h1, h7+)

**Implementation:**
```typescript
const headingStyles: Record<'h2' | 'h3' | 'h4' | 'h5' | 'h6', string> = { ... };
const HeadingTag = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
```

**Alternative considered:** Inline className switch statement - more verbose, duplicates logic

**Impact:** Clean TypeScript compilation, no type errors

## Deviations from Plan

None - plan executed exactly as written. No bugs encountered, no missing critical functionality, no blocking issues.

**TypeScript compilation:** One pre-existing error in `lib/db/link-cop-section-details.ts` (Set iteration issue) - NOT related to this plan's changes.

## Next Phase Readiness

### Blockers
None

### Concerns
None - recursive rendering works correctly for nested section hierarchies

### Prerequisites for Phase 15 (COP Section Deep-Linking)
- ✅ Section IDs exist: `id="section-${section.number}"` on every section element
- ✅ Heading hierarchy established (h2-h6 based on level)
- ✅ Scroll-to-top anchor demonstrates fragment link pattern

### Tech Debt
None - code follows React Server Component patterns, proper TypeScript typing, no TODOs

### Verified Functionality
- ✅ TypeScript compilation passes (no errors in CopImage or SectionRenderer)
- ✅ Recursive rendering for nested subsections
- ✅ Dynamic heading tags based on section level
- ✅ Content deduplication via regex stripping
- ✅ Next.js Image integration for R2-hosted diagrams
- ✅ Scroll-to-top navigation anchor

---

**Plan Status:** ✅ Complete
**Next Plan:** Phase 14 complete (2/2 plans done) → Phase 15 (COP Section Deep-Linking)
**Phase Status:** 2/2 plans complete (Basic COP Reader) → Phase 14 COMPLETE
