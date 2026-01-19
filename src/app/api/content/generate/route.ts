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
- Each slide needs its own COMPLETE, SELF-CONTAINED image prompt

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
          "imagePrompt": "COMPLETE image prompt with full style specification"
        }
      ] | null,
      "imagePrompt": "For non-carousel posts: detailed prompt for the main image",
      "carouselStyle": "For carousels: the design system used (for reference only)"
    }
  ]
}

**CRITICAL - IMAGE PROMPT RULES:**
Each imagePrompt will be sent to an AI image generator. Follow these rules STRICTLY:

**NEVER INCLUDE in image prompts:**
- Platform names (Instagram, Twitter, LinkedIn, Facebook, TikTok, etc.)
- Social media terms (carousel, post, story, reel, feed, etc.)
- UI elements (frame, border, mockup, phone screen, app interface)
- Format mentions (square format, vertical format, etc.)

**ALWAYS INCLUDE in image prompts:**
1. **Background**: Exact color with hex code (e.g., "deep navy blue #1a365d background")
2. **Typography**: Font style, weight, color (e.g., "bold condensed sans-serif text in cream #faf5f0")
3. **Layout**: Where elements are positioned (e.g., "centered headline at top, supporting text below")
4. **Visual elements**: Icons, illustrations, textures (e.g., "subtle grain texture overlay, small line-art icons")
5. **Color palette**: List ALL colors used
6. **The specific text/headline to display**
7. **Aspect ratio**: Use "1:1 aspect ratio" instead of "square format for Instagram"

WRONG (will cause problems):
- "Square format for Instagram carousel" - DO NOT mention Instagram!
- "Social media post with..." - DO NOT mention social media!
- "Instagram-style graphic..." - DO NOT mention platforms!
- "Consistent with slide 1..." - NO cross-references!

CORRECT (pure visual description):
- "Deep navy blue (#1a365d) background with subtle grain texture. 1:1 aspect ratio. Large bold condensed sans-serif headline 'YOUR HEADLINE' in cream (#faf5f0) centered at top. Supporting text in smaller cream font below. Small terracotta (#c4704b) line-art icon in corner. Clean, modern, minimalist editorial aesthetic."

Every image prompt must be a pure visual description with NO platform or social media references.`;

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
    const { ideaId, platforms: selectedPlatforms } = body;

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

    // Build the prompt
    const brandContext = ideaData.brands?.voice_config
      ? `Brand Voice Guidelines: ${JSON.stringify(ideaData.brands.voice_config)}\nBrand Name: ${ideaData.brands.name || "Unknown"}`
      : "";

    const userPrompt = `${brandContext}

CONTENT IDEA TO TRANSFORM:
Concept: ${ideaData.concept}
Angle: ${ideaData.angle}
Target Platforms: ${platformsToGenerate?.join(", ")}
Key Points: ${ideaData.key_points?.join("; ")}
Suggested Hooks: ${ideaData.potential_hooks?.join("; ")}

ORIGINAL SOURCE CONTENT:
${ideaData.inputs?.raw_content || "No source content available"}

Generate optimized posts for each target platform: ${platformsToGenerate?.join(", ")}.

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
