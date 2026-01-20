import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LateClient, LateApiException } from "@/lib/late";

/**
 * POST /api/social-accounts/sync
 *
 * Sync connected accounts from Late.dev to our database.
 * This fetches all accounts from Late.dev and saves new ones to our social_accounts table.
 *
 * Request body:
 * - brandId: string (required) - The brand to associate accounts with
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

    // Get existing accounts for this brand
    const { data: existingAccounts } = await supabase
      .from("social_accounts")
      .select("late_account_id")
      .eq("brand_id", brandId);

    const existingIds = new Set(existingAccounts?.map((a) => a.late_account_id) || []);

    // Insert new accounts
    let newAccounts = 0;
    const allAccounts = [];

    for (const lateAccount of lateAccounts) {
      if (!existingIds.has(lateAccount.id)) {
        // Insert new account
        const { data: inserted, error: insertError } = await supabase
          .from("social_accounts")
          .insert({
            brand_id: brandId,
            platform: lateAccount.platform,
            platform_user_id: lateAccount.id,
            platform_username: lateAccount.username,
            access_token_encrypted: "managed_by_late",
            late_account_id: lateAccount.id,
            is_active: lateAccount.isActive,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting account:", insertError);
        } else {
          newAccounts++;
          allAccounts.push({
            ...inserted,
            profile_image_url: lateAccount.profileImageUrl,
          });
        }
      } else {
        // Update existing account with latest info
        const { data: updated } = await supabase
          .from("social_accounts")
          .update({
            platform_username: lateAccount.username,
            is_active: lateAccount.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("brand_id", brandId)
          .eq("late_account_id", lateAccount.id)
          .select()
          .single();

        if (updated) {
          allAccounts.push({
            ...updated,
            profile_image_url: lateAccount.profileImageUrl,
          });
        }
      }
    }

    // Also fetch any accounts we have that aren't in Late.dev anymore
    const { data: ourAccounts } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("brand_id", brandId)
      .eq("is_active", true);

    // Add any accounts we already had that weren't updated
    const syncedIds = new Set(allAccounts.map((a) => a.id));
    for (const acc of ourAccounts || []) {
      if (!syncedIds.has(acc.id)) {
        allAccounts.push(acc);
      }
    }

    return NextResponse.json({
      success: true,
      accounts: allAccounts,
      newAccounts,
      totalFromLate: lateAccounts.length,
      debug: {
        lateAccountsFound: lateAccounts.map((a: { platform?: string; username?: string; id?: string }) => ({
          platform: a.platform,
          username: a.username,
          id: a.id,
        })),
        brandId,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/social-accounts/sync:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
