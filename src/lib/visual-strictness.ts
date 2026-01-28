/**
 * Visual Strictness System
 *
 * Controls how tightly image generation follows the master brand prompt.
 * Works in conjunction with the voice strictness slider (0-1 scale).
 */

export interface VisualStrictnessConfig {
  level: 'flexible' | 'balanced' | 'consistent' | 'strict';
  instructions: string;
  useMasterBrandPromptFully: boolean;
  colorRequirement: 'inspiration' | 'influence' | 'close-match' | 'exact';
}

export interface BrandVisualConfig {
  primary_color?: string;
  accent_color?: string;
  secondary_color?: string;
  fonts?: {
    heading?: string;
    body?: string;
  };
  image_style?: string;
  master_brand_prompt?: string;
  approvedStyles?: Array<{
    name: string;
    visualStyle: string;
  }>;
  logo_url?: string; // URL to uploaded brand logo
}

/**
 * Get strictness configuration based on the 0-1 strictness value.
 * This determines how closely the AI should follow the master brand prompt.
 */
export function getVisualStrictnessConfig(strictness: number): VisualStrictnessConfig {
  if (strictness >= 0.8) {
    return {
      level: 'strict',
      useMasterBrandPromptFully: true,
      colorRequirement: 'exact',
      instructions: `STRICT BRAND ADHERENCE (${Math.round(strictness * 100)}%)
- Follow the master brand style EXACTLY with zero deviation
- Colors MUST match the brand palette precisely (use exact hex values)
- Visual style, mood, and aesthetic must match brand examples perfectly
- No creative interpretation - replicate the brand's visual identity exactly
- If unsure, err on the side of matching brand examples more closely`,
    };
  } else if (strictness >= 0.6) {
    return {
      level: 'consistent',
      useMasterBrandPromptFully: true,
      colorRequirement: 'close-match',
      instructions: `CONSISTENT BRAND STYLE (${Math.round(strictness * 100)}%)
- Follow the master brand style closely as your primary guide
- Colors should closely match the brand palette (minor variations OK)
- Maintain the brand's visual identity and mood throughout
- Small creative adjustments are acceptable if they enhance the brand presence
- The result should be immediately recognizable as this brand's content`,
    };
  } else if (strictness >= 0.3) {
    return {
      level: 'balanced',
      useMasterBrandPromptFully: false,
      colorRequirement: 'influence',
      instructions: `BALANCED APPROACH (${Math.round(strictness * 100)}%)
- Use the master brand style as a guide, not a strict requirement
- Let brand colors influence the palette but don't require exact matches
- Maintain the general mood and aesthetic direction
- Creative interpretation is encouraged within brand spirit
- Balance brand consistency with visual variety`,
    };
  } else {
    return {
      level: 'flexible',
      useMasterBrandPromptFully: false,
      colorRequirement: 'inspiration',
      instructions: `FLEXIBLE VISUALS (${Math.round(strictness * 100)}%)
- Treat the brand style as loose inspiration only
- Creative freedom is prioritized over brand matching
- Brand colors are suggestions, not requirements
- Experiment with different visual approaches
- Focus on creating engaging visuals that work for the content`,
    };
  }
}

/**
 * Build a brand-aware image prompt that layers the master brand prompt
 * with optional treatment and respects the strictness setting.
 *
 * @param masterBrandPrompt - The AI-generated brand style guide from example posts
 * @param treatment - Optional visual style treatment (typography, photorealistic, etc.)
 * @param contentPrompt - The actual content/slide to visualize
 * @param strictness - 0-1 value controlling brand adherence
 * @param brandColors - Brand color palette for additional context
 */
export function buildBrandAwareImagePrompt(
  masterBrandPrompt: string | undefined,
  treatment: string | undefined,
  contentPrompt: string,
  strictness: number,
  brandColors?: BrandVisualConfig
): string {
  const config = getVisualStrictnessConfig(strictness);
  const sections: string[] = [];

  // Add strictness instructions first
  sections.push(config.instructions);

  if (masterBrandPrompt) {
    if (!treatment) {
      // NO TREATMENT: Master brand prompt is the complete directive
      sections.push(`
MASTER BRAND STYLE (Apply Fully):
${masterBrandPrompt}

Generate an image that looks exactly like this brand's example posts.
The master brand style above is your complete visual guide.`);
    } else {
      // WITH TREATMENT: Master brand prompt is foundation, treatment modifies direction
      sections.push(`
BRAND FOUNDATION (Must maintain):
${masterBrandPrompt}

TREATMENT DIRECTION: ${treatment}
Apply this treatment approach while staying true to the brand style above.
The treatment changes the execution method, but brand identity remains paramount.`);
    }
  } else if (treatment) {
    // No master brand prompt, but has treatment
    sections.push(`
VISUAL TREATMENT: ${treatment}
Apply this visual style to the content below.`);
  }

  // Add brand colors if available and strictness warrants it
  if (brandColors && (brandColors.primary_color || brandColors.accent_color)) {
    const colorSection = buildColorSection(brandColors, config.colorRequirement);
    if (colorSection) {
      sections.push(colorSection);
    }
  }

  // Add logo instructions if available (only for consistent/strict adherence)
  if (brandColors?.logo_url && strictness >= 0.6) {
    sections.push(`
BRAND LOGO:
Include the brand logo positioned subtly in a corner (10-15% of image width).
Logo reference: ${brandColors.logo_url}
The logo should be visible but not dominate - integrate naturally with the design.
Place it where it won't interfere with the main content.`);
  }

  // Add the actual content to visualize
  sections.push(`
CONTENT TO VISUALIZE:
${contentPrompt}`);

  // Add output requirements
  sections.push(`
OUTPUT REQUIREMENTS:
- Create a clean graphic design suitable for social media
- DO NOT include any app interfaces, phone screens, or UI mockups
- DO NOT include like buttons, comment icons, share buttons, or follower counts
- DO NOT include profile pictures, avatars, or social media frames
- The output should be ONLY the designed graphic itself`);

  return sections.join('\n');
}

/**
 * Build color instructions based on color requirement level.
 */
function buildColorSection(
  brandColors: BrandVisualConfig,
  colorRequirement: VisualStrictnessConfig['colorRequirement']
): string | null {
  const colors: string[] = [];

  if (brandColors.primary_color) {
    colors.push(`Primary: ${brandColors.primary_color}`);
  }
  if (brandColors.accent_color) {
    colors.push(`Accent: ${brandColors.accent_color}`);
  }
  if (brandColors.secondary_color) {
    colors.push(`Secondary: ${brandColors.secondary_color}`);
  }

  if (colors.length === 0) return null;

  const requirementText = {
    'exact': 'Use these EXACT colors (match hex values precisely)',
    'close-match': 'Use colors that closely match this palette',
    'influence': 'Let these colors influence your palette choices',
    'inspiration': 'Consider these colors as general inspiration',
  };

  return `
BRAND COLORS (${colorRequirement.toUpperCase()}):
${colors.join('\n')}
${requirementText[colorRequirement]}`;
}

/**
 * Build a background-specific brand prompt for carousel backgrounds.
 * This is used when generating background images that will have text overlaid.
 */
export function buildBrandAwareBackgroundPrompt(
  masterBrandPrompt: string | undefined,
  backgroundStyle: string | undefined,
  strictness: number,
  brandColors?: BrandVisualConfig
): string {
  const config = getVisualStrictnessConfig(strictness);
  const sections: string[] = [];

  sections.push(config.instructions);

  if (masterBrandPrompt && config.useMasterBrandPromptFully) {
    // Use master brand prompt as primary directive
    sections.push(`
MASTER BRAND STYLE (Primary Directive):
${masterBrandPrompt}

Create a background that matches this brand's visual identity exactly.`);

    if (backgroundStyle) {
      sections.push(`
BACKGROUND APPROACH: ${backgroundStyle}
Apply this style while maintaining the brand identity above.`);
    }
  } else if (masterBrandPrompt) {
    // Use master brand prompt as guide, not directive
    sections.push(`
BRAND GUIDANCE:
${masterBrandPrompt}

Use this as inspiration for the visual direction.`);

    if (backgroundStyle) {
      sections.push(`
BACKGROUND STYLE: ${backgroundStyle}
This is your primary direction. Brand guidance is secondary.`);
    }
  } else if (backgroundStyle) {
    // No master brand prompt, use style directly
    sections.push(`
BACKGROUND STYLE: ${backgroundStyle}`);
  }

  // Add brand colors
  if (brandColors && (brandColors.primary_color || brandColors.accent_color)) {
    const colorSection = buildColorSection(brandColors, config.colorRequirement);
    if (colorSection) {
      sections.push(colorSection);
    }
  }

  // Background-specific requirements
  sections.push(`
BACKGROUND REQUIREMENTS:
- This is for text overlay - leave clear space in the center for text
- DO NOT add any text, words, letters, or numbers to the image
- The background should complement, not compete with, overlaid text
- Ensure sufficient contrast for white or dark text readability`);

  return sections.join('\n');
}
