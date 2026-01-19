import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const IDEATION_SYSTEM_PROMPT = `You are a creative social media strategist helping generate content ideas.

Your task is to take raw input (text, article summary, or notes) and generate compelling content ideas for social media.

For each idea, provide:
1. A compelling concept (1-2 sentences describing the post idea)
2. The content angle (one of: educational, entertaining, inspirational, promotional, conversational)
3. Recommended platforms (array of: twitter, instagram, linkedin)
4. 3-5 key points to cover in the post
5. A potential hook/opening line
6. Brief reasoning for why this will resonate with audiences

Focus on ideas that:
- Are platform-appropriate
- Have engagement potential
- Can be created with text and static images
- Feel authentic, not generic

Respond in JSON format with an array of ideas:
{
  "ideas": [
    {
      "concept": "string",
      "angle": "educational" | "entertaining" | "inspirational" | "promotional" | "conversational",
      "targetPlatforms": ["twitter", "instagram", "linkedin"],
      "keyPoints": ["string", "string", "string"],
      "potentialHooks": ["string"],
      "reasoning": "string",
      "confidenceScore": number (0-100)
    }
  ]
}`;

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
    const { inputId } = body;

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
      brands?: { voice_config?: Record<string, unknown> } | null;
    };

    // Build the prompt
    const brandContext = inputData.brands?.voice_config
      ? `Brand Voice: ${JSON.stringify(inputData.brands.voice_config)}`
      : "";

    // Truncate very long content (e.g., from large PDFs) to avoid context limits
    // Keep first ~15000 chars which is roughly ~4000 tokens
    const MAX_CONTENT_LENGTH = 15000;
    let contentForPrompt = inputData.raw_content;
    let truncationNote = "";

    if (contentForPrompt.length > MAX_CONTENT_LENGTH) {
      contentForPrompt = contentForPrompt.slice(0, MAX_CONTENT_LENGTH);
      truncationNote = `\n\n[Note: This content was truncated from ${inputData.raw_content.length} characters. Focus on generating ideas from the available excerpt.]`;
    }

    const userPrompt = `${brandContext}

INPUT TO TRANSFORM:
Type: ${inputData.type}
Content: ${contentForPrompt}${truncationNote}

Generate 4 distinct content ideas for social media posts based on this input. Return ONLY valid JSON with no markdown formatting.`;

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
    const ideasToInsert = ideas.map((idea: {
      concept: string;
      angle: string;
      targetPlatforms: string[];
      keyPoints: string[];
      potentialHooks: string[];
      reasoning: string;
      confidenceScore: number;
    }) => ({
      input_id: inputId,
      brand_id: inputData.brand_id,
      concept: idea.concept,
      angle: idea.angle,
      target_platforms: idea.targetPlatforms,
      key_points: idea.keyPoints,
      potential_hooks: idea.potentialHooks,
      ai_reasoning: idea.reasoning,
      confidence_score: idea.confidenceScore,
      status: "pending",
    }));

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
