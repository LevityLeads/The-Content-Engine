/**
 * Carousel Design System Types
 *
 * These types define the consistent visual properties that
 * are programmatically applied to every slide via Satori.
 */

export interface CarouselDesignSystem {
  // Colors
  backgroundColor: string; // hex code e.g., "#1a1a1a"
  primaryColor: string;    // main text color e.g., "#ffffff"
  accentColor: string;     // highlight color e.g., "#ff6b6b"

  // Typography
  fontFamily: string;      // e.g., "Inter"
  headlineFontWeight: number; // e.g., 700
  bodyFontWeight: number;  // e.g., 400

  // Sizing (relative to canvas)
  headlineFontSize: number; // in pixels
  bodyFontSize: number;     // in pixels

  // Layout
  paddingX: number;        // horizontal padding in pixels
  paddingY: number;        // vertical padding in pixels

  // Aesthetic description (for logging/debugging)
  aesthetic: string;       // e.g., "bold, editorial, premium"
}

export interface SlideContent {
  slideNumber: number;
  headline?: string;        // Main text (large)
  body?: string;            // Supporting text (smaller)
  accentText?: string;      // Highlighted text
  ctaText?: string;         // Call to action
}

export interface CompositeImageRequest {
  // Background image (base64 or URL)
  backgroundImage: string;

  // Slide content
  content: SlideContent;

  // Design system to apply
  designSystem: CarouselDesignSystem;

  // Output dimensions
  width: number;
  height: number;

  // Template type
  templateType: 'hook' | 'content' | 'cta' | 'numbered';
}

/**
 * Text Style Presets
 * Controls typography sizing, weight, and aesthetic feel
 */
export interface TextStylePreset {
  id: string;
  name: string;
  headlineFontSize: number;
  bodyFontSize: number;
  headlineFontWeight: number;
  bodyFontWeight: number;
  aesthetic: string;
}

export const TEXT_STYLE_PRESETS: Record<string, TextStylePreset> = {
  'bold-editorial': {
    id: 'bold-editorial',
    name: 'Bold Editorial',
    headlineFontSize: 72,
    bodyFontSize: 36,
    headlineFontWeight: 700,
    bodyFontWeight: 400,
    aesthetic: 'bold, editorial, premium',
  },
  'clean-modern': {
    id: 'clean-modern',
    name: 'Clean Modern',
    headlineFontSize: 64,
    bodyFontSize: 32,
    headlineFontWeight: 600,
    bodyFontWeight: 400,
    aesthetic: 'clean, modern, professional',
  },
  'dramatic': {
    id: 'dramatic',
    name: 'Dramatic',
    headlineFontSize: 84,
    bodyFontSize: 34,
    headlineFontWeight: 800,
    bodyFontWeight: 400,
    aesthetic: 'dramatic, impactful, attention-grabbing',
  },
  'minimal': {
    id: 'minimal',
    name: 'Minimal',
    headlineFontSize: 56,
    bodyFontSize: 28,
    headlineFontWeight: 500,
    bodyFontWeight: 400,
    aesthetic: 'minimal, elegant, understated',
  },
  'statement': {
    id: 'statement',
    name: 'Statement',
    headlineFontSize: 96,
    bodyFontSize: 38,
    headlineFontWeight: 700,
    bodyFontWeight: 500,
    aesthetic: 'statement, bold, commanding',
  },
};

/**
 * Text Color Presets
 * Controls primary text color and accent color
 */
export interface TextColorPreset {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  forDarkBg: boolean; // hint for pairing with backgrounds
}

export const TEXT_COLOR_PRESETS: Record<string, TextColorPreset> = {
  'white-coral': {
    id: 'white-coral',
    name: 'White & Coral',
    primaryColor: '#ffffff',
    accentColor: '#ff6b6b',
    forDarkBg: true,
  },
  'white-teal': {
    id: 'white-teal',
    name: 'White & Teal',
    primaryColor: '#ffffff',
    accentColor: '#20b2aa',
    forDarkBg: true,
  },
  'white-gold': {
    id: 'white-gold',
    name: 'White & Gold',
    primaryColor: '#f5f5dc',
    accentColor: '#d4af37',
    forDarkBg: true,
  },
  'white-blue': {
    id: 'white-blue',
    name: 'White & Blue',
    primaryColor: '#ffffff',
    accentColor: '#3b82f6',
    forDarkBg: true,
  },
  'dark-coral': {
    id: 'dark-coral',
    name: 'Dark & Coral',
    primaryColor: '#1a1a1a',
    accentColor: '#ff6b6b',
    forDarkBg: false,
  },
  'dark-blue': {
    id: 'dark-blue',
    name: 'Dark & Blue',
    primaryColor: '#1a1a1a',
    accentColor: '#2563eb',
    forDarkBg: false,
  },
};

/**
 * Build a design system from style + color presets
 */
export function buildDesignSystem(
  stylePreset: TextStylePreset,
  colorPreset: TextColorPreset,
  backgroundColor: string = '#1a1a1a'
): CarouselDesignSystem {
  return {
    backgroundColor,
    primaryColor: colorPreset.primaryColor,
    accentColor: colorPreset.accentColor,
    fontFamily: 'Inter',
    headlineFontWeight: stylePreset.headlineFontWeight,
    bodyFontWeight: stylePreset.bodyFontWeight,
    headlineFontSize: stylePreset.headlineFontSize,
    bodyFontSize: stylePreset.bodyFontSize,
    paddingX: 60,
    paddingY: 80,
    aesthetic: stylePreset.aesthetic,
  };
}

// Legacy preset design systems (for backwards compatibility)
export const PRESET_DESIGN_SYSTEMS: Record<string, CarouselDesignSystem> = {
  'dark-coral': buildDesignSystem(
    TEXT_STYLE_PRESETS['bold-editorial'],
    TEXT_COLOR_PRESETS['white-coral']
  ),
  'navy-gold': {
    backgroundColor: '#1a1f3c',
    primaryColor: '#f5f5dc',
    accentColor: '#d4af37',
    fontFamily: 'Inter',
    headlineFontWeight: 700,
    bodyFontWeight: 400,
    headlineFontSize: 72,
    bodyFontSize: 36,
    paddingX: 60,
    paddingY: 80,
    aesthetic: 'sophisticated, luxury, professional',
  },
  'light-minimal': {
    backgroundColor: '#fafafa',
    primaryColor: '#1a1a1a',
    accentColor: '#2563eb',
    fontFamily: 'Inter',
    headlineFontWeight: 700,
    bodyFontWeight: 400,
    headlineFontSize: 72,
    bodyFontSize: 36,
    paddingX: 60,
    paddingY: 80,
    aesthetic: 'clean, modern, minimal',
  },
  'teal-cream': {
    backgroundColor: '#0d4d4d',
    primaryColor: '#ffffff',
    accentColor: '#f5f5dc',
    fontFamily: 'Inter',
    headlineFontWeight: 700,
    bodyFontWeight: 400,
    headlineFontSize: 72,
    bodyFontSize: 36,
    paddingX: 60,
    paddingY: 80,
    aesthetic: 'sophisticated, tech-forward, premium',
  },
};

// Default Instagram carousel dimensions
export const INSTAGRAM_CAROUSEL_DIMENSIONS = {
  width: 1080,
  height: 1350, // 4:5 aspect ratio
};
