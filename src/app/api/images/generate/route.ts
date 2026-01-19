import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IMAGE_MODELS, DEFAULT_MODEL, type ImageModelKey } from "@/lib/image-models";

// Platform-specific image dimensions (for internal use only - NOT sent to image generator)
const PLATFORM_IMAGE_CONFIG: Record<string, {
  aspectRatio: string;
  width: number;
  height: number;
}> = {
  instagram: {
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
  },
  twitter: {
    aspectRatio: "16:9",
    width: 1600,
    height: 900,
  },
  linkedin: {
    aspectRatio: "16:9",
    width: 1200,
    height: 675,
  },
};

// Default config for unknown platforms
const DEFAULT_CONFIG = {
  aspectRatio: "1:1",
  width: 1080,
  height: 1080,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { contentId, prompt, model: requestedModel } = body;

    if (!contentId || !prompt) {
      return NextResponse.json(
        { error: "Content ID and prompt are required" },
        { status: 400 }
      );
    }

    // Determine which model to use
    const modelKey: ImageModelKey = (requestedModel && requestedModel in IMAGE_MODELS)
      ? requestedModel as ImageModelKey
      : DEFAULT_MODEL;
    const modelConfig = IMAGE_MODELS[modelKey];

    // Fetch the content to verify it exists and get platform
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("id, platform")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Get platform-specific image configuration
    const platform = (content.platform || "").toLowerCase();
    const imageConfig = PLATFORM_IMAGE_CONFIG[platform] || DEFAULT_CONFIG;

    // Check if we have the Google API key for Nano Banana Pro
    const googleApiKey = process.env.GOOGLE_API_KEY;

    let imageUrl = null;
    let imageBase64 = null;
    let generationStatus = "pending";
    let generationMessage = "";

    if (googleApiKey) {
      try {
        // Build clean prompt WITHOUT any social media or platform references
        // The image generator should create a pure graphic design, not a mockup
        const fullPrompt = `${prompt}

CRITICAL OUTPUT REQUIREMENTS:
- Create a clean graphic design with typography
- Aspect ratio: ${imageConfig.aspectRatio}
- DO NOT include any app interfaces, phone screens, or UI elements
- DO NOT include like buttons, comment icons, share buttons, or follower counts
- DO NOT include profile pictures, avatars, or user interface elements
- DO NOT include any social media mockups or frames
- The output should be ONLY the designed graphic itself
- Pure editorial/poster-style design with text and visuals only`;

        // Use the selected model for image generation
        console.log(`Using model: ${modelConfig.name} (${modelConfig.id})`);
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
                  parts: [
                    {
                      text: fullPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
                imageConfig: {
                  aspectRatio: imageConfig.aspectRatio,
                },
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Log response structure for debugging
          console.log(`${modelConfig.name} response structure:`, JSON.stringify({
            hasCandidates: !!data.candidates,
            candidateCount: data.candidates?.length,
            hasContent: !!data.candidates?.[0]?.content,
            partsCount: data.candidates?.[0]?.content?.parts?.length,
            partTypes: data.candidates?.[0]?.content?.parts?.map((p: Record<string, unknown>) => Object.keys(p)),
          }));

          // Extract base64 image from response
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              imageBase64 = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";
              imageUrl = `data:${mimeType};base64,${imageBase64}`;
              generationStatus = "generated";
              generationMessage = `Image generated with ${modelConfig.name} for ${platform.toUpperCase()} (${imageConfig.width}x${imageConfig.height})`;
              console.log(`Image generated successfully with ${modelConfig.name}, base64 length: ${imageBase64.length}`);
              break;
            }
          }

          if (!imageUrl) {
            // Log what we got instead
            console.log("No image in response. Parts received:", parts.map((p: Record<string, unknown>) => ({
              hasText: !!p.text,
              hasInlineData: !!p.inlineData,
              textPreview: typeof p.text === 'string' ? p.text.substring(0, 100) : undefined,
            })));
            generationMessage = `${modelConfig.name} returned no image. The prompt may have been filtered.`;
          }
        } else {
          const errorData = await response.text();
          console.error(`${modelConfig.name} API error:`, errorData);
          generationMessage = `${modelConfig.name} generation failed: ${response.status}. Image prompt saved for retry.`;
        }
      } catch (err) {
        console.error(`${modelConfig.name} API error:`, err);
        generationMessage = `${modelConfig.name} generation failed. Image prompt saved for manual creation.`;
      }
    } else {
      generationMessage = "No image generation API configured. Add GOOGLE_API_KEY for Nano Banana Pro image generation.";
    }

    // Save image record to database with platform-specific dimensions and model info
    const { data: savedImage, error: saveError } = await supabase
      .from("images")
      .insert({
        content_id: contentId,
        prompt: prompt,
        url: imageUrl || `placeholder:${content.platform}`,
        is_primary: true,
        format: "png",
        dimensions: {
          width: imageConfig.width,
          height: imageConfig.height,
          aspectRatio: imageConfig.aspectRatio,
        },
        model: modelKey,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving image:", saveError);
      return NextResponse.json(
        { error: "Failed to save image record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: savedImage,
      generated: !!imageUrl,
      status: generationStatus,
      message: generationMessage,
      platform: platform,
      dimensions: {
        width: imageConfig.width,
        height: imageConfig.height,
        aspectRatio: imageConfig.aspectRatio,
      },
      model: {
        key: modelKey,
        name: modelConfig.name,
        description: modelConfig.description,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/images/generate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    const { data: images, error } = await supabase
      .from("images")
      .select("*")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error);
      return NextResponse.json(
        { error: "Failed to fetch images" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Error in GET /api/images/generate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
