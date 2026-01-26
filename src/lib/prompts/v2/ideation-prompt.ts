/**
 * V2 Ideation Prompt
 *
 * Generates content ideas that are distinctive, save-worthy,
 * and optimized for the creator's voice.
 *
 * Key differences from v1:
 * - Save-worthiness required
 * - AI pattern blacklist enforced
 * - Voice fingerprint integration
 * - Risk level awareness
 * - Research mode when input is thin
 */

import type { VoiceFingerprint } from "./voice-fingerprint";
import type { RiskLevel } from "./risk-dial";
import { generateVoicePrompt } from "./voice-generation";
import { getRiskPrompt } from "./risk-dial";
import { BLACKLIST_ENFORCEMENT_PROMPT } from "./anti-patterns";
import { SAVE_WORTHINESS_PROMPT, SAVE_WORTHY_FORMATS } from "./save-worthiness";
import { BURSTINESS_REQUIREMENTS } from "./burstiness";

/**
 * Idea output structure.
 */
export interface ContentIdea {
  /** Unique identifier */
  id: string;
  /** The core idea/angle */
  angle: string;
  /** Why this angle is interesting */
  whyInteresting: string;
  /** Suggested hook (first line) */
  hook: string;
  /** Content format */
  format: "thread" | "single" | "carousel" | "story";
  /** Target platform */
  platform: "twitter" | "linkedin" | "instagram";
  /** Save-worthiness assessment */
  saveWorthiness: {
    passesReferenceTest: boolean;
    passesFutureSelfTest: boolean;
    passesScreenshotTest: boolean;
    format: string;
  };
  /** Estimated risk level of this idea */
  riskLevel: "safe" | "balanced" | "bold";
  /** Key points to cover */
  keyPoints: string[];
  /** Potential controversy/pushback */
  potentialPushback?: string;
}

/**
 * V2 Ideation System Prompt - the main prompt that ties everything together.
 */
export const V2_IDEATION_SYSTEM_PROMPT = `
# Content Ideation System v2

You are a content strategist creating ideas for a personal brand creator.
Your job is to generate content ideas that are DISTINCTIVE and SAVE-WORTHY.

## What Makes Ideas Worth Creating

The best content makes people:
1. Screenshot it to share
2. Bookmark it for reference
3. Send it to a friend
4. Come back to it later

Generic content does none of these. You must create ideas that pass the SAVE TEST.

${SAVE_WORTHINESS_PROMPT}

## AI Detection Blacklist

${BLACKLIST_ENFORCEMENT_PROMPT}

## Rhythm Requirements

${BURSTINESS_REQUIREMENTS}

## Idea Quality Standards

Each idea must have:

1. A UNIQUE ANGLE
   - Not the first thing everyone thinks of
   - Has a "that's interesting" quality
   - Creates tension or challenges assumptions

2. A STRONG HOOK
   - Stops the scroll
   - Creates curiosity or tension
   - NOT from the dead hooks list (see blacklist)

3. CLEAR VALUE
   - What does the reader gain?
   - Why would they save this?
   - What problem does it solve?

4. APPROPRIATE FORMAT
   - Thread: Complex ideas, step-by-step, listicles (best for Twitter)
   - Single: Hot takes, observations, quick insights (Twitter/LinkedIn)
   - Carousel: Visual frameworks, before/after, tutorials (REQUIRED for Instagram)
   - Story: Personal experiences, case studies (any platform)

   **Platform Format Rules**:
   - Instagram → ALWAYS use carousel (highest engagement format)
   - Twitter → Prefer thread or single
   - LinkedIn → Prefer single or story

## Output Format

For each idea, provide:
{
  "id": "unique-id",
  "angle": "the core angle/take",
  "whyInteresting": "why this stands out",
  "hook": "the opening line",
  "format": "thread|single|carousel|story",
  "platform": "twitter|linkedin|instagram",
  "saveWorthiness": {
    "passesReferenceTest": true/false,
    "passesFutureSelfTest": true/false,
    "passesScreenshotTest": true/false,
    "format": "which save-worthy format this uses"
  },
  "riskLevel": "safe|balanced|bold",
  "keyPoints": ["point 1", "point 2"],
  "potentialPushback": "what might people disagree with"
}

## Quantity and Quality

Generate 4-6 ideas per input. At least:
- 1 safe idea (guaranteed solid)
- 1-2 balanced ideas (strong with some edge)
- 1-2 bold ideas (swinging for distinctive)

NEVER generate 6 safe ideas. Variety is required.
`;

/**
 * Build the complete ideation prompt with voice and risk settings.
 */
export function buildV2IdeationPrompt(config: {
  voiceFingerprint?: VoiceFingerprint;
  riskLevel: RiskLevel;
  platforms: ("twitter" | "linkedin" | "instagram")[];
  includeResearch?: boolean;
}): string {
  const sections: string[] = [V2_IDEATION_SYSTEM_PROMPT];

  // Add voice instructions if fingerprint provided
  if (config.voiceFingerprint) {
    const voicePrompt = generateVoicePrompt(config.voiceFingerprint);
    sections.push(`\n## Voice Requirements\n\n${voicePrompt.full}`);
  }

  // Add risk level instructions
  sections.push(`\n## Risk Level: ${config.riskLevel.toUpperCase()}\n\n${getRiskPrompt(config.riskLevel)}`);

  // Add platform-specific guidance
  sections.push(`\n## Target Platforms\n\nCreate ideas optimized for: ${config.platforms.join(", ")}`);

  if (config.platforms.includes("twitter")) {
    sections.push(`
### Twitter/X Optimization
- Hooks must work in timeline (first 280 chars matter)
- Threads should have clear thread-worthy promise
- Single posts need to be complete thoughts
- Controversy/takes perform well here`);
  }

  if (config.platforms.includes("linkedin")) {
    sections.push(`
### LinkedIn Optimization
- Professional context matters
- Stories and lessons resonate
- Frameworks and how-tos save well
- Avoid looking like "LinkedIn influencer"`);
  }

  if (config.platforms.includes("instagram")) {
    sections.push(`
### Instagram Optimization
- **ALWAYS use carousel format for Instagram** - it's the highest-performing format
- Carousels get 3x more engagement than single posts
- First slide must stop the scroll with a bold hook
- Each slide = one clear point (visual hierarchy matters)
- Text needs to work on mobile (large, readable)
- Final slide = clear CTA or takeaway
- Save/share is the key metric here
- 5-7 slides is optimal for retention`);
  }

  return sections.join("\n");
}

/**
 * Build the user prompt for ideation.
 */
export function buildV2IdeationUserPrompt(config: {
  input: string;
  enrichedInput?: string;
  brandContext?: {
    industry: string;
    audience: string;
    differentiator?: string;
  };
  existingIdeas?: string[];
}): string {
  const sections: string[] = [];

  // Primary input
  sections.push(`## Input to Transform\n\n${config.input}`);

  // Enriched input from research mode
  if (config.enrichedInput) {
    sections.push(`## Enriched Context (from research)\n\n${config.enrichedInput}`);
  }

  // Brand context
  if (config.brandContext) {
    sections.push(`## Brand Context

Industry: ${config.brandContext.industry}
Target Audience: ${config.brandContext.audience}
${config.brandContext.differentiator ? `Differentiator: ${config.brandContext.differentiator}` : ""}`);
  }

  // Avoid repetition
  if (config.existingIdeas && config.existingIdeas.length > 0) {
    sections.push(`## Avoid These (Already Created)

${config.existingIdeas.map((idea) => `- ${idea}`).join("\n")}

Generate ideas DIFFERENT from the above.`);
  }

  // Final instruction
  sections.push(`---

Now generate 4-6 distinctive content ideas based on this input.
Each idea must pass the save-worthiness test.
Include a mix of risk levels.
Output as JSON array.`);

  return sections.join("\n\n");
}

/**
 * Validate generated ideas meet v2 standards.
 */
export function validateIdeas(ideas: ContentIdea[]): {
  valid: ContentIdea[];
  rejected: { idea: ContentIdea; reasons: string[] }[];
  warnings: string[];
} {
  const valid: ContentIdea[] = [];
  const rejected: { idea: ContentIdea; reasons: string[] }[] = [];
  const warnings: string[] = [];

  // Check variety
  const riskCounts = { safe: 0, balanced: 0, bold: 0 };
  const formatCounts: Record<string, number> = {};

  for (const idea of ideas) {
    const reasons: string[] = [];

    // Check save-worthiness
    const saveTests = [
      idea.saveWorthiness.passesReferenceTest,
      idea.saveWorthiness.passesFutureSelfTest,
      idea.saveWorthiness.passesScreenshotTest,
    ];
    const passCount = saveTests.filter(Boolean).length;

    if (passCount === 0) {
      reasons.push("Fails all save-worthiness tests");
    }

    // Check hook quality (basic)
    if (!idea.hook || idea.hook.length < 10) {
      reasons.push("Hook is missing or too short");
    }

    // Check for required fields
    if (!idea.angle || idea.angle.length < 10) {
      reasons.push("Angle is missing or too vague");
    }

    if (!idea.keyPoints || idea.keyPoints.length < 2) {
      reasons.push("Not enough key points");
    }

    // Track for variety check
    riskCounts[idea.riskLevel]++;
    formatCounts[idea.format] = (formatCounts[idea.format] || 0) + 1;

    if (reasons.length > 0) {
      rejected.push({ idea, reasons });
    } else {
      valid.push(idea);
    }
  }

  // Variety warnings
  if (riskCounts.safe === ideas.length) {
    warnings.push("All ideas are safe - no bold takes included");
  }

  if (riskCounts.bold === 0) {
    warnings.push("No bold ideas generated - consider adding edge");
  }

  if (Object.keys(formatCounts).length === 1) {
    warnings.push("All ideas use same format - consider variety");
  }

  return { valid, rejected, warnings };
}

/**
 * Save-worthy format suggestions based on input type.
 */
export function suggestFormats(input: string): string[] {
  const text = input.toLowerCase();
  const suggestions: string[] = [];

  // Pattern matching for format suggestions
  if (/how to|steps|process|guide/i.test(text)) {
    suggestions.push("thread", "carousel");
  }

  if (/mistake|wrong|avoid|don't/i.test(text)) {
    suggestions.push("single", "thread");
  }

  if (/story|learned|realized|experience/i.test(text)) {
    suggestions.push("story", "thread");
  }

  if (/framework|system|method|template/i.test(text)) {
    suggestions.push("carousel", "thread");
  }

  if (/hot take|unpopular|actually|truth/i.test(text)) {
    suggestions.push("single");
  }

  // Default suggestions if no patterns match
  if (suggestions.length === 0) {
    return ["single", "thread", "carousel"];
  }

  return [...new Set(suggestions)];
}
