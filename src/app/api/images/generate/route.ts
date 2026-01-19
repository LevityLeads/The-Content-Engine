import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Using Nano Banana Pro (gemini-3-pro-image-preview) with Thinking for high-quality image generation
// Note: This model may take longer than Flash but produces better quality
// See: https://ai.google.dev/gemini-api/docs/image-generation

// Platform-specific image configurations
// Sources: https://blog.hootsuite.com/social-media-image-sizes-guide/
//          https://buffer.com/resources/social-media-image-sizes/
const PLATFORM_IMAGE_CONFIG: Record<string, {
  aspectRatio: string;
  width: number;
  height: number;
  description: string;
}> = {
  instagram: {
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
    description: "Instagram vertical feed post (4:5 ratio - optimal for engagement)",
  },
  twitter: {
    aspectRatio: "16:9",
    width: 1600,
    height: 900,
    description: "Twitter/X feed post (16:9 landscape - optimal display in timeline)",
  },
  linkedin: {
    aspectRatio: "16:9",
    width: 1200,
    height: 675,
    description: "LinkedIn feed post (16:9 landscape - optimal for professional feed)",
  },
};

// Default config for unknown platforms
const DEFAULT_CONFIG = {
  aspectRatio: "1:1",
  width: 1080,
  height: 1080,
  description: "Square image (1:1 - universal format)",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { contentId, prompt } = body;

    if (!contentId || !prompt) {
      return NextResponse.json(
        { error: "Content ID and prompt are required" },
        { status: 400 }
      );
    }

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
        // Build platform-specific prompt
        const fullPrompt = `${prompt}.

IMAGE FORMAT REQUIREMENTS:
- This image is for ${platform.toUpperCase()} - ${imageConfig.description}
- Dimensions: ${imageConfig.width}x${imageConfig.height} pixels
- Aspect ratio: ${imageConfig.aspectRatio}
- Optimize composition for this specific format

STYLE REQUIREMENTS:
- Include a bold, attention-grabbing headline or hook text directly on the image
- The text should be large, readable, and designed to STOP THE SCROLL
- Make viewers instantly intrigued and want to learn more
- Use striking typography that pops against the background
- High contrast, vibrant colors that demand attention
- Professional social media aesthetic but with punch
- The headline should create curiosity and urgency
- Think viral content - what makes someone stop scrolling?
- Leave safe zones for platform UI elements (profile pics, buttons, etc.)`;

        // Use Nano Banana Pro (Gemini 3 Pro Image) with thinking for higher quality
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${googleApiKey}`,
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
          console.log("Nano Banana response structure:", JSON.stringify({
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
              generationMessage = `Image generated for ${platform.toUpperCase()} (${imageConfig.width}x${imageConfig.height})`;
              console.log(`Image generated successfully, base64 length: ${imageBase64.length}`);
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
            generationMessage = "Nano Banana Pro returned no image. The prompt may have been filtered.";
          }
        } else {
          const errorData = await response.text();
          console.error("Nano Banana Pro API error:", errorData);
          generationMessage = `Nano Banana Pro generation failed: ${response.status}. Image prompt saved for retry.`;
        }
      } catch (err) {
        console.error("Nano Banana Pro API error:", err);
        generationMessage = "Nano Banana Pro generation failed. Image prompt saved for manual creation.";
      }
    } else {
      generationMessage = "No image generation API configured. Add GOOGLE_API_KEY for Nano Banana Pro image generation.";
    }

    // Save image record to database with platform-specific dimensions
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
