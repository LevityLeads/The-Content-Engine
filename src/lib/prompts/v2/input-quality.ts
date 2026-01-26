/**
 * Input Quality Assessment Module
 *
 * Evaluates input richness to determine if we can create
 * distinctive content or need to trigger research mode.
 *
 * Quality dimensions:
 * 1. Specificity - concrete details vs vague generalities
 * 2. Uniqueness - novel angle vs common knowledge
 * 3. Depth - rich context vs surface-level
 * 4. Actionability - clear direction vs ambiguous intent
 */

/**
 * Input quality assessment result.
 */
export interface InputQualityAssessment {
  /** Overall quality score (0-100) */
  score: number;
  /** Quality tier */
  tier: "rich" | "adequate" | "thin" | "unusable";
  /** Individual dimension scores */
  dimensions: {
    specificity: number;
    uniqueness: number;
    depth: number;
    actionability: number;
  };
  /** What's missing from the input */
  gaps: string[];
  /** Suggested questions to enrich the input */
  enrichmentQuestions: string[];
  /** Whether research mode should be triggered */
  needsResearch: boolean;
  /** If thin, what type of research would help */
  researchSuggestions?: string[];
}

/**
 * Quality tier thresholds.
 */
export const QUALITY_THRESHOLDS = {
  rich: 75, // Can create distinctive content directly
  adequate: 50, // Can create decent content, research optional
  thin: 25, // Needs research to add substance
  unusable: 0, // Can't work with this, need user input
};

/**
 * Signals of rich input.
 */
export const RICH_INPUT_SIGNALS = [
  "Specific numbers or data points",
  "Named examples or case studies",
  "Personal experience or story",
  "Contrarian or novel angle",
  "Clear problem/solution pairing",
  "Specific audience mentioned",
  "Unique insight or observation",
  "Concrete takeaways specified",
];

/**
 * Signals of thin input.
 */
export const THIN_INPUT_SIGNALS = [
  "Generic topic with no angle",
  "Common knowledge only",
  "No specific examples",
  "Vague or abstract language",
  "No clear audience",
  "Missing context or background",
  "No unique perspective",
  "Just a keyword or phrase",
];

/**
 * Prompt for AI to assess input quality.
 */
export const INPUT_QUALITY_ASSESSMENT_PROMPT = `
## Input Quality Assessment

Analyze the provided input for content creation potential.

ASSESSMENT DIMENSIONS (score each 0-100):

1. SPECIFICITY (0-100)
   - 0-25: Just a topic ("marketing tips")
   - 25-50: Topic with basic angle ("why email marketing works")
   - 50-75: Topic with specific claim ("email marketing has 4x ROI vs social")
   - 75-100: Topic with specific data/example/story backing the claim

2. UNIQUENESS (0-100)
   - 0-25: Common knowledge anyone could write
   - 25-50: Slight twist on common topic
   - 50-75: Interesting angle most wouldn't think of
   - 75-100: Genuinely novel insight or contrarian take

3. DEPTH (0-100)
   - 0-25: Surface-level, no supporting detail
   - 25-50: Some context but thin
   - 50-75: Good context, could use more specifics
   - 75-100: Rich context, multiple layers, examples included

4. ACTIONABILITY (0-100)
   - 0-25: No clear direction for content
   - 25-50: General direction but vague
   - 50-75: Clear direction, some details missing
   - 75-100: Clear format, angle, and takeaways specified

TIER DETERMINATION:
- Rich (75+): Input has enough to create distinctive content
- Adequate (50-74): Workable but would benefit from enrichment
- Thin (25-49): Too generic, needs research mode
- Unusable (<25): Can't create quality content, need user input

OUTPUT FORMAT:
{
  "score": <overall score 0-100>,
  "tier": "rich|adequate|thin|unusable",
  "dimensions": {
    "specificity": <0-100>,
    "uniqueness": <0-100>,
    "depth": <0-100>,
    "actionability": <0-100>
  },
  "gaps": ["what's missing"],
  "enrichmentQuestions": ["questions that would improve the input"],
  "needsResearch": true|false,
  "researchSuggestions": ["what to research if thin"]
}
`;

/**
 * Quick heuristic assessment (no AI needed).
 * Returns a rough estimate useful for triggering deeper analysis.
 */
export function quickAssess(input: string): {
  likelyTier: "rich" | "adequate" | "thin" | "unusable";
  signals: { rich: string[]; thin: string[] };
} {
  const text = input.toLowerCase();
  const wordCount = input.split(/\s+/).length;

  const richSignals: string[] = [];
  const thinSignals: string[] = [];

  // Check for numbers/data
  if (/\d+%|\d+x|\$\d+|\d+\s*(million|billion|k|thousand)/i.test(input)) {
    richSignals.push("Contains specific numbers/data");
  }

  // Check for personal experience markers
  if (/\b(i learned|i discovered|i realized|when i|my experience)\b/i.test(input)) {
    richSignals.push("Contains personal experience");
  }

  // Check for named examples
  if (/\b([A-Z][a-z]+ (Inc|Corp|Company|Co\.)|[A-Z]{2,})\b/.test(input)) {
    richSignals.push("Contains named examples");
  }

  // Check for contrarian markers
  if (/\b(actually|contrary|myth|wrong|mistake|stop|don't)\b/i.test(input)) {
    richSignals.push("Has contrarian angle");
  }

  // Check for thin signals
  if (wordCount < 10) {
    thinSignals.push("Very short input");
  }

  if (/^(how to|tips for|guide to|ways to)\s/i.test(input) && wordCount < 15) {
    thinSignals.push("Generic how-to format");
  }

  if (!input.includes(" ") || wordCount < 3) {
    thinSignals.push("Just a keyword/phrase");
  }

  // Common generic topics
  const genericTopics = [
    "productivity",
    "success",
    "leadership",
    "motivation",
    "mindset",
    "growth",
    "marketing",
    "sales",
  ];
  if (genericTopics.some((t) => text === t || text === `${t} tips`)) {
    thinSignals.push("Generic topic with no angle");
  }

  // Determine tier based on signals
  let likelyTier: "rich" | "adequate" | "thin" | "unusable";

  if (richSignals.length >= 3) {
    likelyTier = "rich";
  } else if (richSignals.length >= 1 && thinSignals.length === 0) {
    likelyTier = "adequate";
  } else if (thinSignals.length >= 2 || wordCount < 5) {
    likelyTier = wordCount < 3 ? "unusable" : "thin";
  } else {
    likelyTier = "adequate";
  }

  return {
    likelyTier,
    signals: { rich: richSignals, thin: thinSignals },
  };
}

/**
 * Generate enrichment questions based on what's missing.
 */
export function generateEnrichmentQuestions(
  input: string,
  gaps: string[]
): string[] {
  const questions: string[] = [];

  for (const gap of gaps) {
    switch (gap.toLowerCase()) {
      case "no specific examples":
        questions.push(
          "Can you share a specific example or case study that illustrates this?"
        );
        break;
      case "no personal experience":
        questions.push(
          "Do you have any personal experience with this you can share?"
        );
        break;
      case "missing data/numbers":
        questions.push("Do you have any data or numbers to support this?");
        break;
      case "vague audience":
        questions.push("Who specifically is this content for?");
        break;
      case "no unique angle":
        questions.push(
          "What's your take on this that others might disagree with?"
        );
        break;
      case "no clear takeaway":
        questions.push(
          "What's the one thing you want readers to do after reading this?"
        );
        break;
      default:
        questions.push(`Can you provide more details about: ${gap}?`);
    }
  }

  return questions.slice(0, 3); // Max 3 questions
}

/**
 * Determine if research mode should be triggered.
 */
export function shouldTriggerResearch(assessment: InputQualityAssessment): {
  trigger: boolean;
  reason: string;
  researchType: "angle" | "data" | "examples" | "context" | null;
} {
  if (assessment.tier === "unusable") {
    return {
      trigger: false,
      reason: "Input is too vague for even research mode. Need user input.",
      researchType: null,
    };
  }

  if (assessment.tier === "rich") {
    return {
      trigger: false,
      reason: "Input is rich enough to proceed directly.",
      researchType: null,
    };
  }

  if (assessment.tier === "thin") {
    // Determine what type of research would help most
    let researchType: "angle" | "data" | "examples" | "context" = "angle";
    let reason = "Input needs enrichment.";

    if (assessment.dimensions.uniqueness < 30) {
      researchType = "angle";
      reason = "Topic is generic, need to find a unique angle.";
    } else if (assessment.dimensions.specificity < 30) {
      researchType = "data";
      reason = "Claims need supporting data.";
    } else if (assessment.dimensions.depth < 30) {
      researchType = "examples";
      reason = "Need concrete examples to add depth.";
    } else {
      researchType = "context";
      reason = "Need more background context.";
    }

    return { trigger: true, reason, researchType };
  }

  // Adequate tier - research optional but could help
  if (assessment.score < 60) {
    return {
      trigger: true,
      reason: "Input is workable but research would improve output.",
      researchType: "angle",
    };
  }

  return {
    trigger: false,
    reason: "Input is adequate to proceed.",
    researchType: null,
  };
}

/**
 * Create the full assessment prompt with the input included.
 */
export function createAssessmentPrompt(input: string): string {
  return `${INPUT_QUALITY_ASSESSMENT_PROMPT}

## Input to Assess

${input}

---

Now assess this input and return the JSON result.`;
}
