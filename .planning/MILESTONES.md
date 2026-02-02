# Milestones

## v1.1 — Unified COP Architecture (Complete)

**Shipped:** 2026-02-03

**Delivered:** Unified navigation and content system integrating authoritative MRM Code of Practice with supplementary RANZ Installation Guides, featuring clear visual distinction, cross-source linking, and consent-mode search for Building Code citation.

**Phases completed:** 7-12 (20 plans)

| Phase | Name | What Shipped |
|-------|------|--------------|
| 7 | Data Model Foundation | Topics, detail_links, legislative references, 13 semantic topics |
| 8 | Visual Authority System | Blue/grey authority styling, capability badges, version watermarks |
| 9 | Unified Navigation | Topic browse, source/capability filters, section navigation |
| 10 | Detail Page Enhancement | Content borrowing, image gallery, related content tab |
| 11 | Search Enhancement | MRM 2x boost, grouped results, consent mode, section redirect |
| 12 | Content Linking Population | 274 link suggestions, admin UI, E2E tests |

**Stats:**
- 86 commits, 4 days (2026-01-31 → 2026-02-03)
- 54,323 lines TypeScript total
- 23 requirements satisfied

**Git range:** `feat(07-01)` → `feat(12-02)`

**Key accomplishments:**
- Visual Authority System distinguishing MRM (authoritative) from RANZ (supplementary)
- Topic-based unified navigation with source and capability filters
- Content borrowing: MRM details display linked RANZ 3D models and steps
- Enhanced search with consent mode for Building Code citation
- Cross-source linking infrastructure with admin approval workflow

**What's next:** Production deployment, user acceptance testing, BCA engagement (v1.2)

---

## v1.0 — Core COP Platform (Complete)

**Shipped:** January 2026

**Phases completed:** 1-6

| Phase | Name | What Shipped |
|-------|------|--------------|
| 1 | MRM Content Enhancement | 528 quality steps, 159 warnings, NZBC links |
| 2 | Failure Cases Integration | 86 case law entries linked to details |
| 3 | QA Checklists | Photo capture, PDF export, checklist persistence |
| 4 | Search Enhancement | Full-text search, filters, voice search, code jump |
| 5 | Offline/PWA | Service worker, substrate packages, sync queue |
| 6 | Polish & Performance | 87% TBT reduction, accessibility, E2E tests |

**Validated requirements:**
- Multi-source content architecture
- 312 total details (251 MRM + 61 RANZ)
- 3D model viewer with step sync
- Dual-mode navigation (Planner/Fixer)
- Failure case warnings on detail cards
- QA checklists with photo capture
- Full offline capability
- Admin CMS

---
*Last updated: 2026-02-03*
