/**
 * Voice Extraction Module
 *
 * Analyzes writing samples to extract a voice fingerprint.
 * This is the "discovery from examples" path.
 *
 * The extraction looks for:
 * 1. Measurable patterns (sentence length, punctuation)
 * 2. Recurring phrases and structures
 * 3. Topics and stances
 * 4. What's notably absent (anti-patterns)
 */

import type { VoiceFingerprint } from "./voice-fingerprint";

/**
 * A writing sample for analysis.
 */
export interface WritingSample {
  /** The text content */
  text: string;
  /** Platform it was written for (affects expected patterns) */
  platform?: "twitter" | "linkedin" | "instagram" | "blog" | "other";
  /** How well this represents their voice (1-5) */
  representativeness?: number;
  /** When it was written (recent samples weighted higher) */
  date?: string;
}

/**
 * Results from analyzing a single sample.
 */
export interface SampleAnalysis {
  /** Sentence count */
  sentenceCount: number;
  /** Average words per sentence */
  avgSentenceLength: number;
  /** Ratio of short sentences (<6 words) */
  shortSentenceRatio: number;
  /** Found sentence fragments */
  fragments: string[];
  /** Uses em-dashes */
  hasEmDashes: boolean;
  /** Uses parentheticals */
  hasParentheticals: boolean;
  /** Potential signature phrases (repeated or distinctive) */
  potentialPhrases: string[];
  /** Opening pattern */
  openingStyle: string;
  /** Closing pattern */
  closingStyle: string;
  /** One-word sentences found */
  oneWordSentences: string[];
  /** Sentences starting with And/But */
  conjunctionStarts: string[];
  /** Questions used */
  questionsUsed: number;
  /** Exclamations used */
  exclamationsUsed: number;
}

/**
 * Analyze a single writing sample for voice patterns.
 */
export function analyzeSample(sample: WritingSample): SampleAnalysis {
  const text = sample.text.trim();

  // Split into sentences (handle various punctuation)
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentenceCount = sentences.length;

  // Calculate sentence lengths
  const sentenceLengths = sentences.map(
    (s) => s.split(/\s+/).filter((w) => w.length > 0).length
  );
  const avgSentenceLength =
    sentenceLengths.length > 0
      ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
      : 0;

  // Short sentence ratio
  const shortSentences = sentenceLengths.filter((len) => len < 6);
  const shortSentenceRatio =
    sentenceLengths.length > 0
      ? shortSentences.length / sentenceLengths.length
      : 0;

  // Find fragments (sentences without a verb - simplified detection)
  const fragments = sentences.filter((s) => {
    const words = s.split(/\s+/);
    // Very short "sentences" that end with period are likely fragments
    return words.length <= 3 && s.endsWith(".");
  });

  // Punctuation patterns
  const hasEmDashes = text.includes("—") || text.includes(" - ");
  const hasParentheticals = text.includes("(") && text.includes(")");

  // One-word sentences
  const oneWordSentences = sentences.filter((s) => {
    const words = s.replace(/[.!?]$/, "").split(/\s+/);
    return words.length === 1;
  });

  // Sentences starting with conjunctions
  const conjunctionStarts = sentences.filter((s) =>
    /^(And|But|Or|So|Yet)\s/i.test(s)
  );

  // Questions and exclamations
  const questionsUsed = sentences.filter((s) => s.endsWith("?")).length;
  const exclamationsUsed = sentences.filter((s) => s.endsWith("!")).length;

  // Opening style (first sentence pattern)
  const firstSentence = sentences[0] || "";
  let openingStyle = "statement";
  if (firstSentence.endsWith("?")) openingStyle = "question";
  else if (firstSentence.endsWith("!")) openingStyle = "exclamation";
  else if (/^(I |My |We )/.test(firstSentence)) openingStyle = "personal";
  else if (/^(You |Your )/.test(firstSentence)) openingStyle = "direct-address";
  else if (firstSentence.split(/\s+/).length <= 4) openingStyle = "punchy";

  // Closing style (last sentence pattern)
  const lastSentence = sentences[sentences.length - 1] || "";
  let closingStyle = "statement";
  if (lastSentence.endsWith("?")) closingStyle = "question";
  else if (lastSentence.endsWith("!")) closingStyle = "call-to-action";
  else if (/\.$/.test(lastSentence) && lastSentence.split(/\s+/).length <= 5)
    closingStyle = "punchy-close";

  // Look for potential signature phrases (3-5 word patterns)
  const potentialPhrases: string[] = [];
  const phrasePattern = /\b(\w+\s+\w+\s+\w+(?:\s+\w+)?(?:\s+\w+)?)[,.!?]/g;
  let match;
  while ((match = phrasePattern.exec(text)) !== null) {
    const phrase = match[1].toLowerCase();
    // Skip common phrases
    if (
      !phrase.match(
        /^(this is a|that is a|it is a|there is a|i think that|you need to)/
      )
    ) {
      potentialPhrases.push(phrase);
    }
  }

  return {
    sentenceCount,
    avgSentenceLength,
    shortSentenceRatio,
    fragments,
    hasEmDashes,
    hasParentheticals,
    potentialPhrases,
    openingStyle,
    closingStyle,
    oneWordSentences,
    conjunctionStarts,
    questionsUsed,
    exclamationsUsed,
  };
}

/**
 * Aggregate multiple sample analyses into patterns.
 */
export function aggregateAnalyses(
  analyses: SampleAnalysis[]
): Partial<VoiceFingerprint> {
  if (analyses.length === 0) {
    return {};
  }

  // Average rhythm metrics
  const avgLength =
    analyses.reduce((sum, a) => sum + a.avgSentenceLength, 0) / analyses.length;
  const avgShortRatio =
    analyses.reduce((sum, a) => sum + a.shortSentenceRatio, 0) / analyses.length;

  // Count pattern occurrences
  const emDashCount = analyses.filter((a) => a.hasEmDashes).length;
  const parentheticalCount = analyses.filter((a) => a.hasParentheticals).length;
  const fragmentCount = analyses.filter((a) => a.fragments.length > 0).length;
  const oneWordCount = analyses.filter((a) => a.oneWordSentences.length > 0).length;
  const conjunctionCount = analyses.filter(
    (a) => a.conjunctionStarts.length > 0
  ).length;

  // Majority thresholds (>50% of samples)
  const majorityThreshold = analyses.length / 2;

  // Find recurring phrases across samples
  const phraseCounts = new Map<string, number>();
  for (const analysis of analyses) {
    for (const phrase of analysis.potentialPhrases) {
      phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
    }
  }
  const recurringPhrases = Array.from(phraseCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);

  // Most common opening style
  const openingCounts = new Map<string, number>();
  for (const analysis of analyses) {
    openingCounts.set(
      analysis.openingStyle,
      (openingCounts.get(analysis.openingStyle) || 0) + 1
    );
  }
  const primaryOpening = Array.from(openingCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  // Most common closing style
  const closingCounts = new Map<string, number>();
  for (const analysis of analyses) {
    closingCounts.set(
      analysis.closingStyle,
      (closingCounts.get(analysis.closingStyle) || 0) + 1
    );
  }
  const primaryClosing = Array.from(closingCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  return {
    rhythm: {
      avgSentenceLength: Math.round(avgLength * 10) / 10,
      shortPunchFrequency: Math.round(avgShortRatio * 100) / 100,
      usesFragments: fragmentCount > majorityThreshold,
      usesEmDashes: emDashCount > majorityThreshold,
      usesParentheticals: parentheticalCount > majorityThreshold,
    },
    signatures: {
      phrases: recurringPhrases,
      openings: primaryOpening ? [primaryOpening] : [],
      transitions: [], // Hard to extract without AI
      closings: primaryClosing ? [primaryClosing] : [],
    },
    quirks: {
      startsSentencesWithConjunctions: conjunctionCount > majorityThreshold,
      usesOneWordSentences: oneWordCount > majorityThreshold,
      breaksGrammarRules: [],
      formattingPreferences: [],
      punctuationQuirks: [],
    },
    meta: {
      source: "extraction",
      sampleCount: analyses.length,
      createdAt: new Date().toISOString(),
      confidence: Math.min(0.4 + analyses.length * 0.1, 0.9), // More samples = higher confidence
    },
  };
}

/**
 * Prompt for AI-powered deep voice extraction.
 * Used when we want Claude to analyze samples more deeply than rule-based extraction.
 */
export const VOICE_EXTRACTION_PROMPT = `
## Voice Extraction Analysis

Analyze the following writing samples to extract a voice fingerprint.

WHAT TO LOOK FOR:

1. RHYTHM PATTERNS
   - Average sentence length (count words per sentence)
   - Frequency of short punchy sentences (<6 words)
   - Use of fragments ("Not this. Not that. This.")
   - Em-dash usage for asides or emphasis
   - Parenthetical comments

2. SIGNATURE PATTERNS
   - Phrases that appear multiple times or feel distinctive
   - How they typically start posts/paragraphs
   - Transition patterns between ideas
   - How they close (CTA, question, statement)

3. ANTI-PATTERNS (what's notably ABSENT)
   - Common words they seem to avoid
   - Styles or tones they never use
   - Types of content they don't create

4. PERSPECTIVE
   - Core beliefs expressed or implied
   - What they push back against
   - How they relate to reader (peer/mentor/provocateur/guide)
   - Overall tone (optimistic/realistic/contrarian/supportive/challenging)

5. QUIRKS
   - Starting sentences with And/But
   - One-word sentences for emphasis
   - Grammar rules they break
   - Formatting preferences (bullets, caps, spacing)
   - Unusual punctuation

OUTPUT FORMAT:
Return a JSON object matching the VoiceFingerprint interface with your findings.
For each field, explain your evidence in a "reasoning" field.

Example:
{
  "rhythm": {
    "avgSentenceLength": 11,
    "shortPunchFrequency": 0.3,
    "usesFragments": true,
    "usesEmDashes": true,
    "usesParentheticals": false,
    "_reasoning": "Analyzed 47 sentences. Mean length 11.2 words. 14 sentences under 6 words (30%). Found 6 intentional fragments. 8 em-dashes found."
  },
  // ... other sections
}

IMPORTANT:
- Be specific with examples from the text
- Don't invent patterns that aren't clearly present
- Note confidence level based on sample consistency
- If samples are inconsistent, note which patterns are most reliable
`;

/**
 * Generate extraction prompt with samples included.
 */
export function generateExtractionPrompt(samples: WritingSample[]): string {
  const samplesText = samples
    .map(
      (s, i) =>
        `### Sample ${i + 1}${s.platform ? ` (${s.platform})` : ""}\n${s.text}`
    )
    .join("\n\n");

  return `${VOICE_EXTRACTION_PROMPT}

## Writing Samples to Analyze

${samplesText}

---

Now analyze these samples and extract the voice fingerprint.`;
}

/**
 * Minimum samples needed for reliable extraction.
 */
export const MIN_SAMPLES_FOR_EXTRACTION = 3;

/**
 * Ideal number of samples for best results.
 */
export const IDEAL_SAMPLE_COUNT = 7;

/**
 * Check if we have enough samples for extraction.
 */
export function hasEnoughSamples(samples: WritingSample[]): {
  canExtract: boolean;
  confidence: "low" | "medium" | "high";
  message: string;
} {
  const count = samples.length;
  const totalWords = samples.reduce(
    (sum, s) => sum + s.text.split(/\s+/).length,
    0
  );

  if (count < MIN_SAMPLES_FOR_EXTRACTION) {
    return {
      canExtract: false,
      confidence: "low",
      message: `Need at least ${MIN_SAMPLES_FOR_EXTRACTION} samples. You have ${count}.`,
    };
  }

  if (totalWords < 500) {
    return {
      canExtract: false,
      confidence: "low",
      message: `Samples too short. Need at least 500 total words. You have ~${totalWords}.`,
    };
  }

  if (count >= IDEAL_SAMPLE_COUNT && totalWords >= 1500) {
    return {
      canExtract: true,
      confidence: "high",
      message: `Excellent! ${count} samples with ~${totalWords} words is ideal for extraction.`,
    };
  }

  if (count >= MIN_SAMPLES_FOR_EXTRACTION) {
    return {
      canExtract: true,
      confidence: "medium",
      message: `${count} samples should work. More samples (${IDEAL_SAMPLE_COUNT}+) would improve accuracy.`,
    };
  }

  return {
    canExtract: false,
    confidence: "low",
    message: "Unable to determine sample sufficiency.",
  };
}
