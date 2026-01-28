import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET all brands (for the current organization)
export async function GET() {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { success: false, error: "Database configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // For now, get all brands (we'll add organization filtering later with auth)
    // Add 10 second timeout to prevent infinite hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const { data: brands, error } = await supabase
        .from("brands")
        .select("*")
        .order("created_at", { ascending: true })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        console.error("Error fetching brands:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch brands" },
          { status: 500 }
        );
      }

      // Debug logging for brand style persistence
      if (brands && brands.length > 0) {
        for (const brand of brands) {
          const vc = brand.visual_config as Record<string, unknown> | null;
          if (vc?.brandStyle) {
            const brandStyle = vc.brandStyle as Record<string, unknown>;
            console.log(`[Brands API] GET brand "${brand.name}" has brandStyle:`, {
              id: brandStyle.id,
              masterPromptLength: (brandStyle.masterPrompt as string)?.length,
              testImagesCount: (brandStyle.testImages as unknown[])?.length,
            });
          }
        }
      }

      return NextResponse.json(
        {
          success: true,
          brands: brands || [],
        },
        {
          headers: {
            'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
          },
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("Brands fetch timed out");
        return NextResponse.json(
          { success: false, error: "Request timed out" },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in GET /api/brands:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
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

    // Debug logging for visual_config saves
    if (updates.visual_config) {
      const vc = updates.visual_config;
      console.log("[Brands API] PATCH visual_config received:", {
        hasBrandStyle: !!vc.brandStyle,
        brandStyleId: vc.brandStyle?.id,
        masterPromptLength: vc.brandStyle?.masterPrompt?.length,
        testImagesCount: vc.brandStyle?.testImages?.length,
        examplePostsV2Count: vc.examplePostsV2?.length,
        useBrandStylePriority: vc.useBrandStylePriority,
      });
    }

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

    // Debug logging for what was saved
    if (updates.visual_config && brand?.visual_config) {
      const vc = brand.visual_config as Record<string, unknown>;
      const brandStyle = vc.brandStyle as Record<string, unknown> | undefined;
      console.log("[Brands API] PATCH visual_config saved:", {
        hasBrandStyle: !!brandStyle,
        brandStyleId: brandStyle?.id,
        masterPromptLength: (brandStyle?.masterPrompt as string)?.length,
      });
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

// DELETE a brand with cascade deletion
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const confirm = searchParams.get("confirm");

    if (!id) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Require explicit confirmation to delete
    if (confirm !== "delete") {
      return NextResponse.json(
        { error: "Deletion requires confirmation. Pass confirm=delete to proceed." },
        { status: 400 }
      );
    }

    // Get counts for response
    const [
      { count: contentCount },
      { count: ideasCount },
      { count: inputsCount },
      { count: imagesCount },
    ] = await Promise.all([
      supabase.from("content").select("*", { count: "exact", head: true }).eq("brand_id", id),
      supabase.from("ideas").select("*", { count: "exact", head: true }).eq("brand_id", id),
      supabase.from("inputs").select("*", { count: "exact", head: true }).eq("brand_id", id),
      supabase.from("images").select("*", { count: "exact", head: true }).eq("brand_id", id),
    ]);

    // Delete all related data in order (respecting foreign key constraints)
    // 1. Delete images (linked to content)
    const { error: imagesError } = await supabase
      .from("images")
      .delete()
      .eq("brand_id", id);

    if (imagesError) {
      console.error("Error deleting images:", imagesError);
    }

    // 2. Delete content
    const { error: contentError } = await supabase
      .from("content")
      .delete()
      .eq("brand_id", id);

    if (contentError) {
      console.error("Error deleting content:", contentError);
    }

    // 3. Delete ideas
    const { error: ideasError } = await supabase
      .from("ideas")
      .delete()
      .eq("brand_id", id);

    if (ideasError) {
      console.error("Error deleting ideas:", ideasError);
    }

    // 4. Delete inputs
    const { error: inputsError } = await supabase
      .from("inputs")
      .delete()
      .eq("brand_id", id);

    if (inputsError) {
      console.error("Error deleting inputs:", inputsError);
    }

    // 5. Delete social accounts
    const { error: socialError } = await supabase
      .from("social_accounts")
      .delete()
      .eq("brand_id", id);

    if (socialError) {
      console.error("Error deleting social accounts:", socialError);
    }

    // 6. Finally, delete the brand itself
    const { error: brandError } = await supabase
      .from("brands")
      .delete()
      .eq("id", id);

    if (brandError) {
      console.error("Error deleting brand:", brandError);
      return NextResponse.json(
        { error: "Failed to delete brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: {
        content: contentCount || 0,
        ideas: ideasCount || 0,
        inputs: inputsCount || 0,
        images: imagesCount || 0,
      },
    });
  } catch (error) {
    console.error("Error in DELETE /api/brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
