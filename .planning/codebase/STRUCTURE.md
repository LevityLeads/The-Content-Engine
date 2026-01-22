# Codebase Structure

**Analysis Date:** 2026-01-22

## Directory Layout

```
The-Content-Engine/
├── src/
│   ├── app/                          # Next.js App Router root
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Global styles
│   │   ├── (dashboard)/              # Protected dashboard routes
│   │   │   ├── layout.tsx            # Dashboard layout (sidebar + provider)
│   │   │   ├── inputs/               # Input capture page
│   │   │   ├── ideas/                # Idea review & approval page
│   │   │   ├── content/              # Content generation & editing page
│   │   │   ├── calendar/             # Scheduling page (stub)
│   │   │   ├── analytics/            # Analytics dashboard (stub)
│   │   │   └── settings/             # Brand & account settings
│   │   └── api/                      # API route handlers
│   │       ├── brands/               # Brand CRUD + website analyzer
│   │       │   ├── route.ts          # GET/POST/PATCH brands
│   │       │   └── analyze/          # POST brand analysis from URL
│   │       ├── inputs/               # Input capture
│   │       │   ├── route.ts          # POST/GET inputs
│   │       │   └── analyze-image/    # POST image analysis (Claude vision)
│   │       ├── ideas/                # Idea generation
│   │       │   ├── route.ts          # GET/PATCH/DELETE ideas
│   │       │   └── generate/         # POST idea generation from input
│   │       ├── content/              # Content generation
│   │       │   ├── route.ts          # GET/PATCH/DELETE content
│   │       │   ├── generate/         # POST content generation from idea
│   │       │   └── publish/          # POST to Late.dev (coming soon)
│   │       ├── images/               # Image generation orchestration
│   │       │   ├── generate/         # POST single/carousel image generation
│   │       │   ├── carousel/         # POST carousel composition logic
│   │       │   ├── background/       # POST background image generation
│   │       │   ├── composite/        # POST composite image logic
│   │       │   └── jobs/             # GET/DELETE generation job status
│   │       └── social-accounts/      # Late.dev OAuth & sync
│   │           ├── route.ts          # GET/POST/DELETE accounts
│   │           ├── connect/          # POST OAuth connect flow
│   │           ├── callback/         # POST OAuth callback handler
│   │           ├── [id]/             # Dynamic account routes
│   │           └── sync/             # POST sync with Late.dev
│   ├── components/
│   │   ├── brand/                    # Brand management components
│   │   │   ├── brand-switcher.tsx    # Dropdown to select/create brands
│   │   │   ├── brand-creation-dialog.tsx  # Dialog for new brand + analyzer
│   │   │   └── strictness-slider.tsx # Brand voice strictness config
│   │   ├── layout/
│   │   │   └── sidebar.tsx           # Main navigation sidebar
│   │   └── ui/                       # shadcn/ui base components
│   │       ├── button.tsx, input.tsx, textarea.tsx, etc. # Base components
│   │       ├── image-carousel.tsx    # Display carousel slides
│   │       ├── platform-mockups.tsx  # Platform preview (Twitter/LinkedIn/IG)
│   │       ├── generation-status.tsx # Progress indicator for image gen
│   │       └── [other shadcn components]
│   ├── contexts/
│   │   └── brand-context.tsx         # Multi-brand state + localStorage
│   ├── hooks/
│   │   ├── use-brand-api.ts          # Brand-aware API helper hook
│   │   └── use-generation-jobs.ts    # Generation job polling + status tracking
│   ├── lib/
│   │   ├── prompts/                  # AI prompt engineering system (~2900 LOC)
│   │   │   ├── index.ts              # Central exports
│   │   │   ├── content-prompt.ts     # Content generation system prompt (570 LOC)
│   │   │   ├── ideation-prompt.ts    # Idea generation prompt (201 LOC)
│   │   │   ├── voice-system.ts       # Brand voice config builder (229 LOC)
│   │   │   ├── visual-styles.ts      # Image generation style definitions (341 LOC)
│   │   │   ├── hook-library.ts       # Content hook patterns (158 LOC)
│   │   │   ├── content-pillars.ts    # Content strategy pillars (198 LOC)
│   │   │   └── marketer-persona.ts   # Core persona definition (91 LOC)
│   │   ├── supabase/
│   │   │   └── server.ts             # Supabase client setup + admin client
│   │   ├── utils/
│   │   │   └── [utility functions]
│   │   ├── slide-templates/          # Carousel slide templates (referenced)
│   │   ├── image-models.ts           # Image model config (Gemini models)
│   │   └── late/                     # Late.dev API integration (referenced)
│   ├── types/
│   │   └── database.ts               # Supabase schema types (auto-generated, 435 LOC)
│   ├── public/                       # Static assets
│   └── [config files]
├── supabase/
│   └── migrations/                   # Database migration files
├── docs/
│   └── PRD.md                        # Product Requirements Document
├── .claude/                          # Claude-specific config
│   ├── roles/                        # Role persona files
│   └── commands/                     # Custom command definitions
├── .github/                          # GitHub Actions CI/CD
├── package.json                      # npm dependencies
├── tsconfig.json                     # TypeScript config with @/* alias
├── next.config.ts                    # Next.js config
├── CLAUDE.md                         # Project instructions (17 KB)
├── RULES.md                          # Content strategy rules
└── README.md                         # Project overview

```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router structure (pages, API routes, layouts)
- Contains: Page components, API route handlers, layout wrappers
- Entry point for all routing

**`src/app/(dashboard)/`:**
- Purpose: Protected dashboard routes wrapped in BrandProvider
- Contains: Page.tsx files and one shared layout.tsx
- Route group pattern ensures unified layout + context

**`src/components/`:**
- Purpose: Reusable React components (UI, layout, domain-specific)
- Contains: shadcn/ui primitives + custom app components
- Organized by feature (brand, layout, ui)

**`src/lib/prompts/`:**
- Purpose: Modular AI prompt engineering system
- Contains: System prompts, builder functions, persona definitions, style configs
- ~2900 lines: Most complex logic lives here, not in API routes
- Import pattern: Central index.ts exports all

**`src/contexts/`:**
- Purpose: React Context for global state (brand management, user selection)
- Contains: BrandContext with multi-brand selection, voice/visual config
- Pattern: useContext hook for consumption, BrandProvider wrapper for dashboard

**`src/hooks/`:**
- Purpose: Custom React hooks for API calls and state management
- Contains: useBrandApi (brand-aware fetching), useGenerationJobs (polling)
- Pattern: Encapsulate side effects, expose clean API

**`src/types/`:**
- Purpose: TypeScript type definitions, especially database schema
- Contains: Auto-generated Supabase types from database
- Pattern: database.ts is the single source of truth for DB types

**`src/lib/supabase/`:**
- Purpose: Supabase client setup and authentication
- Contains: Server-side client initialization, admin client for privileged ops
- Pattern: Async factory function for SSR-safe client creation

**`supabase/migrations/`:**
- Purpose: Database migration files (version control for schema)
- Contains: SQL migration files applied to Supabase PostgreSQL
- Pattern: Incremental schema changes with rollback support

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root app layout, sets metadata
- `src/app/(dashboard)/layout.tsx`: Dashboard layout with BrandProvider + Sidebar
- `src/app/(dashboard)/inputs/page.tsx`: Input capture entry point
- `src/app/(dashboard)/ideas/page.tsx`: Idea approval entry point
- `src/app/(dashboard)/content/page.tsx`: Content generation & editing entry point

**Configuration:**
- `src/lib/image-models.ts`: Gemini model IDs and platform dimensions
- `src/lib/prompts/index.ts`: Central export for all prompt utilities
- `tsconfig.json`: TypeScript config with `@/*` path alias
- `package.json`: Dependencies (Next.js, shadcn/ui, Anthropic, Gemini, Supabase)

**Core Logic:**
- `src/lib/prompts/content-prompt.ts`: Content generation system prompt + copywriting frameworks
- `src/lib/prompts/voice-system.ts`: Brand voice builder, archetypes, quality checks
- `src/lib/prompts/visual-styles.ts`: Image generation style definitions
- `src/app/api/ideas/generate/route.ts`: Idea generation orchestration
- `src/app/api/content/generate/route.ts`: Content generation orchestration
- `src/app/api/images/generate/route.ts`: Single image generation
- `src/app/api/images/carousel/route.ts`: Carousel composition logic

**Testing:**
- No test files found (testing not yet implemented)

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: PascalCase (e.g., `BrandSwitcher.tsx`, `SideBar.tsx`)
- Utilities: kebab-case (e.g., `use-brand-api.ts`, `image-models.ts`)
- Types: `database.ts` (schema types), `*.types.ts` (domain types in components)

**Directories:**
- Feature-based: `brands/`, `inputs/`, `ideas/`, `content/`, `images/`, `social-accounts/`
- Layer-based: `components/`, `lib/`, `hooks/`, `contexts/`, `types/`
- Nested API routes: `api/{resource}/{sub-resource}/route.ts` for grouped endpoints

**Functions:**
- Hooks: `use*` prefix (e.g., `useBrand`, `useBrandApi`, `useGenerationJobs`)
- Builders: `build*` prefix (e.g., `buildVoicePrompt`, `buildIdeationUserPrompt`)
- Exports: PascalCase for components, camelCase for utilities

**Variables:**
- State: camelCase (e.g., `selectedBrand`, `jobsByContent`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `SELECTED_BRAND_KEY`, `MAX_CONTENT_LENGTH`)
- React props: camelCase with Ts types (e.g., `brand: Brand`, `onSelect: (id: string) => void`)

**Types:**
- Database: `Brand`, `Input`, `Idea`, `Content`, `Image`, `SocialAccount`
- Config: `VoiceConfig`, `VisualConfig`, `BrandWithConfig`
- API: `GenerationJob`, `BrandAnalysis`
- Domain: `InputType`, `StyleOption`, `ContentImage`, `CarouselSlide`

## Where to Add New Code

**New Feature (e.g., "Add calendar scheduling"):**
- Primary code: `src/app/(dashboard)/calendar/page.tsx` (React component)
- API endpoint: `src/app/api/scheduling/route.ts` (GET/POST/PATCH handlers)
- Types: Add to `src/types/database.ts` if schema change needed
- Hooks: Add custom hook to `src/hooks/use-scheduling.ts` if complex state
- Tests: `src/__tests__/scheduling.test.ts` (when testing implemented)

**New Component/Module:**
- Implementation: `src/components/{feature}/{component-name}.tsx`
- If reusable UI: `src/components/ui/{component-name}.tsx`
- Import shadcn/ui from `src/components/ui/`

**New Utility/Helper:**
- Shared logic: `src/lib/{feature}/utils.ts` or `src/lib/{feature}.ts`
- API helper: `src/lib/{feature}-api.ts`
- Custom hook: `src/hooks/use-{feature}.ts`

**New Prompt:**
- Add to: `src/lib/prompts/{feature}-prompt.ts`
- Export from: `src/lib/prompts/index.ts`
- Follow pattern: System prompt constant + builder function

**New API Route:**
- Location: `src/app/api/{resource}/{action}/route.ts`
- Structure:
  ```typescript
  import { createClient } from "@/lib/supabase/server";
  import { NextRequest, NextResponse } from "next/server";

  export async function POST(request: NextRequest) {
    try {
      const supabase = await createClient();
      const body = await request.json();
      // business logic
      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error("Error:", error);
      return NextResponse.json({ error: "..." }, { status: 500 });
    }
  }
  ```
- Use brand filtering: `query.eq("brand_id", brandId)` when needed
- Validate inputs before database operations

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and type definitions
- Generated: Yes (auto-created on `npm run build`)
- Committed: No (in .gitignore)
- Contains: Compiled pages, server/client bundles, type cache

**`node_modules/`:**
- Purpose: npm dependencies cache
- Generated: Yes (from package.json + package-lock.json)
- Committed: No (in .gitignore)
- Contains: React, Next.js, shadcn/ui, Anthropic SDK, Gemini SDK, Supabase SDK

**`supabase/.temp/`:**
- Purpose: Temporary files for Supabase CLI
- Generated: Yes (during development)
- Committed: No (in .gitignore)

**`.claude/`:**
- Purpose: Claude-specific persona definitions and commands
- Committed: Yes
- Contains: Role definitions, slash commands, project instructions

**`.github/`:**
- Purpose: GitHub Actions CI/CD workflows
- Committed: Yes
- Contains: Auto-merge workflow from claude/* branches to main

---

*Structure analysis: 2026-01-22*
