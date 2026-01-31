# Project Research Summary

**Project:** Master Roofers Code of Practice - Unified COP Architecture (v1.1)
**Domain:** Multi-source technical documentation with Building Code citation requirements
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

This project integrates two complementary content sources into a unified roofing knowledge system: the NZMRM Code of Practice (251 details, 528 steps, 159 warnings, 431 images) which is already cited by E2/AS1 as an authoritative Building Code compliance pathway, and the RANZ Roofing Guide (61 details, 287 steps, 61 3D models) which provides rich installation guidance. The sources have zero overlapping categories, making them naturally complementary rather than competing. The MRM COP provides technical breadth with warnings and case law; RANZ provides installation depth with 3D models and step-by-step guides.

The recommended approach is a **topic-based unification architecture** that links content through semantic relationships while preserving strict source attribution. Users navigate to a topic (e.g., "Flashings") and see all relevant content from both sources, with MRM content clearly marked as authoritative ("Code of Practice") and RANZ content marked as supplementary ("Installation Guide"). This maintains Building Code citation integrity while providing the richest possible user experience.

The critical risk is **authority dilution** — if MRM and RANZ content appear with identical visual treatment, Building Consent Authorities cannot rely on the digital COP as consent evidence, and MBIE may decline to cite a digital version that blurs authoritative boundaries. Prevention requires visual hierarchy where MRM content has distinct, premium treatment (authority badges, bordered sections), and RANZ content is clearly secondary. Version tracking is equally critical: E2/AS1 cites specific versions, so the app must display exactly which COP version is shown and provide audit trails for content fidelity.

## Key Findings

### Recommended Stack Changes

The existing schema already supports multi-source content through `contentSources` and `sourceId` fields. The integration requires three additive schema changes:

**Core data changes needed:**
- **detail_links table**: Links MRM details to RANZ installation guides with explicit authority hierarchy (primaryDetailId = MRM, supplementaryDetailId = RANZ)
- **topics table + category_topics**: Groups semantically-related categories from multiple sources (e.g., "Flashings" topic maps to both `lrm-flashings` and `ranz-flashings` categories)
- **legislative_references table**: Normalizes standards refs for proper Building Code citation format (E2/AS1 Amendment 15 Table 20)

**Query-time computation** for content availability flags (has3DModel, hasSteps, hasWarnings, hasCaseLaw) is recommended initially. Denormalize to materialized views only if listings become slow (>500ms for 20 items).

### Expected Features

**Must have (table stakes for citation):**
- Specific version identification displayed prominently (MRM COP v25.12)
- Normative vs informative content separation (MRM "shall" vs RANZ "should")
- Source attribution on every content block
- No commercial content mixed with technical requirements
- Complete and unambiguous requirements with precise terms

**Should have (differentiators):**
- Multi-source unified navigation (one topic shows MRM + RANZ content)
- Warning conditions linked to NZBC clauses (159 warnings already exist)
- Case law integration (86 cases already linked)
- 3D visualization with step synchronization (61 RANZ models)
- QA checklist generation from normative requirements

**Anti-features (explicitly avoid):**
- Mixing commercial content with technical requirements
- Blending sources without attribution
- User-editable normative content
- Ambiguous modal language (preserve exact "shall"/"should" from sources)
- App-generated summaries presented as COP content

### Architecture Approach

The architecture uses **topic-based unification** where semantic topics (Flashings, Penetrations, Valleys, etc.) map to multiple source-specific categories. This preserves existing category IDs (no breaking changes) while enabling unified navigation. Detail cross-references link MRM technical specs to RANZ installation guides with explicit relationship types (`installation-guide`, `alternative`, `companion`).

**Major components:**
1. **Topics layer**: New abstraction grouping categories across sources
2. **Detail linking**: Cross-references with authority hierarchy (MRM primary, RANZ supplementary)
3. **Unified DetailViewer**: Composes content from linked sources (MRM specs + RANZ 3D/steps)
4. **Source attribution system**: Visual badges and styling distinguishing authority levels
5. **Content capability flags**: Real-time computation of has3DModel, hasSteps, etc.

### Critical Pitfalls

1. **Authority dilution through equal treatment** — Presenting MRM and RANZ with identical visual hierarchy makes consent evidence unreliable. **Prevention:** MRM gets "authoritative blue" treatment with COP badge; RANZ gets "supplementary grey" with Installation Guide badge. Source indicator on EVERY content block.

2. **Version mismatch breaking citation chain** — E2/AS1 cites specific versions. Content drift invalidates citation. **Prevention:** Version watermark on all MRM content ("MRM COP v25.12"), immutable version snapshots in database, admin-controlled "current for citation" version flag.

3. **Supplementary content contradicting authoritative requirements** — RANZ guidance with different specs than MRM creates liability. **Prevention:** Automated conflict detection, editorial constraint that RANZ can ENHANCE but not CONTRADICT MRM, warning banner on conflicting content.

4. **Blended search undermining authority** — Full-text search may rank richer RANZ content above MRM. **Prevention:** MRM content weighted 2x in search, grouped results showing MRM first, "Consent mode" toggle hiding supplementary content.

5. **Navigation misaligning with COP structure** — Digital task-based nav breaks section number references. **Prevention:** Dual navigation preserving COP chapter/section structure alongside task-based Fixer mode.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Data Model Foundation
**Rationale:** Schema changes must come first — all UI work depends on the linking architecture being in place. The detail_links and topics tables are prerequisites for unified navigation.
**Delivers:**
- detail_links table with MRM-RANZ linking
- topics and category_topics tables
- Migration scripts populating initial topic mappings
- Query functions: getDetailsByTopic, getDetailWithRelatedContent
**Addresses:** Multi-source attribution (Table Stakes #1), Content availability flags (Differentiator)
**Avoids:** Authority dilution (Pitfall #1) by building source hierarchy into data model

### Phase 2: Visual Authority System
**Rationale:** Before any UI changes go live, the authority distinction system must be in place. This is the highest-risk pitfall and must be addressed early.
**Delivers:**
- AuthoritativeContent and SupplementaryContent component wrappers
- SourceBadge variants for MRM (authoritative) and RANZ (supplementary)
- ContentCapabilityBadges (3D, steps, warnings, case law indicators)
- Version watermark component showing COP version
**Addresses:** Normative vs informative separation (Table Stakes #2), Source attribution (Table Stakes #3)
**Avoids:** Authority dilution (Pitfall #1), Version mismatch (Pitfall #2)

### Phase 3: Unified Navigation
**Rationale:** With data model and visual system in place, implement topic-based unified navigation that shows content from all sources.
**Delivers:**
- TopicCategoryPage showing details from all sources under a topic
- Source filter tabs (All / MRM COP / RANZ Guide)
- Capability filters (Has 3D, Has Steps, Has Warnings)
- Updated breadcrumbs for topic navigation
**Addresses:** Multi-source unified navigation (Differentiator), 3D visualization access
**Implements:** Topic-based architecture pattern

### Phase 4: Detail Page Enhancement
**Rationale:** Enhance the DetailViewer to compose content from linked sources — MRM specs/warnings with RANZ 3D/steps.
**Delivers:**
- Enhanced DetailViewer with linked guide integration
- "Related" tab showing cross-source content
- Installation tab preferring RANZ steps when linked, falling back to MRM
- ImageGallery component for MRM image display
**Uses:** detail_links queries, AuthoritativeContent wrappers
**Addresses:** 3D visualization with step sync (Differentiator), Step-by-step guides (Differentiator)

### Phase 5: Search Enhancement
**Rationale:** Search must respect authority hierarchy to avoid users finding supplementary content when they need authoritative content.
**Delivers:**
- Source-weighted search (MRM 2x boost)
- Grouped search results (MRM section first, then RANZ)
- Consent mode toggle hiding supplementary content
- Section number search (type "4.3.2" to jump to COP section)
**Avoids:** Blended search undermining authority (Pitfall #4)

### Phase 6: Content Linking Population
**Rationale:** With all infrastructure in place, populate the cross-references between MRM details and RANZ installation guides.
**Delivers:**
- Script mapping MRM details to RANZ guides by code/name matching
- Validation of all RANZ guides linked to appropriate MRM details
- QA testing of all four content scenarios (MRM-only, RANZ-only, Both linked, Neither)
- Documentation of unmapped content
**Addresses:** Full unification of 251 MRM + 61 RANZ details

### Phase Ordering Rationale

- **Data model first:** All UI depends on the linking tables being in place. Cannot show unified navigation without topics table.
- **Visual authority before navigation:** Showing unified content without clear source distinction is dangerous — better to delay feature than launch with authority dilution.
- **Navigation before detail enhancement:** Users need to find content before we enhance how it's displayed.
- **Search last (before content):** Search enhancement is optimization; core value is navigating and viewing content.
- **Content linking last:** The feature works without all links populated; we can incrementally improve coverage.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Search Enhancement):** Search weighting and grouping algorithms need careful tuning. May need A/B testing to validate authority is preserved.
- **Phase 6 (Content Linking):** Semantic matching between MRM and RANZ requires manual review. Automated matching will have false positives/negatives.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Data Model):** Standard Drizzle migration patterns, well-documented.
- **Phase 2 (Visual System):** Standard React component composition, Tailwind styling.
- **Phase 3 (Navigation):** Extends existing patterns in codebase.
- **Phase 4 (Detail Page):** Enhances existing DetailViewer component.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All changes are additive to existing schema; patterns proven in similar systems |
| Features | HIGH | Based on official MBIE documentation and Building Act requirements |
| Architecture | HIGH | Derived from existing codebase patterns; no external dependencies |
| Pitfalls | HIGH | Citation requirements directly from Building Act and MBIE Operating Protocol |

**Overall confidence:** HIGH

### Gaps to Address

- **Semantic matching algorithm:** How to automatically link MRM details to RANZ guides needs definition. Recommend starting with exact code matching (MRM "F07" to RANZ "F07"), then manual review for partial matches.
- **BCA acceptance validation:** No pre-engagement with Building Consent Authorities planned. Recommend pilot with Auckland, Wellington, Christchurch BCAs before full launch.
- **Conflict detection automation:** How to detect when RANZ content contradicts MRM specs needs technical specification. May require manual editorial process initially.
- **Version snapshot implementation:** Immutable versioning adds complexity. May start with simple version field and add audit trail later.

## Sources

### Primary (HIGH confidence)
- [MBIE Operating Protocol - Referencing Standards](https://www.building.govt.nz/building-code-compliance/how-the-building-code-works/standards/operating-protocol-referencing-standards-in-the-building-code-system)
- [MBIE Acceptable Solutions and Verification Methods](https://www.building.govt.nz/building-code-compliance/how-the-building-code-works/different-ways-to-comply/acceptable-solutions-and-verification-methods)
- [Building CodeHub - NZMRM COP](https://codehub.building.govt.nz/resources/cp-new-zealand-metal-roof-and-wall-cladding-code-of-practice)
- [Standards NZ - Normative vs Informative](https://www.standards.govt.nz/news-and-updates/normative-vs-informative)
- Existing codebase: `lib/db/schema.ts`, `lib/db/queries.ts`, `components/details/DetailViewer.tsx`

### Secondary (MEDIUM confidence)
- [Many-to-Many Database Relationships](https://www.beekeeperstudio.io/blog/many-to-many-database-relationships-complete-guide) — Junction table patterns
- [Visual Hierarchy in UX](https://www.interaction-design.org/literature/article/visual-hierarchy-organizing-content-to-follow-natural-eye-movement-patterns) — Authority visual treatment

### Tertiary (LOW confidence)
- Digital COP compatibility with citation — No explicit MBIE guidance found. App is access layer to cited document, should be acceptable.

---
*Research completed: 2026-01-31*
*Ready for roadmap: yes*
