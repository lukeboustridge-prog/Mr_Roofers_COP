# Project Research Summary

**Project:** Master Roofers Code of Practice v1.5 - Wikipedia-Style Encyclopedia Transformation
**Domain:** Technical documentation encyclopedia with legislative authority
**Researched:** 2026-02-12
**Confidence:** HIGH

## Executive Summary

The v1.5 transformation converts the existing COP Reader from a linear document viewer into a Wikipedia-style roofing encyclopedia with extreme cross-linking between 1,121 COP sections, 350 HTG guide pages, 312 installation details, and 86 failure cases. The core challenge is merging content from multiple sources (authoritative MRM COP + practical RANZ HTG) while maintaining legislative authority, creating thousands of contextual cross-links without overwhelming users, and preserving the familiar section numbering that every NZ roofer already knows.

Research reveals this is fundamentally a **content composition problem**, not a UI rebuild. The existing Next.js 14 + Drizzle + R2 stack is perfectly suited - you need only 7 new production dependencies (react-markdown, remark-gfm, rehype plugins, Tailwind typography, intersection observer, debounce) to add encyclopedia capabilities. The killer insight: use Server Components for multi-source content composition, parse cross-references server-side with lookup tables, and apply strict link budgets (max 5 per paragraph) to avoid "blue text soup" that plagued early Wikipedia imitators.

Key risks center on cultural adoption (70% of digital transformations fail from user resistance, not tech issues) and maintaining legislative authority when merging sources. Mitigate by: (1) preserving exact MRM COP section numbers, (2) visual distinction between authoritative (COP) and practical (HTG) content, (3) progressive migration with old routes redirecting, (4) testing with conservative 50+ year old roofers who distrust change. The app must feel like an enhanced version of the familiar COP, not a reimagining.

## Key Findings

### Recommended Stack

**Minimal additions to existing foundation.** The transformation requires only 7 new production dependencies for markdown rendering, cross-linking, and scroll-based navigation. Core insight: leverage Server Components for content composition, avoid client-heavy MDX, use react-markdown ecosystem for safety and extensibility.

**Core technologies:**
- **react-markdown (^10.1.0)**: Safe markdown-to-React rendering - Industry standard for dynamic markdown. No dangerouslySetInnerHTML, converts to React AST. 60KB minzipped but extensible. Used by GitHub, Linear.
- **remark-gfm (^4.0.1)**: GitHub Flavored Markdown support - Adds tables, footnotes, strikethrough, task lists. Essential for legislative callouts and structured content.
- **rehype-slug + rehype-autolink-headings (^7.x)**: Auto-generate heading IDs and anchor links - Required for Wikipedia-style heading navigation. GitHub-style collision-free IDs.
- **@tailwindcss/typography (^0.5.x)**: Professional prose styling - First-party Tailwind plugin. Handles nested lists, blockquotes, code blocks, tables. Customizable for legislative styling.
- **react-intersection-observer (^9.x)**: Scroll spy for TOC highlighting - Detects heading visibility in viewport. Powers active TOC item highlighting. Built-in test utils. Replaces manual scroll listeners.
- **use-debounce (^10.1.0)**: Search input optimization - Prevents API spam during autocomplete. 4M+ weekly downloads. Server-rendering safe.
- **github-slugger (^2.x)**: Consistent heading ID generation - Generates slugs exactly like GitHub. Handles collisions (foo, foo-1, foo-2).

**Already established (do not re-add):** Zustand for state management, shadcn/ui Command component for search palette, Drizzle + Neon for content queries, Next.js 14 Server Components for composition.

**Version compatibility:** All packages compatible with React 18+ and Next.js 14+. ESM-only packages (remark-gfm, rehype plugins) work natively in Next.js.

### Expected Features

**Table stakes (must have):**
- **Section number preservation**: Display original MRM COP numbers (e.g., "8.5.4 Change of Pitch") exactly as PDF. This is the fundamental unit of reference - roofers communicate via section numbers on site, in consent applications, in disputes.
- **Chapter-level TOC with scrollspy**: Collapsible sidebar showing 4-level hierarchy (chapter > section > subsection > sub-subsection). Highlights current section as user scrolls. Universal pattern across ICC Digital Codes, Docusaurus, GitBook.
- **Section deep-linking**: URL scheme mapping to section numbers (e.g., `/encyclopedia/cop/8#section-8.5.4`). Shareable URLs landing on exact section. Standard web pattern, critical for professional reference.
- **Inline technical diagrams**: 775 diagrams rendered inline with sections, not in separate gallery. Zoomable on mobile. 772 already mapped to sections.
- **Cross-reference navigation**: Internal COP references ("See 8.5.4") become clickable links. Primary digital advantage over PDF.
- **Breadcrumb navigation**: In 4-level hierarchy, users need to know where they are and navigate upward. Universal pattern for hierarchical content.

**Differentiators (competitive advantage):**
- **Inline supplementary content panels**: Signature feature. When reading COP section 8.5, collapsible panel shows relevant RANZ 3D model, HTG installation guide, failure cases. PDF cannot do this. Progressive disclosure pattern - collapsed by default, doesn't disrupt reading flow.
- **Scrollspy section tracking**: As user scrolls 70-page chapter, sidebar highlights current section. Constant orientation in dense document.
- **Reading position persistence**: Store last-read section per chapter in local storage. Return user to where they left off. Physical bookmark equivalent.
- **HTG Installation Guide integration**: 3 HTG PDFs (Flashings, Penetrations, Cladding) extracted and mapped to COP sections. Bridges gap between "what to do" (COP) and "how to do it" (HTG).

**Defer to v2+:**
- Cross-reference parsing from raw text (high complexity regex, edge cases)
- Reading position persistence (nice to have, not launch-critical)
- Chapter-level search results (extend existing search after content in place)
- Print-friendly section export (important for BCAs but not launch-critical)
- Interactive table filtering (basic responsive tables needed at launch, filtering later)
- Section bookmarking (extend existing favourites system, low effort but defer)

### Architecture Approach

**Runtime article composition via Server Components.** Fetch content from multiple tables in parallel (cop_sections + htg_content + details + failure_cases), merge at request time, render as Server Component. No pre-computed articles table (avoids data duplication, stale cache issues). Reference resolution via in-memory lookup table (section numbers → URLs) built at module load. Progressive enhancement for cross-linking: regex-based detection for structured refs (Phase 1), add natural language parsing later.

**Major components:**
1. **ArticleComposer (Server Component)** - Orchestrates parallel queries to cop_sections, htg_content, details, failure_cases. Merges via junction tables. Resolves cross-references. Passes unified article object to renderer.
2. **ArticleRenderer (Server/Client boundary)** - Wraps react-markdown with plugins. Custom components for cross-links (InlineReference), supplementary content (SupplementarySection), images (CopImage). Renders plain text + React components (no MDX migration needed initially).
3. **TableOfContents (Client Component)** - Extracts section hierarchy server-side, passes to client. Uses Intersection Observer for scroll spy. Sticky positioning with active section highlighting.
4. **ReferenceResolver (Server utility)** - Builds Map<sectionNumber, url> at module load. O(1) lookup for cross-references. ~56KB memory overhead for 1,121 sections (acceptable).
5. **CrossLinkEngine (Server utility)** - Regex-based detection of section patterns ("8.5.4", "Section 8.5.4", "see 8.5.4"). Resolves via lookup table. Strict link budget enforcement (max 5 per paragraph).

**Key patterns:** Server-side TOC extraction + client-side scroll spy. Progressive migration (/cop/ redirects to /encyclopedia/cop/ with 301s). Stable content IDs in URLs (independent of category structure to prevent link rot). Plain text + React components initially (MDX conversion deferred to Phase 3+ if needed).

### Critical Pitfalls

1. **Big bang route migration breaking production links** - All URLs change simultaneously, user bookmarks break, search engine indexes point to 404s, industry trust evaporates. **Avoid:** Progressive migration with redirects deployed FIRST, then migrate routes. Keep redirects minimum 1 year. Build redirect mapping table (`previous_slugs[]` array in database) before migration. Emergency rollback if 404 rate spikes >5%.

2. **Automated cross-linking creating unreadable "blue text soup"** - Every paragraph becomes 40% blue underlined text. Users can't distinguish important references from routine mentions. Conservative tradesperson audience rejects as "too complicated." **Avoid:** Link budget of max 3-5 links per paragraph. First mention rule (auto-link only first occurrence per section). Relevance scoring (link only when target adds substantial context). Human review of 10% of auto-linked pages. A/B test with conservative audience.

3. **Content source merging without clear authority hierarchy** - MRM COP (authoritative legislative) and RANZ HTG (practical guide) present conflicting information with equal weight. Inspector doesn't know which to follow. App loses legislative authority status. **Avoid:** Define source hierarchy (MRM COP > MBIE Building Code > RANZ HTG). Visual distinction via styling/icons. Attribution always visible ("According to MRM COP Section 4.2.1..." not "Flashing should..."). Conflict resolution workflow (when sources contradict, COP wins, HTG adds context note).

4. **Encyclopedia navigation too deep for field use** - 6-level hierarchy requires too many clicks. Roofer on site needs spec fast, takes 3 minutes via navigation, rain starts, gives up, uses PDF (finds answer in 20 seconds via Ctrl+F). **Avoid:** Maximum 3-level depth for primary navigation. Flatten via powerful search. Task-based shortcuts ("Installing valley flashing") bypass hierarchy. Measure time-to-answer vs. legacy PDF - must be faster or equal.

5. **Cultural resistance from conservative tradesperson audience** - 70% of digital transformations fail from user resistance, not tech issues. Conservative roofers (55+, used to PDF for 20 years) reject as "too different." Adoption stalls at 15%. **Avoid:** Involve conservative users early in design. Design as evolution not revolution (familiar visual language from PDF). Preserve PDF workflow (offer PDF export, print-friendly views). Side-by-side availability (don't deprecate PDF immediately). Champion recruitment (respected industry veterans endorse). Allocate 20%+ budget to change management/training.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Route Structure (Week 1-2)
**Rationale:** Build new encyclopedia architecture in parallel with existing /cop/ routes. No user-facing changes. Establishes stable URL structure and redirect infrastructure before any migration.
**Delivers:** Encyclopedia routes functional at /encyclopedia/cop/ with feature flag. ArticleComposer, ArticleRenderer, TableOfContents components built. Section hierarchy extraction working.
**Addresses:** Route migration foundation, stable URL design (prevents link rot pitfall)
**Avoids:** Big bang migration pitfall - redirects infrastructure ready before cutover
**Tech:** Server Components for composition, Next.js App Router parallel routes

### Phase 2: Content Composition Engine (Week 2-3)
**Rationale:** Core capability for merging multi-source content while maintaining authority. Must be rock-solid before adding cross-linking or supplementary content.
**Delivers:** article-composer.ts fetches cop_sections + htg_content + details + failure_cases in parallel. Source attribution system working. Visual distinction for COP vs HTG content.
**Addresses:** Content source merging, authority hierarchy maintenance
**Avoids:** Authority confusion pitfall - clear attribution from day one
**Tech:** Drizzle parallel queries with Promise.all(), junction table joins, source metadata tracking

### Phase 3: Cross-Linking Engine (Week 3-4)
**Rationale:** Once composition solid, add intelligent cross-linking with strict controls. This is primary digital advantage over PDF but must not overwhelm.
**Delivers:** Reference resolver (section number lookup table), link parser (regex for structured refs), InlineReference component. Link budget enforcement (max 5 per paragraph). First mention rule implemented.
**Addresses:** Section deep-linking, cross-reference navigation (table stakes features)
**Avoids:** Blue text soup pitfall - strict link limits and relevance scoring from start
**Tech:** Regex parsing with conservative thresholds, in-memory lookup Map, unit tests for edge cases

### Phase 4: TOC & Scrollspy Navigation (Week 4-5)
**Rationale:** With content and linking working, add Wikipedia-style navigation. Critical for orientation in 70-page chapters.
**Delivers:** Collapsible sidebar TOC, Intersection Observer scroll spy, mobile-responsive TOC (collapsed by default, bottom-anchored). Breadcrumb navigation working.
**Addresses:** Chapter-level navigation, scrollspy tracking (table stakes + differentiators)
**Avoids:** Mobile TOC consuming screen pitfall - responsive from start, mobile-first collapsing
**Tech:** react-intersection-observer, Server Component TOC extraction, Client Component hydration

### Phase 5: Supplementary Content Integration (Week 5-6)
**Rationale:** Now that core encyclopedia works, add the killer feature: inline supplementary panels. This makes digital version genuinely better than PDF.
**Delivers:** SupplementarySection component (HTG guides, details, case law callouts). Progressive disclosure (collapsed by default). Clear visual distinction from primary content. CitationBlock for case law formatting.
**Addresses:** Inline supplementary panels, HTG integration (key differentiators)
**Avoids:** Scope creep pitfall - focus on read-only reference, no collaboration features
**Tech:** Collapsible panels, gray/blue border distinction, existing 3D viewer integration

### Phase 6: Markdown Rendering & Typography (Week 6-7)
**Rationale:** With structure and content working, add rich formatting for legislative document styling.
**Delivers:** react-markdown with remark-gfm, rehype-slug, rehype-autolink-headings. Tailwind typography plugin configured for legislative styling. Inline diagrams rendering with zoom. Tables responsive.
**Addresses:** Chapter content rendering, inline diagrams (table stakes)
**Avoids:** Legislative formatting pitfall - formal typography, section numbering, high contrast
**Tech:** react-markdown ecosystem, @tailwindcss/typography, custom markdown components

### Phase 7: Search Enhancement (Week 7-8)
**Rationale:** Powerful search compensates for flattened navigation hierarchy. Must be fast, relevant, with autocomplete.
**Delivers:** Debounced search input (use-debounce), full-text search across cop_sections content, chapter-level results with snippets, Command palette integration (shadcn).
**Addresses:** Chapter-level search, navigation shortcuts
**Avoids:** Deep navigation pitfall - search enables fast access bypassing hierarchy
**Tech:** use-debounce, Drizzle full-text search (PostgreSQL GIN indexes), shadcn Command component

### Phase 8: Migration & Cutover (Week 8-9)
**Rationale:** Only after all features tested and validated with users. Make /encyclopedia/cop/ primary route.
**Delivers:** 301 redirects from /cop/ to /encyclopedia/cop/. All internal links updated. Redirect monitoring active. PDF export available. Print-friendly stylesheet.
**Addresses:** Backward compatibility, user migration path
**Avoids:** Big bang migration pitfall - progressive cutover, redirects maintained indefinitely
**Tech:** Next.js redirects, redirect mapping table in database, analytics monitoring

### Phase 9: Conservative User Testing & Refinement (Week 9-10)
**Rationale:** Before general launch, validate with actual conservative roofers (50+ age group who distrust change). This is make-or-break for adoption.
**Delivers:** User testing with 10+ conservative roofers. Time-to-answer comparison vs PDF. Training videos created. Industry champion recruited. Feedback incorporated.
**Addresses:** Cultural resistance mitigation, adoption validation
**Avoids:** User resistance pitfall - early involvement, familiar visual language, side-by-side availability
**Validation:** Time-to-answer faster than PDF, conservative users approve, industry veteran endorses

### Phase 10: HTG Extraction & Mapping (Parallel to Phases 1-6)
**Rationale:** Can run in parallel with encyclopedia build. 350 HTG records already in database, need section mapping refinement.
**Delivers:** HTG-to-COP section mapping verified. 1:1, 1:Many, Many:1, and standalone HTG content identified. Relevance scoring for multi-mapping. Standalone HTG article routes at /encyclopedia/guides/.
**Addresses:** HTG installation guide integration (differentiator)
**Tech:** Database queries, content mapping scripts, human review workflow

### Phase Ordering Rationale

- **Foundation first (Phase 1):** Stable URLs and redirect infrastructure prevent link rot and enable rollback safety. Feature flag allows parallel build without disrupting production.
- **Composition before linking (Phase 2 before 3):** Must nail multi-source merging with authority hierarchy before adding thousands of cross-links. Prevents authority confusion.
- **Linking before navigation (Phase 3 before 4):** Cross-links are content, TOC is navigation. Get content right first.
- **Core features before supplementary (Phases 1-4 before 5):** Table stakes encyclopedia must work perfectly before adding differentiators. Prevents scope creep.
- **Structure before styling (Phases 1-5 before 6):** Get data flow and composition working with plain text, then add rich formatting. Avoids premature optimization.
- **Search after navigation (Phase 7 after 4):** Search compensates for flattened navigation, but basic navigation must exist first.
- **Migration last (Phase 8):** Only after all features built and tested. Prevents big bang migration disasters.
- **User testing before launch (Phase 9):** Conservative audience validation non-negotiable for adoption success.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Cross-Linking):** Regex edge cases for section reference detection. May need to research NLP libraries if prose references prove too complex for regex. Test with sample COP content to validate patterns.
- **Phase 5 (Supplementary Integration):** Conflict detection algorithm needs refinement. Research how legislative documentation platforms (legislation.govt.nz, congress.gov) handle source attribution and version control.
- **Phase 7 (Search):** Full-text search performance at 1,800+ items. May need to research ElasticSearch or Algolia integration if PostgreSQL full-text search proves too slow on Neon (cold start latency).

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Next.js App Router parallel routes well-documented. Server Component composition standard pattern.
- **Phase 4 (TOC & Scrollspy):** Intersection Observer API well-supported, many implementation examples. CSS-Tricks article provides reference implementation.
- **Phase 6 (Markdown Rendering):** react-markdown ecosystem mature, official docs comprehensive. Tailwind typography plugin first-party.
- **Phase 8 (Migration):** URL redirect patterns standard web practice. Next.js redirects documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All 7 new dependencies verified via official sources. Versions confirmed compatible with Next.js 14 + React 18. react-markdown 10.1.0, remark-gfm 4.0.1, rehype plugins 7.x all actively maintained. Integration patterns validated against Next.js Server Components documentation. |
| Features | HIGH | Table stakes features (TOC, section numbering, deep-linking, diagrams) validated across ICC Digital Codes, Docusaurus, GitBook, EPUB standards. Differentiator features (inline supplementary, scrollspy) proven patterns from scientific journals, NN/g research. MVP recommendation based on dependency analysis and user journey mapping. |
| Architecture | HIGH | Server Component composition pattern official Next.js recommendation. Runtime composition vs pre-computed articles trade-off validated via performance data (Neon <50ms joins). Reference resolution via lookup table proven at scale (Wikipedia uses similar approach). Migration strategy matches progressive delivery best practices. |
| Pitfalls | MEDIUM | Top 5 pitfalls validated via multiple sources (70% digital transformation failure rate from McKinsey, user resistance patterns from NN/g, link rot issues from SEO research). Specific to conservative tradesperson audience based on domain knowledge but not empirically tested. Recovery strategies inferred from web development best practices. |

**Overall confidence:** HIGH

### Gaps to Address

**Link budget thresholds:** Research suggests "max 5 per paragraph" but optimal threshold may vary by content density. Need to A/B test 3 vs 5 vs 7 links during Phase 3 implementation with sample COP sections. Conservative starting point: 3 per paragraph, increase if user testing shows no readability issues.

**HTG-to-COP mapping quality:** 350 HTG records already in database but mapping quality unknown. Phase 10 requires human review to validate 1:1, 1:Many, Many:1 mappings. Budget 20-30 hours for domain expert (Ben Clisby) review during implementation.

**Search performance at scale:** PostgreSQL full-text search benchmarks show <200ms for 10K records, but Neon cold start latency unknown. Phase 7 may require fallback to external search (Algolia) if Neon proves too slow. Plan for both options during phase planning.

**Conservative user acceptance threshold:** Research indicates 70% fail rate for digital transformations but no specific threshold for "acceptable" adoption rate in conservative industries. Recommend setting success criteria at 60%+ adoption within 6 months (vs typical 15% for failed projects). Validate threshold with Gary McNamara (Membership Director) before Phase 9.

**Legislative styling requirements:** Research shows formal typography, section numbering, high contrast are patterns from legislation.govt.nz and congress.gov, but MBIE-specific requirements unknown. Recommend MBIE review checkpoint in Phase 6 before finalizing typography configuration. Budget 2-3 iterations for feedback incorporation.

**Mobile performance:** Intersection Observer and react-markdown bundle size (~60KB) acceptable on desktop but mobile performance unknown. Phase 4 and 6 must include real device testing (not just Chrome DevTools). Target: <2s page load on 3G, <1s on 4G. Use Lighthouse mobile audit for validation.

## Sources

### Primary (HIGH confidence)
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) - Official repository, version 10.1.0 confirmed, API documentation
- [Next.js Server Components Guide](https://nextjs.org/docs/app/getting-started/server-and-client-components) - Official Next.js 14 App Router documentation
- [Next.js Composition Patterns](https://nextjs.org/docs/14/app/building-your-application/rendering/composition-patterns) - Server/Client component boundaries
- [Tailwind Typography Plugin](https://github.com/tailwindlabs/tailwindcss-typography) - Official first-party plugin, version 0.5.x
- [remark-gfm GitHub](https://github.com/remarkjs/remark-gfm) - Official plugin, version 4.0.1, ESM-only confirmed
- [rehype-slug](https://www.npmjs.com/package/rehype-slug) + [rehype-autolink-headings](https://www.npmjs.com/package/rehype-autolink-headings) - npm official docs, version 7.x
- [react-intersection-observer GitHub](https://github.com/thebuilder/react-intersection-observer) - Official docs, version 9.x with hooks API
- [use-debounce npm](https://www.npmjs.com/package/use-debounce) - Version 10.1.0, 4M weekly downloads, server-safe

### Secondary (MEDIUM confidence)
- [NN/g: Table of Contents Design](https://www.nngroup.com/articles/table-of-contents/) - UX research for TOC patterns
- [NN/g: Breadcrumb Guidelines](https://www.nngroup.com/articles/breadcrumbs/) - Hierarchical navigation best practices
- [CSS-Tricks: TOC with IntersectionObserver](https://css-tricks.com/table-of-contents-with-intersectionobserver/) - Implementation reference
- [ICC Digital Codes](https://codes.iccsafe.org/) - Competitive analysis, gold standard for building code readers
- [McKinsey Digital Transformation Report](https://webvillee.com/blogs/why-70-of-digital-transformations-fail-the-user-adoption-crisis-no-one-talks-about/) - 70% failure rate statistic
- [React Stack Patterns 2026](https://www.patterns.dev/react/react-2026/) - Modern architecture patterns
- [Wikipedia Linking Best Practices](https://topicalmap.ai/blog/auto/internal-linking-strategy-guide-2026/) - Internal linking strategy, link budget concepts
- [Legislative Markup Standards](https://www.sciencedirect.com/topics/computer-science/legislative-document) - Formatting conventions for legislative docs

### Tertiary (LOW confidence - needs validation)
- [Fuzzy Deduplication Accuracy](https://futuresearch.ai/semantic-deduplication/) - Specificity 0.94-0.99 cited but needs validation for domain
- [Reading Position Bookmark Pattern](https://css-tricks.com/reading-position-indicator/) - Implementation example, not authoritative source
- [Progressive Disclosure](https://www.interaction-design.org/literature/topics/progressive-disclosure) - UX pattern definition, general principle

---
*Research completed: 2026-02-12*
*Ready for roadmap: yes*
