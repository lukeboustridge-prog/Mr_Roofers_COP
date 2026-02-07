# Phase 14: Basic COP Reader - Plan Summary

**Phase goal:** Users can browse and read COP chapter content in the app with the same structure and section numbers as the printed PDF

**Plans:** 2 plans in 2 waves
**Estimated files:** 7 new files, 0 modified (excluding Plan 02's update to Plan 01's page)

## Wave Structure

| Wave | Plan | Objective | Tasks | Autonomous |
|------|------|-----------|-------|------------|
| 1 | 14-01 | COP route structure, chapter grid, types, loading skeletons | 2 | Yes |
| 2 | 14-02 | Recursive section renderer with inline images | 2 | Yes |

## Plan Details

### 14-01: COP Home Page and Chapter Route (Wave 1)
- **Creates:** TypeScript types for chapter JSON, /cop chapter grid page, /cop/[chapterNumber] reader shell, loading skeletons for both
- **Key deliverables:**
  - `types/cop.ts` -- CopChapter, CopSection, CopImage, CopChapterMeta interfaces
  - `app/(dashboard)/cop/page.tsx` -- 19-chapter card grid with version display
  - `app/(dashboard)/cop/[chapterNumber]/page.tsx` -- Chapter reader with basic content
  - Loading skeletons for both routes
- **Satisfies:** Success criteria 1 (chapter grid), 4 (version identifier)

### 14-02: Section Content Renderer with Inline Images (Wave 2)
- **Creates:** SectionRenderer and CopImage components, updates chapter reader page
- **Depends on:** 14-01 (needs types and page structure)
- **Key deliverables:**
  - `components/cop/SectionRenderer.tsx` -- Recursive section renderer with heading hierarchy
  - `components/cop/CopImage.tsx` -- Inline image component using Next.js Image with R2 URLs
  - Updated chapter reader page wiring in SectionRenderer
- **Satisfies:** Success criteria 2 (scrollable rich text with hierarchy), 3 (inline diagrams)

## Dependency Graph

```
14-01 (types + routes + grid)
  |
  v
14-02 (section renderer + images)
```

## Requirements Coverage

| Requirement | Plan | How |
|-------------|------|-----|
| COPR-05: Scrollable rich text with heading hierarchy, paragraphs, tables, figures | 14-02 | SectionRenderer with h2-h6 hierarchy, whitespace-pre-line, inline images |
| COPR-06: Version identifier displayed prominently | 14-01 | "v25.12 -- 1 December 2025" on /cop grid page header |

## Success Criteria Mapping

| Criterion | Plan |
|-----------|------|
| 1. /cop shows grid of 19 chapters | 14-01 |
| 2. Chapter content as scrollable rich text with heading hierarchy | 14-02 |
| 3. Technical diagrams inline within parent sections | 14-02 |
| 4. Version "v25.12 -- 1 December 2025" displayed prominently | 14-01 |

## Technical Notes

- All routes are Server Components (no 'use client')
- Chapter JSON loaded via fs.readFileSync (avoids client-side JSON parsing)
- Image URLs are full R2 URLs embedded in JSON (no getPublicUrl() needed)
- next.config.mjs already allows `**.r2.dev` for Next.js Image
- Routes protected by Clerk auth via existing (dashboard) layout
- No new npm packages required

---
*Created: 2026-02-08*
