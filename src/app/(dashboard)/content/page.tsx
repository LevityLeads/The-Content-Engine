"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { FileText, Send, Clock, RefreshCw, Loader2, Image as ImageIcon, Sparkles, Twitter, Linkedin, Instagram, Copy, Check, Download, Images, CheckCircle2, XCircle, Zap, Brain, ChevronDown, ChevronRight, ChevronLeft, Trash2, Square, CheckSquare, AlertCircle, Eye, Pencil, ChevronUp, Calendar, ArrowRight, Video, Play, Save, FolderOpen, MoreVertical, X } from "lucide-react";
import { MODEL_OPTIONS, DEFAULT_MODEL, IMAGE_MODELS, type ImageModelKey } from "@/lib/image-models";
import { VIDEO_MODEL_OPTIONS, DEFAULT_VIDEO_MODEL, VIDEO_MODELS, type VideoModelKey } from "@/lib/video-models";
import { estimateVideoCost } from "@/lib/video-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageCarousel, type CarouselImage } from "@/components/ui/image-carousel";
import { PlatformPostMockup } from "@/components/ui/platform-mockups";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GenerationStatus } from "@/components/ui/generation-status";
import { ContentGridSkeleton } from "@/components/ui/skeleton";
import { useGenerationJobs } from "@/hooks/use-generation-jobs";
import { useContent } from '@/hooks/use-swr-hooks';
import { cn } from "@/lib/utils";
import { useBrand, type SavedDesignSystemPreset } from "@/contexts/brand-context";

interface ContentImage {
  id: string;
  url: string;
  prompt: string;
  is_primary: boolean;
  model?: ImageModelKey;
  media_type?: "image" | "video";
  duration_seconds?: number;
  has_audio?: boolean;
}

interface CarouselSlide {
  slideNumber: number;
  text: string;
  imagePrompt?: string; // Optional - generated on-demand when user clicks Generate
}

// Design system structure stored in content metadata
interface DesignSystem {
  background: string;
  primaryColor: string;
  accentColor: string;
  typography: string;
  layout: string;
  mood: string;
  textOverlay?: string;
}

interface Content {
  id: string;
  platform: string;
  copy_primary: string;
  copy_hashtags: string[] | null;
  copy_cta: string | null;
  copy_thread_parts: string[] | null;
  copy_carousel_slides: CarouselSlide[] | string[] | null;
  status: string;
  scheduled_for: string | null;
  metadata: {
    imagePrompt?: string;
    videoPrompt?: string;
    visualStyle?: string; // "video" | "mixed-carousel" | other visual styles
    contentType?: "video" | "carousel" | "single-image"; // Content format type
    carouselStyle?: string | {
      visualStyle?: string;
      font?: string;
      aesthetic?: string;
      primaryColor?: string;
      accentColor?: string;
      textOverlayMethod?: string;
      styleRationale?: string;
    };
    designSystems?: Record<string, DesignSystem>; // Stored design systems by visual style
  } | null;
  created_at: string;
  ideas?: {
    concept: string;
    angle: string;
  } | null;
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const platformIcons: Record<string, React.ReactNode> = {
  twitter: <Twitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
};

const platformColors: Record<string, string> = {
  twitter: "bg-sky-500",
  linkedin: "bg-blue-600",
  instagram: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500",
};

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  published: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

// Visual style options for style change
const visualStyleOptions = [
  { id: "typography", label: "Typography", description: "Bold text-focused" },
  { id: "photorealistic", label: "Photo", description: "Photo-quality backgrounds" },
  { id: "illustration", label: "Illustration", description: "Hand-drawn art" },
  { id: "3d-render", label: "3D Render", description: "Modern 3D scenes" },
  { id: "abstract-art", label: "Abstract", description: "Bold shapes & gradients" },
  { id: "collage", label: "Collage", description: "Mixed media layers" },
  { id: "experimental", label: "Experimental", description: "Wild & boundary-pushing" },
];

export default function ContentPage() {
  const { selectedBrand, updateBrand } = useBrand();
  const fetchingImagesRef = useRef<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("draft");
  
  // Use SWR for content fetching with automatic caching
  const { content: swrContent, isLoading: isContentLoading, mutate: mutateContent } = useContent({
    status: filter || undefined,
    limit: 50,
  });

  // Local state for backwards compatibility during transition
  const [content, setContent] = useState<Content[]>([]);
  const [images, setImages] = useState<Record<string, ContentImage[]>>({});
  const [slideImages, setSlideImages] = useState<Record<string, Record<number, CarouselImage[]>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [generatingSlides, setGeneratingSlides] = useState<Record<string, number[]>>({});
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedCopy, setEditedCopy] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ImageModelKey>(DEFAULT_MODEL);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [currentSlideIndex, setCurrentSlideIndex] = useState<Record<string, number>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [generatingAllVideos, setGeneratingAllVideos] = useState<string | null>(null);
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModelKey>(DEFAULT_VIDEO_MODEL);
  const [includeAudio, setIncludeAudio] = useState<boolean>(false);
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [mediaMode, setMediaMode] = useState<"image" | "video">("image");
  const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null);
  const [videoPrompts, setVideoPrompts] = useState<Record<string, string>>({});
  const [captionPanelWidth, setCaptionPanelWidth] = useState<number>(320); // Default ~1/3 width
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingContentId, setSchedulingContentId] = useState<string | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [publishMessage, setPublishMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // Magic Schedule state
  const [magicScheduleDialogOpen, setMagicScheduleDialogOpen] = useState(false);
  const [magicScheduleContentId, setMagicScheduleContentId] = useState<string | null>(null);
  const [magicSuggestion, setMagicSuggestion] = useState<{
    suggestedTime: string;
    reasoning: string;
    alternatives: Array<{ time: string; label: string }>;
  } | null>(null);
  const [isLoadingMagicSuggestion, setIsLoadingMagicSuggestion] = useState(false);
  const [selectedMagicTime, setSelectedMagicTime] = useState<string | null>(null);
  // Slide text editing state
  const [editingSlideText, setEditingSlideText] = useState<{ contentId: string; slideNumber: number } | null>(null);
  const [editedSlideText, setEditedSlideText] = useState<string>("");
  const [savingSlideText, setSavingSlideText] = useState(false);
  // Image/Video prompt editing state
  const [editingImagePrompt, setEditingImagePrompt] = useState<{ contentId: string; slideNumber: number } | null>(null);
  const [editedImagePrompt, setEditedImagePrompt] = useState<string>("");
  const [savingImagePrompt, setSavingImagePrompt] = useState(false);
  const [editingVideoPrompt, setEditingVideoPrompt] = useState<{ contentId: string; slideNumber: number } | null>(null);
  const [editedVideoPrompt, setEditedVideoPrompt] = useState<string>("");
  // Visual style state
  const [selectedVisualStyle, setSelectedVisualStyle] = useState<Record<string, string>>({});
  // Design system preset state
  const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
  const [savePresetContentId, setSavePresetContentId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  // Bulk Magic Schedule state
  const [bulkMagicDialogOpen, setBulkMagicDialogOpen] = useState(false);
  const [bulkSuggestions, setBulkSuggestions] = useState<Array<{
    contentId: string;
    suggestedTime: string;
    reasoning: string;
    score: number;
    platform?: string;
    concept?: string;
  }>>([]);
  const [isLoadingBulkSuggestions, setIsLoadingBulkSuggestions] = useState(false);
  const [isSchedulingBulk, setIsSchedulingBulk] = useState(false);
  const [bulkScheduleProgress, setBulkScheduleProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkScheduleResults, setBulkScheduleResults] = useState<{ successes: string[]; failures: string[] } | null>(null);

  // Generation job tracking
  const contentIds = content.map(c => c.id);
  const {
    getLatestJob,
    getActiveJob,
    isGenerating: isJobGenerating,
    hasFailed: hasJobFailed,
    getError,
    refresh: refreshJobs,
    clearJob,
  } = useGenerationJobs({
    contentIds: contentIds.length > 0 ? contentIds : undefined,
    pollInterval: 2000,
    autoPoll: true,
  });

  // Sync SWR data to local state
  useEffect(() => {
    if (swrContent && swrContent.length > 0) {
      // Cast SWR content to local Content type (SWR type is a subset)
      setContent(swrContent as unknown as Content[]);
    }
  }, [swrContent]);

  // Fetch images when content loads from SWR
  useEffect(() => {
    if (swrContent && swrContent.length > 0) {
      // Fetch images for all content items in parallel
      Promise.all(swrContent.map((item) => fetchImagesForContent(item.id)));
    }
  }, [swrContent]);

  // Update loading state based on SWR
  useEffect(() => {
    setIsLoading(isContentLoading);
  }, [isContentLoading]);

  useEffect(() => {
    if (selectedBrand?.id) {
      mutateContent();
    }
    setSelectedItems(new Set());
  }, [filter, selectedBrand?.id]);

  // Handle divider drag for resizing caption panel
  useEffect(() => {
    if (!isDraggingDivider) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('slides-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      // Clamp between 200px and 500px
      setCaptionPanelWidth(Math.max(200, Math.min(500, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDraggingDivider(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDivider]);

  const fetchContent = async () => {
    // SWR handles the main content fetching
    // Just trigger a revalidation
    mutateContent();
  };

  const fetchImagesForContent = async (contentId: string) => {
    // Prevent duplicate fetches for the same content
    if (fetchingImagesRef.current.has(contentId)) {
      return;
    }
    fetchingImagesRef.current.add(contentId);
    try {
      const res = await fetch(`/api/images/generate?contentId=${contentId}`);
      const data = await res.json();
      if (data.success && data.images) {
        setImages((prev) => ({
          ...prev,
          [contentId]: data.images,
        }));

        const imgMap: Record<number, CarouselImage[]> = {};
        const unmatchedImages: CarouselImage[] = [];

        data.images.forEach((img: ContentImage & { created_at?: string; slide_number?: number }) => {
          if (img.url && !img.url.startsWith("placeholder:")) {
            const carouselImg: CarouselImage = {
              id: img.id,
              url: img.url,
              model: img.model,
              createdAt: img.created_at,
              prompt: img.prompt,
              mediaType: img.media_type,
              durationSeconds: img.duration_seconds,
            };

            // First check if slide_number is set directly in the database
            if (img.slide_number && img.slide_number > 0) {
              if (!imgMap[img.slide_number]) {
                imgMap[img.slide_number] = [];
              }
              imgMap[img.slide_number].push(carouselImg);
              return; // Found match, continue to next image
            }

            // Fall back to matching by prompt pattern
            const patterns = [
              /^\[slide\s*(\d+)\]/i,
              /slide\s*(\d+)\s*:/i,
              /slide\s*(\d+)/i,
              /-\s*slide\s*(\d+)/i,
            ];

            let matched = false;
            for (const pattern of patterns) {
              const match = img.prompt?.match(pattern);
              if (match) {
                const slideNum = parseInt(match[1]);
                if (!imgMap[slideNum]) {
                  imgMap[slideNum] = [];
                }
                imgMap[slideNum].push(carouselImg);
                matched = true;
                break;
              }
            }

            if (!matched) {
              unmatchedImages.push(carouselImg);
            }
          }
        });

        if (unmatchedImages.length > 0) {
          imgMap[0] = unmatchedImages;
        }

        setSlideImages((prev) => ({ ...prev, [contentId]: imgMap }));
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    } finally {
      fetchingImagesRef.current.delete(contentId);
    }
  };

  const handleGenerateImage = async (contentId: string, prompt: string, slideNumber?: number) => {
    const key = slideNumber ? `${contentId}-${slideNumber}` : contentId;
    setGeneratingImage(key);

    if (slideNumber) {
      setGeneratingSlides((prev) => ({
        ...prev,
        [contentId]: [...(prev[contentId] || []), slideNumber],
      }));
    }

    setImageMessage(null);
    try {
      const slidePrompt = slideNumber ? `[Slide ${slideNumber}] ${prompt}` : prompt;
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, prompt: slidePrompt, model: selectedModel }),
      });
      const data = await res.json();
      if (data.success) {
        setImageMessage(data.message);
        if (slideNumber && data.image?.url && !data.image.url.startsWith("placeholder:")) {
          const newImage: CarouselImage = {
            id: data.image.id,
            url: data.image.url,
            model: data.image.model || selectedModel,
            createdAt: new Date().toISOString(),
            prompt: data.image.prompt || prompt,
          };
          setSlideImages((prev) => ({
            ...prev,
            [contentId]: {
              ...(prev[contentId] || {}),
              [slideNumber]: [newImage, ...(prev[contentId]?.[slideNumber] || [])],
            },
          }));
        } else if (!slideNumber) {
          fetchImagesForContent(contentId);
        }
      } else {
        setImageMessage(data.error || "Failed to generate image");
      }
    } catch (err) {
      console.error("Error generating image:", err);
      setImageMessage("Error generating image");
    } finally {
      setGeneratingImage(null);
      if (slideNumber) {
        setGeneratingSlides((prev) => ({
          ...prev,
          [contentId]: (prev[contentId] || []).filter((n) => n !== slideNumber),
        }));
      }
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  const handleGenerateAllSlides = async (contentId: string, slides: CarouselSlide[]) => {
    setImageMessage("Generating all slide images...");

    // Create a job to track all slides
    const initialSlideStatuses = slides.map((slide) => ({
      slideNumber: slide.slideNumber,
      status: 'pending' as const,
    }));

    let jobId: string | null = null;
    try {
      const jobRes = await fetch("/api/images/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          type: 'carousel',
          totalItems: slides.length,
          metadata: { slideStatuses: initialSlideStatuses, mode: 'ai-generation' },
        }),
      });
      const jobData = await jobRes.json();
      if (jobData.success) {
        jobId = jobData.job.id;
      }
    } catch (err) {
      console.error("Error creating job:", err);
    }

    // Helper to update slide status in the job
    const updateSlideStatus = async (slideNumber: number, slideStatus: 'generating' | 'completed' | 'failed') => {
      if (!jobId) return;
      try {
        // Fetch current job to get metadata
        const getRes = await fetch(`/api/images/jobs?jobId=${jobId}`);
        const getData = await getRes.json();
        if (!getData.success || !getData.job?.metadata) return;

        const metadata = getData.job.metadata;
        const slideStatuses = metadata.slideStatuses || [];
        const updatedStatuses = slideStatuses.map((s: { slideNumber: number; status: string }) =>
          s.slideNumber === slideNumber ? { ...s, status: slideStatus } : s
        );

        const completedCount = updatedStatuses.filter((s: { status: string }) => s.status === 'completed').length;
        const failedCount = updatedStatuses.filter((s: { status: string }) => s.status === 'failed').length;
        const allDone = completedCount + failedCount === slides.length;

        await fetch("/api/images/jobs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId,
            status: allDone ? (failedCount === slides.length ? 'failed' : 'completed') : 'generating',
            progress: Math.round(((completedCount + failedCount) / slides.length) * 100),
            completedItems: completedCount,
            metadata: { ...metadata, slideStatuses: updatedStatuses },
          }),
        });
      } catch (err) {
        console.error("Error updating slide status:", err);
      }
    };

    // Generate all slides with status tracking (only slides with prompts)
    const slidesWithPrompts = slides.filter(slide => slide.imagePrompt);
    const promises = slidesWithPrompts.map(async (slide) => {
      await updateSlideStatus(slide.slideNumber, 'generating');
      try {
        await handleGenerateImage(contentId, slide.imagePrompt!, slide.slideNumber);
        await updateSlideStatus(slide.slideNumber, 'completed');
      } catch (err) {
        await updateSlideStatus(slide.slideNumber, 'failed');
      }
    });

    await Promise.all(promises);
    await refreshJobs();
    setImageMessage("All slide images generated!");
    setTimeout(() => setImageMessage(null), 5000);
  };

  // Generate video for a single slide or all slides
  const handleGenerateVideo = async (contentId: string, slideNumber: number, videoPrompt: string) => {
    const key = `${contentId}-video-${slideNumber}`;
    setGeneratingSlides((prev) => ({
      ...prev,
      [contentId]: [...(prev[contentId] || []), slideNumber],
    }));
    setImageMessage(`Generating video for slide ${slideNumber}...`);

    try {
      const response = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          prompt: videoPrompt,
          model: selectedVideoModel,
          duration: videoDuration,
          includeAudio: includeAudio,
          slideNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageMessage(`Video generated for slide ${slideNumber}!`);
        fetchImagesForContent(contentId);
      } else {
        setImageMessage(`Error: ${data.error || "Failed to generate video"}`);
      }
    } catch (error) {
      console.error("Error generating video:", error);
      setImageMessage("Error generating video");
    } finally {
      setGeneratingSlides((prev) => ({
        ...prev,
        [contentId]: (prev[contentId] || []).filter((n) => n !== slideNumber),
      }));
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  // Generate prompts and videos for all slides
  const handleGenerateAllVideos = async (contentId: string, slides: CarouselSlide[]) => {
    setGeneratingAllVideos(contentId);
    setImageMessage("Generating prompts and videos for all slides...");

    try {
      // First generate prompts for all slides
      const contentItem = content.find((c) => c.id === contentId);
      const currentStyle = selectedVisualStyle[contentId] || getCarouselStyleId(contentItem?.metadata?.carouselStyle);

      const promptResponse = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          slides: slides.map((s) => ({ slideNumber: s.slideNumber, text: s.text })),
          visualStyle: currentStyle,
          mediaType: "video",
          brandId: selectedBrand?.id,
        }),
      });

      const promptData = await promptResponse.json();

      if (!promptData.success) {
        setImageMessage(`Error: ${promptData.error || "Failed to generate prompts"}`);
        return;
      }

      // Then generate videos using those prompts
      const generatedPrompts = promptData.prompts as Array<{ slideNumber: number; prompt: string }>;

      // Update video prompts state
      const newVideoPrompts: Record<string, string> = {};
      generatedPrompts.forEach((p) => {
        newVideoPrompts[`${contentId}-${p.slideNumber}`] = p.prompt;
      });
      setVideoPrompts((prev) => ({ ...prev, ...newVideoPrompts }));

      // Generate videos in parallel (with some batching to avoid overwhelming the API)
      const batchSize = 2;
      for (let i = 0; i < generatedPrompts.length; i += batchSize) {
        const batch = generatedPrompts.slice(i, i + batchSize);
        await Promise.all(
          batch.map((p) => handleGenerateVideo(contentId, p.slideNumber, p.prompt))
        );
      }

      setImageMessage("All videos generated!");
    } catch (error) {
      console.error("Error generating all videos:", error);
      setImageMessage("Error generating videos");
    } finally {
      setGeneratingAllVideos(null);
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  // Generate prompt and then image for a single slide
  const handleGenerateWithPrompt = async (contentId: string, slide: CarouselSlide) => {
    const key = `${contentId}-${slide.slideNumber}`;
    setGeneratingPrompt(key);
    setGeneratingSlides((prev) => ({
      ...prev,
      [contentId]: [...(prev[contentId] || []), slide.slideNumber],
    }));
    setImageMessage("Generating prompt and image...");

    try {
      const contentItem = content.find((c) => c.id === contentId);
      const currentStyle = selectedVisualStyle[contentId] || getCarouselStyleId(contentItem?.metadata?.carouselStyle);

      // Generate prompt
      const promptResponse = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          slides: [{ slideNumber: slide.slideNumber, text: slide.text }],
          visualStyle: currentStyle,
          mediaType: "image",
          brandId: selectedBrand?.id,
        }),
      });

      const promptData = await promptResponse.json();

      if (!promptData.success) {
        setImageMessage(`Error: ${promptData.error || "Failed to generate prompt"}`);
        return;
      }

      const generatedPrompt = promptData.prompts[0]?.prompt;
      if (!generatedPrompt) {
        setImageMessage("Error: No prompt generated");
        return;
      }

      // Update the slide's imagePrompt in local state
      setContent((prev) =>
        prev.map((c) => {
          if (c.id !== contentId) return c;
          if (!c.copy_carousel_slides) return c;
          const updatedSlides = c.copy_carousel_slides.map((slideData) => {
            const s = typeof slideData === 'string' ? JSON.parse(slideData) : slideData;
            if (s.slideNumber === slide.slideNumber) {
              return JSON.stringify({ ...s, imagePrompt: generatedPrompt });
            }
            return typeof slideData === 'string' ? slideData : JSON.stringify(slideData);
          });
          return { ...c, copy_carousel_slides: updatedSlides };
        })
      );

      // Now generate the image with the prompt
      await handleGenerateImage(contentId, generatedPrompt, slide.slideNumber);

    } catch (error) {
      console.error("Error generating with prompt:", error);
      setImageMessage("Error generating image");
    } finally {
      setGeneratingPrompt(null);
      setGeneratingSlides((prev) => ({
        ...prev,
        [contentId]: (prev[contentId] || []).filter((n) => n !== slide.slideNumber),
      }));
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  // Regenerate only the prompt (without generating an image)
  const handleRegeneratePromptOnly = async (contentId: string, slide: CarouselSlide) => {
    const key = `${contentId}-${slide.slideNumber}`;
    setGeneratingPrompt(key);
    setImageMessage("Regenerating prompt...");

    try {
      const contentItem = content.find((c) => c.id === contentId);
      if (!contentItem) return;

      const currentStyle = selectedVisualStyle[contentId] || getCarouselStyleId(contentItem?.metadata?.carouselStyle);

      // Generate new prompt
      const promptResponse = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          slides: [{ slideNumber: slide.slideNumber, text: slide.text }],
          visualStyle: currentStyle,
          mediaType: "image",
          brandId: selectedBrand?.id,
        }),
      });

      const promptData = await promptResponse.json();

      if (!promptData.success) {
        setImageMessage(`Error: ${promptData.error || "Failed to generate prompt"}`);
        return;
      }

      const generatedPrompt = promptData.prompts[0]?.prompt;
      if (!generatedPrompt) {
        setImageMessage("Error: No prompt generated");
        return;
      }

      // Build the updated slides array
      const updatedSlides = contentItem.copy_carousel_slides?.map((slideData) => {
        const s = typeof slideData === 'string' ? JSON.parse(slideData) : slideData;
        if (s.slideNumber === slide.slideNumber) {
          return JSON.stringify({ ...s, imagePrompt: generatedPrompt });
        }
        return typeof slideData === 'string' ? slideData : JSON.stringify(slideData);
      }) || [];

      // Persist to database
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contentId, copy_carousel_slides: updatedSlides }),
      });
      const data = await res.json();

      if (data.success) {
        // Update local state
        setContent((prev) =>
          prev.map((c) => (c.id === contentId ? { ...c, copy_carousel_slides: updatedSlides } : c))
        );
        setImageMessage("Prompt regenerated successfully");
      } else {
        setImageMessage("Error saving prompt");
      }

    } catch (error) {
      console.error("Error regenerating prompt:", error);
      setImageMessage("Error regenerating prompt");
    } finally {
      setGeneratingPrompt(null);
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  // Generate prompts and images for all slides
  const handleGenerateAllWithPrompts = async (contentId: string, slides: CarouselSlide[]) => {
    setImageMessage("Generating prompts and images for all slides...");
    setGeneratingPrompt(contentId);

    try {
      const contentItem = content.find((c) => c.id === contentId);
      const currentStyle = selectedVisualStyle[contentId] || getCarouselStyleId(contentItem?.metadata?.carouselStyle);

      // First generate prompts for all slides
      const promptResponse = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          slides: slides.map((s) => ({ slideNumber: s.slideNumber, text: s.text })),
          visualStyle: currentStyle,
          mediaType: "image",
          brandId: selectedBrand?.id,
        }),
      });

      const promptData = await promptResponse.json();

      if (!promptData.success) {
        setImageMessage(`Error: ${promptData.error || "Failed to generate prompts"}`);
        return;
      }

      const generatedPrompts = promptData.prompts as Array<{ slideNumber: number; prompt: string }>;

      // Update slides with new prompts
      setContent((prev) =>
        prev.map((c) => {
          if (c.id !== contentId) return c;
          if (!c.copy_carousel_slides) return c;
          const updatedSlides = c.copy_carousel_slides.map((slideData) => {
            const s = typeof slideData === 'string' ? JSON.parse(slideData) : slideData;
            const newPrompt = generatedPrompts.find((p) => p.slideNumber === s.slideNumber);
            if (newPrompt) {
              return JSON.stringify({ ...s, imagePrompt: newPrompt.prompt });
            }
            return typeof slideData === 'string' ? slideData : JSON.stringify(slideData);
          });
          return { ...c, copy_carousel_slides: updatedSlides };
        })
      );

      // Generate images using those prompts
      const slidesWithPrompts = slides.map((s) => ({
        ...s,
        imagePrompt: generatedPrompts.find((p) => p.slideNumber === s.slideNumber)?.prompt || s.imagePrompt,
      }));

      await handleGenerateAllSlides(contentId, slidesWithPrompts);

    } catch (error) {
      console.error("Error generating all with prompts:", error);
      setImageMessage("Error generating images");
    } finally {
      setGeneratingPrompt(null);
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  // Regenerate design system for a style (force new generation)
  const [regeneratingStyle, setRegeneratingStyle] = useState<string | null>(null);

  const handleRegenerateStyle = async (contentId: string, slides: CarouselSlide[], andGenerateImages: boolean = false) => {
    const contentItem = content.find((c) => c.id === contentId);
    const currentStyle = selectedVisualStyle[contentId] || getCarouselStyleId(contentItem?.metadata?.carouselStyle);

    setRegeneratingStyle(contentId);
    setImageMessage(`Regenerating ${currentStyle} style design system...`);

    try {
      const promptResponse = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          slides: slides.map((s) => ({ slideNumber: s.slideNumber, text: s.text })),
          visualStyle: currentStyle,
          mediaType: "image",
          brandId: selectedBrand?.id,
          forceRegenerate: true, // Force regenerate the design system
        }),
      });

      const promptData = await promptResponse.json();

      if (!promptData.success) {
        setImageMessage(`Error: ${promptData.error || "Failed to regenerate style"}`);
        return;
      }

      setImageMessage(`✓ New ${currentStyle} design system created!`);

      // If requested, also generate the images with the new design system
      if (andGenerateImages) {
        const generatedPrompts = promptData.prompts as Array<{ slideNumber: number; prompt: string }>;

        // Update slides with new prompts
        setContent((prev) =>
          prev.map((c) => {
            if (c.id !== contentId) return c;
            if (!c.copy_carousel_slides) return c;
            const updatedSlides = c.copy_carousel_slides.map((slideData) => {
              const s = typeof slideData === 'string' ? JSON.parse(slideData) : slideData;
              const newPrompt = generatedPrompts.find((p) => p.slideNumber === s.slideNumber);
              if (newPrompt) {
                return JSON.stringify({ ...s, imagePrompt: newPrompt.prompt });
              }
              return typeof slideData === 'string' ? slideData : JSON.stringify(slideData);
            });
            return { ...c, copy_carousel_slides: updatedSlides };
          })
        );

        // Generate images using new prompts
        const slidesWithPrompts = slides.map((s) => ({
          ...s,
          imagePrompt: generatedPrompts.find((p) => p.slideNumber === s.slideNumber)?.prompt || s.imagePrompt,
        }));

        setImageMessage("Generating images with new design system...");
        await handleGenerateAllSlides(contentId, slidesWithPrompts);
      }
    } catch (error) {
      console.error("Error regenerating style:", error);
      setImageMessage("Error regenerating style");
    } finally {
      setRegeneratingStyle(null);
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  // Open save preset dialog
  const openSavePresetDialog = (contentId: string) => {
    setSavePresetContentId(contentId);
    setPresetName("");
    setSavePresetDialogOpen(true);
  };

  // Save current design system as preset
  const handleSavePreset = async () => {
    if (!savePresetContentId || !selectedBrand || !presetName.trim()) return;

    setSavingPreset(true);
    try {
      const contentItem = content.find((c) => c.id === savePresetContentId);
      const currentStyle = selectedVisualStyle[savePresetContentId] || getCarouselStyleId(contentItem?.metadata?.carouselStyle);
      const effectiveStyle = typeof currentStyle === "string" ? currentStyle : (currentStyle as { visualStyle?: string }).visualStyle || "typography";

      // Get the design system from content metadata
      const designSystem = contentItem?.metadata?.designSystems?.[effectiveStyle];

      if (!designSystem) {
        setImageMessage("No design system found for this style. Generate images first to create a design system.");
        return;
      }

      // Create new preset
      const newPreset: SavedDesignSystemPreset = {
        id: crypto.randomUUID(),
        name: presetName.trim(),
        visualStyle: effectiveStyle,
        designSystem,
        createdAt: new Date().toISOString(),
      };

      // Get existing presets or empty array
      const existingPresets = selectedBrand.visual_config?.savedDesignSystems || [];

      // Update brand with new preset
      await updateBrand(selectedBrand.id, {
        visual_config: {
          ...selectedBrand.visual_config,
          savedDesignSystems: [...existingPresets, newPreset],
        },
      });

      setImageMessage(`✓ Saved "${presetName}" preset for ${effectiveStyle} style`);
      setSavePresetDialogOpen(false);
    } catch (error) {
      console.error("Error saving preset:", error);
      setImageMessage("Error saving preset");
    } finally {
      setSavingPreset(false);
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  // Load a saved preset into content metadata
  const handleLoadPreset = async (contentId: string, preset: SavedDesignSystemPreset) => {
    setLoadingPreset(contentId);
    try {
      const contentItem = content.find((c) => c.id === contentId);
      if (!contentItem) return;

      // Update content metadata with the preset's design system
      const existingDesignSystems = contentItem.metadata?.designSystems || {};
      const updatedMetadata = {
        ...contentItem.metadata,
        designSystems: {
          ...existingDesignSystems,
          [preset.visualStyle]: preset.designSystem,
        },
      };

      // Update content via API
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contentId, metadata: updatedMetadata }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local state
        setContent((prev) =>
          prev.map((c) =>
            c.id === contentId ? { ...c, metadata: updatedMetadata } : c
          )
        );
        // Set the visual style to match the preset
        setSelectedVisualStyle((prev) => ({ ...prev, [contentId]: preset.visualStyle }));
        setImageMessage(`✓ Loaded "${preset.name}" preset`);
      } else {
        setImageMessage("Error loading preset");
      }
    } catch (error) {
      console.error("Error loading preset:", error);
      setImageMessage("Error loading preset");
    } finally {
      setLoadingPreset(null);
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  // Delete a saved preset
  const handleDeletePreset = async (presetId: string) => {
    if (!selectedBrand) return;

    try {
      const existingPresets = selectedBrand.visual_config?.savedDesignSystems || [];
      const updatedPresets = existingPresets.filter((p) => p.id !== presetId);

      await updateBrand(selectedBrand.id, {
        visual_config: {
          ...selectedBrand.visual_config,
          savedDesignSystems: updatedPresets,
        },
      });

      setImageMessage("✓ Preset deleted");
    } catch (error) {
      console.error("Error deleting preset:", error);
      setImageMessage("Error deleting preset");
    } finally {
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  // Generate single video for video-only content (not carousel)
  const [generatingSingleVideo, setGeneratingSingleVideo] = useState<string | null>(null);

  const handleGenerateSingleVideo = async (contentId: string, videoPrompt?: string) => {
    setGeneratingSingleVideo(contentId);
    setImageMessage("Generating video... This may take 1-2 minutes.");

    try {
      // Get the content item to find the video prompt
      const contentItem = content.find((c) => c.id === contentId);
      const prompt = videoPrompt || contentItem?.metadata?.videoPrompt || contentItem?.copy_primary || "Create an engaging social media video";

      const response = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          prompt,
          duration: 5,
          includeAudio: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageMessage("Video generated successfully!");
        // Refresh images/videos for this content
        fetchImagesForContent(contentId);
      } else {
        setImageMessage(`Error: ${data.error || "Failed to generate video"}`);
      }
    } catch (error) {
      console.error("Error generating single video:", error);
      setImageMessage("Error generating video");
    } finally {
      setGeneratingSingleVideo(null);
      setTimeout(() => setImageMessage(null), 5000);
    }
  };

  const handleUpdateContent = async (id: string, updates: Partial<Content>) => {
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        setContent((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error("Error updating content:", err);
    }
  };

  // Save edited slide text
  const handleSaveSlideText = async (contentId: string, slideNumber: number, newText: string) => {
    setSavingSlideText(true);
    try {
      // Find the content item
      const contentItem = content.find((c) => c.id === contentId);
      if (!contentItem || !contentItem.copy_carousel_slides) return;

      // Update the specific slide's text
      const updatedSlides = contentItem.copy_carousel_slides.map((slideData, idx) => {
        // Parse if it's a JSON string
        const slide = typeof slideData === 'string' ? JSON.parse(slideData) : slideData;
        if (slide.slideNumber === slideNumber || idx + 1 === slideNumber) {
          return JSON.stringify({ ...slide, text: newText });
        }
        return typeof slideData === 'string' ? slideData : JSON.stringify(slideData);
      });

      // Update via API
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contentId, copy_carousel_slides: updatedSlides }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setContent((prev) =>
          prev.map((c) => (c.id === contentId ? { ...c, copy_carousel_slides: updatedSlides } : c))
        );
        setEditingSlideText(null);
        setEditedSlideText("");
      }
    } catch (err) {
      console.error("Error saving slide text:", err);
    } finally {
      setSavingSlideText(false);
    }
  };

  // Save edited image prompt
  const handleSaveImagePrompt = async (contentId: string, slideNumber: number, newPrompt: string) => {
    setSavingImagePrompt(true);
    try {
      // Find the content item
      const contentItem = content.find((c) => c.id === contentId);
      if (!contentItem || !contentItem.copy_carousel_slides) return;

      // Update the specific slide's imagePrompt
      const updatedSlides = contentItem.copy_carousel_slides.map((slideData, idx) => {
        const slide = typeof slideData === 'string' ? JSON.parse(slideData) : slideData;
        if (slide.slideNumber === slideNumber || idx + 1 === slideNumber) {
          return JSON.stringify({ ...slide, imagePrompt: newPrompt });
        }
        return typeof slideData === 'string' ? slideData : JSON.stringify(slideData);
      });

      // Update via API
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contentId, copy_carousel_slides: updatedSlides }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setContent((prev) =>
          prev.map((c) => (c.id === contentId ? { ...c, copy_carousel_slides: updatedSlides } : c))
        );
        setEditingImagePrompt(null);
        setEditedImagePrompt("");
      }
    } catch (err) {
      console.error("Error saving image prompt:", err);
    } finally {
      setSavingImagePrompt(false);
    }
  };

  // Save edited video prompt (local state only)
  const handleSaveVideoPrompt = (contentId: string, slideNumber: number, newPrompt: string) => {
    const key = `${contentId}-${slideNumber}`;
    setVideoPrompts((prev) => ({ ...prev, [key]: newPrompt }));
    setEditingVideoPrompt(null);
    setEditedVideoPrompt("");
  };

  const handleCopyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const areAllSlidesApproved = (_contentId: string, _totalSlides: number) => {
    // Slide-by-slide approval can be implemented in the future
    // For now, allow approval of all carousels
    return true;
  };

  const handleApprove = async (id: string) => {
    await handleUpdateContent(id, { status: "approved" });
  };

  const handlePublish = async (contentId: string) => {
    setPublishingId(contentId);
    setPublishMessage(null);
    try {
      // Get the selected image IDs based on user's variant selections
      const selectedImageIds = getSelectedImageIds(contentId);
      console.log("Publishing with selected images:", selectedImageIds);

      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, selectedImageIds }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishMessage({ type: "success", text: "Published successfully!" });
        // Update local state
        setContent((prev) =>
          prev.map((c) =>
            c.id === contentId ? { ...c, status: data.status || "published" } : c
          )
        );
        // Clear message after 3 seconds
        setTimeout(() => setPublishMessage(null), 3000);
      } else {
        setPublishMessage({ type: "error", text: data.error || "Failed to publish" });
        setTimeout(() => setPublishMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error publishing:", err);
      setPublishMessage({ type: "error", text: "Network error - please try again" });
      setTimeout(() => setPublishMessage(null), 5000);
    } finally {
      setPublishingId(null);
    }
  };

  const handleRepublish = async (contentId: string) => {
    setPublishingId(contentId);
    setPublishMessage(null);
    try {
      // Get the selected image IDs based on user's variant selections
      const selectedImageIds = getSelectedImageIds(contentId);
      console.log("Republishing with selected images:", selectedImageIds);

      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, selectedImageIds, republish: true }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishMessage({ type: "success", text: "Republished successfully!" });
        // Update local state
        setContent((prev) =>
          prev.map((c) =>
            c.id === contentId ? { ...c, status: data.status || "published" } : c
          )
        );
        // Clear message after 3 seconds
        setTimeout(() => setPublishMessage(null), 3000);
      } else {
        setPublishMessage({ type: "error", text: data.error || "Failed to republish" });
        setTimeout(() => setPublishMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error republishing:", err);
      setPublishMessage({ type: "error", text: "Network error - please try again" });
      setTimeout(() => setPublishMessage(null), 5000);
    } finally {
      setPublishingId(null);
    }
  };

  const handleRetry = async (contentId: string) => {
    // Reset status to approved and try publishing again
    setPublishingId(contentId);
    setPublishMessage(null);
    try {
      // First reset status to approved
      const resetRes = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contentId, status: "approved" }),
      });
      if (!resetRes.ok) {
        throw new Error("Failed to reset status");
      }
      // Update local state
      setContent((prev) =>
        prev.map((c) =>
          c.id === contentId ? { ...c, status: "approved" } : c
        )
      );
      setPublishMessage({ type: "success", text: "Status reset to approved. You can now publish again." });
      setTimeout(() => setPublishMessage(null), 3000);
    } catch (err) {
      console.error("Error retrying:", err);
      setPublishMessage({ type: "error", text: "Failed to reset status" });
      setTimeout(() => setPublishMessage(null), 5000);
    } finally {
      setPublishingId(null);
    }
  };

  const openScheduleDialog = (contentId: string) => {
    setSchedulingContentId(contentId);
    // Default to tomorrow at 9:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const localDateTime = tomorrow.toISOString().slice(0, 16);
    setScheduledDateTime(localDateTime);
    setScheduleDialogOpen(true);
  };

  const handleSchedule = async () => {
    if (!schedulingContentId || !scheduledDateTime) return;

    setIsScheduling(true);
    setPublishMessage(null);
    try {
      // Convert local datetime to ISO string
      const scheduledFor = new Date(scheduledDateTime).toISOString();
      // Get selected images for this content
      const selectedImageIds = getSelectedImageIds(schedulingContentId);

      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: schedulingContentId,
          scheduledFor,
          selectedImageIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishMessage({ type: "success", text: `Scheduled for ${new Date(scheduledFor).toLocaleString()}` });
        // Update local state
        setContent((prev) =>
          prev.map((c) =>
            c.id === schedulingContentId
              ? { ...c, status: "scheduled", scheduled_for: scheduledFor }
              : c
          )
        );
        setScheduleDialogOpen(false);
        setTimeout(() => setPublishMessage(null), 3000);
      } else {
        setPublishMessage({ type: "error", text: data.error || "Failed to schedule" });
        setTimeout(() => setPublishMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error scheduling:", err);
      setPublishMessage({ type: "error", text: "Network error - please try again" });
      setTimeout(() => setPublishMessage(null), 5000);
    } finally {
      setIsScheduling(false);
    }
  };

  const openMagicScheduleDialog = async (contentId: string) => {
    const contentItem = content.find(c => c.id === contentId);
    if (!contentItem) return;

    setMagicScheduleContentId(contentId);
    setMagicSuggestion(null);
    setSelectedMagicTime(null);
    setIsLoadingMagicSuggestion(true);
    setMagicScheduleDialogOpen(true);

    try {
      const res = await fetch("/api/schedule/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          brandId: selectedBrand?.id,
          platform: contentItem.platform,
        }),
      });
      const data = await res.json();
      if (data.success && data.suggestion) {
        setMagicSuggestion(data.suggestion);
        setSelectedMagicTime(data.suggestion.suggestedTime);
      } else {
        // Fallback to a reasonable default if API fails
        const fallbackTime = new Date();
        fallbackTime.setDate(fallbackTime.getDate() + 1);
        fallbackTime.setHours(9, 0, 0, 0);
        setMagicSuggestion({
          suggestedTime: fallbackTime.toISOString(),
          reasoning: "We suggest posting tomorrow morning for optimal engagement.",
          alternatives: [
            {
              time: (() => {
                const t = new Date();
                t.setDate(t.getDate() + 1);
                t.setHours(12, 0, 0, 0);
                return t.toISOString();
              })(),
              label: "Tomorrow at 12:00 PM",
            },
            {
              time: (() => {
                const t = new Date();
                t.setDate(t.getDate() + 1);
                t.setHours(17, 0, 0, 0);
                return t.toISOString();
              })(),
              label: "Tomorrow at 5:00 PM",
            },
          ],
        });
        setSelectedMagicTime(fallbackTime.toISOString());
      }
    } catch (err) {
      console.error("Error fetching magic schedule suggestion:", err);
      // Fallback to a reasonable default
      const fallbackTime = new Date();
      fallbackTime.setDate(fallbackTime.getDate() + 1);
      fallbackTime.setHours(9, 0, 0, 0);
      setMagicSuggestion({
        suggestedTime: fallbackTime.toISOString(),
        reasoning: "We suggest posting tomorrow morning for optimal engagement.",
        alternatives: [],
      });
      setSelectedMagicTime(fallbackTime.toISOString());
    } finally {
      setIsLoadingMagicSuggestion(false);
    }
  };

  const handleMagicSchedule = async () => {
    if (!magicScheduleContentId || !selectedMagicTime) return;

    setIsScheduling(true);
    setPublishMessage(null);
    try {
      // Get selected images for this content
      const selectedImageIds = getSelectedImageIds(magicScheduleContentId);

      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: magicScheduleContentId,
          scheduledFor: selectedMagicTime,
          selectedImageIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishMessage({ type: "success", text: `Scheduled for ${new Date(selectedMagicTime).toLocaleString()}` });
        // Update local state
        setContent((prev) =>
          prev.map((c) =>
            c.id === magicScheduleContentId
              ? { ...c, status: "scheduled", scheduled_for: selectedMagicTime }
              : c
          )
        );
        setMagicScheduleDialogOpen(false);
        setTimeout(() => setPublishMessage(null), 3000);
      } else {
        setPublishMessage({ type: "error", text: data.error || "Failed to schedule" });
        setTimeout(() => setPublishMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error scheduling:", err);
      setPublishMessage({ type: "error", text: "Network error - please try again" });
      setTimeout(() => setPublishMessage(null), 5000);
    } finally {
      setIsScheduling(false);
    }
  };

  const formatMagicTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Open bulk magic schedule dialog and fetch suggestions for all approved content
  const openBulkMagicDialog = async () => {
    // Get all approved content
    const approvedContent = content.filter(c => c.status === "approved");
    if (approvedContent.length === 0) return;

    setBulkSuggestions([]);
    setBulkScheduleResults(null);
    setBulkScheduleProgress(null);
    setIsLoadingBulkSuggestions(true);
    setBulkMagicDialogOpen(true);

    try {
      const res = await fetch("/api/schedule/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentIds: approvedContent.map(c => c.id),
          brandId: selectedBrand?.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        // Enrich suggestions with content info
        const enrichedSuggestions = data.suggestions.map((suggestion: { contentId: string; suggestedTime: string; reasoning: string; score: number }) => {
          const contentItem = approvedContent.find(c => c.id === suggestion.contentId);
          return {
            ...suggestion,
            platform: contentItem?.platform,
            concept: contentItem?.ideas?.concept || contentItem?.copy_primary?.slice(0, 50),
          };
        });
        setBulkSuggestions(enrichedSuggestions);
      } else {
        console.error("Failed to get bulk suggestions:", data.error);
      }
    } catch (err) {
      console.error("Error fetching bulk magic suggestions:", err);
    } finally {
      setIsLoadingBulkSuggestions(false);
    }
  };

  // Schedule all content items with their suggested times
  const handleBulkMagicSchedule = async () => {
    if (bulkSuggestions.length === 0) return;

    setIsSchedulingBulk(true);
    setBulkScheduleProgress({ current: 0, total: bulkSuggestions.length });
    const successes: string[] = [];
    const failures: string[] = [];

    for (let i = 0; i < bulkSuggestions.length; i++) {
      const suggestion = bulkSuggestions[i];
      setBulkScheduleProgress({ current: i + 1, total: bulkSuggestions.length });

      try {
        // Get selected images for this content
        const selectedImageIds = getSelectedImageIds(suggestion.contentId);

        const res = await fetch("/api/content/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentId: suggestion.contentId,
            scheduledFor: suggestion.suggestedTime,
            selectedImageIds,
          }),
        });
        const data = await res.json();
        if (data.success) {
          successes.push(suggestion.contentId);
          // Update local state for this content item
          setContent((prev) =>
            prev.map((c) =>
              c.id === suggestion.contentId
                ? { ...c, status: "scheduled", scheduled_for: suggestion.suggestedTime }
                : c
            )
          );
        } else {
          failures.push(suggestion.contentId);
        }
      } catch (err) {
        console.error(`Error scheduling content ${suggestion.contentId}:`, err);
        failures.push(suggestion.contentId);
      }
    }

    setBulkScheduleResults({ successes, failures });
    setIsSchedulingBulk(false);
    setBulkScheduleProgress(null);

    // Show success message if all succeeded
    if (failures.length === 0) {
      setPublishMessage({ type: "success", text: `Successfully scheduled ${successes.length} posts!` });
      setTimeout(() => {
        setBulkMagicDialogOpen(false);
        setPublishMessage(null);
      }, 2000);
    }
  };

  // Calculate date range for bulk suggestions
  const getBulkScheduleSummary = () => {
    if (bulkSuggestions.length === 0) return null;

    const times = bulkSuggestions.map(s => new Date(s.suggestedTime).getTime());
    const earliest = new Date(Math.min(...times));
    const latest = new Date(Math.max(...times));
    const daysDiff = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      count: bulkSuggestions.length,
      days: daysDiff,
      startDate: earliest.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      endDate: latest.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  };

  const handleDownloadImage = (url: string, platform: string, slideNumber?: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = slideNumber ? `${platform}-slide-${slideNumber}.png` : `${platform}-image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const togglePrompt = (key: string) => {
    setExpandedPrompts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/content?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setContent((prev) => prev.filter((c) => c.id !== id));
        setDeleteConfirmId(null);
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        setErrorMessage(data.error || "Failed to delete content");
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error("Error deleting content:", err);
      setErrorMessage("Network error - please try again");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === content.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(content.map((c) => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    setIsBulkDeleting(true);
    setErrorMessage(null);

    const results = await Promise.allSettled(
      Array.from(selectedItems).map((id) =>
        fetch(`/api/content?id=${id}`, { method: "DELETE" }).then((r) => r.json())
      )
    );

    const successfulDeletes: string[] = [];
    const failedDeletes: string[] = [];

    results.forEach((result, index) => {
      const id = Array.from(selectedItems)[index];
      if (result.status === "fulfilled" && result.value.success) {
        successfulDeletes.push(id);
      } else {
        failedDeletes.push(id);
      }
    });

    if (successfulDeletes.length > 0) {
      setContent((prev) => prev.filter((c) => !successfulDeletes.includes(c.id)));
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        successfulDeletes.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }

    if (failedDeletes.length > 0) {
      setErrorMessage(`Failed to delete ${failedDeletes.length} item(s). They may have been deleted already.`);
      setTimeout(() => setErrorMessage(null), 5000);
    }

    setIsBulkDeleting(false);
  };

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) return;
    setIsBulkApproving(true);
    setErrorMessage(null);

    const results = await Promise.allSettled(
      Array.from(selectedItems).map((id) =>
        fetch("/api/content", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: "approved" }),
        }).then((r) => r.json())
      )
    );

    const successfulApprovals: string[] = [];
    const failedApprovals: string[] = [];

    results.forEach((result, index) => {
      const id = Array.from(selectedItems)[index];
      if (result.status === "fulfilled" && result.value.success) {
        successfulApprovals.push(id);
      } else {
        failedApprovals.push(id);
      }
    });

    if (successfulApprovals.length > 0) {
      setContent((prev) =>
        prev.map((c) =>
          successfulApprovals.includes(c.id) ? { ...c, status: "approved" } : c
        )
      );
      setSelectedItems(new Set());
    }

    if (failedApprovals.length > 0) {
      setErrorMessage(`Failed to approve ${failedApprovals.length} item(s)`);
      setTimeout(() => setErrorMessage(null), 5000);
    }

    setIsBulkApproving(false);
  };

  const getContentImages = (contentId: string): ContentImage[] => {
    return images[contentId] || [];
  };

  const hasGeneratedImage = (contentId: string): boolean => {
    const contentImages = getContentImages(contentId);
    return contentImages.some((img) => img.url && !img.url.startsWith("placeholder:"));
  };

  const getSlideImages = (contentId: string, slideNumber: number): CarouselImage[] => {
    const slideImgs = slideImages[contentId]?.[slideNumber] || [];
    if (slideImgs.length === 0 && slideNumber > 0) {
      return slideImages[contentId]?.[0] || [];
    }
    return slideImgs;
  };

  const getAllContentImages = (contentId: string): (CarouselImage & { mediaType?: string })[] => {
    const contentImgs = images[contentId] || [];
    return contentImgs
      .filter(img => img.url && !img.url.startsWith("placeholder:"))
      .map(img => ({
        id: img.id,
        url: img.url,
        model: img.model,
        mediaType: img.media_type,
        prompt: img.prompt,
      }));
  };

  const isSlideGenerating = (contentId: string, slideNumber: number): boolean => {
    return (generatingSlides[contentId] || []).includes(slideNumber);
  };

  const normalizeSlide = (slide: CarouselSlide | string | unknown): CarouselSlide | null => {
    if (!slide) return null;

    let obj: Record<string, unknown> | null = null;

    if (typeof slide === "object") {
      obj = slide as Record<string, unknown>;
    } else if (typeof slide === "string") {
      try {
        const parsed = JSON.parse(slide);
        if (parsed && typeof parsed === "object") {
          obj = parsed;
        }
      } catch {
        return null;
      }
    }

    // Allow slides with just text (imagePrompt is now generated on-demand)
    if (obj && "text" in obj) {
      return {
        slideNumber: typeof obj.slideNumber === "number" ? obj.slideNumber : 1,
        text: String(obj.text || ""),
        imagePrompt: obj.imagePrompt ? String(obj.imagePrompt) : undefined,
      };
    }

    return null;
  };

  const parseCarouselSlides = (slides: CarouselSlide[] | string[] | null): { parsed: CarouselSlide[] | null; legacy: string[] | null } => {
    if (!slides || slides.length === 0) return { parsed: null, legacy: null };

    const validSlides: CarouselSlide[] = [];
    const legacySlides: string[] = [];

    slides.forEach((slide, index) => {
      const normalized = normalizeSlide(slide);
      if (normalized) {
        normalized.slideNumber = normalized.slideNumber || index + 1;
        validSlides.push(normalized);
      } else if (typeof slide === "string" && !slide.trim().startsWith("{")) {
        legacySlides.push(slide);
      }
    });

    if (validSlides.length > 0) {
      return { parsed: validSlides, legacy: null };
    }

    return { parsed: null, legacy: legacySlides.length > 0 ? legacySlides : null };
  };

  const getPostType = (item: Content): string => {
    if (item.copy_carousel_slides && item.copy_carousel_slides.length > 0) {
      return "Carousel";
    }
    if (item.copy_thread_parts && item.copy_thread_parts.length > 0) {
      return "Thread";
    }
    return "Single Post";
  };

  const getCurrentSlide = (contentId: string): number => {
    return currentSlideIndex[contentId] || 0;
  };

  const setCurrentSlide = (contentId: string, index: number) => {
    setCurrentSlideIndex((prev) => ({ ...prev, [contentId]: index }));
  };

  const getVersionIndex = (contentId: string, slideNumber: number): number => {
    const key = `${contentId}-${slideNumber}`;
    return selectedVersionIndex[key] || 0;
  };

  const setVersionIndex = (contentId: string, slideNumber: number, index: number) => {
    const key = `${contentId}-${slideNumber}`;
    setSelectedVersionIndex((prev) => ({ ...prev, [key]: index }));
  };

  // Get the selected image IDs for publishing (one per slide based on user's variant selection)
  const getSelectedImageIds = (contentId: string): string[] => {
    const contentItem = content.find(c => c.id === contentId);
    if (!contentItem) return [];

    const { parsed: carouselSlides } = parseCarouselSlides(contentItem.copy_carousel_slides);

    if (carouselSlides && carouselSlides.length > 0) {
      // Carousel: get selected variant for each slide
      const selectedIds: string[] = [];
      for (const slide of carouselSlides) {
        const slideImgs = getSlideImages(contentId, slide.slideNumber);
        if (slideImgs.length > 0) {
          const versionIdx = getVersionIndex(contentId, slide.slideNumber);
          const safeIdx = Math.min(versionIdx, slideImgs.length - 1);
          const selectedImg = slideImgs[safeIdx];
          if (selectedImg?.id) {
            selectedIds.push(selectedImg.id);
          }
        }
      }
      return selectedIds;
    } else {
      // Single image post: get the first valid image
      const contentImgs = images[contentId] || [];
      const validImg = contentImgs.find(img => img.url && !img.url.startsWith("placeholder:"));
      return validImg ? [validImg.id] : [];
    }
  };

  // Helper to extract visual style string from carouselStyle (which can be string or object)
  const getCarouselStyleId = (carouselStyle: string | { visualStyle?: string } | null | undefined): string => {
    if (!carouselStyle) return "typography";
    if (typeof carouselStyle === "string") return carouselStyle;
    if (typeof carouselStyle === "object" && carouselStyle.visualStyle) return carouselStyle.visualStyle;
    return "typography";
  };

  const truncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const { draftCount, approvedCount, scheduledCount, publishedCount } = useMemo(() => ({
    draftCount: content.filter((c) => c.status === "draft").length,
    approvedCount: content.filter((c) => c.status === "approved").length,
    scheduledCount: content.filter((c) => c.status === "scheduled").length,
    publishedCount: content.filter((c) => c.status === "published").length,
  }), [content]);

  // Kanban board columns configuration
  const kanbanColumns = [
    {
      id: "draft",
      title: "Draft",
      color: "bg-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      count: draftCount,
      icon: <Pencil className="h-4 w-4" />
    },
    {
      id: "approved",
      title: "Approved",
      color: "bg-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      count: approvedCount,
      icon: <CheckCircle2 className="h-4 w-4" />
    },
    {
      id: "scheduled",
      title: "Scheduled",
      color: "bg-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      count: scheduledCount,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: "published",
      title: "Published",
      color: "bg-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      count: publishedCount,
      icon: <Send className="h-4 w-4" />
    },
  ];

  // Render a single Kanban card
  const renderKanbanCard = (item: Content) => {
    const hasCarousel = !!(item.copy_carousel_slides && item.copy_carousel_slides.length > 0);
    const { parsed: carouselSlides } = parseCarouselSlides(item.copy_carousel_slides);
    const totalSlides = carouselSlides?.length || 0;
    const postType = getPostType(item);
    const allImages = getAllContentImages(item.id);
    const hasImages = hasGeneratedImage(item.id);

    return (
      <div
        key={item.id}
        className="group rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
        onClick={() => {
          setExpandedCards(new Set([item.id]));
          setFilter(item.status);
        }}
      >
        {/* Image Preview */}
        {hasImages && allImages[0] && (
          <div className="relative mb-3 aspect-[4/3] rounded-md overflow-hidden">
            <img
              src={allImages[0].url}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {hasCarousel && totalSlides > 1 && (
              <Badge className="absolute top-1.5 right-1.5 bg-black/70 text-white border-0 text-xs">
                <Images className="h-3 w-3 mr-1" />
                {totalSlides}
              </Badge>
            )}
          </div>
        )}

        {/* Platform Icon */}
        <div className="flex items-start gap-2 mb-2">
          <div className={cn("p-1.5 rounded", platformColors[item.platform] || "bg-gray-500")}>
            {platformIcons[item.platform] || <FileText className="h-3 w-3 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-2">
              {String(item.ideas?.concept || item.copy_primary?.slice(0, 60) || "")}
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {postType}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(item.created_at)}
          </span>
        </div>

        {/* Quick action on hover */}
        <div className="mt-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
          {item.status === "draft" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-full text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(item.id);
              }}
            >
              <Check className="h-3 w-3 mr-1" />
              Approve
            </Button>
          )}
          {item.status === "approved" && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 flex-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  openScheduleDialog(item.id);
                }}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Schedule
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 flex-1 text-xs bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-purple-300 hover:text-purple-200"
                onClick={(e) => {
                  e.stopPropagation();
                  openMagicScheduleDialog(item.id);
                }}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Magic
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the Kanban board
  const renderKanbanBoard = () => {
    return (
      <div className="grid grid-cols-4 gap-4 min-h-[600px]">
        {kanbanColumns.map((column) => {
          const columnItems = content.filter((c) => c.status === column.id);
          return (
            <div
              key={column.id}
              className={cn(
                "flex flex-col rounded-xl border-2",
                column.borderColor,
                column.bgColor
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg text-white", column.color)}>
                    {column.icon}
                  </div>
                  <span className="font-semibold">{column.title}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {column.count}
                </Badge>
              </div>

              {/* Column Content */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
                {columnItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs">No {column.id} content</p>
                  </div>
                ) : (
                  columnItems.map((item) => renderKanbanCard(item))
                )}
              </div>

              {/* Column Footer - Flow indicator */}
              {column.id !== "published" && (
                <div className="p-2 border-t border-inherit flex justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderModelBadge = (model: string) => {
    const modelKey = model as ImageModelKey;
    if (!IMAGE_MODELS[modelKey]) return null;
    return (
      <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
        {IMAGE_MODELS[modelKey].speed === "fast" ? (
          <Zap className="h-3 w-3 mr-1" />
        ) : (
          <Brain className="h-3 w-3 mr-1" />
        )}
        {IMAGE_MODELS[modelKey].name}
      </Badge>
    );
  };

  // Render 3-column layout: Left (slide content), Center (carousel), Right (caption)
  const renderSlideFilmstripAndDetail = (
    item: Content,
    slides: CarouselSlide[],
    currentSlideIdx: number
  ) => {
    const slide = slides[currentSlideIdx];
    if (!slide) return null;

    const slideImgs = getSlideImages(item.id, slide.slideNumber);
    const versionIdx = getVersionIndex(item.id, slide.slideNumber);
    const safeVersionIdx = Math.min(versionIdx, Math.max(0, slideImgs.length - 1));
    const isGenerating = isSlideGenerating(item.id, slide.slideNumber);

    // Get slide image for any index
    const getSlideImage = (idx: number) => {
      const s = slides[idx];
      if (!s) return null;
      const imgs = getSlideImages(item.id, s.slideNumber);
      const vIdx = getVersionIndex(item.id, s.slideNumber);
      return imgs[Math.min(vIdx, imgs.length - 1)] || null;
    };

    // Calculate card positions for fanned/overlapping effect
    // Larger cards to fill vertical space, with more overlap so side cards go behind
    const cardWidth = 320;
    const cardOverlap = 220; // Heavy overlap so side cards peek out less
    const visibleCardWidth = cardWidth - cardOverlap;

    return (
      <div
        id="slides-container"
        className="flex h-[580px] gap-4"
        style={{ userSelect: isDraggingDivider ? 'none' : 'auto' }}
      >
        {/* Left Panel: Slide Content */}
        <div className="w-[260px] flex-shrink-0 flex flex-col border-r border-muted/30 pr-3 overflow-y-auto">
          {/* Image/Video Toggle at the top */}
          <Tabs defaultValue="image" value={mediaMode} onValueChange={(v) => setMediaMode(v as "image" | "video")} className="flex-1 flex flex-col">
            <TabsList className="w-full h-8 mb-3">
              <TabsTrigger value="image" className="flex-1 text-xs h-7">
                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="flex-1 text-xs h-7">
                <Video className="h-3.5 w-3.5 mr-1.5" />
                Video
              </TabsTrigger>
            </TabsList>

            {/* Image Mode Content */}
            <TabsContent value="image" className="flex-1 flex flex-col mt-0 space-y-2 overflow-y-auto">
              {/* Model Selector */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Model</label>
                <select
                  className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ImageModelKey)}
                >
                  {MODEL_OPTIONS.map((model) => (
                    <option key={model.key} value={model.key}>{model.name}</option>
                  ))}
                </select>
              </div>

              {/* Visual Style Selector */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Visual Style</label>
                <div className="flex gap-1">
                  <select
                    className="flex-1 h-7 rounded-md border border-input bg-background px-2 text-xs"
                    value={selectedVisualStyle[item.id] || getCarouselStyleId(item.metadata?.carouselStyle)}
                    onChange={(e) => setSelectedVisualStyle((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  >
                    {visualStyleOptions.map((style) => (
                      <option key={style.id} value={style.id}>{style.label}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRegenerateStyle(item.id, slides, false)}
                    disabled={regeneratingStyle === item.id}
                    title="Regenerate style design system"
                  >
                    {regeneratingStyle === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                  {/* Presets Menu */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        title="Style presets"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="end">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground px-1">Style Presets</div>
                        {/* Save current design system */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-7 text-xs"
                          onClick={() => openSavePresetDialog(item.id)}
                          disabled={!item.metadata?.designSystems?.[selectedVisualStyle[item.id] || getCarouselStyleId(item.metadata?.carouselStyle)]}
                        >
                          <Save className="h-3 w-3 mr-2" />
                          Save current style
                        </Button>
                        {/* Load saved presets */}
                        {selectedBrand?.visual_config?.savedDesignSystems && selectedBrand.visual_config.savedDesignSystems.length > 0 ? (
                          <>
                            <div className="border-t border-muted my-1" />
                            <div className="text-[10px] text-muted-foreground px-1 py-1">Saved Presets</div>
                            {selectedBrand.visual_config.savedDesignSystems.map((preset) => (
                              <div key={preset.id} className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 justify-start h-7 text-xs"
                                  onClick={() => handleLoadPreset(item.id, preset)}
                                  disabled={loadingPreset === item.id}
                                >
                                  <FolderOpen className="h-3 w-3 mr-2" />
                                  <span className="truncate">{preset.name}</span>
                                  <span className="ml-auto text-[10px] text-muted-foreground">{preset.visualStyle}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeletePreset(preset.id)}
                                  title="Delete preset"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-[10px] text-muted-foreground px-1 py-2">
                            No saved presets yet. Generate images, then save the style to reuse it.
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Generate All Images Button */}
              <Button
                className="w-full h-8 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleGenerateAllWithPrompts(item.id, slides)}
                disabled={Object.keys(generatingSlides[item.id] || {}).length > 0 || generatingPrompt === item.id}
              >
                {generatingPrompt === item.id ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="mr-2 h-3.5 w-3.5" />
                )}
                <span className="text-xs">{slides.length > 1 ? "Generate all images" : "Generate image"}</span>
              </Button>

              {/* Divider */}
              <div className="border-t border-muted/30 my-1" />

              {/* SLIDE CONTENT Section */}
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Slide Content</div>

              {/* Slide Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Slide Text:</span>
                  <div className="flex gap-0.5">
                    {editingSlideText?.contentId === item.id && editingSlideText?.slideNumber === slide.slideNumber ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingSlideText(null); setEditedSlideText(""); }}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleSaveSlideText(item.id, slide.slideNumber, editedSlideText)} disabled={savingSlideText}>
                          {savingSlideText ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" className="h-5 w-5" title="Edit" onClick={() => { setEditingSlideText({ contentId: item.id, slideNumber: slide.slideNumber }); setEditedSlideText(slide.text); }}>
                          <Pencil className="h-2.5 w-2.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" title="Regenerate" disabled>
                          <RefreshCw className="h-2.5 w-2.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {editingSlideText?.contentId === item.id && editingSlideText?.slideNumber === slide.slideNumber ? (
                  <Textarea value={editedSlideText} onChange={(e) => setEditedSlideText(e.target.value)} className="min-h-[50px] text-xs p-2" placeholder="Enter slide text..." />
                ) : (
                  <div className="text-xs leading-relaxed text-foreground">{slide.text}</div>
                )}
              </div>

              {/* Slide Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Slide Prompt:</span>
                  <div className="flex gap-0.5">
                    {editingImagePrompt?.contentId === item.id && editingImagePrompt?.slideNumber === slide.slideNumber ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-5 w-5" title="Cancel" onClick={() => { setEditingImagePrompt(null); setEditedImagePrompt(""); }}>
                          <X className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleSaveImagePrompt(item.id, slide.slideNumber, editedImagePrompt)} disabled={savingImagePrompt}>
                          {savingImagePrompt ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" className="h-5 w-5" title="Edit" onClick={() => { setEditingImagePrompt({ contentId: item.id, slideNumber: slide.slideNumber }); setEditedImagePrompt(slide.imagePrompt || ""); }}>
                          <Pencil className="h-2.5 w-2.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" title="Regenerate Prompt" onClick={() => handleRegeneratePromptOnly(item.id, slide)} disabled={isGenerating || generatingPrompt === `${item.id}-${slide.slideNumber}`}>
                          {generatingPrompt === `${item.id}-${slide.slideNumber}` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {editingImagePrompt?.contentId === item.id && editingImagePrompt?.slideNumber === slide.slideNumber ? (
                  <Textarea value={editedImagePrompt} onChange={(e) => setEditedImagePrompt(e.target.value)} className="min-h-[60px] max-h-[200px] text-[10px] p-2 resize-y" placeholder="Enter image prompt..." />
                ) : (
                  <div className="rounded bg-muted/30 p-2 text-[10px] text-muted-foreground leading-relaxed min-h-[60px] max-h-[200px] overflow-y-auto resize-y">
                    {slide.imagePrompt || <span className="italic">Prompt will be generated when you click Generate</span>}
                  </div>
                )}
              </div>

              {/* Style Variants */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Style Variants</span>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => slide.imagePrompt ? handleGenerateImage(item.id, slide.imagePrompt, slide.slideNumber) : handleGenerateWithPrompt(item.id, slide)} disabled={isGenerating || generatingPrompt !== null} title={slide.imagePrompt ? "Generate another image with the same prompt" : "Generate prompt and image"}>
                    {isGenerating || generatingPrompt === `${item.id}-${slide.slideNumber}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-1 h-3 w-3" />}
                    Generate Another
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {slideImgs.length > 0 ? (
                    slideImgs.map((img, idx) => (
                      <button key={img.id} onClick={() => setVersionIndex(item.id, slide.slideNumber, idx)} className={cn("aspect-[4/5] rounded overflow-hidden border-2 transition-all", idx === safeVersionIdx ? "border-primary ring-1 ring-primary/30" : "border-muted opacity-70 hover:opacity-100")} title={`Version ${idx + 1}`}>
                        <img src={img.url} alt={`v${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 py-4 text-center text-[10px] text-muted-foreground">No images generated yet</div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Video Mode Content */}
            <TabsContent value="video" className="flex-1 flex flex-col mt-0 space-y-2 overflow-y-auto">
              {/* Model Selector */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Model</label>
                <select
                  className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
                  value={selectedVideoModel}
                  onChange={(e) => setSelectedVideoModel(e.target.value as VideoModelKey)}
                >
                  {VIDEO_MODEL_OPTIONS.map((model) => (
                    <option key={model.key} value={model.key}>{model.name} - ${model.costPerSecond}/sec</option>
                  ))}
                </select>
              </div>

              {/* Visual Style Selector */}
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Visual Style</label>
                <div className="flex gap-1">
                  <select
                    className="flex-1 h-7 rounded-md border border-input bg-background px-2 text-xs"
                    value={selectedVisualStyle[item.id] || getCarouselStyleId(item.metadata?.carouselStyle)}
                    onChange={(e) => setSelectedVisualStyle((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  >
                    {visualStyleOptions.map((style) => (
                      <option key={style.id} value={style.id}>{style.label}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRegenerateStyle(item.id, slides, false)}
                    disabled={regeneratingStyle === item.id}
                    title="Regenerate style design system"
                  >
                    {regeneratingStyle === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                  {/* Presets Menu (Video Tab) */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        title="Style presets"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="end">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground px-1">Style Presets</div>
                        {/* Save current design system */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-7 text-xs"
                          onClick={() => openSavePresetDialog(item.id)}
                          disabled={!item.metadata?.designSystems?.[selectedVisualStyle[item.id] || getCarouselStyleId(item.metadata?.carouselStyle)]}
                        >
                          <Save className="h-3 w-3 mr-2" />
                          Save current style
                        </Button>
                        {/* Load saved presets */}
                        {selectedBrand?.visual_config?.savedDesignSystems && selectedBrand.visual_config.savedDesignSystems.length > 0 ? (
                          <>
                            <div className="border-t border-muted my-1" />
                            <div className="text-[10px] text-muted-foreground px-1 py-1">Saved Presets</div>
                            {selectedBrand.visual_config.savedDesignSystems.map((preset) => (
                              <div key={preset.id} className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-1 justify-start h-7 text-xs"
                                  onClick={() => handleLoadPreset(item.id, preset)}
                                  disabled={loadingPreset === item.id}
                                >
                                  <FolderOpen className="h-3 w-3 mr-2" />
                                  <span className="truncate">{preset.name}</span>
                                  <span className="ml-auto text-[10px] text-muted-foreground">{preset.visualStyle}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeletePreset(preset.id)}
                                  title="Delete preset"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-[10px] text-muted-foreground px-1 py-2">
                            No saved presets yet. Generate images, then save the style to reuse it.
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Duration and Audio Settings */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Duration</label>
                  <select
                    className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                  >
                    <option value={3}>3 sec</option>
                    <option value={4}>4 sec</option>
                    <option value={5}>5 sec</option>
                    <option value={6}>6 sec</option>
                    <option value={7}>7 sec</option>
                    <option value={8}>8 sec</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Audio</label>
                  <button
                    className={cn(
                      "w-full h-7 rounded-md border px-2 text-xs flex items-center justify-center gap-1.5 transition-colors",
                      includeAudio
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "bg-background border-input text-muted-foreground hover:border-purple-500/50"
                    )}
                    onClick={() => setIncludeAudio(!includeAudio)}
                  >
                    {includeAudio ? (
                      <>
                        <Check className="h-3 w-3" />
                        On
                      </>
                    ) : (
                      "Off"
                    )}
                  </button>
                </div>
              </div>

              {/* Cost Estimate */}
              {(() => {
                const estimate = estimateVideoCost(selectedVideoModel, videoDuration, includeAudio);
                const totalForAllSlides = estimate.totalCost * slides.length;
                return (
                  <div className="rounded-lg bg-muted/40 border border-muted p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground">Estimated Cost</span>
                      <span className="text-sm font-semibold text-foreground">
                        ${totalForAllSlides.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[9px] text-muted-foreground space-y-0.5">
                      <div className="flex justify-between">
                        <span>Video ({videoDuration}s × ${VIDEO_MODELS[selectedVideoModel].costPerSecond}/s)</span>
                        <span>${(videoDuration * VIDEO_MODELS[selectedVideoModel].costPerSecond * slides.length).toFixed(2)}</span>
                      </div>
                      {includeAudio && (
                        <div className="flex justify-between">
                          <span>Audio ({videoDuration}s × ${VIDEO_MODELS[selectedVideoModel].audioCostPerSecond}/s)</span>
                          <span>${(videoDuration * VIDEO_MODELS[selectedVideoModel].audioCostPerSecond * slides.length).toFixed(2)}</span>
                        </div>
                      )}
                      {slides.length > 1 && (
                        <div className="flex justify-between pt-0.5 border-t border-muted mt-1">
                          <span>× {slides.length} videos</span>
                          <span className="font-medium">${totalForAllSlides.toFixed(2)} total</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Generate All Videos Button */}
              <Button
                className="w-full h-8 bg-purple-600 hover:bg-purple-700"
                onClick={() => handleGenerateAllVideos(item.id, slides)}
                disabled={Object.keys(generatingSlides[item.id] || {}).length > 0 || generatingAllVideos === item.id}
              >
                {generatingAllVideos === item.id ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Video className="mr-2 h-3.5 w-3.5" />
                )}
                <span className="text-xs">{slides.length > 1 ? "Generate all videos" : "Generate video"}</span>
              </Button>

              {/* Divider */}
              <div className="border-t border-muted/30 my-1" />

              {/* Video Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Video Prompt:</span>
                  <div className="flex gap-0.5">
                    {editingVideoPrompt?.contentId === item.id && editingVideoPrompt?.slideNumber === slide.slideNumber ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-5 w-5" title="Cancel" onClick={() => { setEditingVideoPrompt(null); setEditedVideoPrompt(""); }}>
                          <X className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleSaveVideoPrompt(item.id, slide.slideNumber, editedVideoPrompt)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" className="h-5 w-5" title="Edit" onClick={() => { setEditingVideoPrompt({ contentId: item.id, slideNumber: slide.slideNumber }); setEditedVideoPrompt(videoPrompts[`${item.id}-${slide.slideNumber}`] || ""); }}>
                          <Pencil className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          title="Regenerate"
                          onClick={async () => {
                            const key = `${item.id}-${slide.slideNumber}`;
                            setGeneratingPrompt(key);
                            try {
                              const currentStyle = selectedVisualStyle[item.id] || getCarouselStyleId(item.metadata?.carouselStyle);
                              const promptResponse = await fetch("/api/prompts/generate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  contentId: item.id,
                                  slides: [{ slideNumber: slide.slideNumber, text: slide.text }],
                                  visualStyle: currentStyle,
                                  mediaType: "video",
                                  brandId: selectedBrand?.id,
                                }),
                              });
                              const promptData = await promptResponse.json();
                              if (promptData.success && promptData.prompts[0]) {
                                setVideoPrompts((prev) => ({ ...prev, [key]: promptData.prompts[0].prompt }));
                              }
                            } finally {
                              setGeneratingPrompt(null);
                            }
                          }}
                          disabled={generatingPrompt === `${item.id}-${slide.slideNumber}`}
                        >
                          {generatingPrompt === `${item.id}-${slide.slideNumber}` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {editingVideoPrompt?.contentId === item.id && editingVideoPrompt?.slideNumber === slide.slideNumber ? (
                  <Textarea value={editedVideoPrompt} onChange={(e) => setEditedVideoPrompt(e.target.value)} className="min-h-[60px] max-h-[200px] text-[10px] p-2 resize-y" placeholder="Enter video prompt..." />
                ) : (
                  <div className="rounded bg-muted/30 p-2 text-[10px] text-muted-foreground leading-relaxed min-h-[60px] max-h-[200px] overflow-y-auto resize-y">
                    {videoPrompts[`${item.id}-${slide.slideNumber}`] || <span className="italic">Video prompt will be generated when you click Generate</span>}
                  </div>
                )}
              </div>

              {/* Style Variants - shows both images and videos */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Style Variants</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={async () => {
                      const key = `${item.id}-${slide.slideNumber}`;
                      const existingPrompt = videoPrompts[key];
                      if (existingPrompt) {
                        await handleGenerateVideo(item.id, slide.slideNumber, existingPrompt);
                      } else {
                        // Generate prompt first, then video
                        setGeneratingPrompt(key);
                        try {
                          const currentStyle = selectedVisualStyle[item.id] || getCarouselStyleId(item.metadata?.carouselStyle);
                          const promptResponse = await fetch("/api/prompts/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              contentId: item.id,
                              slides: [{ slideNumber: slide.slideNumber, text: slide.text }],
                              visualStyle: currentStyle,
                              mediaType: "video",
                              brandId: selectedBrand?.id,
                            }),
                          });
                          const promptData = await promptResponse.json();
                          if (promptData.success && promptData.prompts[0]) {
                            const newPrompt = promptData.prompts[0].prompt;
                            setVideoPrompts((prev) => ({ ...prev, [key]: newPrompt }));
                            await handleGenerateVideo(item.id, slide.slideNumber, newPrompt);
                          }
                        } finally {
                          setGeneratingPrompt(null);
                        }
                      }
                    }}
                    disabled={isGenerating || generatingPrompt !== null}
                  >
                    {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Video className="mr-1 h-3 w-3" />}
                    Generate Another
                  </Button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-2">
                  {slideImgs.length > 0 ? (
                    slideImgs.map((img, idx) => {
                      const isVideo = img.url?.includes('video') || img.url?.startsWith('data:video');
                      return (
                        <button
                          key={img.id}
                          onClick={() => setVersionIndex(item.id, slide.slideNumber, idx)}
                          className={cn(
                            "flex-shrink-0 w-20 aspect-[4/5] rounded overflow-hidden border-2 transition-all relative",
                            idx === safeVersionIdx ? "border-primary ring-1 ring-primary/30" : "border-muted opacity-70 hover:opacity-100"
                          )}
                          title={`Version ${idx + 1}${isVideo ? ' (Video)' : ' (Image)'}`}
                        >
                          {isVideo ? (
                            <>
                              <video src={img.url} className="w-full h-full object-cover" muted />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="h-4 w-4 text-white" />
                              </div>
                            </>
                          ) : (
                            <img src={img.url} alt={`v${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="w-full py-4 text-center text-[10px] text-muted-foreground">No media generated yet</div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center: Carousel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Fanned card carousel */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-muted/20">
            {/* Left Arrow */}
            <Button
              size="icon"
              variant="outline"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-background/90 backdrop-blur shadow-lg"
              onClick={() => setCurrentSlide(item.id, currentSlideIdx > 0 ? currentSlideIdx - 1 : slides.length - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Fanned overlapping cards */}
            <div className="relative flex items-center justify-center h-full w-full">
              {slides.map((s, idx) => {
                const cardImage = getSlideImage(idx);
                const isCurrent = idx === currentSlideIdx;
                const offset = idx - currentSlideIdx;

                const translateX = offset * visibleCardWidth;
                const scale = isCurrent ? 1 : 0.85;
                const zIndex = isCurrent ? 20 : 10 - Math.abs(offset);
                const opacity = Math.abs(offset) > 2 ? 0 : isCurrent ? 1 : 0.7;

                return (
                  <div
                    key={s.slideNumber}
                    className={cn(
                      "absolute rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out shadow-xl",
                      isCurrent && "ring-2 ring-primary shadow-2xl"
                    )}
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardWidth * 1.25}px`,
                      transform: `translateX(${translateX}px) scale(${scale})`,
                      zIndex,
                      opacity,
                    }}
                    onClick={() => setCurrentSlide(item.id, idx)}
                  >
                    {cardImage ? (
                      <div className="relative w-full h-full">
                        {cardImage.mediaType === "video" ? (
                          <>
                            <video
                              src={cardImage.url}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              playsInline
                              autoPlay={isCurrent}
                            />
                            {!isCurrent && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                  <Play className="h-6 w-6 text-black ml-1" fill="currentColor" />
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <img
                            src={cardImage.url}
                            alt={`Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <Badge
                          className={cn(
                            "absolute top-2 right-2 border-0",
                            isCurrent ? "bg-primary text-primary-foreground" : "bg-black/60 text-white"
                          )}
                        >
                          {cardImage.mediaType === "video" && <Video className="h-3 w-3 mr-1" />}
                          {idx + 1}
                        </Badge>
                        {isCurrent && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white border-0 h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(cardImage.url, item.platform, s.slideNumber);
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-muted/80 flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto mb-1 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{idx + 1}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Arrow */}
            <Button
              size="icon"
              variant="outline"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-background/90 backdrop-blur shadow-lg"
              onClick={() => setCurrentSlide(item.id, currentSlideIdx < slides.length - 1 ? currentSlideIdx + 1 : 0)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Thumbnail strip */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {slides.map((s, idx) => {
              const thumbImage = getSlideImage(idx);
              const isCurrent = idx === currentSlideIdx;
              const isVideo = thumbImage?.mediaType === "video";
              return (
                <button
                  key={s.slideNumber}
                  onClick={() => setCurrentSlide(item.id, idx)}
                  className={cn(
                    "w-16 h-20 rounded-lg overflow-hidden border-2 transition-all relative",
                    isCurrent
                      ? "border-primary ring-2 ring-primary/30 scale-105"
                      : "border-muted opacity-60 hover:opacity-100"
                  )}
                >
                  {thumbImage ? (
                    <>
                      {isVideo ? (
                        <video src={thumbImage.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={thumbImage.url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                      )}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="h-4 w-4 text-white" fill="currentColor" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{idx + 1}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Draggable Divider */}
        <div
          className={cn(
            "w-3 flex items-center justify-center cursor-col-resize group hover:bg-primary/10 transition-colors rounded",
            isDraggingDivider && "bg-primary/20"
          )}
          onMouseDown={() => setIsDraggingDivider(true)}
        >
          <div className={cn(
            "w-1 h-12 rounded-full bg-muted-foreground/30 group-hover:bg-primary/50 transition-colors",
            isDraggingDivider && "bg-primary"
          )} />
        </div>

        {/* Right Panel: Caption */}
        <div
          className="flex flex-col"
          style={{ width: `${captionPanelWidth}px` }}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">Caption</label>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 rounded-lg bg-muted/20 p-4 overflow-y-auto">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.copy_primary}</p>
            {item.copy_hashtags && item.copy_hashtags.length > 0 && (
              <p className="text-sm text-primary mt-4">
                {item.copy_hashtags.map((h) => `#${h}`).join(" ")}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            Review, edit, and publish generated content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchContent}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="outline">{draftCount} drafts</Badge>
          <Badge variant="outline">{approvedCount} approved</Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 items-center">
        {["draft", "approved", "scheduled", "published", ""].map((f) => (
          <Button
            key={f || "all"}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f || "All"}
          </Button>
        ))}

        {/* Magic Schedule All - only show on approved tab with approved items */}
        {filter === "approved" && approvedCount > 0 && (
          <Button
            size="sm"
            className="ml-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            onClick={openBulkMagicDialog}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Magic Schedule All ({approvedCount})
          </Button>
        )}
      </div>

      {/* Bulk Actions Bar - hidden in Kanban view */}
      {content.length > 0 && filter !== "" && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2"
              onClick={toggleSelectAll}
            >
              {selectedItems.size === content.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedItems.size === content.length ? "Deselect All" : "Select All"}
            </Button>
            {selectedItems.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedItems.size} selected
              </span>
            )}
          </div>
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                onClick={handleBulkApprove}
                disabled={isBulkApproving || isBulkDeleting}
              >
                {isBulkApproving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Approve ({selectedItems.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                onClick={handleBulkDelete}
                disabled={isBulkApproving || isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete ({selectedItems.size})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        </div>
      )}

      {/* Image Generation Message */}
      {imageMessage && (
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-primary">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {imageMessage}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <ContentGridSkeleton count={6} />}
      {/* Kanban Board View - when "All" filter is selected */}
      {!isLoading && filter === "" && content.length > 0 && renderKanbanBoard()}

      {/* Content List - Collapsible Cards (when specific filter selected) */}
      {!isLoading && filter !== "" && content.length > 0 && (
        <div className="space-y-2">
          {content.map((item) => {
            const isExpanded = expandedCards.has(item.id);
            const hasCarousel = !!(item.copy_carousel_slides && item.copy_carousel_slides.length > 0);
            // Check if this is single video content (visualStyle === "video" without carousel slides)
            const isSingleVideo = item.metadata?.visualStyle === "video" && !hasCarousel;
            const isMixedCarousel = item.metadata?.visualStyle === "mixed-carousel";
            const { parsed: carouselSlides } = parseCarouselSlides(item.copy_carousel_slides);
            const totalSlides = carouselSlides?.length || 0;
            const allSlidesApproved = totalSlides > 0 ? areAllSlidesApproved(item.id, totalSlides) : true;
            const postType = isSingleVideo ? "Video" : getPostType(item);
            const allImages = getAllContentImages(item.id);
            const currentSlide = getCurrentSlide(item.id);
            const hasImages = hasGeneratedImage(item.id);
            // Check if there's a video in the images
            const hasVideo = allImages.some((img) => img.mediaType === "video");

            return (
              <Card key={item.id} className="overflow-hidden">
                {/* Collapsed Header - Two Row Layout (matching Ideas cards) */}
                <div
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCard(item.id)}
                >
                  {/* Row 1: Main title row */}
                  <div className="flex items-center gap-3">
                    {/* Selection Checkbox */}
                    <button
                      className="text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                    >
                      {selectedItems.has(item.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>

                    {/* Expand Icon */}
                    <div className="text-muted-foreground">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>

                    {/* Platform Icon */}
                    <div className={`p-2 rounded-lg ${platformColors[item.platform] || "bg-gray-500"}`}>
                      {platformIcons[item.platform] || <FileText className="h-4 w-4 text-white" />}
                    </div>

                    {/* Image thumbnail preview */}
                    {hasImages && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={allImages[0]?.url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Title/Concept - Now with more room */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-snug">
                        {String(item.ideas?.concept || item.copy_primary?.slice(0, 80) || "")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                        {String(item.copy_primary?.slice(0, 120) || "")}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Quick Approve (only for drafts) */}
                      {item.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20"
                          onClick={() => handleApprove(item.id)}
                          title="Quick Approve"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopyToClipboard(
                          `${item.copy_primary}\n\n${item.copy_hashtags?.map(h => `#${h}`).join(" ") || ""}`,
                          item.id
                        )}
                        title="Copy to clipboard"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1 rounded-lg border border-red-500/50 bg-red-500/10 px-2">
                          <span className="text-xs text-red-400">Delete?</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/20"
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-white"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => setDeleteConfirmId(item.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Metadata row */}
                  <div className="flex items-center gap-3 mt-3 ml-[52px] flex-wrap">
                    {/* Theme Badge */}
                    {item.ideas?.angle && typeof item.ideas.angle === 'string' && (
                      <Badge variant="secondary" className="capitalize">
                        {item.ideas?.angle}
                      </Badge>
                    )}

                    {/* Platform indicator */}
                    <div className={cn(
                      "p-1.5 rounded",
                      platformColors[item.platform] || "bg-muted/50"
                    )}>
                      {platformIcons[item.platform]}
                    </div>

                    {/* Post Type Badge */}
                    <Badge variant="outline" className="text-xs">
                      {hasCarousel && <Images className="mr-1 h-3 w-3" />}
                      {postType}
                      {hasCarousel && ` (${totalSlides})`}
                    </Badge>

                    {/* Image status indicator */}
                    {hasImages ? (
                      <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <ImageIcon className="mr-1 h-3 w-3" />
                        {allImages.length}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                        <ImageIcon className="mr-1 h-3 w-3" />
                        0
                      </Badge>
                    )}

                    {/* Video Style Badge */}
                    {(item.metadata?.visualStyle === "video" || item.metadata?.visualStyle === "mixed-carousel") && (
                      <Badge variant="outline" className="text-xs border-violet-500/50 text-violet-400 bg-violet-500/10">
                        <Video className="h-3 w-3 mr-1" />
                        {item.metadata.visualStyle === "mixed-carousel" ? "Video+Images" : "Video"}
                      </Badge>
                    )}

                    {/* Generation Status (compact) */}
                    <GenerationStatus
                      job={getLatestJob(item.id)}
                      compact
                      onRetry={() => {
                        const job = getLatestJob(item.id);
                        if (job) {
                          clearJob(job.id);
                          // Re-trigger generation based on type
                          if (job.type === 'video' && carouselSlides) {
                            handleGenerateAllVideos(item.id, carouselSlides);
                          } else if (carouselSlides) {
                            handleGenerateAllWithPrompts(item.id, carouselSlides);
                          } else if (item.metadata?.imagePrompt) {
                            handleGenerateImage(item.id, item.metadata?.imagePrompt || "");
                          }
                        }
                      }}
                    />

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(item.created_at)}</span>
                    </div>

                    {/* Status Badge */}
                    <Badge className={cn("text-xs capitalize", statusColors[item.status] || "")}>
                      {item.status}
                    </Badge>
                  </div>
                </div>

                {/* Expanded Content - Redesigned with Tabs */}
                {isExpanded && (
                  <div className="border-t">
                    {/* Generation Status (full display) */}
                    {(isJobGenerating(item.id) || hasJobFailed(item.id)) && (
                      <div className="p-4 border-b bg-muted/30">
                        <GenerationStatus
                          job={getLatestJob(item.id)}
                          onRetry={() => {
                            const job = getLatestJob(item.id);
                            if (job) {
                              clearJob(job.id);
                              // Re-trigger generation based on type
                              if (job.type === 'video' && carouselSlides) {
                                handleGenerateAllVideos(item.id, carouselSlides);
                              } else if (carouselSlides) {
                                handleGenerateAllWithPrompts(item.id, carouselSlides);
                              } else if (item.metadata?.imagePrompt) {
                                handleGenerateImage(item.id, item.metadata?.imagePrompt || "");
                              }
                            }
                          }}
                          onDismiss={() => {
                            const job = getLatestJob(item.id);
                            if (job) clearJob(job.id);
                          }}
                        />
                      </div>
                    )}

                    <Tabs defaultValue={hasCarousel ? "slides" : "preview"} className="w-full">
                      {/* Tab Navigation */}
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                        <TabsList>
                          <TabsTrigger value="preview">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </TabsTrigger>
                          {hasCarousel && carouselSlides && (
                            <>
                              <TabsTrigger value="caption">
                                <Pencil className="h-4 w-4 mr-2" />
                                Caption
                              </TabsTrigger>
                              <TabsTrigger value="slides">
                                <Images className="h-4 w-4 mr-2" />
                                Slides ({totalSlides})
                              </TabsTrigger>
                            </>
                          )}
                        </TabsList>
                      </div>

                      {/* Preview Tab - Platform Mockup */}
                      <TabsContent value="preview" className="m-0 p-4">
                        {/* Single Media (Video or Image) - Side by side layout with caption */}
                        {!hasCarousel ? (
                          <div className="flex gap-6 max-w-4xl mx-auto">
                            {/* Left: Media Preview */}
                            <div className="flex-1 min-w-0">
                              {isSingleVideo ? (
                                <PlatformPostMockup platform={item.platform}>
                                  <div className="relative aspect-[4/5] bg-black/10">
                                    {hasVideo ? (
                                      <>
                                        <video
                                          src={allImages.find((img) => img.mediaType === "video")?.url}
                                          controls
                                          className="w-full h-full object-cover"
                                        />
                                        <Badge className="absolute top-2 left-2 bg-violet-600 text-white border-0 z-10">
                                          <Video className="h-3 w-3 mr-1" />
                                          Video
                                        </Badge>
                                      </>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center p-6">
                                        <Video className="h-16 w-16 mb-4 text-violet-400" />
                                        <p className="text-sm text-muted-foreground mb-4 text-center">No video generated yet</p>
                                        <Button
                                          onClick={() => handleGenerateSingleVideo(item.id, item.metadata?.videoPrompt)}
                                          disabled={generatingSingleVideo === item.id}
                                          className="bg-violet-600 hover:bg-violet-700"
                                        >
                                          {generatingSingleVideo === item.id ? (
                                            <>
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              Generating Video...
                                            </>
                                          ) : (
                                            <>
                                              <Video className="mr-2 h-4 w-4" />
                                              Generate Video
                                            </>
                                          )}
                                        </Button>
                                        {item.metadata?.videoPrompt && (
                                          <p className="text-xs text-muted-foreground mt-3 text-center max-w-xs">
                                            Prompt: {item.metadata.videoPrompt.substring(0, 100)}...
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </PlatformPostMockup>
                              ) : (
                                <PlatformPostMockup platform={item.platform}>
                                  {allImages.length > 0 ? (
                                    <ImageCarousel
                                      images={allImages}
                                      aspectRatio={item.platform === "instagram" ? "aspect-[4/5]" : "aspect-video"}
                                      onDownload={(url) => handleDownloadImage(url, item.platform)}
                                      modelBadge={renderModelBadge}
                                    />
                                  ) : (
                                    <div className={cn(
                                      "flex items-center justify-center bg-muted/10",
                                      item.platform === "instagram" ? "aspect-[4/5]" : "aspect-video"
                                    )}>
                                      <div className="text-center p-4">
                                        <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">No image generated</p>
                                      </div>
                                    </div>
                                  )}
                                </PlatformPostMockup>
                              )}

                              {/* Single post image generation */}
                              {!isSingleVideo && item.metadata?.imagePrompt && (
                                <div className="mt-4 space-y-2">
                                  <button
                                    onClick={() => togglePrompt(`single-${item.id}`)}
                                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                                  >
                                    {expandedPrompts.has(`single-${item.id}`) ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                    Image Prompt
                                    {!expandedPrompts.has(`single-${item.id}`) && (
                                      <span className="text-muted-foreground/60 truncate flex-1">
                                        — {truncateText(item.metadata?.imagePrompt || "", 50)}
                                      </span>
                                    )}
                                  </button>
                                  {expandedPrompts.has(`single-${item.id}`) && (
                                    <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                                      {item.metadata?.imagePrompt}
                                    </p>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleGenerateImage(item.id, item.metadata?.imagePrompt || "")}
                                    disabled={generatingImage === item.id}
                                  >
                                    {generatingImage === item.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                      </>
                                    ) : allImages.length > 0 ? (
                                      <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Generate Another
                                      </>
                                    ) : (
                                      <>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Generate Image
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Right: Caption Panel */}
                            <div className="w-[320px] flex-shrink-0 flex flex-col">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-medium text-muted-foreground">Caption</label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    if (editingId === item.id) {
                                      setEditingId(null);
                                    } else {
                                      setEditingId(item.id);
                                      setEditedCopy(item.copy_primary);
                                    }
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                              {editingId === item.id ? (
                                <div className="flex-1 flex flex-col gap-2">
                                  <Textarea
                                    value={editedCopy}
                                    onChange={(e) => setEditedCopy(e.target.value)}
                                    className="flex-1 min-h-[200px] font-mono text-sm resize-none"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateContent(item.id, { copy_primary: editedCopy })}
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 rounded-lg bg-muted/20 p-4 overflow-y-auto">
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.copy_primary}</p>
                                  {item.copy_hashtags && item.copy_hashtags.length > 0 && (
                                    <p className="text-sm text-primary mt-4">
                                      {item.copy_hashtags.map((h) => `#${h}`).join(" ")}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Carousel Content - Centered layout (uses Slides tab for detailed view) */
                          <div className="max-w-md mx-auto">
                            <PlatformPostMockup platform={item.platform}>
                              <div className="relative">
                                <div className="relative aspect-[4/5] bg-black/10">
                                  {(() => {
                                    const slideNum = carouselSlides![currentSlide]?.slideNumber || 1;
                                    const slideImgs = getSlideImages(item.id, slideNum);
                                    const versionIdx = getVersionIndex(item.id, slideNum);
                                    const safeVersionIdx = slideImgs.length > 0 ? Math.min(versionIdx, slideImgs.length - 1) : 0;
                                    if (slideImgs.length > 0 && slideImgs[safeVersionIdx]) {
                                      return (
                                        <>
                                          <img
                                            src={slideImgs[safeVersionIdx].url}
                                            alt={`Slide ${currentSlide + 1}`}
                                            className="w-full h-full object-cover"
                                          />
                                          {slideImgs[safeVersionIdx].model && (
                                            <div className="absolute top-2 left-2 z-10">
                                              {renderModelBadge(slideImgs[safeVersionIdx].model!)}
                                            </div>
                                          )}
                                        </>
                                      );
                                    }
                                    return (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-center">
                                          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                                          <p className="text-xs text-muted-foreground">No image for Slide {currentSlide + 1}</p>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Carousel Navigation */}
                                {totalSlides > 1 && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="secondary"
                                      className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/70 hover:bg-black/90 text-white border-0 z-10"
                                      onClick={() => setCurrentSlide(item.id, currentSlide > 0 ? currentSlide - 1 : totalSlides - 1)}
                                    >
                                      <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="secondary"
                                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/70 hover:bg-black/90 text-white border-0 z-10"
                                      onClick={() => setCurrentSlide(item.id, currentSlide < totalSlides - 1 ? currentSlide + 1 : 0)}
                                    >
                                      <ChevronRight className="h-6 w-6" />
                                    </Button>
                                    <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0 z-10">
                                      {currentSlide + 1} / {totalSlides}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </PlatformPostMockup>

                            {/* Slide Thumbnails for Preview */}
                            <div className="mt-4">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Slides</p>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {carouselSlides!.map((slide, idx) => {
                                  const slideImgs = getSlideImages(item.id, slide.slideNumber);
                                  const versionIdx = getVersionIndex(item.id, slide.slideNumber);
                                  const safeIdx = slideImgs.length > 0 ? Math.min(versionIdx, slideImgs.length - 1) : -1;
                                  const displayImg = safeIdx >= 0 ? slideImgs[safeIdx] : undefined;
                                  const hasImage = slideImgs.length > 0;
                                  return (
                                    <button
                                      key={slide.slideNumber}
                                      onClick={() => setCurrentSlide(item.id, idx)}
                                      className={cn(
                                        "relative flex-shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all",
                                        idx === currentSlide
                                          ? "border-primary ring-2 ring-primary/30"
                                          : "border-transparent opacity-60 hover:opacity-100"
                                      )}
                                    >
                                      {hasImage && displayImg ? (
                                        <>
                                          <img
                                            src={displayImg.url}
                                            alt={`Slide ${slide.slideNumber}`}
                                            className="w-full h-full object-cover"
                                          />
                                          {slideImgs.length > 1 && (
                                            <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded">
                                              {slideImgs.length}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                          <span className="text-sm text-muted-foreground">{slide.slideNumber}</span>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* Caption Tab */}
                      <TabsContent value="caption" className="m-0 p-4">
                        <div className="max-w-2xl mx-auto space-y-4">
                          {editingId === item.id ? (
                            <div className="space-y-3">
                              <p className="text-sm font-medium">Edit Caption</p>
                              <Textarea
                                value={editedCopy}
                                onChange={(e) => setEditedCopy(e.target.value)}
                                className="min-h-[200px] font-mono text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateContent(item.id, { copy_primary: editedCopy })}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Save Changes
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="rounded-lg border bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditedCopy(item.copy_primary);
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.copy_primary}</p>
                                  {item.copy_hashtags && item.copy_hashtags.length > 0 && (
                                    <p className="text-sm text-primary mt-3">
                                      {item.copy_hashtags.map((h) => `#${h}`).join(" ")}
                                    </p>
                                  )}
                                </div>
                                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Slides Tab - Filmstrip + Single Slide Detail */}
                      {hasCarousel && carouselSlides && (
                        <TabsContent value="slides" className="m-0 p-4">
                          {renderSlideFilmstripAndDetail(item, carouselSlides, currentSlide)}
                        </TabsContent>
                      )}
                    </Tabs>

                    {/* Sticky Action Bar */}
                    <div className="sticky bottom-0 flex items-center justify-between gap-3 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{item.platform}</span>
                        <span>•</span>
                        <span>{postType}</span>
                        {hasCarousel && totalSlides > 0 && (
                          <>
                            <span>•</span>
                            <span>{totalSlides} slides</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {item.status === "draft" && (
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handleApprove(item.id)}
                            disabled={hasCarousel && !allSlidesApproved}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {item.status === "approved" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openScheduleDialog(item.id)}
                              disabled={publishingId === item.id}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Schedule
                            </Button>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                              onClick={() => openMagicScheduleDialog(item.id)}
                              disabled={publishingId === item.id}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Magic Schedule
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handlePublish(item.id)}
                              disabled={publishingId === item.id}
                            >
                              {publishingId === item.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-2 h-4 w-4" />
                              )}
                              {publishingId === item.id ? "Publishing..." : "Publish Now"}
                            </Button>
                          </>
                        )}
                        {item.status === "scheduled" && item.scheduled_for && (
                          <div className="flex items-center gap-2 text-sm text-blue-400">
                            <Clock className="h-4 w-4" />
                            <span>Scheduled for {new Date(item.scheduled_for).toLocaleString()}</span>
                          </div>
                        )}
                        {item.status === "published" && (
                          <>
                            <div className="flex items-center gap-2 text-sm text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Published</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRepublish(item.id)}
                              disabled={publishingId === item.id}
                            >
                              {publishingId === item.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                              )}
                              Republish
                            </Button>
                          </>
                        )}
                        {item.status === "failed" && (
                          <>
                            <div className="flex items-center gap-2 text-sm text-red-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>Failed</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(item.id)}
                              disabled={publishingId === item.id}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Retry
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && content.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {filter ? `No ${filter} content` : "No content yet"}
            </h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {filter
                ? `You don't have any ${filter} content. Try changing the filter.`
                : "Approve ideas to generate platform-specific content"}
            </p>
            {!filter && (
              <a href="/ideas">
                <Button variant="outline">Review Ideas</Button>
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Publish/Schedule Message Banner */}
      {publishMessage && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg",
            publishMessage.type === "success"
              ? "bg-emerald-500/90 text-white"
              : "bg-red-500/90 text-white"
          )}
        >
          {publishMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{publishMessage.text}</span>
        </div>
      )}

      {/* Save Preset Dialog */}
      <Dialog open={savePresetDialogOpen} onOpenChange={setSavePresetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Style Preset</DialogTitle>
            <DialogDescription>
              Save this design system as a reusable preset for future content.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">
              Preset Name
            </label>
            <Input
              placeholder="e.g., Bold Blue, Warm Sunset"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && presetName.trim()) {
                  handleSavePreset();
                }
              }}
            />
            {savePresetContentId && content.find((c) => c.id === savePresetContentId)?.metadata?.designSystems && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                <div className="text-xs font-medium text-muted-foreground mb-2">Design System Preview</div>
                {(() => {
                  const contentItem = content.find((c) => c.id === savePresetContentId);
                  const currentStyle = selectedVisualStyle[savePresetContentId!] || getCarouselStyleId(contentItem?.metadata?.carouselStyle);
                  const effectiveStyle = typeof currentStyle === "string" ? currentStyle : "typography";
                  const ds = contentItem?.metadata?.designSystems?.[effectiveStyle];
                  if (!ds) return <div className="text-xs text-muted-foreground">No design system found</div>;
                  return (
                    <div className="space-y-1 text-xs">
                      <div><span className="text-muted-foreground">Style:</span> {effectiveStyle}</div>
                      <div><span className="text-muted-foreground">Background:</span> {ds.background}</div>
                      <div><span className="text-muted-foreground">Colors:</span> {ds.primaryColor}, {ds.accentColor}</div>
                      <div><span className="text-muted-foreground">Mood:</span> {ds.mood}</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavePresetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={savingPreset || !presetName.trim()}>
              {savingPreset ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
            <DialogDescription>
              Choose when you want this content to be published.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2">
              Date and Time
            </label>
            <Input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={isScheduling || !scheduledDateTime}
            >
              {isScheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Magic Schedule Dialog */}
      <Dialog open={magicScheduleDialogOpen} onOpenChange={setMagicScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Magic Schedule
            </DialogTitle>
            <DialogDescription>
              AI-powered scheduling recommendation based on your audience and content type.
            </DialogDescription>
          </DialogHeader>

          {isLoadingMagicSuggestion ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-md opacity-50 animate-pulse" />
                <div className="relative p-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
                  <Sparkles className="h-6 w-6 text-white animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Finding the optimal time...</p>
            </div>
          ) : magicSuggestion ? (
            <div className="py-4 space-y-4">
              {/* Recommended Time */}
              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  selectedMagicTime === magicSuggestion.suggestedTime
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-border hover:border-purple-500/50"
                )}
                onClick={() => setSelectedMagicTime(magicSuggestion.suggestedTime)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-gradient-to-r from-purple-500 to-blue-500">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-purple-400">RECOMMENDED</span>
                  </div>
                  {selectedMagicTime === magicSuggestion.suggestedTime && (
                    <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  )}
                </div>
                <p className="font-semibold text-lg">
                  {formatMagicTime(magicSuggestion.suggestedTime)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {magicSuggestion.reasoning}
                </p>
              </div>

              {/* Alternative Times */}
              {magicSuggestion.alternatives && magicSuggestion.alternatives.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Alternative times
                  </p>
                  {magicSuggestion.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        selectedMagicTime === alt.time
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-border hover:border-purple-500/50"
                      )}
                      onClick={() => setSelectedMagicTime(alt.time)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{alt.label}</span>
                        {selectedMagicTime === alt.time && (
                          <CheckCircle2 className="h-4 w-4 text-purple-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMagicScheduleDialogOpen(false)}
              disabled={isScheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMagicSchedule}
              disabled={isScheduling || !selectedMagicTime || isLoadingMagicSuggestion}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Magic Schedule Dialog */}
      <Dialog open={bulkMagicDialogOpen} onOpenChange={setBulkMagicDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Magic Schedule All
            </DialogTitle>
            <DialogDescription>
              AI-powered bulk scheduling for all your approved content.
            </DialogDescription>
          </DialogHeader>

          {isLoadingBulkSuggestions ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-md opacity-50 animate-pulse" />
                <div className="relative p-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Finding optimal times for {content.filter(c => c.status === "approved").length} posts...
              </p>
            </div>
          ) : bulkScheduleResults ? (
            // Results view after scheduling
            <div className="py-6 space-y-4">
              {bulkScheduleResults.failures.length === 0 ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="p-3 rounded-full bg-emerald-500/20">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-400">All posts scheduled!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {bulkScheduleResults.successes.length} posts are now queued for publishing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {bulkScheduleResults.successes.length > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm text-emerald-400">
                        {bulkScheduleResults.successes.length} posts scheduled successfully
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <XCircle className="h-5 w-5 text-red-400" />
                    <span className="text-sm text-red-400">
                      {bulkScheduleResults.failures.length} posts failed to schedule
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : bulkSuggestions.length > 0 ? (
            // Suggestions list view
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Summary */}
              {(() => {
                const summary = getBulkScheduleSummary();
                return summary ? (
                  <div className="p-3 mb-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span>
                        <strong className="text-purple-400">{summary.count} posts</strong>{" "}
                        will be scheduled across{" "}
                        <strong className="text-purple-400">{summary.days} days</strong>
                        {summary.days > 1 && (
                          <span className="text-muted-foreground">
                            {" "}({summary.startDate} - {summary.endDate})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Scrollable list of suggestions */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {bulkSuggestions.map((suggestion, idx) => (
                  <div
                    key={suggestion.contentId}
                    className="p-3 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Platform icon */}
                      <div className={cn(
                        "p-1.5 rounded flex-shrink-0",
                        platformColors[suggestion.platform || "twitter"] || "bg-gray-500"
                      )}>
                        {platformIcons[suggestion.platform || "twitter"] || <FileText className="h-3 w-3 text-white" />}
                      </div>

                      {/* Content info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {suggestion.concept || "Untitled post"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-purple-400 font-medium">
                            {formatMagicTime(suggestion.suggestedTime)}
                          </span>
                        </div>
                      </div>

                      {/* Order number */}
                      <Badge variant="secondary" className="text-xs">
                        #{idx + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No approved content to schedule.</p>
            </div>
          )}

          {/* Progress bar during scheduling */}
          {isSchedulingBulk && bulkScheduleProgress && (
            <div className="py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scheduling posts...</span>
                <span className="font-medium">
                  {bulkScheduleProgress.current} of {bulkScheduleProgress.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${(bulkScheduleProgress.current / bulkScheduleProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkMagicDialogOpen(false);
                setBulkScheduleResults(null);
              }}
              disabled={isSchedulingBulk}
            >
              {bulkScheduleResults ? "Close" : "Cancel"}
            </Button>
            {!bulkScheduleResults && bulkSuggestions.length > 0 && (
              <Button
                onClick={handleBulkMagicSchedule}
                disabled={isSchedulingBulk || isLoadingBulkSuggestions || bulkSuggestions.length === 0}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                {isSchedulingBulk ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Schedule All ({bulkSuggestions.length})
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
