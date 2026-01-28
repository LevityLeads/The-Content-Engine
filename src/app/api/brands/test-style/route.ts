import { NextRequest, NextResponse } from "next/server";
import { BrandStyle } from "@/contexts/brand-context";
import { IMAGE_MODELS, DEFAULT_MODEL } from "@/lib/image-models";

// Test prompts for generating sample images
const TEST_CONTENT_PROMPTS = [
  {
    type: "hook",
    text: "5 Things Nobody Tells You About Success",
    description: "A compelling hook slide for a carousel",
  },
  {
    type: "content",
    text: "The key to growth isn't working harder—it's working smarter on the right things.",
    description: "A content slide with an insight",
  },
  {
    type: "cta",
    text: "Follow for more insights",
    description: "A call-to-action slide",
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandStyle, count = 3 } = body as {
      brandStyle: BrandStyle;
      count?: number;
    };

    if (!brandStyle || !brandStyle.masterPrompt) {
      return NextResponse.json(
        { error: "Brand style with master prompt is required" },
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

    const testImages: Array<{ url: string; type: string; text: string }> = [];
    const errors: string[] = [];

    // Use the default image model
    const modelConfig = IMAGE_MODELS[DEFAULT_MODEL];
    console.log(`Using model for test images: ${modelConfig.name} (${modelConfig.id})`);

    // Generate test images
    const testsToRun = TEST_CONTENT_PROMPTS.slice(0, Math.min(count, 3));

    for (const test of testsToRun) {
      // Build a complete prompt combining brand style + specific content
      const fullPrompt = `${brandStyle.masterPrompt}

---

NOW CREATE THIS SPECIFIC IMAGE:

Content Type: ${test.type} slide for social media carousel
Text to Display: "${test.text}"
Description: ${test.description}

CRITICAL REQUIREMENTS:
- Follow the brand style guidelines above EXACTLY
- Use the exact colors specified in the brand style
- Match the typography style described
- Maintain the visual mood and aesthetic
- The text "${test.text}" must be clearly readable and be the focal point
- This should look like it belongs to the same brand as the example images
- Aspect ratio: 4:5 (portrait, suitable for Instagram carousel)
- DO NOT include any app interfaces, phone screens, or social media UI elements
- The output should be ONLY the designed graphic itself

Generate a single social media image that perfectly matches this brand's style.`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent?key=${googleApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
                imageConfig: { aspectRatio: "4:5" },
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Test image generation failed for ${test.type}:`, response.status, errorText);
          errors.push(`Failed to generate ${test.type} image`);
          continue;
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];

        let imageFound = false;
        for (const part of parts) {
          if (part.inlineData?.data) {
            testImages.push({
              url: `data:image/png;base64,${part.inlineData.data}`,
              type: test.type,
              text: test.text,
            });
            imageFound = true;
            break;
          }
        }

        if (!imageFound) {
          errors.push(`No image generated for ${test.type}`);
        }
      } catch (err) {
        console.error(`Error generating ${test.type} test image:`, err);
        errors.push(`Error generating ${test.type} image`);
      }
    }

    if (testImages.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any test images", details: errors },
        { status: 500 }
      );
    }

    console.log(`Generated ${testImages.length} test images for brand style`);

    return NextResponse.json({
      success: true,
      testImages,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in POST /api/brands/test-style:", error);
    return NextResponse.json(
      { error: "Failed to generate test images" },
      { status: 500 }
    );
  }
}
