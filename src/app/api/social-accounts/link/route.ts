import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/social-accounts/link
 *
 * Link a specific Late.dev account to a brand.
 * This creates or updates the social_accounts record for the brand+platform combination.
 *
 * Request body:
 * - brandId: string (required) - The brand to link the account to
 * - lateAccountId: string (required) - The Late.dev account ID
 * - platform: string (required) - The platform (instagram, twitter, linkedin)
 * - username: string (required) - The account username
 * - profileImageUrl?: string - Profile image URL
 *
 * Response:
 * - success: boolean
 * - account: the created/updated social account record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, lateAccountId, platform, username, profileImageUrl } = body;

    // Validate required fields
    if (!brandId || !lateAccountId || !platform || !username) {
      return NextResponse.json(
        { success: false, error: "brandId, lateAccountId, platform, and username are required" },
        { status: 400 }
      );
    }

    // Normalize platform to lowercase for consistent querying
    const normalizedPlatform = platform.toLowerCase();

    const supabase = await createClient();

    // Check if there's already an account for this brand+platform
    const { data: existing } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("brand_id", brandId)
      .eq("platform", normalizedPlatform)
      .single();

    let result;

    if (existing) {
      // Update the existing record with the new Late.dev account
      const { data: updated, error: updateError } = await supabase
        .from("social_accounts")
        .update({
          late_account_id: lateAccountId,
          platform_username: username,
          platform_user_id: `${lateAccountId}_${brandId}`,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating social account:", updateError);
        return NextResponse.json(
          { success: false, error: `Failed to update account: ${updateError.message}` },
          { status: 500 }
        );
      }

      result = updated;
      console.log(`Updated ${normalizedPlatform} account for brand ${brandId}: @${username}`);
    } else {
      // Create a new record
      const { data: inserted, error: insertError } = await supabase
        .from("social_accounts")
        .insert({
          brand_id: brandId,
          platform: normalizedPlatform,
          platform_user_id: `${lateAccountId}_${brandId}`,
          platform_username: username,
          access_token_encrypted: "managed_by_late",
          late_account_id: lateAccountId,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting social account:", insertError);
        return NextResponse.json(
          { success: false, error: `Failed to link account: ${insertError.message}` },
          { status: 500 }
        );
      }

      result = inserted;
      console.log(`Linked ${normalizedPlatform} account @${username} to brand ${brandId}`);
    }

    return NextResponse.json({
      success: true,
      account: {
        ...result,
        profile_image_url: profileImageUrl,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/social-accounts/link:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
