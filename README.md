# Master Roofers Code of Practice

A Next.js 14 Progressive Web App that transforms New Zealand's roofing Codes of Practice from static PDFs into an interactive, mobile-first knowledge system with 3D detail viewers, dynamic warnings from real failure cases, and offline functionality.

## Content Sources

The app consolidates content from multiple industry sources:

| Source | Details | Steps | 3D Models | Status |
|--------|---------|-------|-----------|--------|
| **MRM COP** | 251 | 528 | - | Active |
| **RANZ Guide** | 61 | 287 | 61 | Active |
| **Membrane COP** | - | - | - | Planned |

**Total: 312 details, 815 installation steps, 61 interactive 3D models**

## Features

### Core Functionality
- **Dual-mode Interface**: Planner mode for desktop/office use, Fixer mode for on-site mobile use
- **3D Model Viewer**: Interactive Three.js viewer with step synchronization, camera animation, and layer visibility
- **Dynamic Warnings**: 159 context-aware warnings based on wind zone, corrosion zone, and pitch
- **Failure Case Learning**: 15 linked MBIE/LBP failure cases with related detail connections
- **QA Checklists**: Step-by-step checklists with photo capture and PDF export
- **Full-text Search**: Search with filters, voice input, and direct code jump (e.g., type "F07")

### Technical Features
- **Offline Support**: PWA with service worker, downloadable substrate packages
- **Admin CMS**: Content management for details, warnings, and failure cases
- **Multi-source Architecture**: Unified interface for multiple industry COPs
- **Responsive Design**: Mobile-first with 48px minimum touch targets

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | Neon PostgreSQL |
| ORM | Drizzle |
| Auth | Clerk |
| Storage | Cloudflare R2 |
| 3D Graphics | Three.js + React Three Fiber |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Testing | Playwright |
| Hosting | Vercel |

## Prerequisites

- Node.js 18.17 or later
- npm or yarn
- A Neon PostgreSQL database
- A Clerk account
- A Cloudflare R2 bucket (for 3D models and images)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Push the database schema:

```bash
npm run db:push
```

### 3. Import Content Data

Import MRM and RANZ content:

```bash
# Import MRM Code of Practice data
npx tsx lib/db/import-mrm.ts

# Import RANZ Roofing Guide data
npx tsx lib/db/import-ranz.ts

# Set up content sources
npx tsx lib/db/seed-sources.ts
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Playwright tests |
| `npm run test:ui` | Run tests with Playwright UI |
| `npm run test:headed` | Run tests in headed browser mode |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
master-roofers-cop/
├── app/
│   ├── (auth)/                 # Sign-in/sign-up pages
│   ├── (dashboard)/            # Main app pages
│   │   ├── page.tsx            # Dashboard home
│   │   ├── planner/            # Desktop planning mode
│   │   ├── fixer/              # Mobile on-site mode
│   │   ├── search/             # Full-text search
│   │   ├── failures/           # Failure case browser
│   │   ├── checklists/         # QA checklist history
│   │   ├── favourites/         # Saved details
│   │   └── settings/           # User preferences
│   ├── (admin)/                # Admin CMS pages
│   └── api/                    # API routes
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Header, Sidebar, MobileNav, SkipLinks
│   ├── details/                # DetailViewer, Model3DViewer, StepByStep
│   ├── checklists/             # QAChecklist, ChecklistItem
│   ├── warnings/               # DynamicWarning, FailureBadge
│   ├── fixer/                  # ContextSelector, SubstrateGrid
│   └── search/                 # SearchBar, VoiceSearch, FilterPanel
├── lib/
│   ├── db/                     # Drizzle schema, queries, import scripts
│   ├── analytics.ts            # Event tracking abstraction
│   ├── export-pdf.ts           # PDF generation for checklists
│   └── utils.ts                # Utility functions
├── hooks/                      # Custom React hooks
├── stores/                     # Zustand stores
├── tests/                      # Playwright E2E tests
├── mrm_extract/                # MRM source data (JSON)
├── ranz_extract/               # RANZ source data (JSON)
└── public/
    ├── sw.js                   # Service worker
    ├── manifest.json           # PWA manifest
    └── icons/                  # App icons
```

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `content_sources` | COP sources (MRM, RANZ, Membrane) |
| `substrates` | Roofing material types |
| `categories` | Detail categories per substrate |
| `details` | Individual roof details with specs |
| `detail_steps` | Step-by-step installation instructions |
| `warning_conditions` | Dynamic warnings by condition |
| `failure_cases` | MBIE/LBP failure case records |
| `detail_failure_links` | Many-to-many failure linkages |

### User Tables

| Table | Description |
|-------|-------------|
| `users` | User profiles (synced from Clerk) |
| `user_favourites` | Saved detail bookmarks |
| `user_history` | Recently viewed details |
| `checklists` | Saved QA checklists with photos |

## Data Import Scripts

### MRM Data Enhancement

The MRM data is processed through an enhancement pipeline:

```bash
# Enhance MRM data (clean steps, extract warnings, link standards)
npx tsx scripts/enhance-mrm-data.ts

# Re-import with enhanced data
npx tsx lib/db/import-mrm.ts
```

Enhancement includes:
- Removing 1,013 garbage steps (section numbers, headers)
- Extracting 138 content-derived warnings
- Linking 20 standards references (E2/AS1, B2/AS1, etc.)
- Cleaning PDF artifacts from descriptions

### RANZ Data Import

RANZ data includes 3D models with stage synchronization:

```bash
npx tsx lib/db/import-ranz.ts
```

This imports:
- 61 installation guides with step-by-step instructions
- Stage metadata for 3D camera positions and layer visibility
- Model URLs pointing to Cloudflare R2 CDN

## Key User Flows

### Three-Click Navigation (Planner Mode)
1. Select substrate (e.g., "Long Run Metal")
2. Select category (e.g., "Flashings")
3. Select detail (e.g., "F01 - Ridge and Hip Intersections")

### Quick Lookup (Fixer Mode)
1. Select substrate type
2. Select task (e.g., "Flashings", "Penetrations")
3. View filtered relevant details

### Search
- Full-text search across details, steps, and failure cases
- Voice search using Web Speech API
- Direct code jump (type "F07" to go directly to detail)
- Filter by substrate, warnings, failures

### QA Checklists
1. Open detail page
2. Start checklist from installation steps
3. Check items, add notes, capture photos
4. Export to PDF or save for later

## Testing

Run the Playwright test suite:

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run specific test file
npx playwright test tests/navigation.spec.ts
```

Test coverage includes:
- Navigation flows (three-click, fixer mode)
- Search functionality
- 3D viewer interactions
- Error handling (404, loading states)
- Mobile responsiveness

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Post-Deployment

1. Run database migrations/seed if needed
2. Configure Clerk webhook for user sync
3. Verify R2 CORS settings for 3D models

### Cloudflare R2 CORS Configuration

```json
[
  {
    "AllowedOrigins": ["https://your-domain.vercel.app"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## PWA / Offline Support

The app works offline after initial load:

- **Service Worker**: Caches app shell, API responses, and 3D models
- **Downloadable Packages**: Users can download substrate data for offline use
- **Sync Queue**: Offline actions sync when reconnected
- **Install Prompt**: App can be installed on mobile/desktop

## Accessibility

- Skip links for keyboard navigation
- ARIA labels and roles on interactive elements
- Minimum 48px touch targets for mobile
- High contrast colors for outdoor use
- Loading skeletons for async content

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome for Android

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run build`
5. Run `npm run test` to verify tests pass
6. Submit a pull request

## License

Proprietary - Master Roofers Association of New Zealand

---

For development roadmap and technical specifications, see:
- `.planning/ROADMAP.md` - Development phases and progress
- `CLAUDE.md` - Detailed technical build specification
