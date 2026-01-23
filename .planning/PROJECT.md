# Content Pipeline Automation Milestone

## What This Is

Rethink the entire content generation pipeline to produce consistently high-quality, on-brand content that can run fully automated with optional human checkpoints. Primary focus on carousels as the main content format.

## The Problem

The current content generation workflow produces inconsistent quality, requiring manual intervention at every stage:

1. **Idea approval** — AI generates ideas but quality varies, requiring review
2. **Content review** — Generated copy needs checking before image generation
3. **Image regeneration** — Visual inconsistency across carousel slides forces re-rolling
4. **Scheduling** — Manual time selection and publishing triggers

The root cause: prompts and images were decoupled, breaking the coherence that makes carousels feel like a unified creative unit. Research shows successful tools generate all slides together with strong template/brand enforcement — we need to return to that model.

## The Goal

**Full automation with optional human checkpoints.** Input goes in, ready-to-post content comes out. Users can intervene if they want, but they don't have to.

The quality bar (all four required for trust):
- **Strong hooks** — First slide stops the scroll
- **Clear value** — Reader learns something useful
- **Visual polish** — Professional, cohesive across slides
- **On-brand** — Matches client voice and visual style

Success metric: 9/10 outputs are good enough to post without editing.

## Core Value

Consistent, trustworthy content generation that enables hands-off automation.

## Constraints

- **Keep current stack** — Claude (Opus 4.5), Gemini (image generation), Supabase, Next.js
- **Backward compatible** — Existing brands and content must continue working
- **Brownfield** — Build on existing architecture, not greenfield rewrite

## What's Already Built (Validated)

From codebase analysis:

- Multi-tenant brand system with voice_config and visual_config
- Input capture (text, URL, document, image)
- Idea generation via Claude (4 ideas per input)
- Content generation with platform-specific copy
- Image generation (single + carousel) via Gemini
- Video generation via Veo 3
- Social account connection via Late.dev
- Publishing workflow with scheduling
- Generation job tracking with polling
- Brand switcher and creation dialogs
- 5 visual style templates (bold-editorial, clean-modern, dramatic, minimal, statement)

## What Needs to Change

### Pipeline Architecture
- **All-at-once generation** — Generate complete carousel (narrative + all images) in single coherent flow
- **Template-first enforcement** — Templates constrain design; AI handles content, not design decisions
- **Brand context injection** — Every prompt includes full brand context (colors, typography, voice)
- **Slide-aware prompts** — Each image prompt includes carousel context (theme, previous slides, position)

### Quality Systems
- **Storytelling frameworks** — Add narrative structures (Hook → Problem → Solution → CTA, listicles, step-by-step)
- **Hook library enhancement** — Stronger scroll-stopping patterns for first slides
- **Consistency validation** — Check visual coherence before finalizing carousel

### Automation Flow
- **Auto-approval mode** — Option to skip idea/content review stages
- **Confidence scoring** — AI rates its own output quality; low-confidence triggers human review
- **Smart scheduling** — Auto-schedule based on platform best practices
- **One-click publish** — Approved content goes out without manual trigger

### Optional Human Checkpoints
- **Preview queue** — See what's about to go out
- **Veto mechanism** — Quick way to stop individual posts
- **Edit-in-flow** — Make changes without breaking automation

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| All-at-once carousel generation | Industry standard; maintains coherence | Pending |
| Template as primary consistency mechanism | Constrains design space; AI can't violate template rules | Pending |
| Keep Claude + Gemini split | Claude excels at narrative, Gemini at images | Confirmed |
| Auto-approval as opt-in | Start with human checkpoints, earn trust | Pending |

## Research Insights

From competitive analysis of 14 carousel tools (PostNitro, Canva, Predis.ai, Jasper, etc.):

1. **No tool generates unique visuals per slide** — All constrain design for consistency
2. **Brand Kit is foundational** — Upload once, auto-apply everywhere
3. **Templates encode rules AI can't break** — Layout, typography, spacing locked
4. **All-at-once generation is universal** — Complete carousel in single flow
5. **Human editing expected** — AI is accelerator, not replacement
6. **GPT-4o finding** — 87% higher consistency when same session generates all images

Research file: `.planning/research/CAROUSEL-TOOLS.md`

## Out of Scope

- New external services or APIs
- Fundamental stack changes
- Analytics/metrics dashboard (separate milestone)
- Team collaboration features

---
*Last updated: 2025-01-23 after initialization*
