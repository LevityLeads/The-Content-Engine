# Architecture Patterns for Automated Content Generation Pipeline

> **Research Date:** 2026-01-23
> **Research Type:** Architecture dimension for content automation pipeline
> **Confidence:** HIGH (based on codebase analysis + industry research)

---

## Executive Summary

Automated content generation pipelines for social media carousels require a specific architectural approach to maintain visual and narrative coherence. The key insight is that **decoupling stages breaks coherence**, while **all-at-once generation with strong template enforcement** preserves it.

This document defines the component boundaries, data flow, and build order for implementing automation in The Content Engine. The architecture prioritizes:

1. **Coherence over flexibility** — Constraints enable consistency
2. **Template authority over AI creativity** — Design systems rule
3. **Single source of truth** — One design context flows everywhere
4. **Feedback loops** — System learns from outputs

---

## Recommended Architecture

### Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONTENT ENGINE PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌──────────────────────────────────────────────┐   │
│  │   INPUT     │───▶│           IDEATION ENGINE                    │   │
│  │   LAYER     │    │  ┌────────────────────────────────────────┐  │   │
│  │             │    │  │ Brand Context + Voice + Visual Config  │  │   │
│  │  • Raw text │    │  └────────────────────────────────────────┘  │   │
│  │  • URLs     │    │                    │                         │   │
│  │  • Documents│    │                    ▼                         │   │
│  └─────────────┘    │  ┌────────────────────────────────────────┐  │   │
│                     │  │   Claude: Generate Ideas + Angle       │  │   │
│                     │  │   Output: Structured Idea Objects      │  │   │
│                     │  └────────────────────────────────────────┘  │   │
│                     └──────────────────────────────────────────────┘   │
│                                         │                               │
│                                         ▼                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    CONTENT GENERATION ENGINE                      │  │
│  │  ┌───────────────────────────────────────────────────────────┐   │  │
│  │  │              DESIGN CONTEXT (SINGLE SOURCE)                │   │  │
│  │  │  • Brand colors (primary, accent, secondary)               │   │  │
│  │  │  • Visual style (typography/photorealistic/illustration)   │   │  │
│  │  │  • Design system preset (text sizes, padding, fonts)       │   │  │
│  │  │  • Master brand prompt (if available)                      │   │  │
│  │  └───────────────────────────────────────────────────────────┘   │  │
│  │                              │                                    │  │
│  │           ┌──────────────────┴──────────────────┐                │  │
│  │           ▼                                     ▼                │  │
│  │  ┌─────────────────────┐            ┌────────────────────────┐  │  │
│  │  │  Claude: Generate   │            │   Background Generator │  │  │
│  │  │  All Slide Content  │            │   (Gemini)             │  │  │
│  │  │  + Copy + Captions  │            │   One BG for carousel  │  │  │
│  │  │  IN ONE CALL        │            │                        │  │  │
│  │  └─────────────────────┘            └────────────────────────┘  │  │
│  │           │                                     │                │  │
│  │           └──────────────────┬──────────────────┘                │  │
│  │                              ▼                                    │  │
│  │  ┌───────────────────────────────────────────────────────────┐   │  │
│  │  │              SLIDE COMPOSITOR (Satori + Sharp)             │   │  │
│  │  │  For each slide:                                           │   │  │
│  │  │    1. Take shared background                               │   │  │
│  │  │    2. Apply template (locked design system)                │   │  │
│  │  │    3. Render text overlay via Satori                       │   │  │
│  │  │    4. Composite with Sharp                                 │   │  │
│  │  │    5. Return consistent slide image                        │   │  │
│  │  └───────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                         │                               │
│                                         ▼                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    QUALITY VALIDATION LAYER                       │  │
│  │  • Forbidden word check (hard reject)                            │  │
│  │  • Brand color consistency verification                          │  │
│  │  • JSON schema validation                                        │  │
│  │  • Confidence scoring                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                         │                               │
│                                         ▼                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌───────────────────┐  │
│  │ HUMAN REVIEW    │───▶│ SCHEDULING      │───▶│ PUBLISHING        │  │
│  │ (Checkpoints)   │    │ (Best times)    │    │ (Late.dev)        │  │
│  └─────────────────┘    └─────────────────┘    └───────────────────┘  │
│                                         │                               │
│                                         ▼                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    FEEDBACK & LEARNING SYSTEM                     │  │
│  │  • Track edits, regenerations, approvals                         │  │
│  │  • Correlate generation params with engagement                   │  │
│  │  • Feed patterns back into prompt system                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

### 1. Input Layer

**Responsibility:** Accept and normalize user inputs into structured format.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Accept text, URLs, documents | Generate content |
| Sanitize for prompt injection | Make decisions about content type |
| Extract and structure raw content | Apply brand context |
| Store inputs with metadata | Trigger downstream generation |

**Communicates With:**
- Database (store inputs)
- Ideation Engine (pass structured content)

**Key Interface:**
```typescript
interface NormalizedInput {
  id: string;
  brand_id: string;
  raw_content: string;  // Sanitized
  type: 'text' | 'url' | 'document';
  metadata: {
    source_url?: string;
    extracted_at: string;
    content_length: number;
  };
}
```

---

### 2. Ideation Engine

**Responsibility:** Transform inputs into structured content ideas with consistent formatting.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Apply brand voice context | Generate copy or images |
| Generate idea concepts + angles | Make visual decisions |
| Score ideas with confidence | Store ideas (caller does this) |
| Suggest formats (carousel, thread) | Pick the final format |

**Communicates With:**
- Input Layer (receive normalized content)
- Brand System (fetch voice_config)
- Database (read brand, write ideas)

**Key Interface:**
```typescript
interface GeneratedIdea {
  concept: string;
  angle: 'educational' | 'entertaining' | 'inspirational' | 'promotional' | 'conversational';
  hookApproach: 'curiosity' | 'controversy' | 'confession' | 'contrarian' | 'credibility';
  targetPlatforms: string[];
  suggestedFormat: 'single-post' | 'thread' | 'carousel' | 'story';
  keyPoints: string[];
  potentialHooks: string[];
  confidenceScore: {
    hookStrength: number;
    valueDensity: number;
    shareability: number;
    platformFit: number;
    overall: number;
  };
}
```

---

### 3. Design Context Provider

**Responsibility:** Single source of truth for all visual decisions in a generation session.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Assemble complete design context | Generate images |
| Resolve brand colors + style | Store design decisions |
| Select/build design system preset | Change mid-generation |
| Include master brand prompt if available | Make content decisions |

**Communicates With:**
- Brand System (fetch visual_config)
- Content Generation Engine (provide context)
- Slide Compositor (provide design system)

**Key Interface:**
```typescript
interface DesignContext {
  // Visual Style
  visualStyle: 'typography' | 'photorealistic' | 'illustration' | '3d-render' | 'abstract-art' | 'collage';

  // Colors (hex codes, mandatory)
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;

  // Typography
  fontFamily: string;  // Always 'Inter' for consistency
  headlineFontSize: number;
  bodyFontSize: number;
  headlineFontWeight: number;
  bodyFontWeight: number;

  // Layout
  paddingX: number;
  paddingY: number;

  // Brand Override (takes priority if present)
  masterBrandPrompt?: string;

  // Aesthetic descriptor for prompts
  aesthetic: string;
}
```

**Critical Design Decision:**
> Design Context is computed ONCE at the start of content generation and passed to ALL downstream components. It does NOT change during generation. This prevents the coherence drift that occurs when each slide independently resolves styling.

---

### 4. Content Generation Engine

**Responsibility:** Generate ALL carousel content in a single, coherent operation.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Generate all slides together | Generate slides one at a time |
| Apply voice config throughout | Make visual decisions (uses context) |
| Structure narrative arc | Store content (caller does this) |
| Generate copy + visual hints | Create final images (compositor does this) |

**Communicates With:**
- Design Context Provider (receive design context)
- Ideation Engine (receive idea)
- Brand System (receive voice_config)
- Slide Compositor (hand off content)

**Key Interface:**
```typescript
interface CarouselContent {
  platform: string;
  primaryCopy: string;
  hashtags: string[];
  cta: string;
  carouselSlides: Array<{
    slideNumber: number;
    text: string;        // The copy for this slide
    visualHint: string;  // Mood/metaphor guidance
  }>;
  metadata: {
    visualStyle: string;
    designContext: DesignContext;  // Captured for reproducibility
  };
}
```

**Critical Design Decision:**
> All slides generated in ONE AI call. This allows Claude to plan the narrative arc (hook → buildup → climax → CTA) and ensure content flows. Sequential generation loses this coherence.

---

### 5. Background Generator

**Responsibility:** Create ONE background image that will be shared across all slides.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Generate consistent background | Generate per-slide backgrounds |
| Apply brand colors | Add text (compositor does this) |
| Match visual style | Make content decisions |
| Leave clear space for text | Generate multiple variants |

**Communicates With:**
- Design Context Provider (receive colors + style)
- Slide Compositor (provide background)
- Gemini API (image generation)

**Key Interface:**
```typescript
interface BackgroundResult {
  imageData: string;  // base64 PNG
  style: string;      // e.g., 'gradient-dark'
  generatedWith: {
    model: string;
    colors: { primary: string; accent: string };
  };
}
```

**Critical Design Decision:**
> ONE background for ALL slides. This is the primary mechanism for visual consistency. The background is generated first, then each slide composites text on top. Never generate unique backgrounds per slide.

---

### 6. Slide Compositor

**Responsibility:** Combine background + text into final slide images with guaranteed consistency.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Apply locked template | Make design decisions (uses context) |
| Render text via Satori | Generate content |
| Composite with Sharp | Store images (caller does this) |
| Enforce typography rules | Change styles between slides |
| Produce consistent output | Use AI for composition |

**Communicates With:**
- Background Generator (receive background)
- Design Context Provider (receive design system)
- Content Generation Engine (receive slide text)
- Database (images table)

**Key Interface:**
```typescript
interface CompositeSlideRequest {
  backgroundImage: string;  // Shared across carousel
  content: SlideContent;
  designSystem: DesignContext;  // Locked, cannot change
  templateType: 'hook' | 'content' | 'cta' | 'numbered';
  dimensions: { width: number; height: number };
}

interface CompositeSlideResult {
  slideNumber: number;
  imageUrl: string;
  storagePath: string;
}
```

**Critical Design Decision:**
> Compositor uses PROGRAMMATIC rendering (Satori + Sharp), NOT AI. This guarantees that typography, colors, and layout are exactly as specified. AI-generated text overlays introduce variation; programmatic compositing eliminates it.

---

### 7. Quality Validation Layer

**Responsibility:** Gate content quality before proceeding to human review or automation.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Validate JSON structure | Generate content |
| Check forbidden words (hard reject) | Make subjective quality judgments |
| Verify brand color presence | Store content |
| Score confidence | Auto-approve (humans decide) |
| Detect prompt injection artifacts | Fix quality issues (triggers retry) |

**Communicates With:**
- Content Generation Engine (validate output)
- Database (log quality events)
- Alert System (flag issues)

**Key Interface:**
```typescript
interface ValidationResult {
  valid: boolean;
  issues: Array<{
    type: 'forbidden_word' | 'schema_violation' | 'injection_detected' | 'color_missing';
    severity: 'error' | 'warning';
    details: string;
  }>;
  confidenceScore: number;  // 0-100
  canProceed: boolean;      // True if no errors
}
```

---

### 8. Human Review Checkpoints

**Responsibility:** Provide approval gates at critical points in the pipeline.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Present content for review | Auto-approve anything |
| Track approval/rejection | Generate content |
| Allow editing before approval | Make scheduling decisions |
| Log edit patterns | Store metrics (learning system does) |

**Communicates With:**
- Quality Validation Layer (receive validated content)
- Scheduling System (pass approved content)
- Learning System (provide edit signals)

**Checkpoint Locations:**
1. After Ideation (approve ideas before generation)
2. After Content Generation (approve copy before publishing)
3. After Scheduling (confirm scheduled time)

---

### 9. Scheduling System

**Responsibility:** Select optimal posting times based on platform best practices and brand history.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Suggest best times per platform | Generate content |
| Respect posting frequency limits | Decide content priority |
| Adapt based on engagement data | Auto-publish (Late.dev does) |
| Handle timezone conversion | Make content decisions |

**Communicates With:**
- Human Review Checkpoints (receive approved content)
- Publishing Layer (pass scheduled content)
- Learning System (receive engagement data)

---

### 10. Publishing Layer (Late.dev Integration)

**Responsibility:** Publish content to social platforms via Late.dev API.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Format content per platform | Generate content |
| Handle image/video uploads | Schedule content (scheduler does) |
| Report publish status | Make platform decisions |
| Republish failed posts | Store content |

**Communicates With:**
- Scheduling System (receive scheduled content)
- Late.dev API (publish)
- Database (update status)
- Learning System (report outcomes)

---

### 11. Feedback & Learning System

**Responsibility:** Collect signals from all stages to enable continuous improvement.

| What It Does | What It Doesn't Do |
|--------------|-------------------|
| Track edits, regenerations, approvals | Make real-time decisions |
| Correlate params with engagement | Generate content |
| Identify failure patterns | Fix issues automatically |
| Surface insights for prompt tuning | Retrain models |

**Communicates With:**
- All components (collect events)
- Database (feedback_events table)
- Analytics dashboard (surface insights)

**Key Signals Collected:**
- Edit rate per content type
- Regeneration rate per prompt version
- Approval rate at each checkpoint
- Engagement metrics post-publish
- Hook patterns that perform well/poorly

---

## Data Flow for Coherence

### The Coherence Problem

**Previous architecture (broken):**
```
Idea → Generate Copy → [Human Review] → Generate Image per Slide → Publish
                                                    ↑
                                        Each slide generated independently
                                        = Visual inconsistency
```

**New architecture (coherent):**
```
Idea → Design Context (computed once)
            ↓
       ┌────┴────┐
       ↓         ↓
   All Copy  Background
   (1 call)  (1 image)
       │         │
       └────┬────┘
            ↓
       Compositor (template-locked)
            ↓
       Consistent Carousel
```

### Information Flow for Coherence

| Stage | Information Passed | Purpose |
|-------|-------------------|---------|
| Brand → Design Context | visual_config, master_brand_prompt | Establish visual truth |
| Design Context → Copy Gen | Colors, style, aesthetic | AI knows the visual target |
| Design Context → Background | Colors, style | Background matches brand |
| Design Context → Compositor | Full design system | Templates locked to spec |
| Copy Gen → Compositor | Slide text + hints | Text ready for overlay |
| Background → Compositor | Shared image | Same background = consistency |

### State Management

**Session State (ephemeral):**
- Current design context
- Generated background
- Slide content array
- Validation results

**Persistent State (database):**
- Brand configs
- Generated content
- Images with metadata
- Feedback events

---

## Suggested Build Order

Based on dependencies and the coherence requirements, build in this order:

### Phase 1: Foundation (Dependencies for Everything)

| Component | Why First | Depends On |
|-----------|-----------|------------|
| Design Context Provider | All generation depends on it | Brand System (exists) |
| Input Sanitization | Security before any processing | Nothing new |
| JSON Validation | Every AI call needs it | Nothing new |

### Phase 2: Core Generation Pipeline

| Component | Why This Order | Depends On |
|-----------|---------------|------------|
| All-at-Once Content Generation | Central to coherence | Design Context |
| Background Generator Enhancement | Needs design context | Design Context |
| Slide Compositor Hardening | Uses both above | Content Gen, Background |

### Phase 3: Quality & Validation

| Component | Why This Order | Depends On |
|-----------|---------------|------------|
| Quality Validation Layer | Gates all output | Generation Pipeline |
| Forbidden Word Enforcement | Critical for brand | Validation Layer |
| Confidence Scoring | Informs automation | Validation Layer |

### Phase 4: Human Checkpoints

| Component | Why This Order | Depends On |
|-----------|---------------|------------|
| Review UI Enhancements | Shows validated content | Validation Layer |
| Edit Tracking | Feeds learning | Review UI |
| Approval Flow | Gates publishing | Edit Tracking |

### Phase 5: Scheduling & Publishing

| Component | Why This Order | Depends On |
|-----------|---------------|------------|
| Smart Scheduling | Needs approved content | Human Checkpoints |
| Late.dev Integration Hardening | Publishes scheduled | Scheduling |
| Republish Handling | Recovery path | Publishing |

### Phase 6: Learning & Automation

| Component | Why This Order | Depends On |
|-----------|---------------|------------|
| Feedback Event Collection | Needs data from all stages | All above |
| Pattern Analysis | Needs feedback data | Feedback Collection |
| Prompt Tuning Insights | Informs improvements | Pattern Analysis |
| Progressive Automation | Requires trust earned | Learning System |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Per-Slide Image Generation

**What:** Generate unique AI images for each slide based on slide text.

**Why Bad:** Each generation introduces variation. Slides look like different carousels.

**Instead:** Generate ONE background, composite ALL slides programmatically.

### Anti-Pattern 2: Deferred Design Decisions

**What:** Let each component resolve its own styling from brand config.

**Why Bad:** Interpretation drift. Content Gen and Image Gen interpret "coral" differently.

**Instead:** Design Context computed ONCE, passed everywhere, never reinterpreted.

### Anti-Pattern 3: Sequential Slide Generation

**What:** Generate slide 1, then slide 2, then slide 3 in separate AI calls.

**Why Bad:** Loses narrative arc. Each slide optimizes locally, not globally.

**Instead:** ALL slides generated in ONE call. AI plans the full story.

### Anti-Pattern 4: AI Typography

**What:** Let AI generate images with text baked in.

**Why Bad:** Fonts, sizes, colors vary. AI doesn't respect design systems.

**Instead:** AI generates backgrounds only. Satori renders text programmatically.

### Anti-Pattern 5: Optional Validation

**What:** Validation that doesn't block on failure.

**Why Bad:** Bad content slips through. Trust erodes.

**Instead:** Validation is mandatory. Failures trigger retry or human escalation.

---

## Integration Points with Existing Code

### Existing Components to Leverage

| Component | Location | How to Use |
|-----------|----------|------------|
| Brand Context | `src/contexts/brand-context.tsx` | Source for voice_config, visual_config |
| Design Presets | `src/lib/slide-templates/types.ts` | Foundation for design context |
| Carousel Route | `src/app/api/images/carousel/route.ts` | Already implements shared background |
| Voice System | `src/lib/prompts/voice-system.ts` | Enhance with enforced constraints |
| Visual Styles | `src/lib/prompts/visual-styles.ts` | Map to design context |

### Components to Build

| Component | Purpose | Location |
|-----------|---------|----------|
| Design Context Provider | Compute unified design context | `src/lib/design/context-provider.ts` |
| Validation Layer | Quality gates | `src/lib/validation/` |
| Learning System | Feedback collection | `src/lib/learning/` |

### Components to Modify

| Component | Changes Needed |
|-----------|---------------|
| `/api/content/generate` | Single-call generation, design context injection |
| `/api/images/carousel` | Design context as input (not resolved internally) |
| `buildVoicePrompt()` | Add hard constraints, not just guidelines |
| `buildContentUserPrompt()` | Include design context for visual awareness |

---

## Scalability Considerations

| Concern | At 10 brands | At 100 brands | At 1000 brands |
|---------|--------------|---------------|----------------|
| Design Context Compute | Inline in request | Cached per brand | Pre-computed, invalidate on change |
| Background Generation | On-demand | Cache recent backgrounds | Background library per brand |
| Template Rendering | Inline | Parallel per slide | Worker queue |
| Validation | Inline | Inline | Async with webhook |
| Learning Analysis | Real-time | Hourly batch | Daily batch + streaming |

---

## Key Architectural Principles

1. **Single Source of Truth:** Design Context is computed once, flows everywhere.

2. **Constraint Enables Consistency:** Templates lock design. AI can't deviate.

3. **All-at-Once Over Sequential:** Generate complete carousel content in one call.

4. **Programmatic Over Generative:** Compositor uses code, not AI, for final render.

5. **Validate Before Proceed:** No content advances without passing quality gates.

6. **Learn from Every Interaction:** Feedback loops inform continuous improvement.

7. **Earn Trust Gradually:** Automation unlocks progressively based on reliability.

---

## Sources

- [Consistency in Video Generative Models (AAAI 2026)](https://sites.google.com/view/aaai26-cvm) - Intra-clip, inter-clip, and inter-shot consistency dimensions
- [AI Content Generation Pipeline Architecture](https://knowbots.ca/blog/creating-ai-content-generation-pipeline/) - Context Manager pattern for coherence
- [Design Token-Based UI Architecture (Martin Fowler)](https://martinfowler.com/articles/design-token-based-ui-architecture.html) - Token architecture for consistency
- [Feedback Loops for LLMs (VentureBeat)](https://venturebeat.com/ai/teaching-the-model-designing-llm-feedback-loops-that-get-smarter-over-time/) - Three-layer feedback architecture
- [Context Window Management (Maxim AI)](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) - State management strategies
- [Higgsfield Popcorn Consistency](https://higgsfield.ai/blog/How-to-Achieve-Character-Consistency-Popcorn-Tool) - Style coherence modeling
- [Brand Compliance Automation (Frontify)](https://www.frontify.com/en/guide/ai-for-brand-management) - Automated guideline enforcement
- [Decoupling Principle for Data Architectures](https://awadrahman.medium.com/the-decoupling-principle-for-future-proof-data-architectures-9c8ace859905) - When to decouple vs. couple
- [LongCat Video Architecture](https://studio.aifilms.ai/blog/longcat-video-extended-duration-ai-generation) - Hierarchical temporal modeling

---

*Architecture research conducted 2026-01-23 for Content Pipeline Automation Milestone*
