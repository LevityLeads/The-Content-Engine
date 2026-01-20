import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface BrandAnalysis {
  voice: {
    tone_keywords: string[];
    messaging_themes: string[];
    writing_style: string;
    words_to_avoid: string[];
  };
  visual: {
    color_palette: string[];
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    image_style: string;
    sample_images: string[];
  };
  summary: string;
}

// Extract colors from CSS/HTML
function extractColors(html: string): string[] {
  const colors = new Set<string>();

  // Hex colors
  const hexMatches = html.match(/#[0-9A-Fa-f]{6}\b/g) || [];
  hexMatches.forEach((c) => colors.add(c.toLowerCase()));

  // RGB colors
  const rgbMatches = html.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi) || [];
  rgbMatches.forEach((rgb) => {
    const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (match) {
      const hex = `#${parseInt(match[1]).toString(16).padStart(2, "0")}${parseInt(match[2]).toString(16).padStart(2, "0")}${parseInt(match[3]).toString(16).padStart(2, "0")}`;
      colors.add(hex.toLowerCase());
    }
  });

  // Filter out common non-brand colors (pure black, white, grays)
  const filtered = Array.from(colors).filter((c) => {
    const lower = c.toLowerCase();
    return (
      lower !== "#000000" &&
      lower !== "#ffffff" &&
      !lower.match(/^#([0-9a-f])\1{5}$/i) // Filter repeated chars like #333333
    );
  });

  return filtered.slice(0, 10);
}

// Extract image URLs from HTML
function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];

  // OG Image
  const ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
  if (ogMatch) images.push(ogMatch[1]);

  // Twitter Image
  const twitterMatch = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i);
  if (twitterMatch && !images.includes(twitterMatch[1])) images.push(twitterMatch[1]);

  // Logo images
  const logoMatches = html.match(/<img[^>]*(?:class|id|alt)[^>]*(?:logo|brand)[^>]*src="([^"]+)"/gi) || [];
  logoMatches.forEach((match) => {
    const srcMatch = match.match(/src="([^"]+)"/i);
    if (srcMatch && !images.includes(srcMatch[1])) images.push(srcMatch[1]);
  });

  // Make URLs absolute
  return images
    .map((img) => {
      if (img.startsWith("http")) return img;
      if (img.startsWith("//")) return `https:${img}`;
      if (img.startsWith("/")) return `${new URL(baseUrl).origin}${img}`;
      return `${baseUrl}/${img}`;
    })
    .slice(0, 5);
}

// Extract text content for analysis
function extractTextContent(html: string): string {
  // Remove scripts, styles, and HTML tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit to first 5000 chars for analysis
  return text.slice(0, 5000);
}

// Extract meta description and title
function extractMeta(html: string): { title: string; description: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);

  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    description: descMatch ? descMatch[1].trim() : "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Fetch the website
    let html: string;
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ContentEngine/1.0; +https://contentengine.ai)",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      html = await response.text();
    } catch (fetchError) {
      console.error("Error fetching URL:", fetchError);
      return NextResponse.json(
        { error: "Could not fetch the website. Please check the URL and try again." },
        { status: 400 }
      );
    }

    // Extract elements from HTML
    const colors = extractColors(html);
    const images = extractImages(html, normalizedUrl);
    const textContent = extractTextContent(html);
    const meta = extractMeta(html);

    // Use Claude to analyze the brand voice
    const anthropic = new Anthropic();

    const analysisPrompt = `Analyze this website content and extract brand voice and style guidelines.

Website: ${normalizedUrl}
Title: ${meta.title}
Description: ${meta.description}

Content excerpt:
${textContent}

Based on this content, provide a brand analysis in the following JSON format:
{
  "tone_keywords": ["keyword1", "keyword2", "keyword3"], // 3-5 words that describe the brand's tone
  "messaging_themes": ["theme1", "theme2"], // 2-3 key messaging themes
  "writing_style": "A one-sentence description of the brand's writing style",
  "words_to_avoid": ["word1", "word2"], // Words/phrases that don't fit this brand
  "image_style": "minimalist|photorealistic|illustrated|bold|elegant|playful", // Best fitting visual style
  "summary": "A brief 1-2 sentence summary of the brand personality"
}

Respond ONLY with the JSON, no additional text.`;

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
    });

    let voiceAnalysis;
    try {
      const responseText = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        voiceAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      voiceAnalysis = {
        tone_keywords: ["professional", "engaging"],
        messaging_themes: [],
        writing_style: "Clear and informative",
        words_to_avoid: [],
        image_style: "minimalist",
        summary: `Brand analysis for ${new URL(normalizedUrl).hostname}`,
      };
    }

    // Determine primary and accent colors from extracted colors
    const primaryColor = colors[0] || "#1a1a1a";
    const accentColor = colors[1] || colors[0] || "#3b82f6";

    const analysis: BrandAnalysis = {
      voice: {
        tone_keywords: voiceAnalysis.tone_keywords || ["professional"],
        messaging_themes: voiceAnalysis.messaging_themes || [],
        writing_style: voiceAnalysis.writing_style || "Professional and clear",
        words_to_avoid: voiceAnalysis.words_to_avoid || [],
      },
      visual: {
        color_palette: colors,
        primary_color: primaryColor,
        secondary_color: "#ffffff",
        accent_color: accentColor,
        image_style: voiceAnalysis.image_style || "minimalist",
        sample_images: images,
      },
      summary: voiceAnalysis.summary || `Brand profile extracted from ${new URL(normalizedUrl).hostname}`,
    };

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Error in POST /api/brands/analyze:", error);
    return NextResponse.json(
      { error: "Failed to analyze website" },
      { status: 500 }
    );
  }
}
