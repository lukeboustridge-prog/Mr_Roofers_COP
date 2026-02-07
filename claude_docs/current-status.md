# Current Status & Roadmap

## What's Built

- Database schema with 11 tables (Drizzle ORM + Neon PostgreSQL)
- 150+ standards mapped across 10 domains
- 620-page MRM COP content extracted and structured
- 3D models mapped and ready (Cloudflare R2 + Three.js)
- Interactive 3D step viewer with stage synchronisation
- Error boundary (`Model3DErrorBoundary`) with 2D fallback thumbnail + retry
- `setCrossOrigin('anonymous')` on GLB loaders for CORS
- Cache headers for `.glb` files in `next.config.mjs`
- Dual-mode architecture (Planner/Fixer) implemented
- Next.js 14 app with Clerk auth, PWA capabilities
- Breadcrumbs navigation across all detail views
- Global search in header (Cmd+K / Ctrl+K via CommandSearch)
- Content linking between details, failure cases, and checklists
- QA checklists with photo upload and print support
- Case law (failures) module with MBIE Determinations and LBP decisions
- Admin content management (failures, details, links)

## Current Phase: Usability & Production Readiness (through Phase 12 / v1.1)

Moved from "build the system" to "make it indispensable."

## Remaining Production Gaps

### 1. Cloudflare R2 Bucket CORS Configuration

**Status:** App-side handling is complete (error boundary, 2D fallback, crossOrigin headers, cache config). Only the R2 bucket CORS policy remains — this is an infrastructure configuration, not a code change.

**Cloudflare Dashboard steps:**
1. Go to R2 > Bucket > Settings > CORS Policy
2. Add allowed origins: `http://localhost:3000`, production domain (e.g. `https://cop.ranz.org.nz`)
3. Allowed methods: `GET`, `HEAD`
4. Allowed headers: `*`
5. Max age: `86400`

**JSON equivalent:**
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://cop.ranz.org.nz"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

### 2. Missing Documentation

**Problem:** README.md is empty, no setup instructions
**Impact:** Blocks onboarding, deployment, CI/CD
**Fix Required:** Complete README with env vars, setup steps, database hydration

## Usability Sprints

### Sprint 1: Navigation & Discoverability — DONE
1. ~~Implement breadcrumbs~~ — Built (`components/navigation/Breadcrumbs.tsx` + `lib/breadcrumb-utils.ts`), deployed across planner, fixer, failures, checklists, and topics pages
2. ~~Global search in header~~ — Built (`components/search/CommandSearch.tsx`) with Cmd+K / Ctrl+K, fuzzy search, recent searches
3. ~~Smart "Back" button~~ — Present on all detail/sub-pages

### Sprint 2: Mobile Fixer Optimization
1. Touch target audit (all interactive elements >= 44px, bottom-sheet drawer for filters)
2. 3D viewer mobile gestures (pinch to zoom, double-tap reset, swipe down dismiss)
3. Offline indicator (status badge, pre-cache popular details, sync favourites)

### Sprint 3: Context & Intelligence
1. Dynamic warnings system (parse MBIE Determinations, contextual warnings on details)
2. Related details suggestions (based on typical installation sequences)
3. Quick reference mode (checklist view for on-site, step-by-step with checkboxes, PDF export)

### Sprint 4: Production Hardening
1. ~~Error boundaries~~ — Built (`Model3DErrorBoundary` wrapping Canvas with `Fallback2D` thumbnail + retry)
2. Loading states (skeleton loaders, progress indicators, optimistic UI)
3. Performance audit (Lighthouse >= 90 mobile, lazy-load 3D, next/image optimization)

## Technical Debt

### Immediate
- [ ] Configure R2 bucket CORS policy (infrastructure — see steps above)
- [ ] Write README.md with setup instructions

### Short-term (Before Launch)
- [ ] Playwright tests for 3D rendering
- [ ] Offline PWA functionality tested
- [ ] Mobile gesture library for 3D viewer
- [ ] Type safety audit (`tsc --noEmit`)

### Medium-term (Post-Launch)
- [ ] CMS for content updates
- [ ] Version control for quarterly MRM updates
- [ ] Analytics dashboard (track popular details, search terms)

## Success Metrics

### Usability
- 95% of users find target detail in <= 3 clicks
- 3D models load in < 2 seconds on 4G
- Zero navigation-related support tickets after launch
- Fixer mode usable with work gloves on (95% success rate)

### Adoption
- 80% of RANZ members using it within 6 months
- Replaces PDF downloads as primary reference
- Positive feedback from LBPs during inspections

### Industry Impact
- Reduction in MBIE Determinations for covered details (tracked annually)
- Faster LBP Board case resolutions (better documentation)
- Manufacturer spec alignment (fewer custom variations)
