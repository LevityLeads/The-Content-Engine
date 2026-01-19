# The Content Engine

AI-powered content automation system that transforms raw inputs into polished, platform-specific social media content.

## Quick Reference

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint

# Deployment
git push origin main # Triggers Vercel deployment automatically
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
| Publishing | Late.dev API | (integration pending) |
| Hosting | Vercel | - |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── inputs/           # Input capture page
│   │   ├── ideas/            # Idea review page
│   │   ├── content/          # Content generation & review
│   │   ├── calendar/         # Scheduling (stub)
│   │   ├── analytics/        # Analytics (stub)
│   │   └── settings/         # Brand & account settings
│   ├── api/                  # API routes
│   │   ├── inputs/           # POST/GET inputs
│   │   ├── ideas/            # Ideas CRUD + generate
│   │   ├── content/          # Content CRUD + generate
│   │   └── images/generate/  # Image generation
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # Base components (button, card, etc.)
│   └── layout/               # Layout components (sidebar)
├── lib/
│   ├── prompts/              # AI prompt system (~1300 lines)
│   │   ├── ideation-prompt.ts
│   │   ├── content-prompt.ts
│   │   ├── voice-system.ts
│   │   ├── hook-library.ts
│   │   └── content-pillars.ts
│   ├── supabase/             # Database clients
│   └── image-models.ts       # Image generation config
└── types/
    └── database.ts           # Supabase types

supabase/
└── migrations/               # Database migrations

docs/
└── PRD.md                    # Product Requirements Document
```

## Content Pipeline

```
INPUT → PARSE → IDEATE → [HUMAN REVIEW] → GENERATE → [HUMAN REVIEW] → PUBLISH
```

1. **Input**: Text, URL, or document upload
2. **Ideation**: Claude generates 4 content ideas per input
3. **Review**: User approves/rejects ideas
4. **Generation**: Claude writes copy, Gemini creates images
5. **Review**: User edits/approves content
6. **Publish**: Schedule or post via Late.dev

## Git Workflow

### Branch Strategy
- **`main`** = production (auto-deploys to Vercel)
- **`claude/*`** branches auto-merge to main via GitHub Actions

### For Normal Changes (Safe)
```bash
# Work directly or use claude/ branch
git add .
git commit -m "Clear description of change"
git push origin main
# OR
git push origin claude/feature-name
# Auto-merges to main → auto-deploys
```

### For Risky Changes (Database migrations, auth, major refactors)
1. Create branch: `git checkout -b claude/risky-change-name`
2. Make changes and test thoroughly
3. Push and create PR manually if auto-merge is concerning
4. Or push to claude/ branch and monitor deployment

### Verification Before Push
Every push to main should pass:
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

## AI Integration Details

### Claude (Text Generation)
- Model: `claude-opus-4-5-20251101`
- Used for: Ideation, copywriting
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

### Carousel Rules (Critical)
Each slide's image prompt must be **fully self-contained** - no references to other slides. Include complete design spec in every prompt:
- Background color (with hex)
- Typography (font, weight, color)
- Layout positions
- Visual elements
- The actual text/headline

## Role-Based Workflow

This project uses specialized roles for parallel development sessions.

### Available Roles
| Command | Role | Focus |
|---------|------|-------|
| `/role:ai` | AI & Intelligence | Prompts, Claude/Gemini, learning system |
| `/role:strategist` | Content Strategist | Brand voice, platform rules, content quality |
| `/role:frontend` | Frontend Developer | Dashboard UI, React components |
| `/role:backend` | Backend Developer | APIs, Supabase, integrations |
| `/role:fullstack` | Full Stack | Cross-cutting frontend + backend work |
| `/role:qa` | QA Specialist | Testing, validation, quality |
| `/role:devops` | DevOps Engineer | CI/CD, deployment, infrastructure |

### Role Files
- Role definitions: `.claude/roles/`
- Slash commands: `.claude/commands/`

### Handoff Between Roles
Use `/role:handoff` to document session state when passing work to another role.

## Key Files Reference

| Purpose | File |
|---------|------|
| Ideation prompts | `src/lib/prompts/ideation-prompt.ts` |
| Content prompts | `src/lib/prompts/content-prompt.ts` |
| Voice system | `src/lib/prompts/voice-system.ts` |
| Hook patterns | `src/lib/prompts/hook-library.ts` |
| Image generation | `src/app/api/images/generate/route.ts` |
| Image models | `src/lib/image-models.ts` |
| Database types | `src/types/database.ts` |
| PRD | `docs/PRD.md` |
| Rules | `RULES.md` |

## Database Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant support |
| `brands` | Brand voice/visual config |
| `social_accounts` | Connected platforms |
| `inputs` | Raw content capture |
| `ideas` | Generated content ideas |
| `content` | Platform-specific posts |
| `images` | Generated images |
| `analytics` | Post performance metrics |
| `feedback_events` | Learning system data |

## Links

- **PRD**: `docs/PRD.md`
- **Rules**: `RULES.md`
- **Supabase Dashboard**: (check env for URL)
- **Vercel Dashboard**: (deployment logs)
