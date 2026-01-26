/**
 * Risk Dial Module
 *
 * Controls how bold/safe the content generation should be.
 * Safe = consistent 7/10 (never embarrassing, rarely exceptional)
 * Bold = swing for 9/10 (accept misses for occasional home runs)
 */

export type RiskLevel = "safe" | "balanced" | "bold";

export interface RiskConfig {
  level: RiskLevel;
  label: string;
  description: string;
  promptInstructions: string;
}

/**
 * Risk level configurations with prompt instructions.
 */
export const RISK_LEVELS: Record<RiskLevel, RiskConfig> = {
  safe: {
    level: "safe",
    label: "Safe (7/10 Guaranteed)",
    description: "Consistent, professional content. Never embarrassing, rarely exceptional.",
    promptInstructions: `## Content Mode: SAFE

You are optimizing for consistency and reliability.

### Guidelines
- Stick to proven angles and formats
- Avoid controversial or polarizing takes
- Use established frameworks and conventional wisdom
- Focus on universally applicable advice
- Don't challenge common beliefs
- Maintain professional, neutral tone

### What This Means
- Every piece will be solid, publishable, on-brand
- Nothing will embarrass or alienate
- Nothing will go viral or be exceptionally memorable
- Predictable quality, minimal editing needed

### When to Use Safe Mode
- Client is risk-averse
- High-stakes content (announcements, partnerships)
- Building trust with a new audience
- Corporate/enterprise context

### Output Characteristics
- Conventional opening hooks
- Balanced perspectives
- Safe-to-share content
- No strong opinions that could backfire`,
  },

  balanced: {
    level: "balanced",
    label: "Balanced (Aim for 8/10)",
    description: "Mix of proven and fresh. Some personality, moderate positions.",
    promptInstructions: `## Content Mode: BALANCED

You are mixing reliability with occasional distinctiveness.

### Guidelines
- Take moderate positions on topics
- Include one surprising or unexpected element per piece
- Challenge small assumptions, not core beliefs
- Add personality while staying professional
- Mix proven formats with fresh angles
- One slightly bold statement per piece

### What This Means
- Most pieces will be solid 7-8/10
- Occasional standout pieces
- Low risk of embarrassment
- Some memorable moments

### When to Use Balanced Mode
- Established brand with room to experiment
- Growing audience that appreciates personality
- Building thought leadership gradually

### Output Characteristics
- Hooks with some edge
- Clear point of view (but not extreme)
- Personality without controversy
- Occasional contrarian elements (mild)`,
  },

  bold: {
    level: "bold",
    label: "Bold (Swing for 9/10)",
    description: "Take positions. Be memorable. Accept some misses for home runs.",
    promptInstructions: `## Content Mode: BOLD

You are optimizing for memorability and impact.

### Guidelines
- Take a clear, strong position
- Challenge a common belief (with evidence)
- Say what others in this space won't say
- Be memorable over being safe
- Accept that some people will disagree
- Have a genuine point of view

### What This Means
- Some pieces will be exceptional (9/10)
- Some pieces may miss (5/10)
- Content will be distinctive and memorable
- Will attract fans AND critics
- More editing might be needed

### When to Use Bold Mode
- Building a personal brand
- Differentiating from competitors
- Audience values authenticity over polish
- Willing to polarize to connect deeply

### Important: Bold ≠ Inflammatory

Bold means having a clear, defensible point of view.
It does NOT mean:
- Being offensive or cruel
- Manufacturing controversy for engagement
- Hot takes without substance
- Attacking people (attack ideas instead)

### The Goal

Content that some people LOVE, not content that everyone thinks is "fine."

The best content provokes, inspires, and sometimes ruffles feathers.
Mediocrity never made history.

### Output Characteristics
- Strong opening stance
- Clear "what I believe" statements
- Willingness to disagree with popular advice
- Specific, not hedged
- Memorable over diplomatic`,
  },
};

/**
 * Get prompt instructions for a risk level.
 */
export function getRiskPrompt(level: RiskLevel): string {
  return RISK_LEVELS[level].promptInstructions;
}

/**
 * Get full risk context including all levels for selection.
 */
export function getRiskSelectionContext(): string {
  return `## Risk Level Selection

Choose how bold this content should be:

### Safe (7/10 Guaranteed)
${RISK_LEVELS.safe.description}
- Best for: Risk-averse clients, corporate contexts, high-stakes announcements

### Balanced (Aim for 8/10)
${RISK_LEVELS.balanced.description}
- Best for: Growing brands, thought leadership, professional audiences

### Bold (Swing for 9/10)
${RISK_LEVELS.bold.description}
- Best for: Personal brands, differentiation, building true fans`;
}

/**
 * Examples of safe vs bold takes on the same topic.
 */
export const RISK_EXAMPLES = {
  topic: "Morning routines",
  safe: {
    hook: "A consistent morning routine can improve your productivity.",
    take: "Starting your day with intention helps you focus on what matters.",
    characteristics: "Universally agreeable, no controversy, forgettable",
  },
  balanced: {
    hook: "Most morning routine advice misses one critical thing.",
    take: "The best morning routine is the one you'll actually do - not the 5am cold plunge fantasy.",
    characteristics: "Mild challenge to conventional wisdom, relatable",
  },
  bold: {
    hook: "Morning routines are a distraction from the real problem.",
    take: "Stop optimizing your mornings and start questioning why you dread the rest of your day.",
    take2: "If you need a complex ritual just to face your work, the routine isn't the issue.",
    characteristics: "Challenges the entire premise, memorable, polarizing",
  },
};

/**
 * Validate that bold content has substance (not just controversy).
 */
export function validateBoldContent(text: string): {
  hasSubstance: boolean;
  hasClaim: boolean;
  hasEvidence: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for claims without evidence
  const hasClaim = /I believe|I think|The truth is|The reality is|Here's what|The problem is/i.test(text);
  const hasEvidence = /because|since|research|data|example|for instance|when I|I've seen/i.test(text);

  if (hasClaim && !hasEvidence) {
    warnings.push("Bold claim without supporting evidence or example");
  }

  // Check for inflammatory patterns without substance
  const inflammatory = /stupid|idiots|dumb|everyone is wrong|you're all/i.test(text);
  if (inflammatory) {
    warnings.push("Inflammatory language detected - bold should challenge ideas, not attack people");
  }

  // Check for hedging (which undermines bold mode)
  const hedging = /might be|could be|perhaps|maybe|some people think|it depends/i.test(text);
  if (hedging) {
    warnings.push("Hedging language detected - bold mode should have clear positions");
  }

  return {
    hasSubstance: hasClaim && hasEvidence,
    hasClaim,
    hasEvidence,
    warnings,
  };
}
