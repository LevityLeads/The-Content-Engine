---
phase: 01-pipeline-coherence
plan: 04
subsystem: api
tags: [carousel, design-context, next-api, anthropic, pipeline]

# Dependency graph
requires:
  - phase: 01-pipeline-coherence
    provides: computeDesignContext function, DesignContext type (from 01-01)
  - phase: 01-pipeline-coherence
    provides: CAROUSEL_SYSTEM_PROMPT, buildCarouselUserPrompt (from 01-02)
  - phase: 01-pipeline-coherence
    provides: Template enforcement with DesignContext (from 01-03)
provides:
  - POST /api/content/carousel endpoint for all-at-once generation
  - DesignContext acceptance in POST /api/images/carousel
  - Pipeline logging for design context verification
affects: [phase-02-quality-gates, phase-03-human-checkpoints, frontend-content-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Design context computed once in content generation
    - Design context stored in content metadata
    - Design context passed to image generation for coherence
    - Pipeline logging at each step for verification

key-files:
  created:
    - src/app/api/content/carousel/route.ts
  modified:
    - src/app/api/images/carousel/route.ts

key-decisions:
  - "DesignContext stored in content.metadata for reproducibility"
  - "DesignContext returned in response for immediate downstream use"
  - "Backwards compatibility maintained - existing callers still work"
  - "Pipeline logging added at content gen, image gen, and per-slide compositing"

patterns-established:
  - "Content endpoint computes DesignContext once and stores/returns it"
  - "Image endpoint accepts DesignContext as highest priority, falls back to computing"
  - "Logging format: [Carousel Content] and [Carousel Images] prefixes"

# Metrics
duration: 6min
completed: 2026-01-24
---

# Phase 1 Plan 4: API Route Wiring Summary

**Wired Design Context Provider and carousel prompt system into API routes, completing the coherent pipeline from content generation through image compositing.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-24T11:09:07Z
- **Completed:** 2026-01-24T11:14:50Z
- **Tasks:** 3
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Created dedicated POST /api/content/carousel endpoint using all-at-once generation
- Updated POST /api/images/carousel to accept pre-computed DesignContext
- Added pipeline logging to verify design context consistency
- Maintained backwards compatibility for existing callers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Dedicated Carousel Content Generation Endpoint** - `67e7823` (feat)
2. **Task 2: Update Image Carousel Route to Accept DesignContext** - `43c4f71` (feat)
3. **Task 3: Add Integration Logging** - Included in Tasks 1 and 2 (logging was integral to implementation)

## Files Created/Modified

- `src/app/api/content/carousel/route.ts` - NEW: Dedicated endpoint for carousel content generation using CAROUSEL_SYSTEM_PROMPT and all-at-once approach. Computes DesignContext once, stores in metadata, returns for downstream use.

- `src/app/api/images/carousel/route.ts` - MODIFIED: Now accepts designContext in request body (highest priority). Falls back to computing from params for backwards compatibility. Added logging at design resolution and per-slide compositing.

## Decisions Made

1. **DesignContext stored in content.metadata** - Enables reproducibility; if images need regeneration, the same context can be reused
2. **DesignContext returned in API response** - Enables immediate downstream image generation without refetching
3. **Priority order: providedDesignContext > compute from params > legacy presets** - Ensures new pipeline path is preferred while maintaining compatibility
4. **Pipeline logging format established** - [Carousel Content] and [Carousel Images] prefixes with source indicator

## Deviations from Plan

None - plan executed exactly as written. Task 3 (logging) was inherently completed as part of Tasks 1 and 2 since logging was integral to the implementation.

## Issues Encountered

1. **Type mismatch on first build** - CarouselDesignSystem type changed in 01-03 to be `Omit<DesignContext, 'visualStyle' | 'masterBrandPrompt'>`, which doesn't have a `name` field. Fixed by removing the incorrect `name` property and adding proper field mapping.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Pipeline coherence is complete.** The four plans in Phase 1 establish:

1. **01-01**: DesignContext type and computeDesignContext function (single source of truth)
2. **01-02**: All-at-once carousel prompts with narrative arc
3. **01-03**: Template enforcement with DesignContext integration
4. **01-04**: API routes wired together (this plan)

**Ready for:**
- Plan 01-05: End-to-end verification (Wave 4)
- Phase 2: Quality Gates

**Verification steps for 01-05:**
1. Call POST /api/content/carousel with an idea
2. Verify response includes designContext
3. Call POST /api/images/carousel with the returned designContext
4. Verify logs show "[Carousel Images] Design context resolved: { source: 'provided', ... }"
5. Verify all slides use identical design properties

---
*Phase: 01-pipeline-coherence*
*Completed: 2026-01-24*
