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

// Preset design systems for common looks
export const PRESET_DESIGN_SYSTEMS: Record<string, CarouselDesignSystem> = {
  'dark-coral': {
    backgroundColor: '#1a1a1a',
    primaryColor: '#ffffff',
    accentColor: '#ff6b6b',
    fontFamily: 'Inter',
    headlineFontWeight: 700,
    bodyFontWeight: 400,
    headlineFontSize: 72,
    bodyFontSize: 36,
    paddingX: 60,
    paddingY: 80,
    aesthetic: 'bold, editorial, premium',
  },
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
