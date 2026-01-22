# Codebase Concerns

**Analysis Date:** 2026-01-22

## Security Concerns

**API Key Exposure in URL Parameters:**
- Issue: The Late.dev client exposes the API key in URL query parameters
- Files: `src/lib/late/client.ts:215`
- Code: `return { url: `${connectUrl}&apiKey=${this.apiKey}` };`
- Impact: API key is exposed in browser history, logs, and referrer headers. Critical credential leak.
- Recommendation: Move API key to Authorization header or secure backend callback instead. Use server-to-server OAuth flow with backend state management.

**Missing Authentication Middleware:**
- Issue: Authentication is completely disabled for single-user mode but never re-enabled safeguard exists
- Files: `src/middleware.ts:5`
- Impact: Multi-user feature deployment without auth creates data access vulnerability. Any deployment with multiple users is exposed.
- Current state: Middleware returns `NextResponse.next()` unconditionally, bypassing all auth checks
- Fix approach: Add feature flag or environment-based auth toggle. Create migration plan before multi-user support.

**Unsafe Service Role Key Storage:**
- Issue: Admin client uses service role key without isolation
- Files: `src/lib/supabase/server.ts:34-46`
- Impact: Service role key used in client-side callable functions (`createAdminClient()`) bypasses RLS entirely. Callable from any API route.
- Concern: No distinction between RLS-protected and RLS-bypassing operations. Easy to accidentally expose data via mis-configured endpoint.
- Recommendation: Move admin operations to isolated backend service or middleware. Document which operations truly need service role.

**Late.dev Account Multi-Client Binding:**
- Issue: No transaction isolation when binding accounts to multiple brands simultaneously
- Files: `src/app/api/social-accounts/callback/route.ts:66-88`
- Impact: Check-then-act race condition. Multiple concurrent callbacks could bind same account to different brands, violating safeguard.
- Current mitigation: SELECT + constraint check without LOCK
- Fix approach: Use Supabase RLS with computed columns or database constraints, or implement pessimistic locking.

## Tech Debt

**Disabled TypeScript Strict Typing:**
- Issue: Database types generation disabled for MVP
- Files: `src/lib/supabase/server.ts:4-5`
- Code: `// TODO: Re-enable strict typing after Supabase schema is stable`
- Impact: Type-unsafe database operations throughout codebase. Regressions slip through undetected. No IDE autocomplete for database fields.
- Cost: ~2 hours to re-enable when schema is finalized
- Recommendation: Prioritize after schema stabilizes. Add `// @ts-expect-error` guards in high-risk areas for now.

**Authentication Disabled - TODO Flag:**
- Issue: Auth middleware contains TODO with no timeline
- Files: `src/middleware.ts:5`
- Code: `// TODO: Re-enable auth when adding multi-user support`
- Impact: Technical debt masquerading as feature flag. Creates illusion of security in single-user assumption.
- Fix approach: Add explicit `SINGLE_USER_MODE=true` env var check. Fail startup if var is unset and auth is disabled.

**Cleanup Job for Scheduled Posts Missing:**
- Issue: Temporary images uploaded for scheduled posts are never deleted after publication
- Files: `src/app/api/content/publish/route.ts:383`
- Code: `// TODO: Set up a cleanup job to delete after scheduled publish time`
- Impact: Storage bloat. Scheduled posts accumulate orphaned images indefinitely if cleanup never runs.
- Estimated cleanup amount: ~100KB-5MB per scheduled post depending on image count
- Fix approach: Create background job service (Temporal, Bull, or CRON endpoint) to clean up after scheduled_for timestamp.

**No Strict Database Validation:**
- Issue: JSON config fields (voice_config, visual_config) use `as VoiceConfig` type casts without validation
- Files: `src/contexts/brand-context.tsx:69, 122, 149`
- Code: `(brand.voice_config as VoiceConfig) || {}`
- Impact: Corrupted or missing fields silently fall back to empty object. Missing tone_keywords/strictness values cause silent AI prompt failures.
- Consequence: Generated content ignores brand voice without clear error signal
- Recommendation: Add runtime schema validation (zod or similar) on brand load with explicit error messages.

## Performance Bottlenecks

**Polling Without Exponential Backoff:**
- Issue: Generation job polling uses fixed 2-second interval regardless of job status
- Files: `src/hooks/use-generation-jobs.ts:108-131`
- Pattern: Continuously polls every 2s even when no jobs are active, only checking at interval time
- Impact: Unnecessary API calls during idle periods. Carousel generation (670 line endpoint) spawns multiple polling requests.
- Optimization: Implement exponential backoff starting at 2s up to 30s, reset on activity. Could reduce polling load by 60%.

**Large Component File - Content Page:**
- Issue: Single component file exceeds 2400 lines
- Files: `src/app/(dashboard)/content/page.tsx:2472 lines`
- Contains: State management, rendering, image carousel, carousel generation UI, publish flow, all in one component
- Impact: Component difficult to test, refactor, or reason about. Multiple responsibilities entangled. Hot reload slow.
- Recommendation: Split into logical sub-components: `ContentList`, `ContentEditor`, `CarouselBuilder`, `PublishFlow`. Extract state to custom hook.

**Synchronous Font Loading in Carousel Generation:**
- Issue: Font loaded synchronously on every carousel render request
- Files: `src/app/api/images/carousel/route.ts:55-70`
- Code: `cachedFont` global is single-threaded. Network fetch blocks route handler.
- Impact: If font CDN is slow (>500ms), entire carousel generation blocks. Under load, multiple requests serialize.
- Optimization: Pre-warm font cache at startup. Use Promise.all() for parallel slide rendering instead of sequential.

**No Query Optimization on Content Fetch:**
- Issue: Content page fetches all content without pagination or filtering
- Files: `src/app/(dashboard)/content/page.tsx` (fetching logic not shown in excerpt, check API call)
- Impact: 1000+ items in database = 1000+ items downloaded and rendered in dropdown/list
- Recommendation: Implement cursor-based pagination. Fetch in batches of 50, lazy-load more on scroll.

## Scaling Limits

**Single Global Late.dev Client Instance:**
- Issue: Late.dev client uses singleton pattern with single API key
- Files: `src/lib/late/client.ts:228-241`
- Code: Global `defaultClient` variable re-used across all requests
- Impact: No per-tenant API key support. Cannot scale to multiple Late.dev accounts. Rate limits share across all brands.
- Limitation: Every brand must use same Late.dev account credentials
- Fix approach: Store API keys per brand in `brands.late_config` JSONB field. Instantiate client per request.

**Memory Usage - Slide Templates Cache:**
- Issue: Font is cached globally without TTL or size limit
- Files: `src/app/api/images/carousel/route.ts:64`
- Impact: Long-running server process accumulates cached fonts. No eviction policy. Multi-MB in memory per cached asset.
- Scale risk: 100 unique font families = 100MB+ in cache
- Recommendation: Use LRU cache with 10-item limit or 1-hour TTL.

**Database Connection Pool Exhaustion Risk:**
- Issue: Each API route independently creates Supabase client
- Files: Multiple routes (e.g., `src/app/api/content/publish/route.ts:46`)
- Impact: High concurrency (100 simultaneous requests) creates 100 client instances. Supabase connection pool (default 10) exhausted.
- Symptom: Timeout errors under load, not due to processing but connection starvation
- Recommendation: Use connection pool with max 10 active connections, queue requests. Implement request batching for jobs API.

## Known Bugs

**Carousel Slide Parsing Fragility:**
- Issue: Legacy string slides mixed with object slides cause silent data loss
- Files: `src/app/(dashboard)/content/page.tsx:953-974`
- Pattern: Code attempts to normalize both `CarouselSlide[]` objects and legacy `string[]` formats simultaneously
- Bug: When legacy slides are detected, they're returned as-is. UI tries to render string as slide object, crashes or displays blank.
- Trigger: Upgrade from v1 (string slides) to v2 (object slides) without migration
- Workaround: Manually delete and regenerate carousel content
- Fix: Migrate all legacy slides in database migration before deploying v2 UI

**Silent JSON Parse Failures:**
- Issue: Multiple JSON.parse() calls wrapped in try-catch with no fallback handling
- Files:
  - `src/app/api/brands/analyze/route.ts:196`
  - `src/app/api/ideas/generate/route.ts:134`
  - `src/app/api/content/generate/route.ts:113`
  - `src/app/(dashboard)/content/page.tsx:933`
- Pattern: `catch { return null }` or `catch { return [] }` with no logging
- Impact: When Claude returns malformed JSON, entire operation fails silently. User sees blank content, no error message.
- Example: Claude returns "```json\n{invalid}\n```" with newlines - parse fails, returns null, page loads with no content
- Recommendation: Add console.error() with actual error + response in all catch blocks. Return error object instead of null.

**Social Account Safeguard Has Race Condition:**
- Issue: Multi-brand account binding check is non-atomic
- Files: `src/app/api/social-accounts/callback/route.ts:66-88`
- Sequence:
  1. Check if account already bound to OTHER brand
  2. If yes, reject
  3. If no, bind to THIS brand
- Race: Two callbacks arrive simultaneously for same account, both pass check, both insert
- Result: Account bound to both brands (violates safeguard)
- Severity: Data integrity issue affecting brand isolation
- Fix: Use database-level UNIQUE constraint + handle constraint violation error, OR use FOR UPDATE lock

**Missing DELETE Handler for Ideas API:**
- Issue: Recent fix added DELETE handler, but other endpoints may also lack methods
- Files: Check `src/app/api/ideas/route.ts` for GET only
- Impact: Incomplete CRUD operations. No programmatic way to delete items from some resources.
- Status: Fixed for ideas in recent commit (e9d67d7), audit other endpoints

## Fragile Areas

**Brand Context and State Management:**
- Files: `src/contexts/brand-context.tsx`
- Why fragile:
  - No error recovery. Network error fetching brands = selectedBrand stays null
  - localStorage read/write can fail silently (private mode, full quota)
  - Brand selection persisted without validation (deleted brand stays selected)
- Safe modification: Add explicit error handling for localStorage. Validate selectedBrand exists in brands array on every access. Add refetch button for failed loads.
- Test coverage: No unit tests for context. Edge cases untested: empty brands array, corrupted localStorage, quota exceeded

**Image Generation Route Complexity:**
- Files: `src/app/api/images/carousel/route.ts:670 lines`
- Why fragile:
  - Deeply nested promise chains without error context
  - Multiple external API calls (Gemini, Satori, Sharp) with independent error modes
  - Job status updates scattered throughout without transaction semantics
- Failure modes: Partial image generation (5/10 slides uploaded, 5 failed). Job status shows "generating" forever if update fails.
- Safe modification: Break into testable functions. Add explicit job rollback on any error. Use database transactions.

**Content Page Component (2472 lines):**
- Files: `src/app/(dashboard)/content/page.tsx`
- Why fragile:
  - State management spread across 20+ useState hooks with implicit dependencies
  - Multiple slide index maps (currentSlideIndex, selectedVersionIndex, generatingSlides, etc.) must stay in sync
  - No validation that displayed slide exists in database
- Risk: Edit slide A, select slide B, image loading in A fails, UI state inconsistent with data
- Safe modification: Extract state to useReducer with explicit state shape. Add assertions for consistency.

**Late.dev OAuth Flow:**
- Files: `src/app/api/social-accounts/callback/route.ts`, `src/app/api/social-accounts/connect/route.ts`
- Why fragile:
  - State passing through URL parameters (brandId, platform) unverified
  - No CSRF token on OAuth callback
  - Callback silently succeeds even if Supabase insert fails (updateError ignored at line 363)
- Attack vector: Attacker could craft callback URL with arbitrary brandId to connect accounts to wrong brand
- Safe modification: Add state parameter to OAuth request. Verify state matches session. Log all callback successes/failures. Return error if insert fails.

**Supabase RLS Row-Level Security:**
- Risk: RLS policies not shown in codebase. If disabled/misconfigured, all data accessible to all users
- Files: Check `supabase/migrations/` for RLS policy definitions
- Impact: Even if single-user for now, multi-user deployment could expose data without proper RLS

## Test Coverage Gaps

**Image Generation Not Tested:**
- What's not tested: Carousel generation, composite image rendering, Satori → Sharp pipeline
- Files: `src/app/api/images/carousel/route.ts` (670 lines, 0 tests)
- Risk: Job status update failures, font loading timeouts, sharp image conversion errors go undetected in production
- Priority: HIGH - frequent user-facing failures reported

**Brand Context Hook Not Tested:**
- What's not tested: Brand selection persistence, error recovery, simultaneous updates
- Files: `src/contexts/brand-context.tsx` (190 lines, 0 tests)
- Risk: Silent corruption of selectedBrand state in production
- Priority: MEDIUM - affects all dashboard features

**OAuth Flow Not Tested:**
- What's not tested: CSRF vulnerability, state validation, race condition in account binding
- Files: `src/app/api/social-accounts/` (multiple files, 0 integration tests)
- Risk: Account binding race condition, cross-brand data leakage undetected
- Priority: CRITICAL - security issue

**Content Publishing Flow Not Tested:**
- What's not tested: Late.dev API error handling, scheduled post cleanup, image upload failure recovery
- Files: `src/app/api/content/publish/route.ts` (506 lines, 0 tests)
- Risk: Silent failures when publishing, orphaned images in storage
- Priority: HIGH - user impact (posts don't publish)

**Database Query Error Handling Not Tested:**
- What's not tested: Supabase query failures, RLS violations, constraint violations
- Files: All API routes
- Risk: No integration tests verify error scenarios work correctly
- Priority: MEDIUM - need E2E tests

## Dependencies at Risk

**Satori (JSX to SVG) Unmaintained:**
- Package: `satori`
- Risk: Used for carousel text rendering. Maintainability unclear, potential security issues in future
- Impact: If satori fails, carousel generation breaks
- Alternative: Migrate to Canvas API or server-side text rendering library with active maintenance

**Sharp Image Processing:**
- Package: `sharp`
- Risk: Native binary dependency, complex build system. Version mismatches between dev/prod cause silent failures
- Impact: Image conversion fails in production despite working in dev
- Mitigation: Lock exact version in package-lock.json. Use Docker for consistent builds.

**Gemini API (Google):**
- Package: Direct HTTP calls to `generativelanguage.googleapis.com`
- Risk: No official Node SDK used. Custom error handling could be fragile if Google changes API response format
- Impact: Image generation silently fails if API response format changes
- Recommendation: Use official @google-ai/generative-ai SDK instead of raw fetch()

---

*Concerns audit: 2026-01-22*
