# Prompt System Redesign Plan

## Executive Summary

This plan overhauls the content generation prompts to produce save-worthy, distinctive content that cuts through the noise. The new system runs **parallel** to the existing prompts, allowing users to choose between "Classic" and "Bold" modes.

### Key Changes

| Current System | New System |
|----------------|------------|
| Configure voice with adjectives | Discover voice from examples + interview |
| Rate content with confidence scores | Gate content with quality tests |
| Categories of hooks | Principles of attention |
| Balance pillars by percentage | Serve the specific reader deeply |
| Play safe (consistent 6/10) | Swing for memorable (accept misses for 9/10) |
| Accept any input | Research mode for thin inputs |

---

## Phase 1: Foundation (New Files)

### 1.1 Create Anti-Patterns Module

**File**: `src/lib/prompts/v2/anti-patterns.ts`

Contains:
- **AI_WORD_BLACKLIST**: Words that signal AI-generated content (delve, meticulous, navigate, robust, elevate, harness, etc.)
- **AI_PHRASE_BLACKLIST**: Phrases that signal AI (In today's fast-paced world, It's important to note, etc.)
- **DEAD_HOOKS**: Opening patterns that are played out (Most people think X, Hot take:, Unpopular opinion:, etc.)
- **BLACKLIST_ENFORCEMENT_PROMPT**: Instructions for AI to self-check and rewrite if any blacklisted items appear

### 1.2 Create Burstiness Module

**File**: `src/lib/prompts/v2/burstiness.ts`

Contains:
- **BURSTINESS_REQUIREMENTS**: Rules for sentence rhythm variation
- **RHYTHM_EXAMPLES**: Before/after examples showing monotonous vs bursty writing
- **SELF_CHECK_INSTRUCTIONS**: How to audit rhythm before finalizing

### 1.3 Create Save-Worthiness Module

**File**: `src/lib/prompts/v2/save-worthiness.ts`

Contains:
- **SAVE_TESTS**: Three tests content must pass (Reference Value, Future-Self, Screenshot)
- **SAVE_WORTHY_FORMATS**: Numbered lists, frameworks, templates, checklists, dense how-tos
- **SAVE_CTA_EXAMPLES**: Effective save-prompting CTAs (Save this for your next X)

### 1.4 Create Risk Dial Module

**File**: `src/lib/prompts/v2/risk-dial.ts`

Contains:
- **RISK_LEVELS**: safe, balanced, bold configurations
- **BOLD_MODE_GUIDANCE**: How to take a position without being inflammatory
- **RISK_EXAMPLES**: Examples of safe vs bold takes on the same topic

---

## Phase 2: Voice System Overhaul

### 2.1 Create Voice Fingerprint Types

**File**: `src/lib/prompts/v2/voice-fingerprint.ts`

```typescript
export interface VoiceFingerprint {
  // Measurable rhythm patterns
  rhythm: {
    avgSentenceLength: number;
    shortPunchFrequency: number;  // How often <6 word sentences appear
    usesFragments: boolean;
    usesEmDashes: boolean;
  };

  // Signature language
  signatures: {
    phrases: string[];           // Phrases they reach for naturally
    openings: string[];          // How they typically start posts
    transitions: string[];       // How they connect ideas
  };

  // Anti-patterns (what they'd never say)
  antiPatterns: {
    neverUse: string[];          // Words/phrases to avoid
    neverSoundLike: string[];    // Example posts that violate the voice
  };

  // Worldview
  perspective: {
    believes: string[];          // Core beliefs driving content
    fightsAgainst: string[];     // What they push back on
    readerRelationship: 'peer' | 'mentor' | 'provocateur' | 'guide';
  };

  // Quirks (deliberate imperfections)
  quirks: {
    startsSentencesWithAnd: boolean;
    usesOneWordSentences: boolean;
    breaksGrammarRules: string[];  // Which rules they break deliberately
  };
}
```

### 2.2 Create Voice Discovery Interview

**File**: `src/lib/prompts/v2/voice-discovery.ts`

When no example posts are provided, run a guided interview:

**Interview Questions**:
1. "What phrase do you find yourself saying all the time when explaining your work?"
2. "What advice do you think is completely wrong but everyone believes?"
3. "When you read other content in your space, what makes you cringe?"
4. "How would your best friend describe the way you explain things?"
5. "What word do you hate and would never use, even if everyone else does?"
6. "Do you talk in short punches or longer flowing thoughts?"
7. "Would you ever start a sentence with 'And' or 'But'?"
8. "What do you believe that not everyone in your industry agrees with?"

**Interview Output**: Generates a VoiceFingerprint from answers.

### 2.3 Create Voice Extraction from Examples

**File**: `src/lib/prompts/v2/voice-extraction.ts`

When example posts ARE provided, analyze them to extract:
- Sentence length distribution
- Recurring phrases
- Opening patterns
- Transition patterns
- Words that never appear (negative space)
- Grammar rules broken
- Perspective indicators

**Extraction Prompt**: AI analyzes 5+ examples and outputs a VoiceFingerprint.

### 2.4 Create Voice-Aware Generation Prompt

**File**: `src/lib/prompts/v2/voice-generation.ts`

Takes a VoiceFingerprint and generates the voice section of the system prompt:
- Converts fingerprint patterns into actionable writing instructions
- Includes positive examples (sound like this)
- Includes negative examples (never sound like this)
- Includes rhythm requirements based on fingerprint

---

## Phase 3: Input Quality System

### 3.1 Create Input Quality Assessment

**File**: `src/lib/prompts/v2/input-quality.ts`

**Assessment Criteria**:
- **Rich**: Contains specific stories, data, unique experiences, or proprietary insight
- **Medium**: Has a topic with some angle but lacks specificity
- **Thin**: Just a keyword/topic with no unique angle

**Assessment Output**:
```typescript
interface InputAssessment {
  quality: 'rich' | 'medium' | 'thin';
  uniqueElements: string[];      // What makes this input special (if anything)
  missingElements: string[];     // What would make it better
  researchDirection?: string;    // If thin, what angle could make it work
}
```

### 3.2 Create Research Mode Prompt

**File**: `src/lib/prompts/v2/research-mode.ts`

When input is thin, AI attempts to find a unique angle:

1. **Identify the generic topic**
2. **Generate 5 potential unique angles**:
   - What contrarian take is defensible here?
   - What specific data would make this concrete?
   - What personal story archetype would work?
   - What common advice is actually wrong?
   - What do experts know that beginners don't?
3. **Select the strongest angle** with reasoning
4. **Flag the content** as "AI-researched angle" so user knows to add personal touch

---

## Phase 4: Ideation System Overhaul

### 4.1 Create New Ideation Prompt

**File**: `src/lib/prompts/v2/ideation-prompt.ts`

**Changes from v1**:

| Removed | Added |
|---------|-------|
| Confidence scores (hookStrength, valueDensity, shareability, platformFit, overall) | Save-worthiness test (pass/fail with reason) |
| Rigid angle categories (curiosity, controversy, confession, contrarian, credibility) | Flexible angle description (what makes this interesting?) |
| Pillar percentages | Reader-focused value description |
| Hook "types" | Hook principles (specificity, surprise, relevance, confidence) |

**New Idea Output Format**:
```json
{
  "ideas": [
    {
      "concept": "Clear description of the idea",
      "whyInteresting": "What makes this worth reading (not a category, an actual reason)",
      "targetReader": "Who specifically will care about this and why",
      "uniqueAngle": "What makes this different from other content on this topic",
      "saveReason": "Why would someone bookmark this? (must be specific)",
      "riskLevel": "safe | balanced | bold",
      "hooks": [
        "Hook option 1 (specific, surprising)",
        "Hook option 2 (different approach)"
      ],
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "platforms": ["instagram", "linkedin"]
    }
  ]
}
```

**Gating Logic**:
- If `saveReason` is generic ("it's valuable"), reject and regenerate
- If hooks use blacklisted patterns, reject and regenerate
- If input was thin, flag idea as needing human insight

---

## Phase 5: Content Generation Overhaul

### 5.1 Create New Content Prompt

**File**: `src/lib/prompts/v2/content-prompt.ts`

**System Prompt Structure**:
1. Core persona (simplified, human-focused)
2. Anti-pattern enforcement (blacklist check)
3. Burstiness requirements (rhythm rules)
4. Save-worthiness requirements (must pass tests)
5. Risk level instructions (based on parameter)
6. Voice fingerprint instructions (from brand)
7. Platform-specific guidance (streamlined)

**New Features**:
- **Blacklist self-check**: Before outputting, scan for AI-tell words/phrases
- **Rhythm audit**: Count sentence lengths, ensure variation
- **Save test**: Explicitly state which save test this passes
- **Bold mode**: If enabled, take a clear position

### 5.2 Create New Carousel Prompt

**File**: `src/lib/prompts/v2/carousel-prompt.ts`

**Changes**:
- Keep narrative arc structure (it's solid)
- Add save-worthiness requirements per slide
- Add burstiness to slide copy
- Strengthen hook slide requirements (no generic "hook" - specific attention mechanism)
- Add "why save this carousel?" gate

---

## Phase 6: Integration

### 6.1 Create V2 Index

**File**: `src/lib/prompts/v2/index.ts`

Exports all v2 modules with clear naming:
- `v2IdeationPrompt`
- `v2ContentPrompt`
- `v2CarouselPrompt`
- `v2VoiceFingerprint`
- `v2VoiceDiscovery`
- etc.

### 6.2 Create Mode Selector

**File**: `src/lib/prompts/mode-selector.ts`

```typescript
export type PromptMode = 'classic' | 'bold';

export function getIdeationPrompt(mode: PromptMode) {
  return mode === 'bold' ? v2IdeationPrompt : v1IdeationPrompt;
}

export function getContentPrompt(mode: PromptMode) {
  return mode === 'bold' ? v2ContentPrompt : v1ContentPrompt;
}
```

### 6.3 Update API Routes

Modify these routes to accept a `mode` parameter:
- `src/app/api/ideas/generate/route.ts`
- `src/app/api/content/generate/route.ts`
- `src/app/api/images/carousel/route.ts`

Default to 'classic' for backwards compatibility. User can opt-in to 'bold'.

### 6.4 Update UI

Add a toggle in the content generation UI:
- **Classic Mode**: "Consistent, professional content"
- **Bold Mode**: "Distinctive, save-worthy content (may need more editing)"

---

## Phase 7: Voice Interview Flow

### 7.1 Create Voice Setup Page

**File**: `src/app/(dashboard)/settings/voice/page.tsx`

When brand has no voice fingerprint:
1. Show interview option OR upload examples option
2. If interview: Walk through 8 questions
3. If examples: Upload 5+ posts, run extraction
4. Preview generated fingerprint
5. User confirms or adjusts
6. Save to `brands.voice_fingerprint` (new column)

### 7.2 Add Database Migration

**File**: `supabase/migrations/XXX_voice_fingerprint.sql`

```sql
ALTER TABLE brands
ADD COLUMN voice_fingerprint JSONB DEFAULT NULL,
ADD COLUMN prompt_mode TEXT DEFAULT 'classic' CHECK (prompt_mode IN ('classic', 'bold'));
```

---

## Implementation Order

### Week 1: Foundation
1. Create `src/lib/prompts/v2/` directory
2. Implement `anti-patterns.ts`
3. Implement `burstiness.ts`
4. Implement `save-worthiness.ts`
5. Implement `risk-dial.ts`

### Week 2: Voice System
1. Implement `voice-fingerprint.ts` (types)
2. Implement `voice-discovery.ts` (interview)
3. Implement `voice-extraction.ts` (from examples)
4. Implement `voice-generation.ts` (fingerprint to prompt)

### Week 3: Input & Ideation
1. Implement `input-quality.ts`
2. Implement `research-mode.ts`
3. Implement v2 `ideation-prompt.ts`
4. Test ideation flow end-to-end

### Week 4: Content Generation
1. Implement v2 `content-prompt.ts`
2. Implement v2 `carousel-prompt.ts`
3. Test content generation end-to-end

### Week 5: Integration
1. Create `mode-selector.ts`
2. Update API routes
3. Create database migration
4. Implement voice setup UI

### Week 6: Testing & Polish
1. Test both modes with real content
2. Compare outputs (classic vs bold)
3. Adjust prompts based on results
4. Documentation

---

## Success Metrics

| Metric | Current (Est.) | Target |
|--------|----------------|--------|
| Save rate | ~1% | 3-4% |
| Distinctiveness (blind test) | 20% identifiable | 60% identifiable |
| Edit time needed | 10 min | 5 min |
| User satisfaction | N/A | 8/10 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Bold mode produces misses | Keep classic mode available; flag bold content for review |
| Voice interview takes too long | Allow skip with default voice; limit to 8 questions |
| Research mode produces generic angles | Always flag AI-researched content; encourage human input |
| Breaking changes | Parallel systems; classic mode unchanged |

---

## Files to Create (Summary)

```
src/lib/prompts/v2/
├── index.ts                 # Exports
├── anti-patterns.ts         # AI blacklist, dead hooks
├── burstiness.ts            # Rhythm requirements
├── save-worthiness.ts       # Save tests
├── risk-dial.ts             # Safe/balanced/bold modes
├── voice-fingerprint.ts     # Types
├── voice-discovery.ts       # Interview flow
├── voice-extraction.ts      # Extract from examples
├── voice-generation.ts      # Fingerprint to prompt
├── input-quality.ts         # Input assessment
├── research-mode.ts         # Thin input handling
├── ideation-prompt.ts       # V2 ideation
├── content-prompt.ts        # V2 content generation
└── carousel-prompt.ts       # V2 carousel

src/lib/prompts/
├── mode-selector.ts         # Choose classic vs bold
└── index.ts                 # Updated exports

src/app/(dashboard)/settings/voice/
└── page.tsx                 # Voice interview UI

supabase/migrations/
└── XXX_voice_fingerprint.sql  # New columns
```

---

## Approval Request

This plan creates a parallel "Bold" prompt system that:
1. Rejects AI-detectable patterns
2. Enforces human-like sentence rhythm
3. Gates content on save-worthiness
4. Discovers voice from examples or interview
5. Handles thin inputs with research mode
6. Lets users dial up risk for 9/10 swings

The existing "Classic" system remains unchanged and available.

Ready to implement?
