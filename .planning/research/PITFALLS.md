# Domain Pitfalls: Wikipedia-Style Encyclopedia Transformation

**Domain:** Adding encyclopedia features to existing roofing COP app
**Researched:** 2026-02-12
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Big Bang Route Migration Breaking Production Links

**What goes wrong:**
All URLs change simultaneously on deployment. User bookmarks break, search engine indexes point to 404s, internal links from external sites (MBIE, industry associations) fail. Users attempting to access previously saved COP sections receive errors. Industry trust evaporates because "the app stopped working."

**Why it happens:**
The Pages Router to App Router migration, combined with encyclopedia restructuring (from `/cop/chapter/[id]` to `/encyclopedia/[topic]/[section]`), creates complete URL incompatibility. Teams assume "we'll just redirect everything" without mapping 1,121 existing COP sections + 350 HTG records to new URLs. Automated migration codemods handle 80% but the remaining 20% requires manual URL mapping that never happens. 70% of digital transformation projects fail due to poor execution, not technical issues.

**How to avoid:**
- Use **progressive migration**, not big bang. App directory works alongside Pages directory in Next.js 14
- Build redirect mapping table BEFORE route migration: `previous_slugs[]` array in database for each content item
- Deploy redirects FIRST, then migrate routes
- Keep redirects for minimum 1 year (many experts recommend forever)
- Use Next.js `redirects()` in `next.config.mjs` for static mappings
- Create server-side redirect handler checking `previous_slugs` for dynamic content
- Emergency rollback plan if 404 rate spikes above 5%

**Warning signs:**
- Development plan shows route migration and content restructuring in same phase
- No redirect mapping table in schema design
- "We'll handle redirects after launch" in discussions
- Testing plan doesn't include verifying old bookmarked URLs
- No monitoring for 404 spike post-deployment
- All old URLs redirect to homepage instead of closest match (lazy redirect strategy)

**Phase to address:**
Phase 1 (Foundation): Add `previous_slugs` field to content schema, build redirect infrastructure.
Phase 2 (Route Migration): Implement progressive migration with redirects deployed first.

---

### Pitfall 2: Automated Cross-Linking Creating Unreadable "Blue Text Soup"

**What goes wrong:**
Automated linking system turns 1,800+ content items into hyperlink overload. Every paragraph becomes 40% blue underlined text. Users can't distinguish important cross-references from routine mentions. Reading comprehension drops. Mobile users accidentally tap links while scrolling. Conservative tradesperson audience rejects the interface as "too complicated" and "trying too hard to be Wikipedia."

**Why it happens:**
Automation without human oversight. System links every mention of "flashing," "membrane," "penetration," etc. across all 1,800+ items. No frequency limits (max links per paragraph). No relevance scoring (linking "roof" to the "Roof Systems" article 47 times per page). No user testing with actual roofers who need to READ the content, not click through it. Google warns against "overusing internal links" for SEO manipulation.

**How to avoid:**
- Implement link budget: max 3-5 links per paragraph, 15-20 per article
- First mention rule: auto-link only first occurrence of term per section
- Relevance scoring: link only when target article adds substantial context, not circular references
- Context analysis: avoid linking when term is used in passing vs. substantively discussed
- Human review: sample 10% of auto-linked pages, measure readability scores
- A/B test with conservative audience: traditional roofers vs. younger digital-native users
- Exact match anchor text < 10% to avoid SEO penalties
- Emphasize quality over quantity: few well-placed links better than many generic ones

**Warning signs:**
- More than 20% of paragraph text is hyperlinked
- Same term linked multiple times on same page
- Automated linking runs with no human review stage
- No configurable link frequency limits in system design
- Testing done by developers (who love links) not target users (conservative tradespeople)
- Mobile tap heatmaps show accidental link activation
- Readability scores drop compared to current flat reference format

**Phase to address:**
Phase 3 (Cross-Linking Engine): Build with strict frequency limits, relevance scoring, and human review workflow.
Phase 4 (Content Integration): A/B test with target audience before full rollout.

---

### Pitfall 3: Content Source Merging Without Clear Authority Hierarchy

**What goes wrong:**
MRM COP (authoritative legislative) and RANZ HTG (practical guide) present conflicting information. Article about weathertight installation cites both sources with equal weight. Inspector in field doesn't know which to follow for compliance. MBIE audit finds article citing non-compliant HTG advice alongside compliant COP requirements. App loses legislative authority status.

**Why it happens:**
Merging 1,121 COP records + 350 HTG records + 312 legislative references without explicit authority ranking. Automated merging assumes "more content = better" without considering source conflicts. No flagging system for contradictions. Attribution gets lost in consolidation. Writers merge content treating all sources as equivalent. Modern AI search systems prioritize authoritative data from reputable sources with citations, not undifferentiated mixes.

**How to avoid:**
- Define source hierarchy: MRM COP > MBIE Building Code > RANZ HTG > other
- Flag conflicting information during merge: automated detection + human review
- Visual distinction: legislative requirements vs. practical guidance (different styling/icons)
- Attribution always visible: "According to MRM COP Section 4.2.1..." not "Flashing should..."
- Conflict resolution workflow: when sources contradict, COP wins, HTG gets "Note: Practical guidance suggests... but compliance requires..."
- Compliance tagging: mark which content is enforceable vs. advisory
- MBIE review checkpoint before publishing merged legislative content
- Maintain source metadata: every paragraph tracks origin (COP vs. HTG vs. hybrid)
- Weighted merging algorithm: COP text preserved verbatim, HTG adds context
- Quality assurance: compliance officer review for all merged legislative articles

**Warning signs:**
- Content merge plan shows no authority hierarchy
- Database schema lacks source attribution fields
- No conflict detection system in content pipeline
- Writers instructed to "combine sources" without resolution guidelines
- QA process doesn't include compliance officer
- Testing doesn't verify legislative accuracy
- No visual distinction between mandatory and advisory content
- Authoritative sources page shows citations but lack of transparency about weighting

**Phase to address:**
Phase 1 (Foundation): Define source hierarchy, add attribution schema.
Phase 4 (Content Integration): Implement conflict detection and resolution workflow.
Phase 5 (Legislative Formatting): Add visual compliance indicators.

---

### Pitfall 4: False Positive Automated Content Matching

**What goes wrong:**
Automated deduplication system merges "flashing around penetrations" (roof penetrations) with "flashing around penetrations" (wall penetrations). System identifies 40% text similarity and auto-merges distinct COP sections. Result: confused article mixing roof and wall requirements. Inspector applies wrong specification. Installation fails weathertightness test.

**Why it happens:**
String matching without context analysis. System uses fuzzy matching (similarity threshold 30-40%) across 1,800+ items. Domain-specific terminology repeats across different contexts ("penetration" appears in 200+ sections with different meanings). No subject matter expert review. Over-aggressive deduplication to reduce content volume. Stripping whitespace and punctuation creates false matches. Tradeoff between cost/runtime and accuracy favors speed over precision.

**How to avoid:**
- Funnel-shaped deduplication: string matching → embedding + clustering → LLM verification for probable matches
- Context-aware matching: compare surrounding paragraphs, not just target sentence
- Subject taxonomy: tag content by topic (roof vs. wall vs. gutter) before matching
- Conservative similarity threshold: 70%+ for auto-merge, 40-70% requires human review, <40% no match
- Domain expert review: MBIE-qualified inspector reviews all auto-merged technical content
- Whitelist protection: known distinct sections never merge even with high similarity
- False positive tracking: monitor user reports of incorrect merged content
- Specificity of 0.94-0.99 achieved by best systems with human review

**Warning signs:**
- Deduplication threshold below 60% similarity
- No human review stage for probable matches
- Content volume reduction exceeds 30% (likely over-merging)
- Domain expert not involved in QA process
- Schema doesn't track merge history for rollback
- No user feedback mechanism for incorrect merges
- Testing doesn't include edge cases (homonyms, similar contexts)
- Citations removed where same DOI assigned to collection (false duplicate signal)

**Phase to address:**
Phase 2 (Content Analysis): Build conservative deduplication with human review.
Phase 4 (Content Integration): Domain expert validation before publishing merged content.

---

### Pitfall 5: Encyclopedia Navigation Too Deep for Field Use

**What goes wrong:**
Information architecture creates 6-level hierarchy: Systems > Components > Materials > Applications > Conditions > Specifications. Roofer on site needs installation spec for valley flashing in high wind zone. Requires 6 navigation decisions. Takes 3 minutes to find spec. Rain starts. Gives up, uses old PDF (finds answer in 20 seconds via Ctrl+F). App fails adoption because it's slower than the problem it replaced.

**Why it happens:**
Over-complication driven by "being comprehensive." Every possible categorization axis becomes a navigation level. Category proliferation: 40 systems, 200 components, 300 materials. No user journey mapping for primary use case (roofer needing spec in field). Navigation designed by information architects who love organization, not tested by tradespeople who need speed. Complexity, inconsistency, and hidden options prevent users from finding what they need.

**How to avoid:**
- Maximum 3-level depth for primary navigation: Category > Topic > Section
- Flatten via powerful search, not deep hierarchies
- Context-aware entry points: "High Wind Installation" shows all relevant specs regardless of system/component categorization
- Task-based navigation alongside encyclopedia structure: "Installing valley flashing" shortcut bypasses hierarchy
- Measure time-to-answer vs. legacy PDF: must be faster or equal
- User test with conservative audience: actual roofers with realistic scenarios
- Progressive disclosure: show depth only when needed, default to shallow
- Stick to few main categories, use subcategories only when necessary

**Warning signs:**
- Navigation mockups show more than 4 levels
- More than 20 top-level categories
- No task-based shortcuts in navigation design
- Testing measures "completeness" not "time to answer"
- Search treated as secondary to navigation
- No comparison testing vs. current PDF Ctrl+F workflow
- Information architecture designed without user journey mapping
- Too many navigation zones (simple reality: users have trouble with too many disparate choices)

**Phase to address:**
Phase 6 (Encyclopedia Navigation): Design maximum 3-level hierarchy with task shortcuts.
Phase 7 (Search Enhancement): Build search to compensate for flattened navigation.

---

### Pitfall 6: Mobile TOC Consuming More Screen Than Content

**What goes wrong:**
Sticky table of contents with 40 items displays on mobile. Takes 80% of viewport. User scrolls TOC more than content. Accidental taps on TOC links interrupt reading flow. TOC longer than the article it indexes. Mobile users abandon in frustration, switch to desktop or PDF.

**Why it happens:**
Desktop-first TOC design ported to mobile without adaptation. Auto-generated TOC includes every H2/H3 (40+ items for comprehensive COP sections). Sticky positioning on mobile competes with limited screen space. No collapsible/minimized state. No scroll-depth awareness (TOC stays visible even when not needed). Visibility concerns when collapsed and sticky to top.

**How to avoid:**
- Mobile TOC defaults to minimized: bottom-anchored expandable (tap to reveal)
- Intelligent visibility: hide TOC while scrolling content, show on scroll-stop
- Depth limits: mobile shows H2 only (5-7 items), desktop shows H2+H3
- Collapse-by-default on mobile/tablet via responsive config
- Progress indicator instead of full TOC: "Section 3 of 7" minimal footer
- Jump-to-top FAB (floating action button) for quick navigation
- A/B test: collapsible TOC vs. no TOC vs. minimal progress indicator
- Sticky TOC in main body competes with global navigation (avoid on mobile)

**Warning signs:**
- TOC design identical for mobile and desktop
- No responsive TOC hiding/minimizing
- Auto-generated TOC without item limits
- Sticky TOC on mobile viewports < 768px
- No scroll behavior (TOC always visible)
- Testing on desktop only, or on 27" external monitors
- TOC renders before content in mobile DOM
- Users failing to notice sticky TOC (visibility problem)

**Phase to address:**
Phase 6 (Encyclopedia Navigation): Build responsive TOC with mobile-first collapsing.
Phase 8 (Mobile Optimization): Test and refine TOC behavior on actual mobile devices.

---

### Pitfall 7: Scope Creep Into Wikipedia Features That Don't Serve Roofers

**What goes wrong:**
Team adds discussion pages, revision history UI, user contribution tracking, citation needed tags, WikiProject-style collaboration tools. Development timeline doubles. Features go unused because roofers need reference content, not collaborative editing. MBIE rejects app because user-generated content undermines legislative authority. 70% of development effort wasted on features that reduce trust.

**Why it happens:**
"Wikipedia trap" - assuming encyclopedia format requires Wikipedia features. Feature creep driven by developers who love Wikipedia. No user research validating feature demand from conservative tradesperson audience. Mistaking format (encyclopedia) for platform (wiki). Losing sight of core value: authoritative reference, not community collaboration. Feature creep is excessive ongoing expansion beyond basic function, resulting in software bloat.

**How to avoid:**
- Define anti-features explicitly: what we will NOT build despite Wikipedia having it
- User story validation: "As a roofer, I need [feature] to [outcome]" - if outcome isn't core to compliance/installation, defer or cut
- Conservative audience filter: will a 55-year-old roofer who distrusts change use this feature?
- Authority preservation: user-editable content incompatible with MBIE legislative status
- Feature ROI analysis: development cost vs. actual usage (not hypothetical)
- Stick to transformation scope: navigation + cross-linking + merging, NOT collaboration platform
- Reference competitors: legislative.govt.nz, building.govt.nz (authoritative, read-only)
- Scope creep can result in project spending too much time/resources on same number of features

**Warning signs:**
- Feature backlog includes revision history, talk pages, user contributions
- Discussions about "building a community" around the app
- User authentication beyond admin CMS access
- Comment or discussion features in roadmap
- "Wouldn't it be cool if users could..." conversations
- Development timeline extending beyond 6 months for encyclopedia features
- No clear anti-feature list in requirements
- Design meetings focus on "what Wikipedia does" not "what roofers need"

**Phase to address:**
Phase 1 (Foundation): Define explicit anti-feature list, get stakeholder sign-off.
All phases: Ruthlessly cut features that don't serve "roofer needs spec fast" core use case.

---

### Pitfall 8: Legislative Formatting That Looks Informal or Untrustworthy

**What goes wrong:**
Encyclopedia articles use casual tone, blog-style formatting, or consumer-web styling (bright colors, playful fonts, emojis). MBIE reviewers see content that looks like a how-to blog, not legislative documentation. Roofers question authority: "Is this official or just someone's opinion?" App fails MBIE acceptance. Industry rejects as "not serious enough."

**Why it happens:**
Modern web design practices clash with legislative document conventions. Designers optimize for "engagement" (informal, friendly) when domain requires "authority" (formal, structured). No reference to legislative design patterns (congress.gov, legislation.govt.nz). Team unfamiliar with how legal/legislative content establishes trust through formatting. Legislative documents require careful separation of presentation from structure/content.

**How to avoid:**
- Study legislative design patterns: USLM (US Legislative Markup), legislation.govt.nz NZ standards
- Formal typography: serif fonts for body text (Georgia, Times, Lora), conservative spacing
- Color contrast for accessibility: high contrast (sufficient between text and background), avoid bright/playful colors
- Structured hierarchy: clear section numbering (4.2.1), consistent heading styles
- Citation formatting: visible attribution to authoritative sources
- Document-like presentation: margins, justification, print-friendly styling
- Visual authority markers: MBIE logo, official status badges, "Authoritative Source" indicators
- Avoid: casual tone, emoji, blog-style images, consumer-web patterns
- Reference successful models: NZ Building Code online, legislation.govt.nz
- Multiple format availability: HTML/XML, TXT, PDF based on availability

**Warning signs:**
- Design mockups use bright colors, playful fonts, or blog layouts
- No section numbering system in article structure
- Casual voice in content guidelines ("Let's talk about flashing...")
- Design references: Medium, Notion, consumer blogs (not legislative sites)
- No print stylesheet or PDF export consideration
- MBIE logo/branding treated as optional
- No accessibility contrast requirements in design system
- Readability trumps formality in design decisions (wrong priority for legislative content)

**Phase to address:**
Phase 1 (Foundation): Define legislative design system with formal typography and structure.
Phase 5 (Legislative Formatting): Implement authoritative visual language.
Phase 9 (MBIE Acceptance): Review and refine based on legislative standards feedback.

---

### Pitfall 9: Link Rot from Content Reorganization

**What goes wrong:**
Content reorganization moves "Valley Flashing Installation" from one encyclopedia category to another. Internal cross-links from 40 other articles break. Search engine indexes point to old structure. External sites linking to content (industry training courses, MBIE resources) serve 404s. Over 6 months, 15% of internal links become broken. User trust declines.

**Why it happens:**
No stable URL strategy for content that moves between categories. Encyclopedia structure evolves (reorganizing from system-based to task-based). Database IDs change during content merging. No link integrity checking. No automated redirect creation when content moves. Treating encyclopedia structure as static when it's actually dynamic. Redirect chains occur when URL A redirects to B, which redirects to C - each hop degrades ranking signal transfer.

**How to avoid:**
- Stable content IDs: URL based on content ID, not category path (`/encyclopedia/content/[stable-id]` not `/encyclopedia/[category]/[subcategory]/[id]`)
- Canonical URL preservation: when content moves, old URL redirects to new, canonical URL updated
- Link integrity checking: automated scan for broken internal links pre-deployment
- Breadcrumb navigation separate from URL structure: URL stays stable, breadcrumbs show current category
- Content move workflow: detect URL changes, auto-generate redirects, log for monitoring
- External link monitoring: track inbound links, verify still functional after reorganizations
- Version history: track URL changes, maintain redirect chain
- Keep redirect table in database, not next.config.js (scales beyond 500 rules)

**Warning signs:**
- URLs include category structure (fragile to reorganization)
- No automated link checking in CI/CD
- Content can move without triggering redirect creation
- No external inbound link monitoring
- Reorganization plan doesn't include link impact assessment
- 404 monitoring shows increasing broken links over time
- No stable content ID separate from URL path
- Redirect mapping happens after launch, not before

**Phase to address:**
Phase 2 (Route Migration): Design stable URL structure independent of category.
Phase 6 (Encyclopedia Navigation): Ensure category reorganization doesn't break URLs.
Phase 10 (Ongoing): Automated link integrity monitoring.

---

### Pitfall 10: Cultural Resistance from Conservative Tradesperson Audience

**What goes wrong:**
Launch new encyclopedia format. Conservative roofers (55+, used to MRM COP PDF for 20 years) reject it as "too different," "complicated," "why change what works?" Adoption stalls at 15%. Industry continues using PDF. MBIE questions value of digital transformation. Project fails not technically, but socially.

**Why it happens:**
70% of digital transformation projects fail due to user resistance, not technical issues. Change management gets 10% of budget while technical features get 90%. No involvement of target users in design process. Assuming "better UX" automatically drives adoption. Underestimating attachment to familiar tools (PDF + Ctrl+F). Launching as big bang replacement vs. gradual enhancement. Fear of job loss, poor workflow design, and workarounds drive resistance.

**How to avoid:**
- Involve conservative users early: user interviews, prototype testing with actual 50+ year old roofers
- Design as evolution, not revolution: familiar visual language from MRM COP PDF, gradual feature introduction
- Preserve PDF workflow: offer PDF export of encyclopedia articles, print-friendly views
- Side-by-side availability: don't deprecate PDF immediately, let users choose format
- Champion recruitment: identify respected industry veterans who endorse new format
- Training content: short videos showing "how to find X in new format" for common tasks
- Measure time-to-answer: new format must be faster/equal, not just "better organized"
- Gradual rollout: beta with early adopters → industry partners → general release
- Change messaging: "Enhanced COP with better search" not "Replacement for PDF"
- Success visibility: showcase inspectors/contractors using it successfully
- Allocate 20%+ budget to change management/training (not just 10%)
- Involve users early instead of after configuration (1.4x more likely to succeed)

**Warning signs:**
- User research excludes 50+ age group (primary user demographic)
- Plan shows PDF deprecated on launch day
- No training content in roadmap
- Design diverges significantly from MRM COP visual language
- Budget allocates <20% to change management/training
- No pilot program with industry partners
- Marketing positioning: "New" vs. "Enhanced"
- Launch plan: big bang vs. gradual rollout
- No measurement of adoption rate in success criteria
- Complex workflows replacing familiar processes without considering daily work reality

**Phase to address:**
Phase 0 (Pre-Development): User research with conservative demographic, champion recruitment.
Phase 8 (Mobile Optimization): Build PDF export and print-friendly views.
Phase 9 (MBIE Acceptance): Pilot with industry partners before general launch.
Phase 10 (Ongoing): Monitor adoption, gather feedback, iterate based on actual usage.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Redirect all old URLs to homepage | Deploy faster, avoid mapping URLs | Lost SEO, broken bookmarks, user frustration, trust loss | Never - this is a critical mistake |
| Auto-link all term occurrences | Comprehensive cross-linking without manual work | Unreadable blue text soup, accidental taps, user rejection | Never - implement link budget from start |
| Merge content without conflict detection | Faster content integration pipeline | Mixed compliance requirements, MBIE rejection, liability risk | Never - authority hierarchy is non-negotiable |
| Use category-based URLs | Intuitive URL structure | Link rot when categories reorganize | Only if content never moves (unlikely) |
| Skip mobile-specific TOC | One codebase for all devices | Poor mobile UX, viewport consumed by TOC, abandoned sessions | Never - mobile is 60%+ of traffic |
| Copy Wikipedia features wholesale | Familiar patterns, less design work | Scope creep, wasted dev time, confused users, MBIE rejection | Never - encyclopedia format ≠ wiki platform |
| Casual/modern web styling | Higher engagement metrics | Lost legislative authority, MBIE/industry rejection | Never for legislative content |
| Big bang route migration | Cleaner codebase faster | Broken links, SEO loss, downtime, rollback complexity | Never - progressive migration required |
| 30% fuzzy match threshold | More deduplication, less content volume | False positives, mixed topics, compliance errors | Only for non-critical marketing content |
| Launch without conservative user testing | Faster to market | Cultural resistance, adoption failure, project failure | Never - user validation is critical |

## Integration Gotchas

Common mistakes when integrating encyclopedia features to existing system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| MRM COP + RANZ HTG merging | Treating sources as equal authority | COP always wins conflicts, HTG adds context with clear attribution |
| Legislative references | Embedding full text without attribution | Link to source, quote with attribution, maintain source metadata |
| Existing COP JSON structure | Assuming structure fits encyclopedia model | Map existing structure to new model, preserve backward compatibility via redirects |
| External links (MBIE, BRANZ) | Hard-coding URLs that change | Store in config, monitor for 404s, implement link checking |
| Search integration | Assuming Next.js built-in search scales to 1,800+ items | Plan for external search (Algolia, ElasticSearch) from Phase 7 |
| Mobile app (if future phase) | Assuming web encyclopedia works on mobile | Mobile needs different navigation paradigm, offline support, faster load |
| Existing service worker | Not updating cached routes after URL changes | Bump cache version, update STATIC_ASSETS, test offline after every navigation change |
| Existing detail pages | Deleting old routes when adding encyclopedia | Keep both addressing schemes working, additive not replacement |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Client-side cross-link generation | Page load delays, UI jank | Pre-compute links server-side, cache aggressively | >200 links per page, mobile devices |
| Rendering full encyclopedia TOC on every page | Slow page loads, large bundle | Dynamic TOC generation based on current article, lazy load | >500 total articles |
| In-memory link checking | Memory exhaustion, deployment failures | Database-backed link integrity tracking | >1,000 internal links |
| Searching 1,800+ items client-side | Slow search, browser freezing | External search service (Algolia, ElasticSearch) | >500 searchable items |
| Loading all 350 HTG records for merging | Long build times, memory issues | Incremental merging with pagination, background jobs | >100 records per merge operation |
| Storing redirect table in next.config.js | Build failures, deployment timeouts | Database-backed redirects with caching | >500 redirect rules |
| Regenerating all 1,800 pages on each deploy | 30+ minute builds, Vercel timeout | Incremental Static Regeneration (ISR), on-demand revalidation | >1,000 pages |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Allowing user edits to legislative content | MBIE revokes authoritative status, liability for incorrect compliance info | Read-only for public, admin-only CMS for updates |
| No audit trail for content changes | Can't prove content accuracy at specific dates, compliance disputes | Version history, change log, "last updated" timestamps visible |
| Mixing enforced and advisory content without clear distinction | Roofers apply advisory as mandatory (over-engineering) or vice versa (non-compliance) | Visual indicators, explicit labels, source attribution |
| External link injection in merged content | Malicious links in legislative reference | Whitelist allowed domains (govt.nz, legislation.govt.nz), validate all external links |
| No access control on admin CMS | Unauthorized content changes, vandalism, compliance errors | Role-based access, MBIE approval workflow for legislative content |
| Caching stale compliance info | Users see outdated requirements, installations fail inspection | Short cache TTL for legislative content, revalidation on updates |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Over-linking making text unreadable | Can't focus on content, accidental taps on mobile, abandoned sessions | Link budget: max 3-5 per paragraph, first mention only |
| Navigation deeper than 3 levels | 3-minute search for spec that should take 20 seconds, gives up, uses PDF | Max 3 levels + powerful search + task shortcuts |
| Desktop-optimized TOC on mobile | 80% of screen consumed by TOC, more scrolling TOC than content | Minimized/collapsible TOC, bottom-anchored expandable |
| Casual modern styling on legislative content | "Doesn't look official," questions authority, MBIE rejects | Formal typography, section numbering, high contrast, print-friendly |
| Encyclopedia replaces PDF immediately | Resistance from conservative users, adoption failure | Side-by-side availability, PDF export, gradual migration |
| No task-based navigation | Forces learning new category system, slower than Ctrl+F on PDF | Task shortcuts: "Installing valley flashing" bypasses hierarchy |
| Auto-generated breadcrumbs from URL path | Breaks when content reorganizes, shows technical structure not user path | Breadcrumbs from content metadata, independent of URL |
| No mobile-specific reading optimizations | Scroll fatigue, hard to read on site in weather, switch to PDF | Larger fonts, high contrast, simplified layout, quick navigation |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Redirect System:** Redirects deployed and verified BEFORE route migration goes live, not after
- [ ] **Link Integrity:** Automated checking runs on every deploy, reports broken links, fails build if critical links break
- [ ] **Authority Hierarchy:** Every merged article shows clear source attribution, COP vs. HTG visually distinct, compliance officer approved
- [ ] **Mobile TOC:** Tested on actual mobile devices (not just Chrome DevTools), collapsible by default, doesn't consume >30% viewport
- [ ] **Link Budget Enforcement:** System prevents >5 links per paragraph, warns when threshold approached, manual override requires approval
- [ ] **Conservative User Testing:** Actual 50+ year old roofers tested and approved, time-to-answer faster than PDF, familiar visual language validated
- [ ] **Stable URLs:** Content can reorganize without breaking URLs, redirects auto-generated on content moves, link monitoring active
- [ ] **Legislative Styling:** MBIE reviewer approved design, formal typography implemented, section numbering consistent, print-friendly verified
- [ ] **Conflict Detection:** Automated flagging of COP vs. HTG contradictions, human review workflow functional, resolution guidelines documented
- [ ] **Performance at Scale:** Tested with full 1,800 items, search response <200ms, page load <2s, mobile performance verified

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Broken links from route migration | MEDIUM | Emergency redirect deployment, URL mapping from analytics (identify broken URLs by 404 spike), communicate timeline to users, prioritize high-traffic pages |
| Blue text soup from over-linking | LOW | Quick config change to reduce link frequency, redeploy with stricter budget, A/B test to find acceptable threshold |
| Authority confusion from merged content | HIGH | Audit all merged articles, add source attribution retroactively, visual redesign to distinguish COP/HTG, MBIE re-review and approval |
| Deep navigation causing abandonment | MEDIUM | Add task-based shortcuts as emergency patch, flatten hierarchy in next iteration, improve search to compensate |
| Mobile TOC consuming viewport | LOW | Quick CSS fix to collapse by default, deploy minimized variant, test on actual devices |
| Conservative user rejection | HIGH | Keep PDF available indefinitely, create training content, recruit champions, gradual migration strategy, don't force switch |
| Link rot from content reorganization | MEDIUM | Database scan for broken links, generate redirect rules, implement stable URL structure for future moves |
| Scope creep diluting focus | HIGH | Hard pivot: cut non-core features, refocus on roofer use cases, reset timeline, communicate revised scope |
| Informal styling losing authority | MEDIUM | Visual redesign toward legislative patterns, typography/color overhaul, MBIE re-review |
| False positive content merging | HIGH | Unmerge incorrectly combined content, implement human review workflow, raise similarity threshold, domain expert audit |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Big bang route migration | Phase 1 (Foundation), Phase 2 (Route Migration) | Old URLs redirect correctly, 404 rate unchanged, search rankings stable |
| Automated cross-linking overload | Phase 3 (Cross-Linking Engine) | Sample pages show <20% linked text, readability scores maintained, user testing approved |
| Content source authority confusion | Phase 1 (Foundation), Phase 4 (Content Integration) | Every article shows clear attribution, COP/HTG visually distinct, compliance officer sign-off |
| False positive content matching | Phase 2 (Content Analysis), Phase 4 (Content Integration) | Domain expert reviewed all merges, no false positives in sample audit, rollback mechanism tested |
| Navigation too deep | Phase 6 (Encyclopedia Navigation) | Max 3 levels verified, time-to-answer faster than PDF in user testing, task shortcuts functional |
| Mobile TOC consuming screen | Phase 6 (Encyclopedia Navigation), Phase 8 (Mobile Optimization) | TOC uses <30% viewport on mobile, collapsible by default, tested on real devices |
| Scope creep into Wikipedia features | All phases, enforced in Phase 1 | Anti-feature list approved, no collaboration tools in backlog, focus on read-only reference |
| Legislative formatting looks informal | Phase 1 (Foundation), Phase 5 (Legislative Formatting) | MBIE reviewer approved design, formal typography implemented, matches legislation.govt.nz patterns |
| Link rot from reorganization | Phase 2 (Route Migration), Phase 6 (Encyclopedia Navigation) | Stable URL structure verified, redirects auto-generated on moves, link monitoring active |
| Conservative user resistance | Phase 0 (User Research), Phase 9 (MBIE Acceptance), Phase 10 (Ongoing) | 50+ age group tested and approved, PDF export available, adoption rate >60% within 6 months |

## Sources

### Content Migration & Breaking Changes
- [CMS Migration Guide 2026](https://www.flow.ninja/blog/cms-migration-guide)
- [Content Migration Best Practices](https://www.contentful.com/blog/content-migration/)
- [SEO Migration Strategy 2026](https://www.influize.com/blog/seo-migration-strategy)
- [Next.js App Router Migration](https://nextjs.org/docs/app/guides/migrating/app-router-migration)

### Cross-Linking & Hyperlinking Pitfalls
- [7 Common Internal Linking Mistakes](https://www.quattr.com/improve-discoverability/internal-linking-mistakes)
- [Automated Internal Linking Guide 2026](https://koanthic.com/en/automated-internal-linking-7-best-tools-guide-2026/)
- [Internal Linking Strategy 2026](https://topicalmap.ai/blog/auto/internal-linking-strategy-guide-2026)
- [Anchor Text Optimization SEO 2026](https://elysiandigitalservices.com/acnhor-text-in-seo-tips/)
- [Hyperlink Usability Guidelines](https://usabilitygeek.com/hyperlink-usability-guidelines-usable-links/)

### Content Source Merging
- [Automated Merging of Conflicting Knowledge Bases](https://www.researchgate.net/publication/223707789_Automated_merging_of_conflicting_knowledge_bases_using_a_consistent_majority-rule_approach_with_knowledge-form_maintenance)
- [Third-Party Data Deduplication](https://docs.tenable.com/quick-reference/third-party-connectors/Content/connectors/QRG/asset-deduping.htm)
- [Authoritative Sources Guide](https://contentwriters.com/blog/the-professional-writers-guide-to-authoritative-sources/)

### URL Migration & Redirects
- [How Changing URLs Affects SEO](https://www.americaneagle.com/insights/blog/post/how-changing-urls-affects-seo)
- [SEO Site Migration Checklist 2026](https://www.shopify.com/enterprise/blog/replatforming-seo-strategies)
- [Enterprise-Level Migrations Guide (100,000+ URLs)](https://www.searchenginejournal.com/enterprise-level-migrations-guide/489489/)
- [Migrate Website Without Breaking URLs and SEO](https://ezycourse.com/blog/migrate-your-website-without-breaking-urls-seo)

### Content Deduplication
- [AI Fuzzy Duplicates in Large Datasets](https://futuresearch.ai/semantic-deduplication/)
- [ASySD Automated Deduplicator](https://pmc.ncbi.nlm.nih.gov/articles/PMC10483700/)
- [Fuzzy Matches in Deduplication](https://www.salesforceben.com/what-are-fuzzy-matches-in-salesforce-deduplication/)
- [CRM Deduplication Guide 2025](https://www.rtdynamic.com/blog/crm-deduplication-guide-2025/)

### Information Architecture & Navigation
- [Top 10 IA Mistakes](https://www.nngroup.com/articles/top-10-ia-mistakes/)
- [3 IA Mistakes That Frustrate Users](https://evolvingweb.com/blog/3-information-architecture-mistakes-frustrate-your-users)
- [Information Architecture Trends 2026](https://slickplan.com/blog/information-architecture-trends)
- [6 Ways to Fix Confused IA](https://www.nngroup.com/articles/fixing-information-architecture/)

### Mobile Long-Form Content
- [Reading Content on Mobile Devices](https://www.nngroup.com/articles/mobile-content/)
- [7 UI Pitfalls Mobile App Developers Should Avoid 2026](https://www.webpronews.com/7-ui-pitfalls-mobile-app-developers-should-avoid-in-2026/)
- [Knowledge Workers Read-Later 2026](https://www.infoflow.app/en/blog/knowledge-workers-read-later-2026)
- [5 UX Design Tips for Long-Form Content](https://www.thecreativemomentum.com/blog/5-ux-design-tips-to-maximize-long-form-content)

### Table of Contents UX
- [Table of Contents: Ultimate Design Guide](https://www.nngroup.com/articles/table-of-contents/)
- [Sticky TOC & Mobile](https://generatepress.com/forums/topic/toc-sticky-under-header-on-mobile/)
- [Experiments Building Mobile-Friendly TOC](https://paul.kinlan.me/experiments-in-buildin-a-mobile-friendly-table-of-contents/)
- [Table of Contents UI Design](https://mobbin.com/glossary/table-of-contents)

### Progressive vs. Big Bang Migration
- [Big Bang vs. Progressive Modernization](https://appstekcorp.com/blog/progressive-modernization-enterprise-transformation/)
- [Big Bang vs. Phased ERP Implementation](https://www.techtarget.com/searcherp/tip/Big-bang-vs-phased-ERP-implementation-Which-is-best)
- [E-Commerce Replatforming](https://www.front-commerce.com/e-commerce-replatforming-big-bang-or-progressive-migration/)
- [What Is Progressive Delivery](https://amplitude.com/explore/experiment/what-is-progressive-delivery)

### Legislative Documentation
- [Legislative Document Guide](https://www.sciencedirect.com/topics/computer-science/legislative-document)
- [Authenticated Digital Publishing](https://www.congress.gov/help/faq/legislative-documents-pre-digital-publishing)
- [Library of Congress Formats 2025-2026](https://www.loc.gov/preservation/resources/rfs/RFS%202025-2026.pdf)
- [Legal Document Fonts & Style Guide](https://www.filevine.com/blog/legal-document-fonts-style-and-sizing-a-comprehensive-guide/)

### User Adoption & Change Resistance
- [Why 70% of Digital Transformations Fail](https://webvillee.com/blogs/why-70-of-digital-transformations-fail-the-user-adoption-crisis-no-one-talks-about/)
- [Digital Transformation Statistics 2026](https://mooncamp.com/blog/digital-transformation-statistics)
- [105+ Digital Transformation Statistics](https://mooncamp.com/blog/digital-transformation-statistics)
- [Data Transformation Challenge Statistics 2026](https://www.integrate.io/blog/data-transformation-challenge-statistics/)

### Scope Creep & Feature Bloat
- [Feature Creep Definition](https://en.wikipedia.org/wiki/Feature_creep)
- [Feature Creep: Causes & How to Avoid](https://www.june.so/blog/feature-creep-causes-consequences-and-how-to-avoid-it)
- [Feature Creep Anti-Pattern](https://www.minware.com/guide/anti-patterns/feature-creep)
- [What is Feature Creep in Product Development](https://hellopm.co/what-is-feature-creep/)

---
*Pitfalls research for: Wikipedia-style encyclopedia transformation of existing roofing COP app*
*Researched: 2026-02-12*
