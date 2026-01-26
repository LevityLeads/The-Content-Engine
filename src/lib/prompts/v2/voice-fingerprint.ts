/**
 * Voice Fingerprint Module
 *
 * Defines the data structure for capturing a creator's unique voice.
 * Unlike adjective-based configuration ("professional", "friendly"),
 * fingerprints capture measurable patterns that can be replicated.
 *
 * A fingerprint is discovered, not configured.
 */

/**
 * The complete voice fingerprint for a creator.
 * Each field is measurable and extractable from writing samples.
 */
export interface VoiceFingerprint {
  /**
   * Rhythm patterns - how sentences flow
   */
  rhythm: {
    /** Average words per sentence (human range: 8-20) */
    avgSentenceLength: number;
    /** Ratio of short punches (<6 words) to total sentences */
    shortPunchFrequency: number;
    /** Uses intentional fragments ("Not perfect. But real.") */
    usesFragments: boolean;
    /** Uses em-dashes for emphasis or asides */
    usesEmDashes: boolean;
    /** Uses parenthetical asides */
    usesParentheticals: boolean;
  };

  /**
   * Signature patterns - recognizable phrases and structures
   */
  signatures: {
    /** Phrases they return to ("Here's the thing", "The truth is") */
    phrases: string[];
    /** How they typically start posts/paragraphs */
    openings: string[];
    /** Transition patterns between ideas */
    transitions: string[];
    /** How they end posts (CTA style, question, statement) */
    closings: string[];
  };

  /**
   * Anti-patterns - what they would NEVER say
   * Often more defining than what they would say
   */
  antiPatterns: {
    /** Words/phrases they avoid (personal preference) */
    neverUse: string[];
    /** Tones/styles they'd never adopt */
    neverSoundLike: string[];
    /** Topics they avoid or consider off-brand */
    avoidTopics: string[];
  };

  /**
   * Perspective - their worldview and stance
   */
  perspective: {
    /** Core beliefs they consistently express */
    believes: string[];
    /** What they push back against */
    fightsAgainst: string[];
    /** How they relate to their audience */
    readerRelationship: "peer" | "mentor" | "provocateur" | "guide" | "insider";
    /** Their general outlook */
    tone: "optimistic" | "realistic" | "contrarian" | "supportive" | "challenging";
  };

  /**
   * Quirks - the imperfections that make voice human
   * AI content lacks these; humans have them naturally
   */
  quirks: {
    /** Starts sentences with "And" or "But" */
    startsSentencesWithConjunctions: boolean;
    /** Uses one-word sentences for emphasis */
    usesOneWordSentences: boolean;
    /** Specific grammar rules they break intentionally */
    breaksGrammarRules: string[];
    /** Formatting preferences (bullet style, capitalization) */
    formattingPreferences: string[];
    /** Unusual punctuation habits */
    punctuationQuirks: string[];
  };

  /**
   * Metadata about the fingerprint
   */
  meta: {
    /** How the fingerprint was created */
    source: "interview" | "extraction" | "hybrid";
    /** Number of samples analyzed (if extraction) */
    sampleCount?: number;
    /** When the fingerprint was created/updated */
    createdAt: string;
    /** Confidence in the fingerprint (0-1) */
    confidence: number;
  };
}

/**
 * A simpler voice DNA for quick voice matching.
 * Used for lightweight comparisons and initial analysis.
 */
export interface VoiceDNA {
  /** Primary voice characteristics (3-5 key traits) */
  primaryTraits: string[];
  /** What makes this voice distinctive in one sentence */
  distinctiveElement: string;
  /** The "what would they never say" quick check */
  dealbreakers: string[];
  /** Quick rhythm check: "punchy" | "flowing" | "mixed" */
  rhythmStyle: "punchy" | "flowing" | "mixed";
}

/**
 * Default empty fingerprint for initialization.
 */
export const EMPTY_FINGERPRINT: VoiceFingerprint = {
  rhythm: {
    avgSentenceLength: 12,
    shortPunchFrequency: 0.2,
    usesFragments: false,
    usesEmDashes: false,
    usesParentheticals: false,
  },
  signatures: {
    phrases: [],
    openings: [],
    transitions: [],
    closings: [],
  },
  antiPatterns: {
    neverUse: [],
    neverSoundLike: [],
    avoidTopics: [],
  },
  perspective: {
    believes: [],
    fightsAgainst: [],
    readerRelationship: "peer",
    tone: "realistic",
  },
  quirks: {
    startsSentencesWithConjunctions: false,
    usesOneWordSentences: false,
    breaksGrammarRules: [],
    formattingPreferences: [],
    punctuationQuirks: [],
  },
  meta: {
    source: "interview",
    createdAt: new Date().toISOString(),
    confidence: 0,
  },
};

/**
 * Validate a fingerprint has minimum required data.
 */
export function isValidFingerprint(fp: VoiceFingerprint): boolean {
  // Must have at least some perspective defined
  const hasPerspective =
    fp.perspective.believes.length > 0 ||
    fp.perspective.fightsAgainst.length > 0;

  // Must have at least some signature patterns
  const hasSignatures =
    fp.signatures.phrases.length > 0 || fp.signatures.openings.length > 0;

  // Must have at least one anti-pattern
  const hasAntiPatterns =
    fp.antiPatterns.neverUse.length > 0 ||
    fp.antiPatterns.neverSoundLike.length > 0;

  return hasPerspective && hasSignatures && hasAntiPatterns;
}

/**
 * Calculate fingerprint completeness score (0-100).
 */
export function getFingerprintCompleteness(fp: VoiceFingerprint): number {
  let score = 0;
  const maxScore = 100;

  // Rhythm (20 points)
  if (fp.rhythm.avgSentenceLength !== 12) score += 5; // Non-default
  if (fp.rhythm.shortPunchFrequency !== 0.2) score += 5;
  if (fp.rhythm.usesFragments) score += 3;
  if (fp.rhythm.usesEmDashes) score += 3;
  if (fp.rhythm.usesParentheticals) score += 4;

  // Signatures (25 points)
  score += Math.min(fp.signatures.phrases.length * 2, 8);
  score += Math.min(fp.signatures.openings.length * 2, 6);
  score += Math.min(fp.signatures.transitions.length * 2, 6);
  score += Math.min(fp.signatures.closings.length * 2, 5);

  // Anti-patterns (20 points) - very important for distinctiveness
  score += Math.min(fp.antiPatterns.neverUse.length * 2, 10);
  score += Math.min(fp.antiPatterns.neverSoundLike.length * 2, 6);
  score += Math.min(fp.antiPatterns.avoidTopics.length * 2, 4);

  // Perspective (20 points)
  score += Math.min(fp.perspective.believes.length * 2, 8);
  score += Math.min(fp.perspective.fightsAgainst.length * 2, 8);
  score += fp.perspective.readerRelationship !== "peer" ? 2 : 0;
  score += fp.perspective.tone !== "realistic" ? 2 : 0;

  // Quirks (15 points)
  if (fp.quirks.startsSentencesWithConjunctions) score += 3;
  if (fp.quirks.usesOneWordSentences) score += 3;
  score += Math.min(fp.quirks.breaksGrammarRules.length * 2, 4);
  score += Math.min(fp.quirks.formattingPreferences.length, 3);
  score += Math.min(fp.quirks.punctuationQuirks.length, 2);

  return Math.min(score, maxScore);
}

/**
 * Convert fingerprint to quick VoiceDNA summary.
 */
export function fingerprintToDNA(fp: VoiceFingerprint): VoiceDNA {
  const traits: string[] = [];

  // Add perspective traits
  if (fp.perspective.tone === "contrarian") traits.push("contrarian");
  if (fp.perspective.tone === "challenging") traits.push("challenging");
  if (fp.perspective.readerRelationship === "provocateur")
    traits.push("provocative");
  if (fp.perspective.readerRelationship === "mentor") traits.push("guiding");

  // Add rhythm traits
  if (fp.rhythm.shortPunchFrequency > 0.3) traits.push("punchy");
  if (fp.rhythm.usesFragments) traits.push("uses fragments");
  if (fp.rhythm.avgSentenceLength < 10) traits.push("concise");
  if (fp.rhythm.avgSentenceLength > 18) traits.push("elaborate");

  // Add quirk traits
  if (fp.quirks.usesOneWordSentences) traits.push("emphatic");
  if (fp.quirks.startsSentencesWithConjunctions) traits.push("conversational");

  // Determine rhythm style
  let rhythmStyle: "punchy" | "flowing" | "mixed" = "mixed";
  if (fp.rhythm.shortPunchFrequency > 0.35) rhythmStyle = "punchy";
  else if (fp.rhythm.avgSentenceLength > 16) rhythmStyle = "flowing";

  // Create distinctive element from top traits and signatures
  const distinctiveElement =
    fp.signatures.phrases.length > 0
      ? `Uses phrases like "${fp.signatures.phrases[0]}" with a ${fp.perspective.tone} tone`
      : `${fp.perspective.tone} voice that ${fp.perspective.fightsAgainst[0] ? `pushes back against ${fp.perspective.fightsAgainst[0]}` : "has clear convictions"}`;

  return {
    primaryTraits: traits.slice(0, 5),
    distinctiveElement,
    dealbreakers: fp.antiPatterns.neverUse.slice(0, 3),
    rhythmStyle,
  };
}
