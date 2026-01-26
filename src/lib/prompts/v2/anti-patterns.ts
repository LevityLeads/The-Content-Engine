/**
 * Anti-Patterns Module
 *
 * AI detection blacklist and dead patterns that signal manufactured content.
 * These patterns are so overused they now work AGAINST engagement.
 */

/**
 * Words that instantly signal AI-generated content.
 * Based on 2025-2026 research on AI content detection patterns.
 */
export const AI_WORD_BLACKLIST = [
  // Overused AI vocabulary
  "delve",
  "meticulous",
  "meticulously",
  "navigate",
  "navigating",
  "complexities",
  "realm",
  "underpins",
  "ever-evolving",
  "embark",
  "journey",
  "robust",
  "elevate",
  "elevating",
  "unleash",
  "unleashing",
  "cutting-edge",
  "harness",
  "harnessing",
  "foster",
  "fostering",
  "utilize",
  "utilizing",
  "leverage",
  "leveraging",
  "synergy",
  "synergies",
  "paradigm",
  "paradigms",
  "holistic",
  "seamless",
  "seamlessly",
  "pivotal",
  "paramount",
  "multifaceted",
  "groundbreaking",
  "transformative",
  "revolutionize",
  "spearhead",
  "spearheading",
  "orchestrate",
  "orchestrating",
  "streamline",
  "streamlining",
  "optimize",
  "optimizing",
  "bolster",
  "bolstering",
  "underscore",
  "underscoring",
  "plethora",
  "myriad",
  "pivotal",
  "cornerstone",
  "tapestry",
  "interplay",
  "nuanced",
  "bespoke",
  "endeavor",
  "endeavors",
] as const;

/**
 * Phrases that signal AI-generated content.
 * These are so common in AI output they've become red flags.
 */
export const AI_PHRASE_BLACKLIST = [
  // Generic openers
  "In today's fast-paced world",
  "In today's digital age",
  "In today's competitive landscape",
  "In the realm of",
  "In the world of",
  "When it comes to",
  "It's important to note",
  "It's worth noting",
  "It goes without saying",
  "Needless to say",
  "At the end of the day",
  "Moving forward",
  "Going forward",
  "Circle back",
  "Touch base",
  "Deep dive",
  "Low-hanging fruit",
  "Think outside the box",

  // Inflated importance
  "Game changer",
  "Game-changing",
  "Designed to enhance",
  "Unlock the secrets",
  "Unlock your potential",
  "Take your X to the next level",
  "Transform your",
  "Revolutionize your",

  // Hedging patterns
  "It could be argued",
  "Some might say",
  "One could argue",
  "It's safe to say",

  // AI-typical transitions
  "Let's dive in",
  "Let's explore",
  "Let's unpack",
  "Without further ado",
  "First and foremost",
  "Last but not least",

  // Conclusion patterns
  "In conclusion",
  "To sum up",
  "All in all",
  "The bottom line is",
] as const;

/**
 * Hook patterns that are played out and signal "content marketing."
 * These worked in 2020-2023 but now trigger scroll-past behavior.
 */
export const DEAD_HOOKS = [
  // Contrarian templates (overused to death)
  "Most people think X. They're wrong.",
  "Everyone says X. Here's why that's wrong.",
  "The common advice is X. It's terrible advice.",
  "X is a lie. Here's the truth.",

  // Engagement bait labels
  "Hot take:",
  "Unpopular opinion:",
  "Controversial take:",
  "Bold claim:",
  "Truth bomb:",
  "Real talk:",
  "Hard truth:",

  // Excitement performance
  "I'm so excited to announce",
  "I'm thrilled to share",
  "Big news!",
  "Huge announcement!",

  // Question bait
  "Did you know",
  "Have you ever wondered",
  "What if I told you",
  "Want to know the secret",

  // Listicle templates
  "X things that will change your Y",
  "X ways to Y",
  "X secrets to Y",
  "X mistakes you're making",
  "Stop doing X. Start doing Y.",

  // Humble brags
  "After my X-figure Y",
  "Since hitting X followers",
  "When I scaled to X",
] as const;

/**
 * Prompt section to enforce blacklist checking.
 * Include this in all content generation prompts.
 */
export const BLACKLIST_ENFORCEMENT_PROMPT = `## AI Detection Blacklist (ENFORCED)

Before finalizing ANY content, scan for and remove these patterns:

### Banned Words
These words instantly signal AI-generated content. Never use them:
${AI_WORD_BLACKLIST.slice(0, 20).map((w) => `- ${w}`).join("\n")}
...and similar corporate/AI vocabulary.

### Banned Phrases
These phrases are AI tells. Rewrite to avoid them:
${AI_PHRASE_BLACKLIST.slice(0, 10).map((p) => `- "${p}"`).join("\n")}
...and similar filler phrases.

### Dead Hooks
These opening patterns are so overused they now hurt engagement:
${DEAD_HOOKS.slice(0, 8).map((h) => `- "${h}"`).join("\n")}
...and any variation of these templates.

### Self-Check Process
After writing, read each sentence and ask:
1. Does this contain any banned words? → Rewrite with simpler language
2. Does this use a banned phrase? → Delete or rephrase naturally
3. Does the opening match a dead hook template? → Write something original

The goal is content that sounds like a specific person wrote it, not like it came from "AI content mode."`;

/**
 * Check if text contains blacklisted words.
 * Returns array of found violations.
 */
export function findBlacklistedWords(text: string): string[] {
  const lower = text.toLowerCase();
  return AI_WORD_BLACKLIST.filter((word) =>
    lower.includes(word.toLowerCase())
  );
}

/**
 * Check if text contains blacklisted phrases.
 * Returns array of found violations.
 */
export function findBlacklistedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return AI_PHRASE_BLACKLIST.filter((phrase) =>
    lower.includes(phrase.toLowerCase())
  );
}

/**
 * Check if text starts with a dead hook pattern.
 * Returns the matched pattern or null.
 */
export function findDeadHook(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const hook of DEAD_HOOKS) {
    // Check for exact match or template match (X/Y placeholders)
    const pattern = hook
      .toLowerCase()
      .replace(/x/g, "\\w+")
      .replace(/y/g, "\\w+");
    const regex = new RegExp(`^${pattern}`, "i");
    if (regex.test(lower) || lower.startsWith(hook.toLowerCase())) {
      return hook;
    }
  }
  return null;
}

/**
 * Full content audit for AI patterns.
 * Returns object with all violations found.
 */
export function auditForAIPatterns(text: string): {
  words: string[];
  phrases: string[];
  deadHook: string | null;
  isClean: boolean;
} {
  const words = findBlacklistedWords(text);
  const phrases = findBlacklistedPhrases(text);
  const deadHook = findDeadHook(text);

  return {
    words,
    phrases,
    deadHook,
    isClean: words.length === 0 && phrases.length === 0 && deadHook === null,
  };
}
