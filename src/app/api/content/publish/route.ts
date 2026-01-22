import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  LateClient,
  LateApiException,
  CreatePostRequest,
  LateMediaItem,
  LatePlatform,
} from "@/lib/late";

/**
 * POST /api/content/publish
 *
 * Publish content to social media platforms via Late.dev
 *
 * Request body:
 * - contentId: string (required) - The content ID to publish
 * - scheduledFor?: string - ISO 8601 timestamp for scheduled publishing
 * - republish?: boolean - If true, allows republishing already published content
 *
 * Response:
 * - success: boolean
 * - latePostId: string - The Late.dev post ID
 * - status: string - The post status
 * - error?: string - Error message if failed
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key early
    if (!process.env.LATE_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Late.dev API key not configured. Please set LATE_API_KEY in your environment variables.",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const adminClient = createAdminClient(); // For storage operations (bypasses RLS)
    const body = await request.json();
    const { contentId, scheduledFor, republish, selectedImageIds } = body;

    // Validate required fields
    if (!contentId) {
      return NextResponse.json(
        { success: false, error: "contentId is required" },
        { status: 400 }
      );
    }

    // Fetch the content with associated data
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("*, ideas(*), brands(*)")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      console.error("Error fetching content:", contentError);
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    // Check content status - allow approved, scheduled, failed (for retry), or published (for republish)
    // "failed" status allows users to retry scheduling content that previously failed to publish
    const allowedStatuses = republish
      ? ["approved", "scheduled", "published", "failed"]
      : ["approved", "scheduled", "failed"];

    if (!allowedStatuses.includes(content.status)) {
      const errorMessage = republish
        ? `Content cannot be republished with current status: ${content.status}`
        : `Content must be approved before publishing. Current status: ${content.status}`;
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    // Log if this is a republish action
    if (republish && content.status === "published") {
      console.log(`Republishing content ${contentId} (previously published at ${content.published_at})`);
    }

    // Fetch associated images
    // If selectedImageIds provided (from UI), use those specific images
    // Otherwise fall back to composite images or all images
    let images: Array<{
      id: string;
      url: string;
      prompt?: string;
      model?: string;
      media_type?: string;
    }> | null = null;
    let imagesError: Error | null = null;

    if (selectedImageIds && Array.isArray(selectedImageIds) && selectedImageIds.length > 0) {
      // Use the specific images selected by the user in the UI
      console.log(`Using ${selectedImageIds.length} user-selected image(s):`, selectedImageIds);
      const { data: selectedImages, error: selectedError } = await supabase
        .from("images")
        .select("*")
        .in("id", selectedImageIds);

      if (selectedError) {
        imagesError = selectedError;
      } else if (selectedImages) {
        // Sort by the order in selectedImageIds to maintain slide order
        images = selectedImageIds
          .map(id => selectedImages.find(img => img.id === id))
          .filter((img): img is NonNullable<typeof img> => img !== undefined);
        console.log(`Found ${images.length} of ${selectedImageIds.length} selected images`);
      }
    } else {
      // Fallback: try composite images first, then all images
      console.log("No selectedImageIds provided, using fallback image selection");

      const { data: compositeImages, error: compositeError } = await supabase
        .from("images")
        .select("*")
        .eq("content_id", contentId)
        .eq("model", "composite")
        .order("created_at", { ascending: true });

      if (compositeError) {
        imagesError = compositeError;
      } else if (compositeImages && compositeImages.length > 0) {
        images = compositeImages;
        console.log(`Found ${images.length} composite carousel image(s)`);
      } else {
        // Fall back to all images (for single-image posts)
        const { data: allImages, error: allError } = await supabase
          .from("images")
          .select("*")
          .eq("content_id", contentId)
          .order("created_at", { ascending: true });

        if (allError) {
          imagesError = allError;
        } else {
          images = allImages;
          if (images && images.length > 0) {
            console.log(`No composite images found, using ${images.length} regular image(s)`);
          }
        }
      }
    }

    if (imagesError) {
      console.error("Error fetching images:", imagesError);
      // Continue without images - some posts may be text-only
    }

    // Filter out placeholder images (those without real URLs)
    let validImages = (images || []).filter(
      (img) => img.url && !img.url.startsWith("placeholder:")
    );

    // Sort carousel images by slide number (extracted from prompt like "[Slide 1]")
    validImages = validImages.sort((a, b) => {
      const aMatch = a.prompt?.match(/\[Slide (\d+)\]/);
      const bMatch = b.prompt?.match(/\[Slide (\d+)\]/);
      const aNum = aMatch ? parseInt(aMatch[1], 10) : 999;
      const bNum = bMatch ? parseInt(bMatch[1], 10) : 999;
      return aNum - bNum;
    });

    // Build the caption text
    let caption = content.copy_primary || "";

    // Add hashtags if present
    if (content.copy_hashtags && content.copy_hashtags.length > 0) {
      const hashtagString = content.copy_hashtags
        .map((tag: string) => (tag.startsWith("#") ? tag : `#${tag}`))
        .join(" ");
      caption = `${caption}\n\n${hashtagString}`;
    }

    // Add CTA if present
    if (content.copy_cta) {
      caption = `${caption}\n\n${content.copy_cta}`;
    }

    // Upload base64 images to Supabase Storage and get public URLs
    const uploadedUrls: string[] = [];
    const mediaItems: LateMediaItem[] = [];

    for (let i = 0; i < validImages.length; i++) {
      const img = validImages[i];
      let imageUrl = img.url;

      // Check if this is a base64 data URL that needs uploading
      if (img.url.startsWith("data:")) {
        try {
          // Extract base64 data and mime type
          const matches = img.url.match(/^data:([^;]+);base64,(.+)$/);
          if (!matches) {
            console.error("Invalid base64 data URL format");
            continue;
          }
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          // Determine file extension
          const ext = mimeType.includes("png") ? "png" : mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";

          // Generate unique filename
          const filename = `publish/${contentId}/${Date.now()}-${i}.${ext}`;

          // Upload to Supabase Storage (using admin client to bypass RLS)
          const { error: uploadError } = await adminClient.storage
            .from("images")
            .upload(filename, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (uploadError) {
            console.error("Error uploading image to storage:", uploadError);
            return NextResponse.json(
              {
                success: false,
                error: `Failed to upload image ${i + 1}: ${uploadError.message}`,
              },
              { status: 500 }
            );
          }

          // Get public URL
          const { data: publicUrlData } = adminClient.storage
            .from("images")
            .getPublicUrl(filename);

          imageUrl = publicUrlData.publicUrl;
          uploadedUrls.push(filename); // Track for cleanup later
          console.log(`Uploaded image ${i + 1} to storage: ${imageUrl}`);
        } catch (err) {
          console.error("Error processing base64 image:", err);
          return NextResponse.json(
            {
              success: false,
              error: `Failed to process image ${i + 1}`,
            },
            { status: 500 }
          );
        }
      }

      mediaItems.push({
        url: imageUrl,
        type: "image" as const,
        altText: img.prompt || undefined,
      });
    }

    // Only require images for Instagram feed/carousel posts
    if (content.platform === "instagram" && mediaItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Instagram posts require at least one image. Please generate images first.",
        },
        { status: 400 }
      );
    }

    // Get account ID for this platform from social_accounts table
    // Each client must have their own connected account - no fallback to shared accounts

    if (!content.brand_id) {
      console.error("Content has no brand_id - cannot determine which account to use");
      return NextResponse.json(
        {
          success: false,
          error: "This content is not associated with a client. Please regenerate the content with a client selected.",
        },
        { status: 400 }
      );
    }

    // First, let's see ALL accounts for this brand to help debug
    const { data: allBrandAccounts } = await supabase
      .from("social_accounts")
      .select("id, platform, platform_username, late_account_id, is_active")
      .eq("brand_id", content.brand_id);

    console.log(`All social accounts for brand ${content.brand_id}:`, JSON.stringify(allBrandAccounts, null, 2));

    const { data: socialAccount, error: socialError } = await supabase
      .from("social_accounts")
      .select("late_account_id, platform_username")
      .eq("brand_id", content.brand_id)
      .eq("platform", content.platform)
      .eq("is_active", true)
      .single();

    if (socialError || !socialAccount?.late_account_id) {
      // Get brand name for clearer error message
      const brandName = content.brands?.name || "Unknown";
      console.log(`No connected ${content.platform} account found for brand ${content.brand_id} (${brandName})`);
      console.log(`Query error:`, socialError);
      console.log(`Social account result:`, socialAccount);

      // Build detailed error message for debugging
      const platformAccounts = allBrandAccounts?.filter(a => a.platform === content.platform) || [];
      let debugMessage = `No ${content.platform} account connected for "${brandName}".`;

      if (platformAccounts.length === 0) {
        debugMessage += ` No ${content.platform} accounts found for this brand at all.`;
      } else if (platformAccounts.length > 1) {
        debugMessage += ` Found ${platformAccounts.length} duplicate ${content.platform} accounts - this may cause issues.`;
      } else {
        const acc = platformAccounts[0];
        if (!acc.is_active) {
          debugMessage += ` Account exists but is_active=false.`;
        } else if (!acc.late_account_id) {
          debugMessage += ` Account exists but late_account_id is missing - try clicking "Sync Accounts".`;
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: debugMessage + " Go to Settings → Connected Accounts to fix.",
          debug: {
            contentBrandId: content.brand_id,
            brandName,
            platform: content.platform,
            supabaseError: socialError?.message || null,
            supabaseCode: socialError?.code || null,
            allPlatformAccounts: platformAccounts,
          },
        },
        { status: 400 }
      );
    }

    const accountId = socialAccount.late_account_id;
    console.log(`Publishing to ${content.platform} account: ${socialAccount.platform_username || accountId} (brand: ${content.brand_id})`);

    // Build the Late.dev request with correct format
    const lateRequest: CreatePostRequest = {
      platforms: [
        {
          platform: content.platform as LatePlatform,
          accountId,
        },
      ],
      content: caption.trim(),
      mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
      externalId: contentId,
    };

    // Add scheduling if specified
    if (scheduledFor) {
      lateRequest.scheduledFor = scheduledFor;
    }

    // Initialize Late.dev client and publish
    let lateClient: LateClient;
    try {
      lateClient = new LateClient();
    } catch (error) {
      console.error("Late.dev client initialization error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Late.dev API key not configured. Please set LATE_API_KEY in environment variables.",
        },
        { status: 500 }
      );
    }

    // Call Late.dev API to create the post
    let lateResponse;
    try {
      console.log("Publishing to Late.dev:", JSON.stringify(lateRequest, null, 2));
      lateResponse = await lateClient.createPost(lateRequest);
      console.log("Late.dev response:", JSON.stringify(lateResponse, null, 2));
    } catch (error) {
      if (error instanceof LateApiException) {
        console.error("Late.dev API error:", {
          code: error.code,
          message: error.message,
          details: error.details,
          statusCode: error.statusCode,
        });

        // Update content status to failed
        await supabase
          .from("content")
          .update({
            status: "failed",
            metadata: {
              ...((content.metadata as Record<string, unknown>) || {}),
              lastPublishError: {
                code: error.code,
                message: error.message,
                timestamp: new Date().toISOString(),
              },
            },
          })
          .eq("id", contentId);

        return NextResponse.json(
          {
            success: false,
            error: `Late.dev error: ${error.message}`,
            code: error.code,
          },
          { status: error.statusCode >= 500 ? 502 : 400 }
        );
      }
      throw error;
    }

    // Determine the new status based on whether this was scheduled or immediate
    const newStatus = scheduledFor ? "scheduled" : "published";

    // Build metadata update - track republish history if this is a republish
    const existingMetadata = (content.metadata as Record<string, unknown>) || {};
    const republishHistory = (existingMetadata.republishHistory as Array<{ latePostId: string; publishedAt: string }>) || [];

    // If republishing, add the previous publish to history
    if (republish && content.late_post_id && content.published_at) {
      republishHistory.push({
        latePostId: content.late_post_id,
        publishedAt: content.published_at,
      });
    }

    const updatedMetadata = {
      ...existingMetadata,
      lateResponse: {
        platforms: lateResponse.platforms,
        createdAt: lateResponse.createdAt,
      },
      ...(republishHistory.length > 0 && { republishHistory }),
      ...(republish && { lastRepublishedAt: new Date().toISOString() }),
    };

    // Update content with Late.dev post ID and status
    const { error: updateError } = await supabase
      .from("content")
      .update({
        late_post_id: lateResponse.id,
        status: newStatus,
        scheduled_for: scheduledFor || content.scheduled_for,
        published_at: lateResponse.status === "published" ? new Date().toISOString() : null,
        metadata: updatedMetadata,
      })
      .eq("id", contentId);

    if (updateError) {
      console.error("Error updating content after publish:", updateError);
      // Don't fail the request - the post was published successfully
    }

    // Clean up uploaded images from storage after successful publish
    // Only clean up for immediate posts - scheduled posts need images until publish time
    if (uploadedUrls.length > 0 && !scheduledFor) {
      const { error: deleteError } = await adminClient.storage
        .from("images")
        .remove(uploadedUrls);

      if (deleteError) {
        console.error("Error cleaning up uploaded images:", deleteError);
        // Don't fail - publish was successful
      } else {
        console.log(`Cleaned up ${uploadedUrls.length} temporary images from storage`);
      }
    } else if (uploadedUrls.length > 0 && scheduledFor) {
      console.log(`Keeping ${uploadedUrls.length} images in storage for scheduled post`);
      // TODO: Set up a cleanup job to delete after scheduled publish time
    }

    return NextResponse.json({
      success: true,
      latePostId: lateResponse.id,
      status: newStatus,
      platforms: lateResponse.platforms,
      scheduledFor: scheduledFor || null,
      republished: !!republish,
    });
  } catch (error) {
    console.error("Error in POST /api/content/publish:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/publish
 *
 * Get the publish status of a content item from Late.dev
 *
 * Query params:
 * - contentId: string (required) - The content ID to check
 *
 * Response:
 * - success: boolean
 * - status: string - The current publish status
 * - platforms: array - Platform-specific status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: "contentId is required" },
        { status: 400 }
      );
    }

    // Fetch the content to get the Late.dev post ID
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("late_post_id, status")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    if (!content.late_post_id) {
      return NextResponse.json({
        success: true,
        status: content.status,
        published: false,
        message: "Content has not been published to Late.dev",
      });
    }

    // Get status from Late.dev
    let lateClient: LateClient;
    try {
      lateClient = new LateClient();
    } catch {
      return NextResponse.json(
        { success: false, error: "Late.dev API key not configured" },
        { status: 500 }
      );
    }

    try {
      const latePost = await lateClient.getPost(content.late_post_id);

      // Sync status back to our database if it changed
      if (latePost.status === "published" && content.status !== "published") {
        await supabase
          .from("content")
          .update({
            status: "published",
            published_at: latePost.publishedAt || new Date().toISOString(),
          })
          .eq("id", contentId);
      }

      return NextResponse.json({
        success: true,
        status: latePost.status,
        published: latePost.status === "published",
        platforms: latePost.platforms,
        scheduledFor: latePost.scheduledFor,
        publishedAt: latePost.publishedAt,
      });
    } catch (error) {
      if (error instanceof LateApiException) {
        return NextResponse.json(
          {
            success: false,
            error: `Late.dev error: ${error.message}`,
          },
          { status: error.statusCode >= 500 ? 502 : 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in GET /api/content/publish:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
