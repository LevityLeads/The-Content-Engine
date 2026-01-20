import { NextResponse } from "next/server";
import { LateClient, LateApiException } from "@/lib/late";

/**
 * GET /api/social-accounts/available
 *
 * Fetch all accounts from Late.dev API.
 * This returns all accounts connected in Late.dev, regardless of which brands they're linked to.
 * Used by the account picker UI to let users choose which account to link to a brand.
 *
 * Query params:
 * - platform?: string - Filter by platform (instagram, twitter, linkedin)
 *
 * Response:
 * - success: boolean
 * - accounts: array of Late.dev accounts
 */
export async function GET(request: Request) {
  try {
    if (!process.env.LATE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Late.dev API key not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");

    // Fetch accounts from Late.dev
    const lateClient = new LateClient();
    let lateAccounts;

    try {
      const response = await lateClient.listAccounts();
      console.log("Late.dev listAccounts response:", JSON.stringify(response, null, 2));

      // Handle different response formats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawResponse = response as any;
      if (Array.isArray(rawResponse)) {
        lateAccounts = rawResponse;
      } else if (rawResponse.accounts) {
        lateAccounts = rawResponse.accounts;
      } else if (rawResponse.data) {
        lateAccounts = rawResponse.data;
      } else {
        console.log("Unexpected response structure, keys:", Object.keys(rawResponse));
        lateAccounts = [];
      }
    } catch (error) {
      if (error instanceof LateApiException) {
        console.error("Late.dev API error:", {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        });
        return NextResponse.json(
          { success: false, error: `Late.dev error: ${error.message}` },
          { status: error.statusCode >= 500 ? 502 : 400 }
        );
      }
      throw error;
    }

    // Filter by platform if specified
    if (platform) {
      lateAccounts = lateAccounts.filter(
        (acc: { platform?: string }) => acc.platform?.toLowerCase() === platform.toLowerCase()
      );
    }

    // Map to a consistent format
    const accounts = lateAccounts.map((acc: {
      id: string;
      platform: string;
      username?: string;
      name?: string;
      handle?: string;
      screenName?: string;
      profileImageUrl?: string;
      profile_image_url?: string;
      avatar?: string;
      isActive?: boolean;
      is_active?: boolean;
    }) => {
      // Try multiple possible field names for username
      const username = acc.username || acc.name || acc.handle || acc.screenName || acc.id;
      // Try multiple possible field names for profile image
      const profileImageUrl = acc.profileImageUrl || acc.profile_image_url || acc.avatar;

      console.log("Mapping account:", { original: acc, mapped: { id: acc.id, platform: acc.platform, username, profileImageUrl } });

      return {
        id: acc.id,
        platform: acc.platform,
        username,
        profileImageUrl,
        isActive: acc.isActive !== false && acc.is_active !== false,
      };
    });

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("Error in GET /api/social-accounts/available:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
