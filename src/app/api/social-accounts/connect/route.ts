import { NextRequest, NextResponse } from "next/server";
import { LateClient, LateApiException } from "@/lib/late";

/**
 * POST /api/social-accounts/connect
 *
 * Initiate OAuth flow by getting the authorization URL from Late.dev
 *
 * Request body:
 * - platform: string (required) - instagram, twitter, linkedin
 * - brandId: string (required) - Brand to connect the account to
 *
 * Response:
 * - success: boolean
 * - authUrl: string - URL to redirect user to for OAuth
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.LATE_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Late.dev API key not configured. Please set LATE_API_KEY in environment variables.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { platform, brandId } = body;

    if (!platform || !brandId) {
      return NextResponse.json(
        { success: false, error: "platform and brandId are required" },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ["instagram", "twitter", "linkedin", "facebook", "tiktok"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}` },
        { status: 400 }
      );
    }

    // Build callback URL
    // The callback will receive the Late.dev account info and save it to our database
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${appUrl}/api/social-accounts/callback?brandId=${encodeURIComponent(brandId)}&platform=${encodeURIComponent(platform)}`;

    // Get auth URL from Late.dev
    const lateClient = new LateClient();

    try {
      const { url: authUrl } = await lateClient.getAuthUrl(platform, callbackUrl);

      return NextResponse.json({
        success: true,
        authUrl,
      });
    } catch (error) {
      if (error instanceof LateApiException) {
        console.error("Late.dev auth URL error:", {
          code: error.code,
          message: error.message,
          details: error.details,
        });

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
  } catch (error) {
    console.error("Error in POST /api/social-accounts/connect:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
