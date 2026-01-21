import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  CONTENT_SYSTEM_PROMPT,
  buildContentUserPrompt,
  buildVoicePrompt,
  type VoiceConfig,
  type VisualStyle,
} from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();
    // Use string type for visualStyle to accept "video", "mixed-carousel", etc.
    // which are special modes, not just carousel image styles
    const { ideaId, platforms: selectedPlatforms, visualStyle } = body as {
      ideaId: string;
      platforms?: string[];
      visualStyle?: string;
    };

    if (!ideaId) {
      return NextResponse.json(
        { error: "Idea ID is required" },
        { status: 400 }
      );
    }

    // Fetch the idea with its input
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("*, inputs(*), brands(*)")
      .eq("id", ideaId)
      .single();

    if (ideaError || !idea) {
      return NextResponse.json(
        { error: "Idea not found" },
        { status: 404 }
      );
    }

    // Type the idea data
    const ideaData = idea as {
      id: string;
      brand_id: string;
      concept: string;
      angle: string;
      target_platforms: string[];
      key_points: string[];
      potential_hooks: string[];
      inputs?: { raw_content: string; type: string } | null;
      brands?: {
        voice_config?: Record<string, unknown>;
        visual_config?: Record<string, unknown>;
        name?: string;
      } | null;
    };

    // Use selected platforms if provided, otherwise use idea's target platforms
    const platformsToGenerate = selectedPlatforms && selectedPlatforms.length > 0
      ? selectedPlatforms
      : ideaData.target_platforms;

    // Build the voice prompt from brand config (with visual config for image consistency)
    const voiceConfig = ideaData.brands?.voice_config as VoiceConfig | null;
    const visualConfig = ideaData.brands?.visual_config as {
      primary_color?: string;
      secondary_color?: string;
      accent_color?: string;
      image_style?: string;
      fonts?: { heading?: string; body?: string };
    } | null;
    const brandVoicePrompt = buildVoicePrompt(voiceConfig, visualConfig);

    // Determine content mode based on visualStyle
    // - "video" = Single video post (no carousel)
    // - "mixed-carousel" = Carousel with video slide(s) + images
    // - other styles = Regular carousel with images only
    const isSingleVideoMode = visualStyle === "video";
    const isMixedCarouselMode = visualStyle === "mixed-carousel";
    const isVideoMode = isSingleVideoMode || isMixedCarouselMode;

    // For AI prompt, only pass valid IMAGE styles
    const imageStyleForPrompt = isVideoMode ? undefined : visualStyle as VisualStyle | undefined;

    // Add special instructions for video mode
    let additionalInstructions: string | undefined;
    if (isSingleVideoMode) {
      additionalInstructions = `
IMPORTANT: Generate content for a SINGLE VIDEO POST (not a carousel).

For Instagram video posts:
- Do NOT generate carouselSlides
- Generate a compelling caption in primaryCopy
- Generate a videoPrompt field with a detailed prompt for AI video generation
- The videoPrompt should describe: scene, action, mood, style, camera movement
- Keep the video concept simple and focused on ONE key message

Example videoPrompt: "Cinematic shot of ocean waves crashing on rocky shore at golden hour. Camera slowly pans across the scene. Dramatic lighting with warm orange and deep blue tones. Peaceful, contemplative mood. 4K quality, smooth motion."

Return format for video posts:
{
  "platform": "instagram",
  "primaryCopy": "Your caption here...",
  "hashtags": [...],
  "cta": "...",
  "videoPrompt": "Detailed video generation prompt...",
  "carouselSlides": null
}`;
    }

    // Build the enhanced user prompt using the new prompt system
    const userPrompt = buildContentUserPrompt(
      {
        concept: ideaData.concept,
        angle: ideaData.angle,
        keyPoints: ideaData.key_points || [],
        potentialHooks: ideaData.potential_hooks || [],
      },
      ideaData.inputs?.raw_content || "No source content available",
      platformsToGenerate || [],
      brandVoicePrompt,
      additionalInstructions,
      imageStyleForPrompt // Only pass valid image styles to AI prompt
    );

    // Call Claude Opus 4.5
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: CONTENT_SYSTEM_PROMPT,
    });

    // Parse the response
    const responseText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    let posts;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        posts = parsed.posts || [];
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      console.error("Raw response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Save content to database
    const contentToInsert = posts.map((post: {
      platform: string;
      primaryCopy: string;
      hashtags?: string[];
      cta?: string;
      threadParts?: string[] | null;
      carouselSlides?: Array<{ slideNumber: number; text: string; imagePrompt: string }> | null;
      imagePrompt?: string;
      videoPrompt?: string;
      carouselStyle?: Record<string, unknown> | string;
    }) => ({
      idea_id: ideaId,
      brand_id: ideaData.brand_id,
      platform: post.platform,
      copy_primary: post.primaryCopy,
      copy_hashtags: post.hashtags || [],
      copy_cta: post.cta || null,
      copy_thread_parts: post.threadParts || null,
      // Convert carousel slides objects to JSON strings for TEXT[] column
      // For single video mode, don't include carousel slides
      copy_carousel_slides: (isSingleVideoMode || !post.carouselSlides)
        ? null
        : post.carouselSlides.map((slide) => JSON.stringify(slide)),
      status: "draft",
      metadata: {
        imagePrompt: post.imagePrompt || null,
        videoPrompt: post.videoPrompt || null,
        carouselStyle: post.carouselStyle || null,
        visualStyle: visualStyle || null,
        // Content type for UI rendering
        contentType: isSingleVideoMode ? "video" : (post.carouselSlides ? "carousel" : "single-image"),
      },
    }));

    const { data: savedContent, error: saveError } = await supabase
      .from("content")
      .insert(contentToInsert)
      .select();

    if (saveError) {
      console.error("Error saving content:", saveError);
      return NextResponse.json(
        { error: "Failed to save content" },
        { status: 500 }
      );
    }

    // Update idea status
    await supabase
      .from("ideas")
      .update({ status: "generated" })
      .eq("id", ideaId);

    return NextResponse.json({
      success: true,
      content: savedContent,
    });
  } catch (error) {
    console.error("Error in POST /api/content/generate:", error);
    // Return more specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
