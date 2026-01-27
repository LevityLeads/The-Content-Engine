import { NextRequest, NextResponse } from "next/server";

// Maximum images for enhanced analysis
const MAX_IMAGES = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      images, // Array of base64 image strings
      generateBrandStyle, // If true, generate comprehensive brand style
      platforms, // Optional: platforms these images are from
    } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images allowed` },
        { status: 400 }
      );
    }

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return NextResponse.json(
        { error: "Google API key not configured" },
        { status: 500 }
      );
    }

    // Prepare image parts for Gemini
    const imageParts = images.map((img: string) => {
      // Handle both base64 with data URI and raw base64
      const base64Data = img.includes("base64,") ? img.split("base64,")[1] : img;
      const mimeType = img.includes("data:")
        ? img.split(";")[0].split(":")[1]
        : "image/jpeg";

      return {
        inline_data: {
          data: base64Data,
          mime_type: mimeType,
        },
      };
    });

    // Build the analysis prompt - enhanced version for brand style generation
    const platformContext = platforms && platforms.length > 0
      ? `These images are from: ${platforms.join(", ")}. `
      : "";

    const analysisPrompt = generateBrandStyle
      ? `You are an expert brand visual analyst and AI prompt engineer. Analyze these ${images.length} example social media post images from the same brand. ${platformContext}

Your task is to extract EVERY visual detail needed to recreate this brand's exact look in AI-generated images.

## EXTRACTION REQUIREMENTS

### 1. COLOR PALETTE (be EXACT with hex codes)
- Primary brand color (most dominant, used for emphasis)
- Secondary color (supporting color)
- Accent color (for highlights, CTAs, emphasis)
- Background color(s) (what backgrounds are used)
- Text color(s) (for headlines and body text)
- Any additional colors that appear consistently

### 2. TYPOGRAPHY (describe in detail)
- Headline font characteristics: weight (thin/regular/bold/black), style (sans-serif/serif/display/script), case (uppercase/lowercase/mixed), any effects
- Body text font characteristics: weight, style, size relative to headlines
- Distinctive treatments: letter spacing, line height, text shadows, outlines, gradients on text
- If you can identify specific fonts, name them

### 3. VISUAL STYLE & COMPOSITION
- Overall aesthetic category: minimalist, bold, elegant, playful, corporate, edgy, etc.
- Image style if used: photography (candid/studio/lifestyle/product), illustration (flat/3D/hand-drawn), abstract, none
- Graphic elements: shapes, lines, patterns, textures, gradients
- Layout patterns: centered, asymmetric, grid-based, full-bleed, with margins
- Text placement: where is text typically positioned? How much space around it?
- Background treatment: solid, gradient, photo, pattern, texture

### 4. MOOD & EMOTIONAL QUALITY
- Overall feel: professional, friendly, luxurious, energetic, calm, bold, minimal
- Contrast level: high contrast, muted, balanced
- Energy level: dynamic, static, flowing
- Sophistication level: casual, refined, premium

### 5. RECURRING ELEMENTS (critical for consistency)
- Logo placement and size
- Border or frame styles
- Overlay treatments (gradient overlays, color washes)
- Icon or symbol usage
- Any signature design elements that appear repeatedly
- Spacing and margin patterns

### 6. LAYOUT PATTERNS (for carousels especially)
- How are hook/title slides designed?
- How are content slides designed?
- How are CTA/follow slides designed?
- Consistency rules across slides

## OUTPUT FORMAT

Create a comprehensive MASTER BRAND PROMPT that will serve as the PRIMARY AUTHORITY for all AI image generation. This prompt must be detailed enough that an AI can recreate the exact visual style without seeing the original images.

{
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "text": "#hexcode",
    "additional": ["#hex1", "#hex2"]
  },
  "typography": {
    "headline_style": "Detailed description of headline typography",
    "body_style": "Detailed description of body text typography",
    "treatments": "Special treatments like shadows, spacing, effects",
    "detected_fonts": ["Font Name 1", "Font Name 2"]
  },
  "visual_style": "Comprehensive description of the overall visual aesthetic",
  "image_style": "Photography/illustration style if applicable",
  "mood": "Emotional quality and feel",
  "layout_patterns": ["Pattern 1", "Pattern 2"],
  "consistent_elements": ["Element 1", "Element 2", "Element 3"],
  "platform_variations": {
    "instagram": "Any Instagram-specific style notes",
    "twitter": "Any Twitter-specific style notes",
    "linkedin": "Any LinkedIn-specific style notes"
  },
  "master_brand_prompt": "A COMPREHENSIVE 3-4 paragraph prompt that describes EXACTLY how to recreate this brand's visual style. This is the MOST IMPORTANT output. Include:\\n\\n1. Specific hex colors and where each is used\\n2. Exact typography specifications\\n3. Layout and composition rules\\n4. Background treatment details\\n5. Consistent design elements to include\\n6. Mood and aesthetic direction\\n7. What to AVOID that would break the brand style\\n\\nThis prompt will be the PRIMARY AUTHORITY for all image generation, so be extremely specific and actionable."
}

CRITICAL: The master_brand_prompt must be detailed enough that someone could recreate the brand's look perfectly just from reading it. Include specific hex codes, typography details, spacing preferences, and mood direction. Do NOT be vague - be precise and actionable.

Respond ONLY with valid JSON, no additional text.`
      : `You are a brand visual analyst. Analyze these ${images.length} example social media post images from the same brand.

Extract and describe the following visual brand elements in detail:

1. **COLOR PALETTE**: List the exact hex colors you see. Identify:
   - Primary brand color (most prominent)
   - Secondary/accent colors
   - Background colors commonly used
   - Text colors

2. **TYPOGRAPHY**: Describe the fonts/typography style:
   - Headline font style (serif, sans-serif, bold, light, etc.)
   - Body text font style
   - Any distinctive typographic treatments (all caps, letter spacing, etc.)

3. **VISUAL STYLE**: Describe the overall aesthetic:
   - Photography style (if any): candid, studio, lifestyle, etc.
   - Illustration style (if any): flat, 3D, hand-drawn, etc.
   - Graphic elements: shapes, patterns, icons used
   - Layout patterns: how text and images are arranged

4. **MOOD & TONE**: The emotional quality of the visuals:
   - Professional, playful, elegant, bold, minimal, etc.
   - High contrast or muted
   - Clean/organized or dynamic/energetic

5. **CONSISTENT ELEMENTS**: Things that appear across multiple posts:
   - Recurring design motifs
   - Logo placement patterns
   - Border or frame styles
   - Overlay treatments

Now, synthesize this into a MASTER BRAND PROMPT that can be used to generate new images matching this exact style. The prompt should be specific and actionable, written as instructions for an AI image generator.

Format your response as JSON:
{
  "colors": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "text": "#hexcode"
  },
  "typography": {
    "headline_style": "description",
    "body_style": "description",
    "treatments": "description"
  },
  "visual_style": "detailed description",
  "mood": "description",
  "consistent_elements": ["element1", "element2"],
  "master_brand_prompt": "A comprehensive prompt (2-3 paragraphs) that describes exactly how to recreate this brand's visual style for new social media images. Include specific colors, typography direction, layout preferences, and mood. This prompt will be prepended to individual image generation requests to ensure brand consistency."
}

Respond ONLY with valid JSON, no additional text.`;

    // Call Gemini API with vision capabilities
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: analysisPrompt },
                ...imageParts,
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to analyze images with AI" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse visual analysis" },
        { status: 500 }
      );
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse visual analysis response" },
        { status: 500 }
      );
    }

    console.log("Visual analysis complete:", {
      colors: analysis.colors,
      mood: analysis.mood,
      promptLength: analysis.master_brand_prompt?.length,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Error in POST /api/brands/analyze-visuals:", error);
    return NextResponse.json(
      { error: "Failed to analyze images" },
      { status: 500 }
    );
  }
}
