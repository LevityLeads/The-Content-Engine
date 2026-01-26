/**
 * Research Mode Module
 *
 * When input is thin, research mode attempts to find unique angles,
 * supporting data, and examples to enrich the content.
 *
 * This prevents the AI from generating generic content that anyone
 * could have written.
 */

/**
 * Research output structure.
 */
export interface ResearchResult {
  /** The original thin input */
  originalInput: string;
  /** Enriched version of the input */
  enrichedInput: string;
  /** Unique angles discovered */
  angles: ResearchAngle[];
  /** Supporting data points found */
  dataPoints: DataPoint[];
  /** Examples/case studies found */
  examples: Example[];
  /** Contrarian takes discovered */
  contrarianTakes: string[];
  /** Research quality score */
  qualityScore: number;
  /** Whether this research is sufficient to proceed */
  sufficientForContent: boolean;
}

/**
 * A unique angle on the topic.
 */
export interface ResearchAngle {
  /** The angle/perspective */
  angle: string;
  /** Why this angle is interesting/unique */
  whyUnique: string;
  /** Potential hook using this angle */
  hookPotential: string;
  /** Confidence in this angle (0-1) */
  confidence: number;
}

/**
 * A data point to support claims.
 */
export interface DataPoint {
  /** The statistic or data */
  data: string;
  /** Source (if known) */
  source?: string;
  /** How recent this data is */
  recency?: "current" | "recent" | "dated" | "unknown";
  /** How to use this in content */
  usage: string;
}

/**
 * An example or case study.
 */
export interface Example {
  /** Brief description */
  description: string;
  /** Why this example is compelling */
  whyCompelling: string;
  /** How to use in content */
  usage: string;
}

/**
 * Research type based on what the input is missing.
 */
export type ResearchType = "angle" | "data" | "examples" | "context" | "all";

/**
 * Research mode system prompt.
 */
export const RESEARCH_MODE_SYSTEM_PROMPT = `
## Research Mode

You are in RESEARCH MODE. Your job is to enrich thin input before content creation.

The input provided lacks substance for distinctive content. Your task:
1. Find unique angles that most creators wouldn't think of
2. Discover supporting data or statistics
3. Identify compelling examples or case studies
4. Surface contrarian perspectives

RESEARCH PRINCIPLES:

1. SEEK THE NON-OBVIOUS
   - What's the angle that makes someone stop scrolling?
   - What's the take that's true but rarely said?
   - What's the connection others haven't made?

2. FIND THE SPECIFIC
   - Generic: "Email marketing is effective"
   - Specific: "Emails sent Tuesday 10am get 23% higher open rates"

3. HUNT FOR STORIES
   - What company did this well?
   - What person exemplifies this?
   - What failure teaches this lesson?

4. CHALLENGE ASSUMPTIONS
   - What do people believe that's wrong?
   - What counterintuitive truth exists here?
   - What's the "actually..." take?

RESEARCH QUALITY STANDARDS:
- At least 2 unique angles that aren't obvious
- At least 1 specific data point (with context)
- At least 1 compelling example or story
- At least 1 contrarian take worth considering
`;

/**
 * Prompt for angle discovery research.
 */
export const ANGLE_RESEARCH_PROMPT = `
${RESEARCH_MODE_SYSTEM_PROMPT}

## Research Task: Find Unique Angles

For the given topic, find 3-5 angles that would make content distinctive:

ANGLE CRITERIA:
1. Not the first thing everyone thinks of
2. Has a "that's interesting" quality
3. Can be supported with reasoning or evidence
4. Creates tension or challenges assumptions
5. Would make someone want to read/save

ANGLE TYPES TO CONSIDER:
- The "actually..." angle (common belief is wrong)
- The "nobody talks about..." angle (overlooked aspect)
- The "here's what changed..." angle (recent shift)
- The "I learned the hard way..." angle (costly lesson)
- The "data shows..." angle (counterintuitive finding)
- The "the real reason..." angle (hidden truth)
- The "stop doing X, start doing Y" angle (specific swap)

OUTPUT: For each angle, provide:
- The angle itself (one sentence)
- Why it's unique (what makes it stand out)
- Hook potential (how this could open a post)
- Confidence (0-1, how strong is this angle)
`;

/**
 * Prompt for data discovery research.
 */
export const DATA_RESEARCH_PROMPT = `
${RESEARCH_MODE_SYSTEM_PROMPT}

## Research Task: Find Supporting Data

For the given topic, find data points that add credibility and specificity:

DATA CRITERIA:
1. Specific numbers (not vague "studies show")
2. Recent if possible (dated data undermines credibility)
3. Surprising or counterintuitive if available
4. From credible sources
5. Easy to verify

DATA TYPES TO FIND:
- Statistics with specific percentages
- Before/after comparisons
- Industry benchmarks
- Survey results
- Growth/decline rates
- Cost/ROI figures
- Time-based metrics

OUTPUT: For each data point, provide:
- The specific data
- Source (if known)
- Recency (current/recent/dated/unknown)
- How to use it in content
`;

/**
 * Prompt for example discovery research.
 */
export const EXAMPLE_RESEARCH_PROMPT = `
${RESEARCH_MODE_SYSTEM_PROMPT}

## Research Task: Find Compelling Examples

For the given topic, find examples that make concepts concrete:

EXAMPLE CRITERIA:
1. Specific and named (not "one company...")
2. Memorable and shareable
3. Illustrates the point clearly
4. Relatively well-known or easy to verify
5. Has a clear lesson

EXAMPLE TYPES TO FIND:
- Company case studies (success or failure)
- Public figures who exemplify the concept
- Historical parallels
- Personal stories (if provided in input)
- Industry-specific examples
- Contrasting examples (what works vs. what doesn't)

OUTPUT: For each example, provide:
- Brief description
- Why it's compelling
- How to use in content
`;

/**
 * Prompt for contrarian research.
 */
export const CONTRARIAN_RESEARCH_PROMPT = `
${RESEARCH_MODE_SYSTEM_PROMPT}

## Research Task: Find Contrarian Takes

For the given topic, find perspectives that challenge conventional wisdom:

CONTRARIAN CRITERIA:
1. Actually true or defensible (not contrarian for shock value)
2. Challenges a widely-held belief
3. Can be supported with evidence or logic
4. Provocative but not offensive
5. Adds genuine value to the conversation

CONTRARIAN TYPES:
- "The opposite is true..." (inversion)
- "This popular advice is wrong because..." (debunking)
- "Everyone's focused on X but Y matters more..." (reframing)
- "This worked 5 years ago but now..." (evolution)
- "The uncomfortable truth is..." (hard truth)

OUTPUT: List 2-4 contrarian takes with brief justification.
`;

/**
 * Generate research prompt based on what's needed.
 */
export function generateResearchPrompt(
  input: string,
  researchType: ResearchType
): string {
  let prompt = "";

  switch (researchType) {
    case "angle":
      prompt = ANGLE_RESEARCH_PROMPT;
      break;
    case "data":
      prompt = DATA_RESEARCH_PROMPT;
      break;
    case "examples":
      prompt = EXAMPLE_RESEARCH_PROMPT;
      break;
    case "context":
      prompt = RESEARCH_MODE_SYSTEM_PROMPT + "\n\n## Research Task: Build Context\n\nProvide background context, history, and current state of this topic.";
      break;
    case "all":
      prompt = `${RESEARCH_MODE_SYSTEM_PROMPT}

## Research Task: Full Enrichment

Perform comprehensive research on this thin input:
1. Find 3 unique angles
2. Find 2-3 supporting data points
3. Find 2 compelling examples
4. Surface 1-2 contrarian takes

OUTPUT as JSON:
{
  "enrichedInput": "a richer version of the original input with specifics",
  "angles": [
    {
      "angle": "the angle",
      "whyUnique": "what makes it stand out",
      "hookPotential": "how this could open a post",
      "confidence": 0.0-1.0
    }
  ],
  "dataPoints": [
    {
      "data": "specific statistic",
      "source": "source if known",
      "recency": "current|recent|dated|unknown",
      "usage": "how to use in content"
    }
  ],
  "examples": [
    {
      "description": "brief description",
      "whyCompelling": "why it works",
      "usage": "how to use"
    }
  ],
  "contrarianTakes": ["take 1", "take 2"],
  "qualityScore": 0-100,
  "sufficientForContent": true|false
}`;
      break;
  }

  return `${prompt}

## Input to Research

${input}

---

Now research this input and provide your findings.`;
}

/**
 * Check if research result is sufficient for content creation.
 */
export function isResearchSufficient(result: ResearchResult): {
  sufficient: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  // Need at least one strong angle
  const strongAngles = result.angles.filter((a) => a.confidence >= 0.7);
  if (strongAngles.length === 0) {
    missing.push("No strong unique angle found");
  }

  // Need at least some specificity (data or examples)
  if (result.dataPoints.length === 0 && result.examples.length === 0) {
    missing.push("No supporting data or examples");
  }

  // Need the enriched input to be substantially different
  if (
    result.enrichedInput.length < result.originalInput.length * 1.5 ||
    result.enrichedInput === result.originalInput
  ) {
    missing.push("Enriched input not substantially improved");
  }

  return {
    sufficient: missing.length === 0,
    missing,
  };
}

/**
 * Combine original input with research for content generation.
 */
export function combineInputWithResearch(
  originalInput: string,
  research: ResearchResult
): string {
  const sections: string[] = [];

  sections.push(`## Original Input\n${originalInput}`);

  if (research.enrichedInput && research.enrichedInput !== originalInput) {
    sections.push(`## Enriched Context\n${research.enrichedInput}`);
  }

  if (research.angles.length > 0) {
    const angleText = research.angles
      .filter((a) => a.confidence >= 0.6)
      .map((a) => `- ${a.angle} (${a.whyUnique})`)
      .join("\n");
    if (angleText) {
      sections.push(`## Unique Angles to Consider\n${angleText}`);
    }
  }

  if (research.dataPoints.length > 0) {
    const dataText = research.dataPoints
      .map((d) => `- ${d.data}${d.source ? ` (${d.source})` : ""}`)
      .join("\n");
    sections.push(`## Supporting Data\n${dataText}`);
  }

  if (research.examples.length > 0) {
    const exampleText = research.examples
      .map((e) => `- ${e.description}: ${e.whyCompelling}`)
      .join("\n");
    sections.push(`## Examples to Use\n${exampleText}`);
  }

  if (research.contrarianTakes.length > 0) {
    sections.push(
      `## Contrarian Angles\n${research.contrarianTakes.map((t) => `- ${t}`).join("\n")}`
    );
  }

  return sections.join("\n\n");
}

/**
 * Instructions to include in content generation when research was used.
 */
export const RESEARCH_INTEGRATION_PROMPT = `
## Research Mode Active

This content is being created from enriched thin input. Follow these rules:

1. USE THE RESEARCH
   - Incorporate the specific angles discovered
   - Include data points where they strengthen the message
   - Reference examples to make points concrete

2. DON'T BE OBVIOUS
   - The research found unique angles - use them
   - Don't default to the generic take
   - Make this content something only you could write

3. CITE SPECIFICS
   - When using data, be specific
   - When using examples, name them
   - Specificity is what makes this valuable

4. STAY TRUE TO VOICE
   - Research adds substance, but voice stays consistent
   - Don't let research make you sound like a Wikipedia article
`;
