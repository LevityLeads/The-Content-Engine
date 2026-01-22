import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, DEFAULT_MODEL, extractTextContent } from "@/lib/anthropic/client";

const SUGGESTION_SYSTEM_PROMPT = `You are an expert social media content strategist. Your task is to refine and improve an existing content idea based on user suggestions.

When refining an idea:
1. Preserve the core concept unless explicitly asked to change it
2. Apply the user's suggestions thoughtfully
3. Maintain or improve the hook quality
4. Keep the idea platform-appropriate
5. Ensure the refined idea is still scroll-stopping and valuable

Return the refined idea in the exact same JSON format as the original.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { ideaId, suggestions } = body;

    if (!ideaId) {
      return NextResponse.json(
        { error: "Idea ID is required" },
        { status: 400 }
      );
    }

    if (!suggestions || suggestions.trim().length === 0) {
      return NextResponse.json(
        { error: "Suggestions are required" },
        { status: 400 }
      );
    }

    // Fetch the existing idea with its input
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("*, inputs(*), brands(*)")
      .eq("id", ideaId)
      .single();

    if (ideaError || !idea) {
      console.error("Error fetching idea:", ideaError);
      return NextResponse.json(
        { error: "Idea not found" },
        { status: 404 }
      );
    }

    // Build the prompt for Claude
    const userPrompt = `## Current Idea

**Concept**: ${idea.concept}

**Angle**: ${idea.angle}

**Target Platforms**: ${(idea.target_platforms || []).join(", ")}

**Key Points**:
${(idea.key_points || []).map((p: string) => `- ${p}`).join("\n")}

**Current Hooks**:
${(idea.potential_hooks || []).map((h: string) => `- "${h}"`).join("\n")}

**Why This Works**:
${idea.ai_reasoning || "N/A"}

**Confidence Score**: ${idea.confidence_score}%

---

## User's Suggestions

${suggestions}

---

## Your Task

Apply the user's suggestions to improve this idea. Return the refined idea as JSON:

\`\`\`json
{
  "concept": "Updated concept (1-2 sentences)",
  "angle": "educational|entertaining|inspirational|promotional|conversational",
  "targetPlatforms": ["twitter", "linkedin", "instagram"],
  "keyPoints": [
    "Updated key point 1",
    "Updated key point 2",
    "Updated key point 3"
  ],
  "potentialHooks": [
    "Updated hook option 1",
    "Updated hook option 2"
  ],
  "reasoning": "Updated explanation of why this will perform",
  "confidenceScore": 85
}
\`\`\`

Apply the suggestions while maintaining the content's potential for engagement. Be creative but stay true to the user's intent.`;

    // Call Claude
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      system: SUGGESTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Parse the response
    const responseText = extractTextContent(message);

    let refinedIdea;
    try {
      // Extract JSON from response
      let jsonStr = "";

      // Strategy 1: Look for JSON in markdown code blocks
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Strategy 2: Find any JSON object
      if (!jsonStr) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      if (!jsonStr) {
        throw new Error("No JSON found in response");
      }

      refinedIdea = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      console.error("Raw response:", responseText.slice(0, 1000));
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Update the idea in the database
    const updateData = {
      concept: refinedIdea.concept || idea.concept,
      angle: refinedIdea.angle || idea.angle,
      target_platforms: refinedIdea.targetPlatforms || idea.target_platforms,
      key_points: refinedIdea.keyPoints || idea.key_points,
      potential_hooks: refinedIdea.potentialHooks || idea.potential_hooks,
      ai_reasoning: refinedIdea.reasoning || idea.ai_reasoning,
      confidence_score: typeof refinedIdea.confidenceScore === "number"
        ? refinedIdea.confidenceScore
        : idea.confidence_score,
      // Keep status as pending so user can approve/reject
      status: "pending",
    };

    const { data: updatedIdea, error: updateError } = await supabase
      .from("ideas")
      .update(updateData)
      .eq("id", ideaId)
      .select("*, inputs(*)")
      .single();

    if (updateError) {
      console.error("Error updating idea:", updateError);
      return NextResponse.json(
        { error: "Failed to update idea" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      idea: updatedIdea,
    });
  } catch (error) {
    console.error("Error in POST /api/ideas/suggest:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
