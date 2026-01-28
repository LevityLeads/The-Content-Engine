/**
 * @deprecated LEGACY V2 TEST ROUTE - DO NOT USE FOR NEW FEATURES
 *
 * This route uses the old Satori-based text compositing approach.
 * See /api/images/carousel/route.ts for full deprecation details.
 *
 * CURRENT APPROACH: Use Gemini "Nano Banana Pro" directly via /api/images/generate
 * which generates complete images with text in a single call using the Master Brand Prompt.
 *
 * This route exists only for the legacy contentgenv2 test page.
 */

import { NextRequest, NextResponse } from "next/server";
import satori from "satori";
import sharp from "sharp";

// Font loading
async function loadFont(): Promise<ArrayBuffer> {
  const fontUrl = "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff";
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error("Failed to load font");
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

// Generate background using Gemini
async function generateBackground(
  style: string,
  primaryColor: string = "#cc100a",
  accentColor: string = "#ffffff"
): Promise<string | null> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    console.warn("GOOGLE_API_KEY not set, using solid background");
    return null;
  }

  const BACKGROUND_PROMPTS: Record<string, string> = {
    "gradient-dark": `Abstract dark gradient background transitioning from deep navy (#1a1a2e) to charcoal black (#0d0d0d). Incorporate subtle hints of ${primaryColor} as accent glow. Minimal, sophisticated, perfect for text overlay. No text, no objects, no patterns - pure gradient only.`,
    "gradient-warm": `Abstract warm gradient background with rich tones of ${primaryColor} fading into deep burgundy. Smooth color transitions. No text, no objects - pure gradient colors only.`,
    "abstract-shapes": `Dark background (#1a1a2e) with subtle, blurred geometric shapes in ${primaryColor} tones. Shapes are abstract, soft-edged, positioned to leave center clear for text. Minimal, modern. No text, no recognizable objects.`,
    "minimal": `Clean solid charcoal background (#1a1a1a) with very subtle ${primaryColor} glow at edges. Perfectly uniform. Minimal, modern, professional. No texture, no text, no objects.`,
  };

  const prompt = BACKGROUND_PROMPTS[style] || BACKGROUND_PROMPTS["gradient-dark"];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "4:5" },
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Background generation failed:", response.status);
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
    console.error("Background generation error:", error);
  }

  return null;
}

// Create slide template JSX element
function createSlideElement(
  slideNumber: number,
  headline: string,
  body: string | undefined,
  totalSlides: number,
  design: {
    backgroundColor: string;
    primaryColor: string;
    accentColor: string;
    hasBackground: boolean;
  },
  width: number,
  height: number
): React.ReactElement {
  const isHook = slideNumber === 1;
  const isCta = slideNumber === totalSlides;

  // Adjust font sizes for slide type
  const headlineFontSize = isHook ? 72 : isCta ? 64 : 56;
  const bodyFontSize = 28;

  return {
    type: "div",
    props: {
      style: {
        width: `${width}px`,
        height: `${height}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px",
        backgroundColor: design.hasBackground ? "transparent" : design.backgroundColor,
        fontFamily: "Inter",
        textAlign: "center",
      },
      children: [
        // Slide number indicator (except for hook and CTA)
        !isHook && !isCta && {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "40px",
              right: "40px",
              color: design.accentColor,
              fontSize: "24px",
              fontWeight: 600,
              opacity: 0.8,
            },
            children: `${slideNumber}/${totalSlides}`,
          },
        },
        // Headline
        {
          type: "div",
          props: {
            style: {
              color: design.primaryColor,
              fontSize: `${headlineFontSize}px`,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: body ? "24px" : "0",
              maxWidth: "900px",
            },
            children: headline,
          },
        },
        // Body text (if present)
        body && {
          type: "div",
          props: {
            style: {
              color: design.primaryColor,
              fontSize: `${bodyFontSize}px`,
              fontWeight: 400,
              lineHeight: 1.5,
              opacity: 0.9,
              maxWidth: "800px",
            },
            children: body,
          },
        },
        // CTA indicator
        isCta && {
          type: "div",
          props: {
            style: {
              marginTop: "40px",
              padding: "16px 48px",
              backgroundColor: design.accentColor,
              borderRadius: "999px",
              color: design.backgroundColor,
              fontSize: "24px",
              fontWeight: 600,
            },
            children: "Follow for More",
          },
        },
      ].filter(Boolean),
    },
  } as unknown as React.ReactElement;
}

// Composite a single slide
async function compositeSlide(
  backgroundImage: string | null,
  slideNumber: number,
  headline: string,
  body: string | undefined,
  totalSlides: number,
  fontData: ArrayBuffer,
  width: number,
  height: number
): Promise<string> {
  const design = {
    backgroundColor: "#1a1a1a",
    primaryColor: "#ffffff",
    accentColor: "#cc100a",
    hasBackground: !!backgroundImage,
  };

  const templateElement = createSlideElement(
    slideNumber,
    headline,
    body,
    totalSlides,
    design,
    width,
    height
  );

  const svg = await satori(templateElement, {
    width,
    height,
    fonts: [
      {
        name: "Inter",
        data: fontData,
        weight: 700,
        style: "normal",
      },
    ],
  });

  const textLayerPng = await sharp(Buffer.from(svg)).png().toBuffer();

  let finalImage: Buffer;

  if (backgroundImage) {
    const base64Data = backgroundImage.split(",")[1];
    const bgBuffer = Buffer.from(base64Data, "base64");

    finalImage = await sharp(bgBuffer)
      .resize(width, height, { fit: "cover" })
      .composite([{ input: textLayerPng, top: 0, left: 0 }])
      .png()
      .toBuffer();
  } else {
    finalImage = textLayerPng;
  }

  return `data:image/png;base64,${finalImage.toString("base64")}`;
}

// Parse slide text to extract headline and body
function parseSlideContent(slideText: string): { headline: string; body?: string } {
  // Try to split on newline first
  const lines = slideText.split("\n").filter(l => l.trim());
  if (lines.length > 1) {
    return {
      headline: lines[0],
      body: lines.slice(1).join(" "),
    };
  }

  // Otherwise, first sentence is headline, rest is body
  const sentences = slideText.split(/(?<=[.!?])\s+/);
  if (sentences.length > 1) {
    return {
      headline: sentences[0],
      body: sentences.slice(1).join(" "),
    };
  }

  return { headline: slideText };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      slides, // Array of { slideNumber, headline, body } or { slideNumber, text }
      backgroundStyle = "gradient-dark",
      primaryColor = "#cc100a",
      accentColor = "#ffffff",
    } = body;

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: "slides array is required" },
        { status: 400 }
      );
    }

    const width = 1080;
    const height = 1350;
    const totalSlides = slides.length;

    // Load font
    const fontData = await getFont();

    // Generate background (one for all slides)
    const background = await generateBackground(backgroundStyle, primaryColor, accentColor);

    // Generate all slides
    const generatedImages: Array<{
      slideNumber: number;
      imageUrl: string;
    }> = [];

    for (const slide of slides) {
      const { headline, body } = slide.text
        ? parseSlideContent(slide.text)
        : { headline: slide.headline, body: slide.body };

      const imageUrl = await compositeSlide(
        background,
        slide.slideNumber,
        headline,
        body,
        totalSlides,
        fontData,
        width,
        height
      );

      generatedImages.push({
        slideNumber: slide.slideNumber,
        imageUrl,
      });
    }

    return NextResponse.json({
      success: true,
      images: generatedImages,
      backgroundGenerated: !!background,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
