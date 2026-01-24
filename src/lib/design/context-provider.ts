/**
 * Design Context Provider
 *
 * Pure function that computes a complete, immutable design context from
 * brand configuration and visual style selection.
 *
 * This is the SINGLE SOURCE OF TRUTH for all visual decisions.
 * The design context is computed once and flows to all downstream components.
 */

import type { DesignContext, DesignContextInput, VisualStyle } from './types';
import { TEXT_STYLE_PRESETS } from '@/lib/slide-templates/types';

/**
 * Style-specific color defaults.
 * Each visual style has sensible default colors for when brand config doesn't specify.
 */
interface StyleDefaults {
  backgroundColor: string;
  primaryColor: string;
  accentColor: string;
  aesthetic: string;
}

/**
 * Get default colors and aesthetic for a visual style.
 *
 * @param visualStyle - The visual style to get defaults for
 * @returns Default colors and aesthetic description
 */
function getStyleDefaults(visualStyle: VisualStyle): StyleDefaults {
  switch (visualStyle) {
    case 'typography':
      return {
        backgroundColor: '#1a1a1a',
        primaryColor: '#ffffff',
        accentColor: '#ff6b6b',
        aesthetic: 'bold, editorial, text-focused with striking typography',
      };

    case 'photorealistic':
      return {
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // transparent overlay
        primaryColor: '#ffffff',
        accentColor: '#ff6b6b',
        aesthetic: 'cinematic, professional, photo-centric with text overlays',
      };

    case 'illustration':
      return {
        backgroundColor: '#faf8f5', // cream
        primaryColor: '#1a2744', // navy
        accentColor: '#ff6b6b', // coral
        aesthetic: 'artistic, hand-crafted, warm illustration style',
      };

    case '3d-render':
      return {
        backgroundColor: '#0f0f1a', // dark gradient base
        primaryColor: '#ffffff',
        accentColor: '#9f7aea', // purple
        aesthetic: 'futuristic, dimensional, premium 3D renders',
      };

    case 'abstract-art':
      return {
        backgroundColor: '#1a1a1a',
        primaryColor: '#ffffff',
        accentColor: '#ff6b6b',
        aesthetic: 'creative, expressive, artistic abstract compositions',
      };

    case 'collage':
      return {
        backgroundColor: '#f5f5f5', // off-white
        primaryColor: '#1a1a1a',
        accentColor: '#ff6b6b',
        aesthetic: 'layered, eclectic, mixed-media collage style',
      };

    default:
      // Fallback to typography style for unknown styles
      return {
        backgroundColor: '#1a1a1a',
        primaryColor: '#ffffff',
        accentColor: '#ff6b6b',
        aesthetic: 'bold, editorial, text-focused',
      };
  }
}

/**
 * Normalize visual style string to VisualStyle type.
 * Handles case variations and unknown values with a fallback.
 */
function normalizeVisualStyle(style?: string): VisualStyle {
  if (!style) return 'typography';

  const normalized = style.toLowerCase().trim();

  const validStyles: VisualStyle[] = [
    'typography',
    'photorealistic',
    'illustration',
    '3d-render',
    'abstract-art',
    'collage',
  ];

  if (validStyles.includes(normalized as VisualStyle)) {
    return normalized as VisualStyle;
  }

  // Map common variations
  if (normalized.includes('photo') || normalized.includes('realistic')) {
    return 'photorealistic';
  }
  if (normalized.includes('3d') || normalized.includes('render')) {
    return '3d-render';
  }
  if (normalized.includes('abstract') || normalized.includes('art')) {
    return 'abstract-art';
  }
  if (normalized.includes('illust')) {
    return 'illustration';
  }

  return 'typography'; // default fallback
}

/**
 * Compute a complete Design Context from brand configuration and style selection.
 *
 * This is a PURE FUNCTION with no side effects, API calls, or database access.
 * All visual decisions are derived deterministically from the input.
 *
 * Priority order for resolving values (highest to lowest):
 * 1. Brand-specific values (primary_color, accent_color, master_brand_prompt)
 * 2. Text style preset values (typography sizing from TEXT_STYLE_PRESETS)
 * 3. Visual style defaults (colors and aesthetic per style)
 *
 * @param input - Brand config, visual style, and text style selections
 * @returns Complete DesignContext with all visual properties resolved
 *
 * @example
 * // With brand colors
 * computeDesignContext({
 *   visualStyle: 'typography',
 *   brandVisualConfig: { primary_color: '#ff0000', accent_color: '#00ff00' }
 * })
 * // => { visualStyle: 'typography', primaryColor: '#ffffff', accentColor: '#ff0000', ... }
 *
 * @example
 * // With text style preset
 * computeDesignContext({
 *   visualStyle: 'illustration',
 *   textStyle: 'dramatic'
 * })
 * // => { headlineFontSize: 84, bodyFontSize: 34, headlineFontWeight: 800, ... }
 */
export function computeDesignContext(input: DesignContextInput = {}): DesignContext {
  const { brandVisualConfig, textStyle } = input;

  // Normalize and validate visual style
  const visualStyle = normalizeVisualStyle(input.visualStyle);

  // Get style-specific defaults
  const styleDefaults = getStyleDefaults(visualStyle);

  // Get typography preset (default to 'bold-editorial')
  const typographyPreset =
    TEXT_STYLE_PRESETS[textStyle || 'bold-editorial'] ||
    TEXT_STYLE_PRESETS['bold-editorial'];

  // Build aesthetic string
  // If brand has master_brand_prompt, incorporate it into the aesthetic
  let aesthetic = styleDefaults.aesthetic;
  if (brandVisualConfig?.master_brand_prompt) {
    aesthetic = `${styleDefaults.aesthetic}. Brand direction: ${brandVisualConfig.master_brand_prompt}`;
  }

  // Resolve colors with priority: brand config > style defaults
  // Note: For accent color, we use brand's primary_color as the accent
  // because brands typically want their brand color as the highlight
  const accentColor = brandVisualConfig?.primary_color || styleDefaults.accentColor;
  const primaryColor = styleDefaults.primaryColor;
  const backgroundColor = styleDefaults.backgroundColor;

  return {
    // Style identification
    visualStyle,

    // Colors (brand overrides where appropriate)
    primaryColor,
    accentColor,
    backgroundColor,

    // Typography (always from preset)
    fontFamily: 'Inter',
    headlineFontSize: typographyPreset.headlineFontSize,
    bodyFontSize: typographyPreset.bodyFontSize,
    headlineFontWeight: typographyPreset.headlineFontWeight,
    bodyFontWeight: typographyPreset.bodyFontWeight,

    // Layout (fixed template constraints)
    paddingX: 60,
    paddingY: 80,

    // Optional brand prompt
    masterBrandPrompt: brandVisualConfig?.master_brand_prompt,

    // Aesthetic description for AI prompts
    aesthetic,
  };
}

// ============================================================================
// Test Examples (for verification)
// ============================================================================
//
// Test 1: Minimal input (all defaults)
// computeDesignContext({})
// Expected: {
//   visualStyle: 'typography',
//   primaryColor: '#ffffff',
//   accentColor: '#ff6b6b',
//   backgroundColor: '#1a1a1a',
//   fontFamily: 'Inter',
//   headlineFontSize: 72,
//   bodyFontSize: 36,
//   headlineFontWeight: 700,
//   bodyFontWeight: 400,
//   paddingX: 60,
//   paddingY: 80,
//   masterBrandPrompt: undefined,
//   aesthetic: 'bold, editorial, text-focused with striking typography'
// }
//
// Test 2: With brand colors
// computeDesignContext({
//   visualStyle: 'typography',
//   brandVisualConfig: { primary_color: '#ff0000' }
// })
// Expected: { accentColor: '#ff0000', ... } (brand color becomes accent)
//
// Test 3: With text style preset
// computeDesignContext({
//   visualStyle: 'illustration',
//   textStyle: 'dramatic'
// })
// Expected: {
//   headlineFontSize: 84,
//   bodyFontSize: 34,
//   headlineFontWeight: 800,
//   aesthetic: 'artistic, hand-crafted, warm illustration style'
// }
//
// Test 4: With master brand prompt
// computeDesignContext({
//   brandVisualConfig: {
//     master_brand_prompt: 'Professional, trustworthy, blue-chip technology company'
//   }
// })
// Expected: {
//   masterBrandPrompt: 'Professional, trustworthy, blue-chip technology company',
//   aesthetic: '... Brand direction: Professional, trustworthy, blue-chip technology company'
// }
