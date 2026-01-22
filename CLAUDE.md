# The Content Engine

AI-powered content automation system that transforms raw inputs into polished, platform-specific social media content.

---

## CRITICAL: Role-Based Workflow (Read First)

**At the start of EVERY session, you MUST:**

1. **Analyze the user's first message** for task keywords
2. **Auto-detect the appropriate role** using the detection table below
3. **Announce your role clearly** using the announcement format
4. **Read and adopt** the role persona from `.claude/roles/[role].md`
5. **Work within your role boundaries** and hand off when complete

### Role Detection Table

| Keywords in User's Request | Detected Role | Role File |
|---------------------------|---------------|-----------|
| UI, page, component, button, dashboard, design, CSS, responsive, layout | **Frontend** | `.claude/roles/frontend.md` |
| API, database, endpoint, Supabase, query, integration, Late.dev | **Backend** | `.claude/roles/backend.md` |
| prompt, Claude, Gemini, AI, hook, voice, content quality, AI output | **AI** | `.claude/roles/ai.md` |
| brand voice, platform rules, engagement, content strategy, tone | **Strategist** | `.claude/roles/strategist.md` |
| test, verify, merge, deploy, ship, broken, bug, check, QA | **QA** | `.claude/roles/qa.md` |
| CI/CD, GitHub Actions, deployment, environment, infrastructure | **DevOps** | `.claude/roles/devops.md` |
| end-to-end, full feature, both UI and API, spans multiple areas | **Full Stack** | `.claude/roles/fullstack.md` |
| update docs, document, sync, architecture, CLAUDE.md, RULES.md | **Docs** | `.claude/roles/docs.md` |
| debug, investigate, root cause, stack trace, performance issue, race condition, why is this | **Debug** | `.claude/roles/debug.md` |
| research, explore options, validate idea, feasibility, best practices, cutting edge, trends, what if, could we, should we, alternatives, before we build | **Researcher** | `.claude/roles/researcher.md` |

### Role Announcement Format (ALWAYS USE THIS)

When you detect a role, announce it like this:

```
┌─────────────────────────────────────────────────────────┐
│ 🎭 ROLE: [Role Name]                                    │
│                                                         │
│ Task: [Brief description of what user wants]            │
│ Detected from: "[keyword]" → [why this role]            │
│                                                         │
│ I'll be working on: [relevant files/areas]              │
└─────────────────────────────────────────────────────────┘
```

Then read the role file and adopt the persona before proceeding.

### Example

User says: "Build the calendar page"

You respond:
```
┌─────────────────────────────────────────────────────────┐
│ 🎭 ROLE: Frontend Developer                             │
│                                                         │
│ Task: Build the calendar page                           │
│ Detected from: "calendar page" → UI/dashboard work      │
│                                                         │
│ I'll be working on: src/app/(dashboard)/calendar/       │
└─────────────────────────────────────────────────────────┘
```

*Reading `.claude/roles/frontend.md` and adopting Frontend Developer role...*

---

## CRITICAL: Testing Requirements (Test Before Commit)

**Every task MUST follow this test-driven workflow:**

### 1. Define Tests During Planning

Before writing any code, explicitly document:
- **What tests are needed** to verify the code works correctly
- **Expected outcomes** for each test
- **Edge cases** that should be covered

Example format:
```
┌─────────────────────────────────────────────────────────┐
│ 🧪 TEST PLAN                                            │
│                                                         │
│ Feature: [What you're building]                         │
│                                                         │
│ Tests Required:                                         │
│ 1. [Test description] → Expected: [outcome]             │
│ 2. [Test description] → Expected: [outcome]             │
│ 3. [Edge case]        → Expected: [outcome]             │
└─────────────────────────────────────────────────────────┘
```

### 2. Implement the Code

Write the feature/fix as planned.

### 3. Run All Tests Before Commit

Execute the defined tests:
```bash
npm run build          # Must pass
npm run lint           # Must pass
# + Any feature-specific tests defined in step 1
```

### 4. Commit ONLY When All Tests Pass

**DO NOT COMMIT if any test fails.** The workflow is:

```
Tests Pass? ──YES──→ Commit & Push
     │
     NO
     │
     ↓
Fix the errors
     │
     ↓
Re-run tests ──────→ (loop until all pass)
```

### 5. Test Categories by Task Type

| Task Type | Required Tests |
|-----------|----------------|
| **UI Component** | Visual renders correctly, interactions work, responsive design |
| **API Endpoint** | Returns correct data, handles errors, validates input |
| **Database Change** | Migrations run, queries work, data integrity maintained |
| **Bug Fix** | Original bug no longer occurs, no regressions introduced |
| **Refactor** | All existing functionality still works identically |

### Test Failure Protocol

If tests fail after implementation:
1. **DO NOT** commit broken code
2. **Identify** the failing test(s)
3. **Fix** the underlying issue
4. **Re-run** all tests
5. **Repeat** until all tests pass
6. **Only then** commit the changes

This ensures rock-solid code quality and prevents broken deployments.

---

## Quick Reference

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint

# Deployment (always use claude/* branches)
git push -u origin claude/your-branch  # Auto-merges to main → Vercel deploys
```

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router) | 16.1.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui (Radix + Tailwind) | - |
| Database | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth | - |
| AI - Text | Claude Opus 4.5 | claude-opus-4-5-20251101 |
| AI - Images | Google Gemini | gemini-2.5-flash-image |
| AI - Video | Google Veo 3 | veo-3.1-fast, veo-3.0 |
| Publishing | Late.dev API | Implemented |
| Hosting | Vercel | - |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── inputs/           # Input capture page
│   │   ├── ideas/            # Idea review page
│   │   ├── content/          # Content generation & review
│   │   ├── calendar/         # Scheduling with magic schedule
│   │   ├── analytics/        # Analytics (stub)
│   │   ├── experiments/      # Experiments page
│   │   └── settings/         # Brand & account settings
│   ├── api/                  # API routes
│   │   ├── brands/           # Brand CRUD + website analyzer + delete
│   │   ├── inputs/           # POST/GET inputs + image analysis
│   │   ├── ideas/            # Ideas CRUD + generate
│   │   ├── content/          # Content CRUD + generate + publish
│   │   ├── images/           # Image generation (single + carousel)
│   │   ├── videos/           # Video generation (Veo 3)
│   │   ├── social-accounts/  # Late.dev OAuth + account linking
│   │   └── schedule/         # Best time to post suggestions
│   └── layout.tsx            # Root layout
├── components/
│   ├── brand/                # Brand switcher, creation, deletion dialogs
│   ├── video/                # Video cost dialog
│   ├── ui/                   # Base components (button, card, etc.)
│   └── layout/               # Layout components (sidebar)
├── contexts/
│   └── brand-context.tsx     # Multi-client brand state management
├── hooks/
│   ├── use-brand-api.ts      # Brand-aware API helpers
│   └── use-generation-jobs.ts # Async job polling
├── lib/
│   ├── prompts/              # AI prompt system
│   │   ├── ideation-prompt.ts
│   │   ├── content-prompt.ts
│   │   ├── voice-system.ts
│   │   ├── hook-library.ts
│   │   ├── content-pillars.ts
│   │   ├── visual-styles.ts
│   │   └── marketer-persona.ts
│   ├── slide-templates/      # Carousel design system
│   │   ├── types.ts          # Design system types & presets
│   │   └── templates.tsx     # Slide template components
│   ├── late/                 # Late.dev API integration
│   │   ├── client.ts         # Publishing API client
│   │   └── types.ts          # Late.dev types
│   ├── scheduling/           # Scheduling utilities
│   │   └── best-practices.ts # Platform posting times
│   ├── supabase/             # Database clients
│   ├── image-models.ts       # Image generation config
│   ├── video-models.ts       # Veo 3 video config
│   └── video-utils.ts        # Video cost estimation
└── types/
    └── database.ts           # Supabase types

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_generation_jobs.sql
    └── 003_video_support.sql

docs/
├── PRD.md                    # Product Requirements Document
└── AUDIT_REPORT.md           # Codebase audit report
```

## Multi-Client System

The dashboard supports multiple clients/brands with isolated data and customizable style guides.

### How It Works
1. **Brand Switcher**: Dropdown in sidebar to switch between clients
2. **Add New Client**: Enter name + website URL → AI extracts brand guidelines
3. **Website Analysis**: Claude analyzes the site for voice/tone, Gemini extracts colors
4. **Example Posts Analysis**: Upload example posts for visual style alignment
5. **Style Guide**: Editable brand voice, colors, and strictness settings
6. **Data Isolation**: Each client's inputs, ideas, and content are separate
7. **Brand Deletion**: Double-confirmation deletion with data preview

### Brand Configuration
```typescript
// Voice Config (stored in brands.voice_config)
{
  tone_keywords: ["professional", "friendly"],
  words_to_avoid: ["leverage", "synergy"],
  strictness: 0.7,  // 0-1 scale for AI adherence
  source_url: "https://example.com",
  extracted_voice: { ... }
}

// Visual Config (stored in brands.visual_config)
{
  primary_color: "#1a1a1a",
  accent_color: "#3b82f6",
  color_palette: [...],
  image_style: "minimalist"
}
```

### Brand Strictness Scale
| Value | Label | Behavior |
|-------|-------|----------|
| 0-30% | Flexible | AI has creative freedom |
| 30-60% | Balanced | Mix of brand consistency and variety |
| 60-80% | Consistent | Closely follows brand voice |
| 80-100% | Strict | Minimal variation from guidelines |

### API Filtering
All data endpoints support `?brandId=xxx` query param for filtering by client.

## Content Pipeline

```
INPUT → PARSE → IDEATE → [HUMAN REVIEW] → GENERATE → [HUMAN REVIEW] → SCHEDULE → PUBLISH
```

1. **Input**: Text, URL, or document upload
2. **Ideation**: Claude generates 4 content ideas per input
3. **Review**: User approves/rejects ideas
4. **Generation**: Claude writes copy, Gemini creates images/videos
5. **Review**: User edits/approves content
6. **Schedule**: Magic schedule button for optimal posting times
7. **Publish**: Post via Late.dev integration (supports republishing)

## Git Workflow

### Branch Strategy
- **`main`** = production (auto-deploys to Vercel)
- **`claude/*`** branches = ALL development (auto-merge to main)

### How It Works (Fully Automatic)
```
Push to claude/* → GitHub Actions → PR Created → Auto-Merged → Vercel Deploys
```

**Never push directly to main.** Always use `claude/*` branches - they auto-merge within seconds.

### Standard Workflow (All Changes)
```bash
# 1. Work on a claude/ branch
git checkout -b claude/[description]

# 2. Make changes and verify
npm run build
npm run lint

# 3. Commit and push
git add .
git commit -m "Description of change"
git push -u origin claude/[description]

# 4. Done! Auto-merge handles the rest automatically
# Your changes will be on main and deployed within ~2 minutes
```

### Verification Before Push
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (or no new errors)
- [ ] Changed functionality tested manually
- [ ] No console errors in browser

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=         # Claude API
GEMINI_API_KEY=            # Google Gemini
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional
SUPABASE_SERVICE_ROLE_KEY= # For admin operations
```

## Coding Conventions

### TypeScript
- Strict mode enabled
- No `any` types - use proper interfaces
- Types in `src/types/database.ts` (auto-generated from Supabase)

### API Routes
- Location: `src/app/api/`
- Response format: `{ success: boolean, data?: T, error?: string }`
- Use try-catch with detailed error logging

### Components
- Use shadcn/ui components from `src/components/ui/`
- Tailwind CSS for all styling
- "use client" directive for interactive components

### Commits
- Format: `Action: Brief description`
- Examples:
  - `Add carousel image generation for Instagram`
  - `Fix content deletion not persisting`
  - `Refactor prompt system for better hook variety`

### Performance Patterns
- **Parallel fetching**: Use `Promise.all()` when fetching multiple independent resources
- **Deduplication**: Use refs to prevent duplicate concurrent API calls for the same resource
- **Memoization**: Use `useMemo` for expensive computed values (e.g., filter counts)
- **Polling stability**: When polling with `setInterval`, use refs for state access to avoid effect recreation
- **Loading states**: Always show skeleton loaders or spinners during data fetching
- **Image loading**: Use `onLoad`/`onError` handlers with opacity transitions for smooth image display

## AI Integration Details

### Claude (Text Generation)
- Model: `claude-opus-4-5-20251101`
- Used for: Ideation, copywriting, brand voice analysis
- Prompts in: `src/lib/prompts/`
- Max tokens: 4096

### Gemini (Image Generation)
- Model: `gemini-2.5-flash-image`
- Platform sizes:
  | Platform | Ratio | Dimensions |
  |----------|-------|------------|
  | Instagram | 4:5 | 1080x1350 |
  | Twitter | 16:9 | 1600x900 |
  | LinkedIn | 16:9 | 1200x675 |

### Veo 3 (Video Generation)
- Models: `veo-3.1-fast` (cost-effective), `veo-3.0` (highest quality)
- Pricing:
  | Model | Video | Audio | Max Duration |
  |-------|-------|-------|--------------|
  | Veo 3.1 Fast | $0.15/sec | $0.10/sec | 8 sec |
  | Veo 3.0 Standard | $0.50/sec | $0.25/sec | 8 sec |
- Platform aspect ratios:
  | Platform | Aspect Ratio | Notes |
  |----------|--------------|-------|
  | Instagram | 9:16 | Vertical (Reels/Stories) |
  | Twitter | 16:9 | Landscape |
  | LinkedIn | 16:9 | Landscape |
- Supports mixed carousels (video as slide 1 + image slides)
- Cost estimation and budget controls built-in

### Slide Templates (Carousel Design System)
Five preset visual styles for consistent carousels:
| Style | Description |
|-------|-------------|
| `bold-editorial` | Bold, premium feel (72px headlines) |
| `clean-modern` | Clean, professional (64px headlines) |
| `dramatic` | Impactful, attention-grabbing (84px headlines) |
| `minimal` | Elegant, understated (56px headlines) |
| `statement` | Bold, commanding (96px headlines) |

### Carousel Rules (Critical)
Each slide's image prompt must be **fully self-contained** - no references to other slides. Include complete design spec in every prompt:
- Background color (with hex)
- Typography (font, weight, color)
- Layout positions
- Visual elements
- The actual text/headline

## External API Documentation

> **IMPORTANT**: When encountering API issues, errors, or making changes to API integrations, ALWAYS refer to the official documentation below. These docs contain the most up-to-date information on authentication, rate limits, error handling, and best practices.

### Anthropic Claude API (Text Generation)

| Resource | URL |
|----------|-----|
| **Main Documentation** | https://docs.anthropic.com/ |
| **API Reference** | https://docs.anthropic.com/en/api |
| **SDK (npm)** | `@anthropic-ai/sdk` |
| **Cookbook & Examples** | https://github.com/anthropics/anthropic-cookbook |
| **Model Changelog** | https://docs.anthropic.com/en/release-notes/api |

**When to consult**: Authentication errors, rate limiting, token counting, response format issues, model selection, extended thinking, tool use.

**Client location**: `src/lib/anthropic/client.ts`

### Google Gemini API (Image Generation)

| Resource | URL |
|----------|-----|
| **Main Documentation** | https://ai.google.dev/gemini-api/docs |
| **Imagen Guide** | https://ai.google.dev/gemini-api/docs/imagen |
| **SDK (npm)** | `@google/generative-ai` |
| **Cookbook & Examples** | https://github.com/google-gemini/cookbook |
| **Changelog** | https://ai.google.dev/gemini-api/docs/changelog |
| **Gemini 3 Guide** | https://ai.google.dev/gemini-api/docs/gemini-3 |

**When to consult**: Image generation failures, safety filter blocks, aspect ratio issues, model availability, SDK updates.

**Client location**: `src/lib/google/client.ts`

### Google Veo API (Video Generation)

| Resource | URL |
|----------|-----|
| **Gemini API Video Docs** | https://ai.google.dev/gemini-api/docs/video |
| **Vertex AI Video Overview** | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/overview |
| **Veo 3 Model Reference** | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-0-generate |
| **Veo API Reference** | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation |

**When to consult**: Video generation timeouts, aspect ratio support, audio generation, polling issues, cost estimation.

**API endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:predictLongRunning`

**Route location**: `src/app/api/videos/generate/route.ts`

### Late.dev API (Social Publishing)

| Resource | URL |
|----------|-----|
| **Main Documentation** | https://docs.getlate.dev/ |
| **Posts API Reference** | https://docs.getlate.dev/core/posts |
| **Website** | https://getlate.dev/ |

**When to consult**: Publishing failures, platform-specific constraints, OAuth issues, account connection, rate limits, media requirements.

**Supported platforms**: Twitter, Instagram, Facebook, LinkedIn, TikTok, YouTube, Pinterest, Reddit, Bluesky, Threads, Google Business, Telegram, Snapchat

**Client location**: `src/lib/late/client.ts`

### Supabase (Database & Auth)

| Resource | URL |
|----------|-----|
| **Main Documentation** | https://supabase.com/docs |
| **Getting Started** | https://supabase.com/docs/guides/getting-started |
| **Database Guide** | https://supabase.com/docs/guides/database/overview |
| **Auth Guide** | https://supabase.com/docs/guides/auth |
| **SDK (npm)** | `@supabase/ssr` |
| **Changelog** | https://supabase.com/changelog |

**When to consult**: Query errors, RLS policy issues, authentication problems, real-time subscriptions, migrations.

**Client locations**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`

### Next.js (Framework)

| Resource | URL |
|----------|-----|
| **Main Documentation** | https://nextjs.org/docs |
| **App Router** | https://nextjs.org/docs/app |
| **API Routes** | https://nextjs.org/docs/app/building-your-application/routing/route-handlers |

**When to consult**: Routing issues, server/client component errors, build failures, deployment problems.

### API Troubleshooting Quick Reference

| Issue | First Check |
|-------|-------------|
| Claude API 401/403 | `ANTHROPIC_API_KEY` env var, [API docs](https://docs.anthropic.com/en/api) |
| Claude rate limiting | [Rate limits](https://docs.anthropic.com/en/api/rate-limits) |
| Gemini image fails | Safety filters, [Imagen docs](https://ai.google.dev/gemini-api/docs/imagen) |
| Veo video timeout | Polling interval, [Video docs](https://ai.google.dev/gemini-api/docs/video) |
| Late.dev 400/401 | `LATE_API_KEY` env var, [Late docs](https://docs.getlate.dev/) |
| Late.dev platform error | Platform constraints, [Posts API](https://docs.getlate.dev/core/posts) |
| Supabase RLS error | Policy config, [RLS docs](https://supabase.com/docs/guides/auth/row-level-security) |
| Supabase query fails | Schema types, `src/types/database.ts` |

## Role-Based Workflow Details

> **See "CRITICAL: Role-Based Workflow" section at the top for detection instructions.**

### Handoff and Escalation Formats

**When handing off:**
```
┌─────────────────────────────────────────────────────────┐
│ ✅ HANDOFF: Frontend → QA                               │
│                                                         │
│ Completed: Calendar page built                          │
│ Branch: claude/frontend-calendar                        │
│ Ready for: Verification and deployment                  │
└─────────────────────────────────────────────────────────┘
```

**When escalating:**
```
┌─────────────────────────────────────────────────────────┐
│ ⬆️ ESCALATING: Frontend → Full Stack                    │
│                                                         │
│ Reason: Task also needs API endpoint                    │
│ Continuing as Full Stack role...                        │
└─────────────────────────────────────────────────────────┘
```

### Auto-Handover Rules

The system automatically hands off between roles:

| Situation | Auto-Action |
|-----------|-------------|
| Task needs both UI + API | Escalate to **Full Stack** |
| Work is complete | Hand to **QA** to verify & deploy |
| Task crosses into prompts/AI | Switch to **AI** role or consult guidelines |
| Multiple parallel sessions done | **QA** merges all branches |
| Something is broken | **QA** investigates and coordinates fix |
| Complex bug needs deep investigation | **QA** hands to **Debug** for root cause analysis |
| Need to validate idea or explore options | Hand to **Researcher** before implementing |
| Research complete with recommendation | **Researcher** hands to implementation role |

### Available Roles

| Role | Focus | Owns |
|------|-------|------|
| **AI** | Prompts, Claude/Gemini, learning system | `src/lib/prompts/`, AI API routes |
| **Strategist** | Brand voice, platform rules, content quality | Voice system, hook library, RULES.md |
| **Frontend** | Dashboard UI, React components | `src/app/(dashboard)/`, `src/components/` |
| **Backend** | APIs, Supabase, integrations | `src/app/api/`, `src/lib/supabase/` |
| **Full Stack** | Cross-cutting frontend + backend | Both frontend and backend |
| **QA** | Testing, verification, merge & deploy | Test suite, quality gates |
| **Debug** | Deep investigation, root cause analysis | All files (investigation access) |
| **DevOps** | CI/CD, deployment, infrastructure | `.github/`, deployment config |
| **Docs** | Documentation sync, architecture review | `CLAUDE.md`, `RULES.md`, `docs/`, `.claude/` |
| **Researcher** | Product research, idea validation, tech exploration | Research outputs, feasibility assessments |

### Explicit Role Selection (Optional)

You can explicitly select a role if you prefer:
- `/role:ai` - AI & Intelligence Engineer
- `/role:strategist` - Content Strategist
- `/role:frontend` - Frontend Developer
- `/role:backend` - Backend Developer
- `/role:fullstack` - Full Stack Developer
- `/role:qa` - QA & Merge Coordinator
- `/role:debug` - Expert Debug Specialist
- `/role:devops` - DevOps Engineer
- `/role:docs` - Documentation & Sync Specialist
- `/role:researcher` - Researcher & Innovation Specialist

### Parallel Sessions Workflow

When running multiple sessions simultaneously:

```
Session 1: "Build calendar page"     → Auto: Frontend (uses branch)
Session 2: "Add publishing API"      → Auto: Backend (uses branch)
Session 3: "Improve hook variety"    → Auto: AI (uses branch)

When all done:
Session 4: "Ship everything"         → Auto: QA (merges all, deploys)
```

Each parallel session works on its own branch. QA merges them all together.

### Single Session Workflow

For single tasks, everything is automatic:
```
You: "Build the calendar page"
→ Auto-detects Frontend
→ Builds the feature
→ Auto-hands to QA
→ Verifies and deploys
→ "Done! Live at your-domain.com/calendar"
```

### Role Files
- Role definitions: `.claude/roles/`
- Slash commands: `.claude/commands/`

### Session Handoff
Use `/role:handoff` to document session state when passing work to another role manually.

## Key Files Reference

| Purpose | File |
|---------|------|
| Brand context | `src/contexts/brand-context.tsx` |
| Brand switcher | `src/components/brand/brand-switcher.tsx` |
| Brand creation | `src/components/brand/brand-creation-dialog.tsx` |
| Brand deletion | `src/components/brand/brand-deletion-dialog.tsx` |
| Website analyzer API | `src/app/api/brands/analyze/route.ts` |
| Visual analyzer API | `src/app/api/brands/analyze-visuals/route.ts` |
| Brands API | `src/app/api/brands/route.ts` |
| Ideation prompts | `src/lib/prompts/ideation-prompt.ts` |
| Content prompts | `src/lib/prompts/content-prompt.ts` |
| Voice system | `src/lib/prompts/voice-system.ts` |
| Hook patterns | `src/lib/prompts/hook-library.ts` |
| Visual styles | `src/lib/prompts/visual-styles.ts` |
| Image generation | `src/app/api/images/generate/route.ts` |
| Carousel generation | `src/app/api/images/carousel/route.ts` |
| Image models | `src/lib/image-models.ts` |
| Video generation | `src/app/api/videos/generate/route.ts` |
| Video models | `src/lib/video-models.ts` |
| Video utilities | `src/lib/video-utils.ts` |
| Video cost dialog | `src/components/video/video-cost-dialog.tsx` |
| Skeleton loaders | `src/components/ui/skeleton.tsx` |
| Image carousel | `src/components/ui/image-carousel.tsx` |
| Slide templates | `src/lib/slide-templates/types.ts` |
| Late.dev client | `src/lib/late/client.ts` |
| Publish API | `src/app/api/content/publish/route.ts` |
| Social accounts API | `src/app/api/social-accounts/route.ts` |
| Schedule suggestions | `src/app/api/schedule/suggest/route.ts` |
| Best practices | `src/lib/scheduling/best-practices.ts` |
| Generation jobs hook | `src/hooks/use-generation-jobs.ts` |
| SWR data hooks | `src/hooks/use-swr-hooks.ts` |
| Content card component | `src/components/content/content-card.tsx` |
| Anthropic client | `src/lib/anthropic/client.ts` |
| Google AI client | `src/lib/google/client.ts` |
| API response helpers | `src/lib/api/response.ts` |
| Retry utilities | `src/lib/api/retry.ts` |
| Usage logger | `src/lib/api/usage-logger.ts` |
| Database types | `src/types/database.ts` |
| PRD | `docs/PRD.md` |
| Rules | `RULES.md` |

## Database Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant support (parent of brands) |
| `brands` | Client/brand config with `voice_config` and `visual_config` JSON |
| `social_accounts` | Connected platforms per brand via Late.dev |
| `inputs` | Raw content capture (filtered by `brand_id`) |
| `ideas` | Generated content ideas (filtered by `brand_id`) |
| `content` | Platform-specific posts (filtered by `brand_id`) |
| `images` | Generated images (linked to content) |
| `generation_jobs` | Async job tracking for content/image generation |
| `video_generation` | Video generation tracking and budget management |
| `analytics` | Post performance metrics |
| `feedback_events` | Learning system data |

## Links

- **PRD**: `docs/PRD.md`
- **Rules**: `RULES.md`
- **Supabase Dashboard**: (check env for URL)
- **Vercel Dashboard**: (deployment logs)
