/**
 * Voice System
 *
 * A structured system for applying brand voice consistently across content.
 * This transforms raw voice_config into actionable writing guidelines.
 */

export interface VoiceConfig {
  // Core personality
  archetype?: string; // e.g., "thought-leader", "friendly-expert", "provocateur"
  personality?: string[]; // e.g., ["confident", "witty", "direct"]

  // Tone settings
  tone?: string; // e.g., "professional", "casual", "authoritative"
  formality?: "formal" | "neutral" | "casual" | "very-casual";

  // Language preferences
  vocabulary?: {
    preferred?: string[]; // Words/phrases to use
    avoided?: string[]; // Words/phrases to never use
    jargonLevel?: "none" | "minimal" | "moderate" | "heavy";
  };

  // Style settings
  sentenceStyle?: "short-punchy" | "mixed" | "flowing";
  useEmojis?: boolean | "minimal" | "moderate" | "heavy";
  useQuestions?: boolean;
  useExclamations?: boolean;

  // Unique voice elements
  signature?: {
    phrases?: string[]; // Signature phrases to occasionally use
    signoff?: string; // How to end posts
    perspective?: "first-person" | "we" | "you-focused";
  };

  // Examples (most important for voice matching)
  examples?: {
    good?: string[]; // Examples of content that matches the voice
    bad?: string[]; // Examples of content that violates the voice
  };
}

export const VOICE_ARCHETYPES = {
  "thought-leader": {
    description: "Authoritative expert who shapes industry thinking",
    traits: ["confident", "forward-thinking", "quotable"],
    tonalRange: "assertive but not arrogant, visionary but grounded",
    avoidPatterns: ["In my opinion", "I think maybe", "I'm not sure but"],
    usePatterns: ["The reality is", "Here's what most miss", "The future belongs to"],
  },
  "friendly-expert": {
    description: "Approachable professional who makes complex things simple",
    traits: ["warm", "clear", "helpful"],
    tonalRange: "knowledgeable but not intimidating, friendly but professional",
    avoidPatterns: ["Actually,", "Obviously,", "Everyone knows"],
    usePatterns: ["Here's the thing", "Let me break this down", "The simple truth"],
  },
  "provocateur": {
    description: "Bold voice that challenges status quo and sparks debate",
    traits: ["bold", "contrarian", "entertaining"],
    tonalRange: "provocative but not offensive, confident but not dismissive",
    avoidPatterns: ["Some people say", "It could be argued", "One perspective"],
    usePatterns: ["Hot take:", "Unpopular opinion:", "Stop [doing thing]"],
  },
  "storyteller": {
    description: "Narrative-driven voice that connects through stories",
    traits: ["engaging", "relatable", "authentic"],
    tonalRange: "personal but not oversharing, emotional but not melodramatic",
    avoidPatterns: ["Statistics show", "Data indicates", "Research suggests"],
    usePatterns: ["Last week I", "Here's what happened", "Picture this"],
  },
  "data-driven": {
    description: "Evidence-based voice that builds credibility through proof",
    traits: ["analytical", "precise", "credible"],
    tonalRange: "factual but not dry, analytical but accessible",
    avoidPatterns: ["I feel like", "In my experience", "Probably"],
    usePatterns: ["The data shows", "Here's the breakdown", "[X]% of"],
  },
  "mentor": {
    description: "Supportive guide who empowers through teaching",
    traits: ["encouraging", "wise", "patient"],
    tonalRange: "supportive but not patronizing, experienced but humble",
    avoidPatterns: ["You should", "You must", "You're doing it wrong"],
    usePatterns: ["Here's what I've learned", "Try this approach", "The key insight"],
  },
};

export const buildVoicePrompt = (voiceConfig: VoiceConfig | null): string => {
  if (!voiceConfig) {
    return `## Brand Voice
Use a professional yet approachable voice. Be clear, direct, and value-focused.
Avoid jargon unless necessary. Write like a knowledgeable friend, not a corporation.`;
  }

  const sections: string[] = ["## Brand Voice Guidelines"];

  // Archetype section
  if (voiceConfig.archetype && VOICE_ARCHETYPES[voiceConfig.archetype as keyof typeof VOICE_ARCHETYPES]) {
    const arch = VOICE_ARCHETYPES[voiceConfig.archetype as keyof typeof VOICE_ARCHETYPES];
    sections.push(`### Voice Archetype: ${voiceConfig.archetype.replace("-", " ").toUpperCase()}`);
    sections.push(arch.description);
    sections.push(`Core traits: ${arch.traits.join(", ")}`);
    sections.push(`Tonal range: ${arch.tonalRange}`);
    sections.push(`Avoid: ${arch.avoidPatterns.map((p) => `"${p}"`).join(", ")}`);
    sections.push(`Embrace: ${arch.usePatterns.map((p) => `"${p}"`).join(", ")}`);
  }

  // Personality
  if (voiceConfig.personality?.length) {
    sections.push(`### Personality Traits`);
    sections.push(`Embody these traits: ${voiceConfig.personality.join(", ")}`);
  }

  // Tone and formality
  if (voiceConfig.tone || voiceConfig.formality) {
    sections.push(`### Tone Settings`);
    if (voiceConfig.tone) sections.push(`Overall tone: ${voiceConfig.tone}`);
    if (voiceConfig.formality) {
      const formalityGuide = {
        formal: "Use complete sentences, proper grammar, no contractions, no slang",
        neutral: "Professional but not stiff, contractions OK, accessible language",
        casual: "Conversational, contractions encouraged, relatable language",
        "very-casual": "Like texting a friend, fragments OK, colloquialisms welcome",
      };
      sections.push(`Formality: ${voiceConfig.formality} - ${formalityGuide[voiceConfig.formality]}`);
    }
  }

  // Vocabulary
  if (voiceConfig.vocabulary) {
    sections.push(`### Vocabulary Guidelines`);
    if (voiceConfig.vocabulary.preferred?.length) {
      sections.push(`Preferred words/phrases: ${voiceConfig.vocabulary.preferred.join(", ")}`);
    }
    if (voiceConfig.vocabulary.avoided?.length) {
      sections.push(`NEVER use: ${voiceConfig.vocabulary.avoided.join(", ")}`);
    }
    if (voiceConfig.vocabulary.jargonLevel) {
      const jargonGuide = {
        none: "Avoid all industry jargon, explain everything simply",
        minimal: "Use only widely-understood terms, explain technical concepts",
        moderate: "Industry terms OK for knowledgeable audience, but stay accessible",
        heavy: "Technical vocabulary expected, speaking to experts",
      };
      sections.push(`Jargon level: ${jargonGuide[voiceConfig.vocabulary.jargonLevel]}`);
    }
  }

  // Style
  sections.push(`### Style Settings`);
  if (voiceConfig.sentenceStyle) {
    const styleGuide = {
      "short-punchy": "Keep sentences short. Punch hard. Create rhythm through brevity.",
      mixed: "Vary sentence length for natural flow. Mix short punches with longer explanations.",
      flowing: "Use longer, more elaborate sentences that build complex ideas smoothly.",
    };
    sections.push(`Sentence style: ${styleGuide[voiceConfig.sentenceStyle]}`);
  }

  if (voiceConfig.useEmojis !== undefined) {
    if (voiceConfig.useEmojis === false) {
      sections.push(`Emojis: DO NOT use emojis`);
    } else if (voiceConfig.useEmojis === true || voiceConfig.useEmojis === "moderate") {
      sections.push(`Emojis: Use emojis sparingly to add personality (1-2 per post max)`);
    } else if (voiceConfig.useEmojis === "minimal") {
      sections.push(`Emojis: Rarely use emojis, only when they add clear value`);
    } else if (voiceConfig.useEmojis === "heavy") {
      sections.push(`Emojis: Emojis are part of the voice, use them freely`);
    }
  }

  if (voiceConfig.useQuestions !== undefined) {
    sections.push(
      voiceConfig.useQuestions
        ? `Questions: Use rhetorical questions to engage readers`
        : `Questions: Avoid rhetorical questions, make statements instead`
    );
  }

  // Signature elements
  if (voiceConfig.signature) {
    sections.push(`### Signature Elements`);
    if (voiceConfig.signature.phrases?.length) {
      sections.push(`Signature phrases to occasionally use: ${voiceConfig.signature.phrases.join(", ")}`);
    }
    if (voiceConfig.signature.signoff) {
      sections.push(`Sign-off style: ${voiceConfig.signature.signoff}`);
    }
    if (voiceConfig.signature.perspective) {
      const perspGuide = {
        "first-person": 'Write from "I" perspective',
        we: 'Write from "we" perspective (team/company)',
        "you-focused": 'Focus on "you" (the reader) - their problems, their wins',
      };
      sections.push(`Perspective: ${perspGuide[voiceConfig.signature.perspective]}`);
    }
  }

  // Examples (most important)
  if (voiceConfig.examples) {
    if (voiceConfig.examples.good?.length) {
      sections.push(`### Examples of Content That Matches This Voice`);
      voiceConfig.examples.good.forEach((ex, i) => {
        sections.push(`Good Example ${i + 1}: "${ex}"`);
      });
    }
    if (voiceConfig.examples.bad?.length) {
      sections.push(`### Examples of Content That VIOLATES This Voice (Never Write Like This)`);
      voiceConfig.examples.bad.forEach((ex, i) => {
        sections.push(`Bad Example ${i + 1}: "${ex}"`);
      });
    }
  }

  return sections.join("\n\n");
};

export const VOICE_QUALITY_CHECK = `## Voice Consistency Check

Before finalizing content, verify:
1. Does this sound like the brand, not generic AI?
2. Would a follower immediately recognize this voice?
3. Are the vocabulary choices consistent with brand guidelines?
4. Is the tone appropriate for this platform AND this brand?
5. Does this avoid all prohibited words/phrases?
6. Would the brand owner be proud to post this?`;

export const DEFAULT_VOICE_PROMPT = buildVoicePrompt(null);
