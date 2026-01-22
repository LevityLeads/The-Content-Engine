# Technology Stack

**Analysis Date:** 2026-01-22

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code, strict mode enabled
- JavaScript - Runtime in Next.js and Node.js

**Secondary:**
- SQL - Supabase migrations and database operations

## Runtime

**Environment:**
- Node.js (inferred from package.json - version unspecified, check .nvmrc or engine field)

**Package Manager:**
- npm (package-lock.json present)
- Lockfile: Present at `/workspaces/The-Content-Engine/package-lock.json`

## Frameworks

**Core:**
- Next.js 16.1.3 - Full-stack framework (App Router), API routes in `src/app/api/`
- React 19.2.3 - UI framework
- React DOM 19.2.3 - React DOM rendering

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS framework
- @tailwindcss/postcss 4.x - PostCSS plugin for Tailwind

**UI Components:**
- shadcn/ui (via Radix UI) - Component library
  - @radix-ui/react-popover 1.1.15
  - @radix-ui/react-slider 1.3.6
  - @radix-ui/react-tooltip 1.2.8
- Lucide React 0.562.0 - Icon library

**Utilities:**
- class-variance-authority 0.7.1 - Conditional class composition
- clsx 2.1.1 - Utility for classNames
- cmdk 1.1.1 - Command/search component
- tailwind-merge 3.4.0 - Merge Tailwind classes intelligently

## Key Dependencies

**Critical:**

- @anthropic-ai/sdk 0.71.2 - Claude AI API client for ideation and content generation
- @supabase/supabase-js 2.90.1 - PostgreSQL database and auth client
- @supabase/ssr 0.8.0 - Supabase SSR utilities for Next.js

**Image Generation:**
- sharp 0.34.5 - Image processing and optimization
- satori 0.19.1 - SVG to image conversion
- @vercel/og 0.8.6 - Open Graph image generation

**API & Integration:**
- Custom Late.dev client in `src/lib/late/client.ts` - Social media publishing API integration

## Configuration

**Environment:**
- TypeScript configuration: `tsconfig.json` (strict mode, path aliases with `@/*` -> `src/*`)
- ESLint configuration: `eslint.config.mjs` (uses eslint-config-next with TypeScript support)
- PostCSS configuration: `postcss.config.mjs` (Tailwind CSS plugin)
- Next.js configuration: `next.config.ts` (minimal setup)

**Build:**
- Next.js handles build with `npm run build`
- Production start: `npm run start`
- Development: `npm run dev` (port 3000)

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role for admin operations (server-only)
- `ANTHROPIC_API_KEY` - Claude API key (server-only)
- `GEMINI_API_KEY` - Google Gemini API key for image generation (server-only)
- `GOOGLE_API_KEY` - Google API key for Gemini image generation (server-only)
- `LATE_API_KEY` - Late.dev API key for social publishing (server-only)
- `NEXT_PUBLIC_APP_URL` - Application URL (public, defaults to localhost:3000)

**Optional Environment Variables:**
- `LATE_INSTAGRAM_ACCOUNT_ID` - Fallback Instagram account ID (deprecated, use connected accounts)
- `LATE_INSTAGRAM_ACCOUNT_OCD_ID` - Alternative fallback Instagram ID
- `LATE_TWITTER_ACCOUNT_ID` - Fallback Twitter account ID (deprecated)
- `LATE_LINKEDIN_ACCOUNT_ID` - Fallback LinkedIn account ID (deprecated)

## Platform Requirements

**Development:**
- Node.js (version unspecified)
- npm or compatible package manager
- TypeScript 5.9.3

**Production:**
- Deployment target: Vercel (referenced in CLAUDE.md)
- PostgreSQL database: Supabase
- Node.js runtime (auto-managed by Vercel)

## Build & Dev Tools

**Linting:**
- ESLint 9.x - Code quality
- eslint-config-next 16.1.3 - Next.js and React linting rules
- TypeScript plugin support via next

**Type Definitions:**
- @types/node 20.x - Node.js types
- @types/react 19.x - React types
- @types/react-dom 19.x - React DOM types

---

*Stack analysis: 2026-01-22*
