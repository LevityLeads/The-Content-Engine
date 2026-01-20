import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET all brands (for the current organization)
export async function GET() {
  try {
    const supabase = await createClient();

    // For now, get all brands (we'll add organization filtering later with auth)
    const { data: brands, error } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching brands:", error);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      brands: brands || [],
    });
  } catch (error) {
    console.error("Error in GET /api/brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create a new brand
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, description, voice_config, visual_config, organization_id } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 }
      );
    }

    // Get or create a default organization if none provided
    let orgId = organization_id;
    if (!orgId) {
      // Check for existing organization or create default
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id")
        .limit(1)
        .single();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        // Create a default organization
        const { data: newOrg, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: "Default Organization",
            slug: "default",
          })
          .select()
          .single();

        if (orgError) {
          console.error("Error creating organization:", orgError);
          return NextResponse.json(
            { error: "Failed to create organization" },
            { status: 500 }
          );
        }
        orgId = newOrg.id;
      }
    }

    const { data: brand, error } = await supabase
      .from("brands")
      .insert({
        organization_id: orgId,
        name,
        description: description || null,
        voice_config: voice_config || {},
        visual_config: visual_config || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating brand:", error);
      return NextResponse.json(
        { error: "Failed to create brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Error in POST /api/brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH update a brand
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Don't allow updating organization_id
    delete updates.organization_id;

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data: brand, error } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating brand:", error);
      return NextResponse.json(
        { error: "Failed to update brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Error in PATCH /api/brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a brand
export async function DELETE(request: NextRequest) {
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

    // Check if brand has associated content
    const { count } = await supabase
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: "Cannot delete brand with existing content. Delete content first." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting brand:", error);
      return NextResponse.json(
        { error: "Failed to delete brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error in DELETE /api/brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
