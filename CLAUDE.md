# CLAUDE.md - Master Roofers Code of Practice

> **This file is your persistent reference for the entire build. Refer back to it whenever you need context on architecture, schemas, components, or acceptance criteria.**

---

## 🎯 Project Overview

**What we're building:** A Next.js 14 Progressive Web App that transforms New Zealand's roofing Code of Practice from static PDFs into an interactive, context-aware mobile-first knowledge system with 3D detail viewers, dynamic warnings from real failure cases, and offline functionality.

**Who it's for:** New Zealand roofers who need quick access to correct installation details both in the office (planning) and on-site (fixing).

**Key Innovation:** Dual-mode interface ("Planner" for desktop, "Fixer" for mobile), three-click navigation to any detail, ventilation integrated into every detail, and cautionary tags linked to real LBP/MBIE failure cases.

---

## 🏗️ Tech Stack (DO NOT DEVIATE)

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 14 (App Router) | Use App Router, NOT Pages Router |
| Database | Neon PostgreSQL | Serverless Postgres |
| ORM | Drizzle | Type-safe, lightweight |
| Auth | Clerk | Handles sign-in, user sync via webhook |
| Storage | Cloudflare R2 | S3-compatible for 3D models, images |
| 3D Graphics | Three.js + React Three Fiber | @react-three/fiber, @react-three/drei |
| Styling | Tailwind CSS + shadcn/ui | Use shadcn components where available |
| State | Zustand | With persist middleware for local storage |
| Hosting | Vercel | Auto-deploy from main branch |
| Validation | Zod | Schema validation for API/forms |

---

## 📁 Directory Structure

```
master-roofers-cop/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # Dashboard shell with Header/Sidebar
│   │   ├── page.tsx                        # HOME - Dashboard with mode selection
│   │   ├── planner/
│   │   │   ├── page.tsx                    # PLANNER-HOME - Substrate selector
│   │   │   └── [substrate]/
│   │   │       ├── page.tsx                # PLANNER-SUBSTRATE - Category grid
│   │   │       └── [category]/
│   │   │           ├── page.tsx            # PLANNER-CATEGORY - Detail listing
│   │   │           └── [detailId]/
│   │   │               └── page.tsx        # PLANNER-DETAIL - Full detail view
│   │   ├── fixer/
│   │   │   ├── page.tsx                    # FIXER-HOME - 2-step context selector
│   │   │   └── results/page.tsx            # FIXER-RESULTS - Filtered details
│   │   ├── search/page.tsx                 # SEARCH - Full search with filters
│   │   ├── favourites/page.tsx             # FAVOURITES - Saved details
│   │   ├── failures/
│   │   │   ├── page.tsx                    # FAILURES-LIST - Browse failure cases
│   │   │   └── [caseId]/page.tsx           # FAILURE-DETAIL - Single case view
│   │   └── settings/page.tsx               # SETTINGS - Preferences, offline data
│   ├── api/
│   │   ├── details/
│   │   │   ├── route.ts                    # GET: list, POST: create (admin)
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET: single detail
│   │   │       └── steps/route.ts          # GET: step-by-step instructions
│   │   ├── search/route.ts                 # GET: full-text search
│   │   ├── failures/
│   │   │   ├── route.ts                    # GET: list failures
│   │   │   └── [id]/route.ts               # GET: single failure
│   │   ├── favourites/
│   │   │   ├── route.ts                    # GET: list, POST: add
│   │   │   └── [detailId]/route.ts         # DELETE: remove
│   │   ├── history/route.ts                # GET: recent, POST: record view
│   │   ├── checklists/
│   │   │   ├── route.ts                    # GET: list, POST: create
│   │   │   └── [id]/route.ts               # PATCH: update items
│   │   ├── preferences/route.ts            # GET/PATCH user preferences
│   │   ├── substrates/
│   │   │   ├── route.ts                    # GET: all substrates
│   │   │   └── [id]/categories/route.ts    # GET: categories for substrate
│   │   └── webhooks/
│   │       └── clerk/route.ts              # POST: Clerk user sync
│   ├── layout.tsx                          # Root layout with ClerkProvider
│   └── globals.css
├── components/
│   ├── ui/                                 # shadcn/ui components
│   ├── layout/
│   │   ├── Header.tsx                      # Logo, SearchBar, ModeToggle, UserButton
│   │   ├── Sidebar.tsx                     # Desktop navigation
│   │   ├── MobileNav.tsx                   # Bottom nav for mobile
│   │   └── ModeToggle.tsx                  # Planner/Fixer switch
│   ├── details/
│   │   ├── DetailCard.tsx                  # Card for listings
│   │   ├── DetailViewer.tsx                # Full detail page component
│   │   ├── Model3DViewer.tsx               # Three.js canvas with controls
│   │   ├── StepByStep.tsx                  # Installation steps with checkboxes
│   │   └── VentilationCheck.tsx            # Mandatory ventilation checklist
│   ├── warnings/
│   │   ├── DynamicWarning.tsx              # Context-aware warning display
│   │   ├── CautionaryTag.tsx               # Failure case badge
│   │   └── FailureBadge.tsx                # Red badge for failure count
│   ├── search/
│   │   ├── SearchBar.tsx                   # Header search input
│   │   ├── VoiceSearch.tsx                 # Web Speech API integration
│   │   └── FilterPanel.tsx                 # Search filters sidebar
│   ├── fixer/
│   │   ├── ContextSelector.tsx             # Two-step substrate+task selector
│   │   ├── SubstrateGrid.tsx               # 6 substrate visual cards
│   │   └── TaskSelector.tsx                # Task type buttons
│   └── checklists/
│       ├── QAChecklist.tsx                 # Full checklist component
│       └── ChecklistItem.tsx               # Single checkbox item
├── lib/
│   ├── db/
│   │   ├── index.ts                        # Drizzle client export
│   │   ├── schema.ts                       # All table definitions
│   │   └── migrations/                     # Generated migrations
│   ├── storage.ts                          # R2 upload/download helpers
│   ├── utils.ts                            # cn(), formatDate(), etc.
│   └── constants.ts                        # Substrates, categories, wind zones
├── hooks/
│   ├── useOffline.ts                       # Online/offline detection
│   ├── useFavourites.ts                    # Favourites CRUD
│   ├── useSearch.ts                        # Search with debounce
│   └── useWarnings.ts                      # Evaluate warnings against context
├── stores/
│   └── app-store.ts                        # Zustand store
├── types/
│   └── index.ts                            # TypeScript interfaces
├── public/
│   ├── models/                             # 3D model files (.glb)
│   └── icons/                              # Substrate icons, app icons
├── middleware.ts                           # Clerk auth middleware
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 🗄️ Database Schema (Drizzle)

### Core Tables

```typescript
// lib/db/schema.ts

import { pgTable, text, timestamp, boolean, integer, jsonb, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS (synced from Clerk)
// ============================================
export const users = pgTable('users', {
  id: text('id').primaryKey(),                    // Clerk user ID
  email: text('email').notNull(),
  name: text('name'),
  imageUrl: text('image_url'),
  preferences: jsonb('preferences').$type<{
    windZone?: string;
    corrosionZone?: string;
    defaultSubstrate?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// SUBSTRATES (6 types)
// ============================================
export const substrates = pgTable('substrates', {
  id: text('id').primaryKey(),                    // e.g., 'profiled-metal'
  name: text('name').notNull(),                   // e.g., 'Profiled Metal'
  description: text('description'),
  iconUrl: text('icon_url'),
  sortOrder: integer('sort_order').default(0),
});

// ============================================
// CATEGORIES (within substrates)
// ============================================
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  substrateId: text('substrate_id').references(() => substrates.id),
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  sortOrder: integer('sort_order').default(0),
});

// ============================================
// SUBCATEGORIES (optional grouping)
// ============================================
export const subcategories = pgTable('subcategories', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').references(() => categories.id),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0),
});

// ============================================
// DETAILS (the core COP entries)
// ============================================
export const details = pgTable('details', {
  id: text('id').primaryKey(),                    // e.g., 'F07'
  code: text('code').notNull().unique(),          // Display code
  name: text('name').notNull(),
  description: text('description'),
  substrateId: text('substrate_id').references(() => substrates.id),
  categoryId: text('category_id').references(() => categories.id),
  subcategoryId: text('subcategory_id').references(() => subcategories.id),
  modelUrl: text('model_url'),                    // 3D model path (R2)
  thumbnailUrl: text('thumbnail_url'),
  minPitch: integer('min_pitch'),                 // Minimum roof pitch (degrees)
  maxPitch: integer('max_pitch'),                 // Maximum roof pitch (degrees)
  specifications: jsonb('specifications').$type<{
    minWidth?: string;
    material?: string;
    overlap?: string;
    [key: string]: string | undefined;
  }>(),
  standardsRefs: jsonb('standards_refs').$type<Array<{
    code: string;      // e.g., 'E2/AS1'
    clause: string;    // e.g., 'Table 20'
    title: string;
  }>>(),
  ventilationReqs: jsonb('ventilation_reqs').$type<Array<{
    check: string;
    required: boolean;
  }>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  substrateIdx: index('idx_details_substrate').on(table.substrateId),
  categoryIdx: index('idx_details_category').on(table.categoryId),
  codeIdx: index('idx_details_code').on(table.code),
}));

// ============================================
// DETAIL STEPS (installation instructions)
// ============================================
export const detailSteps = pgTable('detail_steps', {
  id: text('id').primaryKey(),
  detailId: text('detail_id').references(() => details.id),
  stepNumber: integer('step_number').notNull(),
  instruction: text('instruction').notNull(),
  imageUrl: text('image_url'),
  cautionNote: text('caution_note'),
});

// ============================================
// WARNING CONDITIONS (dynamic warnings)
// ============================================
export const warningConditions = pgTable('warning_conditions', {
  id: text('id').primaryKey(),
  detailId: text('detail_id').references(() => details.id),
  conditionType: text('condition_type').notNull(), // 'wind_zone', 'corrosion_zone', 'pitch', etc.
  conditionValue: text('condition_value').notNull(),
  warningText: text('warning_text').notNull(),
  severity: text('severity').default('warning'),   // 'info' | 'warning' | 'critical'
  nzbcRef: text('nzbc_ref'),                       // Reference to NZBC clause
});

// ============================================
// FAILURE CASES (from MBIE/LBP decisions)
// ============================================
export const failureCases = pgTable('failure_cases', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().unique(),      // e.g., 'MBIE-2024/042'
  substrateTags: jsonb('substrate_tags').$type<string[]>(),
  detailTags: jsonb('detail_tags').$type<string[]>(),
  failureType: text('failure_type'),               // 'water-ingress' | 'structural' | 'durability' | 'workmanship'
  nzbcClauses: jsonb('nzbc_clauses').$type<string[]>(),
  outcome: text('outcome'),                        // 'upheld' | 'partially-upheld' | 'dismissed'
  summary: text('summary'),                        // Plain-language 2-3 sentence summary
  sourceUrl: text('source_url'),
  decisionDate: timestamp('decision_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// DETAIL-FAILURE LINKS (many-to-many)
// ============================================
export const detailFailureLinks = pgTable('detail_failure_links', {
  detailId: text('detail_id').references(() => details.id).notNull(),
  failureCaseId: text('failure_case_id').references(() => failureCases.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.detailId, table.failureCaseId] }),
}));

// ============================================
// USER FAVOURITES
// ============================================
export const userFavourites = pgTable('user_favourites', {
  userId: text('user_id').references(() => users.id).notNull(),
  detailId: text('detail_id').references(() => details.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.detailId] }),
}));

// ============================================
// USER HISTORY (recent views)
// ============================================
export const userHistory = pgTable('user_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  detailId: text('detail_id').references(() => details.id),
  viewedAt: timestamp('viewed_at').defaultNow(),
}, (table) => ({
  userIdx: index('idx_history_user').on(table.userId),
}));

// ============================================
// CHECKLISTS (user-completed QA)
// ============================================
export const checklists = pgTable('checklists', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  detailId: text('detail_id').references(() => details.id),
  projectRef: text('project_ref'),                 // User's job reference
  items: jsonb('items').$type<Array<{
    item: string;
    completed: boolean;
    note?: string;
    photoUrl?: string;
  }>>(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('idx_checklists_user').on(table.userId),
}));
```

---

## 🔌 API Endpoints

### Details API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/details` | List details with filters (substrate, category, q, limit, offset) |
| GET | `/api/details/[id]` | Get single detail with warnings and failures |
| GET | `/api/details/[id]/steps` | Get step-by-step instructions |
| GET | `/api/details/search` | Full-text search across details |

**GET /api/details Response:**
```json
{
  "data": [{
    "id": "F07",
    "code": "F07",
    "name": "Valley Flashing",
    "substrate": { "id": "profiled-metal", "name": "Profiled Metal" },
    "category": { "id": "flashings", "name": "Flashings" },
    "thumbnailUrl": "https://r2.../f07-thumb.jpg",
    "warningCount": 2,
    "failureCount": 1
  }],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

**GET /api/details/[id] Response:**
```json
{
  "id": "F07",
  "code": "F07",
  "name": "Valley Flashing",
  "description": "...",
  "substrate": { "id": "profiled-metal", "name": "Profiled Metal" },
  "category": { "id": "flashings", "name": "Flashings" },
  "modelUrl": "https://r2.../f07-model.glb",
  "thumbnailUrl": "https://r2.../f07-thumb.jpg",
  "minPitch": 3,
  "maxPitch": 60,
  "specifications": { "minWidth": "400mm", "material": "0.55mm G550" },
  "standardsRefs": [
    { "code": "E2/AS1", "clause": "Table 20", "title": "Flashing dimensions" }
  ],
  "ventilationChecks": [
    { "check": "Valley does not obstruct airflow", "required": true }
  ],
  "warnings": [
    { "level": "warning", "message": "Min 15° for concrete tile", "nzbcRef": "E2/AS1 Table 1" }
  ],
  "failures": [
    { "id": "LBP-2023-047", "summary": "12° pitch failure...", "outcome": "upheld" }
  ]
}
```

### Failures API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/failures` | List failure cases with filters |
| GET | `/api/failures/[id]` | Get single failure case |
| GET | `/api/failures/latest` | Get latest 5 failure cases |

### User API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favourites` | Get user's favourites |
| POST | `/api/favourites` | Add favourite { detailId } |
| DELETE | `/api/favourites/[detailId]` | Remove favourite |
| GET | `/api/history` | Get user's recent views (limit 10) |
| POST | `/api/history` | Record view { detailId } |
| GET | `/api/checklists` | Get user's checklists |
| POST | `/api/checklists` | Create checklist |
| PATCH | `/api/checklists/[id]` | Update checklist items |
| GET | `/api/preferences` | Get user preferences |
| PATCH | `/api/preferences` | Update preferences |

### Taxonomy API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/substrates` | List all substrates |
| GET | `/api/categories` | List all categories |
| GET | `/api/substrates/[id]/categories` | Categories for substrate |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/clerk` | Clerk user sync (user.created, user.updated) |

---

## 🧩 Component Specifications

### Model3DViewer
**Location:** `components/details/Model3DViewer.tsx`

```typescript
interface Model3DViewerProps {
  modelUrl: string | null;
  fallbackType: 'box' | 'wireframe';
  detailCode: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}
```

- Uses React Three Fiber with Suspense for loading
- **Placeholder:** Renders wireframe box with detail code label when modelUrl is null
- **Controls:** OrbitControls with touch support, zoom limits
- **Performance:** Use draco compression loader when models available

### DynamicWarning
**Location:** `components/warnings/DynamicWarning.tsx`

```typescript
interface DynamicWarningProps {
  warning: {
    level: 'info' | 'warning' | 'critical';
    message: string;
    nzbcRef?: string;
    conditionType?: string;
    conditionValue?: string;
  };
  userContext: {
    pitch?: number;
    windZone?: string;
    corrosionZone?: string;
    substrate?: string;
  };
}
```

- Evaluates condition against userContext
- Renders amber (caution), red (warning), or badge with link (failure)
- Animates entrance when condition becomes true

### ContextSelector (Fixer Mode)
**Location:** `components/fixer/ContextSelector.tsx`

```typescript
interface ContextSelectorProps {
  onComplete: (context: { substrate: string; task: string }) => void;
}
```

- Step 1: SubstrateGrid with large visual cards (min 48px touch)
- Step 2: TaskSelector appears after substrate selected
- Stores selection in URL search params (?substrate=X&task=Y)
- Voice input option using Web Speech API

### VentilationCheck
**Location:** `components/details/VentilationCheck.tsx`

```typescript
interface VentilationCheckProps {
  checks: Array<{ check: string; required: boolean }>;
  onCheckChange?: (index: number, checked: boolean) => void;
}
```

- **Always visible**, cannot be collapsed
- Wind icon visual indicator
- Checkbox state tracked for QA purposes

---

## 🗃️ Zustand Store

```typescript
// stores/app-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Mode
  mode: 'planner' | 'fixer';
  setMode: (mode: 'planner' | 'fixer') => void;
  
  // Fixer context
  fixerContext: {
    substrate: string | null;
    task: string | null;
  };
  setFixerContext: (context: { substrate?: string; task?: string }) => void;
  clearFixerContext: () => void;
  
  // User preferences (synced from DB when logged in)
  preferences: {
    windZone: string | null;
    corrosionZone: string | null;
    defaultSubstrate: string | null;
  };
  setPreferences: (prefs: Partial<AppState['preferences']>) => void;
  
  // Offline status
  isOffline: boolean;
  setOffline: (offline: boolean) => void;
  
  // Sync queue for offline actions
  syncQueue: Array<{ action: string; payload: any; timestamp: number }>;
  addToSyncQueue: (action: string, payload: any) => void;
  clearSyncQueue: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: 'planner',
      setMode: (mode) => set({ mode }),
      
      fixerContext: { substrate: null, task: null },
      setFixerContext: (context) => 
        set((state) => ({ 
          fixerContext: { ...state.fixerContext, ...context } 
        })),
      clearFixerContext: () => 
        set({ fixerContext: { substrate: null, task: null } }),
      
      preferences: {
        windZone: null,
        corrosionZone: null,
        defaultSubstrate: null,
      },
      setPreferences: (prefs) => 
        set((state) => ({ 
          preferences: { ...state.preferences, ...prefs } 
        })),
      
      isOffline: false,
      setOffline: (offline) => set({ isOffline: offline }),
      
      syncQueue: [],
      addToSyncQueue: (action, payload) =>
        set((state) => ({
          syncQueue: [...state.syncQueue, { action, payload, timestamp: Date.now() }]
        })),
      clearSyncQueue: () => set({ syncQueue: [] }),
    }),
    {
      name: 'master-roofers-storage',
    }
  )
);
```

---

## 🎨 Design System

### Colors (Tailwind Config)

```javascript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',      // Deep blue - professional, trustworthy
          50: '#f0f5fa',
          100: '#dae5f2',
          500: '#1e3a5f',
          600: '#182f4d',
          700: '#12243b',
        },
        secondary: {
          DEFAULT: '#f97316',      // Safety orange - warnings/CTAs
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      }
    }
  }
}
```

### Mobile-First Rules

- **Touch targets:** Minimum 48x48px
- **High contrast:** For outdoor/sunlight use
- **Font sizes:** Base 16px, headings 20-24px
- **Offline indicator:** Yellow banner at top when offline

### Responsive Breakpoints

- Mobile: < 768px (single column, bottom nav)
- Tablet: 768px - 1024px (sidebar collapsible)
- Desktop: > 1024px (full sidebar visible)

---

## 📊 The 6 Substrates

| ID | Name | Description |
|----|------|-------------|
| `profiled-metal` | Profiled Metal | Long-run, corrugated, standing seam |
| `pressed-metal` | Pressed Metal Tile | Metal tiles mimicking clay/concrete |
| `concrete-tile` | Concrete Tile | Standard concrete roof tiles |
| `clay-tile` | Clay Tile | Traditional clay roof tiles |
| `membrane` | Membrane | Single-ply, torch-on, liquid applied |
| `shingle` | Asphalt Shingle | Composition shingles |

---

## 🔧 The 5 Task Types (Fixer Mode)

| ID | Name | Icon |
|----|------|------|
| `flashings` | Flashings | Sheet icon |
| `penetrations` | Penetrations | Pipe icon |
| `junctions` | Junctions | Corner icon |
| `ventilation` | Ventilation Check | Wind icon |
| `problem` | Problem Solving | Alert icon |

---

## 🌡️ User Context Variables

Used for dynamic warnings:

| Variable | Values | Source |
|----------|--------|--------|
| `windZone` | L, M, H, VH, EH, SED | User preferences or NZS 3604 |
| `corrosionZone` | B, C, D, E | User preferences |
| `pitch` | 0-90 (degrees) | Detail-specific or user input |

---

## ⚠️ Warning Severity Levels

| Level | Color | Use Case |
|-------|-------|----------|
| `info` | Blue | General guidance, tips |
| `warning` | Amber | Conditional requirements (e.g., "if pitch < 15°") |
| `critical` | Red | Mandatory requirements, linked failure cases |

---

## 🏗️ Build Phases & Acceptance Criteria

### Phase 1: Foundation (Weeks 1-2)
**Objective:** Core infrastructure and navigation

| Task | Acceptance Criteria |
|------|---------------------|
| Next.js project setup | App runs locally with App Router structure |
| Clerk integration | Sign in/up works, user syncs to Neon via webhook |
| Neon database setup | All tables created, Drizzle schema defined |
| Cloudflare R2 setup | Can upload/retrieve files via presigned URLs |
| Basic layout | Header, sidebar, responsive shell renders |
| Home dashboard | Mode selector cards display, recent/favourites sections visible |

### Phase 2: Core Navigation (Weeks 3-4)
**Objective:** Planner mode navigation and basic detail view

| Task | Acceptance Criteria |
|------|---------------------|
| Substrate selector | 6 substrates display with icons, click navigates |
| Category grid | Categories load for selected substrate |
| Detail listing | Details list with thumbnails, pagination works |
| Detail view (basic) | Single detail page with tabs structure |
| 3D placeholder | Wireframe box renders in model viewer area |
| Seed data | 10+ sample details seeded across substrates |

### Phase 3: Fixer Mode (Weeks 5-6)
**Objective:** Context-aware filtering and mobile optimization

| Task | Acceptance Criteria |
|------|---------------------|
| Context selector | 2-step selection (substrate → task) works |
| Filtered results | Only relevant details show after context set |
| Mobile nav | Bottom nav or hamburger works on mobile |
| Touch optimization | All touch targets 48px+, swipe gestures work |
| Voice search | Microphone button triggers speech recognition |
| URL state | Context persists in URL, shareable links work |

### Phase 4: Warnings & Failures (Weeks 7-8)
**Objective:** Dynamic warning system and failure case integration

| Task | Acceptance Criteria |
|------|---------------------|
| Warning display | Warnings render on detail pages based on conditions |
| User context | Preferences (wind zone, etc.) affect warning display |
| Failure cases list | Failures browse page with filters works |
| Failure detail page | Full case view with related details links |
| Cautionary tags | Red badges appear on details with linked failures |
| Seed failure data | 10+ failure cases seeded with detail links |

### Phase 5: Ventilation & QA (Weeks 9-10)
**Objective:** Ventilation integration and checklist system

| Task | Acceptance Criteria |
|------|---------------------|
| Ventilation checks | Every detail shows ventilation checkpoint section |
| Step-by-step view | Instructions render with checkboxes |
| QA checklist creation | User can save checklist for a detail |
| Checklist persistence | Checklists sync to DB, show in user's list |
| Photo attachment | User can attach photo to checklist item (R2 upload) |
| Export checklist | PDF or print view of completed checklist |

### Phase 6: Offline & PWA (Weeks 11-12)
**Objective:** Offline functionality and installability

| Task | Acceptance Criteria |
|------|---------------------|
| Service worker | App works offline after initial load |
| Data caching | Core COP content cached, available offline |
| Sync queue | Offline actions queue and sync when online |
| PWA manifest | App installable on mobile/desktop |
| Offline indicator | UI shows offline status clearly |
| Substrate packages | User can download substrate data packages |

### Phase 7: Search & Polish (Weeks 13-14)
**Objective:** Full search and final polish

| Task | Acceptance Criteria |
|------|---------------------|
| Full-text search | Search across details, failures, and standards refs |
| Search filters | Filter by substrate, category, has warnings, etc. |
| Code search | Direct jump by detail code (e.g., type 'F07') |
| Recent details | Last 10 viewed details sync and display |
| Favourites system | Add/remove favourites, list view works |
| Performance audit | Lighthouse score 90+ on mobile |
| Accessibility audit | WCAG 2.1 AA compliance verified |

---

## 🔐 Environment Variables

```env
# .env.local

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Neon Database
DATABASE_URL=postgres://user:pass@ep-xxx.ap-southeast-2.aws.neon.tech/neondb?sslmode=require

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=master-roofers-cop
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# App Config
NEXT_PUBLIC_APP_URL=https://cop.masterroofers.co.nz
NEXT_PUBLIC_APP_ENV=development
```

---

## 📝 Key Decisions & Constraints

### 3D Model Placeholder Strategy
Until real models are provided, Model3DViewer renders a wireframe box with the detail code as a label. This allows full UX testing while models are developed separately.

### Data Seeding Priority
Focus initial seed data on **Profiled Metal** substrate with complete **Flashings** category (F01-F16 codes). This provides enough content to validate the full user flow before expanding.

### Offline Strategy

| Content Type | Strategy |
|--------------|----------|
| Core COP Text | Always cached (~15MB); delta updates on connection |
| 3D Models | User selects substrate package to download (~50MB per substrate) |
| Failure Cases | Cached summaries; full PDFs fetch on-demand when online |
| Favourites | Always cached with full 3D models |
| QA Checklists | Completed offline; queued for sync |

### Three-Click Navigation Principle
A roofer on site must reach any detail within 3 interactions:
1. Select substrate (e.g., Profiled Metal)
2. Select detail type (e.g., Valley)
3. Select specific detail (e.g., F07 Valley Flashing)

### Ventilation is Non-Negotiable
Every detail page MUST show ventilation checkpoints. This cannot be collapsed or hidden. Ventilation is treated as integral to every roof system.

---

## 🚫 DO NOT

- Use Pages Router (use App Router only)
- Skip ventilation checks on any detail
- Make touch targets smaller than 48px
- Store sensitive data in Zustand (use server-side)
- Fetch 3D models without lazy loading
- Deploy without testing offline mode
- Assume the home route is public (protect with Clerk)

---

## ✅ DO

- Use server components where possible
- Implement loading skeletons for all async content
- Test on mobile devices regularly
- Use `cn()` utility for conditional classes
- Validate all API inputs with Zod
- Include wind zone in all flashing-related warnings
- Link every failure case to relevant detail codes

---

## 🔗 Related Systems

### ranz-compliance-master.vercel.app
The COP app should integrate with this existing consenting/licensing checker:
- Shared authentication (RANZ member credentials)
- Deep linking between systems
- Shared location context (wind zone, corrosion zone)

---

## 📚 Reference Documents

These documents contain additional context if needed:
- `Master_Roofers_COP_Strategic_Design_Document.docx` - UX philosophy, dual-mode design
- `Master_Roofers_COP_Technical_Build_Spec.docx` - Full wireframes, detailed schemas
- `New_Zealand_Roofing_Industry_Complete_Standards_and_Codes_of_Practice_Compendium.md` - NZ standards reference
- `RoofingCOP_v25-12_2025-12-01.pdf` - Current NZMRM Code of Practice

---

**Now go build! Start with Phase 1 Foundation and refer back to this document whenever you need context.** 🚀
