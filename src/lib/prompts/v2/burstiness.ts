/**
 * Burstiness Module
 *
 * Enforces human-like sentence rhythm variation.
 * AI content has monotonous rhythm (similar sentence lengths).
 * Human content has "burstiness" - varied rhythm with short punches and longer flows.
 */

/**
 * Sentence rhythm requirements for human-sounding content.
 */
export const BURSTINESS_REQUIREMENTS = `## Sentence Rhythm (Critical for Human Feel)

AI content has monotonous rhythm - similar sentence lengths throughout.
Human content varies wildly. This variation is called "burstiness."

### Rules

1. **Never write 3+ sentences of similar length in a row.**
   - If you wrote two 10-word sentences, the next must be notably shorter or longer.

2. **Every paragraph needs at least one short punch (<6 words).**
   - These create emphasis and breathing room.
   - Examples: "That's it." / "Here's the thing." / "It works."

3. **After a long sentence (20+ words), follow with a short one.**
   - Long sentences build complexity; short sentences punch.

4. **Fragments are allowed. Use them.**
   - "Not perfect. But real."
   - "The result? Exactly what we needed."

5. **Vary your opening patterns.**
   - Don't start 3 sentences in a row with "The" or "This" or "I"

### Example: BAD (Monotonous)

"Productivity is important for achieving success. Many people struggle with staying focused. There are several techniques that can help. Consider trying the Pomodoro method."

Why it fails: All sentences are 5-7 words. Same rhythm. Feels robotic.

### Example: GOOD (Bursty)

"Productivity isn't the point. Getting the right things done is. Most advice misses this completely, focusing on doing more when the real question is: what actually matters? Three things. That's your limit for the day. Pick them. Protect them. Ignore everything else."

Why it works: Sentence lengths vary (4, 7, 22, 2, 7, 2, 2, 3). Mix of punches and flows. Feels human.

### Self-Check

Read it aloud. Does it have rhythm? Does it breathe?
Or does it drone at the same pace throughout?

If it drones, break it up. Add punches. Vary the flow.`;

/**
 * Rhythm examples showing before/after transformation.
 */
export const RHYTHM_EXAMPLES = {
  bad: {
    text: `Productivity is important for achieving success. Many people struggle with staying focused. There are several techniques that can help. Consider trying the Pomodoro method. This technique involves working in intervals. You work for 25 minutes then take a break.`,
    analysis: "All sentences 5-8 words. No variation. Monotonous.",
    sentenceLengths: [5, 6, 7, 5, 6, 8],
  },
  good: {
    text: `Productivity isn't the point.

Getting the right things done is.

Most advice misses this completely, focusing on doing more when the real question is: what actually matters?

Three things. That's your limit for the day.

Pick them. Protect them. Ignore everything else.`,
    analysis: "Lengths vary wildly (4, 7, 22, 2, 7, 2, 2, 3). Has rhythm.",
    sentenceLengths: [4, 7, 22, 2, 7, 2, 2, 3],
  },
};

/**
 * Calculate sentence lengths from text.
 */
export function getSentenceLengths(text: string): number[] {
  // Split on sentence endings, filter empty
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences.map((s) => s.split(/\s+/).length);
}

/**
 * Calculate burstiness score (variance in sentence lengths).
 * Higher = more human-like variation.
 */
export function calculateBurstiness(sentenceLengths: number[]): number {
  if (sentenceLengths.length < 2) return 0;

  const mean =
    sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance =
    sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
    sentenceLengths.length;

  return Math.sqrt(variance); // Standard deviation
}

/**
 * Check for monotonous sequences (3+ similar lengths in a row).
 */
export function findMonotonousSequences(
  sentenceLengths: number[]
): { start: number; length: number }[] {
  const sequences: { start: number; length: number }[] = [];
  const SIMILARITY_THRESHOLD = 3; // Words difference to count as "similar"

  let sequenceStart = 0;
  let sequenceLength = 1;

  for (let i = 1; i < sentenceLengths.length; i++) {
    const diff = Math.abs(sentenceLengths[i] - sentenceLengths[i - 1]);

    if (diff <= SIMILARITY_THRESHOLD) {
      sequenceLength++;
    } else {
      if (sequenceLength >= 3) {
        sequences.push({ start: sequenceStart, length: sequenceLength });
      }
      sequenceStart = i;
      sequenceLength = 1;
    }
  }

  // Check final sequence
  if (sequenceLength >= 3) {
    sequences.push({ start: sequenceStart, length: sequenceLength });
  }

  return sequences;
}

/**
 * Check if content has enough short punches (<6 words).
 * Returns ratio of short sentences to total.
 */
export function shortPunchRatio(sentenceLengths: number[]): number {
  if (sentenceLengths.length === 0) return 0;
  const shortCount = sentenceLengths.filter((len) => len < 6).length;
  return shortCount / sentenceLengths.length;
}

/**
 * Full rhythm audit for content.
 */
export function auditRhythm(text: string): {
  sentenceLengths: number[];
  burstiness: number;
  monotonousSequences: { start: number; length: number }[];
  shortPunchRatio: number;
  isHealthy: boolean;
  feedback: string[];
} {
  const lengths = getSentenceLengths(text);
  const burstinessScore = calculateBurstiness(lengths);
  const monotonous = findMonotonousSequences(lengths);
  const punchRatio = shortPunchRatio(lengths);

  const feedback: string[] = [];

  // Check burstiness (want > 4 for good variation)
  if (burstinessScore < 4) {
    feedback.push(
      `Low rhythm variation (${burstinessScore.toFixed(1)}). Add more variety in sentence lengths.`
    );
  }

  // Check for monotonous sequences
  if (monotonous.length > 0) {
    feedback.push(
      `Found ${monotonous.length} monotonous sequence(s). Break up similar-length sentences.`
    );
  }

  // Check for short punches (want at least 20%)
  if (punchRatio < 0.2) {
    feedback.push(
      `Only ${Math.round(punchRatio * 100)}% short punches. Add more brief sentences for emphasis.`
    );
  }

  return {
    sentenceLengths: lengths,
    burstiness: burstinessScore,
    monotonousSequences: monotonous,
    shortPunchRatio: punchRatio,
    isHealthy: feedback.length === 0,
    feedback,
  };
}

/**
 * Prompt section for rhythm requirements.
 * Include this in content generation prompts.
 */
export const RHYTHM_PROMPT_SECTION = BURSTINESS_REQUIREMENTS;
