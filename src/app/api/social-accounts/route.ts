import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LateClient, LateApiException } from "@/lib/late";

/**
 * GET /api/social-accounts
 *
 * List connected social accounts for a brand.
 * Also syncs with Late.dev to get latest account info.
 *
 * Query params:
 * - brandId: string (required) - The brand to list accounts for
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: "brandId is required" },
        { status: 400 }
      );
    }

    // Get accounts from our database
    const { data: accounts, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching social accounts:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch accounts" },
        { status: 500 }
      );
    }

    // Optionally sync with Late.dev to get latest account info
    const lateAccounts: Record<string, { username: string; profileImageUrl?: string }> = {};

    if (process.env.LATE_API_KEY) {
      try {
        const lateClient = new LateClient();
        const { accounts: lateAccountList } = await lateClient.listAccounts();

        // Create a lookup by account ID
        lateAccountList.forEach((acc) => {
          lateAccounts[acc.id] = {
            username: acc.username,
            profileImageUrl: acc.profileImageUrl,
          };
        });
      } catch (err) {
        // Don't fail if Late.dev is unavailable - just use cached data
        console.warn("Could not sync with Late.dev:", err);
      }
    }

    // Enrich our accounts with Late.dev data
    const enrichedAccounts = accounts?.map((account) => {
      const lateData = account.late_account_id
        ? lateAccounts[account.late_account_id]
        : null;

      return {
        ...account,
        // Use Late.dev username if available, otherwise our cached version
        platform_username: lateData?.username || account.platform_username,
        profile_image_url: lateData?.profileImageUrl,
      };
    });

    return NextResponse.json({
      success: true,
      accounts: enrichedAccounts || [],
    });
  } catch (error) {
    console.error("Error in GET /api/social-accounts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social-accounts
 *
 * Save a connected social account after OAuth callback.
 *
 * Request body:
 * - brandId: string (required)
 * - platform: string (required) - instagram, twitter, linkedin
 * - lateAccountId: string (required) - Late.dev account ID
 * - platformUsername: string (optional) - Username on the platform
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { brandId, platform, lateAccountId, platformUsername } = body;

    if (!brandId || !platform || !lateAccountId) {
      return NextResponse.json(
        { success: false, error: "brandId, platform, and lateAccountId are required" },
        { status: 400 }
      );
    }

    // Check if this Late.dev account is already connected to this brand
    const { data: existing } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("brand_id", brandId)
      .eq("late_account_id", lateAccountId)
      .single();

    if (existing) {
      // Update existing record
      const { data: account, error } = await supabase
        .from("social_accounts")
        .update({
          platform_username: platformUsername,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating social account:", error);
        return NextResponse.json(
          { success: false, error: "Failed to update account" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        account,
        message: "Account reconnected",
      });
    }

    // Create new record
    // We use lateAccountId as platform_user_id since Late.dev manages the actual platform tokens
    // access_token_encrypted stores "managed_by_late" as a placeholder since Late.dev handles auth
    const { data: account, error } = await supabase
      .from("social_accounts")
      .insert({
        brand_id: brandId,
        platform,
        platform_user_id: lateAccountId,
        platform_username: platformUsername,
        access_token_encrypted: "managed_by_late", // Placeholder - Late.dev manages tokens
        late_account_id: lateAccountId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating social account:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      account,
      message: "Account connected successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/social-accounts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
