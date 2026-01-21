import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, MODELS, extractTextContent } from "@/lib/anthropic/client";

// Design system interface - defines visual consistency across carousel
interface DesignSystem {
  background: string;      // e.g., "solid #1a1a1a" or "gradient from #2d3436 to #636e72"
  primaryColor: string;    // e.g., "#ffffff" - main text color
  accentColor: string;     // e.g., "#ff6b6b" - highlights, CTAs
  typography: string;      // e.g., "Inter Bold 72px headlines, centered"
  layout: string;          // e.g., "15% margins, text centered vertically"
  mood: string;            // e.g., "bold, editorial, premium"
  textOverlay?: string;    // For photorealistic: "semi-transparent dark box"
}

// Brand visual config interface
interface BrandVisualConfig {
  image_style?: string;
  primary_color?: string;
  accent_color?: string;
  color_palette?: string[];
}

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

// Style-specific video guidance for each visual style
const VIDEO_STYLE_GUIDANCE: Record<string, string> = {
  typography: `STYLE GUIDANCE FOR TYPOGRAPHY VIDEO:
- Animated text elements as the focus (kinetic typography)
- Clean, solid color backgrounds with subtle motion (gradient shifts, particles)
- Text reveals, transitions, and emphasis animations
- Minimal to no real-world imagery - focus on graphic elements
- Bold contrasts, modern fonts animated in/out
- Example: Text zooming in, letters assembling, words sliding across clean backgrounds`,

  photorealistic: `STYLE GUIDANCE FOR PHOTOREALISTIC VIDEO:
- Real-world cinematic footage style (nature, cityscapes, people, objects)
- Professional cinematography: depth of field, natural lighting, golden hour
- Camera movements: slow pans, dolly shots, gentle zooms
- Atmospheric elements: lens flares, bokeh, natural motion blur
- Focus on authentic, believable scenes that evoke emotion
- Example: Drone shot over mountains, close-up of hands working, sunrise timelapse`,

  illustration: `STYLE GUIDANCE FOR ILLUSTRATION VIDEO:
- Animated illustration/cartoon style
- Hand-drawn or digital art aesthetic with movement
- Characters, objects, or scenes that feel illustrated, not photographed
- Playful, creative animations: bouncing, morphing, drawing-on effects
- Limited color palettes, stylized shapes, artistic interpretations
- Example: Illustrated character walking, hand-drawn elements appearing, watercolor washes`,

  "3d-render": `STYLE GUIDANCE FOR 3D RENDER VIDEO:
- Modern 3D rendered environments and objects
- Futuristic, tech-forward aesthetics: glass, metal, neon
- Smooth camera movements through 3D space
- Reflections, refractions, volumetric lighting
- Abstract 3D shapes, product visualizations, architectural renders
- Example: Camera flying through abstract 3D tunnels, rotating product, morphing geometric shapes`,

  "abstract-art": `STYLE GUIDANCE FOR ABSTRACT ART VIDEO:
- Bold abstract shapes in motion
- Vibrant gradients flowing and morphing
- Geometric patterns, fluid simulations, particle effects
- Non-representational visuals that evoke mood through color and movement
- Psychedelic, artistic, experimental motion graphics
- Example: Colorful liquid flows, geometric shapes transforming, gradient waves`,

  collage: `STYLE GUIDANCE FOR COLLAGE VIDEO:
- Mixed media layers with vintage/retro elements
- Cut-out animations, paper textures, layered compositions
- Nostalgic aesthetic: film grain, old photographs, texture overlays
- Elements appearing, layering, peeling away
- Eclectic mix of visual elements animated together
- Example: Vintage photos sliding in, paper cutouts animating, textured backgrounds`,

  experimental: `STYLE GUIDANCE FOR EXPERIMENTAL VIDEO:
- Wild, boundary-pushing visuals
- Unconventional compositions and unexpected transitions
- Glitch effects, distortion, surreal imagery
- Breaking visual conventions - anything goes
- Provocative, attention-grabbing, avant-garde
- Example: Glitchy transitions, surreal morphing, unexpected visual juxtapositions`,
};

// Generate design system prompt - creates consistent visual rules for entire carousel
function buildDesignSystemPrompt(
  visualStyle: string,
  slides: Array<{ slideNumber: number; text: string }>,
  platform: string,
  brandConfig: BrandVisualConfig | null,
  ideaContext: string
): string {
  const styleDesc = VISUAL_STYLE_DESCRIPTIONS[visualStyle] || VISUAL_STYLE_DESCRIPTIONS.photorealistic;

  // Build brand constraints - these are REQUIRED if present
  let brandConstraints = "";
  if (brandConfig) {
    brandConstraints = `
## BRAND GUIDELINES (MUST FOLLOW)
${brandConfig.primary_color ? `- Primary brand color: ${brandConfig.primary_color} (USE THIS as your primary or accent color)` : ""}
${brandConfig.accent_color ? `- Accent brand color: ${brandConfig.accent_color} (USE THIS for highlights/CTAs)` : ""}
${brandConfig.color_palette?.length ? `- Brand color palette: ${brandConfig.color_palette.join(", ")}` : ""}
${brandConfig.image_style ? `- Brand preferred style: ${brandConfig.image_style}` : ""}

CRITICAL: Brand colors take precedence. Incorporate them into your design system.`;
  }

  const slidesList = slides.map((s, i) =>
    `Slide ${i + 1}/${slides.length}: "${s.text}"`
  ).join('\n');

  return `You are creating a DESIGN SYSTEM for a ${slides.length}-slide ${platform} carousel.

## YOUR TASK
Define a cohesive design system that will be applied IDENTICALLY to all slides. This ensures visual consistency across the entire carousel.

## VISUAL STYLE: ${visualStyle}
${styleDesc}

## CAROUSEL CONTENT (for context - design must work for ALL these slides):
${slidesList}
${ideaContext}
${brandConstraints}

## DESIGN SYSTEM REQUIREMENTS
Create specific, concrete design choices:

1. **Background**: Exact background treatment (solid color with hex, gradient with hex codes, or style description for photorealistic)
2. **Primary Color**: Main text/element color (hex code)
3. **Accent Color**: Highlight color for emphasis (hex code)
4. **Typography**: Font treatment (style, weight, approximate size feel, alignment)
5. **Layout**: Positioning approach (margins, text placement, visual balance)
6. **Mood**: Overall visual atmosphere (2-3 descriptive words)
${visualStyle === "photorealistic" ? '7. **Text Overlay**: How text remains readable over photos (e.g., "semi-transparent dark box in lower third")' : ""}

Return ONLY valid JSON in this exact format:
{
  "background": "exact description with hex codes if applicable",
  "primaryColor": "#hexcode",
  "accentColor": "#hexcode",
  "typography": "specific font treatment description",
  "layout": "positioning and spacing approach",
  "mood": "2-3 mood words"${visualStyle === "photorealistic" ? ',\n  "textOverlay": "text readability solution"' : ""}
}`;
}

// Generate slide prompt using an existing design system
function buildSlidePromptWithDesignSystem(
  designSystem: DesignSystem,
  visualStyle: string,
  slideText: string,
  slideNumber: number,
  totalSlides: number,
  platform: string,
  mediaType: "image" | "video"
): string {
  const styleDesc = VISUAL_STYLE_DESCRIPTIONS[visualStyle] || VISUAL_STYLE_DESCRIPTIONS.photorealistic;

  if (mediaType === "video") {
    const styleGuidance = VIDEO_STYLE_GUIDANCE[visualStyle] || VIDEO_STYLE_GUIDANCE.photorealistic;
    return `Generate a video prompt for slide ${slideNumber}/${totalSlides} using the EXACT design system below.

## DESIGN SYSTEM (MUST FOLLOW EXACTLY)
- Background: ${designSystem.background}
- Primary Color: ${designSystem.primaryColor}
- Accent Color: ${designSystem.accentColor}
- Mood: ${designSystem.mood}

## VISUAL STYLE: ${visualStyle}
${styleGuidance}

## SLIDE CONTENT
"${slideText}"

## REQUIREMENTS
1. Create a 5-8 second video scene that matches the design system colors and mood
2. The video must feel like part of a cohesive carousel series
3. Include: camera movement, visual motion, atmosphere
4. DO NOT include text overlays (added separately)
5. Keep prompt under 600 characters

OUTPUT: Return ONLY the video generation prompt.`;
  }

  // Image prompt
  return `Generate an image prompt for slide ${slideNumber}/${totalSlides} using the EXACT design system below.

## DESIGN SYSTEM (MUST FOLLOW EXACTLY)
- Background: ${designSystem.background}
- Primary Color: ${designSystem.primaryColor}
- Accent Color: ${designSystem.accentColor}
- Typography: ${designSystem.typography}
- Layout: ${designSystem.layout}
- Mood: ${designSystem.mood}
${designSystem.textOverlay ? `- Text Overlay: ${designSystem.textOverlay}` : ""}

## VISUAL STYLE: ${visualStyle} - ${styleDesc}

## SLIDE CONTENT
"${slideText}"

## REQUIREMENTS
1. The prompt must implement the design system EXACTLY - same colors, same treatment
2. Include the slide text as part of the image composition
3. The prompt must be SELF-CONTAINED (no references to other slides)
4. Keep prompt under 500 characters
5. Platform: ${platform}

OUTPUT: Return ONLY the image generation prompt.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, slides, visualStyle, mediaType, brandId } = body;
    const effectiveStyle = visualStyle || "photorealistic";
    const effectiveMediaType = (mediaType || "image") as "image" | "video";

    if (!contentId || !slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "Content ID and slides array are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const anthropic = getAnthropicClient();

    // Fetch the content with metadata (includes existing design systems)
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("id, platform, brand_id, metadata, ideas(concept, angle)")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Fetch brand info for design system constraints
    let brandConfig: BrandVisualConfig | null = null;
    if (brandId) {
      const { data: brand } = await supabase
        .from("brands")
        .select("name, voice_config, visual_config")
        .eq("id", brandId)
        .single();

      if (brand?.visual_config) {
        brandConfig = brand.visual_config as BrandVisualConfig;
      }
    }

    // Handle Supabase join which returns array or single object
    const ideasResult = content.ideas;
    const ideaData = Array.isArray(ideasResult) ? ideasResult[0] : ideasResult;
    const ideaContext = ideaData
      ? `\n\nCONTENT CONTEXT: ${ideaData.concept || ''} - ${ideaData.angle || ''}`
      : "";

    // Check for existing design system for this style
    const existingMetadata = (content.metadata || {}) as Record<string, unknown>;
    const existingDesignSystems = (existingMetadata.designSystems || {}) as Record<string, DesignSystem>;
    let designSystem: DesignSystem | null = existingDesignSystems[effectiveStyle] || null;

    // If no design system exists for this style, generate one
    if (!designSystem) {
      console.log(`Generating new design system for style: ${effectiveStyle}`);

      const designSystemPrompt = buildDesignSystemPrompt(
        effectiveStyle,
        slides,
        content.platform,
        brandConfig,
        ideaContext
      );

      const dsResponse = await anthropic.messages.create({
        model: MODELS.SONNET,
        max_tokens: 1000,
        messages: [{ role: "user", content: designSystemPrompt }],
      });

      const dsText = extractTextContent(dsResponse).trim();

      // Parse the design system JSON
      try {
        const jsonMatch = dsText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          designSystem = JSON.parse(jsonMatch[0]) as DesignSystem;

          // Store the design system in content metadata
          const updatedDesignSystems = {
            ...existingDesignSystems,
            [effectiveStyle]: designSystem,
          };

          await supabase
            .from("content")
            .update({
              metadata: {
                ...existingMetadata,
                designSystems: updatedDesignSystems,
              },
            })
            .eq("id", contentId);

          console.log(`Stored design system for style: ${effectiveStyle}`, designSystem);
        } else {
          console.error("No JSON found in design system response:", dsText);
          // Fall back to default design system
          designSystem = {
            background: "solid #1a1a1a",
            primaryColor: brandConfig?.primary_color || "#ffffff",
            accentColor: brandConfig?.accent_color || "#ff6b6b",
            typography: "Bold Inter font, centered text",
            layout: "15% margins, centered composition",
            mood: "professional, clean, modern",
          };
        }
      } catch (parseError) {
        console.error("Failed to parse design system:", parseError);
        // Fall back to default design system with brand colors
        designSystem = {
          background: "solid #1a1a1a",
          primaryColor: brandConfig?.primary_color || "#ffffff",
          accentColor: brandConfig?.accent_color || "#ff6b6b",
          typography: "Bold Inter font, centered text",
          layout: "15% margins, centered composition",
          mood: "professional, clean, modern",
        };
      }
    } else {
      console.log(`Using existing design system for style: ${effectiveStyle}`);
    }

    // Now generate prompts for each slide using the design system
    const prompts: Array<{ slideNumber: number; prompt: string }> = [];

    for (const slide of slides) {
      const { slideNumber, text } = slide;

      const slidePrompt = buildSlidePromptWithDesignSystem(
        designSystem,
        effectiveStyle,
        text,
        slideNumber,
        slides.length,
        content.platform,
        effectiveMediaType
      );

      const response = await anthropic.messages.create({
        model: MODELS.SONNET,
        max_tokens: 800,
        messages: [{ role: "user", content: slidePrompt }],
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
      designSystem, // Return the design system so UI can display it
      isNewDesignSystem: !existingDesignSystems[effectiveStyle], // Indicate if this was newly generated
    });

  } catch (error) {
    console.error("Error generating prompts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate prompts" },
      { status: 500 }
    );
  }
}
