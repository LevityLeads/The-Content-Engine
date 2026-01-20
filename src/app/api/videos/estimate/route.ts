import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VIDEO_MODELS, DEFAULT_VIDEO_MODEL, type VideoModelKey } from "@/lib/video-models";
import { estimateVideoCost, checkBudgetLimits } from "@/lib/video-utils";
import { type BrandVideoConfig, DEFAULT_VIDEO_CONFIG } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      brandId,
      model = DEFAULT_VIDEO_MODEL,
      duration = 5,
      includeAudio = false,
    } = body;

    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Validate model
    const modelKey: VideoModelKey = model in VIDEO_MODELS ? model : DEFAULT_VIDEO_MODEL;

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

    // Check if video is enabled for this brand
    if (!videoConfig.enabled) {
      return NextResponse.json({
        success: true,
        enabled: false,
        canGenerate: false,
        warning: "Video generation is not enabled for this brand. Enable it in Settings.",
        estimate: null,
        limits: null,
      });
    }

    // Get monthly usage (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyUsage } = await supabase
      .from("video_usage")
      .select("cost_usd")
      .eq("brand_id", brandId)
      .gte("created_at", startOfMonth.toISOString());

    const monthlyUsed = monthlyUsage?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0;

    // Get daily count (today)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: dailyCount } = await supabase
      .from("video_usage")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId)
      .gte("created_at", startOfDay.toISOString());

    // Calculate estimate
    const estimate = estimateVideoCost(modelKey, duration, includeAudio);

    // Check budget limits
    const budgetCheck = checkBudgetLimits(
      videoConfig,
      monthlyUsed,
      dailyCount || 0,
      estimate.totalCost
    );

    return NextResponse.json({
      success: true,
      enabled: videoConfig.enabled,
      canGenerate: budgetCheck.canGenerate,
      warning: budgetCheck.warning,
      estimate: {
        model: estimate.model,
        modelName: estimate.modelName,
        duration: estimate.duration,
        includeAudio: estimate.includeAudio,
        videoCost: estimate.videoCost,
        audioCost: estimate.audioCost,
        totalCost: estimate.totalCost,
        formatted: estimate.formatted,
      },
      limits: {
        monthlyBudget: budgetCheck.monthlyBudget,
        monthlyUsed: budgetCheck.monthlyUsed,
        budgetRemaining: budgetCheck.budgetRemaining,
        dailyLimit: budgetCheck.dailyLimit,
        dailyUsed: budgetCheck.dailyUsed,
        withinBudget: budgetCheck.withinBudget,
        withinDailyLimit: budgetCheck.withinDailyLimit,
      },
      config: {
        defaultModel: videoConfig.default_model,
        defaultDuration: videoConfig.default_duration,
        maxDuration: videoConfig.max_duration,
        includeAudioDefault: videoConfig.include_audio,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/videos/estimate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
