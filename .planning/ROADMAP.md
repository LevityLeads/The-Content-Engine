# Roadmap: Content Pipeline Automation

**Milestone:** Content Pipeline Automation
**Created:** 2026-01-23
**Depth:** Standard
**Goal:** Trustworthy automated content generation (9/10 posts good without editing)

---

## Overview

This roadmap transforms the content generation pipeline into a trustworthy automated system. The architecture follows a clear principle: **automation is earned, not enabled**. Phases progress from coherent generation, through quality gates and human checkpoints, to earned automation based on demonstrated reliability. Each phase delivers verifiable capability that users can observe and validate.

---

## Phases

### Phase 1: Pipeline Coherence

**Goal:** Generate visually and narratively coherent carousels in a single flow

**Dependencies:** None (foundation phase)

**Requirements:**
- PIPE-01: All-at-once carousel generation
- PIPE-02: Design Context Provider
- PIPE-03: Template-first enforcement

**Success Criteria:**
1. User can generate a complete carousel where all slides share consistent visual style (colors, typography, layout)
2. User can see that narrative arc flows naturally from hook through buildup to CTA across slides
3. User cannot generate slides that violate template layout constraints (AI handles content, templates handle design)
4. User observes same design context applied to all slides without drift or reinterpretation

**Rationale:** Nothing else matters if carousel slides don't look cohesive. This architectural foundation is prerequisite for all downstream quality systems.

**Plans:** 5 plans

Plans:
- [ ] 01-01-PLAN.md — Design Context Provider types and implementation
- [ ] 01-02-PLAN.md — All-at-once carousel prompt system
- [ ] 01-03-PLAN.md — Template-first enforcement updates
- [ ] 01-04-PLAN.md — Wire pipeline (API routes integration)
- [ ] 01-05-PLAN.md — End-to-end verification

---

### Phase 2: Quality Gates

**Goal:** Systematically assess and score content quality before human review

**Dependencies:** Phase 1 (coherent output required for meaningful quality assessment)

**Requirements:**
- QUAL-01: Self-evaluation loop
- QUAL-02: Confidence scoring
- QUAL-03: Brand validation checks

**Success Criteria:**
1. User can see confidence score (0-100%) for each generated carousel reflecting brand alignment, visual consistency, content quality, and platform fit
2. User can observe that low-quality outputs are caught and flagged before appearing in review queue
3. User can verify that content failing brand checks (wrong colors, forbidden words, voice violations) is automatically rejected
4. User can see which specific quality dimensions triggered low scores

**Rationale:** Cannot enable any automation without quality scoring to route content. This phase builds the trust infrastructure that informs all downstream routing decisions.

**Plans:** (created by /gsd:plan-phase)

---

### Phase 3: Human Checkpoints

**Goal:** Route content to appropriate review level based on confidence

**Dependencies:** Phase 2 (confidence scoring required for tiered routing)

**Requirements:**
- CHECK-01: Tiered review routing

**Success Criteria:**
1. User sees content automatically sorted into review queues: auto-approve (90%+), quick glance (75-89%), standard review (60-74%), deep review (<60%)
2. User can approve, reject, or edit content at each tier with appropriate friction (quick approve for high-confidence, required edit for low-confidence)
3. User can override routing and move content between tiers manually

**Rationale:** Establishes quality baseline and demonstrates system reliability before automation. Shadow mode where AI generates but humans approve everything.

**Plans:** (created by /gsd:plan-phase)

---

### Phase 4: Prompts and Voice Hardening

**Goal:** Ensure consistent brand voice that doesn't degrade over time

**Dependencies:** Phase 1 (coherent generation), Phase 3 (checkpoint data informs prompt tuning)

**Requirements:**
- VOICE-01: Claude 4.5 prompt modernization
- VOICE-02: Hook library enhancement

**Success Criteria:**
1. User observes generated content consistently matches brand voice without "AI slop" aesthetic
2. User sees variety in first-slide hooks (no pattern repeated within 2 weeks for same brand)
3. User can verify prompts use explicit instruction style with concrete examples (no aggressive CRITICAL/MUST/NEVER language)
4. User observes stronger scroll-stopping patterns in carousel first slides

**Rationale:** Brand voice drift is the long-term quality killer. Must harden prompts before enabling automation to prevent gradual degradation.

**Plans:** (created by /gsd:plan-phase)

---

### Phase 5: Learning and Feedback

**Goal:** Capture feedback to enable continuous improvement and prevent degradation

**Dependencies:** Phase 3 (checkpoint events to capture), Phase 4 (prompt quality to track)

**Requirements:**
- LEARN-01: Feedback event capture
- LEARN-02: Hook rotation tracking

**Success Criteria:**
1. User can see history of approvals, rejections, edits, and regenerations for any piece of content
2. User can verify that recently-used hooks are deprioritized for subsequent content
3. System tracks approval rate, edit rate, and regeneration rate per brand over time
4. User receives early warning when quality metrics drop below thresholds

**Rationale:** Without learning from failures, the system will degrade over time. Feedback loops are foundation for sustainable automation, not enhancement.

**Plans:** (created by /gsd:plan-phase)

---

### Phase 6: Graduated Automation

**Goal:** Enable auto-approval for high-confidence content with safety nets

**Dependencies:** All previous phases (automation is earned through demonstrated reliability)

**Requirements:**
- AUTO-01: Auto-approval mode
- AUTO-02: Self-healing regeneration

**Success Criteria:**
1. User can enable auto-approval mode where 90%+ confidence content skips review and proceeds to scheduling
2. User can see content automatically regenerate (max 2 attempts) when it fails validation, before routing to human
3. User can disable all automation with one click without losing queued content
4. User maintains visibility into what automation is doing (audit trail of auto-approved posts)
5. User observes 9/10 auto-approved posts require zero edits within 24 hours

**Rationale:** Only after Phases 1-5 demonstrate reliability should automation be enabled. Earned autonomy through proven quality.

**Plans:** (created by /gsd:plan-phase)

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 1 | Pipeline Coherence | PIPE-01, PIPE-02, PIPE-03 | Planned |
| 2 | Quality Gates | QUAL-01, QUAL-02, QUAL-03 | Not Started |
| 3 | Human Checkpoints | CHECK-01 | Not Started |
| 4 | Prompts and Voice Hardening | VOICE-01, VOICE-02 | Not Started |
| 5 | Learning and Feedback | LEARN-01, LEARN-02 | Not Started |
| 6 | Graduated Automation | AUTO-01, AUTO-02 | Not Started |

---

## Coverage Validation

| Requirement | Phase | Mapped |
|-------------|-------|--------|
| PIPE-01 | 1 | Yes |
| PIPE-02 | 1 | Yes |
| PIPE-03 | 1 | Yes |
| QUAL-01 | 2 | Yes |
| QUAL-02 | 2 | Yes |
| QUAL-03 | 2 | Yes |
| CHECK-01 | 3 | Yes |
| VOICE-01 | 4 | Yes |
| VOICE-02 | 4 | Yes |
| LEARN-01 | 5 | Yes |
| LEARN-02 | 5 | Yes |
| AUTO-01 | 6 | Yes |
| AUTO-02 | 6 | Yes |

**Coverage:** 13/13 requirements mapped (100%)

---

## Dependency Graph

```
Phase 1 (Pipeline Coherence)
    |
    v
Phase 2 (Quality Gates)
    |
    v
Phase 3 (Human Checkpoints) -----> Phase 4 (Voice Hardening)
    |                                   |
    v                                   |
Phase 5 (Learning & Feedback) <---------+
    |
    v
Phase 6 (Graduated Automation)
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| 6 phases (not 8) | Research suggested 6 phases; all 13 requirements map cleanly to these natural boundaries |
| Automation is Phase 6 (last) | Cannot earn trust without demonstrating reliability through Phases 1-5 |
| Voice hardening before automation | Brand drift is long-term killer; must harden prompts before enabling hands-off mode |
| Single checkpoint phase | CHECK-01 is the only human checkpoint requirement; keeps phase focused |
| Learning before automation | Feedback loops are foundation for sustainable automation, not enhancement |

---

*Roadmap created: 2026-01-23*
*Phase 1 planned: 2026-01-23*
