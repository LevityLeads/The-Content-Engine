import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images } = body; // Array of base64 image strings

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    if (images.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 images allowed" },
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

    const analysisPrompt = `You are a brand visual analyst. Analyze these ${images.length} example social media post images from the same brand.

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
