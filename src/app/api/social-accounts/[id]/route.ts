import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LateClient, LateApiException } from "@/lib/late";

/**
 * DELETE /api/social-accounts/[id]
 *
 * Disconnect a social account.
 * Optionally also disconnects from Late.dev.
 *
 * Path params:
 * - id: string - Our social_accounts table ID
 *
 * Query params:
 * - disconnectLate: boolean (optional) - Also disconnect from Late.dev (default: false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const disconnectLate = searchParams.get("disconnectLate") === "true";

    const supabase = await createClient();

    // Get the account first
    const { data: account, error: fetchError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !account) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    // Optionally disconnect from Late.dev
    if (disconnectLate && account.late_account_id && process.env.LATE_API_KEY) {
      try {
        const lateClient = new LateClient();
        await lateClient.disconnectAccount(account.late_account_id);
      } catch (error) {
        if (error instanceof LateApiException) {
          console.warn("Could not disconnect from Late.dev:", error.message);
          // Don't fail - still remove from our database
        } else {
          throw error;
        }
      }
    }

    // Soft delete - mark as inactive rather than deleting
    // This preserves history and allows reconnection
    const { error: updateError } = await supabase
      .from("social_accounts")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error disconnecting account:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to disconnect account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account disconnected",
    });
  } catch (error) {
    console.error("Error in DELETE /api/social-accounts/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social-accounts/[id]
 *
 * Get details for a specific social account.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: account, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !account) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      account,
    });
  } catch (error) {
    console.error("Error in GET /api/social-accounts/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
