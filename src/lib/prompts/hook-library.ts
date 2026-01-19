/**
 * Hook Library
 *
 * Proven hook patterns that stop the scroll and create engagement.
 * These are frameworks to adapt, not templates to copy verbatim.
 */

export const HOOK_PATTERNS = {
  // Contrarian hooks challenge conventional wisdom
  contrarian: [
    "Most people think [common belief]. They're wrong.",
    "Unpopular opinion: [contrarian take]",
    "[Common advice] is terrible advice. Here's why:",
    "Stop [common action]. It's killing your [result].",
    "Everyone's doing [thing]. Almost everyone's wrong.",
    "The [industry] industry lied to you about [topic].",
    "[Number]% of [group] get this wrong:",
    "I used to believe [common belief]. Then I learned [insight].",
  ],

  // Curiosity hooks create open loops that must be closed
  curiosity: [
    "I spent [time] studying [topic]. Here's what nobody talks about:",
    "There's a reason [successful people] all do [thing].",
    "The real reason [unexpected thing] works:",
    "What [expert/company] knows that you don't:",
    "I analyzed [number] [things]. The pattern was shocking.",
    "The [thing] that changed everything for me:",
    "Here's what happens when you [action]:",
    "The secret behind [impressive result]:",
  ],

  // Number hooks promise specific, scannable value
  numbers: [
    "[Number] [things] that will [benefit] (backed by [proof]):",
    "[Number] signs you're [problem]:",
    "[Number] [things] I wish I knew [time period] ago:",
    "[Number] mistakes killing your [goal]:",
    "[Number]-step framework for [result]:",
    "I've [done thing] [number] times. Here's what works:",
    "[Number] [things] separating [top performers] from everyone else:",
    "The [number]-second rule for [topic]:",
  ],

  // Story hooks use narrative tension
  story: [
    "Last [time period], I [unexpected action]. Here's what happened:",
    "I almost [dramatic thing]. Then [turning point].",
    "My biggest failure taught me [lesson]:",
    "[Time] ago, I was [relatable struggle]. Today, [transformation].",
    "Someone asked me [question]. My answer surprised them:",
    "I got this advice from [credible source]: [advice]",
    "The moment I realized [insight]:",
    "I was wrong about [topic]. Here's my new take:",
  ],

  // Question hooks trigger self-reflection
  question: [
    "Why do [successful people] always [action]?",
    "What if [assumption] was completely backwards?",
    "Ever wonder why [observation]?",
    "What's the difference between [good] and [great]?",
    "Why does [counterintuitive thing] actually work?",
    "Are you making this [topic] mistake?",
    "What would change if you [hypothetical]?",
    "How do [top performers] [achieve result] so consistently?",
  ],

  // Direct value hooks promise immediate benefit
  directValue: [
    "Steal this [thing] I use for [benefit]:",
    "The exact [framework/template/process] I use to [result]:",
    "How to [achieve result] in [timeframe]:",
    "A simple way to [benefit] (that actually works):",
    "The [thing] that [percentage]% improvement in [metric]:",
    "Copy this [thing] for better [result]:",
    "The fastest way to [achieve goal]:",
    "If you [struggle], read this:",
  ],

  // Challenge hooks provoke engagement
  challenge: [
    "Hot take: [bold statement]",
    "This might be controversial, but [opinion]:",
    "I'll probably get hate for this, but [truth bomb]:",
    "Agree or disagree: [debatable statement]",
    "[Common thing] is overrated. [Alternative] is underrated.",
    "The uncomfortable truth about [topic]:",
    "Nobody wants to admit this about [topic]:",
    "Why [popular thing] might be hurting you:",
  ],

  // Credibility hooks leverage proof and authority
  credibility: [
    "After [impressive experience], here's what I've learned:",
    "I've [relevant achievement]. Here's the playbook:",
    "[Impressive number] later, here's what actually matters:",
    "Working with [impressive clients/companies] taught me:",
    "The strategy that got me from [before] to [after]:",
    "What [number] [years/projects/clients] taught me about [topic]:",
    "I've seen this work [number] times:",
    "This is what [success metric] looks like:",
  ],
};

export const HOOK_GUIDELINES = `## Hook Creation Guidelines

### The 3-Word Rule
The first 3 words must accomplish one of these:
1. Create immediate curiosity ("I was wrong...")
2. Challenge a belief ("Stop doing X...")
3. Promise specific value ("7 frameworks that...")
4. Trigger self-identification ("If you struggle...")

### Hook Quality Checklist
- [ ] Would this make YOU stop scrolling?
- [ ] Does it create an open loop that demands closure?
- [ ] Is it specific enough to be believable?
- [ ] Does it avoid clickbait clichés?
- [ ] Would someone feel compelled to read on?

### Platform-Specific Hook Adaptations

**Twitter/X:**
- Front-load the hook (no build-up)
- Use line breaks for emphasis
- Can be more provocative
- Questions work well as quote-tweet bait

**LinkedIn:**
- Story hooks perform best
- Credibility signals matter more
- Avoid being too casual
- The hook must appear before "see more"

**Instagram:**
- Hook goes in the caption AND slide 1
- Visual hook on slide 1 can be text-based
- Carousel slide 1 should create curiosity about slide 2
- Never put value on slide 1—only tension

### Anti-Patterns to Avoid
- "I'm so excited to announce..." (nobody cares about your emotions)
- "Did you know..." (overused, weak)
- Starting with a hashtag (kills engagement)
- Generic affirmations ("Believe in yourself!")
- Anything that sounds AI-generated or templated
- Excessive punctuation or emojis in hooks (!!!! or multiple emojis)`;

export const getHooksByType = (type: keyof typeof HOOK_PATTERNS): string[] => {
  return HOOK_PATTERNS[type] || [];
};

export const getAllHooks = (): string[] => {
  return Object.values(HOOK_PATTERNS).flat();
};

export const HOOK_TYPES = Object.keys(HOOK_PATTERNS) as (keyof typeof HOOK_PATTERNS)[];
