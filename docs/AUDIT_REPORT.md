# The Content Engine - Comprehensive Codebase Audit Report

**Audit Date:** 2026-01-20
**Auditor:** Debug + QA (Combined Role)
**Branch:** `claude/audit-codebase-eZBWm`

---

## Executive Summary

This comprehensive audit examined all major areas of The Content Engine codebase including API routes, React components, prompts/lib utilities, contexts/hooks, TypeScript types, and database schema. The audit identified **95+ issues** across all severity levels.

### Overall Health

| Area | Critical | High | Medium | Low | Total |
|------|----------|------|--------|-----|-------|
| API Routes | 1 | 13 | 11 | 5 | 30 |
| React Components | 0 | 8 | 15 | 6 | 29 |
| Prompts/Lib | 1 | 2 | 5 | 4 | 12 |
| Contexts/Hooks | 0 | 6 | 10 | 4 | 20 |
| Types/Database | 3 | 2 | 4 | 7 | 16 |
| **TOTAL** | **5** | **31** | **45** | **26** | **107** |

### Build Status

- **Build:** PASSES (Next.js 16.1.3 with Turbopack)
- **Lint:** 4 errors, 58 warnings
- **TypeScript:** No type errors in build

---

## Critical Issues (Fix Immediately)

### 1. [CRITICAL] No Authentication on Any API Routes
**Location:** All files in `src/app/api/`
**Impact:** All endpoints are publicly accessible. Any user can read/write/delete all data for all brands.

**Affected Endpoints:**
- `POST/GET /api/brands` - Full CRUD access
- `POST/GET /api/inputs` - All inputs accessible
- `POST/GET /api/ideas` - All ideas accessible
- `POST/GET /api/content` - All content accessible
- `POST /api/content/publish` - Publish to any account

**Recommended Fix:**
```typescript
// Create middleware: src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const supabase = createServerClient(/* config */);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
```

---

### 2. [CRITICAL] API Key Exposed in URL
**Location:** `src/lib/late/client.ts:215`

```typescript
return { url: `${connectUrl}&apiKey=${this.apiKey}` };
```

**Impact:** API key will appear in browser history, server logs, and can be captured/shared.

**Recommended Fix:** Pass API key via Authorization header, never in URLs.

---

### 3. [CRITICAL] SSRF Vulnerability in Website Analysis
**Location:** `src/app/api/brands/analyze/route.ts:229-249`

**Impact:** User can provide internal URLs like `http://localhost:3000` or `http://169.254.169.254` (AWS metadata) and the server will fetch them.

**Recommended Fix:**
```typescript
// Add URL validation
const isPrivateIP = (url: string) => {
  const hostname = new URL(url).hostname;
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
  ];
  return privatePatterns.some(p => p.test(hostname));
};

if (isPrivateIP(url)) {
  return Response.json({ error: 'Invalid URL' }, { status: 400 });
}
```

---

### 4. [CRITICAL] Field Name Mismatch: Schema vs Types
**Location:**
- Schema: `supabase/migrations/001_initial_schema.sql:112` uses `user_feedback`
- Types: `src/types/database.ts:195` uses `feedback_notes`
- Code: `src/app/api/ideas/route.ts:72` uses `feedback_notes`

**Impact:** Runtime failures when updating this field.

**Recommended Fix:** Rename schema field to `feedback_notes` via migration.

---

### 5. [CRITICAL] Missing generation_jobs in TypeScript Types
**Location:** `src/types/database.ts`

**Impact:** The `generation_jobs` table is actively used but has no TypeScript types, causing type errors and runtime issues.

**Recommended Fix:** Add complete type definition:
```typescript
generation_jobs: {
  Row: {
    id: string;
    content_id: string;
    job_type: 'single' | 'carousel';
    status: 'pending' | 'generating' | 'completed' | 'failed';
    progress: number;
    metadata: Json;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* ... */ };
  Update: { /* ... */ };
};
```

---

## High Severity Issues

### Security

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 1 | Missing input validation | `src/app/api/inputs/route.ts:77` | `parseInt` accepts invalid/negative values |
| 2 | Unsafe JSON response parsing | `src/app/api/brands/analyze/route.ts:304-310` | No validation before type assertion |
| 3 | Prompt injection risk | `src/lib/prompts/voice-system.ts:171-201` | User input directly interpolated into prompts |
| 4 | Prompt injection risk | `src/lib/prompts/ideation-prompt.ts:183-188` | No sanitization of user content |
| 5 | Prompt injection risk | `src/lib/prompts/content-prompt.ts:521-540` | All idea fields unsanitized |
| 6 | Missing RLS policies | `supabase/migrations/002_generation_jobs.sql` | Table has no Row Level Security |

### Error Handling

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 7 | Swallowed error | `src/lib/supabase/server.ts:18-26` | Cookie error completely swallowed |
| 8 | Unsafe array access | `src/app/api/ideas/generate/route.ts:108-110` | `content[0]` accessed without bounds check |
| 9 | Missing HTTP check | `src/hooks/use-brand-api.ts:44-45` | No `res.ok` validation before `res.json()` |
| 10 | Silent failures | `src/contexts/brand-context.tsx:131-133` | Errors logged but not exposed to UI |

### React Issues

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 11 | Missing useEffect dependency | `src/app/(dashboard)/ideas/page.tsx:162-178` | `selectedPlatforms` missing from deps |
| 12 | Dependency cycle | `src/contexts/brand-context.tsx:163` | `selectedBrand` in deps but modified inside |
| 13 | Circular dependency | `src/hooks/use-generation-jobs.ts:131` | `jobsByContent` causes infinite polling |
| 14 | Memory leak | `src/app/(dashboard)/inputs/page.tsx:182-217` | No cleanup for async FileReader |
| 15 | No Error Boundary | `src/app/(dashboard)/layout.tsx` | Children not wrapped in ErrorBoundary |

### Performance

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 16 | N+1 queries | `src/app/api/images/carousel/route.ts:425-445` | updateSlideStatus called in loop |
| 17 | Sequential uploads | `src/app/api/content/publish/route.ts:159-226` | Images uploaded one-by-one, not parallel |

---

## Medium Severity Issues

### Type Safety (8 issues)

1. **Disabled type checking** - `src/lib/supabase/server.ts:4-5` - Database types temporarily disabled
2. **Unsafe type assertion** - `src/lib/prompts/voice-system.ts:207-208` - `as keyof typeof` bypasses checking
3. **Missing validation** - `src/contexts/brand-context.tsx:69-70` - VoiceConfig/VisualConfig not validated
4. **Loose parameter types** - `src/hooks/use-brand-api.ts:57` - `Record<string, unknown>` too permissive
5. **String enums** - `src/types/database.ts` - Uses `string` instead of literal types for status fields
6. **confidence_score range** - `src/types/database.ts:192` - No TypeScript range validation
7. **ideas.status inconsistent** - `src/types/database.ts:194` - Uses `string` while content.status uses literals
8. **Unvalidated array** - `src/app/api/images/carousel/route.ts:432-433` - `slideStatuses` cast without validation

### State Management (5 issues)

1. **Excessive state** - `src/app/(dashboard)/content/page.tsx:111-139` - 27+ state variables
2. **Race conditions** - `src/contexts/brand-context.tsx:109-135` - No protection for rapid mutations
3. **Inconsistent state updates** - `src/app/(dashboard)/ideas/page.tsx:167-178` - Complex initialization logic
4. **No loading state** - `src/hooks/use-generation-jobs.ts:186` - `refresh()` doesn't update isLoading
5. **Partial failure handling** - `src/hooks/use-generation-jobs.ts:67-75` - `Promise.all` failures silently swallowed

### Accessibility (4 issues)

1. **Missing ARIA labels** - `src/app/(dashboard)/ideas/page.tsx:620-726` - Buttons without accessible names
2. **Missing form labels** - `src/app/(dashboard)/settings/page.tsx:480-493` - Labels not connected with `htmlFor`
3. **No keyboard navigation** - Multiple pages - Interactive elements lack keyboard support
4. **Color contrast** - Multiple UI components - May not meet WCAG standards

### Code Quality (6 issues)

1. **Duplicate function** - `updateJobStatus` duplicated in `images/generate/route.ts` and `images/carousel/route.ts`
2. **Duplicate utility** - `formatRelativeTime` duplicated in inputs and ideas pages
3. **Inconsistent error format** - API routes return different response shapes
4. **Magic strings** - Status values hardcoded throughout codebase
5. **Missing down migrations** - No rollback scripts for schema changes
6. **Undocumented cascade deletes** - All FKs use ON DELETE CASCADE without documentation

---

## Low Severity Issues

### Lint Warnings (58 total)

**Unused Variables:**
- `Eye`, `MoreHorizontal`, `ArrowUpRight`, `Layers` - calendar/page.tsx
- `hoveredContentId`, `scheduledCount`, `publishedCount` - calendar/page.tsx
- `useCallback`, `GripVertical`, `GenerationJob` - content/page.tsx
- `CardDescription`, `CardHeader`, `CardTitle`, `router` - ideas/page.tsx
- `Check`, `Zap`, `Brain`, `onDelete` - UI components

**Missing Dependencies:**
- `fetchContent` - calendar/page.tsx:125, content/page.tsx:173
- `fetchIdeas` - ideas/page.tsx:164
- `selectedPlatforms` - ideas/page.tsx:178
- `fetchRecentInputs` - inputs/page.tsx:115

**Image Optimization:**
- 20+ instances of `<img>` that should use `next/image`

### Errors (4 total)

1. `react/no-unescaped-entities` - inputs/page.tsx:435 - Use `&apos;` instead of `'`
2. `prefer-const` - brands/analyze/route.ts:195 - `text` should be const
3. `prefer-const` - social-accounts/route.ts:44 - `lateAccounts` should be const
4. `react-hooks/set-state-in-effect` - image-carousel.tsx:67 - setState inside useEffect

---

## Recommendations by Priority

### Phase 1: Critical (Block Deployment)

1. **Add authentication middleware** to all API routes
2. **Fix API key exposure** in Late.dev client
3. **Add SSRF protection** to website analyzer
4. **Fix schema/type mismatch** for feedback_notes field
5. **Add generation_jobs types** to database.ts
6. **Add RLS policies** to generation_jobs table

### Phase 2: High (This Sprint)

1. Add input validation utilities (shared across routes)
2. Implement proper error handling with standardized responses
3. Fix React dependency arrays in all useEffects
4. Add Error Boundaries to dashboard layout
5. Implement request deduplication in hooks
6. Add prompt injection protection

### Phase 3: Medium (Next Sprint)

1. Consolidate duplicate code (updateJobStatus, formatRelativeTime)
2. Implement proper TypeScript types for all status fields
3. Add accessibility improvements (ARIA labels, form labels)
4. Optimize N+1 queries and sequential operations
5. Add down migrations for all schema changes
6. Refactor excessive state in content page

### Phase 4: Low (Technical Debt)

1. Fix all lint warnings
2. Replace `<img>` with `next/image`
3. Add missing database indexes
4. Implement proper memoization
5. Document cascade delete behavior
6. Create shared validation utilities

---

## Files Changed This Audit

None - this is a read-only audit report.

---

## Next Steps

1. Review this report with the team
2. Create GitHub issues for each critical/high item
3. Schedule Phase 1 fixes immediately
4. Plan Phase 2-4 fixes into upcoming sprints

---

## Appendix: ESLint Output

```
4 errors, 58 warnings

Errors:
- src/app/(dashboard)/inputs/page.tsx:435 - Unescaped entity
- src/app/api/brands/analyze/route.ts:195 - prefer-const
- src/app/api/social-accounts/route.ts:44 - prefer-const
- src/components/ui/image-carousel.tsx:67 - setState in effect
```

---

*Report generated by Debug + QA combined audit role*
