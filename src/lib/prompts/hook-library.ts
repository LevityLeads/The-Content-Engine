/**
 * Hook Principles
 *
 * Guidelines for writing good opening lines - principles, not templates.
 * Templates are recognizable and feel manufactured. Principles guide authentic writing.
 */

export const HOOK_PATTERNS = {
  // These are EXAMPLES of approaches, not templates to fill in
  // The goal is understanding WHY these work, not copying the format

  contrarian: [
    // Works because: challenges something the reader believes
    // Don't use: "Most people think X. They're wrong." (overused)
    // Do: Find a genuine belief you disagree with and explain why naturally
  ],

  curiosity: [
    // Works because: creates a gap between what reader knows and wants to know
    // Don't use: "The secret to..." "What nobody tells you about..."
    // Do: Share something genuinely surprising or counterintuitive
  ],

  numbers: [
    // Works because: specific = credible, and promises scannable value
    // Don't use: "7 ways to..." (generic)
    // Do: Use numbers when you actually have that many distinct points
  ],

  story: [
    // Works because: humans are wired for narrative
    // Don't use: Obviously manufactured stories with perfect arcs
    // Do: Share real moments, including the messy parts
  ],

  question: [
    // Works because: triggers self-reflection
    // Don't use: Rhetorical questions with obvious answers
    // Do: Ask something the reader will genuinely want to think about
  ],

  directValue: [
    // Works because: clear benefit, no mystery
    // Don't use: Over-promising ("This will change everything")
    // Do: Be specific about what they'll learn and deliver on it
  ],

  challenge: [
    // Works because: stakes a position people can react to
    // Don't use: "Hot take:" "Unpopular opinion:" (these are cliches now)
    // Do: Just state your opinion directly without the preamble
  ],

  credibility: [
    // Works because: proof creates trust
    // Don't use: Humble brags ("After my 7-figure exit...")
    // Do: Share relevant experience when it genuinely adds context
  ],
};

export const HOOK_GUIDELINES = `## Writing Good Openings

### What Makes People Keep Reading

**Specificity.** "I lost $50,000 on a bad hire" is more compelling than "Hiring mistakes are expensive."

**Surprise.** Something unexpected or counterintuitive. Not manufactured controversy - genuine insight.

**Relevance.** It connects to something the reader cares about or struggles with.

**Confidence.** You sound like you have something worth saying, not like you're trying to get attention.

### What Doesn't Work Anymore

These patterns are so common they now signal "this is content":
- "Most people think X. They're wrong."
- "Hot take:" / "Unpopular opinion:"
- "I'm so excited to announce..."
- "Did you know..."
- "[Number] things that will change your [outcome]"
- "Stop doing X. Start doing Y."
- Any opening with multiple exclamation points or emojis

### The Real Test

Read your opening line. Does it sound like something a real person would say? Or does it sound like a content template?

If it sounds like a template, write it differently. Say what you actually want to say, the way you'd actually say it.`;

export const getHooksByType = (type: keyof typeof HOOK_PATTERNS): string[] => {
  return HOOK_PATTERNS[type] || [];
};

export const getAllHooks = (): string[] => {
  return Object.values(HOOK_PATTERNS).flat();
};

export const HOOK_TYPES = Object.keys(HOOK_PATTERNS) as (keyof typeof HOOK_PATTERNS)[];
