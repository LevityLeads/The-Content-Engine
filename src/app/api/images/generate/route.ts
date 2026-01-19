import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Using Nano Banana Pro (Gemini 3 Pro Image) with Thinking for image generation
// See: https://ai.google.dev/gemini-api/docs/image-generation

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

    // Fetch the content to verify it exists
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

    // Check if we have the Google API key for Nano Banana Pro
    const googleApiKey = process.env.GOOGLE_API_KEY;

    let imageUrl = null;
    let imageBase64 = null;
    let generationStatus = "pending";
    let generationMessage = "";

    if (googleApiKey) {
      try {
        // Use Nano Banana Pro (Gemini 3 Pro Image Preview) with Thinking for image generation
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
                      text: `${prompt}.

IMPORTANT STYLE REQUIREMENTS:
- Include a bold, attention-grabbing headline or hook text directly on the image
- The text should be large, readable, and designed to STOP THE SCROLL
- Make viewers instantly intrigued and want to learn more
- Use striking typography that pops against the background
- High contrast, vibrant colors that demand attention
- Professional social media aesthetic but with punch
- The headline should create curiosity and urgency
- Think viral content - what makes someone stop scrolling?`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Extract base64 image from response
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              imageBase64 = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";
              imageUrl = `data:${mimeType};base64,${imageBase64}`;
              generationStatus = "generated";
              generationMessage = "Image generated successfully with Nano Banana Pro (Gemini Image Generation)";
              break;
            }
          }

          if (!imageUrl) {
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

    // Save image record to database
    const { data: savedImage, error: saveError } = await supabase
      .from("images")
      .insert({
        content_id: contentId,
        prompt: prompt,
        url: imageUrl || `placeholder:${content.platform}`,
        is_primary: true,
        format: "png",
        dimensions: { width: 1024, height: 1024 },
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
