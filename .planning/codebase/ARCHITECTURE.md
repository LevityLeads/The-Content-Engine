# Architecture

**Analysis Date:** 2026-01-22

## Pattern Overview

**Overall:** Multi-tenant SaaS with progressive content generation pipeline

**Key Characteristics:**
- **Event-driven workflow**: Inputs → Ideas → Content → Images (sequential stages)
- **Brand-scoped data isolation**: All entities filtered by `brand_id` for multi-client support
- **Prompt-driven AI**: Modular prompt system (~2900 LOC) with marketer personas, voice configs, visual styles
- **Client state management**: React Context for brand selection, persisted to localStorage
- **Async generation jobs**: Client polls `/api/images/jobs` for generation progress

## Layers

**Presentation Layer (Client):**
- Purpose: Dashboard UI for content creators to manage inputs, ideas, and content
- Location: `src/app/(dashboard)/`, `src/components/`
- Contains: React pages (page.tsx), UI components (shadcn/ui), context providers, custom hooks
- Depends on: BrandContext, useBrand, useBrandApi, API routes
- Used by: End users via Vercel-hosted Next.js app

**State Management Layer:**
- Purpose: Multi-brand selection, brand config persistence, API helper utilities
- Location: `src/contexts/brand-context.tsx`, `src/hooks/use-brand-api.ts`, `src/hooks/use-generation-jobs.ts`
- Contains: React Context for brands, localStorage persistence, brand-aware API helpers, job polling
- Depends on: `/api/brands`, `/api/images/jobs`
- Used by: All dashboard pages and components

**API Layer (Backend):**
- Purpose: Business logic, database operations, AI orchestration
- Location: `src/app/api/`
- Contains: Route handlers (POST/GET/PATCH/DELETE), Claude/Gemini integration, Supabase queries
- Depends on: Supabase client, Anthropic SDK, Google Gemini SDK
- Used by: Client-side fetch calls, generation jobs

**Data Layer:**
- Purpose: Database schema, type definitions, data access
- Location: `src/types/database.ts`, `src/lib/supabase/server.ts`
- Contains: Supabase types (auto-generated), ORM client setup, admin client for server operations
- Depends on: Supabase PostgreSQL database
- Used by: All API routes

**Prompt Engineering Layer:**
- Purpose: AI instruction generation with consistency and quality control
- Location: `src/lib/prompts/`
- Contains: System prompts, user prompt builders, voice archetypes, visual style definitions, hook patterns, content pillars
- Depends on: None (pure data/functions)
- Used by: `/api/ideas/generate`, `/api/content/generate`, `/api/images/generate`, `/api/images/carousel`

**Image Generation Orchestration:**
- Purpose: Manage multi-image generation with job tracking and carousel composition
- Location: `src/app/api/images/`
- Contains: Single image generation, carousel slide composition, background generation, job status tracking
- Depends on: Gemini SDK, Supabase (for job persistence), prompt system
- Used by: Dashboard content page

## Data Flow

**Input → Ideation → Content Generation → Image Generation:**

1. **Input Capture** (`src/app/(dashboard)/inputs/page.tsx`)
   - User submits text, URL, document, or image
   - POST `/api/inputs` → Creates `inputs` record with `brand_id`
   - Returns input ID for next stage

2. **Idea Generation** (`src/app/api/ideas/generate/route.ts`)
   - POST `/api/ideas/generate` with `inputId`
   - Fetch input + brand (includes voice_config)
   - Build prompt: `buildIdeationUserPrompt(content, type, voicePrompt)`
   - Call Claude Opus 4.5 → Parse JSON response → Create 4 `ideas` records
   - Frontend polls for completion

3. **Content Generation** (`src/app/api/content/generate/route.ts`)
   - POST `/api/content/generate` with `ideaId`, optional platforms, visualStyle
   - Fetch idea + input + brand config
   - Build prompt: `buildContentUserPrompt(idea, input, platforms, voicePrompt, visualStyle)`
   - Call Claude Opus 4.5 → Parse platform-specific copy (primary, hashtags, CTA, threads, carousel)
   - Create `content` records (one per selected platform)

4. **Image Generation** (`src/app/api/images/generate/route.ts`)
   - POST `/api/images/generate` with `contentId`, `type` (single|carousel|composite)
   - For **single images**: Generate 1 image, call Gemini with prompt
   - For **carousel**: POST `/api/images/carousel` → Generate 4 slides with visual consistency
   - For **composite**: Combine multiple images into layout
   - Create `images` records linked to `content_id`
   - Create `generation_jobs` record with status `pending`

5. **Job Polling** (Client-side via `useGenerationJobs` hook)
   - Poll `/api/images/jobs?contentId={id}` every 2s
   - Track progress (completed_items / total_items)
   - Display status: pending → generating → completed | failed
   - On failure: Show error message, allow retry

**State Transitions:**

```
inputs: pending
  ↓ (user submits)
ideas: draft → approved
  ↓ (user generates)
content: draft → approved → scheduled → published
  ↓ (user generates images)
images: (created with content)
generation_jobs: pending → generating → completed | failed
```

**State Management:**

- **Brand selection**: Stored in React Context + localStorage (`selectedBrandId`)
- **Multi-tenancy**: Query parameter `?brandId={id}` automatically added by `useBrandApi` hook
- **Generation progress**: Stored in `generation_jobs` table, polled from client
- **User inputs**: Persisted in Supabase, filtered by current brand

## Key Abstractions

**BrandContext:**
- Purpose: Centralized brand management with multi-client isolation
- Examples: `src/contexts/brand-context.tsx`, used by all dashboard pages
- Pattern: React Context + localStorage persistence + useCallback for stable references
- Methods: `selectBrand()`, `createBrand()`, `updateBrand()`, `refreshBrands()`
- Data: Brands list, selected brand, voice_config, visual_config

**Prompt System (Modular):**
- Purpose: Reusable prompt construction with guardrails and consistency
- Examples: `src/lib/prompts/content-prompt.ts` (570 LOC), `voice-system.ts`, `visual-styles.ts`
- Pattern: Export system prompt constant + builder function for user prompts
- Functions: `buildIdeationUserPrompt()`, `buildContentUserPrompt()`, `buildVoicePrompt()`
- Data: Marketer personas, hook patterns, content pillars, visual style templates

**useBrandApi Hook:**
- Purpose: Automatic brand filtering for all API calls
- Examples: `src/hooks/use-brand-api.ts`
- Pattern: Custom hook wrapping fetch with brand context injection
- Methods: `fetchWithBrand(path, params)`, `mutateWithBrand(path, method, body)`
- Behavior: Adds `?brandId={id}` to GET, adds `brandId` to POST body

**Generation Jobs Tracking:**
- Purpose: Long-running async image generation with client-side polling
- Examples: `src/hooks/use-generation-jobs.ts` (190 LOC)
- Pattern: Custom hook with interval polling, job grouping by content ID
- State: `jobsByContent` (Record<string, GenerationJob[]>), `activeJobs` array
- Methods: `isGenerating()`, `hasFailed()`, `getError()`, `clearJob()`

## Entry Points

**Root App:**
- Location: `src/app/layout.tsx`
- Triggers: Next.js App Router
- Responsibilities: Set metadata, render children

**Dashboard Layout:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: Route group wrapping all protected pages
- Responsibilities: Render sidebar + BrandProvider + main content area

**Dashboard Pages:**
- Location: `src/app/(dashboard)/{inputs,ideas,content,calendar,analytics,settings}/page.tsx`
- Triggers: User navigation or direct URL
- Responsibilities: Fetch data via `useBrandApi`, display lists/cards, handle user interactions

**API Routes:**
- Locations: `src/app/api/{brands,inputs,ideas,content,images,social-accounts}/route.ts`
- Triggers: Client-side fetch() calls
- Responsibilities: Validate request, execute business logic, return JSON response

**Image Generation Job Polling:**
- Location: `useGenerationJobs` hook in client components
- Triggers: Mount of dashboard pages with generation jobs
- Responsibilities: Interval fetch to `/api/images/jobs`, update UI with progress

## Error Handling

**Strategy:** Try-catch with detailed logging and user-friendly error messages

**Patterns:**

- **API Routes**: Catch errors, log to console, return NextResponse with 500 status + error message
  ```typescript
  try {
    // business logic
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "User-friendly message" }, { status: 500 });
  }
  ```

- **Client-side**: Fetch response checked for `.success` field, errors displayed in UI via Badge/AlertCircle
  ```typescript
  const data = await res.json();
  if (data.success) { /* handle success */ }
  else { setError(data.error); }
  ```

- **Generation Jobs**: Error message stored in `generation_jobs.error_message`, `error_code`, `error_details`
  - Polling detects failed status, displays via `GenerationStatus` component
  - User can retry via `clearJob()` then resubmit generation

- **Validation**: Required fields validated before DB operations (inputId, ideaId, contentId, etc.)

## Cross-Cutting Concerns

**Logging:**
- Strategy: `console.error()` for errors, `console.log()` for debugging
- Used in: API routes for failure diagnosis, hooks for polling errors

**Validation:**
- Strategy: TypeScript types + runtime checks
- Applied to: Request body shape, URL query params, DB response data
- Example: `Math.min(Math.max(ideaCount, 1), 10)` to clamp idea count

**Authentication:**
- Strategy: Supabase Auth (not visible in codebase, likely setup via env)
- Status: Not enforced in current code (MVP), database queries assume authenticated context

**Multi-tenancy (Brand Isolation):**
- Strategy: Query filtering by `brand_id` at every data access point
- Example: `query.eq("brand_id", brandId)` in GET routes
- Client-side: `useBrandApi` hook ensures `brandId` always included

**Type Safety:**
- Strategy: Strict TypeScript mode, auto-generated database types from Supabase
- Location: `src/types/database.ts` (auto-generated from Supabase schema)
- Applied to: API responses, database inserts/updates

---

*Architecture analysis: 2026-01-22*
