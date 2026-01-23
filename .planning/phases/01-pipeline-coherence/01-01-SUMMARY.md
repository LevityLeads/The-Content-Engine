---
phase: 01-pipeline-coherence
plan: 01
subsystem: design-system
tags: [design-context, types, pure-function, carousel]

dependency-graph:
  requires: []
  provides:
    - computeDesignContext function
    - DesignContext interface
    - Design module at @/lib/design
  affects:
    - 01-02-PLAN (carousel prompts will use DesignContext)
    - 01-03-PLAN (template enforcement will use DesignContext)
    - 01-04-PLAN (API routes will use computeDesignContext)

tech-stack:
  added: []
  patterns:
    - Pure function pattern for design computation
    - Single source of truth for visual decisions
    - Type-safe visual style unions

key-files:
  created:
    - src/lib/design/types.ts
    - src/lib/design/context-provider.ts
    - src/lib/design/index.ts
  modified: []

decisions:
  - id: accent-from-brand-primary
    context: Brand colors need to integrate with style defaults
    decision: Use brand's primary_color as accent color, keep style's primary as text color
    rationale: Brands want their brand color visible as highlights, not replacing all text

metrics:
  duration: 3m 35s
  completed: 2026-01-23
---

# Phase 1 Plan 01: Design Context Provider Summary

**One-liner:** Pure function computing complete visual context from brand config + style selection, establishing single source of truth for carousel generation.

## What Was Built

Created the Design Context Provider module at `src/lib/design/` - a pure function system that computes a complete, immutable design context from brand configuration and visual style selection.

### Files Created

| File | Purpose | Exports |
|------|---------|---------|
| `src/lib/design/types.ts` | Type definitions | `DesignContext`, `DesignContextInput`, `BrandVisualConfig`, `VisualStyle` |
| `src/lib/design/context-provider.ts` | Core implementation | `computeDesignContext()` |
| `src/lib/design/index.ts` | Barrel export | All types and functions |

### DesignContext Interface (13 fields)

```typescript
interface DesignContext {
  visualStyle: VisualStyle;           // 'typography' | 'photorealistic' | etc.
  primaryColor: string;               // Text color (hex)
  accentColor: string;                // Highlight color (hex)
  backgroundColor: string;            // Background color (hex)
  fontFamily: string;                 // Always 'Inter'
  headlineFontSize: number;           // From text style preset
  bodyFontSize: number;               // From text style preset
  headlineFontWeight: number;         // From text style preset
  bodyFontWeight: number;             // From text style preset
  paddingX: number;                   // Fixed: 60px
  paddingY: number;                   // Fixed: 80px
  masterBrandPrompt?: string;         // Optional brand direction
  aesthetic: string;                  // For AI prompts
}
```

### Visual Styles Supported

| Style | Background | Primary | Accent | Aesthetic |
|-------|-----------|---------|--------|-----------|
| typography | #1a1a1a | #ffffff | #ff6b6b | bold, editorial, text-focused |
| photorealistic | rgba overlay | #ffffff | #ff6b6b | cinematic, photo-centric |
| illustration | #faf8f5 | #1a2744 | #ff6b6b | artistic, hand-crafted |
| 3d-render | #0f0f1a | #ffffff | #9f7aea | futuristic, dimensional |
| abstract-art | #1a1a1a | #ffffff | #ff6b6b | creative, expressive |
| collage | #f5f5f5 | #1a1a1a | #ff6b6b | layered, eclectic |

## Key Decisions Made

### 1. Brand Primary Color as Accent

**Decision:** Use brand's `primary_color` as the accent color, not the primary text color.

**Rationale:** Brands want their brand color visible as highlights/CTAs, but replacing all text with brand colors would hurt readability on most backgrounds.

### 2. Fixed Padding Values

**Decision:** `paddingX: 60` and `paddingY: 80` are fixed, not configurable.

**Rationale:** These values are template constraints that ensure consistent text positioning across all carousels. Varying padding would cause visual inconsistency.

### 3. Inter Font Family Only

**Decision:** `fontFamily` is always `'Inter'`, ignoring brand font preferences.

**Rationale:** Satori/Sharp text rendering requires font files. Supporting arbitrary fonts would require font loading infrastructure. Inter is already loaded and provides excellent readability.

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| `c6b3f11` | Create Design Context types | `types.ts` |
| `41e3f91` | Implement computeDesignContext function | `context-provider.ts` |
| `3d3ae5b` | Add barrel export for design module | `index.ts` |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] `npm run build` passes
- [x] `npx tsc --noEmit` passes
- [x] All 3 files created
- [x] DesignContext has 13 fields matching research spec
- [x] computeDesignContext is pure (no side effects)
- [x] Module exports cleanly via barrel file

## Next Phase Readiness

**Ready for Plan 01-02 and 01-03 (Wave 2, parallel):**
- Design Context types are exported and ready to import
- `computeDesignContext()` function is ready to use in carousel prompts
- Text style presets are integrated from existing `slide-templates/types.ts`

**Integration point:** Plans 01-02/01-03 will import:
```typescript
import { computeDesignContext, type DesignContext } from '@/lib/design';
```
