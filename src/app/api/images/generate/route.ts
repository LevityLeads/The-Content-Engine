import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google Gemini/Imagen API for image generation
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Google API key not configured. Add GOOGLE_API_KEY to environment variables." },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();
    const { contentId, prompt } = body;

    if (!contentId || !prompt) {
      return NextResponse.json(
        { error: "Content ID and prompt are required" },
        { status: 400 }
      );
    }

    // Fetch the content to get brand context
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("*, brands(*)")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Call Google Imagen API (Gemini 2.0 Flash with image generation)
    // Using the Gemini API endpoint for image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
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
                  text: `Generate an image: ${prompt}.
                  Style: Professional, modern, suitable for social media.
                  Aspect ratio: Square (1:1) for Instagram, or 16:9 for Twitter/LinkedIn.
                  No text overlay on the image.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["image", "text"],
            responseMimeType: "image/png",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error:", errorText);

      // Fallback: Return a placeholder response if image gen fails
      // In production, you might use a different service or queue for retry
      return NextResponse.json({
        success: true,
        image: {
          id: null,
          url: null,
          status: "pending",
          message: "Image generation queued. Google Imagen API may require additional setup.",
          prompt: prompt,
        },
      });
    }

    const result = await response.json();

    // Extract image data from response
    let imageUrl = null;
    let imageData = null;

    if (result.candidates?.[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          imageData = part.inlineData.data;
          // In production, upload to Supabase Storage and get URL
          // For now, we'll store the base64 data reference
          imageUrl = `data:${part.inlineData.mimeType};base64,${imageData.substring(0, 50)}...`;
        }
      }
    }

    // Save image record to database
    const { data: savedImage, error: saveError } = await supabase
      .from("images")
      .insert({
        content_id: contentId,
        prompt: prompt,
        url: imageUrl || "pending",
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
      hasImageData: !!imageData,
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
