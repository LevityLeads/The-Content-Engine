import { NextRequest, NextResponse } from "next/server";
import { VISUAL_STYLES, VisualStyle } from "@/lib/prompts/visual-styles";
import { TEXT_STYLE_PRESETS, TEXT_COLOR_PRESETS } from "@/lib/slide-templates/types";
import { IMAGE_MODELS, DEFAULT_MODEL } from "@/lib/image-models";

/**
 * Style Sample Generation API
 *
 * Generates example images in different visual styles for brand onboarding.
 * Users can pick their favorite to set as the brand's default style.
 */

// Sample headline for style demonstration
const SAMPLE_HEADLINES = [
  "Great things take time",
  "Simple is beautiful",
  "Think different",
  "Less is more",
];

// Curated style options for onboarding (not all 7, just the most distinct 4)
const ONBOARDING_STYLES: {
  visualStyle: VisualStyle;
  textStyle: string;
  textColor: string;
  description: string;
}[] = [
  {
    visualStyle: "typography",
    textStyle: "bold-editorial",
    textColor: "white-coral",
    description: "Bold & Clean - Text-focused with strong typography",
  },
  {
    visualStyle: "photorealistic",
    textStyle: "clean-modern",
    textColor: "white-teal",
    description: "Photo Style - Stunning backgrounds with text overlay",
  },
  {
    visualStyle: "3d-render",
    textStyle: "dramatic",
    textColor: "white-blue",
    description: "Modern 3D - Sleek rendered scenes with depth",
  },
  {
    visualStyle: "abstract-art",
    textStyle: "statement",
    textColor: "white-gold",
    description: "Abstract Art - Bold shapes and artistic compositions",
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandColors, brandName } = body;

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

    // Generate samples in parallel
    const samplePromises = ONBOARDING_STYLES.map(async (style, index) => {
      const headline = SAMPLE_HEADLINES[index % SAMPLE_HEADLINES.length];
      const styleInfo = VISUAL_STYLES[style.visualStyle];
      const textStylePreset = TEXT_STYLE_PRESETS[style.textStyle];
      const textColorPreset = TEXT_COLOR_PRESETS[style.textColor];

      // Build style-specific prompt incorporating brand colors
      const prompt = buildStylePrompt({
        style: styleInfo,
        headline,
        brandName: brandName || "Your Brand",
        primaryColor,
        accentColor,
        textColorPreset,
        textStylePreset,
      });

      try {
        // Use Nano Banana Pro for highest quality samples
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
                id: `${style.visualStyle}-${style.textStyle}`,
                visualStyle: style.visualStyle,
                textStyle: style.textStyle,
                textColor: style.textColor,
                name: styleInfo.name,
                description: style.description,
                image: `data:${mimeType};base64,${part.inlineData.data}`,
                designSystem: {
                  background: getBackgroundDescription(style.visualStyle, primaryColor),
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

        // If generation failed, return placeholder
        console.error(`Style sample generation failed for ${style.visualStyle}:`, await response.text());
        return {
          id: `${style.visualStyle}-${style.textStyle}`,
          visualStyle: style.visualStyle,
          textStyle: style.textStyle,
          textColor: style.textColor,
          name: styleInfo.name,
          description: style.description,
          image: null,
          error: "Generation failed",
          designSystem: {
            background: getBackgroundDescription(style.visualStyle, primaryColor),
            primaryColor: textColorPreset.primaryColor,
            accentColor: accentColor,
            typography: textStylePreset.aesthetic,
            layout: "centered",
            mood: styleInfo.description,
          },
        };
      } catch (err) {
        console.error(`Error generating ${style.visualStyle} sample:`, err);
        return {
          id: `${style.visualStyle}-${style.textStyle}`,
          visualStyle: style.visualStyle,
          textStyle: style.textStyle,
          textColor: style.textColor,
          name: styleInfo.name,
          description: style.description,
          image: null,
          error: err instanceof Error ? err.message : "Unknown error",
          designSystem: {
            background: getBackgroundDescription(style.visualStyle, primaryColor),
            primaryColor: TEXT_COLOR_PRESETS[style.textColor].primaryColor,
            accentColor: accentColor,
            typography: TEXT_STYLE_PRESETS[style.textStyle].aesthetic,
            layout: "centered",
            mood: styleInfo.description,
          },
        };
      }
    });

    const samples = await Promise.all(samplePromises);
    const successfulSamples = samples.filter(s => s.image !== null);

    return NextResponse.json({
      success: true,
      samples,
      generatedCount: successfulSamples.length,
      totalCount: ONBOARDING_STYLES.length,
    });
  } catch (error) {
    console.error("Error in POST /api/brands/style-samples:", error);
    return NextResponse.json(
      { error: "Failed to generate style samples" },
      { status: 500 }
    );
  }
}

function buildStylePrompt({
  style,
  headline,
  brandName,
  primaryColor,
  accentColor,
  textColorPreset,
  textStylePreset,
}: {
  style: typeof VISUAL_STYLES[VisualStyle];
  headline: string;
  brandName: string;
  primaryColor: string;
  accentColor: string;
  textColorPreset: typeof TEXT_COLOR_PRESETS[string];
  textStylePreset: typeof TEXT_STYLE_PRESETS[string];
}): string {
  const basePrompt = `Create a ${style.name.toLowerCase()} style social media graphic.

HEADLINE TEXT TO DISPLAY: "${headline}"

STYLE GUIDANCE:
${style.promptGuidance}

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

  return basePrompt;
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
