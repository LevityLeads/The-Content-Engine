import { NextRequest, NextResponse } from "next/server";
import { buildBrandAwareImagePrompt, type BrandVisualConfig } from "@/lib/visual-strictness";
import { IMAGE_MODELS, DEFAULT_MODEL, type ImageModelKey } from "@/lib/image-models";

/**
 * Generate preview images for a brand configuration
 * POST /api/brands/preview
 *
 * This is a lightweight endpoint for generating sample images during
 * brand onboarding to show the user what their brand style will look like.
 *
 * Request body:
 * - brandConfig: BrandVisualConfig - The brand configuration to use
 * - strictness: number (0-1) - How strictly to follow brand guidelines
 * - count?: number (1-3) - Number of preview images to generate (default: 1)
 *
 * Returns:
 * - success: boolean
 * - previews: Array<{ prompt: string, image: string }> - Generated preview images
 */

// Sample prompts for preview generation
const SAMPLE_PROMPTS = [
  "Create a bold social media graphic with the headline: 'Your success starts with a single step'",
  "Design an engaging post featuring the text: '5 Things Winners Do Differently'",
  "Make a motivational graphic with: 'Transform your mindset, transform your life'",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandConfig,
      strictness = 0.7,
      count = 1,
    } = body;

    const typedBrandConfig = brandConfig as BrandVisualConfig | undefined;

    if (!typedBrandConfig?.master_brand_prompt) {
      return NextResponse.json(
        { success: false, error: "Brand config with master_brand_prompt is required" },
        { status: 400 }
      );
    }

    // Validate count
    const previewCount = Math.min(Math.max(1, count), 3);

    // Check Google API key
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { success: false, error: "Image generation not configured (missing GOOGLE_API_KEY)" },
        { status: 500 }
      );
    }

    // Get model config
    const modelConfig = IMAGE_MODELS[DEFAULT_MODEL];

    // Generate preview images
    const previews: Array<{ prompt: string; image: string }> = [];

    for (let i = 0; i < previewCount; i++) {
      const samplePrompt = SAMPLE_PROMPTS[i % SAMPLE_PROMPTS.length];

      // Build brand-aware prompt
      const fullPrompt = buildBrandAwareImagePrompt(
        typedBrandConfig.master_brand_prompt,
        undefined, // No treatment for previews
        samplePrompt,
        strictness,
        typedBrandConfig
      );

      // Add aspect ratio (Instagram 4:5 for previews)
      const aspectRatio = "4:5";
      const promptWithAspect = `${fullPrompt}\n\nAspect ratio: ${aspectRatio}`;

      console.log(`[Brand Preview] Generating preview ${i + 1}/${previewCount}`);

      try {
        // Call Gemini API
        const generationConfig: Record<string, unknown> = {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent?key=${googleApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: promptWithAspect }],
                },
              ],
              generationConfig,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Brand Preview] Gemini API error: ${response.status}`, errorText);
          continue; // Skip this preview, try next
        }

        const result = await response.json();

        // Extract image from response
        const candidates = result.candidates || [];
        for (const candidate of candidates) {
          const parts = candidate.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
              const base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              previews.push({
                prompt: samplePrompt,
                image: base64Image,
              });
              break;
            }
          }
          if (previews.length > i) break; // Found image for this preview
        }
      } catch (genError) {
        console.error(`[Brand Preview] Error generating preview ${i + 1}:`, genError);
        // Continue to next preview
      }
    }

    if (previews.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to generate any preview images" },
        { status: 500 }
      );
    }

    console.log(`[Brand Preview] Successfully generated ${previews.length} preview(s)`);

    return NextResponse.json({
      success: true,
      previews,
      count: previews.length,
    });
  } catch (error) {
    console.error("[Brand Preview] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
