/**
 * Save-Worthiness Module
 *
 * Gates content on whether it's worth saving/bookmarking.
 * Saves are weighted 3x stronger than likes in algorithms.
 * Content that gets saved has lasting value, not just momentary appeal.
 */

/**
 * The three tests for save-worthy content.
 * Content must pass at least ONE to be worth posting.
 */
export const SAVE_TESTS = {
  referenceValue: {
    name: "Reference Value Test",
    question: "Would someone pull this up on their phone while doing something?",
    passesIf: [
      "Contains numbered steps they'd follow",
      "Has a framework they'd apply",
      "Includes a template they'd copy",
      "Has specific data they'd cite",
      "Contains a checklist they'd use",
    ],
  },
  futureSelf: {
    name: "Future-Self Test",
    question: "Is this useful for a specific future moment?",
    passesIf: [
      "Solves a problem they'll face again",
      "Contains information too dense for one read",
      "Has value that increases with re-reading",
      "Answers a question they'll ask themselves later",
    ],
  },
  screenshot: {
    name: "Screenshot Test",
    question: "Would someone screenshot and send this to a friend?",
    passesIf: [
      "Contains a quotable insight",
      "Makes a point they'd want to share",
      "Has a visual they'd want to reference",
      "Summarizes something complex simply",
    ],
  },
} as const;

/**
 * Formats that naturally drive saves.
 */
export const SAVE_WORTHY_FORMATS = [
  "Numbered step-by-step guides",
  "Frameworks with clear labels",
  "Templates with fill-in blanks",
  "Checklists for specific situations",
  "Data compilations (stats, benchmarks)",
  "Tool/resource lists",
  "Decision matrices",
  "Before/after breakdowns",
  "Comparison charts",
  "Troubleshooting guides",
] as const;

/**
 * CTAs that prompt saving behavior.
 * These work because they prime the "future self" mindset.
 */
export const SAVE_CTAS = [
  "Save this for your next [specific situation]",
  "Bookmark before you forget",
  "Save now, thank yourself later",
  "Keep this for when you need it",
  "You'll want this reference later",
  "Come back to this for [specific moment]",
  "Save this before your next [event]",
  "Bookmark this checklist",
] as const;

/**
 * Full prompt section for save-worthiness requirements.
 */
export const SAVE_WORTHINESS_PROMPT = `## The Save Test (REQUIRED)

Saves are weighted 3x stronger than likes in algorithms.
Content that gets saved has lasting value, not just momentary appeal.

Before finalizing content, it MUST pass at least ONE of these tests:

### Test 1: Reference Value
Would someone pull this up on their phone while doing something?

Passes if it contains:
- [ ] Numbered steps they'd follow
- [ ] A framework they'd apply
- [ ] A template they'd copy
- [ ] Specific data they'd cite
- [ ] A checklist they'd use

### Test 2: Future-Self
Is this useful for a specific future moment?

Passes if:
- [ ] It solves a problem they'll face again
- [ ] It contains too much value for one read
- [ ] It answers a question they'll ask later

### Test 3: Screenshot
Would someone screenshot and send this to a friend?

Passes if:
- [ ] It contains a quotable insight
- [ ] It makes a point worth sharing
- [ ] It summarizes something complex simply

### If Content Fails ALL Tests

Do NOT post generic content. Instead:
1. Add numbered elements (steps, tips, rules)
2. Include a framework or template
3. Add specific, extractable data
4. Make at least one point quotably sharp

### Save-Optimized Formats

These naturally drive saves:
- Step-by-step guides
- Frameworks with labels
- Templates with blanks to fill
- Checklists
- Data compilations
- Tool/resource lists
- Comparison charts

### Save-Prompting CTAs

Include one of these when appropriate:
- "Save this for your next [specific situation]"
- "Bookmark before you forget"
- "You'll want this reference later"
- "Come back to this for [specific moment]"

### The Bottom Line

Ask: "Is this so useful that someone would save it to reference later?"

If the answer is "no" or "maybe" - it needs more specific, extractable value.`;

/**
 * Check if content mentions save-worthy elements.
 * Returns which tests the content likely passes.
 */
export function assessSaveWorthiness(text: string): {
  passesReferenceValue: boolean;
  passesFutureSelf: boolean;
  passesScreenshot: boolean;
  likelyPassesAny: boolean;
  suggestions: string[];
} {
  const lower = text.toLowerCase();

  // Check for numbered elements (reference value)
  const hasNumbers = /\b[1-9]\.|step\s*[1-9]|#[1-9]|\bfirst\b.*\bsecond\b|\btip\s*[1-9]/i.test(text);
  const hasFramework = /framework|method|system|formula|template|checklist/i.test(lower);
  const hasData = /\d+%|\$\d+|\d+x|\d+\s*(hours?|days?|weeks?|minutes?)/i.test(text);

  // Check for quotable insights (screenshot test)
  const hasQuotable = text.split(/[.!?]/).some((sentence) => {
    const words = sentence.trim().split(/\s+/).length;
    return words >= 5 && words <= 15; // Quotable length
  });

  // Check for future-self triggers
  const hasFutureTrigger = /save this|bookmark|reference|later|next time|when you|before your/i.test(lower);

  const passesReferenceValue = hasNumbers || hasFramework || hasData;
  const passesFutureSelf = hasFutureTrigger || hasFramework;
  const passesScreenshot = hasQuotable;

  const suggestions: string[] = [];

  if (!passesReferenceValue) {
    suggestions.push("Add numbered elements, a framework, or specific data for reference value");
  }
  if (!passesFutureSelf && !hasFutureTrigger) {
    suggestions.push("Add a save-prompting CTA or frame content for future use");
  }
  if (!passesScreenshot) {
    suggestions.push("Include at least one quotably sharp insight (5-15 words)");
  }

  return {
    passesReferenceValue,
    passesFutureSelf,
    passesScreenshot,
    likelyPassesAny: passesReferenceValue || passesFutureSelf || passesScreenshot,
    suggestions,
  };
}

/**
 * Identify which save-worthy format the content uses (if any).
 */
export function identifySaveFormat(text: string): string | null {
  const lower = text.toLowerCase();

  if (/step\s*[1-9]|\bsteps?\b.*:|\b[1-9]\.\s/i.test(text)) {
    return "step-by-step guide";
  }
  if (/framework|method|system|formula/i.test(lower)) {
    return "framework";
  }
  if (/template|fill in|blank/i.test(lower)) {
    return "template";
  }
  if (/checklist|check\s*list|\[\s*\]/i.test(lower)) {
    return "checklist";
  }
  if (/\d+%.*\d+%|\d+\s*vs\s*\d+/i.test(text)) {
    return "data compilation";
  }
  if (/tools?|resources?|apps?/i.test(lower) && /\b[1-9]\b|\blist\b/i.test(lower)) {
    return "resource list";
  }

  return null;
}
