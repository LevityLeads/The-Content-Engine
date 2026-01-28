import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const VALID_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload brand logo to Supabase Storage
 * POST /api/brands/upload-logo
 *
 * Request body:
 * - brandId: string - The brand ID to associate the logo with
 * - imageData: string - Base64 encoded image data (with or without data URI prefix)
 * - mimeType: string - The MIME type of the image
 *
 * Returns:
 * - success: boolean
 * - url: string - The public URL of the uploaded logo
 */
export async function POST(request: NextRequest) {
  try {
    const { brandId, imageData, mimeType } = await request.json();

    // Validate required fields
    if (!brandId) {
      return NextResponse.json(
        { success: false, error: "Brand ID is required" },
        { status: 400 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: "Image data is required" },
        { status: 400 }
      );
    }

    // Validate MIME type
    const normalizedMimeType = mimeType?.toLowerCase() || "image/png";
    if (!VALID_MIME_TYPES.includes(normalizedMimeType)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed: ${VALID_MIME_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Extract base64 data (remove data URI prefix if present)
    let base64Data = imageData;
    if (imageData.includes("base64,")) {
      base64Data = imageData.split("base64,")[1];
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Determine file extension
    const extensions: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/svg+xml": "svg",
      "image/webp": "webp",
    };
    const extension = extensions[normalizedMimeType] || "png";

    // Create admin client for storage operations
    const supabase = createAdminClient();

    // Generate filename
    const timestamp = Date.now();
    const filename = `logos/${brandId}/logo-${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(filename, buffer, {
        contentType: normalizedMimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Upload Logo] Storage upload error:", uploadError);

      // If bucket doesn't exist, provide helpful error
      if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
        return NextResponse.json(
          {
            success: false,
            error: "Storage bucket 'brand-assets' not found. Please create it in Supabase dashboard."
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Failed to upload logo: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    console.log(`[Upload Logo] Successfully uploaded logo for brand ${brandId}: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error("[Upload Logo] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
