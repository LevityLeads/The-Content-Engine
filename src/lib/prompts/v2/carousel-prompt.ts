/**
 * V2 Carousel Prompt
 *
 * Specialized prompt for carousel content generation.
 * Carousels require unique treatment because:
 * 1. Copy must work visually on slides
 * 2. Each slide needs standalone impact
 * 3. The visual + copy must work together
 * 4. Scroll-stopping first slide is critical
 */

import type { VoiceFingerprint } from "./voice-fingerprint";
import type { RiskLevel } from "./risk-dial";
import { generateVoicePrompt } from "./voice-generation";
import { getRiskPrompt } from "./risk-dial";
import { BLACKLIST_ENFORCEMENT_PROMPT } from "./anti-patterns";

/**
 * Carousel slide structure.
 */
export interface CarouselSlide {
  /** Slide number (1-indexed) */
  slideNumber: number;
  /** Main headline (required) */
  headline: string;
  /** Supporting body text (optional) */
  body?: string;
  /** Visual direction for image generation */
  visualDirection: string;
  /** Is this the hook slide? */
  isHook: boolean;
  /** Is this the CTA slide? */
  isCta: boolean;
  /** Slide type for design decisions */
  slideType: "hook" | "content" | "example" | "stat" | "quote" | "cta" | "summary";
}

/**
 * Complete carousel output.
 */
export interface CarouselOutput {
  /** Total slide count */
  slideCount: number;
  /** All slides */
  slides: CarouselSlide[];
  /** Caption for the post */
  caption: string;
  /** Hashtags (for Instagram) */
  hashtags: string[];
  /** Overall visual style */
  visualStyle: string;
  /** Color scheme guidance */
  colorScheme: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
}

/**
 * Carousel design styles.
 */
export const CAROUSEL_STYLES = {
  "bold-editorial": {
    description: "Bold, premium magazine feel",
    headlineSize: "72px",
    typography: "High contrast, statement fonts",
    layout: "Asymmetric, editorial",
  },
  "clean-modern": {
    description: "Clean, professional SaaS aesthetic",
    headlineSize: "64px",
    typography: "Clean sans-serif, readable",
    layout: "Centered, balanced",
  },
  "dramatic": {
    description: "High impact, attention-grabbing",
    headlineSize: "84px",
    typography: "Bold, condensed",
    layout: "Full-bleed, immersive",
  },
  "minimal": {
    description: "Elegant, understated luxury",
    headlineSize: "56px",
    typography: "Refined, spacious",
    layout: "Generous whitespace",
  },
  "statement": {
    description: "Bold, commanding presence",
    headlineSize: "96px",
    typography: "Ultra-bold, impactful",
    layout: "Text-dominant",
  },
};

/**
 * V2 Carousel System Prompt.
 */
export const V2_CAROUSEL_SYSTEM_PROMPT = `
# Carousel Content System v2

You are creating carousel content for social media (primarily Instagram/LinkedIn).
Carousels require a unique approach where copy and visuals work together.

## Carousel Psychology

People swipe carousels when:
1. Slide 1 stops their scroll (CRITICAL)
2. Each slide adds NEW value (not padding)
3. They feel they'll miss something if they stop
4. The content is easy to consume visually

People STOP swiping when:
- Text is too dense
- Slides are repetitive
- Value isn't clear
- They feel they got the point

## Slide Structure Rules

### SLIDE 1: THE HOOK (Most Important)

This slide determines if anyone sees the rest. It must:
- Stop the scroll in under 1 second
- Create immediate curiosity or tension
- NOT be a boring title ("10 Tips for...")
- Promise specific value

Good Slide 1 Examples:
- "The $100K mistake I made" (story promise)
- "Stop doing this immediately" (urgent warning)
- "What nobody tells you about X" (insider knowledge)
- "This changed everything" (transformation promise)
- A bold, specific claim that demands explanation

Bad Slide 1 Examples:
- "Marketing Tips" (generic)
- "Let's talk about..." (weak)
- "10 Things You Should Know" (listicle cliche)
- Any text that could be anyone's post

### SLIDES 2-N: THE VALUE

Each slide must:
- Deliver ONE clear point
- Add NEW information (not repeat)
- Be scannable in 2-3 seconds
- Build toward the conclusion

Slide Types:
- **Content**: Core teaching/insight
- **Example**: Specific illustration
- **Stat**: Data that supports the point
- **Quote**: Credibility or emphasis
- **Contrast**: Before/after, do/don't

### FINAL SLIDE: THE PAYOFF

Options:
- Clear takeaway summary
- Call to action
- Thought-provoking question
- The "so what" answer

## Copy Rules for Carousels

1. HEADLINES FIRST
   - The headline IS the slide
   - Body text is optional support
   - If headline doesn't work alone, rewrite it

2. LESS IS MORE
   - Max 20 words per slide (including headline)
   - One idea per slide
   - Let visual do heavy lifting

3. SCANNABLE
   - No walls of text
   - Clear hierarchy
   - Bullet points if listing

4. RHYTHM
   - Vary slide lengths
   - Mix short punchy slides with slightly longer ones
   - Create visual rhythm

${BLACKLIST_ENFORCEMENT_PROMPT}

## Visual Direction

For each slide, provide clear visual direction:
- What should the image/background show?
- What mood should it convey?
- What colors should dominate?
- Any text overlay considerations?

The visual direction must be SPECIFIC enough for image generation.
Generic directions like "professional background" are not acceptable.
`;

/**
 * Build the complete carousel prompt.
 */
export function buildV2CarouselPrompt(config: {
  voiceFingerprint?: VoiceFingerprint;
  riskLevel: RiskLevel;
  platform: "instagram" | "linkedin";
  visualStyle?: keyof typeof CAROUSEL_STYLES;
  brandColors?: {
    primary: string;
    accent: string;
  };
}): string {
  const sections: string[] = [V2_CAROUSEL_SYSTEM_PROMPT];

  // Voice instructions
  if (config.voiceFingerprint) {
    const voicePrompt = generateVoicePrompt(config.voiceFingerprint);
    sections.push(`\n## Voice Requirements\n\n${voicePrompt.full}`);
  }

  // Risk level
  sections.push(`\n## Risk Level: ${config.riskLevel.toUpperCase()}\n\n${getRiskPrompt(config.riskLevel)}`);

  // Visual style
  if (config.visualStyle) {
    const style = CAROUSEL_STYLES[config.visualStyle];
    sections.push(`\n## Visual Style: ${config.visualStyle}

${style.description}
- Headline size: ${style.headlineSize}
- Typography: ${style.typography}
- Layout: ${style.layout}`);
  }

  // Brand colors
  if (config.brandColors) {
    sections.push(`\n## Brand Colors

Primary: ${config.brandColors.primary}
Accent: ${config.brandColors.accent}

Use these colors in visual directions.`);
  }

  // Platform-specific
  sections.push(`\n## Platform: ${config.platform.toUpperCase()}

${config.platform === "instagram" ? `
Instagram Carousel Rules:
- 5-10 slides optimal (7 is sweet spot)
- Square (1:1) or Portrait (4:5) format
- First slide must work as standalone post in feed
- Caption can be longer (use it for context)
- Hashtags go in first comment usually` : `
LinkedIn Carousel Rules:
- Can be document/PDF style
- 5-12 slides works well
- More professional tone acceptable
- Can include more text per slide
- Consider executives quickly swiping`}`);

  return sections.join("\n");
}

/**
 * Build the user prompt for carousel generation.
 */
export function buildV2CarouselUserPrompt(config: {
  topic: string;
  angle: string;
  keyPoints: string[];
  suggestedHook?: string;
  slideCount?: number;
  additionalContext?: string;
}): string {
  const sections: string[] = [];

  sections.push(`## Carousel Brief

**Topic**: ${config.topic}
**Angle**: ${config.angle}

**Key Points to Cover**:
${config.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

${config.suggestedHook ? `**Suggested Hook**: ${config.suggestedHook}\n(Improve if you can)` : ""}

**Target Slide Count**: ${config.slideCount || "5-7 slides"}`);

  if (config.additionalContext) {
    sections.push(`## Additional Context\n\n${config.additionalContext}`);
  }

  sections.push(`---

## Output Format

Return as JSON:

{
  "slideCount": number,
  "slides": [
    {
      "slideNumber": 1,
      "headline": "The attention-grabbing hook",
      "body": "Optional supporting text",
      "visualDirection": "Specific visual description for image generation",
      "isHook": true,
      "isCta": false,
      "slideType": "hook"
    },
    // ... more slides
  ],
  "caption": "The Instagram/LinkedIn caption to accompany the carousel",
  "hashtags": ["relevant", "hashtags"],
  "visualStyle": "style name from options",
  "colorScheme": {
    "primary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  }
}

CRITICAL for visualDirection:
- Each slide's visual direction must be COMPLETE and STANDALONE
- Include: background color/style, text placement, any imagery
- Don't reference other slides ("same as slide 1" is NOT acceptable)
- Be specific enough for AI image generation

Now generate the carousel.`);

  return sections.join("\n\n");
}

/**
 * Validate carousel output.
 */
export function validateCarousel(carousel: CarouselOutput): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check slide count
  if (carousel.slideCount < 3) {
    issues.push("Too few slides - minimum 3 for a carousel");
  }
  if (carousel.slideCount > 10) {
    warnings.push("Many slides - consider if all add value");
  }

  // Check slide 1 is hook
  if (carousel.slides[0] && !carousel.slides[0].isHook) {
    warnings.push("First slide should be marked as hook");
  }

  // Check headline lengths
  for (const slide of carousel.slides) {
    if (slide.headline.length > 100) {
      issues.push(`Slide ${slide.slideNumber} headline too long (${slide.headline.length} chars)`);
    }
    if (slide.body && slide.body.length > 200) {
      warnings.push(`Slide ${slide.slideNumber} body text may be too long for visual`);
    }
    if (!slide.visualDirection || slide.visualDirection.length < 20) {
      issues.push(`Slide ${slide.slideNumber} needs more specific visual direction`);
    }
    // Check for "same as" references
    if (slide.visualDirection && /same as|like slide|similar to slide/i.test(slide.visualDirection)) {
      issues.push(`Slide ${slide.slideNumber} visual direction references another slide - must be standalone`);
    }
  }

  // Check for CTA slide
  const hasCta = carousel.slides.some((s) => s.isCta);
  if (!hasCta) {
    warnings.push("No CTA slide - consider adding a closing action");
  }

  // Check caption
  if (!carousel.caption || carousel.caption.length < 20) {
    warnings.push("Caption is very short - consider adding context");
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Generate visual prompt for a single slide.
 * Used when calling image generation API.
 */
export function generateSlideImagePrompt(
  slide: CarouselSlide,
  carousel: CarouselOutput
): string {
  return `Create a social media carousel slide image.

SLIDE CONTENT:
Headline: "${slide.headline}"
${slide.body ? `Body text: "${slide.body}"` : ""}

VISUAL DIRECTION:
${slide.visualDirection}

COLOR SCHEME:
Primary: ${carousel.colorScheme.primary}
Accent: ${carousel.colorScheme.accent}
Background: ${carousel.colorScheme.background}
Text: ${carousel.colorScheme.text}

STYLE: ${carousel.visualStyle}

REQUIREMENTS:
- Text must be readable and prominent
- Clean, professional social media aesthetic
- Square (1080x1080) or Portrait (1080x1350) format
- The headline should be the visual focus
- Do not add any text that isn't specified above`;
}
