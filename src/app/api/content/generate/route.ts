import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CONTENT_SYSTEM_PROMPT = `You are an expert social media copywriter. Your job is to transform content ideas into platform-optimized posts.

For each platform, follow these guidelines:

**Twitter/X:**
- Max 280 characters (leave room for engagement)
- Punchy, conversational tone
- Use line breaks for readability
- Include 1-2 relevant hashtags max
- Hook in the first line

**LinkedIn:**
- Professional but personable
- Can be longer (up to 3000 chars), but sweet spot is 150-300 words
- Use line breaks and white space
- Start with a hook, end with a question or CTA
- 3-5 relevant hashtags at the end

**Instagram:**
- Engaging, visual-friendly copy
- Can use emojis sparingly
- Strong hook in first line (before "more" cutoff)
- Include CTA
- 5-10 relevant hashtags (can be more)
- For educational/list content, CREATE A CAROUSEL with 4-6 slides max
- Each carousel slide should be concise and impactful

**CAROUSEL RULES (Instagram):**
- Maximum 6 slides per carousel
- Slide 1: Hook/title that grabs attention
- Slides 2-5: Key points, one per slide
- Final slide: CTA or summary
- Each slide needs its own image prompt
- ALL slide image prompts must share a consistent visual style (same color palette, fonts, design elements)

Respond in JSON format:
{
  "posts": [
    {
      "platform": "twitter" | "linkedin" | "instagram",
      "primaryCopy": "The main post text/caption",
      "hashtags": ["hashtag1", "hashtag2"],
      "cta": "Optional call to action",
      "threadParts": ["For Twitter threads - array of tweets"] | null,
      "carouselSlides": [
        {
          "slideNumber": 1,
          "text": "Slide text content",
          "imagePrompt": "Detailed image prompt for this specific slide"
        }
      ] | null,
      "imagePrompt": "For non-carousel posts: detailed prompt for the main image",
      "carouselStyle": "For carousels: describe the consistent visual style (colors, fonts, mood) to use across all slides"
    }
  ]
}

IMPORTANT for carousel imagePrompts:
- Each slide's imagePrompt should reference the carouselStyle for consistency
- Include specific text/headline to display on each slide image
- Describe layout, typography placement, and visual hierarchy
- Slides should feel like a cohesive series, not random images`;

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
    const { ideaId } = body;

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

    // Build the prompt
    const brandContext = ideaData.brands?.voice_config
      ? `Brand Voice Guidelines: ${JSON.stringify(ideaData.brands.voice_config)}\nBrand Name: ${ideaData.brands.name || "Unknown"}`
      : "";

    const userPrompt = `${brandContext}

CONTENT IDEA TO TRANSFORM:
Concept: ${ideaData.concept}
Angle: ${ideaData.angle}
Target Platforms: ${ideaData.target_platforms?.join(", ")}
Key Points: ${ideaData.key_points?.join("; ")}
Suggested Hooks: ${ideaData.potential_hooks?.join("; ")}

ORIGINAL SOURCE CONTENT:
${ideaData.inputs?.raw_content || "No source content available"}

Generate optimized posts for each target platform: ${ideaData.target_platforms?.join(", ")}.

For Instagram: If the content is educational, informational, or contains multiple tips/points, CREATE A CAROUSEL (4-6 slides max).
Each post/slide should have a detailed image prompt for generating scroll-stopping visuals with text overlays.`;

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
      carouselStyle?: string;
    }) => ({
      idea_id: ideaId,
      brand_id: ideaData.brand_id,
      platform: post.platform,
      copy_primary: post.primaryCopy,
      copy_hashtags: post.hashtags || [],
      copy_cta: post.cta || null,
      copy_thread_parts: post.threadParts || null,
      copy_carousel_slides: post.carouselSlides || null,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
