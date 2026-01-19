/**
 * Content Pillars System
 *
 * A framework for creating balanced, strategic content that serves
 * different purposes and keeps audiences engaged long-term.
 */

export const CONTENT_PILLARS = {
  educate: {
    name: "Educate",
    description: "Teach something valuable that positions you as an expert",
    purpose: "Build authority and trust through genuine value delivery",
    triggers: ["save", "share"],
    formats: ["carousel", "thread", "how-to post", "framework breakdown"],
    examples: [
      "Step-by-step tutorials",
      "Framework breakdowns",
      "Industry insights",
      "Data-driven analysis",
      "Common mistakes exposed",
      "Best practices guides",
    ],
    qualitySignals: [
      "Would someone bookmark this to reference later?",
      "Does this teach something actionable?",
      "Is this insight non-obvious?",
    ],
  },

  entertain: {
    name: "Entertain",
    description: "Create content that sparks joy, surprise, or emotional response",
    purpose: "Build likability and shareability through emotional connection",
    triggers: ["share", "comment", "like"],
    formats: ["meme", "hot take", "observation", "story", "behind-the-scenes"],
    examples: [
      "Industry humor and memes",
      "Relatable observations",
      "Surprising facts",
      "Day-in-the-life content",
      "Hot takes (strategic controversy)",
      "Trend commentary",
    ],
    qualitySignals: [
      "Would someone tag a friend in this?",
      "Does this make people feel something?",
      "Is this genuinely funny/surprising, not forced?",
    ],
  },

  engage: {
    name: "Engage",
    description: "Create content designed to spark conversation and community",
    purpose: "Build relationships and gather insights through interaction",
    triggers: ["comment", "reply", "discussion"],
    formats: ["question post", "poll", "debate prompt", "opinion request"],
    examples: [
      "Thought-provoking questions",
      "Polls on industry topics",
      "This or that comparisons",
      "Unpopular opinion prompts",
      "Experience sharing requests",
      "Advice requests",
    ],
    qualitySignals: [
      "Would you personally reply to this?",
      "Does this invite genuine discussion?",
      "Is the question specific enough to answer meaningfully?",
    ],
  },

  establish: {
    name: "Establish",
    description: "Content that builds credibility and demonstrates expertise",
    purpose: "Position as authority through proof, results, and unique perspective",
    triggers: ["follow", "trust", "credibility"],
    formats: ["case study", "results post", "lessons learned", "prediction"],
    examples: [
      "Client/project results",
      "Personal achievements (humble)",
      "Lessons from failures",
      "Industry predictions",
      "Behind-the-scenes of wins",
      "Unique methodology reveals",
    ],
    qualitySignals: [
      "Does this build trust without bragging?",
      "Are the results/claims believable and specific?",
      "Does this show, not just tell?",
    ],
  },
};

export const PILLAR_BALANCE_GUIDE = `## Content Pillar Strategy

### Recommended Balance
- **Educate**: 40% - Your primary value delivery
- **Entertain**: 20% - Keeps things fresh and shareable
- **Engage**: 20% - Builds community and provides feedback
- **Establish**: 20% - Builds authority without constant self-promotion

### Why Balance Matters
- Too much Educate = Feels like a textbook
- Too much Entertain = Not taken seriously
- Too much Engage = Seems like you have no point of view
- Too much Establish = Comes across as bragging

### Pillar Combinations (Advanced)
The best content often combines pillars:
- **Educate + Entertain**: Tutorials with humor
- **Engage + Educate**: Questions that teach through discussion
- **Establish + Educate**: Case studies that teach frameworks
- **Entertain + Establish**: Behind-the-scenes of wins

### Platform Pillar Preferences

**Twitter/X:**
- Entertain and Engage perform best
- Educational threads for deep value
- Establish through consistent hot takes

**LinkedIn:**
- Educate and Establish dominate
- Engage through professional questions
- Entertain cautiously (professional humor only)

**Instagram:**
- Educate via carousels
- Entertain through Reels/Stories
- Establish through polished results content
- Engage via Stories polls/questions`;

export const CONTENT_ANGLES = {
  curiosity: {
    name: "Curiosity",
    description: "Create an open loop that must be closed",
    trigger: "The brain cannot stand unresolved tension",
    example: "There's a reason top performers never check email first thing...",
  },
  controversy: {
    name: "Controversy",
    description: "Challenge conventional wisdom or popular opinion",
    trigger: "People engage to defend their beliefs or explore new ones",
    example: "Hustle culture is a scam. Here's what actually builds wealth.",
  },
  confession: {
    name: "Confession",
    description: "Share vulnerable truth or admission of mistake",
    trigger: "Authenticity creates connection and trust",
    example: "I lost my biggest client by making this rookie mistake.",
  },
  contrarian: {
    name: "Contrarian",
    description: "Take the opposite position to mainstream advice",
    trigger: "Differentiation creates intrigue and authority",
    example: "Stop networking. Build skills instead. The network will come.",
  },
  credibility: {
    name: "Credibility",
    description: "Lead with proof, results, or unique experience",
    trigger: "Specific results create trust and FOMO",
    example: "After 1,000 sales calls, here's the opener that works best.",
  },
};

export const ANGLE_GUIDELINES = `## Choosing the Right Angle

### When to Use Each Angle

**Curiosity**: When you have a non-obvious insight to share
**Controversy**: When you genuinely disagree with common practice
**Confession**: When vulnerability serves the teaching
**Contrarian**: When mainstream advice is actually wrong
**Credibility**: When you have genuine proof to leverage

### Angle + Pillar Matrix

| Angle | Best Pillar | Why |
|-------|-------------|-----|
| Curiosity | Educate | Hooks them in, delivers value |
| Controversy | Engage | Creates discussion and shares |
| Confession | Establish | Builds trust through vulnerability |
| Contrarian | Educate | Teaches by challenging assumptions |
| Credibility | Establish | Proof-based authority building |

### Red Flags by Angle

**Curiosity**: Don't create false tension (clickbait)
**Controversy**: Don't be inflammatory just for engagement
**Confession**: Don't manufacture vulnerability
**Contrarian**: Don't disagree without substance
**Credibility**: Don't humble-brag`;

export type ContentPillar = keyof typeof CONTENT_PILLARS;
export type ContentAngle = keyof typeof CONTENT_ANGLES;

export const getPillarByName = (name: ContentPillar) => CONTENT_PILLARS[name];
export const getAngleByName = (name: ContentAngle) => CONTENT_ANGLES[name];
