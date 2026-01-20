import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const brandId = searchParams.get("brandId");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("content")
      .select("*, ideas(*), brands(*)")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by brand if provided
    if (brandId) {
      query = query.eq("brand_id", brandId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data: content, error } = await query;

    if (error) {
      console.error("Error fetching content:", error);
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("Error in GET /api/content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    const { data: content, error } = await supabase
      .from("content")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating content:", error);
      return NextResponse.json(
        { error: "Failed to update content" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("Error in PATCH /api/content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // First delete associated images
    const { error: imagesError } = await supabase
      .from("images")
      .delete()
      .eq("content_id", id);

    if (imagesError) {
      console.error("Error deleting images:", imagesError);
      // Continue with content deletion even if images fail
    }

    // Delete the content and return the deleted row to verify it actually happened
    const { data: deleted, error } = await supabase
      .from("content")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error deleting content:", error);
      // Check if it's a "no rows returned" error (PGRST116) which means RLS blocked it or row doesn't exist
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Content not found or you don't have permission to delete it" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to delete content" },
        { status: 500 }
      );
    }

    if (!deleted) {
      return NextResponse.json(
        { error: "Content not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: { id: deleted.id },
    });
  } catch (error) {
    console.error("Error in DELETE /api/content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
