# Master Roofers Code of Practice

A Next.js 14 Progressive Web App that transforms New Zealand's roofing Code of Practice from static PDFs into an interactive, mobile-first knowledge system with 3D detail viewers, dynamic warnings from real failure cases, and offline functionality.

## Features

- **Dual-mode Interface**: Planner mode for desktop/office use, Fixer mode for on-site mobile use
- **3D Model Viewer**: Interactive Three.js viewer with touch gestures for roof detail visualization
- **Dynamic Warnings**: Context-aware warnings based on wind zone, corrosion zone, and pitch
- **Failure Case Integration**: Linked MBIE/LBP failure cases for learning from real incidents
- **Installation Checklists**: Step-by-step QA checklists with photo capture
- **Global Search**: Command palette (Cmd+K) for quick navigation
- **Offline Support**: PWA with service worker for on-site use without connectivity

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
| Hosting | Vercel |

## Prerequisites

- Node.js 18.17 or later
- npm or yarn
- A Neon PostgreSQL database
- A Clerk account
- A Cloudflare R2 bucket (for 3D models)

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

Generate and push the database schema:

```bash
npm run db:push
```

### 3. Seed the Database

Populate the database with initial data (substrates, categories, details, failure cases):

```bash
npm run db:seed
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
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed database with initial data |
| `npm run upload:models` | Upload 3D models to R2 |

## Project Structure

```
master-roofers-cop/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Main app pages
│   │   ├── planner/         # Desktop planning mode
│   │   ├── fixer/           # Mobile on-site mode
│   │   ├── search/          # Search page
│   │   ├── failures/        # Failure cases
│   │   └── settings/        # User settings
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Header, Sidebar, MobileNav
│   ├── details/             # DetailViewer, Model3DViewer
│   ├── fixer/               # Fixer mode components
│   └── search/              # Search components
├── lib/
│   ├── db/                  # Drizzle schema and queries
│   └── utils.ts             # Utility functions
├── hooks/                   # Custom React hooks
├── stores/                  # Zustand stores
└── public/                  # Static assets
```

## Database Schema

Key tables:

- **substrates** - Roofing material types (metal, tile, membrane, etc.)
- **categories** - Detail categories (flashings, ridges, penetrations, etc.)
- **details** - Individual roof details with specs and 3D models
- **detail_steps** - Step-by-step installation instructions
- **warning_conditions** - Dynamic warnings by condition type
- **failure_cases** - MBIE/LBP failure case records
- **users** - User profiles (synced from Clerk)
- **user_favourites** - Saved details
- **checklists** - User QA checklists

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Cloudflare R2 CORS Configuration

For 3D models to load, configure CORS on your R2 bucket:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.vercel.app"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## Key User Flows

### Three-Click Navigation (Planner Mode)
1. Select substrate (e.g., "Long Run Metal")
2. Select category (e.g., "Flashings")
3. Select detail (e.g., "F01 - Wall Flashing")

### Quick Lookup (Fixer Mode)
1. Select substrate type
2. Select task (e.g., "Flashings", "Penetrations")
3. View filtered relevant details

### Global Search
- Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
- Search by detail code, name, or keywords
- Quick navigation to any page

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run build`
5. Submit a pull request

## License

Proprietary - Master Roofers Association of New Zealand
