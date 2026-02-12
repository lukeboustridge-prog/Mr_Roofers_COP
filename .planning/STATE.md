# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Three-click access to authoritative roofing details with clear source attribution for Building Code citation
**Current focus:** v1.5 Roofing Encyclopedia — Phase 34 in progress (installation guide transformation)

## Current Position

Phase: 34 of 35
Plan: 2 of 2 in current phase (PHASE COMPLETE)
Status: Phase 34 Complete
Last activity: 2026-02-12 — 34-01 complete (Fixer to Installation Guide rename)

Progress: [██████████████████████████████] 97% (34/35 phases complete)

## Milestone Summary

**v1.0:** COMPLETE -- Core COP Platform (Phases 1-6) -- January 2026
**v1.1:** COMPLETE -- Unified COP Architecture (Phases 7-12) -- 2026-02-03
**v1.2:** COMPLETE -- Digital COP (Phases 13-18) -- 2026-02-08
**v1.3:** COMPLETE -- Content Quality & Completeness (Phases 19-23) -- 2026-02-11
**v1.4:** COMPLETE -- Content Quality & Navigation Restructure (Phases 24-28) -- 2026-02-12
**v1.5:** IN PROGRESS -- Roofing Encyclopedia (Phases 29-35)

## Performance Metrics

**Velocity:**
- Total plans completed: 73
- Total phases completed: 34
- Average duration: ~8min per plan

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 29-01 | Encyclopedia Route Scaffolding | 5min | 2 | 9 |
| 29-02 | ArticleRenderer Component Suite | 5min | 2 | 6 |
| 29-03 | Substrate-Aware Content Architecture | 5min | 2 | 5 |
| 30-01 | Article Composition Data Layer | 3min | 2 | 3 |
| 30-02 | Content Composition Rendering Components | 3min | 2 | 5 |
| 31-01 | Reference Resolver & Cross-Link Engine | 5min | 2 | 3 |
| 31-02 | Cross-Link Rendering Integration | 4min | 2 | 7 |
| 32-01 | COP Search Autocomplete | 3min | 2 | 4 |
| 32-02 | COP Command Palette | 3min | 2 | 3 |
| 33-01 | Typography & Image Enhancement | 3min | 2 | 3 |
| 33-02 | Case Law Margin-Note Annotations | 2min | 2 | 2 |
| 34-01 | Fixer to Installation Guide Rename | 4min | 2 | 9 |
| 34-02 | COP Cross-Links & Detail Card Enhancement | 4min | 2 | 4 |

**v1.5 Estimate:**
- Phases remaining: 7 (29-35)
- Estimated plans: ~14-21 (2-3 per phase based on complexity)
- Estimated duration: 2-3 hours total execution time

## Accumulated Context

### Decisions

v1.5 architecture decisions:
- Two sides: COP Reader (theory/reference) and Installation Guide (practical/3D/steps)
- COP section numbers are canonical citation system — preserved for MBIE acceptance
- HTG content merges INTO relevant COP articles as "Practical Guidance" blocks (not standalone /guides)
- Wikipedia-style article format: TOC sidebar, inline diagrams, continuous prose, hyperlinks
- Legislative feel retained: formal section numbering, hierarchical structure, version watermark
- Metal roofing first, architecture supports future substrates (substrate-aware from foundation)
- Additive transformation: build /encyclopedia routes in parallel, redirect at cutover
- Foundation → composition → cross-linking → navigation → migration (dependency order)

Phase 29-01 decisions:
- Library icon (not BookOpen) for Encyclopedia sidebar link to differentiate from COP Reader
- Feature flag pattern: NEXT_PUBLIC_ env var + utility function in lib/feature-flags.ts
- Explicit h2-h6 conditional rendering instead of dynamic JSX tag (avoids TypeScript type conflicts)

Phase 29-02 decisions:
- Reused existing COP components (CopImage, SupplementaryPanel, SupplementaryDetailCard) for encyclopedia -- consistency over duplication
- Server/client component split: ArticleSectionHeading + ArticleVersionBanner + ArticleContent are Server; ArticleTOC + ArticleRenderer are Client
- Map-to-Record conversion at page level for serializing supplementary data to client components
- select-all CSS on section numbers for easy citation copying

Phase 29-03 decisions:
- Metal roofing (profiled-metal) is the only populated substrate; others defined with isPopulated=false
- Invalid substrate query params fall back to default (profiled-metal) rather than 404
- Unpopulated substrates return 404 via empty chapters array validation
- SubstrateId in ArticleRenderer props interface for future use, not destructured to avoid ESLint error

Phase 30-01 decisions:
- Array.from() for Map iterator compatibility with ES5 TypeScript target
- Record return type (not Map) for client component serialization
- Union of all section IDs ensures no data lost when sources have different coverage

Phase 30-02 decisions:
- Server Components for PracticalGuidanceBlock and InlineCaseLawCallout (no 'use client') — static supplementary content
- Authority hierarchy rendering order: HTG inline > case law inline > detail panels > HTG guide links
- Colour-coded outcome badges: red=upheld, amber=partially upheld, green=dismissed

Phase 31-01 decisions:
- Singleton Map pattern for reference resolver — builds once from 19 chapter JSONs, cached at module level
- Combined regex with 5 alternation patterns for single-pass O(n) text processing
- Case-insensitive matching via character classes ([Ss][Ee]{2}, [Aa]s) rather than /i flag
- CrossLinkSegment union type (text|link) for safe React rendering without innerHTML

Phase 31-02 decisions:
- ReferenceMap type changed from Map to Record<string,string> for client/server serialization boundary
- CrossLinkedText kept as Server Component — zero client JS overhead for cross-link rendering
- Graceful fallback: ArticleContent renders plain text when no referenceMap provided

Phase 32-01 decisions:
- In-memory search index with scored ranking (no external search library) — sufficient for 1,121 sections
- Section number exact matches scored at 100 vs title word match at 10 — ensures number lookups always win
- 300ms debounce with AbortController cancellation for clean request management
- Cmd+K hint badge for future command palette integration (Plan 02)

Phase 32-02 decisions:
- Hardcoded 19 chapter titles in client component — static content that never changes between builds
- 200ms debounce (shorter than search bar's 300ms) for snappier command palette UX
- CommandPalette rendered in both ArticleRenderer (chapter pages) and COP index page

Phase 33-01 decisions:
- CopImage converted to client component with Dialog zoom — backward compatible via optional figureIndex prop
- Controlled Dialog state (useState + open/onOpenChange) instead of DialogTrigger for cleaner button semantics
- DialogTitle and DialogDescription included as sr-only for accessibility compliance
- Typography prose overrides in tailwind.config.ts theme.extend.typography with DEFAULT and slate variants

Phase 33-02 decisions:
- Float wrapper lives in ArticleContent (not in component itself) — separation of layout from content
- lg: breakpoint for float activation — matches encyclopedia two-column threshold
- Scale icon from lucide-react as visual annotation cue for case law margin notes
- line-clamp-4 (up from 3) for narrow margin-note column — shows more summary in constrained width

Phase 34-01 decisions:
- Label-only rename: user-facing text changed, internal identifiers (fixerContext, isFixerMode, /fixer routes) preserved for backward compatibility
- 'Guide' (shortened) used in space-constrained mobile contexts: bottom nav, mode toggle, mode indicator
- CommandSearch keywords expanded with 'install', 'guide', 'installation' for discoverability

Phase 34-02 decisions:
- Changed COP cross-links to /encyclopedia/cop/ routes ahead of full migration
- SupplementaryDetailCard shows "Installation Guide" label instead of dynamic relationshipType
- Step/warning count fields are optional — card renders gracefully without data

Carried from v1.4:
- InlineCaseLaw replaces LinkedFailuresList (summary visible without click)
- Fixer mode defaults to Installation tab (practical first)
- "View in COP" banner on Fixer detail pages now links to /encyclopedia/cop/ routes

### Pending Todos

None

### Blockers/Concerns

- Cross-linking system: RESOLVED in 31-01/31-02 — Full pipeline from ReferenceResolver through CrossLinkEngine to CrossLinkedText rendering
- Link density control: RESOLVED in 31-01 — CrossLinkEngine enforces max 5 per paragraph + first-mention-only
- Content composition complexity: RESOLVED in 30-01 — parallel fetches from 4 tables via composeArticleContent
- Authority hierarchy: RESOLVED in 30-02 — emerald for HTG, amber for case law, grey for details, default prose for MRM COP
- Legislative typography requirements: need MBIE review checkpoint during Phase 33

## Session Continuity

Last session: 2026-02-12
Stopped at: Completed 34-01-PLAN.md and 34-02-PLAN.md -- Phase 34 complete
Resume file: None
Next action: Plan and execute Phase 35

---
*Last updated: 2026-02-12 after 34-01 execution*
