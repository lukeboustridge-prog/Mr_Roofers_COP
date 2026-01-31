# Master Roofers Code of Practice

## What This Is

A Next.js 14 Progressive Web App that transforms New Zealand's roofing Code of Practice from static PDFs into an interactive, context-aware mobile-first knowledge system. Features 3D detail viewers, dynamic warnings from real failure cases, step-by-step installation guides, QA checklists, and offline functionality. Built for NZ roofers who need quick access to correct installation details both in the office (Planner mode) and on-site (Fixer mode).

## Core Value

Three-click access to any roofing detail with context-aware warnings and real failure case learnings — works offline on job sites.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

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

### Active

<!-- Current scope. Building toward these. -->

**Milestone v1.1: Unified COP Architecture**

- [ ] Integrate MRM COP as authoritative structure backbone
- [ ] Map RANZ installation guides into MRM structure where applicable
- [ ] Dynamic detail pages showing only available content
- [ ] Rich metadata indicators (3D, images, steps, warnings, case law)
- [ ] Display MRM technical images as content (not just thumbnails)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real-time collaboration — complexity not justified for single-user workflow
- Video tutorials — storage/bandwidth costs, static content sufficient
- Multi-language support — NZ English only for v1

## Context

**Technical Stack:**
- Next.js 14 (App Router), Drizzle ORM, Neon PostgreSQL
- Clerk Auth, Cloudflare R2 (storage), Three.js + React Three Fiber
- Tailwind CSS + shadcn/ui, Zustand state management

**Content Sources:**
- MRM COP: 251 details, 528 steps, 159 warnings, thumbnails from R2
- RANZ Guide: 61 details, 287 steps, 61 3D models on R2
- Case Law: 86 MBIE Determinations + LBP Complaints linked to details

**Performance:**
- 87% reduction in Total Blocking Time (740ms → 90ms)
- Dynamic imports for Three.js and heavy components
- PWA with offline-first architecture

## Constraints

- **Tech stack**: Next.js 14 App Router — established, no migration
- **Storage**: Cloudflare R2 for all binary assets (models, images, PDFs)
- **Auth**: Clerk integration — RANZ ecosystem standard
- **Mobile-first**: All touch targets 48px+, offline required

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-source architecture | Allow MRM, RANZ, Membrane content to coexist | ✓ Good |
| R2 for case law PDFs | Git push timeout with 30MB PDFs | ✓ Good |
| Dynamic imports for 3D | 95% bundle reduction on detail pages | ✓ Good |
| Clerk auth with force-dynamic | Next.js static rendering conflicts | ✓ Good |

---
*Last updated: 2026-01-31 after milestone initialization*
