/**
 * Carousel Prompt System
 *
 * Generates ALL carousel slides in a single Claude call with explicit
 * narrative arc planning. This ensures content coherence across slides
 * that sequential generation cannot achieve.
 *
 * Key principles:
 * 1. Narrative arc planned BEFORE content generation
 * 2. All slides generated together with awareness of each other
 * 3. Design context awareness (but NOT design decisions - those come from DesignContext)
 */

import { type DesignContext } from '@/lib/design';

/**
 * Output structure for each carousel slide.
 * Contains content and narrative metadata, but NOT visual design details.
 */
export interface CarouselSlideOutput {
  /** Slide position (1-indexed) */
  slideNumber: number;

  /** The copy/text for this slide */
  text: string;

  /** Mood/metaphor guidance for visual generation (10-20 words) */
  visualHint: string;

  /** Role in the narrative arc */
  narrativeRole: 'hook' | 'buildup' | 'climax' | 'resolution' | 'cta';

  /** Emotional tone of this slide (e.g., "curiosity", "tension", "revelation", "action") */
  emotionalBeat: string;
}

/**
 * Complete result from carousel content generation.
 * Includes narrative planning metadata and all slides.
 */
export interface CarouselGenerationResult {
  /** The overarching narrative structure */
  narrativeArc: {
    /** The central story theme */
    theme: string;
    /** What creates the narrative tension */
    tension: string;
    /** How the tension resolves */
    resolution: string;
  };

  /** All slides with content and metadata */
  slides: CarouselSlideOutput[];

  /** Instagram caption */
  caption: string;

  /** Relevant hashtags */
  hashtags: string[];

  /** Call-to-action text */
  cta: string;
}

/**
 * Input parameters for carousel idea.
 */
export interface CarouselIdeaInput {
  concept: string;
  angle: string;
  keyPoints: string[];
  potentialHooks: string[];
  pillar?: string;
  reasoning?: string;
}

/**
 * System prompt for carousel generation.
 *
 * Emphasizes all-at-once generation with narrative arc planning.
 * Uses calm, instructive language per Claude 4.5 best practices.
 */
export const CAROUSEL_SYSTEM_PROMPT = `You are an expert content strategist specializing in Instagram carousels that tell complete stories.

## Your Task

You are generating a COMPLETE carousel. All slides must work together as a unified narrative.

Before writing any slide content, first plan the complete narrative arc:
- What is the central theme?
- What tension will you create?
- How does the tension build across slides?
- What is the climax or key insight?
- How does it resolve into action?

## Narrative Arc Structure

Every carousel tells a story. Here's how each position functions:

**Slide 1 (Hook)**: Stop the scroll. Create curiosity or tension. This is your only chance to earn the swipe.

**Slides 2 to N-1 (Buildup)**: Deliver value while building toward the climax. Each slide should feel inevitable given what came before.

**Slide N-1 (Climax)**: The key insight or transformation moment. This is the "aha" that makes everything click.

**Slide N (CTA)**: Clear next action. Resolution of the narrative. Give them somewhere to go with their new understanding.

## Narrative Arc Examples

### Example 1: Educational/How-To

Theme: "The hidden cost of multitasking"
Tension: "We think we're being productive, but we're actually losing time"
Resolution: "Focus on one thing at a time to reclaim your day"

Slides:
1. [Hook] "You're not busy. You're distracted." (curiosity)
   visualHint: stark confrontation, mirror moment, uncomfortable truth
2. [Buildup] "Every time you switch tasks, your brain needs 23 minutes to refocus" (revelation)
   visualHint: scattered fragments coming apart, chaos of divided attention
3. [Buildup] "That 'quick email check' just cost you an hour" (pain point)
   visualHint: time slipping away, sand through fingers, urgency
4. [Climax] "Single-tasking isn't slower. It's 40% faster." (transformation)
   visualHint: clarity emerging, sharp focus, powerful simplicity
5. [CTA] "Try it tomorrow: One task. One hour. Zero interruptions." (action)
   visualHint: clean slate, fresh start, actionable simplicity

### Example 2: Story-Based

Theme: "From burnout to balance"
Tension: "I thought success meant working harder"
Resolution: "I learned that rest is productive"

Slides:
1. [Hook] "I used to brag about sleeping 4 hours a night" (confession)
   visualHint: exhaustion worn as badge, dark circles as medals
2. [Buildup] "Then I started forgetting people's names" (consequence)
   visualHint: faces blurring, identity slipping, fog rolling in
3. [Buildup] "My doctor said my cortisol was 3x normal" (escalation)
   visualHint: alarm, warning signs, body's protest made visible
4. [Climax] "I took a month off. My best ideas came in week 3." (transformation)
   visualHint: breakthrough moment, light returning, ideas flourishing
5. [CTA] "What would happen if you actually rested?" (reflection)
   visualHint: invitation, open door, peaceful possibility

Notice how each slide knows what comes before and after it. The hook creates tension that the buildup develops and the climax resolves. This is impossible to achieve when generating slides independently.

## Important Guidelines

Your output will be used to create a cohesive visual carousel. Each slide's text must stand alone visually but connect narratively.

For the visualHint field:
- Keep it to 10-20 words
- Focus on mood, emotion, and visual metaphor
- Do NOT specify colors, fonts, or layout (those come from the DesignContext)
- Think: "What feeling should the viewer get from this slide's visuals?"

For slide text:
- Short, punchy, easy to read at a glance
- One clear thought per slide
- Use line breaks strategically for emphasis
- Headlines work better than paragraphs

## Output Format

Return valid JSON matching this structure:

\`\`\`json
{
  "narrativeArc": {
    "theme": "The central story theme",
    "tension": "What creates the narrative tension",
    "resolution": "How the tension resolves"
  },
  "slides": [
    {
      "slideNumber": 1,
      "text": "The hook text",
      "visualHint": "mood and metaphor guidance",
      "narrativeRole": "hook",
      "emotionalBeat": "curiosity"
    }
  ],
  "caption": "Instagram caption with call to action",
  "hashtags": ["#relevant", "#hashtags"],
  "cta": "Clear next step for the viewer"
}
\`\`\`

Remember: Plan the arc first, then write the slides. The narrative structure should feel inevitable, not assembled.`;

/**
 * Builds the user prompt for carousel generation.
 *
 * @param params Configuration for the carousel generation
 * @returns Formatted user prompt string
 */
export function buildCarouselUserPrompt(params: {
  /** The content idea to transform */
  idea: CarouselIdeaInput;
  /** Original source material for context */
  sourceContent: string;
  /** Design context for visual awareness (decisions already made) */
  designContext: DesignContext;
  /** Brand voice instructions */
  brandVoicePrompt: string;
  /** Optional: specific number of slides (let AI decide if not specified) */
  slideCount?: number;
}): string {
  const { idea, sourceContent, designContext, brandVoicePrompt, slideCount } = params;

  const slideCountInstruction = slideCount
    ? `Generate exactly ${slideCount} slides.`
    : 'Generate the optimal number of slides for this content (typically 4-7 slides).';

  return `## Content Idea

**Concept**: ${idea.concept}

**Angle**: ${idea.angle}

${idea.pillar ? `**Content Pillar**: ${idea.pillar}` : ''}

**Key Points to Cover**:
${idea.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

**Hook Options** (use as inspiration):
${idea.potentialHooks.map((hook, i) => `${i + 1}. "${hook}"`).join('\n')}

${idea.reasoning ? `**Why This Works**: ${idea.reasoning}` : ''}

---

## Source Material

${sourceContent.substring(0, 3000)}${sourceContent.length > 3000 ? '\n\n[Content truncated...]' : ''}

---

## Visual Context (For Awareness)

The carousel will use a "${designContext.visualStyle}" visual style with a "${designContext.aesthetic}" aesthetic.

When writing visualHints, keep this style in mind - but do NOT specify colors, fonts, or layout. Those decisions are already locked in the DesignContext.

---

## Brand Voice

${brandVoicePrompt}

---

## Generation Instructions

${slideCountInstruction}

First, plan your narrative arc:
1. What is the theme?
2. What tension will you create?
3. How will it resolve?

Then write each slide with awareness of where it sits in the arc.

Return ONLY valid JSON matching the specified format.`;
}
