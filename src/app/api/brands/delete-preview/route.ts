import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET preview of what will be deleted
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Get the brand info
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // Get counts for all related data
    const [
      { count: contentCount },
      { count: ideasCount },
      { count: inputsCount },
      { count: imagesCount },
      { count: socialAccountsCount },
    ] = await Promise.all([
      supabase.from("content").select("*", { count: "exact", head: true }).eq("brand_id", id),
      supabase.from("ideas").select("*", { count: "exact", head: true }).eq("brand_id", id),
      supabase.from("inputs").select("*", { count: "exact", head: true }).eq("brand_id", id),
      supabase.from("images").select("*", { count: "exact", head: true }).eq("brand_id", id),
      supabase.from("social_accounts").select("*", { count: "exact", head: true }).eq("brand_id", id),
    ]);

    return NextResponse.json({
      success: true,
      brand: {
        id: brand.id,
        name: brand.name,
      },
      counts: {
        content: contentCount || 0,
        ideas: ideasCount || 0,
        inputs: inputsCount || 0,
        images: imagesCount || 0,
        socialAccounts: socialAccountsCount || 0,
      },
      totalItems: (contentCount || 0) + (ideasCount || 0) + (inputsCount || 0) + (imagesCount || 0),
    });
  } catch (error) {
    console.error("Error in GET /api/brands/delete-preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
