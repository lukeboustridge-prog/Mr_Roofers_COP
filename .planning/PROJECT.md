# Master Roofers Code of Practice

## What This Is

A Next.js 14 Progressive Web App that transforms New Zealand's roofing Code of Practice from static PDFs into an interactive, context-aware mobile-first knowledge system. Features unified navigation across MRM (authoritative) and RANZ (supplementary) sources, 3D detail viewers with step synchronization, dynamic warnings from real failure cases, consent-mode search for Building Code citation, cross-source content linking, QA checklists, and offline functionality. Built for NZ roofers who need quick access to correct installation details both in the office (Planner mode) and on-site (Fixer mode).

## Core Value

Three-click access to authoritative roofing details with clear source attribution for Building Code citation — works offline on job sites.

## Current Milestone: v1.2 Digital COP

**Goal:** Restructure app navigation to mirror the MRM COP PDF's 19-chapter structure so roofers can navigate the digital version exactly as they would the printed document, with supplementary content (3D models, HTG guides, case law) surfacing inline as collapsible panels.

**Target features:**
- COP Reader navigation mirroring all 19 chapters with section numbers (e.g. "8.5.4 Change of Pitch")
- All chapters rendered as browsable rich text with inline technical diagrams (775 MRM images)
- Inline collapsible supplementary panels (RANZ 3D, HTG guides, failure cases)
- HTG content extraction from PDF (Flashings, Penetrations, Cladding guides)
- Section number deep-linking (navigate directly to any COP section reference)
- Fixer mode preserved as-is for on-site quick access

**Rationale:** Every roofer in NZ already uses the MRM COP PDF. The app must feel like a digital upgrade of what they know — same structure, same section numbers — with the bonus of 3D models, installation guides, and case law appearing right where you need them.

## Previous State

**Version:** v1.1 (Unified COP Architecture) — Shipped 2026-02-03

**Content:**
- MRM COP: 251 details, 528 steps, 159 warnings (authoritative)
- RANZ Guide: 61 details, 287 steps, 61 3D models (supplementary)
- Case Law: 86 MBIE Determinations + LBP Complaints
- Cross-source Links: 274 suggestions (26 exact, 248 related)
- Topics: 13 semantic topics across sources
- MRM technical diagrams: 775 images (772 section-mapped, 201 detail-mapped)

**Features:**
- Visual Authority System (blue/grey distinction)
- Topic-based unified navigation with source/capability filters
- Content borrowing (MRM details show linked RANZ 3D/steps)
- Enhanced search with MRM boost, grouped results, consent mode
- Admin link management UI
- QA checklists with photo capture and PDF export
- Offline/PWA support

**Performance:**
- 87% reduction in Total Blocking Time (740ms → 90ms)
- Dynamic imports for Three.js and heavy components
- PWA with offline-first architecture

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

### Active

<!-- v1.2 Digital COP scope -->

**v1.2 Digital COP:**
- [ ] COP Reader: 19-chapter navigation mirroring MRM COP PDF structure
- [ ] Section-level content rendering with inline technical diagrams (775 images)
- [ ] Section number deep-linking and addressing (e.g. "8.5.4")
- [ ] Inline collapsible supplementary panels (3D models, HTG content, case law)
- [ ] HTG content extraction pipeline (Flashings, Penetrations, Cladding PDFs)
- [ ] HTG content linked to relevant MRM COP sections
- [ ] Planner mode becomes COP Reader (chapter-first navigation)
- [ ] Fixer mode preserved as quick on-site shortcut

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
- 54,323 lines TypeScript
- 12 phases complete (v1.0: phases 1-6, v1.1: phases 7-12)
- 35+ plans executed

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

---
*Last updated: 2026-02-08 after v1.2 milestone start*
