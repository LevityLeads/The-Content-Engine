import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, MODELS, extractTextContent } from "@/lib/anthropic/client";

// Visual style descriptions for prompt generation
const VISUAL_STYLE_DESCRIPTIONS: Record<string, string> = {
  typography: "Bold text-focused design with clean typography, minimal imagery, strong visual hierarchy",
  photorealistic: "Photo-quality realistic backgrounds, professional photography style, natural lighting",
  illustration: "Hand-drawn or digital illustrated scenes, artistic style, creative interpretations",
  "3d-render": "Modern 3D rendered environments, futuristic scenes, tech-forward aesthetics",
  "abstract-art": "Bold abstract shapes, vibrant gradients, artistic compositions",
  collage: "Mixed media layers, vintage elements, textured compositions",
  experimental: "Wild, boundary-pushing visuals, unconventional compositions",
};

// Generate image prompt for a slide
function generateImagePromptGuidelines(visualStyle: string, slideText: string, platform: string): string {
  const styleDesc = VISUAL_STYLE_DESCRIPTIONS[visualStyle] || VISUAL_STYLE_DESCRIPTIONS.photorealistic;

  return `Generate a detailed image generation prompt for this social media slide.

SLIDE TEXT: "${slideText}"

VISUAL STYLE: ${visualStyle} - ${styleDesc}

PLATFORM: ${platform}

REQUIREMENTS:
1. The prompt must be SELF-CONTAINED - include all visual details in a single prompt
2. DO NOT reference "slide 1", "previous slide", or any other slides
3. Include specific details about:
   - Background style and colors
   - Typography treatment (if text should be in image)
   - Visual elements and composition
   - Mood and atmosphere
   - Lighting style
4. The prompt should create a visually striking image optimized for ${platform}
5. Keep the prompt under 500 characters

OUTPUT: Return ONLY the image generation prompt, nothing else.`;
}

// Generate video prompt for a slide
function generateVideoPromptGuidelines(visualStyle: string, slideText: string, platform: string): string {
  const styleDesc = VISUAL_STYLE_DESCRIPTIONS[visualStyle] || VISUAL_STYLE_DESCRIPTIONS.photorealistic;

  return `Generate a detailed video generation prompt for this social media content.

CONTENT TEXT: "${slideText}"

VISUAL STYLE: ${visualStyle} - ${styleDesc}

PLATFORM: ${platform}

REQUIREMENTS:
1. The prompt must describe a 5-8 second video scene
2. Include specific details about:
   - Opening scene and visual setup
   - Camera movement (pan, zoom, static, etc.)
   - Visual transitions or motion
   - Key visual elements and their movement
   - Overall mood and atmosphere
   - Color palette and lighting
3. The video should be visually engaging for ${platform}
4. DO NOT include text overlays in the video description (text will be added separately)
5. Focus on cinematic, professional quality visuals
6. Keep the prompt under 600 characters

OUTPUT: Return ONLY the video generation prompt, nothing else.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, slides, visualStyle, mediaType, brandId } = body;

    if (!contentId || !slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content ID and slides array are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the content to get platform info
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("id, platform, brand_id, ideas(concept, angle)")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Optionally fetch brand info for better context
    let brandContext = "";
    if (brandId) {
      const { data: brand } = await supabase
        .from("brands")
        .select("name, voice_config, visual_config")
        .eq("id", brandId)
        .single();

      if (brand) {
        const visualConfig = brand.visual_config as {
          image_style?: string;
          primary_color?: string;
          accent_color?: string;
        } | null;

        if (visualConfig?.image_style) {
          brandContext = `\n\nBRAND CONTEXT: ${brand.name} - Preferred style: ${visualConfig.image_style}`;
          if (visualConfig.primary_color) {
            brandContext += `, Brand colors: ${visualConfig.primary_color}`;
            if (visualConfig.accent_color) {
              brandContext += ` and ${visualConfig.accent_color}`;
            }
          }
        }
      }
    }

    // Handle Supabase join which returns array or single object
    const ideasResult = content.ideas;
    const ideaData = Array.isArray(ideasResult) ? ideasResult[0] : ideasResult;
    const ideaContext = ideaData
      ? `\n\nCONTENT CONTEXT: ${ideaData.concept || ''} - ${ideaData.angle || ''}`
      : "";

    // Generate prompts for each slide
    // Using SONNET for prompt generation - fast turnaround for multiple slides
    // These prompts are then used by Gemini, so speed matters more than perfection
    const anthropic = getAnthropicClient();
    const prompts: Array<{ slideNumber: number; prompt: string }> = [];

    for (const slide of slides) {
      const { slideNumber, text } = slide;

      // Build the guidelines based on media type
      const guidelines = mediaType === "video"
        ? generateVideoPromptGuidelines(visualStyle || "photorealistic", text, content.platform)
        : generateImagePromptGuidelines(visualStyle || "photorealistic", text, content.platform);

      const fullPrompt = guidelines + brandContext + ideaContext;

      // Call Claude to generate the prompt
      const response = await anthropic.messages.create({
        model: MODELS.SONNET, // SONNET for speed - generating prompts for Gemini doesn't need OPUS quality
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
      });

      // Extract the generated prompt
      const generatedPrompt = extractTextContent(response).trim();

      prompts.push({
        slideNumber,
        prompt: generatedPrompt,
      });
    }

    // Update the content's metadata with the new prompts (optional)
    // This saves the prompts for future reference
    if (mediaType === "image" && prompts.length > 0) {
      const { data: existingContent } = await supabase
        .from("content")
        .select("copy_carousel_slides")
        .eq("id", contentId)
        .single();

      if (existingContent?.copy_carousel_slides) {
        const updatedSlides = existingContent.copy_carousel_slides.map((slideData: string | object) => {
          const slide = typeof slideData === 'string' ? JSON.parse(slideData) : slideData;
          const newPrompt = prompts.find((p) => p.slideNumber === slide.slideNumber);
          if (newPrompt) {
            return JSON.stringify({ ...slide, imagePrompt: newPrompt.prompt });
          }
          return typeof slideData === 'string' ? slideData : JSON.stringify(slideData);
        });

        await supabase
          .from("content")
          .update({ copy_carousel_slides: updatedSlides })
          .eq("id", contentId);
      }
    }

    return NextResponse.json({
      success: true,
      prompts,
    });

  } catch (error) {
    console.error("Error generating prompts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate prompts" },
      { status: 500 }
    );
  }
}
