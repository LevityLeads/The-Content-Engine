/**
 * Voice Discovery Module
 *
 * Guided interview system for discovering a creator's voice
 * when they don't have enough writing samples.
 *
 * The questions are designed to uncover:
 * 1. What they believe (perspective)
 * 2. What they'd never say (anti-patterns)
 * 3. How they naturally communicate (rhythm/quirks)
 * 4. Who they're talking to (relationship)
 */

import type { VoiceFingerprint } from "./voice-fingerprint";
import { EMPTY_FINGERPRINT } from "./voice-fingerprint";

/**
 * A single discovery question with metadata.
 */
export interface DiscoveryQuestion {
  id: string;
  /** The question text */
  question: string;
  /** Why we're asking this (shown to user for context) */
  why: string;
  /** Which fingerprint section this informs */
  informs: keyof VoiceFingerprint;
  /** Specific field within the section */
  field: string;
  /** Question type affects how we process the answer */
  type: "open" | "choice" | "examples" | "ranking";
  /** For choice questions */
  options?: string[];
  /** Example answer to help user understand */
  exampleAnswer?: string;
  /** Follow-up questions based on answer */
  followUps?: {
    trigger: string; // keyword that triggers follow-up
    question: string;
  }[];
}

/**
 * A section of related questions.
 */
export interface DiscoverySection {
  id: string;
  title: string;
  description: string;
  questions: DiscoveryQuestion[];
}

/**
 * The complete discovery interview.
 * Organized into sections for a better user experience.
 */
export const DISCOVERY_INTERVIEW: DiscoverySection[] = [
  {
    id: "perspective",
    title: "Your Worldview",
    description:
      "These questions help us understand what you believe and what you push back against.",
    questions: [
      {
        id: "core-belief",
        question:
          "What's something you believe about your field that most people get wrong?",
        why: "Your contrarian views are what make your content distinctive",
        informs: "perspective",
        field: "believes",
        type: "open",
        exampleAnswer:
          "Most people think you need to post every day. I believe consistency beats frequency - 3 great posts beat 7 mediocre ones.",
        followUps: [
          {
            trigger: "most people",
            question: "What do you think causes this misconception?",
          },
        ],
      },
      {
        id: "fight-against",
        question: "What common advice in your space makes you cringe?",
        why: "What you fight against defines your voice as much as what you believe",
        informs: "perspective",
        field: "fightsAgainst",
        type: "open",
        exampleAnswer:
          '"Fake it till you make it" - it creates impostor syndrome and rewards inauthenticity.',
      },
      {
        id: "hill-to-die-on",
        question: "What's a hill you'd die on professionally?",
        why: "Strong stances create memorable content",
        informs: "perspective",
        field: "believes",
        type: "open",
        exampleAnswer:
          "Documentation is more important than clever code. I will defend this forever.",
      },
      {
        id: "reader-relationship",
        question: "When you write, how do you see your relationship to your reader?",
        why: "This shapes your tone and how you deliver information",
        informs: "perspective",
        field: "readerRelationship",
        type: "choice",
        options: [
          "Peer - We're in this together, learning alongside each other",
          "Mentor - I've been there, let me guide you",
          "Provocateur - I'm here to challenge your assumptions",
          "Guide - I'll show you the path, you decide if you take it",
          "Insider - I'll share what I've learned from the inside",
        ],
      },
      {
        id: "tone",
        question: "When giving advice, what's your natural default tone?",
        why: "Understanding your baseline helps us match your natural voice",
        informs: "perspective",
        field: "tone",
        type: "choice",
        options: [
          "Optimistic - Focus on possibilities and potential",
          "Realistic - Tell it like it is, no sugar-coating",
          "Contrarian - Challenge the status quo",
          "Supportive - Encourage and validate",
          "Challenging - Push people to do better",
        ],
      },
    ],
  },
  {
    id: "anti-patterns",
    title: "What You'd Never Say",
    description:
      "Often more important than what you would say. These define your boundaries.",
    questions: [
      {
        id: "cringe-words",
        question:
          "What words or phrases make you cringe when you see them in content?",
        why: "We'll make sure never to use these in your voice",
        informs: "antiPatterns",
        field: "neverUse",
        type: "examples",
        exampleAnswer:
          '"Synergy", "leverage", "crushing it", "let\'s unpack this"',
      },
      {
        id: "never-sound-like",
        question: "Whose writing style would you never want to sound like?",
        why: "Knowing what to avoid is as important as knowing what to emulate",
        informs: "antiPatterns",
        field: "neverSoundLike",
        type: "open",
        exampleAnswer:
          "Corporate press releases. LinkedIn motivational posters. Overly enthusiastic sales copy.",
      },
      {
        id: "avoid-topics",
        question: "Are there topics you intentionally avoid in your content?",
        why: "Helps us stay within your comfort zone",
        informs: "antiPatterns",
        field: "avoidTopics",
        type: "examples",
        exampleAnswer:
          "Politics, religion, my clients' specific details, anything I haven't personally experienced",
      },
      {
        id: "overused-hooks",
        question: "What content hooks have you seen so often they've become noise?",
        why: "We'll avoid these tired patterns",
        informs: "antiPatterns",
        field: "neverUse",
        type: "examples",
        exampleAnswer:
          '"I was today years old...", "Nobody is talking about...", "Stop doing X, start doing Y"',
      },
    ],
  },
  {
    id: "signatures",
    title: "Your Signature Patterns",
    description: "The phrases and patterns that make your writing recognizable.",
    questions: [
      {
        id: "catchphrases",
        question:
          "Do you have any phrases or expressions you use repeatedly? (It's okay if you don't!)",
        why: "These become recognizable signatures of your voice",
        informs: "signatures",
        field: "phrases",
        type: "examples",
        exampleAnswer:
          '"Here\'s the thing", "Let me be clear", "The real question is"',
      },
      {
        id: "post-starts",
        question: "How do you naturally start a piece of writing or a post?",
        why: "Opening patterns are distinctive voice markers",
        informs: "signatures",
        field: "openings",
        type: "open",
        exampleAnswer:
          "I usually start with a bold statement or a question. Rarely with 'I'.",
      },
      {
        id: "transitions",
        question: "How do you typically move between ideas in your writing?",
        why: "Transition style affects reading flow and voice feel",
        informs: "signatures",
        field: "transitions",
        type: "choice",
        options: [
          "Quick and direct - Just jump to the next point",
          "Bridge sentences - Connect ideas explicitly",
          "Questions - Use questions to pivot",
          "Short breaks - Use line breaks or '---' to separate",
          "Storytelling - Weave ideas into a narrative",
        ],
      },
      {
        id: "endings",
        question: "How do you like to end your posts?",
        why: "Closings are another distinctive pattern",
        informs: "signatures",
        field: "closings",
        type: "choice",
        options: [
          "Call to action - Ask them to do something",
          "Question to audience - Invite discussion",
          "Strong statement - End with conviction",
          "Summary takeaway - Recap the key point",
          "Open-ended - Let them draw their own conclusion",
        ],
      },
    ],
  },
  {
    id: "rhythm",
    title: "Your Writing Rhythm",
    description: "How your sentences flow and feel when read.",
    questions: [
      {
        id: "sentence-length",
        question: "Do you naturally write in short punchy sentences or longer flowing ones?",
        why: "Sentence length patterns are measurable voice markers",
        informs: "rhythm",
        field: "avgSentenceLength",
        type: "choice",
        options: [
          "Short and punchy - I like impact. Quick hits. Get to the point.",
          "Medium and varied - Mix of short and longer sentences",
          "Longer and flowing - I tend to write more elaborate sentences that build on each other",
        ],
      },
      {
        id: "fragments",
        question: "Do you use intentional sentence fragments for effect?",
        why: "Fragments are a stylistic choice that defines voice",
        informs: "rhythm",
        field: "usesFragments",
        type: "choice",
        options: [
          "Yes, often - Fragments work. For emphasis. For rhythm.",
          "Sometimes - When it feels right",
          "Rarely - I prefer complete sentences",
        ],
      },
      {
        id: "punctuation",
        question: "Any punctuation habits you're aware of?",
        why: "Punctuation choices affect voice rhythm",
        informs: "rhythm",
        field: "usesEmDashes",
        type: "examples",
        exampleAnswer:
          "I overuse em-dashes—like this—to add asides. I also love ellipses...",
      },
    ],
  },
  {
    id: "quirks",
    title: "Your Quirks",
    description:
      "The imperfections and rule-breaking that make writing feel human.",
    questions: [
      {
        id: "grammar-breaking",
        question: "Do you intentionally break any grammar rules?",
        why: "Intentional rule-breaking is a voice signature",
        informs: "quirks",
        field: "breaksGrammarRules",
        type: "examples",
        exampleAnswer:
          "I start sentences with 'And' and 'But'. I use 'they' as singular. I end sentences with prepositions.",
      },
      {
        id: "one-word",
        question: "Do you use one-word sentences for emphasis?",
        why: "One-word punches are a distinctive rhythm pattern",
        informs: "quirks",
        field: "usesOneWordSentences",
        type: "choice",
        options: [
          "Yes. Absolutely. Often.",
          "Sometimes, when it really matters",
          "Not really my style",
        ],
      },
      {
        id: "formatting",
        question: "Any specific formatting preferences?",
        why: "Visual formatting is part of voice on social platforms",
        informs: "quirks",
        field: "formattingPreferences",
        type: "examples",
        exampleAnswer:
          "I use → instead of bullet points. I capitalize for EMPHASIS. I keep paragraphs to 1-2 sentences max.",
      },
    ],
  },
];

/**
 * Get the minimum questions needed for a usable fingerprint.
 * Returns the most impactful questions from each section.
 */
export function getMinimumQuestions(): DiscoveryQuestion[] {
  const essential = [
    "core-belief", // What you believe
    "fight-against", // What you fight
    "cringe-words", // What you'd never say
    "reader-relationship", // How you relate
    "sentence-length", // Your rhythm
  ];

  return DISCOVERY_INTERVIEW.flatMap((section) =>
    section.questions.filter((q) => essential.includes(q.id))
  );
}

/**
 * Get all questions as a flat array.
 */
export function getAllQuestions(): DiscoveryQuestion[] {
  return DISCOVERY_INTERVIEW.flatMap((section) => section.questions);
}

/**
 * Process interview answers into a partial fingerprint.
 */
export function processInterviewAnswers(
  answers: Record<string, string>
): Partial<VoiceFingerprint> {
  const fp: Partial<VoiceFingerprint> = {
    rhythm: { ...EMPTY_FINGERPRINT.rhythm },
    signatures: { ...EMPTY_FINGERPRINT.signatures },
    antiPatterns: { ...EMPTY_FINGERPRINT.antiPatterns },
    perspective: { ...EMPTY_FINGERPRINT.perspective },
    quirks: { ...EMPTY_FINGERPRINT.quirks },
    meta: {
      source: "interview",
      createdAt: new Date().toISOString(),
      confidence: 0.6, // Interview-based fingerprints are moderately confident
    },
  };

  for (const [questionId, answer] of Object.entries(answers)) {
    if (!answer || answer.trim() === "") continue;

    switch (questionId) {
      // Perspective
      case "core-belief":
      case "hill-to-die-on":
        fp.perspective!.believes = [
          ...fp.perspective!.believes,
          answer.trim(),
        ];
        break;
      case "fight-against":
        fp.perspective!.fightsAgainst = [
          ...fp.perspective!.fightsAgainst,
          answer.trim(),
        ];
        break;
      case "reader-relationship":
        if (answer.toLowerCase().includes("peer"))
          fp.perspective!.readerRelationship = "peer";
        else if (answer.toLowerCase().includes("mentor"))
          fp.perspective!.readerRelationship = "mentor";
        else if (answer.toLowerCase().includes("provocateur"))
          fp.perspective!.readerRelationship = "provocateur";
        else if (answer.toLowerCase().includes("guide"))
          fp.perspective!.readerRelationship = "guide";
        else if (answer.toLowerCase().includes("insider"))
          fp.perspective!.readerRelationship = "insider";
        break;
      case "tone":
        if (answer.toLowerCase().includes("optimistic"))
          fp.perspective!.tone = "optimistic";
        else if (answer.toLowerCase().includes("realistic"))
          fp.perspective!.tone = "realistic";
        else if (answer.toLowerCase().includes("contrarian"))
          fp.perspective!.tone = "contrarian";
        else if (answer.toLowerCase().includes("supportive"))
          fp.perspective!.tone = "supportive";
        else if (answer.toLowerCase().includes("challenging"))
          fp.perspective!.tone = "challenging";
        break;

      // Anti-patterns
      case "cringe-words":
      case "overused-hooks":
        fp.antiPatterns!.neverUse = [
          ...fp.antiPatterns!.neverUse,
          ...answer.split(",").map((s) => s.trim().replace(/['"]/g, "")),
        ];
        break;
      case "never-sound-like":
        fp.antiPatterns!.neverSoundLike = [
          ...fp.antiPatterns!.neverSoundLike,
          ...answer.split(".").map((s) => s.trim()).filter(Boolean),
        ];
        break;
      case "avoid-topics":
        fp.antiPatterns!.avoidTopics = [
          ...fp.antiPatterns!.avoidTopics,
          ...answer.split(",").map((s) => s.trim()),
        ];
        break;

      // Signatures
      case "catchphrases":
        fp.signatures!.phrases = answer
          .split(",")
          .map((s) => s.trim().replace(/['"]/g, ""))
          .filter(Boolean);
        break;
      case "post-starts":
        fp.signatures!.openings = [answer.trim()];
        break;
      case "transitions":
        fp.signatures!.transitions = [answer.trim()];
        break;
      case "endings":
        fp.signatures!.closings = [answer.trim()];
        break;

      // Rhythm
      case "sentence-length":
        if (answer.toLowerCase().includes("short")) {
          fp.rhythm!.avgSentenceLength = 8;
          fp.rhythm!.shortPunchFrequency = 0.4;
        } else if (answer.toLowerCase().includes("longer")) {
          fp.rhythm!.avgSentenceLength = 18;
          fp.rhythm!.shortPunchFrequency = 0.15;
        } else {
          fp.rhythm!.avgSentenceLength = 12;
          fp.rhythm!.shortPunchFrequency = 0.25;
        }
        break;
      case "fragments":
        fp.rhythm!.usesFragments = answer.toLowerCase().includes("yes") ||
          answer.toLowerCase().includes("often");
        break;
      case "punctuation":
        fp.rhythm!.usesEmDashes = answer.includes("—") ||
          answer.toLowerCase().includes("em-dash") ||
          answer.toLowerCase().includes("em dash");
        fp.rhythm!.usesParentheticals =
          answer.includes("(") || answer.toLowerCase().includes("parenthes");
        fp.quirks!.punctuationQuirks = [answer.trim()];
        break;

      // Quirks
      case "grammar-breaking":
        fp.quirks!.breaksGrammarRules = answer
          .split(".")
          .map((s) => s.trim())
          .filter(Boolean);
        fp.quirks!.startsSentencesWithConjunctions =
          answer.toLowerCase().includes("and") ||
          answer.toLowerCase().includes("but");
        break;
      case "one-word":
        fp.quirks!.usesOneWordSentences =
          answer.toLowerCase().includes("yes") ||
          answer.toLowerCase().includes("absolutely");
        break;
      case "formatting":
        fp.quirks!.formattingPreferences = answer
          .split(".")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
    }
  }

  return fp;
}

/**
 * Generate a prompt section for voice discovery interview.
 * Used when AI is conducting the interview.
 */
export const VOICE_DISCOVERY_PROMPT = `
## Voice Discovery Interview

You're conducting a voice discovery interview to understand how this person naturally communicates.
Your goal is to extract:
1. Their core beliefs and what they push back against
2. Words and styles they'd NEVER use
3. Their natural rhythm and quirks
4. How they relate to their audience

INTERVIEW APPROACH:
- Be conversational, not clinical
- Listen for patterns in HOW they answer, not just what they say
- If they give a one-word answer, ask for an example
- Look for emotion - what makes them passionate or annoyed reveals voice
- Note any distinctive phrases they use in their responses

KEY QUESTIONS (ask naturally, not as a checklist):
1. "What's something you believe about [their field] that most people get wrong?"
2. "What advice in your space makes you cringe?"
3. "Words or phrases you'd never use?"
4. "When you write, are you a peer, mentor, or provocateur to your reader?"
5. "Do you write in short punchy sentences or longer flowing ones?"

WHAT TO EXTRACT:
- Direct quotes of phrases they use
- Words they explicitly reject
- Their stance (contrarian? supportive? challenging?)
- Rhythm preference (punchy vs. flowing)
- Any quirks mentioned (starting with And, using fragments, etc.)

After the interview, structure findings into a VoiceFingerprint format.
`;
