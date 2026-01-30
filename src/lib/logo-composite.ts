/**
 * Logo Compositing Utility
 *
 * Handles overlaying brand logos onto generated images.
 * Uses Sharp for high-performance image processing.
 */

import sharp from "sharp";

export interface LogoCompositeOptions {
  /** URL or base64 of the generated image */
  imageSource: string;
  /** URL of the brand logo */
  logoUrl: string;
  /** Position of logo: 'bottom-right' (default), 'bottom-left', 'top-right', 'top-left' */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Logo size as percentage of image width (default: 12%) */
  logoSizePercent?: number;
  /** Padding from edges in pixels (default: 20) */
  padding?: number;
  /** Logo opacity 0-1 (default: 0.9) */
  opacity?: number;
}

export interface LogoCompositeResult {
  success: boolean;
  /** Base64 encoded result image */
  imageBase64?: string;
  /** MIME type of result */
  mimeType?: string;
  error?: string;
}

/**
 * Fetches an image from a URL and returns it as a Buffer.
 * Handles both URLs and base64 data URIs.
 */
async function fetchImageBuffer(source: string): Promise<Buffer> {
  // Handle base64 data URI
  if (source.startsWith("data:")) {
    const base64Data = source.split(",")[1];
    return Buffer.from(base64Data, "base64");
  }

  // Handle URL
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Composites a brand logo onto a generated image.
 *
 * @param options - Configuration for the composite operation
 * @returns Result containing the composited image as base64
 */
export async function compositeLogoOnImage(
  options: LogoCompositeOptions
): Promise<LogoCompositeResult> {
  const {
    imageSource,
    logoUrl,
    position = "bottom-right",
    logoSizePercent = 12,
    padding = 20,
    opacity = 0.9,
  } = options;

  try {
    // Fetch both images
    const [imageBuffer, logoBuffer] = await Promise.all([
      fetchImageBuffer(imageSource),
      fetchImageBuffer(logoUrl),
    ]);

    // Get image dimensions
    const image = sharp(imageBuffer);
    const imageMetadata = await image.metadata();

    if (!imageMetadata.width || !imageMetadata.height) {
      throw new Error("Could not determine image dimensions");
    }

    // Calculate logo size (percentage of image width)
    const targetLogoWidth = Math.round((imageMetadata.width * logoSizePercent) / 100);

    // Resize logo while maintaining aspect ratio
    // Also ensure logo has transparency preserved
    const resizedLogo = await sharp(logoBuffer)
      .resize(targetLogoWidth, undefined, {
        fit: "inside",
        withoutEnlargement: false,
      })
      // Apply opacity by manipulating alpha channel
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Apply opacity to the logo
    const { data: logoData, info: logoInfo } = resizedLogo;
    const opacityBuffer = Buffer.alloc(logoData.length);
    for (let i = 0; i < logoData.length; i += 4) {
      opacityBuffer[i] = logoData[i]; // R
      opacityBuffer[i + 1] = logoData[i + 1]; // G
      opacityBuffer[i + 2] = logoData[i + 2]; // B
      opacityBuffer[i + 3] = Math.round(logoData[i + 3] * opacity); // A
    }

    // Convert back to PNG buffer
    const opacifiedLogo = await sharp(opacityBuffer, {
      raw: {
        width: logoInfo.width,
        height: logoInfo.height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    // Get resized logo dimensions
    const logoMeta = await sharp(opacifiedLogo).metadata();
    const logoWidth = logoMeta.width || targetLogoWidth;
    const logoHeight = logoMeta.height || targetLogoWidth;

    // Calculate position
    let left: number;
    let top: number;

    switch (position) {
      case "top-left":
        left = padding;
        top = padding;
        break;
      case "top-right":
        left = imageMetadata.width - logoWidth - padding;
        top = padding;
        break;
      case "bottom-left":
        left = padding;
        top = imageMetadata.height - logoHeight - padding;
        break;
      case "bottom-right":
      default:
        left = imageMetadata.width - logoWidth - padding;
        top = imageMetadata.height - logoHeight - padding;
        break;
    }

    // Ensure position is not negative
    left = Math.max(0, left);
    top = Math.max(0, top);

    // Composite logo onto image
    const result = await image
      .composite([
        {
          input: opacifiedLogo,
          left: Math.round(left),
          top: Math.round(top),
        },
      ])
      .png()
      .toBuffer();

    // Convert to base64
    const base64 = result.toString("base64");

    return {
      success: true,
      imageBase64: `data:image/png;base64,${base64}`,
      mimeType: "image/png",
    };
  } catch (error) {
    console.error("[logo-composite] Error compositing logo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during logo compositing",
    };
  }
}

/**
 * Batch composite logos onto multiple images.
 *
 * @param images - Array of image sources (URLs or base64)
 * @param logoUrl - URL of the brand logo
 * @param options - Optional configuration overrides
 * @returns Array of results for each image
 */
export async function compositeLogoOnImages(
  images: string[],
  logoUrl: string,
  options?: Partial<Omit<LogoCompositeOptions, "imageSource" | "logoUrl">>
): Promise<LogoCompositeResult[]> {
  const results = await Promise.all(
    images.map((imageSource) =>
      compositeLogoOnImage({
        imageSource,
        logoUrl,
        ...options,
      })
    )
  );

  return results;
}
