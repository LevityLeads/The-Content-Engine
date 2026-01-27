import { NextRequest, NextResponse } from "next/server";
import { BrandStyle } from "@/contexts/brand-context";

interface FeedbackItem {
  imageUrl: string;
  status: "needs_work" | "rejected";
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandStyle, feedback, exampleImages } = body as {
      brandStyle: BrandStyle;
      feedback: FeedbackItem[];
      exampleImages?: string[]; // Original example images for reference
    };

    if (!brandStyle || !brandStyle.masterPrompt) {
      return NextResponse.json(
        { error: "Brand style with master prompt is required" },
        { status: 400 }
      );
    }

    if (!feedback || feedback.length === 0) {
      return NextResponse.json(
        { error: "At least one feedback item is required" },
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

    // Build refinement prompt
    const feedbackSummary = feedback
      .map((f, i) => {
        const status = f.status === "rejected" ? "REJECTED (completely wrong)" : "NEEDS IMPROVEMENT";
        const notes = f.notes ? `\n   User notes: "${f.notes}"` : "";
        return `${i + 1}. ${status}${notes}`;
      })
      .join("\n");

    // Prepare image parts for Gemini (include rejected/needs_work images)
    const imageParts = feedback.slice(0, 5).map((f) => {
      const base64Data = f.imageUrl.includes("base64,")
        ? f.imageUrl.split("base64,")[1]
        : f.imageUrl;
      const mimeType = f.imageUrl.includes("data:")
        ? f.imageUrl.split(";")[0].split(":")[1]
        : "image/png";

      return {
        inline_data: {
          data: base64Data,
          mime_type: mimeType,
        },
      };
    });

    // Add some original example images for reference if available
    const referenceImageParts = (exampleImages || []).slice(0, 3).map((img) => {
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

    const refinementPrompt = `You are an expert AI prompt engineer specializing in visual brand consistency.

## CURRENT MASTER BRAND PROMPT
This is the prompt that was used to generate images:

---
${brandStyle.masterPrompt}
---

## FEEDBACK ON GENERATED IMAGES
The user has reviewed images generated with the above prompt and provided this feedback:

${feedbackSummary}

## YOUR TASK
Analyze the generated images (shown first) and compare them to the original brand example images (shown after, if available).

Identify what went WRONG - why don't the generated images match the brand style?

Common issues to look for:
- Wrong colors or color intensity
- Wrong typography style or weight
- Wrong background treatment
- Missing recurring brand elements
- Wrong mood or aesthetic
- Text not readable enough
- Layout doesn't match brand patterns
- Missing specific design elements

## OUTPUT
Create a REFINED master brand prompt that fixes these issues. The new prompt should:

1. Be MORE SPECIFIC about the things that went wrong
2. Add EXPLICIT instructions to avoid the mistakes
3. Include more DETAILED color and typography specifications
4. Add stronger EMPHASIS on the brand's key visual elements
5. Include what NOT to do based on the feedback

Return ONLY valid JSON:
{
  "analysis": "Brief analysis of what went wrong with the generated images",
  "refinements_made": ["List of specific changes made to the prompt"],
  "refined_prompt": "The complete new master brand prompt (3-4 paragraphs, highly detailed and specific)"
}`;

    // Call Gemini with images
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: refinementPrompt },
                // First show the generated images that need improvement
                ...imageParts,
                // Then show original examples for reference
                ...(referenceImageParts.length > 0
                  ? [{ text: "\n\nORIGINAL BRAND EXAMPLE IMAGES FOR REFERENCE:" }, ...referenceImageParts]
                  : []),
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
      console.error("Gemini API error during refinement:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to refine brand style" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in refinement response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse refinement response" },
        { status: 500 }
      );
    }

    let refinement;
    try {
      refinement = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse refinement response" },
        { status: 500 }
      );
    }

    if (!refinement.refined_prompt) {
      return NextResponse.json(
        { error: "Refinement did not produce a new prompt" },
        { status: 500 }
      );
    }

    console.log("Brand style refined:", {
      analysis: refinement.analysis,
      refinementsCount: refinement.refinements_made?.length || 0,
    });

    return NextResponse.json({
      success: true,
      analysis: refinement.analysis,
      refinementsMade: refinement.refinements_made,
      refinedPrompt: refinement.refined_prompt,
    });
  } catch (error) {
    console.error("Error in POST /api/brands/refine-style:", error);
    return NextResponse.json(
      { error: "Failed to refine brand style" },
      { status: 500 }
    );
  }
}
