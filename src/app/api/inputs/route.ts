import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { type, content, brandId } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: "Type and content are required" },
        { status: 400 }
      );
    }

    // Get the default brand if not provided
    let actualBrandId = brandId;
    if (!actualBrandId) {
      const { data: brands } = await supabase
        .from("brands")
        .select("id")
        .limit(1)
        .single();

      actualBrandId = brands?.id;
    }

    if (!actualBrandId) {
      return NextResponse.json(
        { error: "No brand found. Please run the database migration." },
        { status: 400 }
      );
    }

    // Create the input
    const { data: input, error } = await supabase
      .from("inputs")
      .insert({
        brand_id: actualBrandId,
        type,
        raw_content: content,
        status: "pending",
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating input:", error);
      return NextResponse.json(
        { error: "Failed to create input" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      input,
    });
  } catch (error) {
    console.error("Error in POST /api/inputs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("inputs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: inputs, error } = await query;

    if (error) {
      console.error("Error fetching inputs:", error);
      return NextResponse.json(
        { error: "Failed to fetch inputs" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inputs,
    });
  } catch (error) {
    console.error("Error in GET /api/inputs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
