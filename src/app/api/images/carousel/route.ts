/**
 * Carousel Image Generation API
 *
 * Generates all slides for a carousel using the hybrid compositing system:
 * 1. Generate or use provided background image
 * 2. Composite each slide with consistent text rendering
 * 3. Save all images to database
 *
 * This endpoint ensures visual consistency across all carousel slides.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import satori from 'satori';
import sharp from 'sharp';
import {
  getSlideTemplate,
  PRESET_DESIGN_SYSTEMS,
  INSTAGRAM_CAROUSEL_DIMENSIONS,
  type CarouselDesignSystem,
  type SlideContent,
} from '@/lib/slide-templates';
import { IMAGE_MODELS, DEFAULT_MODEL, type ImageModelKey } from '@/lib/image-models';

// Font loading
async function loadFont(): Promise<ArrayBuffer> {
  const fontUrl = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff';
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error('Failed to load font');
  }
  return response.arrayBuffer();
}

let cachedFont: ArrayBuffer | null = null;
async function getFont(): Promise<ArrayBuffer> {
  if (!cachedFont) {
    cachedFont = await loadFont();
  }
  return cachedFont;
}

// Background generation
async function generateBackground(
  style: string,
  googleApiKey: string,
  modelConfig: { id: string; name: string }
): Promise<string | null> {
  // Typography/Abstract backgrounds (text-overlay optimized)
  const TYPOGRAPHY_BACKGROUNDS: Record<string, string> = {
    'gradient-dark': 'Abstract dark gradient background transitioning from deep navy (#1a1a2e) to charcoal black (#0d0d0d). Subtle purple and blue tones blend smoothly. Minimal, sophisticated, perfect for text overlay. No text, no objects, no patterns - pure gradient only.',
    'gradient-warm': 'Abstract warm gradient background with rich coral (#ff6b6b) fading into deep burgundy (#4a1a1a). Smooth color transitions, slightly desaturated for text readability. No text, no objects - pure gradient colors only.',
    'texture-noise': 'Dark charcoal background (#1a1a1a) with very subtle grain/noise texture. Minimal, modern, premium feel. Slight vignette toward edges. No text, no patterns, no objects - just textured solid color.',
    'abstract-shapes': 'Dark background (#1a1a2e) with very subtle, blurred geometric shapes in slightly lighter tones. Shapes are abstract, soft-edged, positioned to leave center clear for text. Minimal, modern. No text, no recognizable objects.',
    'abstract-waves': 'Dark navy background (#1a1f3c) with subtle flowing wave patterns in darker blue tones. Waves are soft, abstract, creating depth without distraction. Center area slightly darker for text placement. No text, no objects.',
    'bokeh-dark': 'Very dark background (#0a0a0a) with extremely subtle, soft bokeh light circles in deep purple and blue. Lights are blurred, minimal, mostly in corners. Center is clear and dark for text. No text, no objects.',
    'minimal-solid': 'Clean solid charcoal background (#1a1a1a). Perfectly uniform color. Minimal, modern, professional. No texture, no gradient, no text, no objects - pure solid color.',
  };

  // Photorealistic backgrounds (scene-based)
  const PHOTOREALISTIC_BACKGROUNDS: Record<string, string> = {
    'photo-landscape': 'Photorealistic landscape photograph. Dramatic mountain vista at golden hour with misty valleys. Warm sunlight filtering through clouds. Professional photography quality, cinematic composition. Lower third slightly darker for text overlay. No text, no UI elements.',
    'photo-urban': 'Photorealistic urban cityscape at dusk. Modern architecture with glowing windows. Deep blue sky transitioning to warm city lights. Professional photography, 85mm lens look. Lower portion darker for text placement. No text.',
    'photo-nature': 'Photorealistic close-up nature scene. Dewdrops on leaves with soft morning light. Beautiful bokeh background in green and gold tones. Macro photography quality. Area for text overlay in corner or lower third. No text.',
    'photo-ocean': 'Photorealistic ocean scene at sunset. Calm waves reflecting orange and pink sky colors. Serene, peaceful atmosphere. Professional landscape photography. Darker horizon line for text placement. No text, no people.',
    'photo-minimal': 'Photorealistic minimal interior scene. Clean modern space with soft natural lighting. Neutral tones with one accent color. Professional architectural photography. Clear areas for text overlay. No text, no people.',
    'photo-texture': 'Photorealistic texture close-up. Weathered wood, marble, or concrete surface with beautiful natural patterns. Dramatic side lighting creating depth. Lower third slightly darker. No text.',
  };

  // Illustration backgrounds
  const ILLUSTRATION_BACKGROUNDS: Record<string, string> = {
    'illust-flat': 'Flat vector illustration background. Soft gradient sky with simple geometric landscape shapes. Limited color palette: dusty blue, coral, cream, navy. Clean modern editorial style. Large clear area for text. No text, no characters.',
    'illust-watercolor': 'Soft watercolor wash background. Dreamy abstract colors blending together - soft blues, pinks, and purples. Organic flowing shapes. Artistic, warm feeling. Lighter center area for text. No text.',
    'illust-geometric': 'Geometric illustration background. Bold shapes in coral, navy, and cream arranged in modern composition. Memphis design inspired. Clear focal area for text placement. No text.',
    'illust-nature': 'Illustrated nature scene. Stylized trees, mountains, or plants in flat vector style. Warm, friendly color palette. Editorial illustration quality. Open sky or clear area for text. No text, no characters.',
    'illust-abstract': 'Abstract illustration with organic flowing shapes. Soft gradients in modern color palette. Contemporary art style with clean lines. Large clear area for text overlay. No text.',
  };

  // 3D render backgrounds
  const RENDER_3D_BACKGROUNDS: Record<string, string> = {
    '3d-geometric': 'Modern 3D rendered scene. Floating geometric shapes - spheres, cubes, cylinders in chrome, glass, and matte materials. Soft gradient background from deep purple to dark blue. Studio lighting with soft shadows. Clear center for text. No text.',
    '3d-abstract': '3D rendered abstract environment. Smooth curved surfaces and flowing forms. Metallic and translucent materials. Soft lighting with subtle reflections. Premium tech aesthetic. Clear area for text. No text.',
    '3d-minimal': 'Minimal 3D scene. Single elegant object on gradient background. Soft studio lighting. Premium, sophisticated. Large clear area for text overlay. No text, no UI.',
    '3d-tech': '3D rendered tech-inspired scene. Abstract data visualization forms, flowing lines, particle effects. Deep blue and purple gradient. Futuristic, innovative feel. Clear area for text. No text.',
  };

  // Abstract art backgrounds
  const ABSTRACT_ART_BACKGROUNDS: Record<string, string> = {
    'art-expressive': 'Bold abstract art composition. Large organic brush strokes in coral, navy, and white on dark background. Expressive, dynamic energy. Contemporary art style. Clear area in composition for text. No text.',
    'art-minimal': 'Minimal abstract art. Single bold shape or gesture on clean background. High contrast colors. Museum-quality aesthetic. Large clear area for text overlay. No text.',
    'art-textured': 'Abstract textured art background. Layered paint textures and subtle color variations. Rich, tactile quality. Contemporary gallery style. Area with lower contrast for text. No text.',
    'art-geometric': 'Geometric abstract art. Bold shapes and color blocks in modern composition. Bauhaus or contemporary art inspired. Clear focal area for text placement. No text.',
  };

  // Collage backgrounds
  const COLLAGE_BACKGROUNDS: Record<string, string> = {
    'collage-vintage': 'Mixed media collage background. Layered vintage paper textures, subtle torn edges, aged aesthetic. Warm sepia and cream tones with coral accents. Editorial zine style. Clear area for text overlay. No text.',
    'collage-modern': 'Modern collage composition. Geometric paper cutouts, bold colors, layered elements. Clean edges mixed with organic shapes. Contemporary editorial style. Clear space for text. No text.',
    'collage-texture': 'Textured collage background. Overlapping paper, fabric, and material textures. Rich tactile quality. Artistic, handmade feel. Area with cleaner background for text. No text.',
  };

  // Combine all style categories
  const ALL_STYLES: Record<string, string> = {
    ...TYPOGRAPHY_BACKGROUNDS,
    ...PHOTOREALISTIC_BACKGROUNDS,
    ...ILLUSTRATION_BACKGROUNDS,
    ...RENDER_3D_BACKGROUNDS,
    ...ABSTRACT_ART_BACKGROUNDS,
    ...COLLAGE_BACKGROUNDS,
  };

  const prompt = ALL_STYLES[style] || TYPOGRAPHY_BACKGROUNDS['gradient-dark'];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: '4:5' },
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Background generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error('Background generation error:', error);
  }

  return null;
}

// Composite a single slide
async function compositeSlide(
  backgroundImage: string | null,
  content: SlideContent,
  design: CarouselDesignSystem,
  templateType: 'hook' | 'content' | 'cta' | 'numbered',
  fontData: ArrayBuffer,
  width: number,
  height: number
): Promise<string> {
  // Render template to SVG
  const templateElement = getSlideTemplate(templateType, {
    content,
    design,
    width,
    height,
    hasBackground: !!backgroundImage,
  });

  const svg = await satori(templateElement, {
    width,
    height,
    fonts: [
      {
        name: 'Inter',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  // Convert SVG to PNG
  const textLayerPng = await sharp(Buffer.from(svg)).png().toBuffer();

  let finalImage: Buffer;

  if (backgroundImage) {
    // Extract base64 data
    const base64Data = backgroundImage.split(',')[1];
    const bgBuffer = Buffer.from(base64Data, 'base64');

    // Composite text over background
    finalImage = await sharp(bgBuffer)
      .resize(width, height, { fit: 'cover' })
      .composite([{ input: textLayerPng, top: 0, left: 0 }])
      .png()
      .toBuffer();
  } else {
    finalImage = textLayerPng;
  }

  return `data:image/png;base64,${finalImage.toString('base64')}`;
}

// Determine template type based on slide position
function getTemplateTypeForSlide(
  slideIndex: number,
  totalSlides: number,
  hasNumbering: boolean
): 'hook' | 'content' | 'cta' | 'numbered' {
  if (slideIndex === 0) return 'hook';
  if (slideIndex === totalSlides - 1) return 'cta';
  if (hasNumbering) return 'numbered';
  return 'content';
}

// Parse slide text to extract headline, body, etc.
function parseSlideContent(
  slideText: string,
  slideNumber: number
): SlideContent {
  // Simple parsing: first sentence is headline, rest is body
  const sentences = slideText.split(/(?<=[.!?])\s+/);
  const headline = sentences[0] || slideText;
  const body = sentences.slice(1).join(' ') || undefined;

  return {
    slideNumber,
    headline,
    body,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      contentId,
      slides,              // Array of { slideNumber, text, imagePrompt }
      designPreset,        // 'dark-coral', 'navy-gold', etc. or full CarouselDesignSystem
      backgroundStyle,     // 'gradient-dark', 'abstract-shapes', etc.
      backgroundImage,     // Or provide your own background URL/base64
      useNumberedSlides,   // If true, use numbered template for middle slides
      model: requestedModel,
    } = body;

    // Validate
    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
    }
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: 'slides array is required' }, { status: 400 });
    }

    // Verify content exists
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('id, platform')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Resolve design system
    let design: CarouselDesignSystem;
    if (typeof designPreset === 'object' && designPreset !== null) {
      design = designPreset as CarouselDesignSystem;
    } else if (typeof designPreset === 'string' && PRESET_DESIGN_SYSTEMS[designPreset]) {
      design = PRESET_DESIGN_SYSTEMS[designPreset];
    } else {
      design = PRESET_DESIGN_SYSTEMS['dark-coral'];
    }

    // Dimensions
    const { width, height } = INSTAGRAM_CAROUSEL_DIMENSIONS;

    // Model config
    const modelKey: ImageModelKey = (requestedModel && requestedModel in IMAGE_MODELS)
      ? requestedModel as ImageModelKey
      : DEFAULT_MODEL;
    const modelConfig = IMAGE_MODELS[modelKey];

    // Generate or use provided background
    let bgImage: string | null = backgroundImage || null;

    if (!bgImage && backgroundStyle) {
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (googleApiKey) {
        console.log(`Generating background: ${backgroundStyle}`);
        bgImage = await generateBackground(backgroundStyle, googleApiKey, modelConfig);
      }
    }

    // Load font once
    const fontData = await getFont();

    // Generate all slides
    const generatedImages: Array<{
      slideNumber: number;
      imageUrl: string;
      savedImage: {
        id: string;
        url: string;
        prompt: string;
      } | null;
    }> = [];

    const totalSlides = slides.length;

    for (const slide of slides) {
      const slideIndex = slide.slideNumber - 1;
      const templateType = getTemplateTypeForSlide(slideIndex, totalSlides, useNumberedSlides);

      // Parse content from slide text
      const slideContent = parseSlideContent(slide.text, slide.slideNumber);

      // For CTA slides, add default CTA if not present
      if (templateType === 'cta' && !slideContent.ctaText) {
        slideContent.ctaText = 'Follow for More';
      }

      console.log(`Compositing slide ${slide.slideNumber}/${totalSlides} (${templateType})`);

      // Generate composite image
      const imageUrl = await compositeSlide(
        bgImage,
        slideContent,
        design,
        templateType,
        fontData,
        width,
        height
      );

      // Save to database
      const { data: savedImage, error: saveError } = await supabase
        .from('images')
        .insert({
          content_id: contentId,
          prompt: `[Slide ${slide.slideNumber}] Composite: ${slide.text.substring(0, 100)}`,
          url: imageUrl,
          is_primary: slide.slideNumber === 1,
          format: 'png',
          dimensions: { width, height, aspectRatio: '4:5' },
          model: 'composite', // Mark as composite-generated
        })
        .select()
        .single();

      if (saveError) {
        console.error(`Error saving slide ${slide.slideNumber}:`, saveError);
      }

      generatedImages.push({
        slideNumber: slide.slideNumber,
        imageUrl,
        savedImage: savedImage ? {
          id: savedImage.id,
          url: savedImage.url,
          prompt: savedImage.prompt,
        } : null,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedImages.length} carousel slides with consistent styling`,
      images: generatedImages,
      design: {
        preset: typeof designPreset === 'string' ? designPreset : 'custom',
        system: design,
      },
      backgroundGenerated: !!backgroundStyle && !!bgImage,
      dimensions: { width, height },
    });
  } catch (error) {
    console.error('Error in POST /api/images/carousel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - usage info
 */
export async function GET() {
  return NextResponse.json({
    description: 'Generate all carousel slides with consistent styling',
    designPresets: Object.keys(PRESET_DESIGN_SYSTEMS),
    backgroundStyles: [
      'gradient-dark',
      'gradient-warm',
      'texture-noise',
      'abstract-shapes',
      'abstract-waves',
      'bokeh-dark',
      'minimal-solid',
    ],
    usage: {
      contentId: 'UUID of the content record',
      slides: [
        { slideNumber: 1, text: 'Hook text for slide 1' },
        { slideNumber: 2, text: 'Content for slide 2' },
      ],
      designPreset: 'dark-coral | navy-gold | light-minimal | teal-cream | custom object',
      backgroundStyle: 'gradient-dark | etc. (optional - generates AI background)',
      backgroundImage: 'data:image/png;base64,... (optional - use your own)',
      useNumberedSlides: 'boolean (optional - use numbered template for middle slides)',
    },
  });
}
