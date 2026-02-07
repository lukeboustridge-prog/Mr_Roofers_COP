# Domain Pitfalls: v1.2 Digital COP Reader

**Domain:** Restructuring navigation and adding document reader features to a 54k-line Next.js app
**Researched:** 2026-02-08
**Milestone:** v1.2 Digital COP -- navigation restructure, chapter reader, inline panels, HTG extraction
**Critical Risk Level:** HIGH -- 3.8MB JSON, 1,103 sections, 775 images, existing PWA/search/offline must not break

---

## Critical Pitfalls

Mistakes that cause performance collapse, regressions in shipped features, or architectural rewrites.

### Pitfall 1: Rendering 3.8MB of JSON Destroys Mobile Performance

**What goes wrong:** Loading `sections_hierarchy.json` as a single import or fetching it whole to render a chapter page causes 2-5 second parse time, 4,000+ DOM nodes, and main-thread blocking that freezes the UI on mobile devices.

**Why it happens:**
- The file is 3.8MB with 1,103 sections across 19 chapters. Chapter 19 alone is 618KB, Chapter 4 is 475KB, Chapter 15 is 393KB
- Natural instinct is to `import` the JSON or load it in `getServerSideProps` and pass the full chapter to the client
- Next.js warns at >= 128KB of page data because it must be serialized and parsed by the client before hydration
- Even server-rendered HTML from 143 sections (Chapter 4) produces a massive DOM that causes layout thrashing during hydration
- Technical diagrams (775 images) add to the problem -- rendering even 20 `<img>` tags in initial viewport causes network contention on 4G connections typical on NZ construction sites

**Consequences:**
- Page loads take 3-8 seconds on mobile (target audience uses phones on job sites)
- Total Blocking Time regresses from current 90ms to 700ms+ (undoing all Phase 6 performance work)
- Users on slow connections see white screen or partial content
- Service worker cache bloated with multi-MB page data
- Lighthouse performance score drops below 50

**Warning signs:**
- Next.js console warning: "Large page data warning" during development
- Chapters with 100+ sections (Ch 3, 4, 5, 8, 14, 15, 19) render noticeably slower than short chapters
- Mobile Chrome DevTools shows > 2000ms Total Blocking Time
- Users report scrolling jank within chapter content

**Prevention:**
1. **Split JSON per chapter at build time** -- Pre-process `sections_hierarchy.json` into 19 individual chapter files during build. Chapter 1 (55KB) loads instantly; Chapter 19 (618KB) loads separately only when navigated to
2. **Lazy-load sections below the fold** -- Render only the first 3-5 top-level sections of a chapter on initial load. Use `IntersectionObserver` to load remaining sections as user scrolls into view
3. **Virtualize section content for large chapters** -- For chapters with 100+ sections (Ch 3, 4, 5, 8, 14, 15, 19), use CSS `content-visibility: auto` on section blocks to let the browser skip layout/paint for off-screen sections
4. **Lazy-load images** -- All 775 MRM technical diagrams use `loading="lazy"` and are served via Next.js `<Image>` with R2 remote patterns (already configured in `next.config.mjs`). Only images in the current viewport section should be in the initial HTML
5. **Server Component for chapter content** -- Render chapter text as a Server Component (no client-side hydration needed for static text). Only interactive elements (collapsible panels, deep-link scroll) need `'use client'`
6. **Never pass full JSON through page props** -- Use API routes or server-side data fetching that returns only the requested chapter/section, never the full 3.8MB blob

**Phase to address:** First implementation phase (data layer and chapter rendering)

**Detection test:** Load Chapter 4 (475KB, 143 sections) on throttled 4G in Chrome DevTools. If Time to Interactive exceeds 3 seconds, the rendering strategy needs revision.

**Confidence:** HIGH -- verified file sizes via codebase inspection; Next.js large page data warning threshold (128KB) confirmed via [Next.js documentation](https://nextjs.org/docs/messages/large-page-data)

---

### Pitfall 2: Service Worker Cache Breaks When Routes Change

**What goes wrong:** The existing service worker (`public/sw.js`) hardcodes routes in `STATIC_ASSETS` array. Adding new COP Reader routes (e.g., `/cop/8`, `/cop/8/5/4`) without updating the service worker causes: (a) new pages fail to load offline, and (b) existing cached routes serve stale navigation that doesn't include the new COP Reader links.

**Why it happens:**
- `STATIC_ASSETS` in `sw.js` currently caches: `'/'`, `'/planner'`, `'/fixer'`, `'/search'`, `'/favourites'`, `'/checklists'`, `'/settings'`
- Planner mode is being replaced/restructured as COP Reader -- if `/planner` routes change to `/cop` routes, the old cached `/planner` pages will 404 or show outdated navigation
- Service worker uses `stale-while-revalidate` which means users may see old navigation for hours before the revalidate fires
- The mode toggle in `MobileNav.tsx` and `Sidebar.tsx` hardcodes `'/planner'` and `'/fixer'` links -- cached versions will point to non-existent routes
- `CACHE_VERSION` is `'v1'` -- if not bumped, old caches are never invalidated

**Consequences:**
- Offline users (primary on-site use case) cannot access new COP Reader pages
- Previously cached pages show old navigation with dead links
- Users on poor connections get stuck on stale cached pages
- No way for users to force-refresh without clearing browser data
- PWA feels "broken" -- critical for tradespeople who rely on offline access

**Warning signs:**
- After deploying v1.2, test device that previously used v1.1 shows old navigation
- Clicking "COP Reader" in navigation shows 404 or offline fallback
- Service worker update event fires but old static cache persists
- Users report "app looks different on my phone vs desktop"

**Prevention:**
1. **Bump `CACHE_VERSION`** to `'v2'` when deploying v1.2 -- this triggers the activate event to purge all old caches
2. **Update `STATIC_ASSETS` array** to include all new routes (e.g., `/cop`, chapter landing pages)
3. **Use route-pattern caching** instead of hardcoded paths -- cache `/cop/*` routes dynamically via `runtimeCaching` rather than listing each chapter
4. **Maintain route aliases** during transition period -- keep `/planner` as a redirect to `/cop` so cached links still work
5. **Add SW update notification** -- when new service worker activates, show toast: "App updated -- tap to reload" (the app already has `swUpdateAvailable` state in `app-store.ts`)
6. **Test offline after every navigation change** -- add to QA checklist: "Enable airplane mode, navigate to every primary route, verify content loads"

**Phase to address:** Must be addressed in the SAME phase that changes route structure, not deferred

**Confidence:** HIGH -- verified by reading `public/sw.js` lines 1-19 showing hardcoded `STATIC_ASSETS` and `CACHE_VERSION = 'v1'`

---

### Pitfall 3: Breaking Existing Detail Page URLs

**What goes wrong:** Restructuring navigation from category-based (`/planner/[substrate]/[category]/[detailId]`) to chapter-based (`/cop/[chapter]/[section]`) creates dead links for: (a) user bookmarks, (b) shared URLs, (c) search engine indexed pages, (d) existing search redirect functionality, and (e) QA checklist links stored in the database.

**Why it happens:**
- Current URLs follow pattern: `/planner/long-run-metal/ridges/detail-xyz`
- New COP Reader uses chapter-based: `/cop/8/5/4` (chapter 8, section 5.4)
- These are fundamentally different addressing schemes -- details are addressed by substrate/category; COP sections by chapter/section number
- Search API (`/api/search`) returns redirect URLs using old pattern (line 96-98 in search page)
- Exact match navigation uses old URL structure (line 309 in search page): `/planner/${exactMatch.substrateId}/${exactMatch.categoryId}/${exactMatch.id}`
- QA checklists reference detail IDs that link to old URL pattern
- Users have bookmarked and shared detail pages using current URL structure

**Consequences:**
- All existing bookmarks and shared links break
- Search functionality redirects to non-existent pages
- QA checklists with detail links become unusable
- Favourites page links to dead URLs
- Any external references to the app (training materials, emails) break

**Warning signs:**
- After deploying, 404 errors spike in monitoring
- Users report "my saved links don't work anymore"
- Search "jump to detail" feature redirects to 404
- QA checklist "view detail" buttons lead nowhere

**Prevention:**
1. **Keep existing detail routes alive** -- The detail page route (`/planner/[substrate]/[category]/[detailId]`) must continue to work. Do NOT delete these pages
2. **COP Reader is additive, not replacing** -- Add `/cop` routes alongside existing routes. Both addressing schemes work simultaneously
3. **Add redirects for any moved routes** -- If `/planner` is renamed, add Next.js rewrites in `next.config.mjs` to redirect old paths
4. **Update search redirect logic** -- Search API must return correct URLs for both navigation modes. When in COP Reader, link to section; when in Planner mode, link to detail
5. **Dual-address scheme** -- Each detail can be reached via either `/planner/[substrate]/[category]/[detailId]` OR `/cop/[chapter]/[section]`. Internal cross-reference links use whichever context the user is currently in
6. **Regression test** -- Create a test fixture of 20 existing URLs; verify they all still resolve after every phase

**Phase to address:** Architecture and routing phase (first phase)

**Confidence:** HIGH -- verified existing URL patterns by reading app directory structure and search page source code

---

### Pitfall 4: Deep-Linking to Sections Fails With Client-Side Navigation

**What goes wrong:** URLs like `/cop/8#8.5.4` are intended to scroll to section 8.5.4 within chapter 8. But Next.js App Router's client-side navigation swallows hash-based scrolling, and even when it works, sections below the fold haven't been rendered yet (due to lazy loading from Pitfall 1 mitigation), so there's nothing to scroll to.

**Why it happens:**
- Next.js `<Link>` component prevents the browser's default hash-scroll behavior during client-side navigation
- Known Next.js issue: [App Router does not respect smooth scroll with hash links](https://github.com/vercel/next.js/issues/51721)
- If lazy-loading sections (to solve Pitfall 1), the target section's DOM element may not exist when the scroll is attempted
- Section numbers like "8.5.4" contain dots, which are not valid CSS ID selectors without escaping -- `document.getElementById('8.5.4')` works but `document.querySelector('#8.5.4')` fails
- Hash fragments are not sent to the server, so server-side rendering cannot pre-expand the target section

**Consequences:**
- Deep links are a core feature requirement ("navigate directly to any COP section reference")
- Users sharing section references get wrong scroll position
- Search results linking to specific sections don't scroll correctly
- Cross-references within the COP document ("see 8.5.4") don't work
- Undermines the "digital upgrade of what they know" value proposition

**Warning signs:**
- Clicking internal cross-references doesn't scroll to target section
- URL hash updates but page doesn't move
- Scrolling lands above or below the target section (off by sticky header height)
- Deep links work on full page refresh but not on client-side navigation

**Prevention:**
1. **Use path-based section addressing, not hash fragments** -- `/cop/8/5/4` (path segments) instead of `/cop/8#8.5.4` (hash fragment). Path-based routing gives server control over which section to prioritize during render
2. **If using hash fragments, implement manual scroll** -- After client-side navigation completes, use `document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })` with a small delay to account for layout
3. **Account for sticky header offset** -- Add `scroll-padding-top` CSS property matching header height (currently `<Header />` component) so anchored sections don't hide behind the fixed header
4. **Pre-render target section immediately** -- When a deep link targets section 8.5.4, render that section in initial HTML even if other sections are lazy-loaded. The scroll target must exist in the DOM before `scrollIntoView` fires
5. **Use safe IDs** -- Prefix section IDs: `id="section-8-5-4"` instead of `id="8.5.4"` to avoid CSS selector issues
6. **Test with `useEffect` timing** -- Deep-link scroll must fire after hydration AND after lazy content loads. Use `requestAnimationFrame` or `MutationObserver` to wait for target element

**Phase to address:** Chapter rendering phase (must be designed in, not bolted on)

**Confidence:** HIGH -- known Next.js issue ([#51721](https://github.com/vercel/next.js/issues/51721), [#49612](https://github.com/vercel/next.js/issues/49612)); CSS selector dot issue is a documented browser behaviour

---

## Moderate Pitfalls

Mistakes that cause UX degradation, technical debt, or significant rework.

### Pitfall 5: Sidebar Navigation Becomes Unusable With 1,103 Sections

**What goes wrong:** Replacing the current clean sidebar (7 main nav items + 6 substrate accordion items) with a chapter-based tree of 19 chapters and 1,103 sections creates a navigation element that is impossible to scan and unusably slow to render.

**Why it happens:**
- The MRM COP has 19 chapters, each with 6-143 subsections, nested up to 3 levels deep
- Chapter 4 alone has 143 sections; rendering all section titles in a sidebar tree would produce ~1,100 DOM nodes just for navigation
- Developer instinct is to build a full tree-view that mirrors the document structure
- On mobile (375px width), even chapter-level navigation takes significant screen real estate

**Consequences:**
- Sidebar takes 500ms+ to render on mobile
- Users cannot find their target section visually
- Navigation itself becomes the bottleneck, not the content
- Mobile hamburger menu becomes a scrolling nightmare
- Accessibility issues: screen readers announce 1,100+ navigation links

**Warning signs:**
- Sidebar scroll position becomes difficult to manage
- Users use search instead of navigation (bypassing the feature entirely)
- Navigation render time visible in Chrome DevTools Performance tab
- Mobile menu sheet scrolls longer than the content area

**Prevention:**
1. **Progressive disclosure** -- Show only chapters (19 items) at top level. Clicking a chapter shows its top-level sections (max ~15). Clicking a section shows subsections. Never render more than ~40 nav items simultaneously
2. **Keep current sidebar structure** -- Don't replace the existing sidebar. Add COP Reader as ONE sidebar item that opens a chapter-browsing view. Keep Fixer, Search, Favourites, etc. as peer items
3. **Separate chapter TOC from main nav** -- When inside a COP Reader chapter page, show a table-of-contents panel specific to that chapter (inline on the page or as a right-rail on desktop), not jammed into the global sidebar
4. **Limit mobile navigation depth** -- On mobile, show chapters as cards/list, then sections within a chapter page. Never attempt a tree-view on mobile
5. **Virtualize long section lists** -- For chapters with 100+ sections (there are 7 of these), use virtual scrolling for the section list within the chapter TOC

**Phase to address:** Navigation design phase

**Confidence:** HIGH -- section counts verified by analysing `sections_hierarchy.json` (Ch3: 103, Ch4: 143, Ch5: 84, Ch8: 138, Ch14: 88, Ch15: 141, Ch19: 57 sections)

---

### Pitfall 6: Zustand Store Mode Toggle Breaks With New Navigation Paradigm

**What goes wrong:** The app store has a `mode: 'planner' | 'fixer'` binary toggle. Adding COP Reader as a third mode requires changes across 15+ components that check this mode, and doing it wrong causes Fixer mode to break or COP Reader to show Planner-mode UI.

**Why it happens:**
- `app-store.ts` defines `mode: 'planner' | 'fixer'` -- a union type that doesn't include 'cop-reader'
- `MobileNav.tsx` (line 86-87) highlights navigation items based on mode
- `MobileNav.tsx` footer (lines 172-185) shows mode indicator with only two states
- `Sidebar.tsx` has no mode awareness but links hardcode `/planner`
- `Header.tsx` likely references mode for title/context display
- Any component doing `if (mode === 'planner')` implicitly treats everything non-fixer as planner
- Zustand persist middleware means existing users have `mode: 'planner'` in localStorage

**Consequences:**
- COP Reader shows "Planner" mode badge/styling instead of its own identity
- Mode-dependent logic falls through to wrong branch
- Existing localStorage data doesn't include new mode value -- Zustand may error or default incorrectly
- TypeScript compiler catches the union type issue, but runtime behaviour of persisted state won't match

**Warning signs:**
- TypeScript errors when adding `'cop-reader'` to mode union (expected and good)
- COP Reader pages show Planner-themed header/footer
- Toggling between modes doesn't correctly highlight the active navigation item
- Users returning to app after update see "Planner" even though they're in COP Reader

**Prevention:**
1. **Don't add a third mode** -- Instead, COP Reader IS the new Planner. The milestone says "Planner mode becomes COP Reader." Replace the planner mode conceptually, keeping `mode: 'planner' | 'fixer'` in the store. The planner mode now renders COP Reader instead of substrate grid
2. **If adding a third mode**, add migration logic for persisted state -- check `zustand` persist middleware's `version` field and migrate `mode: 'planner'` to `mode: 'cop-reader'` for existing users
3. **Update all mode-checking components** -- Grep for `mode === 'planner'` and `mode === 'fixer'` across the codebase. Each occurrence needs to handle the new paradigm
4. **Update MobileNav mode indicator** -- The footer shows Planner/Fixer icons. If COP Reader replaces Planner, update the icon and label

**Phase to address:** Navigation restructuring phase

**Confidence:** HIGH -- verified by reading `app-store.ts` (mode type on line 22-23) and `MobileNav.tsx` (mode checks on lines 82, 86, 172-185)

---

### Pitfall 7: Inline Supplementary Panels Cause Content Layout Shift

**What goes wrong:** Collapsible panels (3D models, HTG guides, case law) inserted inline within chapter text cause massive Cumulative Layout Shift (CLS) when expanded. Users lose their reading position as content below the panel jumps down by 300-600px.

**Why it happens:**
- Supplementary panels are inserted between COP text paragraphs at semantically relevant points
- Expanding a 3D model viewer adds ~400px of height; expanding an HTG guide adds variable height
- Three.js canvas for 3D models has no predetermined height until loaded
- If multiple panels are near each other (e.g., a section with both a 3D model and a case law panel), expanding one shifts the collapsed ones, causing cascading CLS
- Mobile viewport makes the shifts proportionally more jarring

**Consequences:**
- Users reading section 8.5.4 expand a supplementary panel, and the text they were reading scrolls off screen
- CLS score degrades Lighthouse performance
- On mobile, users lose context and must scroll back to find where they were
- Frustrating UX pattern that teaches users NOT to use the supplementary content

**Warning signs:**
- Lighthouse flags CLS issues on chapter pages
- Users report "I clicked something and lost my place"
- Content below expanded panel jumps visibly during expansion animation

**Prevention:**
1. **Reserve space with fixed-height containers** -- Collapsed panels show a 48px trigger bar. When expanded, use CSS `transition` on `max-height` for smooth animation rather than abrupt DOM insertion
2. **Scroll compensation** -- When a panel expands, calculate the height delta and adjust `window.scrollBy` by the same amount so the user's viewport position relative to surrounding text remains stable
3. **3D viewer placeholder** -- Reserve 400px height for 3D model area immediately (show loading skeleton). This prevents CLS when the Three.js canvas mounts
4. **Expand downward from trigger** -- Panels always expand downward. Content above the panel never moves. Only content below shifts, and the user's eye is focused on the expanding panel, not above it
5. **Lazy-mount panel content** -- Don't mount Three.js or heavy panel content until the panel is actually expanded. Use `hidden="until-found"` attribute so browser search can still find collapsed content

**Phase to address:** Supplementary panel implementation phase

**Confidence:** HIGH -- CLS is a well-documented issue with expandable content in document flow; Three.js dynamic loading already uses dynamic imports (established pattern from Phase 6)

---

### Pitfall 8: HTG PDF Extraction Produces Unreliable Structured Content

**What goes wrong:** Extracting structured text from the three HTG PDFs (Flashings, Penetrations, Cladding) produces garbled content -- broken table layouts, missing captions, merged columns, and lost image-to-text associations -- because PDF is a page-description format, not a structured-content format.

**Why it happens:**
- PDFs store visual positioning commands, not semantic structure. Text that appears in columns on screen may be stored as interleaved character sequences
- Technical documents with complex layouts (tables, diagrams with callout labels, multi-column sections, formulas) are hardest to extract
- The HTG guides contain artwork-heavy technical illustrations where caption text is positioned relative to the image, not semantically linked
- Font subsetting in PDFs can produce garbled characters if the extraction tool can't resolve the font mapping
- The MRM COP extraction (`sections_hierarchy.json`) likely required significant manual cleanup -- the same effort will be needed for HTG PDFs

**Consequences:**
- Extracted HTG content has incorrect section numbering or missing sections
- Tables appear as scrambled text without column alignment
- Image captions separated from their images
- Technical specifications with numbers/dimensions corrupted (e.g., "150mm" becomes "150 mm" or "l50mm")
- Content linked to wrong COP sections due to extraction errors

**Warning signs:**
- Extracted text contains sequences of seemingly random characters
- Table data loses column alignment when compared to PDF source
- Section numbers are inconsistent or jump (e.g., 3.1, 3.2, 3.5 -- missing 3.3, 3.4)
- Images referenced in text cannot be matched to extracted image files

**Prevention:**
1. **Budget significant time for manual review** -- Plan for 2-4 hours of manual review per HTG PDF, not minutes. The MRM COP extraction was the product of substantial effort
2. **Use a multi-pass extraction approach** -- First extract text, then extract images, then manually associate images with sections. Don't try to do it all in one automated pass
3. **Validate against source PDF** -- Create a side-by-side comparison for each HTG section: extracted content vs PDF page. Flag any discrepancies
4. **Simple structure, not deep hierarchy** -- HTG guides are supplementary. They don't need the deep hierarchical structure of the MRM COP. A flat list of guide sections with associated images is sufficient
5. **Store extraction confidence** -- For each extracted section, store a confidence flag (high/medium/low). Low-confidence sections get flagged for manual review before going live
6. **Consider manual extraction for small document set** -- With only 3 PDFs, manual extraction using a consistent JSON schema may be faster and more reliable than building an automated pipeline

**Phase to address:** HTG extraction phase (should be an early phase since it's a prerequisite for inline panels)

**Confidence:** MEDIUM -- have not examined the HTG PDFs directly, but PDF extraction challenges are well-documented ([CompDF analysis](https://www.compdf.com/blog/what-is-so-hard-about-pdf-text-extraction)); the existing `HTG_content/Artwork` directory structure suggests partial extraction has already been attempted

---

### Pitfall 9: Search Results Link to Wrong Context After Navigation Restructure

**What goes wrong:** The search API returns results with URLs using the current substrate/category addressing scheme. After adding COP Reader, search results should link to the COP section view when the user is in COP Reader context, but they continue linking to old Planner-style URLs, creating a jarring navigation break.

**Why it happens:**
- Search API (`/api/search/route.ts`) builds result URLs from database fields (`substrateId`, `categoryId`, `detailId`)
- The API has no awareness of the user's current navigation context (COP Reader vs Fixer)
- Exact match redirect (search page line 96-98) hardcodes `/planner/` prefix
- `GroupedSearchResults` component constructs links using old pattern
- Section number search ("8.5.4") should redirect to COP Reader section, but current redirect logic may not account for this

**Consequences:**
- User is reading COP chapter 8, searches for something in chapter 9, gets redirected to Planner view instead of staying in COP Reader
- Navigation context switches unexpectedly
- Users lose COP Reader state (reading position, collapsed panels) when search redirects to different route structure
- Section number search ("8.5.4") may redirect to wrong location or not redirect at all

**Prevention:**
1. **Context-aware search results** -- Pass current navigation mode to search API. In COP Reader context, return section-based URLs; in Fixer context, return task-based URLs; fallback to substrate/category URLs
2. **Dual URLs in search results** -- Return both URL formats from API: `plannerUrl` and `copUrl`. Let the frontend component choose based on current context
3. **Update section number redirect** -- Section number search should always redirect to COP Reader view (`/cop/8#section-8-5-4`) regardless of current mode
4. **Add section number as search indexable field** -- If not already indexed, add COP section numbers (e.g., "8.5.4") to the search index so they're discoverable

**Phase to address:** Search integration phase (after routes are defined but before launch)

**Confidence:** HIGH -- verified search redirect logic in search page source code

---

## Minor Pitfalls

Mistakes that cause friction but are quickly fixable.

### Pitfall 10: Scroll Position Lost When Navigating Between Chapters

**What goes wrong:** User is reading section 8.5.4 midway through Chapter 8, navigates to Chapter 9, then presses browser Back -- they land at the top of Chapter 8 instead of section 8.5.4.

**Why it happens:**
- Next.js App Router does not fully handle scroll restoration for dynamic content
- Known issue: [scroll position not restored with dynamic segments](https://github.com/vercel/next.js/issues/49427)
- History API `scrollRestoration` defaults to `auto` but doesn't account for dynamically loaded content that changes page height

**Prevention:**
1. Store scroll position in `sessionStorage` keyed by chapter URL before navigation
2. On back-navigation, restore scroll position after content renders using `requestAnimationFrame`
3. Use path-based section addressing (`/cop/8/5/4`) so the browser can reconstruct reading position from URL alone

**Phase to address:** Polish phase

---

### Pitfall 11: Content Duplication Between Chapter View and Detail View

**What goes wrong:** The same MRM content appears in both the COP Reader (chapter text) and the existing detail page (detail viewer), but formatted differently. Users see inconsistencies and don't know which is the "real" version.

**Why it happens:**
- `sections_hierarchy.json` contains the full COP text extracted from PDF
- Database `details` table contains curated detail content with steps, warnings, and 3D links
- These are two different representations of overlapping content -- a section about valley flashings in the COP text is also a "Valley Flashing" detail in the database
- No linking exists between section numbers and detail IDs

**Prevention:**
1. **Establish section-to-detail mapping** -- Map each detail in the database to its corresponding COP section number. The `details_enhanced.json` likely contains section references that can be used
2. **Single source of truth for text** -- COP Reader shows the authoritative COP text from `sections_hierarchy.json`. When a section has a linked detail, show a card/link to the enriched detail page (with 3D viewer, steps, warnings)
3. **Don't duplicate content** -- COP Reader is the document text. Detail pages are the enriched interactive experience. They complement, not duplicate

**Phase to address:** Data model / mapping phase

---

### Pitfall 12: Collapsible Panel State Lost on Navigation

**What goes wrong:** User expands supplementary panels (3D model, HTG guide) within a section, navigates away, returns -- all panels are collapsed again.

**Prevention:**
1. Store expanded panel state in URL search params or `sessionStorage` keyed by section ID
2. Keep panel state simple -- don't persist to database; session-level persistence is sufficient
3. Consider "expand all supplementary" toggle per chapter for power users

**Phase to address:** Panel implementation phase

---

### Pitfall 13: Chapter 19 (Revision History) Treated Like Content Chapters

**What goes wrong:** Chapter 19 "Revision History" is 618KB -- the largest chapter -- and contains changelog data, not normative content. Rendering it the same way as content chapters wastes performance budget and confuses users.

**Prevention:**
1. **Treat chapter 19 differently** -- It's metadata, not COP content. Consider a simpler paginated list or search-within-changelog rather than full document rendering
2. **Consider deferring it** -- Revision history is not essential for the digital COP reader MVP. Include it but with minimal rendering investment
3. **Same applies to Chapter 2 (Glossary, 213KB)** -- Consider a searchable glossary component rather than a scrolling text dump

**Phase to address:** Chapter rendering phase (design exceptions for non-normative chapters)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Data splitting / chapter loading | P1: 3.8MB JSON kills mobile perf | CRITICAL | Split per chapter, lazy-load sections, Server Components |
| Route structure changes | P2: SW cache breaks, P3: URLs break | CRITICAL | Bump cache version, keep old routes alive, add redirects |
| Deep-linking implementation | P4: Hash scroll fails with lazy load | CRITICAL | Path-based addressing, pre-render target, manual scroll |
| Sidebar / navigation design | P5: 1,103 sections in sidebar | MODERATE | Progressive disclosure, separate chapter TOC from nav |
| Store / mode changes | P6: Zustand binary mode breaks | MODERATE | COP Reader replaces Planner conceptually, not third mode |
| Inline supplementary panels | P7: CLS on panel expand | MODERATE | Reserve space, scroll compensation, lazy-mount content |
| HTG PDF extraction | P8: Garbled extraction output | MODERATE | Manual review budget, simple structure, confidence flags |
| Search integration | P9: Wrong URL context | MODERATE | Context-aware search, dual URLs, update redirects |
| Chapter rendering (special cases) | P13: Ch 19 / Ch 2 waste performance | MINOR | Different rendering strategy for non-normative chapters |

---

## Integration Risk Matrix

These pitfalls don't exist in isolation. Here's how they compound:

| Pitfall Combination | Compounding Effect | Mitigation |
|---------------------|--------------------|------------|
| P1 + P4 | Lazy-loading sections means deep-link target doesn't exist in DOM when scroll fires | Pre-render target section before lazy-loading others |
| P2 + P3 | Old cached routes + new route structure = double breakage for returning users | Bump SW version AND maintain old route redirects |
| P5 + P6 | New navigation structure + wrong mode state = completely wrong UI on return visit | Design nav to work regardless of stored mode |
| P7 + P1 | Expanding panels in lazy-loaded sections causes scroll position to be wrong | Scroll compensation must account for both lazy-load AND panel expansion |
| P8 + P9 | Badly extracted HTG content linked to wrong COP sections via search | Validate HTG-to-COP-section mapping before enabling in search index |

---

## Pre-Implementation Checklist

Before writing any code for v1.2, verify:

- [ ] `sections_hierarchy.json` has been split into per-chapter JSON files
- [ ] Existing routes (`/planner/...`) will be preserved (redirects or parallel routes)
- [ ] Service worker `CACHE_VERSION` will be bumped in deployment
- [ ] Deep-link strategy decided (path-based vs hash-based)
- [ ] Navigation design accommodates both chapter-level TOC and global nav without mixing them
- [ ] `mode` in Zustand store has a clear migration path (replace planner, not add third mode)
- [ ] HTG PDF quality has been manually reviewed before building extraction pipeline
- [ ] Performance budget established: Time to Interactive < 3s on throttled 4G for largest chapter

---

## Sources

**Next.js Performance:**
- [Next.js Large Page Data Warning](https://nextjs.org/docs/messages/large-page-data)
- [Handling Large JSON Data in Next.js](https://medium.com/@mohantaankit2002/handling-large-json-data-in-next-js-without-slowing-down-the-ui-78e6dc17b169)
- [Next.js Large Page Data Discussion #39880](https://github.com/vercel/next.js/discussions/39880)

**Deep-Linking / Scroll Issues:**
- [Next.js Issue #51721: Link does not respect smooth scroll](https://github.com/vercel/next.js/issues/51721)
- [Next.js Issue #49612: Link to anchor doesn't respect scroll-padding](https://github.com/vercel/next.js/issues/49612)
- [Next.js Issue #49427: Scroll position not reset on dynamic segment change](https://github.com/vercel/next.js/issues/49427)

**PWA / Service Worker:**
- [Taming PWA Cache Behavior](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)
- [Offline-First Next.js 15 App Discussion #82498](https://github.com/vercel/next.js/discussions/82498)

**PDF Extraction:**
- [What's So Hard About PDF Text Extraction](https://www.compdf.com/blog/what-is-so-hard-about-pdf-text-extraction)
- [PDF Data Extraction Benchmark 2025](https://procycons.com/en/blogs/pdf-data-extraction-benchmark/)

**DOM Performance:**
- [Optimize DOM Size for Better Web Performance](https://www.debugbear.com/blog/excessive-dom-size)
- [React Performance Optimization Best Practices 2025](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9)

**Codebase Inspection (Primary Source):**
- `sections_hierarchy.json` -- 3.8MB, 19 chapters, 1,103 sections verified
- `public/sw.js` -- hardcoded STATIC_ASSETS, CACHE_VERSION = 'v1'
- `stores/app-store.ts` -- mode: 'planner' | 'fixer' union type
- `app/(dashboard)/search/page.tsx` -- search redirect logic, URL construction
- `components/layout/Sidebar.tsx` -- hardcoded navigation items
- `components/layout/MobileNav.tsx` -- mode-dependent UI rendering

---

*Research completed: 2026-02-08*
*Confidence: HIGH for performance and routing pitfalls (verified against codebase); MEDIUM for HTG extraction (PDFs not directly examined)*
