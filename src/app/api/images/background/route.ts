/**
 * Background Image Generation API
 *
 * Generates abstract, artistic background images using Gemini.
 * These backgrounds are designed to be overlaid with text using
 * the /api/images/composite endpoint.
 *
 * The key: Generate visually interesting backgrounds WITHOUT any text,
 * then let code handle the consistent text rendering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { IMAGE_MODELS, DEFAULT_MODEL, type ImageModelKey } from '@/lib/image-models';
import { INSTAGRAM_CAROUSEL_DIMENSIONS } from '@/lib/slide-templates';

// Predefined background styles that work well for text overlays
const BACKGROUND_STYLES = {
  'gradient-dark': {
    description: 'Dark gradient with subtle color shifts',
    prompt: 'Abstract dark gradient background transitioning from deep navy (#1a1a2e) to charcoal black (#0d0d0d). Subtle purple and blue tones blend smoothly. Minimal, sophisticated, perfect for text overlay. No text, no objects, no patterns - pure gradient only.',
  },
  'gradient-warm': {
    description: 'Warm gradient with sunset tones',
    prompt: 'Abstract warm gradient background with rich coral (#ff6b6b) fading into deep burgundy (#4a1a1a). Smooth color transitions, slightly desaturated for text readability. No text, no objects - pure gradient colors only.',
  },
  'texture-noise': {
    description: 'Subtle noise texture on dark background',
    prompt: 'Dark charcoal background (#1a1a1a) with very subtle grain/noise texture. Minimal, modern, premium feel. Slight vignette toward edges. No text, no patterns, no objects - just textured solid color.',
  },
  'texture-paper': {
    description: 'Light paper texture',
    prompt: 'Off-white paper texture background (#fafafa). Subtle fiber texture, very soft shadows creating depth. Clean, minimal, editorial feel. No text, no objects - just textured background.',
  },
  'abstract-shapes': {
    description: 'Subtle abstract geometric shapes',
    prompt: 'Dark background (#1a1a2e) with very subtle, blurred geometric shapes in slightly lighter tones. Shapes are abstract, soft-edged, positioned to leave center clear for text. Minimal, modern. No text, no recognizable objects.',
  },
  'abstract-waves': {
    description: 'Flowing wave patterns',
    prompt: 'Dark navy background (#1a1f3c) with subtle flowing wave patterns in darker blue tones. Waves are soft, abstract, creating depth without distraction. Center area slightly darker for text placement. No text, no objects.',
  },
  'bokeh-dark': {
    description: 'Soft bokeh lights on dark background',
    prompt: 'Very dark background (#0a0a0a) with extremely subtle, soft bokeh light circles in deep purple and blue. Lights are blurred, minimal, mostly in corners. Center is clear and dark for text. No text, no objects.',
  },
  'bokeh-warm': {
    description: 'Warm bokeh lights',
    prompt: 'Dark warm background (#1a1412) with very subtle, soft golden bokeh lights. Extremely blurred, positioned in corners. Center dark and clear for text overlay. Cozy, premium feel. No text, no objects.',
  },
  'minimal-solid': {
    description: 'Clean solid color',
    prompt: 'Clean solid charcoal background (#1a1a1a). Perfectly uniform color. Minimal, modern, professional. No texture, no gradient, no text, no objects - pure solid color.',
  },
};

type BackgroundStyle = keyof typeof BACKGROUND_STYLES;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      style,           // Predefined style name
      customPrompt,    // OR custom prompt for full control
      colorHint,       // Optional hex color to incorporate
      model: requestedModel,
      width = INSTAGRAM_CAROUSEL_DIMENSIONS.width,
      height = INSTAGRAM_CAROUSEL_DIMENSIONS.height,
    } = body;

    // Determine which model to use
    const modelKey: ImageModelKey = (requestedModel && requestedModel in IMAGE_MODELS)
      ? requestedModel as ImageModelKey
      : DEFAULT_MODEL;
    const modelConfig = IMAGE_MODELS[modelKey];

    // Build the prompt
    let finalPrompt: string;

    if (customPrompt) {
      // Custom prompt - append safety instructions
      finalPrompt = `${customPrompt}

CRITICAL REQUIREMENTS:
- This is a BACKGROUND image only - NO TEXT whatsoever
- No letters, words, numbers, or typography of any kind
- No social media elements, UI, buttons, or interface components
- Leave center area clear and suitable for text overlay
- Output should be a pure visual/artistic background`;
    } else if (style && BACKGROUND_STYLES[style as BackgroundStyle]) {
      finalPrompt = BACKGROUND_STYLES[style as BackgroundStyle].prompt;

      // Add color hint if provided
      if (colorHint) {
        finalPrompt += ` Incorporate subtle tones of ${colorHint} into the design.`;
      }
    } else {
      return NextResponse.json(
        {
          error: 'Either style or customPrompt is required',
          availableStyles: Object.keys(BACKGROUND_STYLES),
        },
        { status: 400 }
      );
    }

    // Add aspect ratio
    const aspectRatio = width === height ? '1:1'
      : width > height ? '16:9'
        : '4:5';

    // Check for API key
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Call Gemini for image generation
    console.log(`Generating background with ${modelConfig.name}, style: ${style || 'custom'}`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: finalPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: `Image generation failed: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Extract the image
    const parts = data.candidates?.[0]?.content?.parts || [];
    let imageBase64: string | null = null;

    for (const part of parts) {
      if (part.inlineData?.data) {
        imageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!imageBase64) {
      console.log('No image in response. Parts received:', parts.map((p: Record<string, unknown>) => ({
        hasText: !!p.text,
        hasInlineData: !!p.inlineData,
      })));
      return NextResponse.json(
        { error: 'No image generated - prompt may have been filtered' },
        { status: 500 }
      );
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;

    return NextResponse.json({
      success: true,
      image: imageUrl,
      style: style || 'custom',
      dimensions: { width, height, aspectRatio },
      model: {
        key: modelKey,
        name: modelConfig.name,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/images/background:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to list available background styles
 */
export async function GET() {
  const styles = Object.entries(BACKGROUND_STYLES).map(([key, value]) => ({
    key,
    description: value.description,
  }));

  return NextResponse.json({
    availableStyles: styles,
    usage: {
      description: 'POST to generate a background image',
      options: {
        style: `One of: ${Object.keys(BACKGROUND_STYLES).join(', ')}`,
        customPrompt: 'Or provide your own prompt (will append no-text instructions)',
        colorHint: 'Optional hex color to incorporate',
        model: `Optional: ${Object.keys(IMAGE_MODELS).join(' | ')}`,
        width: 'Optional (default: 1080)',
        height: 'Optional (default: 1350)',
      },
    },
  });
}
