# Feature Landscape: Building Code Citation Requirements

**Domain:** NZ Building Code citation for industry Codes of Practice
**Researched:** 2026-01-31
**Overall Confidence:** MEDIUM (based on official MBIE documentation and existing precedents)

---

## Executive Summary

Achieving Building Code citation in New Zealand involves a clear hierarchy of recognition levels, each with distinct requirements. The MRM COP currently holds "recognised related document" status (non-mandatory comment reference in E2/AS1), which is the most accessible pathway for industry COPs. Full "incorporation by reference" under Section 405 of the Building Act 2004 requires formal MBIE process including public consultation.

**Key insight:** An interactive digital application is NOT a blocker to citation. The cited document is the underlying Code of Practice content, not its delivery format. The app should be viewed as an enhanced access layer to authoritative COP content.

---

## Citation Status Levels (NZ Building Code System)

| Level | Legal Status | Example | Requirements |
|-------|--------------|---------|--------------|
| **Incorporated by Reference** | Mandatory compliance pathway | NZS 4229:2013, AS/NZS 3500 | Section 405 process, Gazette notice, public consultation |
| **Cited in Acceptable Solution** | Named in AS/VM document | CCANZ CP 01:2014 (E2/AS3) | MBIE approval, version-specific citation |
| **Recognised Related Document** | Non-mandatory comment reference | CP NZ MR&WC (E2/AS1) | Industry authority, technical accuracy |
| **Supporting Guidance** | No formal status | BRANZ bulletins, manufacturer specs | N/A |

**MRM COP Current Status:** Recognised Related Document - E2/AS1 refers users to the COP "for additional guidance in a number of places where more detail is required, although this is in the form of non-mandatory comment only."

---

## Table Stakes

Features required for any Building Code citation pathway. Missing these would harm or prevent citation prospects.

### 1. Specific Version Identification

**Requirement:** All cited documents must be version-specific with clear identification.

| Element | Requirement | Current MRM Format | Gap |
|---------|-------------|-------------------|-----|
| Version number | Explicit in title | v25.12 | OK |
| Effective date | Clear validity start | 1 December 2025 | OK |
| Document ID | Consistent identifier | "CP NZ MR&WC" | OK |
| Publisher | Clearly stated | NZMRM Inc. | OK |
| Amendment tracking | Record of changes | Revision history section | OK |

**Confidence:** HIGH (verified from [Operating Protocol](https://www.building.govt.nz/building-code-compliance/how-the-building-code-works/standards/operating-protocol-referencing-standards-in-the-building-code-system))

### 2. Normative vs Informative Content Separation

**Requirement:** Clear differentiation between mandatory requirements and guidance.

| Language | Meaning | Use In |
|----------|---------|--------|
| "Shall" / "Must" | Mandatory requirement | Normative content |
| "May" | Permitted situation | Normative content |
| "Should" | Recommendation | Informative content only |

**Critical:** Content beyond Building Code scope must be "stated explicitly in the standard and organised into a separate part, such as an informative appendix, or excluded from the citation."

**Gap for Digital App:** The app must clearly distinguish between:
- Normative MRM COP requirements (mandatory for compliance)
- Informative RANZ installation guidance (supplementary recommendations)
- User-generated content (QA checklists, notes)

**Confidence:** HIGH (verified from [Standards NZ](https://www.standards.govt.nz/news-and-updates/normative-vs-informative))

### 3. Building Code Clause Alignment

**Requirement:** Content must align with NZBC objectives without contradiction.

| NZBC Clause | COP Coverage | Status |
|-------------|--------------|--------|
| B1 Structure | Fastening, load requirements | Covered |
| B2 Durability | Corrosion protection, material life | Covered |
| E1 Surface Water | Roof drainage design | Covered |
| E2 External Moisture | Flashings, penetrations, weathertightness | Covered (primary) |
| E3 Internal Moisture | Condensation, vapour management | Covered |

**Requirement:** "Standards shall not require compliance with any Building Code clause, acceptable solution or verification method" (circular reference prohibition).

**Confidence:** HIGH (verified from [MBIE Operating Protocol](https://www.building.govt.nz/building-code-compliance/how-the-building-code-works/standards/operating-protocol-referencing-standards-in-the-building-code-system))

### 4. No Commercial/Contractual Content

**Requirement per Section 25(2) Building Act 2004:** Acceptable solutions cannot contain provisions relating to:
- Contractual or commercial requirements
- Regulatory approvals, dispensations, or waivers
- Content inconsistent with the Act or regulations

**Implication:** The COP content itself must be purely technical. Commercial elements (membership benefits, pricing, warranties) must be completely separated.

**Confidence:** HIGH (verified from Building Act 2004)

### 5. Public Accessibility

**Requirement:** Referenced material must be available for inspection.

Current MRM COP: Available online at metalroofing.org.nz/cop (registration required for full access).

**Gap:** If pursuing higher citation status, the full cited content may need to be "available for inspection free of charge at MBIE's Wellington office" or through Standards New Zealand.

**Confidence:** MEDIUM (requirement clear but application to industry COPs vs formal standards unclear)

### 6. Complete and Unambiguous Requirements

**Requirement:** "Requirements must be complete and unambiguous with precise and quantifiable terms wherever feasible."

| Good Practice | Poor Practice |
|--------------|---------------|
| "Minimum 150mm end lap" | "Adequate overlap" |
| "0.55mm BMT G550 steel" | "Suitable gauge steel" |
| "Maximum 900mm fixing centres" | "Appropriate spacing" |

**Confidence:** HIGH (verified from Operating Protocol)

---

## Differentiators

Features that enhance usability without compromising citation authority. These make the COP more valuable while maintaining regulatory status.

### 1. Multi-Source Attribution System

**Value:** Unified access to multiple authoritative sources while maintaining clear provenance.

| Source | Content Type | Citation Approach |
|--------|--------------|-------------------|
| MRM COP | Normative technical requirements | "Source: CP NZ MR&WC v25.12, Section X.X" |
| RANZ Guide | Informative installation guidance | "Installation Guidance: RANZ Installation Guide" |
| MBIE E2/AS1 | Regulatory context | "NZBC Reference: E2/AS1 Clause X.X" |
| Case Law | Learning from failures | "Related: MBIE Determination [number]" |

**Implementation:** Each detail/step in the app should display clear source attribution. This supports citation by making the authoritative source explicit.

**Complexity:** Medium
**Impact:** High (enables unified experience while preserving citation integrity)

### 2. Warning Conditions Linked to NZBC

**Value:** Dynamic warnings that reference Building Code clauses strengthen the COP's regulatory alignment.

| Warning Type | NZBC Link | Example |
|--------------|-----------|---------|
| Pitch restrictions | E2/AS1 Table 1 | "Below 8 degrees requires specific engineering design per E2/AS1" |
| Wind zone requirements | B1/AS1, E2/AS1 | "Very High wind zone requires fixing centres per Table X" |
| Corrosion zone restrictions | B2 Durability | "Zone D requires minimum 0.55mm ZM275 coating" |

**Current Status:** 159 warnings already in system. Enhancement: Add explicit NZBC clause references to each warning.

**Complexity:** Low (metadata enhancement to existing warnings)
**Impact:** High (directly supports compliance pathway narrative)

### 3. Case Law Integration

**Value:** Linking COP content to MBIE Determinations and LBP decisions demonstrates real-world consequence of non-compliance.

**Current Status:** 86 cases already linked. This is a significant differentiator not found in the static PDF COP.

**Citation Support:** Case law references strengthen the "acceptable trade practice" argument by showing what practices have been deemed non-compliant.

**Complexity:** N/A (already implemented)
**Impact:** High (unique value proposition)

### 4. QA Checklist Generation

**Value:** Converting normative requirements into auditable checklists supports verification of compliance.

**Citation Support:** Demonstrates that the COP content can be systematically verified, supporting the "verification method" aspect of compliance pathways.

**Complexity:** N/A (already implemented)
**Impact:** Medium (practical application of requirements)

### 5. Step-by-Step Installation Guides

**Value:** Breaking requirements into sequential steps improves implementability.

**Citation Consideration:** Installation steps should clearly indicate:
- Which steps are normative (derived from MRM COP requirements)
- Which steps are informative (RANZ best practice guidance)

**Complexity:** Low (labeling enhancement)
**Impact:** Medium (supports implementability requirement)

### 6. 3D Visualisation

**Value:** Enhanced understanding of spatial relationships and assembly sequences.

**Citation Consideration:** 3D models are supplementary visual aids - they do not replace normative technical specifications. The underlying technical data must still meet citation requirements.

**Risk:** Users relying on visual approximation rather than specified dimensions. Mitigation: Always display normative specifications alongside 3D views.

**Complexity:** N/A (already implemented)
**Impact:** Medium (accessibility enhancement)

---

## Anti-Features

Features or practices that would harm citation prospects. Explicitly avoid these.

### 1. Mixing Commercial Content with Technical Requirements

**Risk:** Section 25(2) prohibits contractual/commercial provisions in citable documents.

**Anti-Pattern:**
- "RANZ members receive priority support for this detail"
- "Contact [supplier] for approved materials"
- "This method requires [brand] products"

**Correct Approach:** Complete separation of commercial and technical content. Technical COP content contains NO references to membership, pricing, or specific suppliers.

### 2. Blending Sources Without Attribution

**Risk:** If RANZ installation guidance is presented as MRM COP content, it misrepresents the normative authority.

**Anti-Pattern:**
- Displaying RANZ guide content under "MRM COP" heading
- Merging step sequences from different sources without identification
- Creating "unified" content that obscures original source

**Correct Approach:** Every piece of content displays its authoritative source. Users always know whether they're viewing MRM COP (normative) or RANZ Guide (informative).

### 3. User-Editable Normative Content

**Risk:** If users can modify or annotate normative COP content, the cited document becomes unreliable.

**Anti-Pattern:**
- "Edit this requirement"
- User notes displayed inline with normative specifications
- Company-specific modifications to COP content

**Correct Approach:** Normative COP content is read-only. User notes, checklists, and annotations are clearly separated in distinct UI areas.

### 4. Ambiguous Modal Language

**Risk:** Using "should" where "shall" is required (or vice versa) undermines citation credibility.

**Anti-Pattern:**
- "Flashings should overlap by 150mm" (if this is a requirement)
- "All penetrations shall be sealed appropriately" (if "appropriately" is undefined)

**Correct Approach:** Preserve exact language from source COP. If MRM says "shall," display "shall." If RANZ says "should," display "should."

### 5. Presenting App-Generated Content as COP Content

**Risk:** AI-generated summaries, automated warnings, or computed values may be incorrect.

**Anti-Pattern:**
- "Based on your settings, you need..." (if computed values)
- Summaries that paraphrase normative requirements
- Automated recommendations not from source documents

**Correct Approach:** Clearly distinguish between:
- Direct COP content (verbatim or near-verbatim from source)
- Computed/derived information (clearly labeled as "calculated" or "estimated")
- App features (search results, filters, navigation)

### 6. Version Drift

**Risk:** If the app content doesn't match the cited COP version, citation is invalid.

**Anti-Pattern:**
- Updating individual details without version control
- Mixing content from different COP versions
- No clear indication of which COP version the app reflects

**Correct Approach:**
- Single source of truth: App content derives from specific COP version
- Version displayed prominently: "Content reflects CP NZ MR&WC v25.12"
- Update process: When COP updates, app updates as coordinated release

---

## Feature Dependencies for Citation Pathway

```
Pathway to Citation:

[Current State]                     [Target State]
    |                                    |
    v                                    v
Recognised Related         ->      Cited in Acceptable
Document (E2/AS1 comment)         Solution (E2/AS3 model)
    |                                    |
    +-- Version ID: OK                   +-- MBIE approval required
    +-- Publisher: OK                    +-- Public consultation (s.409)
    +-- Technical accuracy: OK           +-- Gazette notice
    +-- Normative/informative: GAP       +-- Version-specific citation
    +-- Source attribution: GAP          |
    +-- No commercial: OK                +-- ALL Table Stakes met
                                         +-- Formal submission to MBIE
```

### Priority Sequence for Features

1. **Normative/Informative Separation** - Must have for any citation improvement
2. **Source Attribution System** - Required for multi-source architecture credibility
3. **NZBC Reference Links** - Strengthens alignment argument
4. **Version Control System** - Ensures cited content matches app content
5. **Case Law Integration** - Differentiator already implemented

---

## MVP Recommendation for Citation Pathway

### Immediate (Maintain Current Status)

Keep "recognised related document" status by ensuring:
- [ ] Version identifier displayed prominently in app
- [ ] Publisher (NZMRM Inc.) attribution clear
- [ ] No commercial content mixed with technical
- [ ] Technical accuracy maintained

### Short-term (Strengthen Position)

Enhance toward potential formal citation:
- [ ] Clear normative vs informative labeling on all content
- [ ] Source attribution badges on all details/steps
- [ ] NZBC clause references added to warnings
- [ ] Amendment tracking visible to users

### Long-term (Formal Citation Pathway)

To pursue formal E2/AS citation (like CCANZ CP 01:2014):
- [ ] Engage MBIE Building Performance team
- [ ] Participate in Building Code update consultation cycles
- [ ] Ensure COP meets all Operating Protocol criteria
- [ ] Prepare for public consultation under s.409

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Citation pathway structure | HIGH | Based on Building Act 2004 and MBIE Operating Protocol |
| Normative/informative requirements | HIGH | Verified from Standards NZ and MBIE |
| Multi-source attribution approach | MEDIUM | Logical inference - no direct precedent found for digital COPs |
| Digital app compatibility | MEDIUM | No explicit guidance found - app is access layer, not the cited document |
| Formal citation process | MEDIUM | General process clear, specific industry COP pathway less documented |

---

## Sources

**Official Documentation:**
- [Operating Protocol - Referencing Standards](https://www.building.govt.nz/building-code-compliance/how-the-building-code-works/standards/operating-protocol-referencing-standards-in-the-building-code-system)
- [Tier Framework for Standards](https://www.building.govt.nz/building-code-compliance/how-the-building-code-works/standards/operating-protocol-tier-framework-to-support-standards-in-the-building-code-system)
- [Acceptable Solutions and Verification Methods](https://www.building.govt.nz/building-code-compliance/how-the-building-code-works/different-ways-to-comply/acceptable-solutions-and-verification-methods)
- [E2/AS1 Information](https://www.building.govt.nz/building-code-compliance/e-moisture/e2-external-moisture/acceptable-solutions-and-verification-methods)
- [2025 Building Code Update](https://www.building.govt.nz/building-code-compliance/annual-building-code-updates/2025-building-code-update)

**Industry Examples:**
- [CP NZ MR&WC on CodeHub](https://codehub.building.govt.nz/resources/cp-new-zealand-metal-roof-and-wall-cladding-code-of-practice)
- [MRM COP Online](https://www.metalroofing.org.nz/cop)
- [CCANZ CP 01:2014](https://codehub.building.govt.nz/resources/ccanz-cp-012014)
- [NZS 4229:2013](https://codehub.building.govt.nz/resources/42292013nzs)

**Standards and Terminology:**
- [Standards NZ - Normative vs Informative](https://www.standards.govt.nz/news-and-updates/normative-vs-informative)
- [Building Act 2004 - Section 405](https://www.legislation.govt.nz/act/public/2004/0072/latest/DLM309073.html)

---

*Last updated: 2026-01-31*
