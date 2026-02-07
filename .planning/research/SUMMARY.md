# Project Research Summary

**Project:** Master Roofers COP v1.2 -- Digital COP Reader
**Domain:** Hierarchical technical document reader with inline supplementary content
**Researched:** 2026-02-08
**Confidence:** HIGH

## Executive Summary

The v1.2 milestone transforms the Master Roofers app from a detail-centric navigation tool (Planner mode: substrate > category > detail) into a document-mirroring COP Reader that matches the 19-chapter, 624-page MRM Code of Practice PDF structure that every NZ roofer already knows. The content is already extracted (3.8MB `sections_hierarchy.json` with 1,103 sections, 775 images mapped to sections). This is fundamentally a **UI/routing/data architecture problem, not a content extraction problem**. Only 4 new npm packages are needed (3 Radix primitives for shadcn/ui components + `unpdf` for HTG PDF extraction at build time). The existing stack (Next.js 14, Drizzle, Zustand, Cloudflare R2, shadcn/ui) handles everything else.

The recommended approach is a **hybrid data model**: import the COP hierarchy structure into PostgreSQL (new `cop_sections` table for navigation, search, and cross-referencing) while serving the actual section text content from pre-split, per-chapter static JSON files in `/public/cop/`. This avoids loading the 3.8MB monolith on mobile while enabling relational queries for linking sections to details, images, HTG guides, and case law. The COP Reader is **additive, not replacing** -- all existing routes (`/planner/*`, `/fixer/*`, `/search/*`) remain functional. The new `/cop/[sectionNumber]` route uses dot-notation (e.g., `/cop/8.5.4`) that mirrors how roofers already cite sections.

The top risks are: (1) **mobile performance** -- the 3.8MB JSON and 775 images will destroy mobile load times if not split per chapter and lazy-loaded; (2) **service worker cache invalidation** -- the existing SW hardcodes routes and uses `CACHE_VERSION = 'v1'`, which will serve stale navigation to returning users; (3) **deep-link scroll failures** -- Next.js App Router swallows hash-based scrolling and lazy-loaded sections may not exist in the DOM when scroll fires. All three are well-understood problems with proven mitigations documented in PITFALLS.md.

## Key Findings

### Recommended Stack

The existing stack requires minimal additions. The project already uses 12 Radix UI primitives; the three new ones follow the identical pattern. See [STACK.md](STACK.md) for full rationale.

**New runtime packages (3):**
- `@radix-ui/react-accordion` -- Chapter TOC with expandable sections (shadcn/ui wrapper)
- `@radix-ui/react-collapsible` -- Inline supplementary panels that toggle independently within content flow
- `@radix-ui/react-scroll-area` -- Scrollable TOC sidebar with consistent cross-browser scrollbar styling

**New dev dependency (1):**
- `unpdf` -- HTG PDF text + image extraction (build-time scripts only, zero runtime impact)

**What NOT to add:** react-markdown (content is plain text, not Markdown), react-intersection-observer (custom 35-line hook is sufficient), tocbot (TOC is data-driven from JSON, not parsed from DOM), framer-motion (Tailwind + tailwindcss-animate handles all expand/collapse animations), any CMS renderer (content is local JSON with known schema).

### Expected Features

See [FEATURES.md](FEATURES.md) for detailed feature specifications with UX research sources.

**Must have (table stakes) -- users will consider the app inferior to the PDF without these:**
- TS-1: Chapter-level navigation (19-chapter TOC)
- TS-2: Section number preservation (exact PDF numbering, the industry's shared reference language)
- TS-3: Section deep-linking (shareable URLs like `/cop/8.5.4`)
- TS-4: Inline technical diagrams (775 images rendered within their parent sections)
- TS-5: Chapter content rendering (scrollable prose within each chapter)
- TS-6: Breadcrumb navigation (orientation in 4-level hierarchy)
- TS-7: Collapsible TOC sidebar/drawer (universal pattern for hierarchical document navigation)
- TS-9: Version identification (COP v25.12 displayed prominently)

**Should have (differentiators) -- what makes this genuinely better than the PDF:**
- D-1: Inline supplementary content panels (the signature feature: 3D models, HTG guides, case law appear inline)
- D-2: Scrollspy section tracking (TOC highlights current section during scroll)
- D-3: Reading position persistence (resume where you left off)
- D-4: HTG installation guide integration (extracted from 3 PDFs, mapped to COP sections)
- D-8: Section bookmarking (extending existing favourites system)

**Defer to post-v1.2:**
- TS-8: Cross-reference navigation (high complexity regex/NLP for parsing "See X.X.X" patterns)
- D-5: Chapter-level search (extend existing search after content is in DB)
- D-6: Print-friendly section export (important for BCAs but not launch-critical)
- D-7: Interactive table enhancement (basic responsive tables at launch; filtering later)

**Anti-features (do NOT build):**
- Page-by-page pagination (breaks scanning workflow; continuous scroll within chapters)
- Content reorganization or renumbering (section numbers are the industry's shared language)
- Inline video players (out of scope per PROJECT.md; 3D models provide the visual aid)
- AI-generated summaries (risks changing normative meaning; show verbatim COP text)
- Supplementary panels expanded by default (progressive disclosure: collapsed by default)

### Architecture Approach

Hybrid data model with 5 new tables (zero changes to existing 15 tables). Structure metadata in PostgreSQL for relational queries; full text in CDN-cached per-chapter JSON files for fast delivery. Single dynamic route `/cop/[sectionNumber]` handles all depths via dot-notation. COP Reader lives within existing `(dashboard)` layout group, inheriting auth, sidebar, and accessibility infrastructure. See [ARCHITECTURE.md](ARCHITECTURE.md) for complete data model and rendering strategy.

**Major components:**
1. **Data layer** -- 5 new Drizzle tables (`cop_sections`, `cop_section_images`, `cop_section_details`, `htg_content`, `cop_section_htg`) with import scripts
2. **Content delivery** -- 19 static JSON files in `/public/cop/` split from `sections_hierarchy.json`, CDN-cached and service-worker-cacheable
3. **COP Reader route** -- `/cop/[sectionNumber]` Server Component that queries DB for metadata, fetches static JSON for content, and renders with inline images and supplementary panels
4. **Chapter navigation** -- Desktop: contextual chapter-section tree sidebar alongside existing main sidebar. Mobile: slide-out drawer triggered by floating button
5. **Supplementary panels** -- Client Component accordion with 4 panel types (3D model, HTG guide, case law, related details) reusing existing components (Model3DViewer, CautionaryTag)

### Critical Pitfalls

See [PITFALLS.md](PITFALLS.md) for 13 pitfalls with detailed prevention strategies and compounding risk matrix.

1. **3.8MB JSON destroys mobile performance (P1, CRITICAL)** -- Split per chapter at build time; lazy-load sections below fold; use `content-visibility: auto` for large chapters; Server Components for static text; never pass full JSON through page props. Detection test: Chapter 4 (475KB, 143 sections) on throttled 4G must hit TTI < 3s.

2. **Service worker cache breaks on route change (P2, CRITICAL)** -- Bump `CACHE_VERSION` to `v2`; update `STATIC_ASSETS` array; use route-pattern caching for `/cop/*`; maintain `/planner` as redirect during transition; show "App updated" toast on SW activation. Must be addressed in same phase as route changes.

3. **Existing detail page URLs break (P3, CRITICAL)** -- COP Reader is additive, NOT replacing Planner routes. Keep `/planner/[substrate]/[category]/[detailId]` alive. Both addressing schemes work simultaneously. Add Next.js rewrites for any moved routes.

4. **Deep-linking fails with client-side navigation (P4, CRITICAL)** -- Use path-based section addressing (`/cop/8.5.4`) not hash fragments; implement manual `scrollIntoView` with `requestAnimationFrame`; prefix section IDs (`section-8-5-4`) to avoid CSS selector dot issues; pre-render target section before lazy-loading others; add `scroll-padding-top` matching sticky header height.

5. **Sidebar becomes unusable with 1,103 sections (P5, MODERATE)** -- Progressive disclosure: show only chapters (19 items) at top level; separate chapter TOC from main nav; limit mobile navigation to chapter cards then section list; virtualize for chapters with 100+ sections.

## Implications for Roadmap

Based on combined research, the build decomposes into 6 phases ordered by strict data and component dependencies.

### Phase 1: Data Foundation
**Rationale:** Everything depends on this data existing. The DB schema, import scripts, and chapter JSON split must be done first. No UI work can begin without queryable sections and content files.
**Delivers:** 5 new Drizzle tables populated with COP hierarchy (800-1200 sections), 775 section-image mappings, and 19 per-chapter JSON files in `/public/cop/`.
**Addresses:** Data model from ARCHITECTURE.md sections 1-2; prerequisite for all features
**Avoids:** P1 (splits JSON per chapter), P11 (establishes section-to-detail mapping)
**Scripts:** `import-cop-sections.ts`, `split-cop-chapters.ts`, `import-cop-images.ts`, `link-cop-section-details.ts`

### Phase 2: Basic Reader
**Rationale:** Core reading experience before navigation chrome. Validates the rendering strategy with real data. If this phase feels inferior to the PDF, the approach needs revision.
**Delivers:** `/cop` home page (19-chapter card grid), `/cop/[sectionNumber]` Server Component rendering chapter text with inline images, breadcrumbs, subsection navigation.
**Addresses:** TS-5 (content rendering), TS-2 (section numbers), TS-4 (inline diagrams), TS-9 (version identification), TS-6 (breadcrumbs)
**Avoids:** P1 (Server Components, lazy-load images, per-chapter JSON), P4 (path-based section addressing with safe IDs), P13 (different rendering for Ch 2 Glossary and Ch 19 Revision History)
**Components:** `ChapterGrid`, `SectionContent`, `InlineImage`, `SectionBreadcrumb`, `SubsectionList`, `SectionAnchor`

### Phase 3: Navigation Chrome
**Rationale:** Navigation wraps a working reader. Cannot design the sidebar without knowing what pages exist.
**Delivers:** Desktop chapter-section tree sidebar, mobile chapter drawer, updated main sidebar (COP Reader promoted to primary position, Planner demoted to secondary), updated mobile bottom nav.
**Addresses:** TS-1 (chapter navigation), TS-7 (collapsible TOC sidebar), TS-3 (deep-linking), D-2 (scrollspy)
**Avoids:** P5 (progressive disclosure, separate chapter TOC from main nav), P6 (Zustand mode migration), P2 (service worker cache version bump and route updates)
**Components:** `SectionSidebar`, `ChapterDrawer`, `cop/layout.tsx`; modifications to `Sidebar.tsx`, `MobileNav.tsx`
**Hooks:** `useScrollSpy`, `useSectionDeepLink`

### Phase 4: Supplementary Panels
**Rationale:** The signature differentiator. Requires section-detail linking data (Phase 1) and working reader (Phase 2) to display panels within.
**Delivers:** Collapsible inline panels within section content showing 3D models (reusing `Model3DViewer`), related details, and case law badges. Visual authority distinction maintained: grey border for supplementary, blue for authoritative MRM.
**Addresses:** D-1 (inline supplementary panels), D-8 (section bookmarking via extended favourites)
**Avoids:** P7 (CLS on panel expand -- reserve space, scroll compensation, lazy-mount content), P12 (panel state in sessionStorage)
**Components:** `SupplementaryPanels` (client component with accordion)

### Phase 5: HTG Content Pipeline
**Rationale:** Independent extraction work that should not block Phases 1-4. HTG PDFs (Flashings 3MB, Penetrations 352MB, Cladding 100MB) are press-quality artwork files requiring page-by-page processing.
**Delivers:** Extracted HTG guide content in `htg_content` + `cop_section_htg` tables, HTG images uploaded to R2, HTG panels added to supplementary accordion.
**Addresses:** D-4 (HTG installation guide integration)
**Avoids:** P8 (budget 2-4 hours manual review per PDF, multi-pass extraction, simple flat structure, confidence flags)
**Tools:** `unpdf` + `sharp` (build-time scripts), `extract-htg-content.ts`, `upload-htg-to-r2.ts`

### Phase 6: Search Integration and Polish
**Rationale:** Everything is built; this phase connects and polishes.
**Delivers:** Updated search redirects (`getSectionNavigationUrl` returns `/cop/{number}`), COP section titles in search results, updated home page featuring COP Reader, section deep-link sharing, offline/PWA verification (chapter JSON files in SW precache), reading position persistence, cross-browser and mobile performance validation.
**Addresses:** D-3 (reading position persistence), search context awareness
**Avoids:** P9 (context-aware search results), P2 (full SW verification), P10 (scroll position restoration)

### Phase Ordering Rationale

- **Data before UI:** All rendering depends on populated tables and split JSON files. Phase 1 is non-negotiable as first.
- **Reader before navigation:** The sidebar and drawer wrap pages that must exist first. Building navigation for pages that do not render yet leads to constant rework.
- **Supplementary after reader:** Panels are embedded within section content. The content renderer must be stable before panels are inserted.
- **HTG decoupled:** PDF extraction is slow, manual, and has uncertain output quality. Keeping it as a separate phase prevents it from blocking the core reader experience.
- **Search last:** Search integration touches multiple existing systems. Doing it after all routes are finalized prevents double-work.
- **Service worker update in Phase 3:** This is when routes actually change in the navigation. Bumping the cache version here ensures returning users get the new navigation immediately.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Basic Reader):** Content rendering from plain text needs careful design. Cross-reference parsing ("See 8.5.4" patterns), table detection, and boilerplate stripping from raw text are non-trivial. Consider deferring cross-ref linking to post-v1.2.
- **Phase 5 (HTG Content):** HTG PDF extraction quality is completely unknown until the PDFs are opened and tested. The 352MB Penetrations PDF may be primarily images with minimal extractable text. **Manually review all 3 HTG PDFs before writing any extraction code.**

Phases with standard patterns (skip research-phase):
- **Phase 1 (Data Foundation):** Drizzle migrations, JSON parsing, and import scripts are well-established patterns in this codebase.
- **Phase 3 (Navigation Chrome):** Collapsible sidebar with scrollspy is a universal documentation pattern. Radix accordion and IntersectionObserver are well-documented.
- **Phase 4 (Supplementary Panels):** Reuses existing components (Model3DViewer, CautionaryTag). Collapsible accordion is standard Radix pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Only 4 new packages, all verified on npm with current versions. 3 are Radix primitives following existing project patterns. |
| Features | HIGH | Feature landscape based on universal UX patterns (NN/g, ICC Digital Codes, Docusaurus, EPUB). Table stakes are unambiguous. |
| Architecture | HIGH | Based on direct codebase inspection of all relevant files. Hybrid data model is well-reasoned with clear tradeoffs. |
| Pitfalls | HIGH (perf/routing), MEDIUM (HTG extraction) | Performance and routing pitfalls verified against codebase and known Next.js issues. HTG extraction confidence is lower because the PDFs have not been directly examined. |

**Overall confidence:** HIGH

### Gaps to Address

- **HTG PDF content quality:** The 3 HTG PDFs (especially 352MB Penetrations) have not been opened or tested for text extraction. This could range from "clean extraction" to "mostly images, minimal text." Manually review before committing to an automated pipeline. Consider manual extraction for just 3 documents.
- **Cross-reference parsing accuracy:** The COP text contains internal references ("see 8.5.4", "refer to section 16.9") in varied formats. Regex parsing will have edge cases. Defer clickable cross-references to post-v1.2 if parsing proves unreliable.
- **Chapter content structure edge cases:** Some sections may contain embedded tables, formulas, or multi-column layouts from the PDF extraction that do not render cleanly as plain text. Need visual QA against the source PDF for all 19 chapters.
- **Deep-link scroll reliability:** Next.js App Router hash/scroll behaviour has known issues (#51721, #49612, #49427). The path-based approach (`/cop/8.5.4`) with manual `scrollIntoView` is the recommended mitigation, but needs testing across browsers.
- **Section image placement:** Images have section numbers with letter suffixes ("8.5.4A", "8.5.4B"). The rendering logic for placing these within section content needs design -- the letter suffix likely indicates figure ordering within a section.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `sections_hierarchy.json`, `images_manifest.json`, `r2_image_urls.json`, `public/sw.js`, `stores/app-store.ts`, `lib/search-helpers.ts`, schema files, route structure
- npm package registries for version verification (@radix-ui/react-accordion, unpdf, sharp)
- Next.js official documentation (large page data warning, Link component, App Router)

### Secondary (MEDIUM confidence)
- [NN/g research](https://www.nngroup.com/articles/table-of-contents/) on TOC, breadcrumbs, and progressive disclosure
- [ICC Digital Codes](https://codes.iccsafe.org/) as aspirational reference for digital building code readers
- [CSS-Tricks IntersectionObserver TOC](https://css-tricks.com/table-of-contents-with-intersectionobserver/) pattern
- [CompDF PDF extraction analysis](https://www.compdf.com/blog/what-is-so-hard-about-pdf-text-extraction)
- Next.js GitHub issues #51721 (hash scroll), #49612 (scroll-padding), #49427 (scroll restoration)

### Tertiary (LOW confidence)
- HTG PDF extraction estimates (PDFs not directly examined; extrapolated from MRM COP extraction experience)
- Cross-reference parsing complexity (inferred from raw text inspection; no systematic analysis of all reference patterns)

---
*Research completed: 2026-02-08*
*Ready for roadmap: yes*
