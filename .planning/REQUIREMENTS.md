# Requirements: Content Pipeline Automation

**Milestone:** Content Pipeline Automation
**Created:** 2026-01-23
**Goal:** Trustworthy automated content generation (9/10 posts good without editing)

---

## v1 Requirements

### Pipeline Coherence

- [ ] **PIPE-01**: All-at-once carousel generation — Generate complete carousel (narrative arc + all slide content) in single Claude call to maintain coherence
- [ ] **PIPE-02**: Design Context Provider — Compute visual design context (colors, typography, spacing, style) once and flow to all downstream components
- [ ] **PIPE-03**: Template-first enforcement — Templates define layout constraints that AI cannot violate; AI handles content, templates handle design

### Quality Gates

- [ ] **QUAL-01**: Self-evaluation loop — Claude critiques its own output against quality rubrics before returning; catches issues before user sees them
- [ ] **QUAL-02**: Confidence scoring — AI rates each output on brand alignment, visual consistency, content quality, platform fit; produces composite score for routing
- [ ] **QUAL-03**: Brand validation checks — Automated pre-publish checks verify voice adherence, color compliance, typography rules, visual coherence

### Human Checkpoints

- [ ] **CHECK-01**: Tiered review routing — Route content to appropriate review level based on confidence score:
  - 90%+ → Auto-approve queue
  - 75-89% → Quick glance review
  - 60-74% → Standard review
  - <60% → Deep review or regeneration

### Automation

- [ ] **AUTO-01**: Auto-approval mode — High-confidence content (90%+) can skip human review and proceed to scheduling/publishing
- [ ] **AUTO-02**: Self-healing regeneration — When content fails validation, automatically regenerate with adjusted parameters (max 2 attempts) before routing to human

### Prompts & Voice

- [ ] **VOICE-01**: Claude 4.5 prompt modernization — Update all prompts to explicit instruction style; remove aggressive language patterns (CRITICAL, MUST, NEVER); add concrete examples
- [ ] **VOICE-02**: Hook library enhancement — Strengthen scroll-stopping patterns for carousel first slides; add variety and rotation tracking

### Learning & Feedback

- [ ] **LEARN-01**: Feedback event capture — Track every approval, rejection, edit, and regeneration with timestamps and context for continuous improvement
- [ ] **LEARN-02**: Hook rotation tracking — Track which hooks have been used recently; avoid repetition across content for same brand

---

## v2 Requirements (Deferred)

### Pipeline Enhancements
- [ ] Shared background architecture — Single AI-generated background composited across all carousel slides
- [ ] Reference image passing — Pass previous slide images to Gemini for multi-slide consistency
- [ ] Drift detection — Programmatic check for visual divergence across carousel slides

### Quality Enhancements
- [ ] JSON schema validation — Structured output enforcement to eliminate parsing failures
- [ ] Quality metrics dashboard — Approval rates, edit frequency, confidence calibration visualization

### Checkpoint Enhancements
- [ ] Preview queue with veto — 30-minute delay before auto-publish with one-click override
- [ ] Edit tracking — Track what humans change for learning signal
- [ ] Shadow mode — Run automation but require approval to build trust baseline

### Voice Enhancements
- [ ] Few-shot brand examples — Include 2-3 approved examples in every prompt
- [ ] Storytelling frameworks — Add narrative structures (Hook→Problem→Solution→CTA, listicles, step-by-step)

---

## Out of Scope

- **New external services** — Stay on current stack (Claude, Gemini, Supabase, Next.js)
- **Analytics dashboard** — Performance metrics are a separate milestone
- **Team collaboration** — Multi-user features not in this milestone
- **Cross-client content sharing** — Brand voice contamination risk
- **Unlimited auto-regeneration** — Max 2 attempts to avoid masking strategy problems
- **Fully autonomous mode** — Users must always have override capability

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PIPE-01 | Phase 1: Pipeline Coherence | Pending |
| PIPE-02 | Phase 1: Pipeline Coherence | Pending |
| PIPE-03 | Phase 1: Pipeline Coherence | Pending |
| QUAL-01 | Phase 2: Quality Gates | Pending |
| QUAL-02 | Phase 2: Quality Gates | Pending |
| QUAL-03 | Phase 2: Quality Gates | Pending |
| CHECK-01 | Phase 3: Human Checkpoints | Pending |
| VOICE-01 | Phase 4: Prompts and Voice Hardening | Pending |
| VOICE-02 | Phase 4: Prompts and Voice Hardening | Pending |
| LEARN-01 | Phase 5: Learning and Feedback | Pending |
| LEARN-02 | Phase 5: Learning and Feedback | Pending |
| AUTO-01 | Phase 6: Graduated Automation | Pending |
| AUTO-02 | Phase 6: Graduated Automation | Pending |

---

## Success Criteria

- [ ] 9/10 auto-approved posts require zero edits within 24 hours
- [ ] Confidence scores within 10% of actual human approval rate
- [ ] Visual consistency maintained across all carousel slides
- [ ] Hook variety — no pattern repeated within 2 weeks for same brand
- [ ] Self-healing catches 80%+ of regeneratable failures before human routing

---

*Requirements defined: 2026-01-23*
*Traceability updated: 2026-01-23*
