/**
 * V2 Content Generation Prompt
 *
 * Generates the actual content copy from an approved idea.
 * Integrates all v2 modules:
 * - Voice fingerprint
 * - AI pattern blacklist
 * - Burstiness enforcement
 * - Save-worthiness validation
 * - Risk level adherence
 */

import type { VoiceFingerprint } from "./voice-fingerprint";
import type { RiskLevel } from "./risk-dial";
import type { ContentIdea } from "./ideation-prompt";
import { generateVoicePrompt } from "./voice-generation";
import { getRiskPrompt } from "./risk-dial";
import { BLACKLIST_ENFORCEMENT_PROMPT } from "./anti-patterns";
import { SAVE_WORTHINESS_PROMPT } from "./save-worthiness";
import { RHYTHM_PROMPT_SECTION } from "./burstiness";

/**
 * Generated content output.
 */
export interface GeneratedContent {
  /** The platform this is for */
  platform: "twitter" | "linkedin" | "instagram";
  /** Content format */
  format: "single" | "thread" | "carousel" | "story";
  /** The actual content copy */
  copy: ContentCopy;
  /** Hashtags (if applicable) */
  hashtags?: string[];
  /** Call to action type */
  ctaType?: "question" | "action" | "statement" | "none";
  /** Self-assessment */
  selfAssessment: {
    saveWorthiness: number; // 0-100
    voiceMatch: number; // 0-100
    riskLevel: RiskLevel;
    hookStrength: number; // 0-100
  };
}

/**
 * Content copy structure based on format.
 */
export type ContentCopy =
  | SinglePostCopy
  | ThreadCopy
  | CarouselCopy
  | StoryCopy;

export interface SinglePostCopy {
  type: "single";
  text: string;
}

export interface ThreadCopy {
  type: "thread";
  tweets: string[];
}

export interface CarouselCopy {
  type: "carousel";
  slides: {
    headline: string;
    body?: string;
    isHook?: boolean;
    isCta?: boolean;
  }[];
}

export interface StoryCopy {
  type: "story";
  frames: {
    text: string;
    duration?: number;
  }[];
}

/**
 * Platform-specific constraints.
 */
export const PLATFORM_CONSTRAINTS = {
  twitter: {
    singleMax: 280,
    threadTweetMax: 280,
    maxThreadLength: 15,
    hashtagStyle: "minimal", // 1-2 max
  },
  linkedin: {
    singleMax: 3000,
    optimalLength: "700-1200",
    hashtagStyle: "moderate", // 3-5
    structurePreference: "readable paragraphs, line breaks for emphasis",
  },
  instagram: {
    captionMax: 2200,
    optimalLength: "150-300 for single, longer for carousels",
    hashtagStyle: "aggressive", // 10-20, but in comment
    carouselSlides: { min: 2, max: 10, optimal: "5-7" },
  },
};

/**
 * V2 Content System Prompt - the core content generation instructions.
 */
export const V2_CONTENT_SYSTEM_PROMPT = `
# Content Generation System v2

You are writing content for a personal brand creator. Your job is to transform
an approved content idea into polished, distinctive copy.

## Your Mission

Create content that people:
1. Stop scrolling to read
2. Screenshot to share
3. Save for later reference
4. Remember and talk about

Generic content fails all four. You must be distinctive.

## Core Requirements

${BLACKLIST_ENFORCEMENT_PROMPT}

${RHYTHM_PROMPT_SECTION}

${SAVE_WORTHINESS_PROMPT}

## Content Quality Standards

### HOOKS (First Line)

The hook must:
- Create immediate curiosity or tension
- NOT be from the dead hooks list
- Match the voice fingerprint
- Promise value that you deliver

Hook types that work:
- Bold claim: "X is wrong about Y"
- Counterintuitive truth: "The best way to X is to stop doing Y"
- Pattern interrupt: Start mid-thought or with unexpected word
- Specific number: "I've done X 247 times. Here's what I learned."
- Challenge: "You're probably doing X wrong"

### BODY (The Substance)

Must deliver on the hook's promise:
- Specific, not generic
- Examples over theory
- Show don't tell
- One idea per paragraph
- Rhythm variety (short punches + longer explanations)

### ENDINGS

Must satisfy one of:
- Clear takeaway (what to do)
- Thought-provoking question
- Strong final statement
- Call to action (if appropriate)

## Format-Specific Rules

### Single Post
- One complete idea
- Can stand alone
- No setup required
- Punchy rhythm preferred

### Thread
- Strong hook tweet (standalone valuable)
- Each tweet adds NEW value
- Don't pad with filler tweets
- Clear conclusion in final tweet
- Tweet 2-3 must keep momentum (this is where most threads lose readers)

### Carousel
- Slide 1: Hook that stops scroll (NOT just title)
- Each slide: ONE key point
- Visual hierarchy matters
- Final slide: Clear CTA or takeaway
- Don't just put paragraphs on slides

### Story Format
- Narrative arc required
- Specific details (names, places, numbers)
- Emotional resonance
- Clear lesson/takeaway
- Don't lecture - show the journey

## Self-Assessment

After generating content, assess:
1. Save-worthiness (0-100): Would people save this?
2. Voice match (0-100): Does this sound like the creator?
3. Risk level: Is this safe/balanced/bold?
4. Hook strength (0-100): Does this stop the scroll?

Be honest. 70+ on all is the minimum bar.
`;

/**
 * Build the complete content generation prompt.
 */
export function buildV2ContentPrompt(config: {
  voiceFingerprint?: VoiceFingerprint;
  riskLevel: RiskLevel;
  platform: "twitter" | "linkedin" | "instagram";
}): string {
  const sections: string[] = [V2_CONTENT_SYSTEM_PROMPT];

  // Add voice instructions
  if (config.voiceFingerprint) {
    const voicePrompt = generateVoicePrompt(config.voiceFingerprint);
    sections.push(`\n## Voice Requirements\n\n${voicePrompt.full}`);
  }

  // Add risk level
  sections.push(`\n## Risk Level: ${config.riskLevel.toUpperCase()}\n\n${getRiskPrompt(config.riskLevel)}`);

  // Add platform constraints
  const constraints = PLATFORM_CONSTRAINTS[config.platform];
  sections.push(`\n## Platform: ${config.platform.toUpperCase()}

Constraints:
${JSON.stringify(constraints, null, 2)}

Write specifically for this platform's culture and constraints.`);

  return sections.join("\n");
}

/**
 * Build the user prompt for content generation.
 */
export function buildV2ContentUserPrompt(config: {
  idea: ContentIdea;
  additionalContext?: string;
  existingDrafts?: string[];
}): string {
  const sections: string[] = [];

  // The idea to execute
  sections.push(`## Content Idea to Execute

**Angle**: ${config.idea.angle}
**Why Interesting**: ${config.idea.whyInteresting}
**Format**: ${config.idea.format}
**Platform**: ${config.idea.platform}
**Target Risk Level**: ${config.idea.riskLevel}

**Suggested Hook**: ${config.idea.hook}
(You can improve this hook, but maintain the angle)

**Key Points to Cover**:
${config.idea.keyPoints.map((p) => `- ${p}`).join("\n")}

${config.idea.potentialPushback ? `**Potential Pushback**: ${config.idea.potentialPushback}\n(Acknowledge or preempt if appropriate)` : ""}`);

  // Additional context
  if (config.additionalContext) {
    sections.push(`## Additional Context\n\n${config.additionalContext}`);
  }

  // Avoid existing drafts
  if (config.existingDrafts && config.existingDrafts.length > 0) {
    sections.push(`## Previous Drafts (Don't Repeat)

${config.existingDrafts.map((d, i) => `Draft ${i + 1}:\n${d}`).join("\n\n")}

Create something distinctly different from the above.`);
  }

  // Output format
  sections.push(`---

## Output Format

Generate the content and return as JSON:

{
  "platform": "${config.idea.platform}",
  "format": "${config.idea.format}",
  "copy": {
    "type": "${config.idea.format}",
    // For single: { "text": "..." }
    // For thread: { "tweets": ["...", "..."] }
    // For carousel: { "slides": [{ "headline": "...", "body": "..." }] }
    // For story: { "frames": [{ "text": "..." }] }
  },
  "hashtags": ["if", "applicable"],
  "ctaType": "question|action|statement|none",
  "selfAssessment": {
    "saveWorthiness": 0-100,
    "voiceMatch": 0-100,
    "riskLevel": "safe|balanced|bold",
    "hookStrength": 0-100
  }
}

Now generate the content.`);

  return sections.join("\n\n");
}

/**
 * Validate generated content meets v2 standards.
 */
export function validateContent(content: GeneratedContent): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check self-assessment scores
  if (content.selfAssessment.saveWorthiness < 70) {
    issues.push(`Save-worthiness too low: ${content.selfAssessment.saveWorthiness}/100`);
  }
  if (content.selfAssessment.voiceMatch < 70) {
    warnings.push(`Voice match could be better: ${content.selfAssessment.voiceMatch}/100`);
  }
  if (content.selfAssessment.hookStrength < 70) {
    issues.push(`Hook needs work: ${content.selfAssessment.hookStrength}/100`);
  }

  // Check platform constraints
  if (content.copy.type === "single") {
    const text = (content.copy as SinglePostCopy).text;
    if (content.platform === "twitter") {
      const twitterConstraints = PLATFORM_CONSTRAINTS.twitter;
      if (text.length > twitterConstraints.singleMax) {
        issues.push(`Twitter post too long: ${text.length}/${twitterConstraints.singleMax}`);
      }
    }
  }

  if (content.copy.type === "thread") {
    const tweets = (content.copy as ThreadCopy).tweets;
    const twitterConstraints = PLATFORM_CONSTRAINTS.twitter;
    for (let i = 0; i < tweets.length; i++) {
      if (tweets[i].length > twitterConstraints.threadTweetMax) {
        issues.push(`Tweet ${i + 1} too long: ${tweets[i].length}/280`);
      }
    }
    if (tweets.length > twitterConstraints.maxThreadLength) {
      warnings.push(`Thread very long: ${tweets.length} tweets`);
    }
  }

  if (content.copy.type === "carousel") {
    const slides = (content.copy as CarouselCopy).slides;
    const igConstraints = PLATFORM_CONSTRAINTS.instagram;
    if (slides.length < igConstraints.carouselSlides.min) {
      issues.push(`Not enough slides: ${slides.length}/${igConstraints.carouselSlides.min} minimum`);
    }
    if (slides.length > igConstraints.carouselSlides.max) {
      issues.push(`Too many slides: ${slides.length}/${igConstraints.carouselSlides.max} maximum`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Quick content polish - minor improvements without regeneration.
 */
export const CONTENT_POLISH_PROMPT = `
## Content Polish

Review this content and make MINOR improvements only:
- Fix any AI-tell words (delve, leverage, etc.)
- Improve sentence rhythm variety if monotonous
- Strengthen weak words (very, really, just, actually)
- Ensure hook delivers on promise

DO NOT:
- Change the core message
- Rewrite significantly
- Add new ideas
- Change the voice

Return the polished version with a list of changes made.
`;
