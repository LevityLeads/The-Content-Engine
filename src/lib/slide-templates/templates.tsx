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
 */

import React from 'react';
import type { CarouselDesignSystem, SlideContent } from './types';

interface TemplateProps {
  content: SlideContent;
  design: CarouselDesignSystem;
  width: number;
  height: number;
  hasBackground?: boolean; // If true, makes background transparent for compositing
}

/**
 * Hook Slide Template (Slide 1)
 *
 * Large, bold statement centered on the slide.
 * Designed to stop the scroll.
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
      {content.headline && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: design.headlineFontSize,
              fontWeight: design.headlineFontWeight,
              color: design.primaryColor,
              lineHeight: 1.2,
              textAlign: 'center',
              maxWidth: '90%',
            }}
          >
            {content.headline}
          </span>
        </div>
      )}

      {/* Accent line under headline */}
      <div
        style={{
          marginTop: 30,
          width: 120,
          height: 4,
          backgroundColor: design.accentColor,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

/**
 * Content Slide Template (Slides 2-5)
 *
 * Header at top, body text below.
 * Good for delivering value points.
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
        justifyContent: 'flex-start',
        backgroundColor: hasBackground ? 'transparent' : design.backgroundColor,
        padding: `${design.paddingY}px ${design.paddingX}px`,
        fontFamily: design.fontFamily,
      }}
    >
      {/* Headline at top */}
      {content.headline && (
        <span
          style={{
            fontSize: design.headlineFontSize * 0.8,
            fontWeight: design.headlineFontWeight,
            color: design.primaryColor,
            lineHeight: 1.3,
            marginBottom: 40,
          }}
        >
          {content.headline}
        </span>
      )}

      {/* Accent text (highlighted) */}
      {content.accentText && (
        <span
          style={{
            fontSize: design.bodyFontSize * 1.2,
            fontWeight: design.headlineFontWeight,
            color: design.accentColor,
            lineHeight: 1.4,
            marginBottom: 30,
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
            lineHeight: 1.6,
            opacity: 0.9,
          }}
        >
          {content.body}
        </span>
      )}
    </div>
  );
}

/**
 * Numbered Slide Template
 *
 * Large number + title + description.
 * Great for listicles and step-by-step content.
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
        justifyContent: 'center',
        backgroundColor: hasBackground ? 'transparent' : design.backgroundColor,
        padding: `${design.paddingY}px ${design.paddingX}px`,
        fontFamily: design.fontFamily,
      }}
    >
      {/* Large slide number */}
      <span
        style={{
          fontSize: design.headlineFontSize * 1.5,
          fontWeight: design.headlineFontWeight,
          color: design.accentColor,
          lineHeight: 1,
          marginBottom: 20,
        }}
      >
        {content.slideNumber.toString().padStart(2, '0')}
      </span>

      {/* Headline */}
      {content.headline && (
        <span
          style={{
            fontSize: design.headlineFontSize * 0.7,
            fontWeight: design.headlineFontWeight,
            color: design.primaryColor,
            lineHeight: 1.3,
            marginBottom: 24,
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
            lineHeight: 1.6,
            opacity: 0.85,
          }}
        >
          {content.body}
        </span>
      )}
    </div>
  );
}

/**
 * CTA Slide Template (Final slide)
 *
 * Summary/takeaway with call to action.
 * Designed to drive engagement.
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
      {/* Headline (summary/takeaway) */}
      {content.headline && (
        <span
          style={{
            fontSize: design.headlineFontSize * 0.85,
            fontWeight: design.headlineFontWeight,
            color: design.primaryColor,
            lineHeight: 1.3,
            textAlign: 'center',
            marginBottom: 40,
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
            paddingLeft: 40,
            paddingRight: 40,
            paddingTop: 16,
            paddingBottom: 16,
            borderRadius: 8,
          }}
        >
          <span
            style={{
              fontSize: design.bodyFontSize,
              fontWeight: design.headlineFontWeight,
              color: design.backgroundColor,
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
            opacity: 0.7,
            marginTop: 30,
            textAlign: 'center',
          }}
        >
          {content.body}
        </span>
      )}
    </div>
  );
}

/**
 * Template selector function
 */
export function getSlideTemplate(
  templateType: 'hook' | 'content' | 'cta' | 'numbered',
  props: TemplateProps
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
