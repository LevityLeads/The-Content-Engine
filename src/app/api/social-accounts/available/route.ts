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

    // Log raw account structure to help debug field names
    if (lateAccounts.length > 0) {
      console.log("Sample Late.dev account structure:", JSON.stringify(lateAccounts[0], null, 2));
      console.log("Available fields:", Object.keys(lateAccounts[0]));
    }

    // Map to a consistent format - handle various field names Late.dev might use
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = lateAccounts.map((acc: any) => {
      // Try various possible ID field names
      const accountId = acc.id || acc.accountId || acc.account_id || acc._id || acc.ID;

      if (!accountId) {
        console.warn("Account missing ID field:", acc);
      }

      return {
        id: accountId,
        platform: acc.platform,
        username: acc.username || acc.name || acc.handle || accountId,
        profileImageUrl: acc.profileImageUrl || acc.profile_image_url || acc.avatar,
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
