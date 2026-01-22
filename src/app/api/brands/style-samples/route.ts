import { NextRequest, NextResponse } from "next/server";
import { VISUAL_STYLES, VisualStyle } from "@/lib/prompts/visual-styles";
import { TEXT_STYLE_PRESETS, TEXT_COLOR_PRESETS } from "@/lib/slide-templates/types";
import { IMAGE_MODELS } from "@/lib/image-models";

/**
 * Style Sample Generation API
 *
 * Generates example images based on user-selected keywords.
 * Returns varied styles that match the brand's desired aesthetic.
 */

// Sample headlines for style demonstration
const SAMPLE_HEADLINES = [
  "Great things take time",
  "Simple is beautiful",
  "Think different",
  "Less is more",
  "Dream bigger",
  "Make it happen",
  "Stay curious",
  "Create boldly",
];

// Visual style mapping based on keywords
const KEYWORD_TO_VISUAL_STYLE: Record<string, VisualStyle[]> = {
  // Visual style keywords
  illustration: ["illustration"],
  photography: ["photorealistic"],
  photo: ["photorealistic"],
  "3d": ["3d-render"],
  abstract: ["abstract-art"],
  minimalist: ["typography"],
  minimal: ["typography"],
  collage: ["collage"],
  experimental: ["experimental"],

  // Mood keywords (map to multiple styles)
  soft: ["photorealistic", "illustration"],
  bold: ["typography", "abstract-art"],
  playful: ["illustration", "collage", "3d-render"],
  serious: ["typography", "photorealistic"],
  elegant: ["photorealistic", "typography"],
  energetic: ["abstract-art", "3d-render", "experimental"],

  // Color feel keywords
  warm: ["illustration", "photorealistic"],
  cool: ["3d-render", "typography"],
  vibrant: ["abstract-art", "collage"],
  muted: ["photorealistic", "typography"],
  dark: ["typography", "photorealistic"],
  light: ["illustration", "photorealistic"],
};

// Text style preferences based on keywords
const KEYWORD_TO_TEXT_STYLE: Record<string, string[]> = {
  bold: ["bold-editorial", "statement", "dramatic"],
  soft: ["minimal", "clean-modern"],
  elegant: ["clean-modern", "minimal"],
  playful: ["bold-editorial", "statement"],
  serious: ["clean-modern", "minimal"],
  minimalist: ["minimal", "clean-modern"],
  energetic: ["dramatic", "statement", "bold-editorial"],
};

// Color presets based on keywords
const KEYWORD_TO_COLOR: Record<string, string[]> = {
  warm: ["white-coral", "white-gold"],
  cool: ["white-teal", "white-blue"],
  vibrant: ["white-coral", "white-teal"],
  muted: ["white-gold", "dark-blue"],
  dark: ["white-coral", "white-teal", "white-blue"],
  light: ["dark-coral", "dark-blue"],
  bold: ["white-coral", "white-blue"],
  soft: ["white-gold", "white-teal"],
};

// All visual styles for fallback
const ALL_VISUAL_STYLES: VisualStyle[] = [
  "typography",
  "photorealistic",
  "illustration",
  "3d-render",
  "abstract-art",
  "collage",
  "experimental",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandColors, brandName, keywords = [], count = 8 } = body;

    // Brand colors to incorporate
    const primaryColor = brandColors?.primary_color || "#1a1a1a";
    const accentColor = brandColors?.accent_color || "#ff6b6b";

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { error: "Image generation API not configured" },
        { status: 500 }
      );
    }

    // Determine which styles to generate based on keywords
    const styleConfigs = generateStyleConfigs(keywords, count);

    // Generate samples in parallel (in batches to avoid rate limits)
    const batchSize = 4;
    const allSamples: StyleSampleResult[] = [];

    for (let i = 0; i < styleConfigs.length; i += batchSize) {
      const batch = styleConfigs.slice(i, i + batchSize);
      const batchPromises = batch.map((config, batchIndex) =>
        generateSingleSample({
          config,
          index: i + batchIndex,
          brandName: brandName || "Your Brand",
          primaryColor,
          accentColor,
          keywords,
          googleApiKey,
        })
      );

      const batchResults = await Promise.all(batchPromises);
      allSamples.push(...batchResults);
    }

    const successfulSamples = allSamples.filter((s) => s.image !== null);

    return NextResponse.json({
      success: true,
      samples: allSamples,
      generatedCount: successfulSamples.length,
      totalCount: styleConfigs.length,
    });
  } catch (error) {
    console.error("Error in POST /api/brands/style-samples:", error);
    return NextResponse.json(
      { error: "Failed to generate style samples" },
      { status: 500 }
    );
  }
}

interface StyleConfig {
  visualStyle: VisualStyle;
  textStyle: string;
  textColor: string;
  headline: string;
}

interface StyleSampleResult {
  id: string;
  visualStyle: string;
  textStyle: string;
  textColor: string;
  name: string;
  description: string;
  image: string | null;
  error?: string;
  keywords: string[];
  designSystem: {
    background: string;
    primaryColor: string;
    accentColor: string;
    typography: string;
    layout: string;
    mood: string;
  };
}

function generateStyleConfigs(keywords: string[], count: number): StyleConfig[] {
  const configs: StyleConfig[] = [];
  const usedCombinations = new Set<string>();

  // Collect all relevant visual styles from keywords
  let relevantVisualStyles: VisualStyle[] = [];
  let relevantTextStyles: string[] = [];
  let relevantColors: string[] = [];

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();
    if (KEYWORD_TO_VISUAL_STYLE[kw]) {
      relevantVisualStyles.push(...KEYWORD_TO_VISUAL_STYLE[kw]);
    }
    if (KEYWORD_TO_TEXT_STYLE[kw]) {
      relevantTextStyles.push(...KEYWORD_TO_TEXT_STYLE[kw]);
    }
    if (KEYWORD_TO_COLOR[kw]) {
      relevantColors.push(...KEYWORD_TO_COLOR[kw]);
    }
  }

  // Deduplicate
  relevantVisualStyles = [...new Set(relevantVisualStyles)];
  relevantTextStyles = [...new Set(relevantTextStyles)];
  relevantColors = [...new Set(relevantColors)];

  // Fallbacks if no matches
  if (relevantVisualStyles.length === 0) {
    relevantVisualStyles = ALL_VISUAL_STYLES.slice(0, 4);
  }
  if (relevantTextStyles.length === 0) {
    relevantTextStyles = Object.keys(TEXT_STYLE_PRESETS);
  }
  if (relevantColors.length === 0) {
    relevantColors = Object.keys(TEXT_COLOR_PRESETS);
  }

  // Generate combinations
  let attempts = 0;
  const maxAttempts = count * 3;

  while (configs.length < count && attempts < maxAttempts) {
    attempts++;

    const visualStyle = relevantVisualStyles[Math.floor(Math.random() * relevantVisualStyles.length)];
    const textStyle = relevantTextStyles[Math.floor(Math.random() * relevantTextStyles.length)];
    const textColor = relevantColors[Math.floor(Math.random() * relevantColors.length)];
    const headline = SAMPLE_HEADLINES[configs.length % SAMPLE_HEADLINES.length];

    const combo = `${visualStyle}-${textStyle}-${textColor}`;
    if (!usedCombinations.has(combo)) {
      usedCombinations.add(combo);
      configs.push({ visualStyle, textStyle, textColor, headline });
    }
  }

  // If we couldn't get enough unique combinations, fill with any remaining
  while (configs.length < count) {
    const visualStyle = ALL_VISUAL_STYLES[configs.length % ALL_VISUAL_STYLES.length];
    const textStyle = Object.keys(TEXT_STYLE_PRESETS)[configs.length % Object.keys(TEXT_STYLE_PRESETS).length];
    const textColor = Object.keys(TEXT_COLOR_PRESETS)[configs.length % Object.keys(TEXT_COLOR_PRESETS).length];
    const headline = SAMPLE_HEADLINES[configs.length % SAMPLE_HEADLINES.length];
    configs.push({ visualStyle, textStyle, textColor, headline });
  }

  return configs;
}

async function generateSingleSample({
  config,
  index,
  brandName,
  primaryColor,
  accentColor,
  keywords,
  googleApiKey,
}: {
  config: StyleConfig;
  index: number;
  brandName: string;
  primaryColor: string;
  accentColor: string;
  keywords: string[];
  googleApiKey: string;
}): Promise<StyleSampleResult> {
  const styleInfo = VISUAL_STYLES[config.visualStyle];
  const textStylePreset = TEXT_STYLE_PRESETS[config.textStyle];
  const textColorPreset = TEXT_COLOR_PRESETS[config.textColor];

  if (!styleInfo || !textStylePreset || !textColorPreset) {
    return createErrorResult(config, keywords, "Invalid style configuration");
  }

  const prompt = buildStylePrompt({
    style: styleInfo,
    headline: config.headline,
    brandName,
    primaryColor,
    accentColor,
    textColorPreset,
    textStylePreset,
    keywords,
  });

  try {
    const modelConfig = IMAGE_MODELS["gemini-3-pro"];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "4:5" },
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || "image/png";
          return {
            id: `${config.visualStyle}-${config.textStyle}-${index}`,
            visualStyle: config.visualStyle,
            textStyle: config.textStyle,
            textColor: config.textColor,
            name: styleInfo.name,
            description: getStyleDescription(config.visualStyle, keywords),
            image: `data:${mimeType};base64,${part.inlineData.data}`,
            keywords,
            designSystem: {
              background: getBackgroundDescription(config.visualStyle, primaryColor),
              primaryColor: textColorPreset.primaryColor,
              accentColor: accentColor,
              typography: textStylePreset.aesthetic,
              layout: "centered",
              mood: styleInfo.description,
            },
          };
        }
      }
    }

    console.error(`Style sample generation failed for ${config.visualStyle}:`, await response.text());
    return createErrorResult(config, keywords, "Generation failed");
  } catch (err) {
    console.error(`Error generating ${config.visualStyle} sample:`, err);
    return createErrorResult(config, keywords, err instanceof Error ? err.message : "Unknown error");
  }
}

function createErrorResult(config: StyleConfig, keywords: string[], error: string): StyleSampleResult {
  const styleInfo = VISUAL_STYLES[config.visualStyle];
  const textStylePreset = TEXT_STYLE_PRESETS[config.textStyle];
  const textColorPreset = TEXT_COLOR_PRESETS[config.textColor];

  return {
    id: `${config.visualStyle}-${config.textStyle}-error`,
    visualStyle: config.visualStyle,
    textStyle: config.textStyle,
    textColor: config.textColor,
    name: styleInfo?.name || config.visualStyle,
    description: getStyleDescription(config.visualStyle, keywords),
    image: null,
    error,
    keywords,
    designSystem: {
      background: getBackgroundDescription(config.visualStyle, "#1a1a1a"),
      primaryColor: textColorPreset?.primaryColor || "#ffffff",
      accentColor: "#ff6b6b",
      typography: textStylePreset?.aesthetic || "clean",
      layout: "centered",
      mood: styleInfo?.description || "",
    },
  };
}

function buildStylePrompt({
  style,
  headline,
  brandName,
  primaryColor,
  accentColor,
  textColorPreset,
  textStylePreset,
  keywords,
}: {
  style: (typeof VISUAL_STYLES)[VisualStyle];
  headline: string;
  brandName: string;
  primaryColor: string;
  accentColor: string;
  textColorPreset: (typeof TEXT_COLOR_PRESETS)[string];
  textStylePreset: (typeof TEXT_STYLE_PRESETS)[string];
  keywords: string[];
}): string {
  const keywordGuidance = keywords.length > 0
    ? `\n\nKEYWORD GUIDANCE:\nIncorporate these aesthetic qualities: ${keywords.join(", ")}`
    : "";

  return `Create a ${style.name.toLowerCase()} style social media graphic.

HEADLINE TEXT TO DISPLAY: "${headline}"

STYLE GUIDANCE:
${style.promptGuidance}${keywordGuidance}

COLOR SCHEME:
- Brand primary color: ${primaryColor}
- Brand accent color: ${accentColor}
- Text color: ${textColorPreset.primaryColor}
- Highlight/accent text: ${textColorPreset.accentColor}

TYPOGRAPHY:
- Style: ${textStylePreset.aesthetic}
- Make the headline bold and prominent
- Clean, modern font (similar to Inter or Helvetica)

TEXT OVERLAY RULES:
${style.textOverlayRules}

CRITICAL REQUIREMENTS:
- Aspect ratio: 4:5 (vertical, Instagram-style)
- The headline "${headline}" MUST be clearly visible and readable
- NO phone mockups, NO app interfaces, NO social media UI elements
- Create a clean, editorial design that could be a poster or magazine ad
- Professional quality, suitable for a brand called "${brandName}"`;
}

function getBackgroundDescription(visualStyle: VisualStyle, brandColor: string): string {
  switch (visualStyle) {
    case "typography":
      return `Solid gradient from ${brandColor} to darker shade`;
    case "photorealistic":
      return "Cinematic photo background with atmospheric lighting";
    case "3d-render":
      return "Modern 3D scene with floating geometric shapes";
    case "abstract-art":
      return "Bold abstract shapes with dynamic composition";
    case "illustration":
      return "Hand-drawn illustration style with warm colors";
    case "collage":
      return "Mixed media collage with layered textures";
    case "experimental":
      return "Avant-garde surreal composition";
    default:
      return "Clean minimal background";
  }
}

function getStyleDescription(visualStyle: VisualStyle, keywords: string[]): string {
  const keywordStr = keywords.length > 0 ? ` • ${keywords.slice(0, 2).join(", ")}` : "";

  switch (visualStyle) {
    case "typography":
      return `Bold text-focused design${keywordStr}`;
    case "photorealistic":
      return `Photo-quality backgrounds${keywordStr}`;
    case "3d-render":
      return `Modern 3D rendered scenes${keywordStr}`;
    case "abstract-art":
      return `Bold shapes & gradients${keywordStr}`;
    case "illustration":
      return `Hand-drawn illustration style${keywordStr}`;
    case "collage":
      return `Mixed media layers${keywordStr}`;
    case "experimental":
      return `Avant-garde visuals${keywordStr}`;
    default:
      return `Custom style${keywordStr}`;
  }
}
