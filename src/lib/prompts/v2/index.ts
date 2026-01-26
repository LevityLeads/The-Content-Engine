/**
 * V2 Prompt System
 *
 * A parallel prompt system optimized for distinctive, save-worthy content.
 * Runs alongside the classic system - users choose their mode.
 *
 * Key differences from v1:
 * - AI detection blacklist (kills AI-tell patterns)
 * - Burstiness enforcement (human-like sentence rhythm)
 * - Save-worthiness gates (content must pass tests)
 * - Risk dial (safe/balanced/bold modes)
 * - Voice fingerprints (discover voice, don't configure it)
 * - Research mode for thin inputs
 */

// ============================================================================
// Foundation Modules
// ============================================================================

export {
  // Blacklists
  AI_WORD_BLACKLIST,
  AI_PHRASE_BLACKLIST,
  DEAD_HOOKS,
  // Prompt section
  BLACKLIST_ENFORCEMENT_PROMPT,
  // Audit functions
  findBlacklistedWords,
  findBlacklistedPhrases,
  findDeadHook,
  auditForAIPatterns,
} from "./anti-patterns";

export {
  // Requirements
  BURSTINESS_REQUIREMENTS,
  RHYTHM_PROMPT_SECTION,
  // Examples
  RHYTHM_EXAMPLES,
  // Analysis functions
  getSentenceLengths,
  calculateBurstiness,
  findMonotonousSequences,
  shortPunchRatio,
  auditRhythm,
} from "./burstiness";

export {
  // Tests and formats
  SAVE_TESTS,
  SAVE_WORTHY_FORMATS,
  SAVE_CTAS,
  // Prompt section
  SAVE_WORTHINESS_PROMPT,
  // Analysis functions
  assessSaveWorthiness,
  identifySaveFormat,
} from "./save-worthiness";

export {
  // Types
  type RiskLevel,
  type RiskConfig,
  // Configurations
  RISK_LEVELS,
  // Functions
  getRiskPrompt,
  getRiskSelectionContext,
  // Examples and validation
  RISK_EXAMPLES,
  validateBoldContent,
} from "./risk-dial";

// ============================================================================
// Voice System
// ============================================================================

export {
  // Types
  type VoiceFingerprint,
  type VoiceDNA,
  // Constants
  EMPTY_FINGERPRINT,
  // Functions
  isValidFingerprint,
  getFingerprintCompleteness,
  fingerprintToDNA,
} from "./voice-fingerprint";

export {
  // Types
  type DiscoveryQuestion,
  type DiscoverySection,
  // Interview data
  DISCOVERY_INTERVIEW,
  // Functions
  getMinimumQuestions,
  getAllQuestions,
  processInterviewAnswers,
  // Prompt
  VOICE_DISCOVERY_PROMPT,
} from "./voice-discovery";

export {
  // Types
  type WritingSample,
  type SampleAnalysis,
  // Constants
  MIN_SAMPLES_FOR_EXTRACTION,
  IDEAL_SAMPLE_COUNT,
  // Functions
  analyzeSample,
  aggregateAnalyses,
  hasEnoughSamples,
  generateExtractionPrompt,
  // Prompt
  VOICE_EXTRACTION_PROMPT,
} from "./voice-extraction";

export {
  // Types
  type VoicePromptSections,
  // Functions
  generateVoicePrompt,
  generateQuickVoicePrompt,
  generateVoiceCheckPrompt,
  mergeFingerprints,
} from "./voice-generation";

// ============================================================================
// Input Quality System
// ============================================================================

export {
  // Types
  type InputQualityAssessment,
  // Constants
  QUALITY_THRESHOLDS,
  RICH_INPUT_SIGNALS,
  THIN_INPUT_SIGNALS,
  // Prompts
  INPUT_QUALITY_ASSESSMENT_PROMPT,
  // Functions
  quickAssess,
  generateEnrichmentQuestions,
  shouldTriggerResearch,
  createAssessmentPrompt,
} from "./input-quality";

export {
  // Types
  type ResearchResult,
  type ResearchAngle,
  type DataPoint,
  type Example,
  type ResearchType,
  // Prompts
  RESEARCH_MODE_SYSTEM_PROMPT,
  ANGLE_RESEARCH_PROMPT,
  DATA_RESEARCH_PROMPT,
  EXAMPLE_RESEARCH_PROMPT,
  CONTRARIAN_RESEARCH_PROMPT,
  RESEARCH_INTEGRATION_PROMPT,
  // Functions
  generateResearchPrompt,
  isResearchSufficient,
  combineInputWithResearch,
} from "./research-mode";

// ============================================================================
// Content Generation
// ============================================================================

export {
  // Types
  type ContentIdea,
  // Prompts
  V2_IDEATION_SYSTEM_PROMPT,
  // Functions
  buildV2IdeationPrompt,
  buildV2IdeationUserPrompt,
  validateIdeas,
  suggestFormats,
} from "./ideation-prompt";

export {
  // Types
  type GeneratedContent,
  type ContentCopy,
  type SinglePostCopy,
  type ThreadCopy,
  type CarouselCopy,
  type StoryCopy,
  // Constants
  PLATFORM_CONSTRAINTS,
  // Prompts
  V2_CONTENT_SYSTEM_PROMPT,
  CONTENT_POLISH_PROMPT,
  // Functions
  buildV2ContentPrompt,
  buildV2ContentUserPrompt,
  validateContent,
} from "./content-prompt";

export {
  // Types
  type CarouselSlide,
  type CarouselOutput,
  // Constants
  CAROUSEL_STYLES,
  // Prompts
  V2_CAROUSEL_SYSTEM_PROMPT,
  // Functions
  buildV2CarouselPrompt,
  buildV2CarouselUserPrompt,
  validateCarousel,
  generateSlideImagePrompt,
} from "./carousel-prompt";
