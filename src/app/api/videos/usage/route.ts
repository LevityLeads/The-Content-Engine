import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatCost, formatUsagePercentage, getUsageStatusColor } from "@/lib/video-utils";
import { type BrandVideoConfig, DEFAULT_VIDEO_CONFIG } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Get brand and video config
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, video_config")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    const videoConfig = (brand.video_config as BrandVideoConfig) || DEFAULT_VIDEO_CONFIG;

    // Get monthly usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyUsageData } = await supabase
      .from("video_usage")
      .select("id, cost_usd, duration_seconds, model, has_audio, created_at")
      .eq("brand_id", brandId)
      .gte("created_at", startOfMonth.toISOString())
      .order("created_at", { ascending: false });

    const monthlyUsed = monthlyUsageData?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0;
    const monthlyVideoCount = monthlyUsageData?.length || 0;
    const monthlyDuration = monthlyUsageData?.reduce((sum, row) => sum + (row.duration_seconds || 0), 0) || 0;

    // Get daily count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyUsage = monthlyUsageData?.filter(
      (row) => new Date(row.created_at) >= startOfDay
    ) || [];
    const dailyCount = dailyUsage.length;
    const dailySpend = dailyUsage.reduce((sum, row) => sum + (row.cost_usd || 0), 0);

    // Calculate budget status
    const budgetRemaining = videoConfig.monthly_budget_usd !== null
      ? videoConfig.monthly_budget_usd - monthlyUsed
      : null;

    const usagePercentage = videoConfig.monthly_budget_usd !== null
      ? (monthlyUsed / videoConfig.monthly_budget_usd) * 100
      : 0;

    const statusColor = getUsageStatusColor(monthlyUsed, videoConfig.monthly_budget_usd);

    // Get recent videos (last 10)
    const { data: recentVideos } = await supabase
      .from("video_usage")
      .select(`
        id,
        cost_usd,
        duration_seconds,
        model,
        has_audio,
        created_at,
        content:content_id(id, platform, copy_primary)
      `)
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      enabled: videoConfig.enabled,
      usage: {
        monthly: {
          spent: monthlyUsed,
          spentFormatted: formatCost(monthlyUsed),
          budget: videoConfig.monthly_budget_usd,
          budgetFormatted: videoConfig.monthly_budget_usd !== null
            ? formatCost(videoConfig.monthly_budget_usd)
            : "Unlimited",
          remaining: budgetRemaining,
          remainingFormatted: budgetRemaining !== null
            ? formatCost(budgetRemaining)
            : "Unlimited",
          percentage: usagePercentage,
          percentageFormatted: formatUsagePercentage(monthlyUsed, videoConfig.monthly_budget_usd),
          videoCount: monthlyVideoCount,
          totalDuration: monthlyDuration,
          statusColor,
        },
        daily: {
          count: dailyCount,
          limit: videoConfig.daily_limit,
          remaining: videoConfig.daily_limit !== null
            ? Math.max(0, videoConfig.daily_limit - dailyCount)
            : null,
          spent: dailySpend,
          spentFormatted: formatCost(dailySpend),
        },
      },
      config: {
        enabled: videoConfig.enabled,
        monthlyBudget: videoConfig.monthly_budget_usd,
        dailyLimit: videoConfig.daily_limit,
        defaultModel: videoConfig.default_model,
        defaultDuration: videoConfig.default_duration,
        maxDuration: videoConfig.max_duration,
        includeAudio: videoConfig.include_audio,
      },
      recentVideos: recentVideos?.map((v) => ({
        id: v.id,
        cost: v.cost_usd,
        costFormatted: formatCost(v.cost_usd),
        duration: v.duration_seconds,
        model: v.model,
        hasAudio: v.has_audio,
        createdAt: v.created_at,
        content: v.content,
      })) || [],
    });
  } catch (error) {
    console.error("Error in GET /api/videos/usage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH to update video config
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { brandId, videoConfig } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Validate video config fields
    const validFields = [
      "enabled",
      "monthly_budget_usd",
      "default_model",
      "default_duration",
      "max_duration",
      "include_audio",
      "daily_limit",
    ];

    const updates: Partial<BrandVideoConfig> = {};
    for (const field of validFields) {
      if (field in videoConfig) {
        (updates as Record<string, unknown>)[field] = videoConfig[field];
      }
    }

    // Validate model if provided
    if (updates.default_model && !["veo-3.1-fast", "veo-3.0"].includes(updates.default_model)) {
      return NextResponse.json(
        { error: "Invalid video model" },
        { status: 400 }
      );
    }

    // Validate duration
    if (updates.default_duration !== undefined) {
      if (updates.default_duration < 3 || updates.default_duration > 8) {
        return NextResponse.json(
          { error: "Duration must be between 3 and 8 seconds" },
          { status: 400 }
        );
      }
    }

    if (updates.max_duration !== undefined) {
      if (updates.max_duration < 3 || updates.max_duration > 8) {
        return NextResponse.json(
          { error: "Max duration must be between 3 and 8 seconds" },
          { status: 400 }
        );
      }
    }

    // Get current config and merge
    const { data: brand } = await supabase
      .from("brands")
      .select("video_config")
      .eq("id", brandId)
      .single();

    const currentConfig = (brand?.video_config as BrandVideoConfig) || DEFAULT_VIDEO_CONFIG;
    const newConfig = { ...currentConfig, ...updates };

    // Update brand
    const { error: updateError } = await supabase
      .from("brands")
      .update({ video_config: newConfig })
      .eq("id", brandId);

    if (updateError) {
      console.error("Error updating video config:", updateError);
      return NextResponse.json(
        { error: "Failed to update video configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      videoConfig: newConfig,
    });
  } catch (error) {
    console.error("Error in PATCH /api/videos/usage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
