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
    fonts: {
      heading: string;
      body: string;
      detected_fonts: string[];
    };
  };
  summary: string;
}

// Common web-safe and system fonts to filter out
const SYSTEM_FONTS = new Set([
  'arial', 'helvetica', 'verdana', 'georgia', 'times', 'times new roman',
  'courier', 'courier new', 'system-ui', '-apple-system', 'blinkmacsystemfont',
  'segoe ui', 'roboto', 'oxygen', 'ubuntu', 'cantarell', 'fira sans', 'droid sans',
  'helvetica neue', 'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'inherit'
]);

// Extract fonts from CSS/HTML
function extractFonts(html: string): { heading: string; body: string; detected: string[] } {
  const fonts = new Set<string>();

  // 1. Extract from Google Fonts links (most reliable for identifying brand fonts)
  const googleFontsMatches = html.match(/fonts\.googleapis\.com\/css2?\?family=([^"&]+)/gi) || [];
  googleFontsMatches.forEach((match) => {
    const familyMatch = match.match(/family=([^"&]+)/i);
    if (familyMatch) {
      // Decode URL encoding and extract font names
      const decoded = decodeURIComponent(familyMatch[1]);
      // Handle format: "Poppins:wght@400;700|Roboto:wght@300"
      const fontFamilies = decoded.split('|').map(f => f.split(':')[0].replace(/\+/g, ' '));
      fontFamilies.forEach(f => fonts.add(f.trim()));
    }
  });

  // 2. Extract from Adobe Fonts/Typekit
  const adobeFontsMatch = html.match(/use\.typekit\.net\/([a-z0-9]+)\.css/i);
  if (adobeFontsMatch) {
    // Can't easily get font names from Typekit ID, but note it's in use
    fonts.add('[Adobe Fonts detected]');
  }

  // 3. Extract from CSS font-family declarations
  const fontFamilyMatches = html.match(/font-family\s*:\s*([^;}{]+)/gi) || [];
  fontFamilyMatches.forEach((match) => {
    const value = match.replace(/font-family\s*:\s*/i, '').trim();
    // Split by comma and clean up
    const families = value.split(',').map(f =>
      f.trim().replace(/["']/g, '').toLowerCase()
    );

    // Add non-system fonts
    families.forEach(f => {
      const normalized = f.toLowerCase().trim();
      if (normalized && !SYSTEM_FONTS.has(normalized) && !normalized.startsWith('var(')) {
        // Capitalize properly
        const properCase = f.split(' ').map(w =>
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ');
        fonts.add(properCase);
      }
    });
  });

  // 4. Extract from CSS variables (--font-heading, --font-body, etc.)
  const fontVarMatches = html.match(/--font[^:]*:\s*([^;}{]+)/gi) || [];
  fontVarMatches.forEach((match) => {
    const value = match.split(':')[1]?.trim();
    if (value) {
      const families = value.split(',').map(f => f.trim().replace(/["']/g, ''));
      families.forEach(f => {
        const normalized = f.toLowerCase().trim();
        if (normalized && !SYSTEM_FONTS.has(normalized) && !normalized.startsWith('var(')) {
          const properCase = f.split(' ').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          ).join(' ');
          fonts.add(properCase);
        }
      });
    }
  });

  const detectedFonts = Array.from(fonts).filter(f => !f.startsWith('[')).slice(0, 5);

  // Try to identify heading vs body font
  // Usually: first font in CSS is primary/heading, or look for specific class names
  let headingFont = detectedFonts[0] || 'Inter';
  let bodyFont = detectedFonts[1] || detectedFonts[0] || 'Inter';

  // Check for heading-specific declarations
  const headingMatch = html.match(/(?:h1|h2|h3|\.heading|\.title)[^{]*\{[^}]*font-family\s*:\s*["']?([^;,"']+)/i);
  if (headingMatch) {
    const font = headingMatch[1].trim();
    if (!SYSTEM_FONTS.has(font.toLowerCase())) {
      headingFont = font.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // Check for body-specific declarations
  const bodyMatch = html.match(/(?:body|\.body|p)[^{]*\{[^}]*font-family\s*:\s*["']?([^;,"']+)/i);
  if (bodyMatch) {
    const font = bodyMatch[1].trim();
    if (!SYSTEM_FONTS.has(font.toLowerCase())) {
      bodyFont = font.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  return {
    heading: headingFont,
    body: bodyFont,
    detected: detectedFonts,
  };
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
    const fonts = extractFonts(html);
    const images = extractImages(html, normalizedUrl);
    const textContent = extractTextContent(html);
    const meta = extractMeta(html);

    console.log(`Brand analysis: Detected fonts - heading: ${fonts.heading}, body: ${fonts.body}, all: ${fonts.detected.join(', ')}`);

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
        fonts: {
          heading: fonts.heading,
          body: fonts.body,
          detected_fonts: fonts.detected,
        },
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
