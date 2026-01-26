/**
 * Voice Generation Module
 *
 * Converts a VoiceFingerprint into prompt instructions that
 * guide AI content generation to match that voice.
 *
 * This is where the fingerprint becomes actionable.
 */

import type { VoiceFingerprint, VoiceDNA } from "./voice-fingerprint";

/**
 * Generated voice prompt sections.
 */
export interface VoicePromptSections {
  /** Core voice identity section */
  identity: string;
  /** Writing rules and constraints */
  rules: string;
  /** Anti-patterns to avoid */
  avoid: string;
  /** Rhythm and style requirements */
  rhythm: string;
  /** Complete combined prompt */
  full: string;
}

/**
 * Generate the identity section of the voice prompt.
 */
function generateIdentitySection(fp: VoiceFingerprint): string {
  const lines: string[] = ["## Voice Identity"];

  // Reader relationship
  const relationshipDescriptions = {
    peer: "You're a peer who's figured some things out and is sharing openly",
    mentor: "You're a mentor who's been there and guides with experience",
    provocateur: "You're a provocateur who challenges assumptions and status quo",
    guide: "You're a guide who shows the path without being preachy",
    insider: "You're an insider sharing what you've learned from experience",
  };
  lines.push(
    `\nYou are writing as: ${relationshipDescriptions[fp.perspective.readerRelationship]}`
  );

  // Tone
  const toneDescriptions = {
    optimistic: "optimistic - focusing on possibilities and potential",
    realistic: "realistic - telling it like it is without sugar-coating",
    contrarian: "contrarian - challenging conventional wisdom",
    supportive: "supportive - encouraging and validating",
    challenging: "challenging - pushing readers to do better",
  };
  lines.push(`\nYour default tone is: ${toneDescriptions[fp.perspective.tone]}`);

  // Core beliefs
  if (fp.perspective.believes.length > 0) {
    lines.push("\n### Core Beliefs (weave these in naturally)");
    for (const belief of fp.perspective.believes) {
      lines.push(`- ${belief}`);
    }
  }

  // What you fight against
  if (fp.perspective.fightsAgainst.length > 0) {
    lines.push("\n### What You Push Back Against");
    for (const fight of fp.perspective.fightsAgainst) {
      lines.push(`- ${fight}`);
    }
  }

  return lines.join("\n");
}

/**
 * Generate the rules section of the voice prompt.
 */
function generateRulesSection(fp: VoiceFingerprint): string {
  const lines: string[] = ["## Writing Rules"];

  // Signature phrases
  if (fp.signatures.phrases.length > 0) {
    lines.push("\n### Signature Phrases (use occasionally, not every post)");
    for (const phrase of fp.signatures.phrases) {
      lines.push(`- "${phrase}"`);
    }
  }

  // Opening patterns
  if (fp.signatures.openings.length > 0) {
    lines.push("\n### Opening Style");
    lines.push(
      `Preferred openings: ${fp.signatures.openings.join(", ")}`
    );
  }

  // Transitions
  if (fp.signatures.transitions.length > 0) {
    lines.push("\n### Transitions");
    lines.push(`Use: ${fp.signatures.transitions.join(", ")}`);
  }

  // Closings
  if (fp.signatures.closings.length > 0) {
    lines.push("\n### Closing Style");
    lines.push(`End posts with: ${fp.signatures.closings.join(", ")}`);
  }

  // Quirks
  lines.push("\n### Voice Quirks (these make it human)");
  if (fp.quirks.startsSentencesWithConjunctions) {
    lines.push("- Start sentences with And/But when natural");
  }
  if (fp.quirks.usesOneWordSentences) {
    lines.push("- Use one-word sentences for emphasis. Absolutely. Often.");
  }
  if (fp.quirks.breaksGrammarRules.length > 0) {
    lines.push("- Break these grammar rules intentionally:");
    for (const rule of fp.quirks.breaksGrammarRules) {
      lines.push(`  - ${rule}`);
    }
  }
  if (fp.quirks.formattingPreferences.length > 0) {
    lines.push("- Formatting preferences:");
    for (const pref of fp.quirks.formattingPreferences) {
      lines.push(`  - ${pref}`);
    }
  }
  if (fp.quirks.punctuationQuirks.length > 0) {
    lines.push("- Punctuation habits:");
    for (const quirk of fp.quirks.punctuationQuirks) {
      lines.push(`  - ${quirk}`);
    }
  }

  return lines.join("\n");
}

/**
 * Generate the avoid section of the voice prompt.
 */
function generateAvoidSection(fp: VoiceFingerprint): string {
  const lines: string[] = ["## NEVER Do These"];

  if (fp.antiPatterns.neverUse.length > 0) {
    lines.push("\n### Words/Phrases to NEVER Use");
    for (const word of fp.antiPatterns.neverUse) {
      lines.push(`- "${word}"`);
    }
  }

  if (fp.antiPatterns.neverSoundLike.length > 0) {
    lines.push("\n### Never Sound Like");
    for (const style of fp.antiPatterns.neverSoundLike) {
      lines.push(`- ${style}`);
    }
  }

  if (fp.antiPatterns.avoidTopics.length > 0) {
    lines.push("\n### Topics to Avoid");
    for (const topic of fp.antiPatterns.avoidTopics) {
      lines.push(`- ${topic}`);
    }
  }

  return lines.join("\n");
}

/**
 * Generate the rhythm section of the voice prompt.
 */
function generateRhythmSection(fp: VoiceFingerprint): string {
  const lines: string[] = ["## Rhythm Requirements"];

  // Sentence length guidance
  lines.push(`\n### Sentence Length`);
  if (fp.rhythm.avgSentenceLength <= 10) {
    lines.push("Write SHORT. Punchy sentences dominate. Get to the point fast.");
    lines.push(`Target average: ~${fp.rhythm.avgSentenceLength} words per sentence`);
  } else if (fp.rhythm.avgSentenceLength >= 16) {
    lines.push(
      "Write in longer, flowing sentences that build on each other and develop ideas fully."
    );
    lines.push(`Target average: ~${fp.rhythm.avgSentenceLength} words per sentence`);
  } else {
    lines.push("Mix sentence lengths. Some short. Some longer to develop ideas.");
    lines.push(`Target average: ~${fp.rhythm.avgSentenceLength} words per sentence`);
  }

  // Short punch frequency
  lines.push(`\n### Short Punches`);
  const punchPercent = Math.round(fp.rhythm.shortPunchFrequency * 100);
  if (punchPercent >= 35) {
    lines.push(
      `Use short sentences (<6 words) frequently - about ${punchPercent}% of sentences.`
    );
    lines.push("These create impact. Rhythm. Energy.");
  } else if (punchPercent >= 20) {
    lines.push(
      `Use short sentences (<6 words) moderately - about ${punchPercent}% of sentences.`
    );
  } else {
    lines.push(
      `Use short sentences sparingly - only ${punchPercent}% of sentences.`
    );
  }

  // Fragments
  if (fp.rhythm.usesFragments) {
    lines.push("\n### Fragments");
    lines.push("Use intentional fragments for effect.");
    lines.push("Not complete sentences. But powerful. Punchy.");
  }

  // Punctuation style
  lines.push("\n### Punctuation");
  if (fp.rhythm.usesEmDashes) {
    lines.push("- Use em-dashes for asides and emphasis—like this");
  }
  if (fp.rhythm.usesParentheticals) {
    lines.push("- Use parenthetical comments (when they add value)");
  }

  return lines.join("\n");
}

/**
 * Generate complete voice prompt from fingerprint.
 */
export function generateVoicePrompt(fp: VoiceFingerprint): VoicePromptSections {
  const identity = generateIdentitySection(fp);
  const rules = generateRulesSection(fp);
  const avoid = generateAvoidSection(fp);
  const rhythm = generateRhythmSection(fp);

  const full = `# Voice Fingerprint Instructions

${identity}

${rules}

${avoid}

${rhythm}

---

CRITICAL: This voice must feel HUMAN, not AI-generated.
- Vary sentence length naturally (burstiness)
- Include the quirks and imperfections described above
- Let personality come through, even if imperfect
- The anti-patterns are HARD RULES - never violate them
`;

  return {
    identity,
    rules,
    avoid,
    rhythm,
    full,
  };
}

/**
 * Generate a lightweight voice prompt from VoiceDNA.
 * Used when full fingerprint isn't available or for quick generation.
 */
export function generateQuickVoicePrompt(dna: VoiceDNA): string {
  return `## Quick Voice Guide

Distinctive element: ${dna.distinctiveElement}

Key traits: ${dna.primaryTraits.join(", ")}

Rhythm: ${dna.rhythmStyle === "punchy" ? "Short, punchy sentences. Get to the point. Fast." : dna.rhythmStyle === "flowing" ? "Longer, flowing sentences that develop ideas." : "Mix of short punches and longer sentences."}

NEVER use these: ${dna.dealbreakers.map((d) => `"${d}"`).join(", ")}
`;
}

/**
 * Generate a voice comparison prompt.
 * Used to check if generated content matches the fingerprint.
 */
export function generateVoiceCheckPrompt(fp: VoiceFingerprint): string {
  return `## Voice Match Checklist

Check the content against this fingerprint:

1. RHYTHM CHECK
   - Average sentence length should be ~${fp.rhythm.avgSentenceLength} words
   - Short sentences (<6 words) should be ~${Math.round(fp.rhythm.shortPunchFrequency * 100)}% of total
   - ${fp.rhythm.usesFragments ? "Should include intentional fragments" : "Should avoid fragments"}
   - ${fp.rhythm.usesEmDashes ? "Should use em-dashes" : "Should avoid em-dashes"}

2. ANTI-PATTERN CHECK
   - Must NOT contain: ${fp.antiPatterns.neverUse.map((w) => `"${w}"`).join(", ") || "N/A"}
   - Must NOT sound like: ${fp.antiPatterns.neverSoundLike.join(", ") || "N/A"}

3. SIGNATURE CHECK
   - Look for natural use of: ${fp.signatures.phrases.map((p) => `"${p}"`).join(", ") || "N/A"}
   - Opening should match: ${fp.signatures.openings.join(", ") || "any"}
   - Closing should match: ${fp.signatures.closings.join(", ") || "any"}

4. PERSPECTIVE CHECK
   - Does it reflect beliefs: ${fp.perspective.believes.join("; ") || "N/A"}
   - Does it push back against: ${fp.perspective.fightsAgainst.join("; ") || "N/A"}
   - Is the reader relationship ${fp.perspective.readerRelationship}?

5. QUIRK CHECK
   ${fp.quirks.usesOneWordSentences ? "- Should have one-word sentences" : ""}
   ${fp.quirks.startsSentencesWithConjunctions ? "- Should start some sentences with And/But" : ""}

Rate the match: STRONG / MODERATE / WEAK / MISMATCH
`;
}

/**
 * Merge two fingerprints (e.g., interview + extraction).
 * Extraction takes precedence for measurable patterns.
 * Interview takes precedence for perspective/beliefs.
 */
export function mergeFingerprints(
  interview: Partial<VoiceFingerprint>,
  extraction: Partial<VoiceFingerprint>
): VoiceFingerprint {
  return {
    // Extraction is more accurate for rhythm (measured)
    rhythm: {
      avgSentenceLength:
        extraction.rhythm?.avgSentenceLength ??
        interview.rhythm?.avgSentenceLength ??
        12,
      shortPunchFrequency:
        extraction.rhythm?.shortPunchFrequency ??
        interview.rhythm?.shortPunchFrequency ??
        0.2,
      usesFragments:
        extraction.rhythm?.usesFragments ??
        interview.rhythm?.usesFragments ??
        false,
      usesEmDashes:
        extraction.rhythm?.usesEmDashes ??
        interview.rhythm?.usesEmDashes ??
        false,
      usesParentheticals:
        extraction.rhythm?.usesParentheticals ??
        interview.rhythm?.usesParentheticals ??
        false,
    },
    // Merge signatures, preferring extraction
    signatures: {
      phrases: [
        ...(extraction.signatures?.phrases || []),
        ...(interview.signatures?.phrases || []),
      ].filter((v, i, a) => a.indexOf(v) === i), // dedupe
      openings: extraction.signatures?.openings?.length
        ? extraction.signatures.openings
        : interview.signatures?.openings || [],
      transitions: [
        ...(extraction.signatures?.transitions || []),
        ...(interview.signatures?.transitions || []),
      ].filter((v, i, a) => a.indexOf(v) === i),
      closings: extraction.signatures?.closings?.length
        ? extraction.signatures.closings
        : interview.signatures?.closings || [],
    },
    // Interview is more accurate for anti-patterns (explicit)
    antiPatterns: {
      neverUse: [
        ...(interview.antiPatterns?.neverUse || []),
        ...(extraction.antiPatterns?.neverUse || []),
      ].filter((v, i, a) => a.indexOf(v) === i),
      neverSoundLike:
        interview.antiPatterns?.neverSoundLike ||
        extraction.antiPatterns?.neverSoundLike ||
        [],
      avoidTopics:
        interview.antiPatterns?.avoidTopics ||
        extraction.antiPatterns?.avoidTopics ||
        [],
    },
    // Interview is more accurate for perspective (explicit)
    perspective: {
      believes:
        interview.perspective?.believes ||
        extraction.perspective?.believes ||
        [],
      fightsAgainst:
        interview.perspective?.fightsAgainst ||
        extraction.perspective?.fightsAgainst ||
        [],
      readerRelationship:
        interview.perspective?.readerRelationship ||
        extraction.perspective?.readerRelationship ||
        "peer",
      tone:
        interview.perspective?.tone ||
        extraction.perspective?.tone ||
        "realistic",
    },
    // Extraction is more accurate for quirks (measured)
    quirks: {
      startsSentencesWithConjunctions:
        extraction.quirks?.startsSentencesWithConjunctions ??
        interview.quirks?.startsSentencesWithConjunctions ??
        false,
      usesOneWordSentences:
        extraction.quirks?.usesOneWordSentences ??
        interview.quirks?.usesOneWordSentences ??
        false,
      breaksGrammarRules: [
        ...(interview.quirks?.breaksGrammarRules || []),
        ...(extraction.quirks?.breaksGrammarRules || []),
      ].filter((v, i, a) => a.indexOf(v) === i),
      formattingPreferences:
        interview.quirks?.formattingPreferences ||
        extraction.quirks?.formattingPreferences ||
        [],
      punctuationQuirks:
        extraction.quirks?.punctuationQuirks ||
        interview.quirks?.punctuationQuirks ||
        [],
    },
    meta: {
      source: "hybrid",
      sampleCount: extraction.meta?.sampleCount,
      createdAt: new Date().toISOString(),
      confidence: Math.min(
        (interview.meta?.confidence || 0.5) +
          (extraction.meta?.confidence || 0.5),
        0.95
      ),
    },
  };
}
