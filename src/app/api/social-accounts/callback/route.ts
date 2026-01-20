import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LateClient } from "@/lib/late";

/**
 * GET /api/social-accounts/callback
 *
 * OAuth callback handler - Late.dev redirects here after successful authentication.
 * This saves the connected account to our database and redirects to settings.
 *
 * Query params (from our original request):
 * - brandId: string - Brand to connect the account to
 * - platform: string - Platform being connected
 *
 * Query params (from Late.dev):
 * - accountId: string - Late.dev account ID for the connected account
 * - username: string (optional) - Username on the platform
 * - error: string (optional) - Error message if auth failed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const platform = searchParams.get("platform");
    const lateAccountId = searchParams.get("accountId");
    const username = searchParams.get("username");
    const error = searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const settingsUrl = `${appUrl}/settings`;

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error from Late.dev:", error);
      const redirectUrl = new URL(settingsUrl);
      redirectUrl.searchParams.set("error", `OAuth failed: ${error}`);
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Validate required params
    if (!brandId || !platform || !lateAccountId) {
      console.error("Missing required callback params:", { brandId, platform, lateAccountId });
      const redirectUrl = new URL(settingsUrl);
      redirectUrl.searchParams.set("error", "Invalid callback - missing parameters");
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Get account details from Late.dev if we don't have username
    let accountUsername = username;
    if (!accountUsername && process.env.LATE_API_KEY) {
      try {
        const lateClient = new LateClient();
        const { accounts } = await lateClient.listAccounts();
        const account = accounts.find((a) => a.id === lateAccountId);
        if (account) {
          accountUsername = account.username;
        }
      } catch (err) {
        console.warn("Could not fetch account details from Late.dev:", err);
      }
    }

    // Save to database
    const supabase = await createClient();

    // Check if already connected
    const { data: existing } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("brand_id", brandId)
      .eq("late_account_id", lateAccountId)
      .single();

    if (existing) {
      // Reactivate existing connection
      await supabase
        .from("social_accounts")
        .update({
          platform_username: accountUsername,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new connection
      const { error: insertError } = await supabase.from("social_accounts").insert({
        brand_id: brandId,
        platform,
        platform_user_id: lateAccountId,
        platform_username: accountUsername,
        access_token_encrypted: "managed_by_late",
        late_account_id: lateAccountId,
        is_active: true,
      });

      if (insertError) {
        console.error("Error saving social account:", insertError);
        const redirectUrl = new URL(settingsUrl);
        redirectUrl.searchParams.set("error", "Failed to save connected account");
        return NextResponse.redirect(redirectUrl.toString());
      }
    }

    // Redirect back to settings with success message
    const redirectUrl = new URL(settingsUrl);
    redirectUrl.searchParams.set(
      "success",
      `${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected successfully`
    );

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Error in GET /api/social-accounts/callback:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = new URL(`${appUrl}/settings`);
    redirectUrl.searchParams.set("error", "An unexpected error occurred");
    return NextResponse.redirect(redirectUrl.toString());
  }
}
