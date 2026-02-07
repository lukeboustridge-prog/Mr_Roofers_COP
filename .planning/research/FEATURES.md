# Feature Landscape: Digital COP Reader

**Domain:** Digital technical manual / code of practice reader with inline supplementary content
**Researched:** 2026-02-08
**Overall Confidence:** HIGH (based on established UX patterns from NN/g, ICC Digital Codes, EPUB standards, Docusaurus, and multiple technical documentation platforms)
**Milestone:** v1.2 Digital COP
**Supersedes:** v1.1 FEATURES.md (Building Code Citation Requirements -- archived content remains valid but is no longer the active research focus)

---

## Executive Summary

The v1.2 milestone transforms the app from a detail-centric navigation system (Planner mode: substrate > category > detail) into a document-mirroring COP Reader that matches the 19-chapter, 624-page MRM COP PDF structure that every NZ roofer already knows. The core challenge is presenting a deeply hierarchical technical document (4 levels: chapter > section > subsection > sub-subsection) as a mobile-first web app, while surfacing supplementary content (3D models, HTG installation guides, case law) inline without disrupting the reading flow.

Research across digital building code readers (ICC Digital Codes), documentation platforms (Docusaurus, GitBook), EPUB navigation standards, and UX research (Nielsen Norman Group) reveals a consistent set of patterns:

1. **Collapsible sidebar TOC** with scrollspy highlighting the current section is the universal standard for hierarchical document navigation
2. **Section number deep-linking** via URL fragments (e.g., `/cop/8#8.5.4`) is table stakes for any technical reference
3. **Progressive disclosure** via collapsible panels is the correct pattern for inline supplementary content -- keeps the reading flow clean while making enrichments available
4. **Scroll-based continuous reading** within a chapter (not pagination) is preferred for technical reference material where users scan for specific content
5. **The PDF section number is the user's mental model** -- the digital version must preserve these numbers exactly

**Key insight:** Users do not want a "reimagined" COP. They want the same document they already know, but faster to navigate, with supplementary content appearing right where they need it. The digital advantage is speed-of-access and enrichment, not reorganization.

---

## Table Stakes

Features users expect from a digital COP reader. Missing any of these would make the app feel inferior to the PDF.

### TS-1: Chapter-Level Navigation (TOC)

**Why expected:** Every technical document reader has a table of contents. The MRM COP PDF has one. Users will navigate by chapter name ("External Moisture Flashings") not by URL.

**What it means:**
- Persistent, accessible list of all 19 chapters with chapter numbers
- Tap a chapter to navigate to it
- Current chapter visually highlighted
- Available from any page in the COP Reader

**Complexity:** Medium
**Dependencies:** Existing section hierarchy data (sections_hierarchy.json already extracted with all 19 chapters)
**Existing feature overlap:** v1.1 SectionNavigation component exists but is detail-centric, not chapter-browsing

**Confidence:** HIGH -- universal pattern across ICC Digital Codes, Docusaurus, GitBook, EPUB readers

---

### TS-2: Section Number Preservation

**Why expected:** Roofers refer to sections by number. "Check 8.5.4" is how they communicate on site, in consent applications, and in dispute proceedings. If the digital version uses different numbering, it is useless for citation.

**What it means:**
- Every section, subsection, and sub-subsection displays its original MRM COP number (e.g., "8.5.4 Change of Pitch")
- Numbers are rendered prominently, not hidden in metadata
- Section numbers appear in breadcrumbs, TOC, and content headings
- Numbers match the PDF exactly -- no renumbering, no gaps

**Complexity:** Low (data already extracted in sections_hierarchy.json with correct numbering)
**Dependencies:** None -- data exists
**Existing feature overlap:** v1.1 has section numbers in search redirect

**Confidence:** HIGH -- this is the fundamental unit of reference for the COP

---

### TS-3: Section Deep-Linking

**Why expected:** Users share section references ("look at 8.5.4") and need to jump directly to a section from search results, external links, or typed references. ICC Digital Codes, legal databases, and every professional standards reader supports this.

**What it means:**
- URL scheme that maps to section numbers: e.g., `/cop/8#8.5.4` or `/cop/section/8.5.4`
- Search can detect section number patterns and navigate directly (existing v1.1 feature)
- Shareable URLs that land on the exact section
- Scroll-to-section on page load with visual highlight of target section
- Browser back button works correctly after section jumps

**Complexity:** Medium
**Dependencies:** TS-2 (section numbers must be rendered with stable IDs)
**Existing feature overlap:** v1.1 search detects section numbers and redirects

**Confidence:** HIGH -- standard web pattern using hash fragments or route params

---

### TS-4: Inline Technical Diagrams

**Why expected:** The MRM COP PDF contains 775 technical diagrams that are integral to understanding the content. A digital version without these diagrams is incomplete. Users expect to see the diagram right next to the text that references it, not in a separate gallery.

**What it means:**
- Diagrams rendered inline within their parent section's content
- Diagrams are zoomable/tappable for full-screen viewing on mobile (pinch-to-zoom)
- Figure numbers and captions preserved from the PDF
- Images load efficiently (lazy loading, responsive sizing)
- 772 of 775 images already mapped to sections; 201 mapped to specific details

**Complexity:** Medium (image mapping exists; rendering pipeline needs building)
**Dependencies:** R2 image storage (already configured), image manifest (already extracted)
**Existing feature overlap:** v1.1 ImageGallery and ImageLightbox components exist for detail pages

**Confidence:** HIGH -- images already extracted and section-mapped

---

### TS-5: Chapter Content Rendering

**Why expected:** The COP is primarily a text document with structured headings, paragraphs, tables, and figures. Users expect to read it as continuous prose within each chapter, just like the PDF but on screen.

**What it means:**
- Each chapter renders as scrollable rich text content
- Headings use proper hierarchy (h2 for sections, h3 for subsections, h4 for sub-subsections)
- Tables render as HTML tables (28 tables already extracted)
- Lists, bold text, and inline references preserved
- Content loads progressively for large chapters (Ch.4 Durability has 71 pages)

**Complexity:** High (content extraction exists as raw text; needs parsing into structured HTML/MDX)
**Dependencies:** sections_hierarchy.json content field, tables.json
**Existing feature overlap:** None -- v1.0/v1.1 rendered detail cards, not chapter prose

**Confidence:** HIGH -- the hardest part (extraction) is done; rendering is standard web

---

### TS-6: Breadcrumb Navigation

**Why expected:** In a 4-level hierarchy (chapter > section > subsection > sub-subsection), users need to know where they are and navigate upward. Breadcrumbs are the universal pattern for this.

**What it means:**
- Breadcrumb trail showing: COP Reader > Chapter 8: External Moisture Flashings > 8.5 Flashing Types > 8.5.4 Change of Pitch
- Each breadcrumb level is tappable to navigate up
- On mobile, show truncated breadcrumb (e.g., "... > 8.5 > 8.5.4") with tap-to-expand
- Breadcrumb updates as user scrolls through content (optional, connected to scrollspy)

**Complexity:** Low
**Dependencies:** TS-2 (section number hierarchy)
**Existing feature overlap:** v1.1 has breadcrumbs in Planner mode (substrate > category > detail)

**Confidence:** HIGH -- [NN/g breadcrumb guidelines](https://www.nngroup.com/articles/breadcrumbs/) confirm this as best practice for hierarchical content; mobile breadcrumbs need space-efficient treatment per [LogRocket](https://blog.logrocket.com/ux-design/designing-mobile-breadcrumbs/)

---

### TS-7: Collapsible TOC Sidebar / Drawer

**Why expected:** Technical documentation platforms (Docusaurus, GitBook, ICC Digital Codes, EPUB readers) universally provide a sidebar or drawer showing the document structure. On mobile, this becomes a slide-out drawer or bottom sheet.

**What it means:**
- Desktop: Fixed left sidebar showing chapter/section tree, collapsible categories
- Mobile: Slide-out drawer (hamburger icon) or bottom sheet showing TOC
- Current section highlighted (scrollspy integration)
- Expandable/collapsible chapter nodes showing nested sections
- Smooth scroll to section on tap

**Complexity:** Medium
**Dependencies:** TS-2 (section hierarchy data)
**Existing feature overlap:** v1.1 Sidebar component exists but is app-level navigation, not document TOC

**Pattern reference:** [Docusaurus sidebar](https://docusaurus.io/docs/sidebar) uses collapsible categories by default. [NN/g TOC guide](https://www.nngroup.com/articles/table-of-contents/) recommends in-page links for long-form content. Mobile should use [overlay/bottom sheet pattern per readest](https://deepwiki.com/readest/readest/5.3-sidebar-and-table-of-contents).

**Confidence:** HIGH -- universal pattern

---

### TS-8: Cross-Reference Navigation

**Why expected:** The MRM COP frequently references other sections internally (e.g., "See 16.9 Material Selection" within section 1.5). Users expect these to be clickable links, not dead text. This is one of the primary advantages of digital over PDF.

**What it means:**
- Internal COP cross-references parsed from content and rendered as links
- Tapping a cross-reference navigates to the referenced section
- Visual distinction for cross-reference links (e.g., section number styled as a link)
- Back navigation after following a cross-reference

**Complexity:** High (requires parsing section references from raw text content)
**Dependencies:** TS-3 (deep-linking infrastructure), TS-5 (content rendering)
**Existing feature overlap:** None

**Confidence:** MEDIUM -- the parsing of "See X.X.X" patterns from raw text will need robust regex/NLP; edge cases exist

---

### TS-9: Version Identification

**Why expected:** The COP is a versioned, controlled document. Users need to know they are viewing the current version. This is already partially implemented but must be prominent in the COP Reader view.

**What it means:**
- "COP v25.12 -- 1 December 2025" displayed prominently in COP Reader header or sidebar
- "Next update due: 1 March 2026" note
- Controlled document watermark consistent with PDF

**Complexity:** Low
**Dependencies:** None (metadata already available)
**Existing feature overlap:** v1.1 VersionWatermark component exists

**Confidence:** HIGH

---

## Differentiators

Features that make the digital COP genuinely better than the PDF. Not expected by users, but once experienced, they would not go back.

### D-1: Inline Supplementary Content Panels

**Value proposition:** This is the signature feature of v1.2. When reading about flashing types in section 8.5, a collapsible panel appears showing a relevant RANZ 3D model, an HTG installation guide, or related failure cases. The PDF cannot do this -- you would need to cross-reference a separate guide.

**What it means:**
- Collapsible/expandable panels within chapter content at relevant section boundaries
- Panel types: 3D Model Viewer, HTG Installation Guide, Case Law / Failure Cases, Related RANZ Detail
- Panels are collapsed by default (progressive disclosure -- do not disrupt reading flow)
- Clear visual distinction: grey border (supplementary) vs blue border (authoritative MRM content)
- Smooth expand/collapse animation
- Panels only appear where linked content exists (not every section gets one)

**How they surface:**
- Automatic: Based on existing detail_links (274 suggestions, 26 exact matches) and section-to-detail mapping
- Content type badges on panels (3D icon, video icon, case law icon)
- "Supplementary" label to maintain authority distinction

**Complexity:** High
**Dependencies:** TS-5 (chapter content rendering), existing detail_links infrastructure, existing 3D viewer, existing case law data
**Existing feature overlap:** v1.1 content borrowing shows RANZ 3D/steps on MRM detail pages -- this extends that concept to chapter-level reading

**Pattern reference:** [Progressive disclosure](https://www.interaction-design.org/literature/topics/progressive-disclosure) -- hide details until the user asks for them. Scientific journal pattern of [inline supplementary material in expandable boxes](https://www.sciencedirect.com/journal/information-sciences/about/news/inline-supplementary-material-ins).

**Confidence:** HIGH -- well-established UX pattern; the complexity is in content mapping, not UI

---

### D-2: Scrollspy Section Tracking

**Value proposition:** As users scroll through a long chapter, the sidebar TOC highlights which section they are currently reading. This provides constant orientation in a document where a single chapter can span 70+ PDF pages.

**What it means:**
- IntersectionObserver watches section headings as user scrolls
- TOC sidebar highlights the currently visible section
- Optional: reading progress indicator (percentage or progress bar) for the current chapter
- Mobile: Minimal current-section indicator in the header (e.g., "8.5.4" displayed in top bar)

**Complexity:** Medium
**Dependencies:** TS-7 (TOC sidebar), TS-2 (section IDs)

**Pattern reference:** [IntersectionObserver TOC](https://css-tricks.com/table-of-contents-with-intersectionobserver/) is the standard implementation. CSS-only scrollspy [emerging in Chrome 140+](https://www.sarasoueidan.com/blog/css-scrollspy/) but not yet cross-browser.

**Confidence:** HIGH -- IntersectionObserver is well-supported; implementation is straightforward

---

### D-3: Reading Position Persistence

**Value proposition:** Users close the app on site and reopen it later. They should return to where they left off, not the beginning of the chapter. The PDF equivalent is a physical bookmark or remembering the page number.

**What it means:**
- Store last-read section per chapter in local storage (Zustand persist)
- On returning to a chapter, offer "Continue from 8.5.4?" or auto-scroll to last position
- Optional: show "last read" indicators on chapter list (e.g., "Last read: 2 hours ago, section 8.5.4")

**Complexity:** Low
**Dependencies:** TS-3 (section addressing), Zustand store (already exists)
**Existing feature overlap:** v1.0 view history tracks detail page visits; this extends to section-level

**Pattern reference:** [Reading position bookmark pattern](https://css-tricks.com/reading-position-indicator/) -- stores scroll percentage and restores on next visit.

**Confidence:** HIGH

---

### D-4: HTG Installation Guide Integration

**Value proposition:** The "How To Guide" PDFs (Flashings, Penetrations, Cladding) contain practical step-by-step installation instructions that complement the COP's normative requirements. Having these appear inline when reading the relevant COP section bridges the gap between "what to do" (COP) and "how to do it" (HTG).

**What it means:**
- Extract content from 3 HTG PDFs (Flashings, Penetrations, Cladding)
- Map HTG sections to corresponding MRM COP sections
- Display as collapsible supplementary panels within chapter content (using D-1 panel pattern)
- Clearly labeled as "RANZ Installation Guide" (supplementary, grey border)

**Complexity:** High (PDF extraction + content mapping)
**Dependencies:** D-1 (inline panel infrastructure), HTG PDF source files
**Existing feature overlap:** None -- new content source

**Confidence:** MEDIUM -- extraction pipeline methodology proven with MRM COP; but HTG PDFs not yet examined for structure quality

---

### D-5: Chapter-Level Search Results

**Value proposition:** When searching from within the COP Reader, results should show which chapter and section contains the match, with a snippet of surrounding text. Current search returns detail-level results; this adds chapter content search.

**What it means:**
- Full-text search indexes chapter prose content (not just detail titles/descriptions)
- Results grouped by chapter with section number context
- Snippet highlighting shows the matched text in context
- Clicking a result navigates to the exact section within the chapter

**Complexity:** Medium
**Dependencies:** TS-5 (chapter content must be in a searchable format), existing search infrastructure
**Existing feature overlap:** v1.1 search with MRM boost and section number redirect

**Confidence:** MEDIUM -- depends on how chapter content is stored (if it goes into the database, search indexing is straightforward; if rendered from static JSON, a separate search index is needed)

---

### D-6: Print-Friendly Section Export

**Value proposition:** BCAs and designers sometimes need to print specific sections for consent applications or project files. The digital version should export cleanly for this purpose, with section numbers and version information preserved.

**What it means:**
- Print stylesheet that formats COP content cleanly for A4 printing
- "Print this section" button that opens print dialog for current chapter/section
- Printed output includes: version watermark, section numbers, diagrams, source attribution
- Optional: PDF export of selected sections

**Complexity:** Medium
**Dependencies:** TS-5 (chapter content rendering)
**Existing feature overlap:** v1.0 QA checklist PDF export exists

**Confidence:** MEDIUM -- print stylesheets are standard; PDF export adds complexity

---

### D-7: Table Interactive Enhancement

**Value proposition:** The COP contains 28 data tables (span tables, fixing schedules, material compatibility charts). In the PDF, these are static images or fixed layouts. Digitally, tables can be sortable, filterable, and responsive.

**What it means:**
- Tables render as responsive HTML (horizontal scroll on mobile, not squished text)
- Large tables get a "full screen" mode for easier reading
- Critical tables (e.g., span tables, corrosion zone requirements) could have interactive filtering
- Table data preserved from extraction (tables.json with 28 tables)

**Complexity:** Low-Medium (basic responsive tables are low; interactive filtering is medium)
**Dependencies:** TS-5 (content rendering), tables.json data
**Existing feature overlap:** None

**Confidence:** HIGH for responsive tables; MEDIUM for interactive features

---

### D-8: Section Bookmarking

**Value proposition:** Users can bookmark specific sections they frequently reference (e.g., a roofer who works with specific flashing types might bookmark 8.5.4, 8.5.7, and 9.4.1). This is faster than using the TOC every time.

**What it means:**
- Bookmark icon on each section heading
- Bookmarked sections appear in a "My Bookmarks" list (accessible from COP Reader sidebar)
- Bookmarks include section number, title, and timestamp
- Synced via user account (available on any device)

**Complexity:** Low-Medium
**Dependencies:** TS-3 (section addressing), existing favourites infrastructure
**Existing feature overlap:** v1.0 favourites system exists for details; this extends to COP sections

**Confidence:** HIGH

---

## Anti-Features

Features to explicitly NOT build for v1.2. Common mistakes in this domain.

### AF-1: Full Chapter Pagination (Page-by-Page View)

**Why avoid:** Mimicking PDF page breaks in a web app is a poor UX pattern. Research from [UXmatters](https://www.uxmatters.com/mt/archives/2018/11/paging-scrolling-and-infinite-scroll.php) and [W3C Digital Publishing Interest Group](https://www.w3.org/dpub/IG/wiki/Pagination_Requirements) shows that pagination adds friction for reference material where users scan for specific content. Users are looking for section 8.5.4, not "page 287."

**What to do instead:** Scroll-based continuous reading within each chapter, with section anchors for direct navigation. Chapter boundaries serve as the natural pagination unit.

---

### AF-2: Content Reorganization or Renumbering

**Why avoid:** The MRM COP section numbers are the industry's shared reference language. Changing "8.5.4 Change of Pitch" to any other number or restructuring the hierarchy would break every roofer's existing mental model, every consent application that cites the section, and every training material that references it.

**What to do instead:** Preserve the exact PDF structure. The digital version mirrors, never reorganizes. If the MRM COP has an awkward structure (e.g., Chapter 6 is only 4 pages), that is fine. Familiarity trumps optimization.

---

### AF-3: Inline Video Players

**Why avoid:** Explicitly out of scope per PROJECT.md ("Video tutorials -- storage/bandwidth costs, static content sufficient"). Inline video would also massively increase page weight, break offline mode, and create content maintenance burden.

**What to do instead:** 3D models with step synchronization (already implemented) provide the "how to" visual aid. If video is ever added, it should be external links, not embedded players.

---

### AF-4: AI-Generated Section Summaries

**Why avoid:** Paraphrasing normative COP content risks changing meaning ("shall" vs "should"), introduces citation integrity concerns, and creates content that cannot be attributed to the MRM COP source. Already identified as anti-pattern in v1.1 research.

**What to do instead:** Show the original COP text verbatim. The app's value is access and enrichment, not interpretation.

---

### AF-5: Dual-Column Layout on Desktop

**Why avoid:** Technical documents with diagrams, tables, and supplementary panels need full-width content area. A two-column text layout (like a PDF) would conflict with the sidebar TOC and make supplementary panels unusably narrow.

**What to do instead:** Single-column content with sidebar TOC. Content column max-width of ~780px (readable prose width) with images and tables allowed to extend wider. Supplementary panels span the full content width.

---

### AF-6: Chapter-by-Chapter Progressive Loading (Gatekeeping)

**Why avoid:** Do not make users load chapters one at a time or gate content behind clicks. The COP is not a novel -- users jump between sections constantly. If navigation feels slower than Ctrl+F in the PDF, the app has failed.

**What to do instead:** Pre-render chapter routes. Client-side navigation between chapters. Prefetch adjacent chapter data.

---

### AF-7: Supplementary Panels Expanded by Default

**Why avoid:** If every supplementary panel (3D model, HTG guide, case law) is expanded by default, the reading experience becomes overwhelming. The primary content is the MRM COP text -- supplementary content should enhance, not compete.

**What to do instead:** All supplementary panels collapsed by default. User can expand individually. Consider a "Expand all supplementary" toggle for users who want the full picture. Progressive disclosure is the correct pattern per [IxDF](https://www.interaction-design.org/literature/topics/progressive-disclosure).

---

## Feature Dependencies

```
Foundation Layer:
  TS-5 (Chapter Content Rendering)
    |
    +-- TS-2 (Section Number Preservation)
    |     |
    |     +-- TS-3 (Section Deep-Linking)
    |     |     |
    |     |     +-- TS-8 (Cross-Reference Navigation)
    |     |     +-- D-3 (Reading Position Persistence)
    |     |     +-- D-8 (Section Bookmarking)
    |     |
    |     +-- TS-6 (Breadcrumb Navigation)
    |
    +-- TS-4 (Inline Technical Diagrams)
    +-- D-7 (Table Enhancement)
    +-- D-5 (Chapter-Level Search)

Navigation Layer:
  TS-1 (Chapter-Level Navigation / TOC)
    |
    +-- TS-7 (Collapsible TOC Sidebar)
          |
          +-- D-2 (Scrollspy Section Tracking)

Enrichment Layer:
  D-1 (Inline Supplementary Content Panels)
    |
    +-- D-4 (HTG Installation Guide Integration)
    |
    +-- Links to existing: detail_links, 3D viewer, case law

Standalone:
  TS-9 (Version Identification) -- no dependencies
  D-6 (Print-Friendly Export) -- depends on TS-5 only
```

---

## MVP Recommendation

For v1.2 MVP, build in this order:

### Phase 1: Foundation (Must Ship)
1. **TS-5** -- Chapter content rendering (the core)
2. **TS-2** -- Section number preservation
3. **TS-4** -- Inline technical diagrams
4. **TS-1** -- Chapter-level navigation (TOC)
5. **TS-9** -- Version identification

### Phase 2: Navigation (Must Ship)
6. **TS-3** -- Section deep-linking
7. **TS-6** -- Breadcrumbs
8. **TS-7** -- Collapsible TOC sidebar/drawer

### Phase 3: Enrichment (Must Ship)
9. **D-1** -- Inline supplementary content panels (the signature feature)
10. **D-2** -- Scrollspy section tracking

### Phase 4: Content Pipeline (Must Ship)
11. **D-4** -- HTG installation guide extraction and integration

### Defer to Post-v1.2:
- **TS-8** (Cross-Reference Navigation) -- High complexity; parsing internal references from raw text needs careful work. Ship without clickable cross-references initially; add in a follow-up.
- **D-3** (Reading Position Persistence) -- Nice to have but not critical for launch.
- **D-5** (Chapter-Level Search) -- Extend existing search; can be done after content is in place.
- **D-6** (Print-Friendly Export) -- Important for BCAs but not launch-critical.
- **D-7** (Table Enhancement) -- Responsive tables needed at launch (basic); interactive filtering can come later.
- **D-8** (Section Bookmarking) -- Extend existing favourites; low effort but not launch-critical.

---

## Confidence Assessment

| Feature | Confidence | Reason |
|---------|------------|--------|
| Chapter navigation / TOC patterns | HIGH | Universal pattern across all documentation platforms |
| Section number deep-linking | HIGH | Standard web fragment linking |
| Inline supplementary panels | HIGH | Progressive disclosure is established UX pattern |
| Scrollspy | HIGH | IntersectionObserver well-supported |
| Chapter content rendering | HIGH | Content extracted; rendering is standard web |
| Cross-reference parsing | MEDIUM | Regex parsing of "See X.X.X" from raw text has edge cases |
| HTG extraction | MEDIUM | Pipeline proven for MRM COP but HTG PDF quality untested |
| Chapter-level search | MEDIUM | Depends on content storage architecture decisions |

---

## Competitive Landscape

### Existing MRM COP Online (metalroofing.org.nz/cop)
- Chapter-by-chapter navigation
- Section numbers preserved
- No supplementary content inline
- No 3D models, no case law
- No search within content
- No mobile optimization
- Registration required

### ICC Digital Codes (codes.iccsafe.org)
- The gold standard for digital building code readers
- Breadcrumb navigation between titles
- Section deep-linking with shareable URLs
- Annotation, bookmark, and collaboration tools (premium)
- AI Navigator for natural-language code queries
- Commentary and interpretations inline
- Mobile apps (iOS/Android)

### MBIE Building CodeHub (codehub.building.govt.nz)
- Resource directory, not a reader -- links to external resources
- Keyword-tagged search
- Does not display document content inline

### Key Takeaway
The MRM COP online is a basic web rendering of the PDF with chapter navigation. ICC Digital Codes is the aspirational reference -- premium features like AI navigation and commentary are out of scope, but the core reading/navigation experience is achievable. The Master Roofers app can match ICC for navigation quality while exceeding it with 3D models, installation guides, and case law integration -- features no building code reader currently offers.

---

## Sources

**UX Research:**
- [NN/g: Table of Contents Design Guide](https://www.nngroup.com/articles/table-of-contents/)
- [NN/g: Breadcrumbs Design Guidelines](https://www.nngroup.com/articles/breadcrumbs/)
- [NN/g: In-Page Links for Content Navigation](https://www.nngroup.com/articles/in-page-links-content-navigation/)
- [NN/g: Navigating Large Information Spaces](https://www.nngroup.com/articles/navigating-large-information-spaces/)
- [NN/g: Tables of Contents on Mobile](https://www.nngroup.com/videos/mobile-table-of-contents/)
- [LogRocket: Mobile Breadcrumbs Design](https://blog.logrocket.com/ux-design/designing-mobile-breadcrumbs/)
- [IxDF: Progressive Disclosure](https://www.interaction-design.org/literature/topics/progressive-disclosure)
- [UXmatters: Paging, Scrolling, and Infinite Scroll](https://www.uxmatters.com/mt/archives/2018/11/paging-scrolling-and-infinite-scroll.php)
- [Mobbin: Table of Contents UI Patterns](https://mobbin.com/glossary/table-of-contents)

**Technical Implementation:**
- [CSS-Tricks: Table of Contents with IntersectionObserver](https://css-tricks.com/table-of-contents-with-intersectionobserver/)
- [CSS-Tricks: Reading Position Indicator](https://css-tricks.com/reading-position-indicator/)
- [Sara Soueidan: CSS-only Scrollspy](https://www.sarasoueidan.com/blog/css-scrollspy/)
- [Docusaurus: Sidebar Configuration](https://docusaurus.io/docs/sidebar)
- [Readest: Sidebar and Table of Contents](https://deepwiki.com/readest/readest/5.3-sidebar-and-table-of-contents)

**Digital Building Code Platforms:**
- [ICC Digital Codes](https://codes.iccsafe.org/)
- [MBIE Building CodeHub](https://codehub.building.govt.nz)
- [MRM COP Online](https://www.metalroofing.org.nz/cop)

**Standards:**
- [W3C: EPUB Navigation](https://w3c.github.io/epub-specs/epub33/locators/)
- [W3C: Digital Publishing Pagination Requirements](https://www.w3.org/dpub/IG/wiki/Pagination_Requirements)
- [EPUB Knowledge: Table of Contents](https://epubknowledge.com/docs/toc/)

**Navigation Patterns:**
- [I'd Rather Be Writing: Doc Navigation Design Principles](https://idratherbewriting.com/files/doc-navigation-wtd/design-principles-for-doc-navigation/)
- [PatternFly: Navigation Design Guidelines](https://www.patternfly.org/components/navigation/design-guidelines/)

---

*Last updated: 2026-02-08*
