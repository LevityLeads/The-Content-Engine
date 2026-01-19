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
Each imagePrompt creates a graphic design. Follow these rules STRICTLY:

**ABSOLUTELY FORBIDDEN in image prompts (will ruin the output):**
- ANY platform names: Instagram, Twitter, LinkedIn, Facebook, TikTok, YouTube
- ANY social media terms: carousel, post, story, reel, feed, social media, content
- ANY UI elements: like buttons, comment icons, share buttons, hearts, profile pictures, avatars, follower counts, phone frames, app interfaces, mockups, notifications, navigation bars
- ANY format references: "for Instagram", "social media graphic", "post design"
- ANY cross-references: "same as slide 1", "consistent with previous"

**REQUIRED in every image prompt:**
1. **Background**: Solid color OR gradient with hex codes (e.g., "deep charcoal #2d2d2d background")
2. **Main headline**: The exact text in quotes (e.g., headline 'YOUR TEXT HERE')
3. **Typography style**: Font weight and style (e.g., "bold condensed sans-serif")
4. **Text color**: With hex code (e.g., "warm cream #f5f2ed text")
5. **Layout**: Position of elements (e.g., "headline centered in upper third")
6. **Supporting elements**: Textures, icons, illustrations if any
7. **Overall aesthetic**: (e.g., "clean editorial design", "modern minimalist poster")

**DESIGN SYSTEM for carousel sets:**
All slides in a carousel MUST share: same background color, same typography style, same color palette.
But each slide prompt must be FULLY SELF-CONTAINED (no references to other slides).

WRONG examples:
- "Instagram carousel slide" ❌
- "Social media graphic with..." ❌
- "Leave space for UI elements" ❌
- "Same style as slide 1" ❌

CORRECT example:
"Deep charcoal (#2d2d2d) background with subtle paper grain texture. Bold condensed sans-serif headline 'THE 2AM MOMENTS THAT MATTER MOST' in warm cream (#f5f2ed) positioned in the upper half. Smaller supporting text 'What felt like survival became my most meaningful memories' below in the same cream color. Subtle constellation line-art illustrations in muted gold (#c4a35a) in the corners. Clean, modern editorial poster aesthetic."

The output should look like a beautiful poster or magazine spread - NOT a social media mockup.`;

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
