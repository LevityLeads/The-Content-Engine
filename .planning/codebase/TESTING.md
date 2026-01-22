# Testing Patterns

**Analysis Date:** 2026-01-22

## Test Framework Status

**Current State:**
- No test framework configured
- No Jest, Vitest, or Playwright installed
- No test files in source code (`src/`)
- Testing is not part of the current development workflow

**Recommendation for Future Implementation:**
When testing is added, consider:
- **Unit/Integration:** Vitest (faster than Jest, works with Next.js 16)
- **Component Testing:** React Testing Library or Vitest + @testing-library/react
- **E2E:** Playwright or Cypress for full user flows
- **API Testing:** Native Node.js fetch + assertion library or Supertest

## Run Commands (When Testing is Added)

```bash
# Unit and integration tests
npm run test              # Run all tests
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage report

# E2E tests (if added)
npm run test:e2e         # Run end-to-end tests
npm run test:e2e:ui      # Run E2E with UI

# Linting (already available)
npm run lint             # Run ESLint
```

## Expected Test File Organization

**Location Pattern:** Co-located with source files

```
src/
├── components/
│   ├── brand/
│   │   ├── brand-switcher.tsx
│   │   └── brand-switcher.test.tsx        # Test file
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx                 # Test file
├── lib/
│   ├── prompts/
│   │   ├── ideation-prompt.ts
│   │   └── ideation-prompt.test.ts        # Test file
│   └── utils.ts
│       └── utils.test.ts                   # Test file
├── app/
│   └── api/
│       ├── brands/
│       │   ├── route.ts
│       │   └── route.test.ts               # API test
└── hooks/
    ├── use-brand-api.ts
    └── use-brand-api.test.ts              # Hook test
```

## Recommended Test Structure

**Component Test Example Pattern (with Vitest + RTL):**
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrandSwitcher } from "./brand-switcher";

describe("BrandSwitcher", () => {
  it("renders loading state", () => {
    render(<BrandSwitcher />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays list of brands", async () => {
    render(<BrandSwitcher />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Brand 1")).toBeInTheDocument();
  });

  it("calls onAddNew when adding new client", async () => {
    const onAddNew = vi.fn();
    render(<BrandSwitcher onAddNew={onAddNew} />);
    await userEvent.click(screen.getByText("Add New Client"));
    expect(onAddNew).toHaveBeenCalled();
  });
});
```

**API Route Test Example Pattern (with Vitest):**
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/brands", () => {
  it("returns 400 when brand name is missing", async () => {
    const request = new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ description: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("required");
  });

  it("creates brand successfully", async () => {
    const request = new NextRequest(new URL("http://localhost:3000"), {
      method: "POST",
      body: JSON.stringify({ name: "New Brand" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.brand).toBeDefined();
  });
});
```

**Hook Test Example Pattern (with Vitest + @testing-library/react):**
```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBrandApi } from "./use-brand-api";
import { BrandProvider } from "@/contexts/brand-context";

describe("useBrandApi", () => {
  it("builds URL with brand ID", () => {
    const wrapper = ({ children }) => (
      <BrandProvider>{children}</BrandProvider>
    );
    const { result } = renderHook(() => useBrandApi(), { wrapper });

    act(() => {
      const url = result.current.buildUrl("/api/content");
      expect(url).toContain("brandId=");
    });
  });
});
```

## Mocking Strategy

**Framework:** Vitest's built-in `vi` object (similar to Jest)

**What to Mock:**
- External API calls (Supabase, Anthropic, Google APIs)
- Fetch requests
- localStorage for tests that depend on it
- Context providers when testing isolated components

**What NOT to Mock:**
- Internal utility functions
- UI components from shadcn/ui
- Component props unless testing specific states
- React hooks (useState, useEffect) - let them run unless testing side effects

**Mocking Pattern:**
```typescript
import { vi } from "vitest";

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ success: true, brands: [] }),
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockBrand, error: null }),
    })),
  })),
}));

// Mock Anthropic
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: "Generated ideas..." }],
      }),
    },
  })),
}));
```

## Fixtures and Factories

**Test Data Location:** Create in `src/__tests__/fixtures/` or alongside test files

**Factory Pattern:**
```typescript
// src/__tests__/fixtures/brand.factory.ts
import { BrandWithConfig } from "@/contexts/brand-context";

export const createMockBrand = (overrides?: Partial<BrandWithConfig>): BrandWithConfig => ({
  id: "brand-1",
  name: "Test Brand",
  organization_id: "org-1",
  description: "A test brand",
  voice_config: {
    tone_keywords: ["professional"],
    strictness: 0.7,
  },
  visual_config: {
    primary_color: "#1a1a1a",
    accent_color: "#3b82f6",
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockContent = (overrides?: Partial<Content>): Content => ({
  id: "content-1",
  brand_id: "brand-1",
  platform: "instagram",
  copy_primary: "Sample post copy",
  copy_hashtags: ["test", "sample"],
  copy_cta: "Learn more",
  copy_thread_parts: null,
  copy_carousel_slides: null,
  status: "draft",
  scheduled_for: null,
  metadata: {},
  created_at: new Date().toISOString(),
  ...overrides,
});
```

**Usage in Tests:**
```typescript
import { createMockBrand } from "@/__tests__/fixtures/brand.factory";

it("updates brand successfully", () => {
  const brand = createMockBrand({ name: "Updated Brand" });
  expect(brand.name).toBe("Updated Brand");
});
```

## Coverage

**Current Requirements:** None enforced

**Recommended Targets (when testing added):**
- Statements: 70%+
- Branches: 60%+
- Functions: 70%+
- Lines: 70%+

**View Coverage:**
```bash
npm run test:coverage
# Opens coverage report in coverage/index.html
```

**Coverage Config (when added to vitest.config.ts):**
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.test.ts",
        "**/*.test.tsx",
      ],
    },
  },
});
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, utilities, hooks
- Files: `src/lib/*.test.ts`, `src/hooks/*.test.ts`
- Approach: Test pure functions, inputs/outputs, edge cases
- Example: Testing `cn()` utility, prompt building functions

**Integration Tests:**
- Scope: Component + context, component + API mocking
- Files: `src/components/**/*.test.tsx`, `src/app/api/**/*.test.ts`
- Approach: Test data flow, state changes, side effects
- Example: Testing BrandSwitcher with BrandContext, API routes with Supabase mocking

**E2E Tests (Recommended Future Addition):**
- Framework: Playwright (over Cypress due to modern capabilities)
- Files: `e2e/` directory at project root
- Scope: Complete user workflows
- Example: Create brand → Upload input → Generate ideas → Review content
- Run: `npm run test:e2e`

## Common Patterns

**Async Testing Pattern:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Async operations", () => {
  it("fetches and processes data", async () => {
    const result = await fetchBrands();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles promise rejections", async () => {
    await expect(fetchInvalidBrand()).rejects.toThrow("Brand not found");
  });
});
```

**Error Testing Pattern:**
```typescript
describe("Error handling", () => {
  it("throws on missing required fields", () => {
    expect(() => {
      createBrand({ description: "No name" });
    }).toThrow("Brand name is required");
  });

  it("returns error response with correct status", async () => {
    const request = new NextRequest(new URL("http://localhost"), {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

**Context Testing Pattern:**
```typescript
import { BrandProvider, useBrand } from "@/contexts/brand-context";

describe("Brand Context", () => {
  const wrapper = ({ children }) => <BrandProvider>{children}</BrandProvider>;

  it("provides selected brand", () => {
    const { result } = renderHook(() => useBrand(), { wrapper });
    expect(result.current.selectedBrand).toBeDefined();
  });

  it("selects brand by ID", () => {
    const { result } = renderHook(() => useBrand(), { wrapper });
    act(() => {
      result.current.selectBrand("brand-1");
    });
    expect(result.current.selectedBrand?.id).toBe("brand-1");
  });
});
```

**Component User Interaction Pattern:**
```typescript
import userEvent from "@testing-library/user-event";

describe("User interactions", () => {
  it("handles button click", async () => {
    const user = userEvent.setup();
    render(<Button>Click me</Button>);

    await user.click(screen.getByRole("button"));
    // Assert result
  });

  it("handles form submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BrandForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Brand Name"), "New Brand");
    await user.click(screen.getByText("Create"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New Brand" })
    );
  });
});
```

## Testing Checklist (When Implementing Tests)

**Setup:**
- [ ] Install Vitest
- [ ] Install @testing-library/react
- [ ] Install @testing-library/user-event
- [ ] Create `vitest.config.ts` with coverage settings
- [ ] Create `src/__tests__/fixtures/` directory
- [ ] Create `src/__tests__/setup.ts` for global mocks

**Priority Test Areas:**
- [ ] API routes (`src/app/api/*/route.ts`) - highest priority
- [ ] Custom hooks (`src/hooks/`) - medium priority
- [ ] Context providers (`src/contexts/`) - medium priority
- [ ] Complex components (`src/components/brand/`) - medium priority
- [ ] Utility functions (`src/lib/`) - lower priority
- [ ] Base UI components (`src/components/ui/`) - lower priority (shadcn/ui already tested)

**CI/CD Integration:**
- [ ] Add test step to GitHub Actions before build
- [ ] Require test pass before merge to main
- [ ] Generate coverage reports on each PR
- [ ] Set minimum coverage thresholds

---

*Testing analysis: 2026-01-22*

## Notes for Future Implementation

- **Why Vitest over Jest:** Faster, better ESM support, works perfectly with Next.js 16
- **Why Playwright over Cypress:** Better cross-browser support, headless mode, better TypeScript support
- **Coverage Priority:** API routes first (highest risk, most impact), then hooks/context
- **Testing Philosophy:** Test user behavior and integration, not implementation details
