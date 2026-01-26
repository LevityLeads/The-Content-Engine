import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildV2IdeationPrompt,
  buildV2IdeationUserPrompt,
  buildV2ContentPrompt,
  buildV2ContentUserPrompt,
  quickAssess,
  generateResearchPrompt,
  auditForAIPatterns,
  auditRhythm,
  assessSaveWorthiness,
  type RiskLevel,
  type ContentIdea,
} from "@/lib/prompts/v2";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      input,
      riskLevel = "balanced",
      platform = "twitter",
      mode = "ideate", // "ideate" | "generate" | "full"
      idea, // Required if mode === "generate"
    } = body;

    if (!input && mode !== "generate") {
      return NextResponse.json(
        { success: false, error: "Input is required" },
        { status: 400 }
      );
    }

    // Step 1: Assess input quality
    const inputAssessment = input ? quickAssess(input) : null;

    // Step 2: Research if input is thin
    let enrichedInput = input;
    let researchResult = null;

    if (inputAssessment && inputAssessment.likelyTier === "thin") {
      const researchPrompt = generateResearchPrompt(input, "all");

      const researchResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: researchPrompt }],
      });

      const researchText = researchResponse.content[0].type === "text"
        ? researchResponse.content[0].text
        : "";

      try {
        // Try to parse JSON from response
        const jsonMatch = researchText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          researchResult = JSON.parse(jsonMatch[0]);
          enrichedInput = researchResult.enrichedInput || input;
        }
      } catch {
        // If parsing fails, use raw research as context
        enrichedInput = `${input}\n\nResearch Context:\n${researchText}`;
      }
    }

    // Mode: Ideate only
    if (mode === "ideate") {
      const systemPrompt = buildV2IdeationPrompt({
        riskLevel: riskLevel as RiskLevel,
        platforms: [platform],
      });

      const userPrompt = buildV2IdeationUserPrompt({
        input: enrichedInput,
      });

      const ideationResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const ideationText = ideationResponse.content[0].type === "text"
        ? ideationResponse.content[0].text
        : "";

      // Parse ideas from response
      let ideas: ContentIdea[] = [];
      try {
        const jsonMatch = ideationText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Return raw text if parsing fails
      }

      return NextResponse.json({
        success: true,
        mode: "ideate",
        inputAssessment,
        researchResult,
        ideas,
        rawResponse: ideationText,
      });
    }

    // Mode: Generate content from idea
    if (mode === "generate") {
      if (!idea) {
        return NextResponse.json(
          { success: false, error: "Idea is required for generate mode" },
          { status: 400 }
        );
      }

      const systemPrompt = buildV2ContentPrompt({
        riskLevel: riskLevel as RiskLevel,
        platform,
      });

      const userPrompt = buildV2ContentUserPrompt({
        idea: idea as ContentIdea,
        additionalContext: input,
      });

      const contentResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const contentText = contentResponse.content[0].type === "text"
        ? contentResponse.content[0].text
        : "";

      // Parse content from response
      let content = null;
      try {
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Return raw text if parsing fails
      }

      // Audit the generated content
      let audit = null;
      if (content?.copy) {
        const copyText = content.copy.type === "single"
          ? content.copy.text
          : content.copy.type === "thread"
          ? content.copy.tweets?.join(" ")
          : content.copy.type === "carousel"
          ? content.copy.slides?.map((s: { headline: string; body?: string }) => `${s.headline} ${s.body || ""}`).join(" ")
          : "";

        if (copyText) {
          audit = {
            aiPatterns: auditForAIPatterns(copyText),
            rhythm: auditRhythm(copyText),
            saveWorthiness: assessSaveWorthiness(copyText),
          };
        }
      }

      return NextResponse.json({
        success: true,
        mode: "generate",
        content,
        audit,
        rawResponse: contentText,
      });
    }

    // Mode: Full pipeline (ideate + generate best idea)
    if (mode === "full") {
      // First, ideate
      const ideationSystemPrompt = buildV2IdeationPrompt({
        riskLevel: riskLevel as RiskLevel,
        platforms: [platform],
      });

      const ideationUserPrompt = buildV2IdeationUserPrompt({
        input: enrichedInput,
      });

      const ideationResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: ideationSystemPrompt,
        messages: [{ role: "user", content: ideationUserPrompt }],
      });

      const ideationText = ideationResponse.content[0].type === "text"
        ? ideationResponse.content[0].text
        : "";

      let ideas: ContentIdea[] = [];
      try {
        const jsonMatch = ideationText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        }
      } catch {
        return NextResponse.json({
          success: false,
          error: "Failed to parse ideas",
          rawResponse: ideationText,
        });
      }

      if (ideas.length === 0) {
        return NextResponse.json({
          success: false,
          error: "No ideas generated",
          rawResponse: ideationText,
        });
      }

      // Pick the best idea (first bold one, or first balanced, or first)
      const bestIdea =
        ideas.find(i => i.riskLevel === "bold") ||
        ideas.find(i => i.riskLevel === "balanced") ||
        ideas[0];

      // Generate content from best idea
      const contentSystemPrompt = buildV2ContentPrompt({
        riskLevel: bestIdea.riskLevel as RiskLevel,
        platform: bestIdea.platform,
      });

      const contentUserPrompt = buildV2ContentUserPrompt({
        idea: bestIdea,
      });

      const contentResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: contentSystemPrompt,
        messages: [{ role: "user", content: contentUserPrompt }],
      });

      const contentText = contentResponse.content[0].type === "text"
        ? contentResponse.content[0].text
        : "";

      let content = null;
      try {
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Return raw text if parsing fails
      }

      // Audit the generated content
      let audit = null;
      if (content?.copy) {
        const copyText = content.copy.type === "single"
          ? content.copy.text
          : content.copy.type === "thread"
          ? content.copy.tweets?.join(" ")
          : content.copy.type === "carousel"
          ? content.copy.slides?.map((s: { headline: string; body?: string }) => `${s.headline} ${s.body || ""}`).join(" ")
          : "";

        if (copyText) {
          audit = {
            aiPatterns: auditForAIPatterns(copyText),
            rhythm: auditRhythm(copyText),
            saveWorthiness: assessSaveWorthiness(copyText),
          };
        }
      }

      return NextResponse.json({
        success: true,
        mode: "full",
        inputAssessment,
        researchResult,
        ideas,
        selectedIdea: bestIdea,
        content,
        audit,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid mode" },
      { status: 400 }
    );
  } catch (error) {
    console.error("V2 content generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
