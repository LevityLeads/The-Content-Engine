import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LateClient, LateApiException, LateAccount } from "@/lib/late";

/**
 * POST /api/social-accounts/sync
 *
 * Sync connected accounts from Late.dev to our database.
 * This ONLY updates accounts that already belong to this brand - it does NOT
 * create new account associations. New accounts should only be connected via
 * the OAuth callback flow which properly associates them with the correct brand.
 *
 * IMPORTANT: Late.dev returns ALL accounts for the API key, not filtered by brand.
 * We must only sync accounts that were originally connected to THIS brand to prevent
 * cross-client data corruption.
 *
 * Request body:
 * - brandId: string (required) - The brand to sync accounts for
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.LATE_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Late.dev API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { brandId } = body;

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: "brandId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch accounts from Late.dev
    const lateClient = new LateClient();
    let lateAccounts;

    try {
      const response = await lateClient.listAccounts();
      console.log("Late.dev listAccounts raw response:", JSON.stringify(response, null, 2));

      // Handle different response formats - Late.dev might return accounts directly or nested
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawResponse = response as any;
      if (Array.isArray(rawResponse)) {
        lateAccounts = rawResponse;
      } else if (rawResponse.accounts) {
        lateAccounts = rawResponse.accounts;
      } else if (rawResponse.data) {
        lateAccounts = rawResponse.data;
      } else {
        // If response has id/platform fields, it might be a single account or different structure
        console.log("Unexpected response structure, keys:", Object.keys(rawResponse));
        lateAccounts = [];
      }

      console.log(`Fetched ${lateAccounts.length} accounts from Late.dev:`,
        lateAccounts.map((a: { platform?: string; username?: string; id?: string }) =>
          `${a.platform}: ${a.username || a.id}`
        )
      );
    } catch (error) {
      if (error instanceof LateApiException) {
        console.error("Late.dev API error:", {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
        });
        return NextResponse.json(
          { success: false, error: `Late.dev error: ${error.message}` },
          { status: error.statusCode >= 500 ? 502 : 400 }
        );
      }
      console.error("Unexpected error fetching from Late.dev:", error);
      throw error;
    }

    // Get existing accounts for this brand ONLY
    // We will only update these - never insert accounts from Late.dev's global list
    const { data: existingAccounts } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("brand_id", brandId);

    if (!existingAccounts || existingAccounts.length === 0) {
      // No accounts connected to this brand yet
      return NextResponse.json({
        success: true,
        accounts: [],
        updatedAccounts: 0,
        totalFromLate: lateAccounts.length,
        message: "No accounts connected to this brand. Use the Connect button to add accounts.",
      });
    }

    // Create a map of Late.dev accounts for quick lookup
    const lateAccountMap = new Map<string, LateAccount>(lateAccounts.map((a) => [a.id, a]));

    // Update ONLY accounts that belong to this brand
    const allAccounts = [];
    let updatedAccounts = 0;

    for (const existingAccount of existingAccounts) {
      const lateAccount = lateAccountMap.get(existingAccount.late_account_id);

      if (lateAccount) {
        // Update with fresh data from Late.dev
        const { data: updated } = await supabase
          .from("social_accounts")
          .update({
            platform_username: lateAccount.username,
            is_active: lateAccount.isActive !== false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAccount.id) // Use specific ID, not brand_id + late_account_id
          .select()
          .single();

        if (updated) {
          updatedAccounts++;
          allAccounts.push({
            ...updated,
            profile_image_url: lateAccount.profileImageUrl,
          });
        }
      } else {
        // Account exists in our DB but not in Late.dev anymore
        // Keep it but mark as potentially disconnected
        console.log(`Account ${existingAccount.late_account_id} not found in Late.dev`);
        allAccounts.push(existingAccount);
      }
    }

    return NextResponse.json({
      success: true,
      accounts: allAccounts,
      updatedAccounts,
      totalFromLate: lateAccounts.length,
    });
  } catch (error) {
    console.error("Error in POST /api/social-accounts/sync:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
