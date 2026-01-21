/**
 * Voice System
 *
 * A structured system for applying brand voice consistently across content.
 * This transforms raw voice_config into actionable writing guidelines.
 */

// VoiceConfig interface matching the actual stored format from brand creation
export interface VoiceConfig {
  // Primary stored fields (from brand creation/analysis)
  tone_keywords?: string[]; // e.g., ["professional", "friendly", "bold"]
  words_to_avoid?: string[]; // e.g., ["leverage", "synergy"]
  example_posts?: string[]; // Example posts that match the voice
  strictness?: number; // 0-1 scale for AI adherence to brand guidelines
  source_url?: string; // Website URL used for analysis
  extracted_voice?: {
    tone_description?: string;
    messaging_themes?: string[];
    writing_style?: string;
  };

  // Legacy/advanced fields (for backwards compatibility)
  archetype?: string; // e.g., "thought-leader", "friendly-expert", "provocateur"
  personality?: string[]; // e.g., ["confident", "witty", "direct"]
  tone?: string; // e.g., "professional", "casual", "authoritative"
  formality?: "formal" | "neutral" | "casual" | "very-casual";
  vocabulary?: {
    preferred?: string[]; // Words/phrases to use
    avoided?: string[]; // Words/phrases to never use
    jargonLevel?: "none" | "minimal" | "moderate" | "heavy";
  };
  sentenceStyle?: "short-punchy" | "mixed" | "flowing";
  useEmojis?: boolean | "minimal" | "moderate" | "heavy";
  useQuestions?: boolean;
  useExclamations?: boolean;
  signature?: {
    phrases?: string[]; // Signature phrases to occasionally use
    signoff?: string; // How to end posts
    perspective?: "first-person" | "we" | "you-focused";
  };
  examples?: {
    good?: string[]; // Examples of content that matches the voice
    bad?: string[]; // Examples of content that violates the voice
  };
}

// Visual config interface for brand colors/styling
export interface VisualConfig {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  fonts?: {
    heading?: string;
    body?: string;
  };
  image_style?: string;
  color_palette?: string[];
  example_posts?: string[]; // User-uploaded example images (base64 or URLs)
  master_brand_prompt?: string; // AI-generated visual brand description from example posts
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

// Get strictness label and instructions based on the 0-1 scale
const getStrictnessGuidance = (strictness: number): { label: string; instructions: string } => {
  if (strictness >= 0.8) {
    return {
      label: "STRICT",
      instructions: `**STRICT BRAND ADHERENCE (${Math.round(strictness * 100)}%)**
You MUST strictly follow the brand voice guidelines with minimal variation.
- Every word choice must align with the brand tone
- Never deviate from the specified style
- Use only approved language patterns
- This content must be immediately recognizable as this brand
- Zero tolerance for off-brand phrasing or tone`,
    };
  } else if (strictness >= 0.6) {
    return {
      label: "CONSISTENT",
      instructions: `**CONSISTENT BRAND VOICE (${Math.round(strictness * 100)}%)**
Follow the brand voice guidelines closely while maintaining natural flow.
- Core brand tone must be present throughout
- Minor creative variations are acceptable for engagement
- Key brand characteristics should be recognizable
- Maintain the brand's personality in every post`,
    };
  } else if (strictness >= 0.3) {
    return {
      label: "BALANCED",
      instructions: `**BALANCED APPROACH (${Math.round(strictness * 100)}%)**
Use the brand voice as a guide while allowing creative flexibility.
- Brand tone should influence but not restrict
- Adapt style to what works best for each platform
- Creative expression encouraged within brand spirit
- Quality and engagement take priority over strict adherence`,
    };
  } else {
    return {
      label: "FLEXIBLE",
      instructions: `**FLEXIBLE VOICE (${Math.round(strictness * 100)}%)**
The brand voice is a loose guide - prioritize what performs best.
- Creative freedom is encouraged
- Focus on engagement and value over brand consistency
- Use brand guidelines as inspiration, not rules
- Experiment with different approaches`,
    };
  }
};

export const buildVoicePrompt = (voiceConfig: VoiceConfig | null, visualConfig?: VisualConfig | null): string => {
  if (!voiceConfig) {
    return `## Brand Voice
Use a professional yet approachable voice. Be clear, direct, and value-focused.
Avoid jargon unless necessary. Write like a knowledgeable friend, not a corporation.`;
  }

  const sections: string[] = ["## Brand Voice Guidelines"];

  // Strictness enforcement (CRITICAL - this determines how closely to follow guidelines)
  const strictness = voiceConfig.strictness ?? 0.5;
  const { instructions: strictnessInstructions } = getStrictnessGuidance(strictness);
  sections.push(strictnessInstructions);

  // PRIMARY: Handle the actual stored format (tone_keywords, extracted_voice, etc.)
  if (voiceConfig.tone_keywords?.length || voiceConfig.extracted_voice) {
    sections.push(`### Brand Voice Profile`);

    // Tone keywords are the core personality descriptors
    if (voiceConfig.tone_keywords?.length) {
      sections.push(`**Voice Characteristics**: ${voiceConfig.tone_keywords.join(", ")}`);
      sections.push(`Every piece of content must embody these traits: ${voiceConfig.tone_keywords.map(k => `"${k}"`).join(", ")}`);
    }

    // Extracted voice details from website analysis
    if (voiceConfig.extracted_voice) {
      if (voiceConfig.extracted_voice.writing_style) {
        sections.push(`**Writing Style**: ${voiceConfig.extracted_voice.writing_style}`);
      }
      if (voiceConfig.extracted_voice.tone_description) {
        sections.push(`**Tone**: ${voiceConfig.extracted_voice.tone_description}`);
      }
      if (voiceConfig.extracted_voice.messaging_themes?.length) {
        sections.push(`**Key Messaging Themes**: ${voiceConfig.extracted_voice.messaging_themes.join(", ")}`);
      }
    }
  }

  // Words to avoid (directly at root level in stored format)
  if (voiceConfig.words_to_avoid?.length) {
    sections.push(`### FORBIDDEN Words & Phrases`);
    sections.push(`NEVER use these words or phrases - they are off-brand:`);
    sections.push(voiceConfig.words_to_avoid.map(w => `- "${w}"`).join("\n"));
  }

  // Example posts that match the voice
  if (voiceConfig.example_posts?.length) {
    sections.push(`### Reference Examples`);
    sections.push(`Here are examples of content that matches this brand's voice:`);
    voiceConfig.example_posts.forEach((ex, i) => {
      sections.push(`Example ${i + 1}: "${ex}"`);
    });
    sections.push(`Model your content after these examples in tone, style, and personality.`);
  }

  // LEGACY: Support archetype-based configs (backwards compatibility)
  if (voiceConfig.archetype && VOICE_ARCHETYPES[voiceConfig.archetype as keyof typeof VOICE_ARCHETYPES]) {
    const arch = VOICE_ARCHETYPES[voiceConfig.archetype as keyof typeof VOICE_ARCHETYPES];
    sections.push(`### Voice Archetype: ${voiceConfig.archetype.replace("-", " ").toUpperCase()}`);
    sections.push(arch.description);
    sections.push(`Core traits: ${arch.traits.join(", ")}`);
    sections.push(`Tonal range: ${arch.tonalRange}`);
    sections.push(`Avoid: ${arch.avoidPatterns.map((p) => `"${p}"`).join(", ")}`);
    sections.push(`Embrace: ${arch.usePatterns.map((p) => `"${p}"`).join(", ")}`);
  }

  // Personality (legacy)
  if (voiceConfig.personality?.length) {
    sections.push(`### Personality Traits`);
    sections.push(`Embody these traits: ${voiceConfig.personality.join(", ")}`);
  }

  // Tone and formality (legacy)
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

  // Vocabulary (legacy format - vocabulary.avoided)
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

  // Style settings (legacy)
  if (voiceConfig.sentenceStyle || voiceConfig.useEmojis !== undefined || voiceConfig.useQuestions !== undefined) {
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
  }

  // Signature elements (legacy)
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

  // Examples (legacy format)
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

  // MASTER BRAND PROMPT: If available, use this as the PRIMARY visual directive
  // It's AI-generated from analyzing the brand's actual example posts
  if (visualConfig?.master_brand_prompt) {
    sections.push(`### MASTER BRAND DIRECTIVE (CRITICAL - FOLLOW THIS EXACTLY)`);
    sections.push(`The following brand guidelines were generated from analyzing this brand's actual content. Follow these EXACTLY:`);
    sections.push(visualConfig.master_brand_prompt);
    sections.push(`\n**IMPORTANT**: This master brand prompt takes priority over any other visual instructions. Use it as the primary guide for all image prompts and visual descriptions.`);
  }

  // VISUAL CONFIG: Add brand colors for image generation consistency
  if (visualConfig) {
    sections.push(`### Brand Visual Identity`);
    sections.push(`When generating image prompts, use these brand colors for consistency:`);
    if (visualConfig.primary_color) {
      sections.push(`- **Primary Color**: ${visualConfig.primary_color}`);
    }
    if (visualConfig.accent_color) {
      sections.push(`- **Accent Color**: ${visualConfig.accent_color}`);
    }
    if (visualConfig.secondary_color) {
      sections.push(`- **Secondary Color**: ${visualConfig.secondary_color}`);
    }
    if (visualConfig.image_style) {
      sections.push(`- **Preferred Image Style**: ${visualConfig.image_style}`);
    }
    if (visualConfig.fonts?.heading || visualConfig.fonts?.body) {
      sections.push(`- **Brand Fonts**: ${visualConfig.fonts.heading || 'Inter'} (headings), ${visualConfig.fonts.body || 'Inter'} (body)`);
    }
    sections.push(`\nIMPORTANT: All carousel slides and image prompts should incorporate these brand colors for visual consistency.`);
  }

  return sections.join("\n\n");
};

// Helper to build voice prompt with visual config (convenience function)
export const buildBrandPrompt = (voiceConfig: VoiceConfig | null, visualConfig?: VisualConfig | null): string => {
  return buildVoicePrompt(voiceConfig, visualConfig);
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
