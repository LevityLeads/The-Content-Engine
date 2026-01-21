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
  TEXT_STYLE_PRESETS,
  TEXT_COLOR_PRESETS,
  buildDesignSystem,
  INSTAGRAM_CAROUSEL_DIMENSIONS,
  type CarouselDesignSystem,
  type SlideContent,
} from '@/lib/slide-templates';
import { IMAGE_MODELS, DEFAULT_MODEL, type ImageModelKey } from '@/lib/image-models';
import { VIDEO_MODELS, DEFAULT_VIDEO_MODEL, type VideoModelKey, platformSupportsMixedCarousel } from '@/lib/video-models';
import { BrandVideoConfig, DEFAULT_VIDEO_CONFIG } from '@/types/database';

// Helper to update job status
async function updateJobStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  updates: {
    status?: string;
    progress?: number;
    completedItems?: number;
    currentStep?: string;
    errorMessage?: string;
    errorCode?: string;
    errorDetails?: Record<string, unknown>;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.progress !== undefined) updateData.progress = updates.progress;
  if (updates.completedItems !== undefined) updateData.completed_items = updates.completedItems;
  if (updates.currentStep !== undefined) updateData.current_step = updates.currentStep;
  if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
  if (updates.errorCode !== undefined) updateData.error_code = updates.errorCode;
  if (updates.errorDetails !== undefined) updateData.error_details = updates.errorDetails;

  await supabase.from('generation_jobs').update(updateData).eq('id', jobId);
}

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
  modelConfig: { id: string; name: string },
  brandColors?: {
    primary_color?: string;
    accent_color?: string;
    secondary_color?: string;
    image_style?: string;
    fonts?: { heading?: string; body?: string };
    master_brand_prompt?: string;
  }
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

  let prompt: string;

  // MASTER BRAND PROMPT: If available, use ONLY this - it's the most reliable brand guide
  // It's generated by AI analysis of the brand's actual example posts
  if (brandColors?.master_brand_prompt) {
    // Create a fresh prompt based purely on the master brand description
    // DON'T mix with preset styles - they will conflict with the analyzed brand style
    prompt = `Create a social media background image following these EXACT brand guidelines:

${brandColors.master_brand_prompt}

CRITICAL REQUIREMENTS:
- Follow the color palette described above EXACTLY - use those specific colors
- Follow the typography and visual style described above EXACTLY
- This is a background for text overlay, so leave clear space for text in the center
- Do NOT add any text, words, letters, or numbers to the image
- Match the mood, aesthetic, and design language precisely
- The background should be suitable for overlaying white or dark text`;

    console.log('Using master brand prompt as primary directive (ignoring preset styles)');
  } else {
    // No master brand prompt - use preset styles with color overrides
    prompt = ALL_STYLES[style] || TYPOGRAPHY_BACKGROUNDS['gradient-dark'];

    // BRAND COLORS: Inject brand colors into the background prompt for visual consistency
    if (brandColors?.primary_color || brandColors?.accent_color) {
      const primaryHex = brandColors.primary_color || '#cc100a';
      const accentHex = brandColors.accent_color || '#d9d9d9';
      const secondaryHex = brandColors.secondary_color || '#1a1a1a';

      // Build a brand color directive to append to the prompt
      const brandColorDirective = `

BRAND COLOR REQUIREMENTS (MUST FOLLOW):
- Primary brand color: ${primaryHex} - use this as the dominant accent color
- Secondary brand color: ${accentHex} - use for highlights and secondary elements
- Background base: ${secondaryHex} - integrate into the color scheme
- The overall color palette MUST prominently feature these brand colors
- Replace any generic colors in the design with these brand-specific colors`;

      prompt = prompt + brandColorDirective;

      console.log(`Background prompt enhanced with brand colors: ${primaryHex}, ${accentHex}`);
    }

    // BRAND FONTS: If detected, mention for any text elements in the background
    if (brandColors?.fonts?.heading || brandColors?.fonts?.body) {
      const headingFont = brandColors.fonts.heading || 'Inter';
      const bodyFont = brandColors.fonts.body || headingFont;
      prompt = prompt + `\n\nTYPOGRAPHY HINT: If any text elements appear, use fonts similar to "${headingFont}" for headlines and "${bodyFont}" for body text.`;
    }

    // If brand has a preferred image style, factor it in
    if (brandColors?.image_style) {
      prompt = prompt + `\n\nSTYLE NOTE: Align with "${brandColors.image_style}" aesthetic.`;
    }
  }

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
  const supabase = await createClient();
  let jobId: string | null = null;

  try {
    const body = await request.json();
    const {
      contentId,
      slides,              // Array of { slideNumber, text, imagePrompt }
      designPreset,        // Legacy: 'dark-coral', 'navy-gold', etc. or full CarouselDesignSystem
      textStyle,           // New: 'bold-editorial', 'clean-modern', etc.
      textColor,           // New: 'white-coral', 'white-teal', etc.
      backgroundStyle: requestedBgStyle,     // 'gradient-dark', 'abstract-shapes', 'photo-landscape', etc.
      visualStyle,         // Visual style override: 'typography', 'photorealistic', 'illustration', '3d-render', 'abstract-art', 'collage', 'experimental'
      backgroundImage,     // Or provide your own background URL/base64
      useNumberedSlides,   // If true, use numbered template for middle slides
      model: requestedModel,
      jobId: providedJobId, // Allow passing existing job ID for tracking
      brandColors,         // NEW: Brand visual config { primary_color, accent_color, image_style, fonts, etc. }
    } = body;

    // Type the brandColors for TypeScript
    const typedBrandColors = brandColors as {
      primary_color?: string;
      accent_color?: string;
      secondary_color?: string;
      image_style?: string;
      fonts?: { heading?: string; body?: string };
      master_brand_prompt?: string; // AI-generated visual brand description
    } | undefined;

    // Map visual styles to default background styles
    const VISUAL_STYLE_TO_BACKGROUND: Record<string, string> = {
      'typography': 'gradient-dark',
      'photorealistic': 'photo-landscape',
      'illustration': 'illust-flat',
      '3d-render': '3d-geometric',
      'abstract-art': 'art-expressive',
      'collage': 'collage-modern',
      'experimental': 'art-expressive', // Use expressive art for experimental
    };

    // Resolve background style: explicit > visualStyle mapping > default
    const backgroundStyle = requestedBgStyle || (visualStyle ? VISUAL_STYLE_TO_BACKGROUND[visualStyle] : undefined);

    // Validate
    if (!contentId) {
      return NextResponse.json({ error: 'contentId is required' }, { status: 400 });
    }
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: 'slides array is required' }, { status: 400 });
    }

    // Verify content exists and get brand info for video config
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('id, platform, brand_id, brands(video_config)')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if this is a mixed carousel request (video slide 1 + images)
    const isMixedCarousel = visualStyle === 'mixed-carousel' || visualStyle === 'video-carousel';
    let videoGeneratedForSlide1 = false;
    let videoSlide1Result: { id: string; url: string; media_type: string } | null = null;

    if (isMixedCarousel) {
      // Check if platform supports mixed carousels
      const platform = content.platform?.toLowerCase() || '';
      if (!platformSupportsMixedCarousel(platform)) {
        return NextResponse.json(
          { error: `Platform '${platform}' does not support mixed video+image carousels. Use single video or image carousel instead.` },
          { status: 400 }
        );
      }

      // Get brand video config
      const brandsResult = content.brands;
      const brandData = Array.isArray(brandsResult) ? brandsResult[0] : brandsResult;
      const videoConfig = (brandData?.video_config as BrandVideoConfig) || DEFAULT_VIDEO_CONFIG;

      if (!videoConfig.enabled) {
        return NextResponse.json(
          { error: 'Video generation is not enabled for this brand. Enable it in Settings to use mixed carousel.' },
          { status: 400 }
        );
      }

      // Generate video for slide 1
      const slide1 = slides.find((s: { slideNumber: number }) => s.slideNumber === 1);
      if (slide1) {
        const videoModel = videoConfig.default_model || DEFAULT_VIDEO_MODEL;
        const duration = videoConfig.default_duration || 5;
        const includeAudio = videoConfig.include_audio || false;

        try {
          // Build video prompt from slide 1 text
          const videoPrompt = `Create a short engaging video for social media. Main message: "${slide1.text}". Style: Dynamic, attention-grabbing, suitable for ${platform}. Keep it simple and impactful.`;

          // Call video generation endpoint
          const videoResponse = await fetch(new URL('/api/videos/generate', request.url).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentId,
              prompt: videoPrompt,
              model: videoModel,
              duration,
              includeAudio,
              slideNumber: 1,
            }),
          });

          const videoResult = await videoResponse.json();

          if (videoResponse.ok && videoResult.video) {
            videoSlide1Result = {
              id: videoResult.video.id,
              url: videoResult.video.url,
              media_type: 'video',
            };
            videoGeneratedForSlide1 = true;
            console.log('Video generated for slide 1 in mixed carousel');
          } else {
            console.warn('Video generation for slide 1 failed, falling back to image:', videoResult.error);
          }
        } catch (videoError) {
          console.error('Error generating video for mixed carousel slide 1:', videoError);
          // Continue with image fallback
        }
      }
    }

    const totalSlides = slides.length;

    // Initialize per-slide status tracking
    // Each slide has: status ('pending' | 'generating' | 'completed' | 'failed'), error?
    const initialSlideStatuses = slides.map((slide: { slideNumber: number }) => ({
      slideNumber: slide.slideNumber,
      status: 'pending' as const,
    }));

    // Use provided job ID or create a new generation job
    if (providedJobId && typeof providedJobId === 'string') {
      // Use existing job and update it
      jobId = providedJobId;
      await updateJobStatus(supabase, providedJobId, {
        status: 'generating',
        progress: 0,
        currentStep: 'Initializing',
      });
    } else {
      // Create a new generation job
      const { data: job, error: jobError } = await supabase
        .from('generation_jobs')
        .insert({
          content_id: contentId,
          type: 'composite',
          status: 'generating',
          progress: 0,
          total_items: totalSlides,
          completed_items: 0,
          current_step: 'Initializing',
          metadata: {
            backgroundStyle,
            textStyle,
            textColor,
            visualStyle,
            slideCount: totalSlides,
            slideStatuses: initialSlideStatuses,
          },
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating job:', jobError);
        // Continue without job tracking if it fails
      } else {
        jobId = job.id;
      }
    }

    // Helper to update individual slide status in metadata
    const updateSlideStatus = async (
      slideNumber: number,
      slideStatus: 'pending' | 'generating' | 'completed' | 'failed',
      error?: string
    ) => {
      if (!jobId) return;

      // Get current metadata
      const { data: currentJob } = await supabase
        .from('generation_jobs')
        .select('metadata')
        .eq('id', jobId)
        .single();

      if (currentJob?.metadata) {
        const metadata = currentJob.metadata as Record<string, unknown>;
        const slideStatuses = (metadata.slideStatuses as Array<{ slideNumber: number; status: string; error?: string }>) || [];

        // Update the specific slide status
        const updatedStatuses = slideStatuses.map(s =>
          s.slideNumber === slideNumber
            ? { ...s, status: slideStatus, ...(error ? { error } : {}) }
            : s
        );

        await supabase
          .from('generation_jobs')
          .update({ metadata: { ...metadata, slideStatuses: updatedStatuses } })
          .eq('id', jobId);
      }
    };

    // Resolve design system
    // Priority: 1) Full object, 2) Brand colors, 3) textStyle+textColor combo, 4) legacy designPreset, 5) default
    let design: CarouselDesignSystem;
    if (typeof designPreset === 'object' && designPreset !== null) {
      // Full design system object passed directly
      design = designPreset as CarouselDesignSystem;
    } else if (typedBrandColors?.primary_color || typedBrandColors?.accent_color) {
      // NEW: Build design system from brand colors
      const stylePreset = TEXT_STYLE_PRESETS[textStyle] || TEXT_STYLE_PRESETS['bold-editorial'];

      // Create a custom color preset from brand colors
      // For text visibility: use white text on dark backgrounds, dark text on light backgrounds
      const primaryBrandColor = typedBrandColors.primary_color || '#cc100a';
      const accentBrandColor = typedBrandColors.accent_color || typedBrandColors.primary_color || '#ffffff';

      // Determine if we should use light or dark text based on the brand's primary color
      // (Brand primary is usually a dark accent, so we typically want white text)
      const customColorPreset = {
        id: 'brand-custom',
        name: 'Brand Custom',
        primaryColor: '#ffffff', // White text for readability on most backgrounds
        accentColor: primaryBrandColor, // Use brand primary as the accent/highlight
        forDarkBg: true,
      };

      design = buildDesignSystem(stylePreset, customColorPreset);
      // Override the accent to use brand primary color prominently
      design.accentColor = primaryBrandColor;

      console.log(`Using brand colors: primary=${primaryBrandColor}, accent=${accentBrandColor}`);
    } else if (textStyle && textColor) {
      // Build from separate style and color presets
      const stylePreset = TEXT_STYLE_PRESETS[textStyle] || TEXT_STYLE_PRESETS['bold-editorial'];
      const colorPreset = TEXT_COLOR_PRESETS[textColor] || TEXT_COLOR_PRESETS['white-coral'];
      design = buildDesignSystem(stylePreset, colorPreset);
    } else if (typeof designPreset === 'string' && PRESET_DESIGN_SYSTEMS[designPreset]) {
      // Legacy: Use named preset
      design = PRESET_DESIGN_SYSTEMS[designPreset];
    } else {
      // Default
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
    let backgroundError: string | null = null;

    if (!bgImage && backgroundStyle) {
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (googleApiKey) {
        if (jobId) {
          await updateJobStatus(supabase, jobId, {
            progress: 5,
            currentStep: 'Generating background',
          });
        }

        console.log(`Generating background: ${backgroundStyle}${typedBrandColors ? ' with brand colors' : ''}`);
        bgImage = await generateBackground(backgroundStyle, googleApiKey, modelConfig, typedBrandColors);

        if (!bgImage) {
          backgroundError = 'Background generation failed - using solid color fallback';
          console.warn(backgroundError);
        }
      }
    }

    // Load font once
    if (jobId) {
      await updateJobStatus(supabase, jobId, {
        progress: 10,
        currentStep: 'Loading fonts',
      });
    }

    let fontData: ArrayBuffer;
    try {
      fontData = await getFont();
    } catch (fontError) {
      console.error('Font loading failed:', fontError);
      if (jobId) {
        await updateJobStatus(supabase, jobId, {
          status: 'failed',
          progress: 100,
          errorMessage: 'Failed to load font for text rendering',
          errorCode: 'FONT_ERROR',
          errorDetails: { error: fontError instanceof Error ? fontError.message : String(fontError) },
        });
      }
      return NextResponse.json(
        { error: 'Failed to load font for text rendering', jobId },
        { status: 500 }
      );
    }

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

    const slideErrors: Array<{ slideNumber: number; error: string }> = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideIndex = slide.slideNumber - 1;
      const templateType = getTemplateTypeForSlide(slideIndex, totalSlides, useNumberedSlides);

      // Skip slide 1 if video was already generated for mixed carousel
      if (slide.slideNumber === 1 && videoGeneratedForSlide1 && videoSlide1Result) {
        await updateSlideStatus(slide.slideNumber, 'completed');
        generatedImages.push({
          slideNumber: 1,
          imageUrl: videoSlide1Result.url,
          savedImage: {
            id: videoSlide1Result.id,
            url: videoSlide1Result.url,
            prompt: `[Slide 1] Video: ${slide.text.substring(0, 100)}`,
          },
        });
        console.log('Skipping slide 1 image generation - video already created');
        continue;
      }

      // Mark this slide as generating
      await updateSlideStatus(slide.slideNumber, 'generating');

      // Update progress (10% for setup + 80% for slides + 10% for saving)
      const slideProgress = 10 + Math.round((i / totalSlides) * 80);
      if (jobId) {
        await updateJobStatus(supabase, jobId, {
          progress: slideProgress,
          currentStep: `Compositing slide ${slide.slideNumber}/${totalSlides}`,
          completedItems: i,
        });
      }

      // Parse content from slide text
      const slideContent = parseSlideContent(slide.text, slide.slideNumber);

      // For CTA slides, add default CTA if not present
      if (templateType === 'cta' && !slideContent.ctaText) {
        slideContent.ctaText = 'Follow for More';
      }

      console.log(`Compositing slide ${slide.slideNumber}/${totalSlides} (${templateType})`);

      try {
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
            dimensions: { width, height, aspectRatio: '4:5', model: 'composite' },
          })
          .select()
          .single();

        if (saveError) {
          console.error(`Error saving slide ${slide.slideNumber}:`, saveError);
          slideErrors.push({ slideNumber: slide.slideNumber, error: `Database save failed: ${saveError.message}` });
          await updateSlideStatus(slide.slideNumber, 'failed', `Database save failed: ${saveError.message}`);
        } else {
          // Mark slide as completed
          await updateSlideStatus(slide.slideNumber, 'completed');
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
      } catch (slideError) {
        console.error(`Error compositing slide ${slide.slideNumber}:`, slideError);
        const errorMsg = slideError instanceof Error ? slideError.message : String(slideError);
        slideErrors.push({
          slideNumber: slide.slideNumber,
          error: errorMsg,
        });
        await updateSlideStatus(slide.slideNumber, 'failed', errorMsg);
      }
    }

    // Update job status
    const successCount = generatedImages.filter(img => img.savedImage).length;
    const hasErrors = slideErrors.length > 0 || backgroundError;

    if (jobId) {
      if (successCount === 0) {
        await updateJobStatus(supabase, jobId, {
          status: 'failed',
          progress: 100,
          completedItems: 0,
          errorMessage: 'All slides failed to generate',
          errorCode: 'ALL_FAILED',
          errorDetails: { slideErrors },
        });
      } else if (hasErrors) {
        await updateJobStatus(supabase, jobId, {
          status: 'completed',
          progress: 100,
          completedItems: successCount,
          currentStep: undefined,
          errorMessage: backgroundError || `${slideErrors.length} slide(s) had issues`,
          errorDetails: { slideErrors, backgroundError },
        });
      } else {
        await updateJobStatus(supabase, jobId, {
          status: 'completed',
          progress: 100,
          completedItems: successCount,
          currentStep: undefined,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: videoGeneratedForSlide1
        ? `Generated mixed carousel: 1 video + ${generatedImages.length - 1} image slides`
        : `Generated ${generatedImages.length} carousel slides with consistent styling`,
      images: generatedImages,
      design: {
        preset: typeof designPreset === 'string' ? designPreset : 'custom',
        system: design,
      },
      backgroundGenerated: !!backgroundStyle && !!bgImage,
      backgroundError,
      slideErrors: slideErrors.length > 0 ? slideErrors : undefined,
      dimensions: { width, height },
      jobId,
      mixedCarousel: videoGeneratedForSlide1 ? {
        videoSlide: 1,
        videoId: videoSlide1Result?.id,
      } : undefined,
    });
  } catch (error) {
    console.error('Error in POST /api/images/carousel:', error);

    if (jobId) {
      await updateJobStatus(supabase, jobId, {
        status: 'failed',
        progress: 100,
        errorMessage: 'Internal server error',
        errorCode: 'INTERNAL_ERROR',
        errorDetails: { error: error instanceof Error ? error.message : String(error) },
      });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error', jobId },
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
