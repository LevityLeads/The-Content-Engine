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
    const { ideaId, platforms: selectedPlatforms, visualStyle } = body as {
      ideaId: string;
      platforms?: string[];
      visualStyle?: VisualStyle;
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
      brands?: { voice_config?: Record<string, unknown>; name?: string } | null;
    };

    // Use selected platforms if provided, otherwise use idea's target platforms
    const platformsToGenerate = selectedPlatforms && selectedPlatforms.length > 0
      ? selectedPlatforms
      : ideaData.target_platforms;

    // Build the voice prompt from brand config
    const voiceConfig = ideaData.brands?.voice_config as VoiceConfig | null;
    const brandVoicePrompt = buildVoicePrompt(voiceConfig);

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
      undefined, // additionalInstructions
      visualStyle // visual style override (optional)
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
      copy_carousel_slides: post.carouselSlides
        ? post.carouselSlides.map((slide) => JSON.stringify(slide))
        : null,
      status: "draft",
      metadata: {
        imagePrompt: post.imagePrompt || null,
        carouselStyle: post.carouselStyle || null,
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
