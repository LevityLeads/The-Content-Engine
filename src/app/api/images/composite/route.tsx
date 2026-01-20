/**
 * Composite Image Generation API
 *
 * This endpoint takes a background image and slide content,
 * then uses Satori to render consistent text overlays.
 *
 * The key insight: AI generates creative backgrounds,
 * code handles pixel-perfect text rendering.
 */

import { NextRequest, NextResponse } from 'next/server';
import satori from 'satori';
import sharp from 'sharp';
import {
  getSlideTemplate,
  PRESET_DESIGN_SYSTEMS,
  INSTAGRAM_CAROUSEL_DIMENSIONS,
  type CarouselDesignSystem,
  type SlideContent,
} from '@/lib/slide-templates';

// Font loading - we'll fetch Inter from Google Fonts
async function loadFont(): Promise<ArrayBuffer> {
  // Fetch Inter Bold from Google Fonts
  const fontUrl = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff';

  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error('Failed to load font');
  }

  return response.arrayBuffer();
}

// Cache the font to avoid repeated fetches
let cachedFont: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (!cachedFont) {
    cachedFont = await loadFont();
  }
  return cachedFont;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      backgroundImage,  // base64 string or URL
      content,          // SlideContent object
      designSystem,     // CarouselDesignSystem or preset name
      templateType = 'content', // 'hook' | 'content' | 'cta' | 'numbered'
      width = INSTAGRAM_CAROUSEL_DIMENSIONS.width,
      height = INSTAGRAM_CAROUSEL_DIMENSIONS.height,
    } = body;

    // Validate required fields
    if (!content || !content.slideNumber) {
      return NextResponse.json(
        { error: 'Slide content with slideNumber is required' },
        { status: 400 }
      );
    }

    // Resolve design system (can be preset name or full object)
    let design: CarouselDesignSystem;
    if (typeof designSystem === 'string') {
      design = PRESET_DESIGN_SYSTEMS[designSystem];
      if (!design) {
        return NextResponse.json(
          { error: `Unknown design preset: ${designSystem}. Available: ${Object.keys(PRESET_DESIGN_SYSTEMS).join(', ')}` },
          { status: 400 }
        );
      }
    } else if (designSystem) {
      design = designSystem as CarouselDesignSystem;
    } else {
      design = PRESET_DESIGN_SYSTEMS['dark-coral'];
    }

    // Load font
    const fontData = await getFont();

    // Generate the text overlay using Satori
    const slideContent: SlideContent = {
      slideNumber: content.slideNumber,
      headline: content.headline,
      body: content.body,
      accentText: content.accentText,
      ctaText: content.ctaText,
    };

    // Render template to SVG
    const templateElement = getSlideTemplate(templateType, {
      content: slideContent,
      design,
      width,
      height,
      hasBackground: !!backgroundImage, // transparent if we have a bg image
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
    const textLayerPng = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    let finalImage: Buffer;

    if (backgroundImage) {
      // We have a background image - composite text on top
      let bgBuffer: Buffer;

      if (backgroundImage.startsWith('data:')) {
        // Base64 encoded image
        const base64Data = backgroundImage.split(',')[1];
        bgBuffer = Buffer.from(base64Data, 'base64');
      } else if (backgroundImage.startsWith('http')) {
        // URL - fetch it
        const bgResponse = await fetch(backgroundImage);
        if (!bgResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch background image' },
            { status: 400 }
          );
        }
        bgBuffer = Buffer.from(await bgResponse.arrayBuffer());
      } else {
        return NextResponse.json(
          { error: 'backgroundImage must be a data URL or HTTP URL' },
          { status: 400 }
        );
      }

      // Resize background to target dimensions and composite
      finalImage = await sharp(bgBuffer)
        .resize(width, height, { fit: 'cover' })
        .composite([
          {
            input: textLayerPng,
            top: 0,
            left: 0,
          },
        ])
        .png()
        .toBuffer();
    } else {
      // No background - just use the text layer (which has solid background from design)
      finalImage = textLayerPng;
    }

    // Convert to base64 data URL
    const base64Image = `data:image/png;base64,${finalImage.toString('base64')}`;

    return NextResponse.json({
      success: true,
      image: base64Image,
      dimensions: { width, height },
      designSystem: design,
      templateType,
    });
  } catch (error) {
    console.error('Error in POST /api/images/composite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to list available presets and template types
 */
export async function GET() {
  return NextResponse.json({
    presets: Object.keys(PRESET_DESIGN_SYSTEMS),
    presetDetails: PRESET_DESIGN_SYSTEMS,
    templateTypes: ['hook', 'content', 'numbered', 'cta'],
    defaultDimensions: INSTAGRAM_CAROUSEL_DIMENSIONS,
    usage: {
      description: 'POST to generate a composite image with text overlay',
      requiredFields: {
        content: {
          slideNumber: 'number (required)',
          headline: 'string (optional)',
          body: 'string (optional)',
          accentText: 'string (optional)',
          ctaText: 'string (optional)',
        },
      },
      optionalFields: {
        backgroundImage: 'base64 data URL or HTTP URL',
        designSystem: 'preset name (string) or full CarouselDesignSystem object',
        templateType: 'hook | content | numbered | cta',
        width: 'number (default: 1080)',
        height: 'number (default: 1350)',
      },
    },
  });
}
