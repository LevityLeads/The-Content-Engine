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

// Extract fonts from CSS content
function extractFontsFromCSS(css: string, fonts: Set<string>): void {
  // Extract from @font-face declarations (most reliable)
  const fontFaceMatches = css.match(/@font-face\s*\{[^}]+\}/gi) || [];
  fontFaceMatches.forEach((block) => {
    const familyMatch = block.match(/font-family\s*:\s*["']?([^;"']+)/i);
    if (familyMatch) {
      const font = familyMatch[1].trim();
      const normalized = font.toLowerCase();
      if (!SYSTEM_FONTS.has(normalized)) {
        const properCase = font.split(' ').map(w =>
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ');
        fonts.add(properCase);
      }
    }
  });

  // Extract from font-family declarations
  const fontFamilyMatches = css.match(/font-family\s*:\s*([^;}{]+)/gi) || [];
  fontFamilyMatches.forEach((match) => {
    const value = match.replace(/font-family\s*:\s*/i, '').trim();
    const families = value.split(',').map(f =>
      f.trim().replace(/["']/g, '')
    );

    families.forEach(f => {
      const normalized = f.toLowerCase().trim();
      if (normalized && !SYSTEM_FONTS.has(normalized) && !normalized.startsWith('var(') && normalized.length > 1) {
        const properCase = f.split(' ').map(w =>
          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join(' ');
        fonts.add(properCase);
      }
    });
  });
}

// Extract external stylesheet URLs from HTML
function extractStylesheetUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];

  // Match <link rel="stylesheet" href="...">
  const linkMatches = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
  linkMatches.forEach((link) => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      let url = hrefMatch[1];
      // Make URL absolute
      if (url.startsWith('//')) {
        url = `https:${url}`;
      } else if (url.startsWith('/')) {
        url = `${new URL(baseUrl).origin}${url}`;
      } else if (!url.startsWith('http')) {
        url = `${baseUrl}/${url}`;
      }
      // Skip Google Fonts (handled separately) and other external CDNs
      if (!url.includes('fonts.googleapis.com') && !url.includes('cdnjs.') && !url.includes('unpkg.com')) {
        urls.push(url);
      }
    }
  });

  return urls.slice(0, 5); // Limit to 5 stylesheets
}

// Extract font name from file path (e.g., "/fonts/Montserrat-Bold.woff2" -> "Montserrat")
function extractFontNameFromPath(path: string): string | null {
  // Get filename without extension
  const filename = path.split('/').pop()?.split('.')[0] || '';
  // Remove common suffixes like -Bold, -Regular, -Italic, etc.
  const cleaned = filename.replace(/[-_](Bold|Regular|Italic|Light|Medium|SemiBold|ExtraBold|Thin|Black|Variable|VF|wght).*$/i, '');
  // Convert camelCase or PascalCase to spaces if needed
  const withSpaces = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');
  return withSpaces.length > 2 ? withSpaces : null;
}

// Extract fonts from CSS/HTML (async to fetch external stylesheets)
async function extractFonts(html: string, baseUrl: string): Promise<{ heading: string; body: string; detected: string[] }> {
  const fonts = new Set<string>();

  // 1. Extract from Google Fonts links - handle full URLs with multiple family params
  // Match the entire Google Fonts URL to capture all family parameters
  const googleFontsUrls = html.match(/https?:\/\/fonts\.googleapis\.com\/css2?\?[^"'\s>]+/gi) || [];
  googleFontsUrls.forEach((url) => {
    try {
      const urlObj = new URL(url);
      // Get all 'family' parameters
      const families = urlObj.searchParams.getAll('family');
      families.forEach(family => {
        // Handle format: "Poppins:wght@400;700" or "Poppins"
        const fontName = family.split(':')[0].replace(/\+/g, ' ').trim();
        if (fontName && fontName.length > 1) {
          fonts.add(fontName);
        }
      });
    } catch {
      // Fallback to regex parsing if URL parsing fails
      const familyMatches = url.match(/family=([^&"']+)/gi) || [];
      familyMatches.forEach(match => {
        const family = match.replace(/^family=/i, '');
        const fontName = decodeURIComponent(family).split(':')[0].replace(/\+/g, ' ').trim();
        if (fontName && fontName.length > 1) {
          fonts.add(fontName);
        }
      });
    }
  });

  // 2. Extract from font preload links (very reliable - these are intentional font choices)
  const preloadMatches = html.match(/<link[^>]*rel=["']preload["'][^>]*as=["']font["'][^>]*>/gi) || [];
  preloadMatches.forEach((link) => {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      const fontName = extractFontNameFromPath(hrefMatch[1]);
      if (fontName && !SYSTEM_FONTS.has(fontName.toLowerCase())) {
        fonts.add(fontName);
      }
    }
  });

  // 3. Extract from @font-face src URLs in inline styles
  const fontFaceSrcMatches = html.match(/src\s*:\s*url\(['"]?([^'")]+\.(?:woff2?|ttf|otf|eot))['"]?\)/gi) || [];
  fontFaceSrcMatches.forEach((match) => {
    const urlMatch = match.match(/url\(['"]?([^'")]+)['"]?\)/i);
    if (urlMatch) {
      const fontName = extractFontNameFromPath(urlMatch[1]);
      if (fontName && !SYSTEM_FONTS.has(fontName.toLowerCase())) {
        fonts.add(fontName);
      }
    }
  });

  // 4. Extract from Adobe Fonts/Typekit
  const adobeFontsMatch = html.match(/use\.typekit\.net\/([a-z0-9]+)\.css/i);
  if (adobeFontsMatch) {
    try {
      const adobeUrl = `https://use.typekit.net/${adobeFontsMatch[1]}.css`;
      const response = await fetch(adobeUrl, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const css = await response.text();
        extractFontsFromCSS(css, fonts);
      }
    } catch {
      // Ignore fetch errors for Adobe Fonts
    }
  }

  // 5. Extract from inline CSS in HTML
  extractFontsFromCSS(html, fonts);

  // 6. Extract from CSS variables (--font-heading, --font-body, --font-sans, etc.)
  const fontVarMatches = html.match(/--font[-\w]*:\s*["']?([^;}{}"']+)/gi) || [];
  fontVarMatches.forEach((match) => {
    const value = match.split(':')[1]?.trim().replace(/["']/g, '');
    if (value) {
      const families = value.split(',').map(f => f.trim());
      families.forEach(f => {
        const normalized = f.toLowerCase().trim();
        if (normalized && !SYSTEM_FONTS.has(normalized) && !normalized.startsWith('var(') && f.length > 1) {
          const properCase = f.split(' ').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          ).join(' ');
          fonts.add(properCase);
        }
      });
    }
  });

  // 7. Extract from Next.js/Vercel font class patterns (e.g., className="__className_abc123")
  // These often have associated CSS with font-family declarations
  const nextFontMatches = html.match(/font-family:\s*["']?(__[a-zA-Z0-9_]+)[,\s]/gi) || [];
  nextFontMatches.forEach((match) => {
    // Next.js fonts usually have a readable name in a nearby CSS variable or comment
    // For now, log these for debugging
    console.log('Found Next.js font pattern:', match);
  });

  // 8. Fetch and parse external stylesheets (limited to avoid slowdowns)
  const stylesheetUrls = extractStylesheetUrls(html, baseUrl);
  const cssPromises = stylesheetUrls.map(async (url) => {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(3000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (response.ok) {
        const css = await response.text();
        extractFontsFromCSS(css, fonts);

        // Also extract from @font-face src in external CSS
        const srcMatches = css.match(/src\s*:\s*url\(['"]?([^'")]+\.(?:woff2?|ttf|otf|eot))['"]?\)/gi) || [];
        srcMatches.forEach((match) => {
          const urlMatch = match.match(/url\(['"]?([^'")]+)['"]?\)/i);
          if (urlMatch) {
            const fontName = extractFontNameFromPath(urlMatch[1]);
            if (fontName && !SYSTEM_FONTS.has(fontName.toLowerCase())) {
              fonts.add(fontName);
            }
          }
        });
      }
    } catch {
      // Ignore individual stylesheet fetch errors
    }
  });

  await Promise.allSettled(cssPromises);

  console.log('All detected fonts before filtering:', Array.from(fonts));

  const detectedFonts = Array.from(fonts).filter(f => !f.startsWith('[') && f.length > 1).slice(0, 10);

  // Try to identify heading vs body font
  let headingFont = '';
  let bodyFont = '';

  // Check for heading-specific declarations in inline CSS
  const headingMatch = html.match(/(?:h1|h2|h3|\.heading|\.title)[^{]*\{[^}]*font-family\s*:\s*["']?([^;,"']+)/i);
  if (headingMatch) {
    const font = headingMatch[1].trim();
    if (!SYSTEM_FONTS.has(font.toLowerCase()) && font.length > 1) {
      headingFont = font.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // Check for body-specific declarations
  const bodyMatch = html.match(/(?:body|\.body|p\s*\{)[^{]*font-family\s*:\s*["']?([^;,"']+)/i);
  if (bodyMatch) {
    const font = bodyMatch[1].trim();
    if (!SYSTEM_FONTS.has(font.toLowerCase()) && font.length > 1) {
      bodyFont = font.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // Fallback: use first detected fonts if specific matches weren't found
  if (!headingFont && detectedFonts.length > 0) {
    headingFont = detectedFonts[0];
  }
  if (!bodyFont && detectedFonts.length > 1) {
    bodyFont = detectedFonts[1];
  } else if (!bodyFont && detectedFonts.length > 0) {
    bodyFont = detectedFonts[0];
  }

  // Only default to Inter if absolutely nothing was found
  // Otherwise leave empty to indicate "not detected"
  const finalHeading = headingFont || (detectedFonts.length === 0 ? '' : detectedFonts[0]);
  const finalBody = bodyFont || (detectedFonts.length === 0 ? '' : (detectedFonts[1] || detectedFonts[0]));

  return {
    heading: finalHeading,
    body: finalBody,
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
    const fonts = await extractFonts(html, normalizedUrl);
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
