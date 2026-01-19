# The Content Engine - Project Rules

This document contains all the rules and conventions for working on The Content Engine. Follow these guidelines to maintain consistency across the project.

---

## Git & Deployment Workflow

### Branch Naming
- **Claude/AI branches**: Must start with `claude/` (e.g., `claude/feature-name-abc123`)
- PRs from `claude/` branches are **auto-merged** via GitHub Action

### Deployment
- **Production deploys from `main` branch** via Vercel
- All changes to `main` trigger automatic deployment
- No manual merging required for `claude/` branches - they auto-merge

### Commit Messages
- Use clear, descriptive commit messages
- Format: `Action: Brief description of what changed`
- Examples:
  - `Add per-slide image generation for Instagram carousels`
  - `Fix carousel slide parsing for JSON strings from database`

---

## Image Generation Rules

### Platform-Specific Sizes
All generated images must use the correct aspect ratio for their platform:

| Platform | Aspect Ratio | Dimensions | Notes |
|----------|--------------|------------|-------|
| Instagram | 4:5 | 1080x1350 | Vertical feed post (optimal engagement) |
| Twitter/X | 16:9 | 1600x900 | Landscape (optimal timeline display) |
| LinkedIn | 16:9 | 1200x675 | Landscape (optimal professional feed) |

### Image Model
- **Current model**: Nano Banana Flash (`gemini-2.5-flash-image`)
- Fast generation (3-5 seconds)
- Supports aspect ratios: `1:1`, `4:5`, `16:9`, `9:16`

### Image Content Requirements
All images should include:
- Scroll-stopping headlines with bold, readable typography
- Text that is large, high-contrast, and legible on mobile
- Visual hierarchy that draws the eye to key messages

---

## Carousel Rules (Instagram)

### Structure
- **Maximum 6 slides** per carousel
- Slide 1: Hook/title that grabs attention
- Slides 2-5: Key points, one per slide
- Final slide: CTA or summary

### CRITICAL: Self-Contained Image Prompts

Each slide's image prompt is sent to the AI image generator **INDEPENDENTLY** - it has NO context of other slides.

**Every image prompt MUST include the COMPLETE design specification:**

1. **Background**: Exact color with hex code (e.g., "deep navy blue #1a365d background")
2. **Typography**: Font style, weight, color (e.g., "bold condensed sans-serif text in cream #faf5f0")
3. **Layout**: Element positions (e.g., "centered headline at top, supporting text below")
4. **Visual elements**: Icons, illustrations, textures (e.g., "subtle grain texture overlay")
5. **Color palette**: ALL colors used (e.g., "navy blue, cream, warm terracotta accents")
6. **Specific text/headline**: The actual text to display on this slide

### Examples

**WRONG** (references other slides - will produce inconsistent images):
```
"Consistent with slide 1..."
"Same style as previous..."
"Matching the series aesthetic..."
```

**CORRECT** (fully self-contained):
```
"Deep navy blue (#1a365d) background with subtle grain texture. Large bold condensed sans-serif headline 'YOUR HEADLINE' in cream (#faf5f0) centered at top. Supporting text in smaller cream font below. Small terracotta (#c4704b) line-art icon in corner. Clean, modern, minimalist aesthetic."
```

---

## Content Generation

### AI Model
- **Content generation**: Claude Opus 4.5 (`claude-opus-4-5-20251101`)
- **Image generation**: Gemini 2.5 Flash Image (`gemini-2.5-flash-image`)

### Platform Guidelines

**Twitter/X:**
- Max 280 characters
- Punchy, conversational tone
- 1-2 hashtags max
- Hook in the first line

**LinkedIn:**
- Professional but personable
- 150-300 words sweet spot
- Start with hook, end with question/CTA
- 3-5 hashtags at the end

**Instagram:**
- Engaging, visual-friendly copy
- Strong hook in first line (before "more" cutoff)
- 5-10 relevant hashtags
- Educational content = CREATE A CAROUSEL

---

## Database Schema Notes

### Carousel Slides Storage
- `copy_carousel_slides` column stores array of slide objects
- Each slide: `{ slideNumber, text, imagePrompt }`
- Legacy format (plain strings) is supported for backwards compatibility

### Content Status Flow
```
draft → approved → scheduled → published
```

---

## Code Conventions

### TypeScript
- Strict mode enabled
- All components use proper typing
- Avoid `any` types - use specific interfaces

### API Routes
- Located in `src/app/api/`
- Use Next.js App Router conventions
- Return consistent JSON: `{ success: boolean, data?: any, error?: string }`

### Components
- Located in `src/components/`
- Use shadcn/ui component library
- Tailwind CSS for styling

---

## Environment Variables Required

```env
ANTHROPIC_API_KEY=     # Claude API for content generation
GEMINI_API_KEY=        # Google Gemini for image generation
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Quick Reference

### Generate Consistent Carousel Images
1. Define a design system (colors, fonts, style) ONCE
2. Include the FULL design system in EVERY slide's imagePrompt
3. Never reference "previous slide" or "matching slide 1"

### Deploy Changes
1. Push to `claude/` branch
2. PR is auto-created and auto-merged
3. Vercel deploys from `main` automatically

### Add New Platform
1. Add to `PLATFORM_IMAGE_CONFIG` in `/src/app/api/images/generate/route.ts`
2. Add icon/color to content page
3. Update content generation prompt if needed
