# Master Roofers Code of Practice

## What This Is

A Next.js 14 Progressive Web App that transforms New Zealand's roofing Code of Practice from static PDFs into an interactive, context-aware mobile-first knowledge system. Features unified navigation across MRM (authoritative) and RANZ (supplementary) sources, 3D detail viewers with step synchronization, dynamic warnings from real failure cases, consent-mode search for Building Code citation, cross-source content linking, QA checklists, and offline functionality. Built for NZ roofers who need quick access to correct installation details both in the office (Planner mode) and on-site (Fixer mode).

## Core Value

Three-click access to authoritative roofing details with clear source attribution for Building Code citation — works offline on job sites.

## Current Milestone: v1.3 Content Quality & Completeness

**Goal:** Make every detail page actionable for a roofer — real installation steps, correct images, working 3D models, condition-aware warnings.

**Target features:**
- RANZ installation steps become primary on 61 matched details (not supplementary borrowed content)
- 190 MRM-only details show inline COP section excerpts + deep-link (replace section-ref fake steps)
- HTG guide pages mapped to specific details (detail-level, not just chapter-level)
- 775 MRM technical diagrams connected to detail records
- 138 condition-aware warnings populated with wind/corrosion/pitch logic
- 3D viewer polish — verify V3D color extraction across all 61 models, test stage transitions and transparency

## Previous State

**Version:** v1.2 (Digital COP) — Shipped 2026-02-08

The app provides a digital COP Reader mirroring the MRM COP PDF's 19-chapter structure. Planner mode opens the COP Reader (chapter-first navigation), while Fixer mode remains as the quick on-site access path.

**Content:**
- MRM COP: 251 details, 528 steps, 159 warnings (authoritative)
- RANZ Guide: 61 details, 287 steps, 61 3D models (supplementary)
- Case Law: 86 MBIE Determinations + LBP Complaints
- Cross-source Links: 274 suggestions (26 exact, 248 related)
- HTG: 350 page records from 3 PDFs, 484 section mappings
- MRM technical diagrams: 775 images (772 section-mapped, 201 detail-mapped)

**Key issue discovered:** MRM "steps" are COP section references (e.g. "5.1", "5.1A"), not actionable installation instructions. RANZ guides have real procedures but are shown as supplementary borrowed content. HTG mapped at chapter level only. Images/warnings not connected to detail records.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

**v1.0 Core Platform:**
- ✓ Multi-source content architecture (MRM + RANZ + Membrane placeholder) — v1.0
- ✓ MRM data import (251 details, 528 steps - enhanced quality) — v1.0
- ✓ RANZ data import (61 details, 287 steps, 61 3D models) — v1.0
- ✓ 3D step synchronization (camera animation, layer visibility) — v1.0
- ✓ Dual-mode navigation (Planner/Fixer modes) — v1.0
- ✓ User authentication (Clerk) — v1.0
- ✓ Favorites and view history — v1.0
- ✓ Failure cases integration (86 cases linked to details) — v1.0
- ✓ QA checklists with photo capture and PDF export — v1.0
- ✓ Full-text search with filters — v1.0
- ✓ Voice search (Web Speech API) — v1.0
- ✓ Offline/PWA support — v1.0
- ✓ Admin CMS for content management — v1.0
- ✓ Warning conditions system (159 content-derived warnings) — v1.0

**v1.1 Unified COP Architecture:**
- ✓ Visual distinction of authoritative vs supplementary content — v1.1
- ✓ Content capability badges on detail cards — v1.1
- ✓ Version watermark on authoritative content — v1.1
- ✓ Source attribution on all content blocks — v1.1
- ✓ Topic-based unified navigation — v1.1
- ✓ Source and capability filters — v1.1
- ✓ COP section structure navigation — v1.1
- ✓ Content borrowing (RANZ 3D/steps on linked MRM details) — v1.1
- ✓ Image gallery for MRM technical images — v1.1
- ✓ Related content cross-source links — v1.1
- ✓ Search with MRM 2x boost and grouped results — v1.1
- ✓ Consent mode for authoritative-only results — v1.1
- ✓ Cross-source link suggestion and admin management — v1.1

**v1.2 Digital COP:**
- ✓ COP Reader: 19-chapter navigation mirroring MRM COP PDF structure — v1.2
- ✓ Section-level content rendering with inline technical diagrams (775 images) — v1.2
- ✓ Section number deep-linking and addressing (e.g. "8.5.4") — v1.2
- ✓ Inline collapsible supplementary panels (3D models, HTG content, case law) — v1.2
- ✓ HTG content extraction pipeline (Flashings, Penetrations, Cladding PDFs) — v1.2
- ✓ HTG content linked to relevant MRM COP sections — v1.2
- ✓ Planner mode becomes COP Reader (chapter-first navigation) — v1.2
- ✓ Fixer mode preserved as quick on-site shortcut — v1.2

### Active

<!-- v1.3 Content Quality & Completeness -->

- [ ] RANZ steps promoted to primary on matched details
- [ ] MRM-only details show inline COP excerpts + link instead of section-ref steps
- [ ] HTG pages mapped to specific detail pages
- [ ] 775 images connected to detail records
- [ ] 138 warnings populated with condition logic
- [ ] 3D viewer V3D color extraction verified across all models

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real-time collaboration — complexity not justified for single-user workflow
- Video tutorials — storage/bandwidth costs, static content sufficient
- Multi-language support — NZ English only for v1
- User-editable normative content — would compromise citation integrity
- AI-generated COP summaries — cannot be cited as authoritative
- Blending sources without attribution — would cause authority dilution
- Real-time BCA API integration — no BCA APIs exist; requires manual process
- Membrane COP content import — source content not yet available

## Context

**Technical Stack:**
- Next.js 14 (App Router), Drizzle ORM, Neon PostgreSQL
- Clerk Auth, Cloudflare R2 (storage), Three.js + React Three Fiber
- Tailwind CSS + shadcn/ui, Zustand state management

**Codebase:**
- ~68,800 lines TypeScript
- 18 phases complete (v1.0: phases 1-6, v1.1: phases 7-12, v1.2: phases 13-18)
- 46+ plans executed

**Content gap analysis (2026-02-11):**
- RANZ GLB models use Verge3D S8S_v3d_material_data extension — all color data in custom node graphs, zero standard PBR properties. Runtime extraction needed.
- MRM extraction steps are COP section numbers, not installation procedures
- HTG extraction at page-level (350 records) but only mapped to chapter root sections
- 775 extracted images have R2 URLs but aren't linked to detail records
- 138 enhanced warnings in warnings_enhanced.json but not seeded to database

## Constraints

- **Tech stack**: Next.js 14 App Router — established, no migration
- **Storage**: Cloudflare R2 for all binary assets (models, images, PDFs)
- **Auth**: Clerk integration — RANZ ecosystem standard
- **Mobile-first**: All touch targets 48px+, offline required
- **Authority preservation**: MRM content must remain visually distinct from RANZ

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-source architecture | Allow MRM, RANZ, Membrane content to coexist | ✓ Good |
| R2 for case law PDFs | Git push timeout with 30MB PDFs | ✓ Good |
| Dynamic imports for 3D | 95% bundle reduction on detail pages | ✓ Good |
| Clerk auth with force-dynamic | Next.js static rendering conflicts | ✓ Good |
| MRM authoritative, RANZ supplementary | Preserve citation integrity for Building Code | ✓ Good |
| Blue border for authoritative | Visual distinction without text | ✓ Good |
| Bidirectional link model | supplements/supplementsTo arrays | ✓ Good |
| URL state for filters | Shareable links, back button support | ✓ Good |
| Content borrowing with attribution | Best of both sources with clarity | ✓ Good |
| Three-tier link confidence | exact/partial/related for admin review | ✓ Good |
| Hybrid COP data model | PostgreSQL hierarchy + static JSON text | ✓ Good |
| Single dynamic route for chapters/sections | Detect dots in param to distinguish | ✓ Good |
| Collapsible (not Accordion) for supplementary panels | Independent state per section | ✓ Good |
| Per-page HTG extraction | Granular linking (350 records vs 5 bulk) | ✓ Good |
| Additive mode transition | Change link destinations, preserve all routes | ✓ Good |
| V3D runtime color extraction | GLBs have no PBR data, parse S8S_v3d_material_data at load time | — Pending |
| RANZ steps as primary | RANZ has real installation procedures, MRM has section refs | — Pending |
| COP excerpt fallback for MRM-only details | Better than showing "5.1" as a step | — Pending |

---
*Last updated: 2026-02-11 after v1.3 milestone start*
