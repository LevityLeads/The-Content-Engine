# External Integrations

**Analysis Date:** 2026-01-22

## APIs & External Services

**AI & Content Generation:**
- Claude Opus (Anthropic) - Text ideation and copywriting
  - SDK: `@anthropic-ai/sdk` 0.71.2
  - Auth: `ANTHROPIC_API_KEY`
  - Used in: `src/app/api/ideas/generate/route.ts`, `src/app/api/content/generate/route.ts`, `src/app/api/brands/analyze/route.ts`
  - Model: `claude-opus-4-5-20251101` (specified in CLAUDE.md)
  - Max tokens: 4096

- Gemini 2.5 Flash (Google) - Image generation
  - SDK: Direct HTTP calls via `fetch` to Google Generative Language API
  - Auth: `GOOGLE_API_KEY` (server-side only)
  - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{modelId}:generateContent`
  - Used in: `src/app/api/images/generate/route.ts`, `src/app/api/images/carousel/route.ts`, `src/app/api/images/background/route.ts`
  - Models:
    - `gemini-2.5-flash-image` - Fast generation (called "Gemini Flash")
    - `gemini-3-pro-image-preview` - High quality (called "Nano Banana Pro")
  - Request format: JSON with `contents`, `generationConfig`, and `imageConfig`
  - Image response: Base64 in `candidates[0].content.parts[].inlineData.data`

**Social Media Publishing:**
- Late.dev API - Multi-platform social media publishing
  - Client: Custom wrapper in `src/lib/late/client.ts` wrapping HTTP fetch
  - Auth: `LATE_API_KEY` (Bearer token in Authorization header)
  - Base URL: `https://getlate.dev/api/v1`
  - Endpoints used:
    - `POST /posts` - Create and publish posts (`src/app/api/content/publish/route.ts`)
    - `GET /posts/{id}` - Get post status (`src/app/api/content/publish/route.ts`)
    - `GET /posts/{id}/analytics` - Get post analytics
    - `DELETE /posts/{id}` - Cancel scheduled posts
    - `GET /accounts` - List connected social accounts (`src/app/api/social-accounts/sync/route.ts`)
    - `DELETE /accounts/{id}` - Disconnect accounts
    - `GET /connect/{platform}` - OAuth authorization flow
  - Supported platforms: Instagram, Twitter, LinkedIn, Facebook, TikTok
  - Error handling: Custom `LateApiException` class with error codes, messages, and details
  - Connection mode: OAuth via Late.dev (not direct OAuth)
  - Data model:
    - Account IDs stored in `social_accounts.late_account_id`
    - Post IDs stored in `content.late_post_id`
    - Platform-specific account lookup for publishing (`social_accounts.platform` + `social_accounts.brand_id`)

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Connection: Via `@supabase/supabase-js` and `@supabase/ssr`
  - Environment vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `src/lib/supabase/server.ts` (SSR client) and `src/lib/supabase/client.ts`
  - Database schema: `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/002_generation_jobs.sql`
  - Key tables:
    - `organizations` - Multi-tenant support
    - `brands` - Client/brand configuration with JSON configs for voice and visual settings
    - `social_accounts` - Connected platform accounts (Late.dev integration)
    - `inputs` - Raw content capture
    - `ideas` - Generated content ideas
    - `content` - Platform-specific posts with status tracking
    - `images` - Generated images linked to content
    - `generation_jobs` - Image generation progress tracking
    - `analytics` - Post performance metrics
    - `feedback_events` - Learning system data
  - Storage bucket: `images` - For temporary base64 image uploads before publishing

**File Storage:**
- Supabase Storage - Bucket: `images`
  - Used in: `src/app/api/content/publish/route.ts`
  - Purpose: Store base64 images temporarily before publishing via Late.dev
  - Access: Via admin client (service role key) to bypass RLS
  - Cleanup: Removes images after immediate publishing, keeps them for scheduled posts

**Caching:**
- None detected - No Redis or caching layer configured

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Custom auth system
  - Implementation: Built into Supabase (PostgreSQL with auth schema)
  - SSR support: `@supabase/ssr` 0.8.0
  - Cookies: Auth tokens stored in cookies, refreshed automatically
  - User reference: `auth.users` table

**OAuth Integration:**
- Late.dev OAuth - For connecting social media accounts
  - Flow: Redirect to Late.dev OAuth endpoint → Late.dev handles platform OAuth → Callback to `src/app/api/social-accounts/callback/route.ts`
  - Callback processing: `src/app/api/social-accounts/callback/route.ts` creates `social_accounts` records
  - Account association: Stored in `social_accounts` table with `late_account_id`, `platform`, `platform_user_id`
  - Connection endpoint: `src/app/api/social-accounts/connect/route.ts`
  - No platform-specific tokens stored - Only Late.dev account IDs and platform usernames

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, DataDog, or similar service configured

**Logs:**
- Console logging only (console.error, console.log)
- Error context logged in API routes with detailed messages
- Late.dev response logging for debugging
- Image generation response logging for debugging

## CI/CD & Deployment

**Hosting:**
- Vercel - Next.js hosting and auto-deployment
  - Deployment: Automatic via GitHub Actions on claude/* branches (mentioned in CLAUDE.md)
  - Builds and deploys automatically

**CI Pipeline:**
- GitHub Actions - Auto-merge and deploy (mentioned in CLAUDE.md)
  - Trigger: Push to `claude/*` branches
  - Action: Auto-merge to main, then Vercel deploys

## Environment Configuration

**Required env vars:**
```
ANTHROPIC_API_KEY                    # Claude API
GEMINI_API_KEY                       # Google Gemini (may be redundant with GOOGLE_API_KEY)
GOOGLE_API_KEY                       # Google Generative Language API
NEXT_PUBLIC_SUPABASE_URL             # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY        # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY            # Supabase service role
LATE_API_KEY                         # Late.dev API
```

**Secrets location:**
- Environment variables in deployment platform (Vercel)
- `.env.local` for local development (example at `.env.example`)
- Service keys never committed to git (in .gitignore)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/social-accounts/callback` - Late.dev OAuth callback after user connects social account
  - Query params: `code` (authorization code), `state` (CSRF protection), `accountUsername`, `accountId`
  - Response: Redirect to `/dashboard/settings` with account created

**Outgoing:**
- None detected - No webhooks sent to external services
- Late.dev API called directly via HTTP (request-response only)

## API Response Patterns

**Standard Response Format (Consistency):**
- Success: `{ success: true, data?: T, ... }`
- Error: `{ success: false, error: string, ... }`
- HTTP Status codes used for error signaling (400, 404, 500, 502)

**Model Integration Details:**

**Image Generation Models:**
- Configured in `src/lib/image-models.ts`
- Models can be selected per request in image generation APIs
- Response format: Base64 image data in Gemini API response
- Stored as data URL: `data:image/png;base64,{base64Data}`
- Platform-specific aspect ratios enforced:
  - Instagram: 4:5 (1080x1350)
  - Twitter: 16:9 (1600x900)
  - LinkedIn: 16:9 (1200x675)

---

*Integration audit: 2026-01-22*
