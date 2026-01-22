import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { IMAGE_MODELS, DEFAULT_MODEL, type ImageModelKey } from "@/lib/image-models";
import { VIDEO_MODELS, DEFAULT_VIDEO_MODEL } from "@/lib/video-models";
import { BrandVideoConfig, DEFAULT_VIDEO_CONFIG } from "@/types/database";

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

  await supabase.from('generation_jobs').update(updateData).eq('id', jobId);
}

// Platform-specific image dimensions (for internal use only - NOT sent to image generator)
const PLATFORM_IMAGE_CONFIG: Record<string, {
  aspectRatio: string;
  width: number;
  height: number;
}> = {
  instagram: {
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
  },
  twitter: {
    aspectRatio: "16:9",
    width: 1600,
    height: 900,
  },
  linkedin: {
    aspectRatio: "16:9",
    width: 1200,
    height: 675,
  },
};

// Default config for unknown platforms
const DEFAULT_CONFIG = {
  aspectRatio: "1:1",
  width: 1080,
  height: 1080,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  let jobId: string | null = null;

  try {
    const body = await request.json();
    const { contentId, prompt, model: requestedModel } = body;

    if (!contentId || !prompt) {
      return NextResponse.json(
        { error: "Content ID and prompt are required" },
        { status: 400 }
      );
    }

    // Determine which model to use
    const modelKey: ImageModelKey = (requestedModel && requestedModel in IMAGE_MODELS)
      ? requestedModel as ImageModelKey
      : DEFAULT_MODEL;
    const modelConfig = IMAGE_MODELS[modelKey];

    // Fetch the content to verify it exists and get platform, metadata, and brand info
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("id, platform, metadata, brand_id, brands(video_config)")
      .eq("id", contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Check if this content should generate video instead of image
    const metadata = content.metadata as { visualStyle?: string; imagePrompt?: string } | null;
    if (metadata?.visualStyle === "video") {
      // Handle Supabase join which returns array or single object
      const brandsResult = content.brands;
      const brandData = Array.isArray(brandsResult) ? brandsResult[0] : brandsResult;
      const videoConfig = (brandData?.video_config as BrandVideoConfig) || DEFAULT_VIDEO_CONFIG;

      if (!videoConfig.enabled) {
        return NextResponse.json(
          { error: "Video generation is not enabled for this brand. Enable it in Settings." },
          { status: 400 }
        );
      }

      // Generate video instead of image - call video generation API
      const videoModel = videoConfig.default_model || DEFAULT_VIDEO_MODEL;
      const duration = videoConfig.default_duration || 5;
      const includeAudio = videoConfig.include_audio || false;

      // Create a video generation job
      const { data: job, error: jobError } = await supabase
        .from('generation_jobs')
        .insert({
          content_id: contentId,
          type: 'video',
          status: 'generating',
          progress: 0,
          total_items: 1,
          completed_items: 0,
          current_step: 'Generating video',
          metadata: { model: videoModel, prompt: prompt.substring(0, 200), duration },
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating video job:', jobError);
      }
      const videoJobId = job?.id;

      try {
        // Call internal video generation endpoint
        const videoResponse = await fetch(new URL('/api/videos/generate', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId,
            prompt,
            model: videoModel,
            duration,
            includeAudio,
            slideNumber: 1, // Primary media
          }),
        });

        const videoResult = await videoResponse.json();

        if (!videoResponse.ok) {
          if (videoJobId) {
            await updateJobStatus(supabase, videoJobId, {
              status: 'failed',
              progress: 100,
              errorMessage: videoResult.error || 'Video generation failed',
              errorCode: 'VIDEO_ERROR',
            });
          }
          return NextResponse.json(
            { error: videoResult.error || 'Video generation failed', jobId: videoJobId },
            { status: videoResponse.status }
          );
        }

        if (videoJobId) {
          await updateJobStatus(supabase, videoJobId, {
            status: 'completed',
            progress: 100,
            completedItems: 1,
          });
        }

        return NextResponse.json({
          success: true,
          image: videoResult.video,
          generated: true,
          status: 'generated',
          message: `Video generated with ${VIDEO_MODELS[videoModel]?.name || videoModel}`,
          mediaType: 'video',
          model: {
            key: videoModel,
            name: VIDEO_MODELS[videoModel]?.name || videoModel,
          },
          jobId: videoJobId,
        });
      } catch (videoError) {
        console.error('Video generation error:', videoError);
        if (videoJobId) {
          await updateJobStatus(supabase, videoJobId, {
            status: 'failed',
            progress: 100,
            errorMessage: 'Video generation failed',
            errorCode: 'INTERNAL_ERROR',
          });
        }
        return NextResponse.json(
          { error: 'Video generation failed', jobId: videoJobId },
          { status: 500 }
        );
      }
    }

    // Create a generation job
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        content_id: contentId,
        type: 'single',
        status: 'generating',
        progress: 0,
        total_items: 1,
        completed_items: 0,
        current_step: 'Generating image',
        metadata: { model: modelKey, prompt: prompt.substring(0, 200) },
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      // Continue without job tracking if it fails
    } else {
      jobId = job.id;
    }

    // Get platform-specific image configuration
    const platform = (content.platform || "").toLowerCase();
    const imageConfig = PLATFORM_IMAGE_CONFIG[platform] || DEFAULT_CONFIG;

    // Check if we have the Google API key for Nano Banana Pro
    const googleApiKey = process.env.GOOGLE_API_KEY;

    let imageUrl = null;
    let imageBase64 = null;
    let generationStatus = "pending";
    let generationMessage = "";
    let errorCode: string | null = null;
    let errorDetails: Record<string, unknown> | null = null;

    if (googleApiKey) {
      try {
        // Update job progress
        if (jobId) {
          await updateJobStatus(supabase, jobId, { progress: 20, currentStep: 'Calling image API' });
        }

        // Build clean prompt WITHOUT any social media or platform references
        // The image generator should create a pure graphic design, not a mockup
        const fullPrompt = `${prompt}

CRITICAL OUTPUT REQUIREMENTS:
- Create a clean graphic design with typography
- Aspect ratio: ${imageConfig.aspectRatio}
- DO NOT include any app interfaces, phone screens, or UI elements
- DO NOT include like buttons, comment icons, share buttons, or follower counts
- DO NOT include profile pictures, avatars, or user interface elements
- DO NOT include any social media mockups or frames
- The output should be ONLY the designed graphic itself
- Pure editorial/poster-style design with text and visuals only`;

        // Use the selected model for image generation
        console.log(`Using model: ${modelConfig.name} (${modelConfig.id})`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.id}:generateContent?key=${googleApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: fullPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
                imageConfig: {
                  aspectRatio: imageConfig.aspectRatio,
                },
              },
            }),
          }
        );

        if (response.ok) {
          if (jobId) {
            await updateJobStatus(supabase, jobId, { progress: 60, currentStep: 'Processing response' });
          }

          const data = await response.json();

          // Log response structure for debugging
          console.log(`${modelConfig.name} response structure:`, JSON.stringify({
            hasCandidates: !!data.candidates,
            candidateCount: data.candidates?.length,
            hasContent: !!data.candidates?.[0]?.content,
            partsCount: data.candidates?.[0]?.content?.parts?.length,
            partTypes: data.candidates?.[0]?.content?.parts?.map((p: Record<string, unknown>) => Object.keys(p)),
          }));

          // Extract base64 image from response
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              imageBase64 = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";
              console.log(`Image generated successfully with ${modelConfig.name}, base64 length: ${imageBase64.length}`);

              // Upload to Supabase Storage instead of storing base64 data URL
              // This enables browser caching and reduces database size
              try {
                const adminClient = createAdminClient();
                const imageBuffer = Buffer.from(imageBase64, "base64");
                const ext = mimeType.includes("png") ? "png" : mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
                const filename = `generated/${contentId}/${Date.now()}.${ext}`;

                const { error: uploadError } = await adminClient.storage
                  .from("images")
                  .upload(filename, imageBuffer, {
                    contentType: mimeType,
                    upsert: true,
                    cacheControl: "public, max-age=31536000, immutable", // Cache for 1 year (immutable content)
                  });

                if (uploadError) {
                  console.error("Error uploading image to storage:", uploadError);
                  // Fall back to data URL if upload fails
                  imageUrl = `data:${mimeType};base64,${imageBase64}`;
                } else {
                  // Get public URL for the uploaded image
                  const { data: publicUrlData } = adminClient.storage
                    .from("images")
                    .getPublicUrl(filename);

                  imageUrl = publicUrlData.publicUrl;
                  // Store the storage path for potential future cleanup
                  (content as Record<string, unknown>).__storagePath = filename;
                  console.log("Image uploaded to storage:", imageUrl);
                }
              } catch (storageError) {
                console.error("Storage upload error:", storageError);
                // Fall back to data URL if storage fails
                imageUrl = `data:${mimeType};base64,${imageBase64}`;
              }

              generationStatus = "generated";
              generationMessage = `Image generated with ${modelConfig.name} for ${platform.toUpperCase()} (${imageConfig.width}x${imageConfig.height})`;
              break;
            }
          }

          if (!imageUrl) {
            // Log what we got instead
            console.log("No image in response. Parts received:", parts.map((p: Record<string, unknown>) => ({
              hasText: !!p.text,
              hasInlineData: !!p.inlineData,
              textPreview: typeof p.text === 'string' ? p.text.substring(0, 100) : undefined,
            })));
            generationMessage = `${modelConfig.name} returned no image. The prompt may have been filtered.`;
            errorCode = 'FILTERED';
            errorDetails = { partsReceived: parts.length, reason: 'No image data in response' };
          }
        } else {
          const errorData = await response.text();
          console.error(`${modelConfig.name} API error:`, errorData);
          errorCode = String(response.status);
          errorDetails = {
            status: response.status,
            statusText: response.statusText,
            body: errorData.substring(0, 500),
          };

          // User-friendly error messages
          if (response.status === 503) {
            generationMessage = `${modelConfig.name} is temporarily unavailable (503). Please try again in a moment.`;
          } else if (response.status === 429) {
            generationMessage = `Rate limit exceeded. Please wait a moment before trying again.`;
          } else if (response.status === 400) {
            generationMessage = `Invalid request. The prompt may contain unsupported content.`;
          } else {
            generationMessage = `${modelConfig.name} generation failed (${response.status}). Please try again.`;
          }
        }
      } catch (err) {
        console.error(`${modelConfig.name} API error:`, err);
        errorCode = 'NETWORK_ERROR';
        errorDetails = { error: err instanceof Error ? err.message : String(err) };
        generationMessage = `${modelConfig.name} generation failed due to network error. Please try again.`;
      }
    } else {
      errorCode = 'NO_API_KEY';
      generationMessage = "No image generation API configured. Add GOOGLE_API_KEY for image generation.";
    }

    // Save image record to database with platform-specific dimensions
    if (jobId) {
      await updateJobStatus(supabase, jobId, { progress: 80, currentStep: 'Saving to database' });
    }

    // Get storage path if image was uploaded to storage
    const storagePath = (content as Record<string, unknown>).__storagePath as string | undefined;

    const { data: savedImage, error: saveError } = await supabase
      .from("images")
      .insert({
        content_id: contentId,
        prompt: prompt,
        url: imageUrl || `placeholder:${content.platform}`,
        storage_path: storagePath || null,
        is_primary: true,
        format: "png",
        dimensions: {
          width: imageConfig.width,
          height: imageConfig.height,
          aspectRatio: imageConfig.aspectRatio,
          model: modelKey,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving image:", saveError);
      if (jobId) {
        await updateJobStatus(supabase, jobId, {
          status: 'failed',
          progress: 100,
          errorMessage: 'Failed to save image to database',
          errorCode: 'DB_ERROR',
          errorDetails: { error: saveError.message },
        });
      }
      return NextResponse.json(
        { error: "Failed to save image record", jobId },
        { status: 500 }
      );
    }

    // Update job status to completed or failed
    if (jobId) {
      if (imageUrl) {
        await updateJobStatus(supabase, jobId, {
          status: 'completed',
          progress: 100,
          completedItems: 1,
          currentStep: undefined,
        });
      } else {
        await updateJobStatus(supabase, jobId, {
          status: 'failed',
          progress: 100,
          errorMessage: generationMessage,
          errorCode: errorCode || 'UNKNOWN',
          errorDetails: errorDetails || {},
        });
      }
    }

    return NextResponse.json({
      success: true,
      image: savedImage,
      generated: !!imageUrl,
      status: generationStatus,
      message: generationMessage,
      platform: platform,
      dimensions: {
        width: imageConfig.width,
        height: imageConfig.height,
        aspectRatio: imageConfig.aspectRatio,
      },
      model: {
        key: modelKey,
        name: modelConfig.name,
        description: modelConfig.description,
      },
      jobId,
      errorCode,
    });
  } catch (error) {
    console.error("Error in POST /api/images/generate:", error);

    // Update job status if we have one
    if (jobId) {
      await updateJobStatus(supabase, jobId, {
        status: 'failed',
        progress: 100,
        errorMessage: 'Internal server error',
        errorCode: 'INTERNAL_ERROR',
        errorDetails: { error: error instanceof Error ? error.message : String(error) },
      });
    }

    return NextResponse.json(
      { error: "Internal server error", jobId },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    const { data: images, error } = await supabase
      .from("images")
      .select("*")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error);
      return NextResponse.json(
        { error: "Failed to fetch images" },
        { status: 500 }
      );
    }

    // Add cache headers - images are immutable once generated
    // Cache for 1 hour in browser, allow revalidation with stale-while-revalidate
    const response = NextResponse.json({
      success: true,
      images,
    });
    response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return response;
  } catch (error) {
    console.error("Error in GET /api/images/generate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
