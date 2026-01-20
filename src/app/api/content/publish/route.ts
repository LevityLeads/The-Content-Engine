import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    // Map platform to account ID environment variable
    const platformAccountIds: Record<string, string | undefined> = {
      instagram: process.env.LATE_INSTAGRAM_ACCOUNT_ID,
      twitter: process.env.LATE_TWITTER_ACCOUNT_ID,
      linkedin: process.env.LATE_LINKEDIN_ACCOUNT_ID,
    };

    const supabase = await createClient();
    const body = await request.json();
    const { contentId, scheduledFor } = body;

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

    // Check content status - only approved or scheduled content can be published
    if (!["approved", "scheduled"].includes(content.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Content must be approved before publishing. Current status: ${content.status}`,
        },
        { status: 400 }
      );
    }

    // Fetch associated images
    const { data: images, error: imagesError } = await supabase
      .from("images")
      .select("*")
      .eq("content_id", contentId)
      .order("created_at", { ascending: true });

    if (imagesError) {
      console.error("Error fetching images:", imagesError);
      // Continue without images - some posts may be text-only
    }

    // Filter out placeholder images (those without real URLs)
    const validImages = (images || []).filter(
      (img) => img.url && !img.url.startsWith("placeholder:")
    );

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

    // Build media array for Late.dev
    const mediaItems: LateMediaItem[] = validImages.map((img) => ({
      url: img.url,
      type: "image" as const,
      altText: img.prompt || undefined,
    }));

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

    // Get account ID for this platform
    const accountId = platformAccountIds[content.platform];
    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: `Late.dev account ID not configured for ${content.platform}. Please set LATE_${content.platform.toUpperCase()}_ACCOUNT_ID in your environment variables.`,
        },
        { status: 500 }
      );
    }

    // Build the Late.dev request with correct format
    const lateRequest: CreatePostRequest = {
      platforms: [
        {
          platform: content.platform as LatePlatform,
          accountId: accountId,
        },
      ],
      content: {
        text: caption.trim(),
      },
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

    // Determine the new status based on the response
    const newStatus = scheduledFor ? "scheduled" :
      (lateResponse.status === "published" ? "published" : "scheduled");

    // Update content with Late.dev post ID and status
    const { error: updateError } = await supabase
      .from("content")
      .update({
        late_post_id: lateResponse.id,
        status: newStatus,
        scheduled_for: scheduledFor || content.scheduled_for,
        published_at: lateResponse.status === "published" ? new Date().toISOString() : null,
        metadata: {
          ...((content.metadata as Record<string, unknown>) || {}),
          lateResponse: {
            platforms: lateResponse.platforms,
            createdAt: lateResponse.createdAt,
          },
        },
      })
      .eq("id", contentId);

    if (updateError) {
      console.error("Error updating content after publish:", updateError);
      // Don't fail the request - the post was published successfully
    }

    return NextResponse.json({
      success: true,
      latePostId: lateResponse.id,
      status: newStatus,
      platforms: lateResponse.platforms,
      scheduledFor: scheduledFor || null,
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
