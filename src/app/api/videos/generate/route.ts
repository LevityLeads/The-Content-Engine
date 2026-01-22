import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { VIDEO_MODELS, DEFAULT_VIDEO_MODEL, type VideoModelKey, getAspectRatioForPlatform } from "@/lib/video-models";
import { estimateVideoCost, checkBudgetLimits, calculateActualCost } from "@/lib/video-utils";
import { type BrandVideoConfig, DEFAULT_VIDEO_CONFIG } from "@/types/database";

// Helper to update job status
async function updateJobStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  updates: {
    status?: string;
    progress?: number;
    completedItems?: number;
    currentStep?: string;
    errorMessage?: string;
    errorCode?: string;
    errorDetails?: Record<string, unknown>;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.progress !== undefined) updateData.progress = updates.progress;
  if (updates.completedItems !== undefined) updateData.completed_items = updates.completedItems;
  if (updates.currentStep !== undefined) updateData.current_step = updates.currentStep;
  if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
  if (updates.errorCode !== undefined) updateData.error_code = updates.errorCode;
  if (updates.errorDetails !== undefined) updateData.error_details = updates.errorDetails;

  await supabase.from("generation_jobs").update(updateData).eq("id", jobId);
}

// Poll for video generation completion
async function pollVideoGeneration(
  operationName: string,
  apiKey: string,
  maxAttempts: number = 60,
  pollInterval: number = 5000
): Promise<{ success: boolean; videoData?: string; isUrl?: boolean; error?: string }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
        {
          method: "GET",
          headers: {
            "x-goog-api-key": apiKey,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Poll error:", errorText);
        continue;
      }

      const data = await response.json();

      if (data.done) {
        if (data.error) {
          return { success: false, error: data.error.message || "Video generation failed" };
        }

        // Log the response structure for debugging
        console.log("Video API response structure:", JSON.stringify(data.response, null, 2).substring(0, 1000));

        // Path 1: Gemini API format - generateVideoResponse.generatedSamples[].video.uri
        const generatedSample = data.response?.generateVideoResponse?.generatedSamples?.[0];
        const videoUri = generatedSample?.video?.uri;
        if (videoUri) {
          console.log("Found video URI:", videoUri);
          return { success: true, videoData: videoUri, isUrl: true };
        }

        // Path 2: Alternative format - generatedVideos[].video.uri
        const altVideoUri = data.response?.generatedVideos?.[0]?.video?.uri;
        if (altVideoUri) {
          console.log("Found alt video URI:", altVideoUri);
          return { success: true, videoData: altVideoUri, isUrl: true };
        }

        // Path 3: Base64 format - generatedVideos[].video.videoBytes
        const videoBytes = data.response?.generatedVideos?.[0]?.video?.videoBytes;
        if (videoBytes) {
          console.log("Found video bytes");
          return { success: true, videoData: videoBytes };
        }

        // Path 4: Direct video object
        const directVideo = data.response?.generatedVideos?.[0]?.video;
        if (typeof directVideo === 'string') {
          console.log("Found direct video string");
          return { success: true, videoData: directVideo };
        }

        // Unknown structure - log for debugging
        const responseKeys = data.response ? Object.keys(data.response).join(', ') : 'none';
        console.error("Unknown response structure. Keys:", responseKeys);
        console.error("Full response:", JSON.stringify(data, null, 2).substring(0, 2000));
        return { success: false, error: `No video in response. Response keys: [${responseKeys}]` };
      }

      // Not done yet, wait and try again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (err) {
      console.error("Poll error:", err);
      // Continue polling on error
    }
  }

  return { success: false, error: "Video generation timed out" };
}

// Download video from URL and convert to base64
async function downloadVideoAsBase64(url: string, apiKey: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "x-goog-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return base64;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  let jobId: string | null = null;

  try {
    const body = await request.json();
    const {
      contentId,
      prompt,
      model: requestedModel,
      duration: requestedDuration,
      includeAudio = false,
      slideNumber,
    } = body;

    if (!contentId || !prompt) {
      return NextResponse.json(
        { error: "Content ID and prompt are required" },
        { status: 400 }
      );
    }

    // Fetch content with brand info
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("id, platform, brand_id, brands(id, name, video_config)")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Handle Supabase join which returns array or single object
    const brandsResult = content.brands;
    const brandData = Array.isArray(brandsResult) ? brandsResult[0] : brandsResult;
    const videoConfig = (brandData?.video_config as BrandVideoConfig) || DEFAULT_VIDEO_CONFIG;

    // Validate video is enabled
    if (!videoConfig.enabled) {
      return NextResponse.json(
        { error: "Video generation is not enabled for this brand" },
        { status: 403 }
      );
    }

    // Determine model and duration
    const modelKey: VideoModelKey = (requestedModel && requestedModel in VIDEO_MODELS)
      ? requestedModel as VideoModelKey
      : videoConfig.default_model || DEFAULT_VIDEO_MODEL;
    const modelConfig = VIDEO_MODELS[modelKey];

    const duration = Math.min(
      Math.max(requestedDuration || videoConfig.default_duration, 3),
      videoConfig.max_duration
    );

    // Get usage stats for budget check
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyUsage } = await supabase
      .from("video_usage")
      .select("cost_usd")
      .eq("brand_id", content.brand_id)
      .gte("created_at", startOfMonth.toISOString());

    const monthlyUsed = monthlyUsage?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: dailyCount } = await supabase
      .from("video_usage")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", content.brand_id)
      .gte("created_at", startOfDay.toISOString());

    // Estimate cost and check budget
    const estimate = estimateVideoCost(modelKey, duration, includeAudio);
    const budgetCheck = checkBudgetLimits(videoConfig, monthlyUsed, dailyCount || 0, estimate.totalCost);

    if (!budgetCheck.canGenerate) {
      return NextResponse.json(
        { error: budgetCheck.warning || "Cannot generate video due to budget limits" },
        { status: 403 }
      );
    }

    // Create generation job
    const { data: job, error: jobError } = await supabase
      .from("generation_jobs")
      .insert({
        content_id: contentId,
        type: "video",
        status: "generating",
        progress: 0,
        total_items: 1,
        completed_items: 0,
        current_step: "Initializing video generation",
        metadata: {
          model: modelKey,
          duration,
          includeAudio,
          estimatedCost: estimate.totalCost,
          prompt: prompt.substring(0, 200),
        },
      })
      .select()
      .single();

    if (!jobError && job) {
      jobId = job.id;
    }

    // Get API key
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      if (jobId) {
        await updateJobStatus(supabase, jobId, {
          status: "failed",
          errorMessage: "No API key configured",
          errorCode: "NO_API_KEY",
        });
      }
      return NextResponse.json(
        { error: "Video generation API not configured" },
        { status: 500 }
      );
    }

    // Update job progress
    if (jobId) {
      await updateJobStatus(supabase, jobId, { progress: 10, currentStep: "Calling Veo API" });
    }

    // Build video prompt with platform-specific guidance
    const platform = (content.platform || "").toLowerCase();
    const aspectRatio = getAspectRatioForPlatform(platform);

    const fullPrompt = `${prompt}

VIDEO REQUIREMENTS:
- Duration: ${duration} seconds of continuous motion
- Aspect ratio: ${aspectRatio}
- Style: Professional, cinematic quality
- Motion: Smooth, natural movement
- Quality: 4K quality aesthetic

CRITICAL RULES:
- Create a single continuous scene (no cuts or transitions)
- Focus on one primary subject or action
- Ensure motion is visible throughout the video
- Do NOT include text overlays or UI elements
- Do NOT include social media interfaces`;

    try {
      // Call Veo API using predictLongRunning endpoint (correct method for video generation)
      // Note: Gemini API requires API key in header, not query parameter
      const generateResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:predictLongRunning`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": googleApiKey,
          },
          body: JSON.stringify({
            instances: [{ prompt: fullPrompt }],
            parameters: {
              aspectRatio,
              sampleCount: 1,
            },
          }),
        }
      );

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error("Veo API error:", errorText);

        if (jobId) {
          await updateJobStatus(supabase, jobId, {
            status: "failed",
            errorMessage: `Veo API error: ${generateResponse.status}`,
            errorCode: String(generateResponse.status),
            errorDetails: { body: errorText.substring(0, 500) },
          });
        }

        return NextResponse.json(
          { error: `Video generation failed: ${generateResponse.status}`, jobId },
          { status: 500 }
        );
      }

      const generateData = await generateResponse.json();
      const operationName = generateData.name;

      if (!operationName) {
        if (jobId) {
          await updateJobStatus(supabase, jobId, {
            status: "failed",
            errorMessage: "No operation returned from API",
            errorCode: "NO_OPERATION",
          });
        }
        return NextResponse.json(
          { error: "Video generation failed to start", jobId },
          { status: 500 }
        );
      }

      // Update job progress
      if (jobId) {
        await updateJobStatus(supabase, jobId, {
          progress: 20,
          currentStep: "Video generating (this may take 1-2 minutes)",
        });
      }

      // Poll for completion
      const pollResult = await pollVideoGeneration(operationName, googleApiKey);

      if (!pollResult.success || !pollResult.videoData) {
        if (jobId) {
          await updateJobStatus(supabase, jobId, {
            status: "failed",
            errorMessage: pollResult.error || "Video generation failed",
            errorCode: "GENERATION_FAILED",
          });
        }
        return NextResponse.json(
          { error: pollResult.error || "Video generation failed", jobId },
          { status: 500 }
        );
      }

      // Update job progress
      if (jobId) {
        await updateJobStatus(supabase, jobId, { progress: 80, currentStep: "Downloading video" });
      }

      // If the result is a URL, download the video and convert to base64
      let videoBase64: string;
      if (pollResult.isUrl) {
        try {
          console.log("Downloading video from URL:", pollResult.videoData);
          videoBase64 = await downloadVideoAsBase64(pollResult.videoData, googleApiKey);
          console.log("Video downloaded, size:", videoBase64.length, "chars");
        } catch (downloadError) {
          console.error("Failed to download video:", downloadError);
          if (jobId) {
            await updateJobStatus(supabase, jobId, {
              status: "failed",
              errorMessage: `Failed to download video: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`,
              errorCode: "DOWNLOAD_FAILED",
            });
          }
          return NextResponse.json(
            { error: "Failed to download generated video", jobId },
            { status: 500 }
          );
        }
      } else {
        videoBase64 = pollResult.videoData;
      }

      // Update job progress
      if (jobId) {
        await updateJobStatus(supabase, jobId, { progress: 90, currentStep: "Uploading video to storage" });
      }

      // Calculate actual cost
      const actualCost = calculateActualCost(modelKey, duration, includeAudio);

      // Upload video to Supabase Storage instead of storing base64 directly
      // This avoids database size limits for large video files
      const adminClient = createAdminClient();
      const videoBuffer = Buffer.from(videoBase64, "base64");
      const filename = `videos/${contentId}/${Date.now()}.mp4`;

      const { error: uploadError } = await adminClient.storage
        .from("images")
        .upload(filename, videoBuffer, {
          contentType: "video/mp4",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading video to storage:", uploadError);
        if (jobId) {
          await updateJobStatus(supabase, jobId, {
            status: "failed",
            errorMessage: `Failed to upload video: ${uploadError.message}`,
            errorCode: "STORAGE_ERROR",
          });
        }
        return NextResponse.json(
          { error: `Failed to upload video: ${uploadError.message}`, jobId },
          { status: 500 }
        );
      }

      // Get public URL for the uploaded video
      const { data: publicUrlData } = adminClient.storage
        .from("images")
        .getPublicUrl(filename);

      const videoUrl = publicUrlData.publicUrl;
      console.log("Video uploaded to storage:", videoUrl);

      // Save video to images table (with media_type = 'video')
      const { data: savedMedia, error: saveError } = await supabase
        .from("images")
        .insert({
          content_id: contentId,
          prompt,
          url: videoUrl,
          storage_path: filename,
          media_type: "video",
          duration_seconds: duration,
          has_audio: includeAudio,
          generation_model: modelKey,
          generation_cost: actualCost,
          slide_number: slideNumber || null,
          is_primary: !slideNumber,
          format: "mp4",
          file_size_bytes: videoBuffer.length,
          dimensions: {
            aspectRatio,
            model: modelKey,
          },
        })
        .select()
        .single();

      if (saveError) {
        console.error("Error saving video:", saveError);
        if (jobId) {
          await updateJobStatus(supabase, jobId, {
            status: "failed",
            errorMessage: "Failed to save video",
            errorCode: "DB_ERROR",
          });
        }
        return NextResponse.json(
          { error: "Failed to save video", jobId },
          { status: 500 }
        );
      }

      // Record usage
      await supabase.from("video_usage").insert({
        brand_id: content.brand_id,
        content_id: contentId,
        image_id: savedMedia.id,
        model: modelKey,
        duration_seconds: duration,
        has_audio: includeAudio,
        cost_usd: actualCost,
      });

      // Update job to completed
      if (jobId) {
        await updateJobStatus(supabase, jobId, {
          status: "completed",
          progress: 100,
          completedItems: 1,
          currentStep: undefined,
        });
      }

      return NextResponse.json({
        success: true,
        video: savedMedia,
        media: savedMedia, // Alias for backward compatibility
        generated: true,
        jobId,
        cost: {
          estimated: estimate.totalCost,
          actual: actualCost,
          formatted: `$${actualCost.toFixed(2)}`,
        },
        model: {
          key: modelKey,
          name: modelConfig.name,
        },
      });
    } catch (apiError) {
      console.error("Veo API error:", apiError);

      if (jobId) {
        await updateJobStatus(supabase, jobId, {
          status: "failed",
          errorMessage: "Video generation API error",
          errorCode: "API_ERROR",
          errorDetails: { error: apiError instanceof Error ? apiError.message : String(apiError) },
        });
      }

      return NextResponse.json(
        { error: "Video generation failed", jobId },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/videos/generate:", error);

    if (jobId) {
      await updateJobStatus(supabase, jobId, {
        status: "failed",
        errorMessage: "Internal server error",
        errorCode: "INTERNAL_ERROR",
      });
    }

    return NextResponse.json(
      { error: "Internal server error", jobId },
      { status: 500 }
    );
  }
}
