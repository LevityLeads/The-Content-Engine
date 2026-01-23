/**
 * Design Context Types
 *
 * Type definitions for the Design Context system - the single source of truth
 * for all visual decisions in carousel generation.
 */

/**
 * Visual style options for carousel generation.
 * Each style has different default colors and aesthetic approaches.
 */
export type VisualStyle =
  | 'typography'
  | 'photorealistic'
  | 'illustration'
  | '3d-render'
  | 'abstract-art'
  | 'collage';

/**
 * DesignContext - Complete visual specification for carousel generation.
 *
 * This interface captures ALL visual decisions needed to generate a cohesive carousel.
 * Once computed, this context flows unchanged to all downstream components:
 * - Content generation (Claude)
 * - Background generation (Gemini)
 * - Slide compositor (Satori + Sharp)
 *
 * The design context is computed ONCE at the start and never modified during generation.
 */
export interface DesignContext {
  /** The visual style approach for the carousel */
  visualStyle: VisualStyle;

  /** Primary text color (hex), typically for headlines and body text */
  primaryColor: string;

  /** Accent color (hex), for highlights and CTAs */
  accentColor: string;

  /** Background color (hex), base color for solid backgrounds or overlay tints */
  backgroundColor: string;

  /** Font family for all text (always 'Inter' for consistency) */
  fontFamily: string;

  /** Headline font size in pixels */
  headlineFontSize: number;

  /** Body text font size in pixels */
  bodyFontSize: number;

  /** Headline font weight (400-900) */
  headlineFontWeight: number;

  /** Body text font weight (400-900) */
  bodyFontWeight: number;

  /** Horizontal padding in pixels */
  paddingX: number;

  /** Vertical padding in pixels */
  paddingY: number;

  /**
   * Master brand prompt from brand analysis (optional).
   * When present, this is the authoritative guide for brand voice and visual direction.
   */
  masterBrandPrompt?: string;

  /**
   * Aesthetic description for AI prompts.
   * Describes the visual feel, e.g., "bold, editorial, premium" or "minimal, elegant, understated"
   */
  aesthetic: string;
}

/**
 * Brand visual configuration as stored in the database.
 * This is the input format from brand.visual_config.
 */
export interface BrandVisualConfig {
  /** Primary brand color (hex) */
  primary_color?: string;

  /** Accent/highlight color (hex) */
  accent_color?: string;

  /** Secondary color (hex) */
  secondary_color?: string;

  /** Image style preference */
  image_style?: string;

  /** Font preferences */
  fonts?: {
    heading?: string;
    body?: string;
  };

  /** Master brand prompt from brand analysis */
  master_brand_prompt?: string;
}

/**
 * Input for computeDesignContext function.
 *
 * All fields are optional - the function applies sensible defaults
 * based on the visualStyle when specific values aren't provided.
 */
export interface DesignContextInput {
  /** Brand's visual configuration (from brand.visual_config) */
  brandVisualConfig?: BrandVisualConfig;

  /** Selected visual style for the carousel */
  visualStyle?: VisualStyle | string;

  /** Text style preset name (maps to TEXT_STYLE_PRESETS in slide-templates) */
  textStyle?: string;
}
