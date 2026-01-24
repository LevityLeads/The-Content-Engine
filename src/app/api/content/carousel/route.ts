/**
 * Carousel Content Generation API
 *
 * Dedicated endpoint for carousel content generation using the all-at-once
 * approach with narrative arc planning.
 *
 * Key features:
 * 1. Design context computed ONCE at the start
 * 2. All slides generated in a single Claude call for narrative coherence
 * 3. Design context stored in metadata for downstream image generation
 * 4. Design context returned in response for immediate use
 *
 * This endpoint uses:
 * - computeDesignContext from @/lib/design (Plan 01-01)
 * - CAROUSEL_SYSTEM_PROMPT and buildCarouselUserPrompt from @/lib/prompts (Plan 01-02)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient, DEFAULT_MODEL, extractTextContent } from '@/lib/anthropic/client';
import { computeDesignContext } from '@/lib/design';
import {
  CAROUSEL_SYSTEM_PROMPT,
  buildCarouselUserPrompt,
  type CarouselGenerationResult,
  type CarouselIdeaInput,
} from '@/lib/prompts';
import { buildVoicePrompt, type VoiceConfig, type VisualConfig } from '@/lib/prompts';

/**
 * POST /api/content/carousel
 *
 * Generate carousel content using the all-at-once approach.
 *
 * Request body:
 * - ideaId: UUID of the idea to generate content from
 * - visualStyle: 'typography' | 'photorealistic' | 'illustration' | '3d-render' | 'abstract-art' | 'collage'
 * - textStyle: 'bold-editorial' | 'clean-modern' | 'dramatic' | 'minimal' | 'statement'
 * - slideCount: (optional) Number of slides to generate (default: AI decides)
 *
 * Response:
 * - success: boolean
 * - content: Saved content record from database
 * - designContext: The computed DesignContext for downstream image generation
 * - narrativeArc: The narrative structure used
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { ideaId, visualStyle, textStyle, slideCount } = body;

    if (!ideaId) {
      return NextResponse.json(
        { error: 'ideaId is required' },
        { status: 400 }
      );
    }

    // 2. Fetch idea with brand config
    const supabase = await createClient();
    const { data: idea, error } = await supabase
      .from('ideas')
      .select('*, inputs(*), brands(*)')
      .eq('id', ideaId)
      .single();

    if (error || !idea) {
      console.error('[Carousel Content] Idea fetch error:', error);
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    // 3. COMPUTE DESIGN CONTEXT ONCE
    const brandVisualConfig = idea.brands?.visual_config as {
      primary_color?: string;
      accent_color?: string;
      secondary_color?: string;
      image_style?: string;
      fonts?: { heading?: string; body?: string };
      master_brand_prompt?: string;
    } | undefined;

    const designContext = computeDesignContext({
      visualStyle: visualStyle || 'typography',
      textStyle: textStyle || 'bold-editorial',
      brandVisualConfig,
    });

    // Log design context for pipeline verification
    console.log('[Carousel Content] Design context computed:', {
      visualStyle: designContext.visualStyle,
      primaryColor: designContext.primaryColor,
      accentColor: designContext.accentColor,
      aesthetic: designContext.aesthetic,
    });

    // 4. Build voice prompt
    const voiceConfig = idea.brands?.voice_config as VoiceConfig | null;
    const brandVoicePrompt = buildVoicePrompt(voiceConfig, brandVisualConfig as VisualConfig | undefined);

    // 5. Build carousel user prompt (includes design context awareness)
    const ideaInput: CarouselIdeaInput = {
      concept: idea.concept || '',
      angle: idea.angle || '',
      keyPoints: Array.isArray(idea.key_points) ? idea.key_points : [],
      potentialHooks: Array.isArray(idea.potential_hooks) ? idea.potential_hooks : [],
      pillar: idea.pillar || undefined,
      reasoning: idea.reasoning || undefined,
    };

    const userPrompt = buildCarouselUserPrompt({
      idea: ideaInput,
      sourceContent: idea.inputs?.raw_content || 'No source content available',
      designContext,
      brandVoicePrompt,
      slideCount: slideCount || undefined,
    });

    // 6. Call Claude with carousel system prompt
    console.log('[Carousel Content] Calling Claude for all-at-once generation...');
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      system: CAROUSEL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // 7. Parse response
    const responseText = extractTextContent(message);
    let result: CarouselGenerationResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[Carousel Content] Parse error:', parseError, 'Response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    console.log('[Carousel Content] Generated', result.slides.length, 'slides with narrative arc:', result.narrativeArc.theme);

    // 8. Save to database with design context in metadata
    const contentToInsert = {
      idea_id: ideaId,
      brand_id: idea.brand_id,
      platform: 'instagram',
      copy_primary: result.caption,
      copy_hashtags: result.hashtags,
      copy_cta: result.cta,
      copy_carousel_slides: result.slides.map(slide => JSON.stringify(slide)),
      status: 'draft',
      metadata: {
        visualStyle,
        textStyle,
        designContext,  // STORE THE DESIGN CONTEXT
        narrativeArc: result.narrativeArc,
        generatedWith: 'carousel-v2',
        slideCount: result.slides.length,
      },
    };

    const { data: savedContent, error: saveError } = await supabase
      .from('content')
      .insert(contentToInsert)
      .select()
      .single();

    if (saveError) {
      console.error('[Carousel Content] Save error:', saveError);
      return NextResponse.json(
        { error: 'Failed to save content' },
        { status: 500 }
      );
    }

    console.log('[Carousel Content] Saved content:', savedContent.id);

    // 9. Return result with design context for downstream use
    return NextResponse.json({
      success: true,
      content: savedContent,
      designContext,  // RETURN FOR IMMEDIATE IMAGE GENERATION
      narrativeArc: result.narrativeArc,
      slides: result.slides,
    });
  } catch (error) {
    console.error('[Carousel Content] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/carousel
 *
 * Returns endpoint documentation and usage information.
 */
export async function GET() {
  return NextResponse.json({
    description: 'Generate carousel content using all-at-once approach with narrative arc planning',
    version: 'v2',
    features: [
      'All slides generated in single Claude call',
      'Narrative arc planning for story coherence',
      'Design context computed once and stored',
      'Ready for immediate image generation',
    ],
    usage: {
      method: 'POST',
      body: {
        ideaId: 'UUID of the idea to generate content from (required)',
        visualStyle: 'typography | photorealistic | illustration | 3d-render | abstract-art | collage (default: typography)',
        textStyle: 'bold-editorial | clean-modern | dramatic | minimal | statement (default: bold-editorial)',
        slideCount: 'Number of slides to generate (optional, AI decides if not specified)',
      },
      response: {
        success: 'boolean',
        content: 'Saved content record',
        designContext: 'DesignContext for downstream image generation',
        narrativeArc: 'Narrative structure used',
        slides: 'Array of generated slides with content and metadata',
      },
    },
    example: {
      request: {
        ideaId: '123e4567-e89b-12d3-a456-426614174000',
        visualStyle: 'typography',
        textStyle: 'bold-editorial',
      },
      response: {
        success: true,
        content: { id: '...', platform: 'instagram', status: 'draft' },
        designContext: {
          visualStyle: 'typography',
          primaryColor: '#ffffff',
          accentColor: '#ff6b6b',
        },
        narrativeArc: {
          theme: 'The hidden cost of multitasking',
          tension: 'We think we are productive but we are losing time',
          resolution: 'Focus on one thing to reclaim your day',
        },
      },
    },
  });
}
