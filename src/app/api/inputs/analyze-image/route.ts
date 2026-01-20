import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { imageData, mediaType } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Validate media type
    const validMediaTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const actualMediaType = mediaType || "image/jpeg";

    if (!validMediaTypes.includes(actualMediaType)) {
      return NextResponse.json(
        { error: "Invalid image type. Supported: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Use Claude's vision capability to analyze the image
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: actualMediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageData,
              },
            },
            {
              type: "text",
              text: `Analyze this image in detail for content creation purposes. Extract and describe:

1. **Main Subject/Topic**: What is the primary focus of this image?
2. **Key Visual Elements**: What notable objects, people, scenes, or text are visible?
3. **Mood/Tone**: What feeling or atmosphere does the image convey?
4. **Potential Content Angles**: What stories, lessons, or insights could be derived from this image for social media content?
5. **Text in Image**: If there's any text visible, transcribe it accurately.
6. **Context/Setting**: Where was this likely taken or what context does it suggest?
7. **Brand/Product**: If applicable, what brand, product, or service is featured?

Provide a comprehensive description that would help a content creator generate engaging social media posts based on this image. Be specific and detailed.

Format your response as a clear, well-structured analysis that can be used as input for content ideation.`,
            },
          ],
        },
      ],
    });

    const analysis = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    return NextResponse.json({
      success: true,
      analysis,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
