/**
 * Prompt System Index
 *
 * Central export for all prompt-related modules.
 */

// Core marketer persona
export { MARKETER_PERSONA, MARKETER_CONTEXT } from "./marketer-persona";

// Hook library
export {
  HOOK_PATTERNS,
  HOOK_GUIDELINES,
  getHooksByType,
  getAllHooks,
  HOOK_TYPES,
} from "./hook-library";

// Content pillars
export {
  CONTENT_PILLARS,
  CONTENT_ANGLES,
  PILLAR_BALANCE_GUIDE,
  ANGLE_GUIDELINES,
  getPillarByName,
  getAngleByName,
  type ContentPillar,
  type ContentAngle,
} from "./content-pillars";

// Voice system
export {
  VOICE_ARCHETYPES,
  buildVoicePrompt,
  VOICE_QUALITY_CHECK,
  DEFAULT_VOICE_PROMPT,
  type VoiceConfig,
} from "./voice-system";

// Ideation prompts
export {
  IDEATION_SYSTEM_PROMPT,
  buildIdeationUserPrompt,
} from "./ideation-prompt";

// Content generation prompts
export {
  CONTENT_SYSTEM_PROMPT,
  buildContentUserPrompt,
} from "./content-prompt";

// Visual styles system
export {
  VISUAL_STYLES,
  STYLE_SELECTION_GUIDANCE,
  getStylePromptTemplate,
  getStylesReference,
  type VisualStyle,
  type StyleDefinition,
} from "./visual-styles";
