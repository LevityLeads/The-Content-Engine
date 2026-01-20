import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  IDEATION_SYSTEM_PROMPT,
  buildIdeationUserPrompt,
  buildVoicePrompt,
  type VoiceConfig,
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
    const { inputId, ideaCount = 4 } = body;

    // Validate ideaCount (min 1, max 10)
    const validatedIdeaCount = Math.min(Math.max(parseInt(ideaCount) || 4, 1), 10);

    if (!inputId) {
      return NextResponse.json(
        { error: "Input ID is required" },
        { status: 400 }
      );
    }

    // Fetch the input
    const { data: input, error: inputError } = await supabase
      .from("inputs")
      .select("*, brands(*)")
      .eq("id", inputId)
      .single();

    if (inputError || !input) {
      return NextResponse.json(
        { error: "Input not found" },
        { status: 404 }
      );
    }

    // Type the input data
    const inputData = input as {
      id: string;
      brand_id: string;
      type: string;
      raw_content: string;
      brands?: {
        voice_config?: Record<string, unknown>;
        visual_config?: Record<string, unknown>;
      } | null;
    };

    // Build the voice prompt from brand config (with visual config for consistent brand alignment)
    const voiceConfig = inputData.brands?.voice_config as VoiceConfig | null;
    const visualConfig = inputData.brands?.visual_config as {
      primary_color?: string;
      secondary_color?: string;
      accent_color?: string;
      image_style?: string;
    } | null;
    const brandVoicePrompt = buildVoicePrompt(voiceConfig, visualConfig);

    // Truncate very long content (e.g., from large PDFs) to avoid context limits
    // Keep first ~15000 chars which is roughly ~4000 tokens
    const MAX_CONTENT_LENGTH = 15000;
    let contentForPrompt = inputData.raw_content;
    let truncationNote = "";

    if (contentForPrompt.length > MAX_CONTENT_LENGTH) {
      contentForPrompt = contentForPrompt.slice(0, MAX_CONTENT_LENGTH);
      truncationNote = `\n\n[Note: This content was truncated from ${inputData.raw_content.length} characters. Focus on generating ideas from the available excerpt.]`;
    }

    // Build the enhanced user prompt using the new prompt system
    const userPrompt = buildIdeationUserPrompt(
      contentForPrompt + truncationNote,
      inputData.type,
      brandVoicePrompt,
      undefined, // additionalContext
      validatedIdeaCount
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
      system: IDEATION_SYSTEM_PROMPT,
    });

    // Parse the response
    const responseText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    let ideas;
    try {
      // Extract JSON from the response with multiple strategies
      let jsonStr = "";

      // Strategy 1: Look for JSON in markdown code blocks
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Strategy 2: Find the outermost JSON object with "ideas" key
      if (!jsonStr) {
        const ideasMatch = responseText.match(/\{\s*"ideas"\s*:\s*\[[\s\S]*?\]\s*\}/);
        if (ideasMatch) {
          jsonStr = ideasMatch[0];
        }
      }

      // Strategy 3: Fallback to finding any JSON object
      if (!jsonStr) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      if (!jsonStr) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonStr);
      ideas = parsed.ideas || [];

      if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error("No ideas array found in parsed response");
      }
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      console.error("Raw response (first 2000 chars):", responseText.slice(0, 2000));
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Save ideas to database
    // Handle both old format (confidenceScore as number) and new format (as object with overall)
    const ideasToInsert = ideas.map((idea: {
      concept: string;
      angle: string;
      hookApproach?: string;
      targetPlatforms: string[];
      suggestedFormat?: string;
      keyPoints: string[];
      potentialHooks: string[];
      reasoning: string;
      confidenceScore: number | { overall: number; hookStrength?: number; valueDensity?: number; shareability?: number; platformFit?: number };
    }) => {
      // Extract overall confidence score whether it's a number or object
      const overallConfidence = typeof idea.confidenceScore === "number"
        ? idea.confidenceScore
        : idea.confidenceScore?.overall ?? 75;

      // Build enhanced reasoning with hook approach and confidence breakdown
      let enhancedReasoning = idea.reasoning;

      // Add hook approach to reasoning if provided
      if (idea.hookApproach) {
        enhancedReasoning = `Hook Approach: ${idea.hookApproach}\n\n${enhancedReasoning}`;
      }

      // Add confidence breakdown if available
      if (typeof idea.confidenceScore === "object" && idea.confidenceScore !== null) {
        const scores = idea.confidenceScore;
        enhancedReasoning += `\n\nConfidence Breakdown:\n- Hook Strength: ${scores.hookStrength ?? "N/A"}\n- Value Density: ${scores.valueDensity ?? "N/A"}\n- Shareability: ${scores.shareability ?? "N/A"}\n- Platform Fit: ${scores.platformFit ?? "N/A"}`;
      }

      return {
        input_id: inputId,
        brand_id: inputData.brand_id,
        concept: idea.concept,
        angle: idea.angle,
        target_platforms: idea.targetPlatforms,
        suggested_formats: idea.suggestedFormat ? [idea.suggestedFormat] : null,
        key_points: idea.keyPoints,
        potential_hooks: idea.potentialHooks,
        ai_reasoning: enhancedReasoning,
        confidence_score: overallConfidence,
        status: "pending",
      };
    });

    const { data: savedIdeas, error: saveError } = await supabase
      .from("ideas")
      .insert(ideasToInsert)
      .select();

    if (saveError) {
      console.error("Error saving ideas:", saveError);
      return NextResponse.json(
        { error: "Failed to save ideas" },
        { status: 500 }
      );
    }

    // Update input status
    await supabase
      .from("inputs")
      .update({ status: "ideated" })
      .eq("id", inputId);

    return NextResponse.json({
      success: true,
      ideas: savedIdeas,
    });
  } catch (error) {
    console.error("Error in POST /api/ideas/generate:", error);
    // Return more specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
