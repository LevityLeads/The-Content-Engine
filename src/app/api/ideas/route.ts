import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const brandId = searchParams.get("brandId");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("ideas")
      .select("*, inputs(*), brands(*)")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by brand if provided
    if (brandId) {
      query = query.eq("brand_id", brandId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: ideas, error } = await query;

    if (error) {
      console.error("Error fetching ideas:", error);
      return NextResponse.json(
        { error: "Failed to fetch ideas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ideas,
    });
  } catch (error) {
    console.error("Error in GET /api/ideas:", error);
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
    const { id, status, feedback } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "approved", "rejected", "generating"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updateData: { status: string; feedback_notes?: string } = { status };
    if (feedback) {
      updateData.feedback_notes = feedback;
    }

    const { data: idea, error } = await supabase
      .from("ideas")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating idea:", error);
      return NextResponse.json(
        { error: "Failed to update idea" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      idea,
    });
  } catch (error) {
    console.error("Error in PATCH /api/ideas:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
