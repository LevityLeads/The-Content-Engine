/**
 * Slide Template Components for Satori
 *
 * These React components are rendered by Satori into images.
 * They use inline styles (Satori requirement) and are designed
 * to be composited over background images.
 *
 * IMPORTANT: Satori has limited CSS support. Use only:
 * - Flexbox layouts
 * - Basic positioning
 * - Colors, padding, margin
 * - Font styling
 *
 * All templates now use centered layouts with semi-transparent
 * text backing for readability over photo backgrounds.
 */

import React from 'react';
import type { DesignContext } from '@/lib/design';
import type { SlideContent, CarouselDesignSystem } from './types';

/**
 * Design input type that accepts either DesignContext (preferred) or
 * CarouselDesignSystem (legacy, for backwards compatibility).
 *
 * Both types share the same core properties used by templates:
 * - primaryColor, accentColor, backgroundColor
 * - fontFamily, headlineFontSize, bodyFontSize
 * - headlineFontWeight, bodyFontWeight
 * - paddingX, paddingY, aesthetic
 *
 * DesignContext adds: visualStyle, masterBrandPrompt (optional)
 * Templates use only the shared properties, so both types work.
 */
type DesignInput = DesignContext | CarouselDesignSystem;

interface TemplateProps {
  content: SlideContent;
  design: DesignInput;
  width: number;
  height: number;
  hasBackground?: boolean; // If true, makes background transparent for compositing
}

/**
 * Text container with semi-transparent backing
 * Used across all templates for consistent readability over photos
 *
 * NOTE: This component uses DesignContext properties EXACTLY as provided.
 * It does NOT make any design decisions - it only renders.
 */
function TextContainer({
  children,
  hasBackground,
  centered = true,
  maxWidth = '90%',
}: {
  children: React.ReactNode;
  hasBackground: boolean;
  centered?: boolean;
  maxWidth?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start',
        justifyContent: 'center',
        backgroundColor: hasBackground ? 'rgba(0, 0, 0, 0.55)' : 'transparent',
        borderRadius: hasBackground ? 16 : 0,
        padding: hasBackground ? '40px 50px' : 0,
        maxWidth,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Hook Slide Template (Slide 1)
 *
 * Large, bold statement centered on the slide.
 * Designed to stop the scroll.
 *
 * Uses DesignContext properties EXACTLY as provided:
 * - design.primaryColor for headline text
 * - design.accentColor for accent text and decorative line
 * - design.headlineFontSize for headline
 * - design.bodyFontSize for accent text (with multiplier)
 * - design.headlineFontWeight for all text weights
 * - design.paddingX, design.paddingY for layout
 * - design.fontFamily for typography
 * - design.backgroundColor for fallback background
 */
export function HookSlideTemplate({
  content,
  design,
  width,
  height,
  hasBackground = false,
}: TemplateProps) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hasBackground ? 'transparent' : design.backgroundColor,
        padding: `${design.paddingY}px ${design.paddingX}px`,
        fontFamily: design.fontFamily,
      }}
    >
      <TextContainer hasBackground={hasBackground} centered={true}>
        {content.headline && (
          <span
            style={{
              fontSize: design.headlineFontSize,
              fontWeight: design.headlineFontWeight,
              color: design.primaryColor,
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            {content.headline}
          </span>
        )}

        {/* Accent text below headline */}
        {content.accentText && (
          <span
            style={{
              fontSize: design.bodyFontSize * 1.2,
              fontWeight: design.headlineFontWeight,
              color: design.accentColor,
              lineHeight: 1.3,
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            {content.accentText}
          </span>
        )}

        {/* Accent line under text */}
        <div
          style={{
            marginTop: 30,
            width: 80,
            height: 4,
            backgroundColor: design.accentColor,
            borderRadius: 2,
          }}
        />
      </TextContainer>
    </div>
  );
}

/**
 * Content Slide Template (Slides 2-5)
 *
 * Centered text with headline and body.
 * Good for delivering value points.
 *
 * Uses DesignContext properties EXACTLY as provided:
 * - design.primaryColor for headline and body text
 * - design.accentColor for accent/highlighted text
 * - design.headlineFontSize for headline (with 0.85 multiplier for content slides)
 * - design.bodyFontSize for body text
 * - design.headlineFontWeight, design.bodyFontWeight for weights
 * - design.paddingX, design.paddingY for layout
 * - design.fontFamily for typography
 * - design.backgroundColor for fallback background
 */
export function ContentSlideTemplate({
  content,
  design,
  width,
  height,
  hasBackground = false,
}: TemplateProps) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hasBackground ? 'transparent' : design.backgroundColor,
        padding: `${design.paddingY}px ${design.paddingX}px`,
        fontFamily: design.fontFamily,
      }}
    >
      <TextContainer hasBackground={hasBackground} centered={true} maxWidth="85%">
        {/* Headline */}
        {content.headline && (
          <span
            style={{
              fontSize: design.headlineFontSize * 0.85,
              fontWeight: design.headlineFontWeight,
              color: design.primaryColor,
              lineHeight: 1.25,
              textAlign: 'center',
              marginBottom: content.body || content.accentText ? 24 : 0,
            }}
          >
            {content.headline}
          </span>
        )}

        {/* Accent text (highlighted) */}
        {content.accentText && (
          <span
            style={{
              fontSize: design.bodyFontSize * 1.15,
              fontWeight: design.headlineFontWeight,
              color: design.accentColor,
              lineHeight: 1.35,
              textAlign: 'center',
              marginBottom: content.body ? 20 : 0,
            }}
          >
            {content.accentText}
          </span>
        )}

        {/* Body text */}
        {content.body && (
          <span
            style={{
              fontSize: design.bodyFontSize,
              fontWeight: design.bodyFontWeight,
              color: design.primaryColor,
              lineHeight: 1.5,
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            {content.body}
          </span>
        )}
      </TextContainer>
    </div>
  );
}

/**
 * Numbered Slide Template
 *
 * Large number + title + description, all centered.
 * Great for listicles and step-by-step content.
 *
 * Uses DesignContext properties EXACTLY as provided:
 * - design.accentColor for the large slide number
 * - design.primaryColor for headline and body text
 * - design.headlineFontSize for number (with 1.3 multiplier) and headline (with 0.75 multiplier)
 * - design.bodyFontSize for body text
 * - design.headlineFontWeight, design.bodyFontWeight for weights
 * - design.paddingX, design.paddingY for layout
 * - design.fontFamily for typography
 * - design.backgroundColor for fallback background
 */
export function NumberedSlideTemplate({
  content,
  design,
  width,
  height,
  hasBackground = false,
}: TemplateProps) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hasBackground ? 'transparent' : design.backgroundColor,
        padding: `${design.paddingY}px ${design.paddingX}px`,
        fontFamily: design.fontFamily,
      }}
    >
      <TextContainer hasBackground={hasBackground} centered={true} maxWidth="85%">
        {/* Large slide number */}
        <span
          style={{
            fontSize: design.headlineFontSize * 1.3,
            fontWeight: design.headlineFontWeight,
            color: design.accentColor,
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          {content.slideNumber}
        </span>

        {/* Headline */}
        {content.headline && (
          <span
            style={{
              fontSize: design.headlineFontSize * 0.75,
              fontWeight: design.headlineFontWeight,
              color: design.primaryColor,
              lineHeight: 1.25,
              textAlign: 'center',
              marginBottom: content.body ? 20 : 0,
            }}
          >
            {content.headline}
          </span>
        )}

        {/* Body text */}
        {content.body && (
          <span
            style={{
              fontSize: design.bodyFontSize,
              fontWeight: design.bodyFontWeight,
              color: design.primaryColor,
              lineHeight: 1.5,
              textAlign: 'center',
              opacity: 0.85,
            }}
          >
            {content.body}
          </span>
        )}
      </TextContainer>
    </div>
  );
}

/**
 * CTA Slide Template (Final slide)
 *
 * Summary/takeaway with call to action button.
 * Designed to drive engagement.
 *
 * Uses DesignContext properties EXACTLY as provided:
 * - design.primaryColor for headline and secondary text
 * - design.accentColor for CTA button background
 * - design.headlineFontSize for headline (with 0.8 multiplier)
 * - design.bodyFontSize for CTA text and secondary text
 * - design.headlineFontWeight, design.bodyFontWeight for weights
 * - design.paddingX, design.paddingY for layout
 * - design.fontFamily for typography
 * - design.backgroundColor for fallback background
 */
export function CTASlideTemplate({
  content,
  design,
  width,
  height,
  hasBackground = false,
}: TemplateProps) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hasBackground ? 'transparent' : design.backgroundColor,
        padding: `${design.paddingY}px ${design.paddingX}px`,
        fontFamily: design.fontFamily,
      }}
    >
      <TextContainer hasBackground={hasBackground} centered={true} maxWidth="85%">
        {/* Headline (summary/takeaway) */}
        {content.headline && (
          <span
            style={{
              fontSize: design.headlineFontSize * 0.8,
              fontWeight: design.headlineFontWeight,
              color: design.primaryColor,
              lineHeight: 1.25,
              textAlign: 'center',
              marginBottom: content.ctaText ? 32 : 0,
            }}
          >
            {content.headline}
          </span>
        )}

        {/* CTA Button-like element */}
        {content.ctaText && (
          <div
            style={{
              display: 'flex',
              backgroundColor: design.accentColor,
              paddingLeft: 36,
              paddingRight: 36,
              paddingTop: 14,
              paddingBottom: 14,
              borderRadius: 8,
              marginBottom: content.body ? 24 : 0,
            }}
          >
            <span
              style={{
                fontSize: design.bodyFontSize,
                fontWeight: design.headlineFontWeight,
                color: '#ffffff',
              }}
            >
              {content.ctaText}
            </span>
          </div>
        )}

        {/* Secondary text below CTA */}
        {content.body && (
          <span
            style={{
              fontSize: design.bodyFontSize * 0.9,
              fontWeight: design.bodyFontWeight,
              color: design.primaryColor,
              opacity: 0.8,
              textAlign: 'center',
            }}
          >
            {content.body}
          </span>
        )}
      </TextContainer>
    </div>
  );
}

/**
 * Returns a template component for the given slide type.
 *
 * IMPORTANT: Templates are AUTHORITATIVE on layout. They use DesignContext
 * properties EXACTLY as provided. No interpretation or adjustment.
 *
 * This is a pure function - same inputs always produce same output.
 *
 * Accepts either DesignContext (preferred) or CarouselDesignSystem (legacy)
 * for backwards compatibility during migration. Both types share the core
 * properties that templates use.
 *
 * @param templateType - The type of slide template to render
 * @param props - Template props including content, design context, dimensions, and background flag
 * @returns React element for the slide template
 */
export function getSlideTemplate(
  templateType: 'hook' | 'content' | 'cta' | 'numbered',
  props: {
    content: SlideContent;
    design: DesignInput;
    width: number;
    height: number;
    hasBackground: boolean;
  }
): React.ReactElement {
  switch (templateType) {
    case 'hook':
      return <HookSlideTemplate {...props} />;
    case 'content':
      return <ContentSlideTemplate {...props} />;
    case 'numbered':
      return <NumberedSlideTemplate {...props} />;
    case 'cta':
      return <CTASlideTemplate {...props} />;
    default:
      return <ContentSlideTemplate {...props} />;
  }
}

// Export the DesignInput type for consumers that need type flexibility
export type { DesignInput };
