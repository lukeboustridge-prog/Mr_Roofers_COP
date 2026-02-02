---
phase: 10
plan: 01
subsystem: content-composition
tags: [ui-components, image-gallery, lightbox, linked-content, cross-source-attribution]
requires: [07-01, 08-01, 08-02]
provides: [ImageGallery, ImageLightbox, RelatedContentTab]
affects: [10-02]
tech-stack:
  added: []
  patterns: [conditional-rendering, dialog-modal, keyboard-navigation]
key-files:
  created:
    - components/details/ImageGallery.tsx
    - components/details/ImageLightbox.tsx
    - components/details/RelatedContentTab.tsx
  modified: []
decisions:
  - id: DETAIL-IMG-01
    decision: Use Box icon (not Cube) for 3D model badges
    rationale: Consistency with ContentCapabilityBadges from Phase 8
    alternatives: [Cube icon (doesn't exist in lucide-react)]
  - id: DETAIL-IMG-02
    decision: ImageLightbox includes visible close button (12×12) in top-right
    rationale: Mobile accessibility - ESC key not obvious on touch devices
    alternatives: [Rely only on backdrop click, smaller X button]
  - id: DETAIL-IMG-03
    decision: ImageGallery uses explicit length check (!images || images.length === 0)
    rationale: Avoids rendering "0" when using truthiness check (images.length &&)
    alternatives: [Truthiness check (would render "0")]
  - id: DETAIL-LINK-01
    decision: RelatedContentTab shows two sections (supplements and supplementsTo)
    rationale: Bidirectional link display - MRM shows RANZ guides, RANZ shows MRM specs
    alternatives: [Single unified list (loses directional context)]
metrics:
  duration: 3 minutes
  completed: 2026-02-02
---

# Phase 10 Plan 01: Image Gallery and Related Content Components

**One-liner:** Interactive image gallery with keyboard-navigable lightbox and cross-source related content display with authority-aware styling.

## What Was Built

Created three reusable UI components for Phase 10 detail page enhancement:

1. **ImageLightbox** - Full-screen image viewer with Dialog modal
   - Keyboard navigation (Left/Right arrows, Escape to close)
   - Previous/Next navigation buttons with disabled states
   - Large touch-friendly close button (12×12) for mobile
   - Image counter display (e.g., "2 of 5")
   - Dark overlay background for focus

2. **ImageGallery** - Grid of clickable image thumbnails
   - Responsive grid layout (2-column mobile, 3-column desktop)
   - Hover effects and focus ring for accessibility
   - Opens lightbox on thumbnail click
   - Graceful null/empty array handling
   - Next.js Image optimization with responsive sizes

3. **RelatedContentTab** - Cross-source linked content display
   - Section 1: Installation Guides & Supplements (RANZ guides linked to MRM specs)
     - SourceBadge with supplementary authority styling (grey)
     - "3D Model Available" badge when modelUrl exists
     - "View Guide" navigation links
   - Section 2: Related Specifications (MRM specs this RANZ guide supports)
     - SourceBadge with authoritative authority styling (blue)
     - Blue border accent (border-primary/20)
     - "View Spec" navigation links
   - Line-clamped descriptions for consistent card heights
   - Returns null if no linked content in either direction

## Key Decisions Made

### 1. Box Icon for 3D Models (DETAIL-IMG-01)

**Decision:** Use `Box` icon from lucide-react, not `Cube`

**Context:** Initial implementation attempted to use `Cube` icon to match 3D model semantics, but lucide-react exports `Box` instead.

**Resolution:** Changed to `Box` icon, which maintains consistency with existing `ContentCapabilityBadges` component from Phase 8.

**Impact:** Visual consistency across all 3D model indicators in the application.

### 2. Large Close Button in Lightbox (DETAIL-IMG-02)

**Decision:** Use 12×12 (w-12 h-12) close button with black/50 background in top-right corner

**Context:** Lightbox needs to work on mobile devices where ESC key is not available.

**Resolution:** Added large, high-contrast close button with explicit "Close" screen reader label.

**Impact:** Improved mobile accessibility and user confidence in exit mechanism.

### 3. Explicit Length Check for Empty Arrays (DETAIL-IMG-03)

**Decision:** Use `!images || images.length === 0` instead of `!images?.length`

**Context:** React renders the number `0` when using truthiness checks like `{images.length && <Gallery />}`.

**Resolution:** Explicit boolean comparison ensures component returns `null` rather than rendering "0".

**Impact:** Prevents common React anti-pattern of rendering falsy numbers.

### 4. Bidirectional Link Sections (DETAIL-LINK-01)

**Decision:** RelatedContentTab has two distinct sections (supplements and supplementsTo)

**Context:** Detail links are bidirectional - MRM can link to RANZ, RANZ can link to MRM.

**Resolution:**
- Section 1: "Installation Guides & Supplements" (content this detail links TO)
- Section 2: "Related Specifications" (content that links TO this detail)

**Impact:** User understands relationship direction and authority hierarchy.

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

### Manual Testing Checklist
- [ ] ImageGallery renders 2-column grid on mobile
- [ ] ImageGallery renders 3-column grid on desktop
- [ ] Clicking thumbnail opens lightbox with correct image
- [ ] Lightbox shows image counter (e.g., "2 of 5")
- [ ] Left/Right arrow buttons navigate between images
- [ ] Left/Right keyboard keys navigate between images
- [ ] Close button (X) closes lightbox
- [ ] Escape key closes lightbox
- [ ] Clicking backdrop closes lightbox
- [ ] Navigation buttons are disabled at first/last image
- [ ] RelatedContentTab shows supplements section when data exists
- [ ] RelatedContentTab shows supplementsTo section when data exists
- [ ] RelatedContentTab returns null when no linked content
- [ ] SourceBadge shows blue styling for authoritative content
- [ ] SourceBadge shows grey styling for supplementary content
- [ ] "3D Model Available" badge appears when modelUrl exists
- [ ] "View Guide" and "View Spec" links navigate correctly

### TypeScript Validation
All components pass TypeScript compilation with no errors:
```bash
npx tsc --noEmit
# ✓ No errors
```

## Integration Points

### Consumed By (Plan 10-02)
- `DetailViewer.tsx` will integrate ImageGallery into "Technical Images" tab
- `DetailViewer.tsx` will integrate RelatedContentTab as new "Related Content" tab

### Depends On
- Phase 7 Plan 01: `detailLinks` table and `LinkedDetail` type from `detail-links.ts`
- Phase 8 Plan 01: `SourceBadge` component with authority variants
- Phase 8 Plan 02: `ContentCapabilityBadges` icon convention (Box for 3D models)

### Data Flow
```
getDetailWithLinks(detailId)
  ↓
{
  ...detail,
  supplements: LinkedDetail[],      // For RelatedContentTab section 1
  supplementsTo: LinkedDetail[],    // For RelatedContentTab section 2
  images: string[]                  // For ImageGallery
}
  ↓
<ImageGallery images={detail.images} detailCode={detail.code} />
<RelatedContentTab
  supplements={detail.supplements}
  supplementsTo={detail.supplementsTo}
/>
```

## File Manifest

### Created Files
1. `components/details/ImageGallery.tsx` (1,721 bytes)
   - Grid layout with clickable thumbnails
   - Client component with state for lightbox control
   - Exports: `ImageGallery`

2. `components/details/ImageLightbox.tsx` (4,081 bytes)
   - Dialog-based full-screen viewer
   - Keyboard and button navigation
   - Exports: `ImageLightbox`

3. `components/details/RelatedContentTab.tsx` (4,277 bytes)
   - Two-section linked content display
   - Authority-aware styling via SourceBadge
   - Exports: `RelatedContentTab`

### Modified Files
None

## Commits

- `92b2439`: Create ImageGallery and ImageLightbox components
- `80a446e`: Create RelatedContentTab component

## Next Phase Readiness

### Blockers
None

### Concerns
None - components are ready for integration

### Recommendations for Plan 10-02
1. Use conditional tab rendering pattern from research (tabs.filter(t => t.show))
2. Place ImageGallery in "Technical Images" tab (only show tab if images.length > 0)
3. Place RelatedContentTab in "Related Content" tab (only show tab if has linked content)
4. Ensure tab order: Overview → 3D Model → Technical Images → Installation → Related Content → Warnings

## Success Metrics

| Criterion | Status | Evidence |
|-----------|--------|----------|
| ImageGallery handles empty arrays | ✓ | Early return with explicit length check |
| ImageLightbox has visible close button | ✓ | 12×12 button in top-right |
| RelatedContentTab uses SourceBadge | ✓ | Imports from @/components/authority |
| All components are client components | ✓ | "use client" directive at top of each file |
| TypeScript compilation successful | ✓ | npx tsc --noEmit passes |
| Named exports (not default) | ✓ | export function ComponentName |

**Plan status:** COMPLETE

---

*Created: 2026-02-02*
*Duration: 3 minutes*
*Wave: 1*
