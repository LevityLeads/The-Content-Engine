# Coding Conventions

**Analysis Date:** 2026-01-22

## Naming Patterns

**Files:**
- Components: `kebab-case.tsx` (e.g., `brand-switcher.tsx`, `brand-creation-dialog.tsx`)
- API routes: Follow Next.js convention in `src/app/api/` structure (e.g., `/api/brands/route.ts`)
- Utilities and helpers: `kebab-case.ts` (e.g., `image-models.ts`, `voice-system.ts`)
- Context files: `kebab-case.tsx` (e.g., `brand-context.tsx`)
- Hooks: `use-[name].ts` pattern (e.g., `use-brand-api.ts`, `use-generation-jobs.ts`)

**Functions:**
- camelCase for all function declarations
- Async functions: `async function fetchBrands()` pattern
- Callbacks: `const handleSelect = useCallback(...)` for React handlers
- Helper functions: Descriptive names like `updateJobStatus()`, `buildUrl()`
- Private helpers: Regular camelCase, not prefixed with underscore

**Variables:**
- camelCase for all variable declarations (state, constants, parameters)
- Boolean flags: `isLoading`, `isFetching`, `open`, `hasError`
- Status/state strings: lowercase with possible underscores for compound words (e.g., `status: "generating"`, `status: "in_progress"`)
- DOM references: `ref` pattern used with `useRef`

**Types:**
- PascalCase for interfaces and type definitions (e.g., `BrandWithConfig`, `ContentImage`, `VoiceConfig`)
- Interfaces for objects with defined shape: `interface BrandContextType { ... }`
- Type unions for specific values: `type Step = "input" | "analyzing" | "preview" | "creating"`
- Database-related types: Auto-generated in `src/types/database.ts` from Supabase schema
- Props interfaces: `ComponentNameProps` pattern (e.g., `BrandSwitcherProps`)

## Code Style

**Formatting:**
- ESLint 9 with Next.js configuration (`eslint-config-next`)
- No Prettier config - relies on ESLint rules
- Run: `npm run lint` for linting
- Files auto-formatted by ESLint rules, not a separate formatter

**Linting:**
- Config file: `eslint.config.mjs` (flat config format)
- Extends: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Strict TypeScript enabled in `tsconfig.json`
- No `any` types allowed - use proper interfaces and generics

**Key ESLint Settings:**
- Core Web Vitals rules enforced
- TypeScript-specific rules active
- React 19 compatibility rules
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Import Organization

**Order:**
1. External packages (React, Next.js, third-party libraries)
2. Internal absolute imports from `@/` paths
3. Relative imports (rarely used, prefer absolute)

**Pattern in Component Files:**
```typescript
"use client";  // Client directive at very top

import { useState, useEffect, useCallback } from "react";  // React hooks first
import { Icon1, Icon2 } from "lucide-react";  // Icon library
import { Component } from "@/components/ui/component";  // UI components
import { useBrand } from "@/contexts/brand-context";  // Context hooks
import { cn } from "@/lib/utils";  // Utilities
```

**Pattern in API Routes:**
```typescript
import { NextRequest, NextResponse } from "next/server";  // Next.js types
import { createClient } from "@/lib/supabase/server";  // Supabase client
import Anthropic from "@anthropic-ai/sdk";  // AI SDK
import { SYSTEM_PROMPT, buildPrompt } from "@/lib/prompts";  // Prompts
```

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- All imports use absolute paths from root: `@/components`, `@/lib`, `@/contexts`, `@/types`, `@/hooks`, `@/app`

## Error Handling

**API Routes Pattern:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // Validation at entry point
    if (!requiredParam) {
      return NextResponse.json(
        { error: "Description of what's missing" },
        { status: 400 }
      );
    }

    // Business logic
    const { data, error } = await supabase.from(...);

    if (error) {
      console.error("Context: ", error);
      return NextResponse.json(
        { error: "User-friendly message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in POST /api/path:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Response Format:**
- Success: `{ success: true, data?: T, [key]: value }`
- Error: `{ error: string, [errorDetails]?: any }`
- Status codes: 400 (validation), 404 (not found), 500 (server error)

**Client-side Error Handling:**
```typescript
const fetchBrands = useCallback(async () => {
  try {
    setError(null);
    const res = await fetch("/api/brands");
    const data = await res.json();

    if (data.success && data.brands) {
      setBrands(data.brands);
    }
  } catch (err) {
    console.error("Error fetching brands:", err);
    setError("Failed to load brands");
  } finally {
    setIsLoading(false);
  }
}, []);
```

**Logging:**
- Use `console.error()` for errors with context
- Format: `console.error("Specific context:", error)` or `console.error("Error in OPERATION:", error)`
- Supabase errors logged with context before returning response
- Network and parsing errors caught and logged with full error object

## Comments

**When to Comment:**
- Complex algorithm logic (e.g., relative time calculations)
- Non-obvious business logic (e.g., organization fallback in brand creation)
- Important notes about constraints (e.g., max content length to avoid token limits)
- Critical output requirements (e.g., image generation specifications)

**JSDoc/TSDoc:**
- Used for public hook functions: `/** Hook that provides API fetch helpers with automatic brand filtering */`
- Used for utility functions with parameters: `/** Build a URL with brandId query param automatically added */`
- Minimal JSDoc - only on exported/public functions
- Comments placed above function signature

**Example Comment Patterns:**
```typescript
// Get or create a default organization if none provided
let orgId = organization_id;
if (!orgId) {
  // Organization logic...
}

// Truncate very long content (e.g., from large PDFs) to avoid context limits
// Keep first ~15000 chars which is roughly ~4000 tokens
const MAX_CONTENT_LENGTH = 15000;
```

## Function Design

**Size:**
- Average 15-50 lines for helper functions
- Longer functions (100+ lines) acceptable in API routes with distinct blocks
- Component render functions kept concise with extracted logic

**Parameters:**
- Prefer objects/interfaces for multiple parameters
- Single destructured parameter for options/config
- Type all parameters explicitly (no implicit `any`)

**Return Values:**
- Async functions return Promise with clear type: `Promise<BrandWithConfig | null>`
- API routes return `NextResponse` with typed body
- Hooks return objects with clearly named methods and values

**Pattern Example:**
```typescript
const useBrandApi = () => {
  const { selectedBrand } = useBrand();

  const buildUrl = useCallback(
    (path: string, params?: Record<string, string | undefined>) => {
      // Implementation
    },
    [selectedBrand]
  );

  return {
    selectedBrand,
    buildUrl,
    fetchWithBrand,
    mutateWithBrand,
  };
};
```

## Module Design

**Exports:**
- Named exports for functions and components: `export function BrandSwitcher() { ... }`
- Default exports for pages: `export default function RootLayout() { ... }`
- Type exports for interfaces: `export interface BrandProps { ... }`
- Wildcard imports for bundled exports

**Barrel Files:**
- Not heavily used in this codebase
- Direct imports from specific files preferred
- Exception: `src/lib/prompts/index.ts` exports multiple prompt-related items

**Organization:**
- Related files grouped in directories: `components/brand/`, `components/ui/`, `api/[resource]/`
- Contexts in dedicated file: `src/contexts/brand-context.tsx`
- Utilities in `src/lib/` subdirectories
- Database types centralized in `src/types/database.ts`

## Component Patterns

**React 19 with "use client":**
- Client components require `"use client"` directive at top
- Use hooks (useState, useEffect, useCallback, useContext)
- Props passed as simple objects with TypeScript interfaces

**UI Component Pattern:**
```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

**Styling:**
- Tailwind CSS 4 for all styling
- `className` attributes with conditional classes using `cn()` utility
- `class-variance-authority` (CVA) for component variants
- shadcn/ui components from `src/components/ui/` for base UI

## State Management

**Context API Pattern:**
```typescript
interface BrandContextType {
  brands: BrandWithConfig[];
  selectedBrand: BrandWithConfig | null;
  selectBrand: (brandId: string) => void;
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
```

**localStorage Integration:**
- Used for brand selection: `localStorage.getItem(SELECTED_BRAND_KEY)`
- Constants defined at module level: `const SELECTED_BRAND_KEY = "selectedBrandId"`

## API Integration

**Supabase Client:**
- Created via `createClient()` from `@/lib/supabase/server`
- Await client creation: `const supabase = await createClient()`
- Use method chaining for queries: `.select().eq().order()`
- Always check error objects: `if (error) { ... }`

**Fetch Wrapper:**
```typescript
const res = await fetch(path, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
const data = await res.json();
```

---

*Convention analysis: 2026-01-22*
