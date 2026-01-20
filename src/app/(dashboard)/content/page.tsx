"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Send, Clock, RefreshCw, Loader2, Image as ImageIcon, Sparkles, Twitter, Linkedin, Instagram, Copy, Check, Download, Images, CheckCircle2, XCircle, Zap, Brain, ChevronDown, ChevronRight, ChevronLeft, Trash2, Square, CheckSquare, AlertCircle, Eye, Pencil, ChevronUp, Layers, Calendar, GripVertical, ArrowRight } from "lucide-react";
import { MODEL_OPTIONS, DEFAULT_MODEL, IMAGE_MODELS, type ImageModelKey } from "@/lib/image-models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ImageCarousel, type CarouselImage } from "@/components/ui/image-carousel";
import { PlatformPostMockup } from "@/components/ui/platform-mockups";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GenerationStatus } from "@/components/ui/generation-status";
import { useGenerationJobs, type GenerationJob } from "@/hooks/use-generation-jobs";
import { cn } from "@/lib/utils";
import { useBrand } from "@/contexts/brand-context";

interface ContentImage {
  id: string;
  url: string;
  prompt: string;
  is_primary: boolean;
  model?: ImageModelKey;
}

interface CarouselSlide {
  slideNumber: number;
  text: string;
  imagePrompt: string;
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
    carouselStyle?: string;
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
  const { selectedBrand } = useBrand();
  const [content, setContent] = useState<Content[]>([]);
  const [images, setImages] = useState<Record<string, ContentImage[]>>({});
  const [slideImages, setSlideImages] = useState<Record<string, Record<number, CarouselImage[]>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("draft");
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
  const [generatingCompositeCarousel, setGeneratingCompositeCarousel] = useState<string | null>(null);
  const [selectedTextStyle, setSelectedTextStyle] = useState<string>("bold-editorial");
  const [selectedTextColor, setSelectedTextColor] = useState<string>("white-coral");
  const [selectedBackgroundStyle, setSelectedBackgroundStyle] = useState<string>("gradient-dark");
  const [generationMode, setGenerationMode] = useState<"ai-generation" | "composite">("ai-generation");
  const [captionPanelWidth, setCaptionPanelWidth] = useState<number>(320); // Default ~1/3 width
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingContentId, setSchedulingContentId] = useState<string | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [publishMessage, setPublishMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // Slide text editing state
  const [editingSlideText, setEditingSlideText] = useState<{ contentId: string; slideNumber: number } | null>(null);
  const [editedSlideText, setEditedSlideText] = useState<string>("");
  const [savingSlideText, setSavingSlideText] = useState(false);
  // Visual style change state
  const [selectedVisualStyle, setSelectedVisualStyle] = useState<Record<string, string>>({});
  const [isChangingStyle, setIsChangingStyle] = useState<string | null>(null);

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

  useEffect(() => {
    fetchContent();
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
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (selectedBrand?.id) params.set("brandId", selectedBrand.id);
      const url = `/api/content?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setContent(data.content || []);
        const contentItems = data.content || [];
        for (const item of contentItems) {
          fetchImagesForContent(item.id);
        }
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImagesForContent = async (contentId: string) => {
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

        data.images.forEach((img: ContentImage & { created_at?: string }) => {
          if (img.url && !img.url.startsWith("placeholder:")) {
            const carouselImg: CarouselImage = {
              id: img.id,
              url: img.url,
              model: img.model,
              createdAt: img.created_at,
            };

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

    // Generate all slides with status tracking
    const promises = slides.map(async (slide) => {
      await updateSlideStatus(slide.slideNumber, 'generating');
      try {
        await handleGenerateImage(contentId, slide.imagePrompt, slide.slideNumber);
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

  // Generate carousel with composite system (consistent text rendering)
  const handleGenerateCompositeCarousel = async (contentId: string, slides: CarouselSlide[]) => {
    setGeneratingCompositeCarousel(contentId);
    setImageMessage("Generating carousel with consistent styling...");
    try {
      const response = await fetch("/api/images/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          slides: slides.map((s) => ({
            slideNumber: s.slideNumber,
            text: s.text,
          })),
          textStyle: selectedTextStyle,
          textColor: selectedTextColor,
          backgroundStyle: selectedBackgroundStyle,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageMessage(`Generated ${data.images.length} slides with consistent styling!`);
        // Refresh images for this content
        fetchImagesForContent(contentId);
      } else {
        setImageMessage(`Error: ${data.error || "Failed to generate carousel"}`);
      }
    } catch (error) {
      console.error("Error generating composite carousel:", error);
      setImageMessage("Error generating composite carousel");
    } finally {
      setGeneratingCompositeCarousel(null);
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

  // Regenerate carousel images with a different visual style
  const handleRegenerateWithStyle = async (contentId: string, slides: CarouselSlide[], visualStyle: string) => {
    setIsChangingStyle(contentId);
    setImageMessage(`Regenerating with ${visualStyle} style...`);

    try {
      // Create a job to track the regeneration
      let jobId: string | null = null;
      const initialSlideStatuses = slides.map((slide) => ({
        slideNumber: slide.slideNumber,
        status: 'pending' as const,
      }));

      try {
        const jobRes = await fetch("/api/images/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentId,
            type: 'carousel',
            totalItems: slides.length,
            metadata: { slideStatuses: initialSlideStatuses, mode: 'style-change', newStyle: visualStyle },
          }),
        });
        const jobData = await jobRes.json();
        if (jobData.success) {
          jobId = jobData.job.id;
        }
      } catch (err) {
        console.error("Error creating job:", err);
      }

      // Call the carousel API with the new style
      const response = await fetch("/api/images/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          slides: slides.map((s) => ({
            slideNumber: s.slideNumber,
            text: s.text,
            imagePrompt: s.imagePrompt,
          })),
          model: selectedModel,
          textStyle: selectedTextStyle,
          textColor: selectedTextColor,
          backgroundStyle: selectedBackgroundStyle,
          visualStyle, // Pass the new visual style
          jobId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setImageMessage(`Style changed to ${visualStyle}! Regenerating images...`);
        // Update local selected style
        setSelectedVisualStyle((prev) => ({ ...prev, [contentId]: visualStyle }));
        // Refresh images after a short delay
        setTimeout(() => {
          fetchImagesForContent(contentId);
          refreshJobs();
        }, 1000);
      } else {
        setImageMessage(data.error || "Failed to regenerate with new style");
      }
    } catch (err) {
      console.error("Error regenerating with style:", err);
      setImageMessage("Error regenerating with new style");
    } finally {
      setIsChangingStyle(null);
      setTimeout(() => setImageMessage(null), 5000);
    }
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
      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
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

      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: schedulingContentId,
          scheduledFor,
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

  const getAllContentImages = (contentId: string): CarouselImage[] => {
    const contentImgs = images[contentId] || [];
    return contentImgs
      .filter(img => img.url && !img.url.startsWith("placeholder:"))
      .map(img => ({
        id: img.id,
        url: img.url,
        model: img.model,
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

    if (obj && "text" in obj && "imagePrompt" in obj) {
      return {
        slideNumber: typeof obj.slideNumber === "number" ? obj.slideNumber : 1,
        text: String(obj.text || ""),
        imagePrompt: String(obj.imagePrompt || ""),
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

  const truncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const draftCount = content.filter((c) => c.status === "draft").length;
  const approvedCount = content.filter((c) => c.status === "approved").length;
  const scheduledCount = content.filter((c) => c.status === "scheduled").length;
  const publishedCount = content.filter((c) => c.status === "published").length;

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
              {item.ideas?.concept || item.copy_primary.slice(0, 60)}
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
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-full text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
              onClick={(e) => {
                e.stopPropagation();
                openScheduleDialog(item.id);
              }}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Schedule
            </Button>
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
        <div className="w-[240px] flex-shrink-0 flex flex-col border-r border-muted/30 pr-3 overflow-y-auto">
          {/* Model Selector */}
          <div className="mb-2">
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

          {/* Visual Style Selector with Change Button */}
          <div className="mb-2">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Visual Style</label>
            <div className="flex gap-1.5">
              <select
                className="flex-1 h-7 rounded-md border border-input bg-background px-2 text-xs"
                value={selectedVisualStyle[item.id] || item.metadata?.carouselStyle || "typography"}
                onChange={(e) => setSelectedVisualStyle((prev) => ({ ...prev, [item.id]: e.target.value }))}
              >
                {visualStyleOptions.map((style) => (
                  <option key={style.id} value={style.id}>{style.label}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={() => handleRegenerateWithStyle(
                  item.id,
                  slides,
                  selectedVisualStyle[item.id] || item.metadata?.carouselStyle || "typography"
                )}
                disabled={isChangingStyle === item.id || generatingCompositeCarousel === item.id}
              >
                {isChangingStyle === item.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            </div>
            {item.metadata?.carouselStyle && (
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Current: {visualStyleOptions.find(s => s.id === item.metadata?.carouselStyle)?.label || item.metadata?.carouselStyle}
              </div>
            )}
          </div>

          {/* AI Generation / Composite Tabs */}
          <Tabs defaultValue="ai-generation" value={generationMode} onValueChange={(v) => setGenerationMode(v as "ai-generation" | "composite")} className="flex-1 flex flex-col">
            <TabsList className="w-full h-7 mb-2">
              <TabsTrigger value="ai-generation" className="flex-1 text-[10px] h-6">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generation
              </TabsTrigger>
              <TabsTrigger value="composite" className="flex-1 text-[10px] h-6">
                <Layers className="h-3 w-3 mr-1" />
                Composite
              </TabsTrigger>
            </TabsList>

            {/* Generate All Slides Button */}
            <Button
              className="w-full h-8 mb-3 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (generationMode === "composite") {
                  handleGenerateCompositeCarousel(item.id, slides);
                } else {
                  handleGenerateAllSlides(item.id, slides);
                }
              }}
              disabled={Object.keys(generatingSlides[item.id] || {}).length > 0 || generatingCompositeCarousel === item.id}
            >
              <ImageIcon className="mr-2 h-3.5 w-3.5" />
              <span className="text-xs">Generate all slides</span>
            </Button>

            {/* SLIDE CONTENT Section */}
            <div className="mb-2">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Slide Content</div>

              {/* Slide Text */}
              <div className="mb-2">
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
            </div>

            {/* AI Generation Tab */}
            <TabsContent value="ai-generation" className="flex-1 flex flex-col mt-0 space-y-2 overflow-y-auto">
              {/* Slide Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Slide Prompt:</span>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" title="Edit" disabled>
                      <Pencil className="h-2.5 w-2.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" title="Regenerate" disabled>
                      <RefreshCw className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
                <div className="rounded bg-muted/30 p-2 text-[10px] text-muted-foreground leading-relaxed max-h-[60px] overflow-y-auto">
                  {slide.imagePrompt}
                </div>
              </div>

              {/* Style Variants */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Style Variants</span>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleGenerateImage(item.id, slide.imagePrompt, slide.slideNumber)} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-1 h-3 w-3" />}
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

            {/* Composite Tab */}
            <TabsContent value="composite" className="flex-1 flex flex-col mt-0 space-y-1.5 overflow-y-auto">
              {/* COMPOSITE SETTINGS Section */}
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Composite Settings</div>

              {/* Text Style */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Text Style</label>
                <select className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs" value={selectedTextStyle} onChange={(e) => setSelectedTextStyle(e.target.value)}>
                  <option value="bold-editorial">Bold Editorial</option>
                  <option value="clean-modern">Clean Modern</option>
                  <option value="dramatic">Dramatic</option>
                  <option value="minimal">Minimal</option>
                  <option value="statement">Statement</option>
                </select>
              </div>

              {/* Text Color */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Text Color</label>
                <select className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs" value={selectedTextColor} onChange={(e) => setSelectedTextColor(e.target.value)}>
                  <option value="white-coral">White & Coral</option>
                  <option value="white-teal">White & Teal</option>
                  <option value="white-gold">White & Gold</option>
                  <option value="white-blue">White & Blue</option>
                  <option value="dark-coral">Dark & Coral</option>
                  <option value="dark-blue">Dark & Blue</option>
                </select>
              </div>

              {/* Background Style */}
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Background Style</label>
                <select className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs" value={selectedBackgroundStyle} onChange={(e) => setSelectedBackgroundStyle(e.target.value)}>
                  <optgroup label="Typography">
                    <option value="gradient-dark">Dark Gradient</option>
                    <option value="gradient-warm">Warm Gradient</option>
                    <option value="abstract-shapes">Abstract Shapes</option>
                    <option value="bokeh-dark">Bokeh</option>
                    <option value="minimal-solid">Solid</option>
                  </optgroup>
                  <optgroup label="Photorealistic">
                    <option value="photo-landscape">Landscape</option>
                    <option value="photo-urban">Urban/City</option>
                    <option value="photo-nature">Nature Close-up</option>
                    <option value="photo-ocean">Ocean/Sunset</option>
                  </optgroup>
                  <optgroup label="Illustration">
                    <option value="illust-flat">Flat Vector</option>
                    <option value="illust-watercolor">Watercolor</option>
                    <option value="illust-geometric">Geometric</option>
                  </optgroup>
                  <optgroup label="3D / Art">
                    <option value="3d-geometric">3D Geometric</option>
                    <option value="3d-abstract">3D Abstract</option>
                    <option value="art-expressive">Expressive Art</option>
                    <option value="collage-vintage">Vintage Collage</option>
                  </optgroup>
                </select>
              </div>

              {/* Style Variants */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Style Variants</span>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleGenerateCompositeCarousel(item.id, slides)} disabled={generatingCompositeCarousel === item.id}>
                    {generatingCompositeCarousel === item.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-1 h-3 w-3" />}
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
                        <img
                          src={cardImage.url}
                          alt={`Slide ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Badge
                          className={cn(
                            "absolute top-2 right-2 border-0",
                            isCurrent ? "bg-primary text-primary-foreground" : "bg-black/60 text-white"
                          )}
                        >
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
              return (
                <button
                  key={s.slideNumber}
                  onClick={() => setCurrentSlide(item.id, idx)}
                  className={cn(
                    "w-16 h-20 rounded-lg overflow-hidden border-2 transition-all",
                    isCurrent
                      ? "border-primary ring-2 ring-primary/30 scale-105"
                      : "border-muted opacity-60 hover:opacity-100"
                  )}
                >
                  {thumbImage ? (
                    <img src={thumbImage.url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
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
      <div className="flex gap-2">
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
      {isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading content...</p>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board View - when "All" filter is selected */}
      {!isLoading && filter === "" && content.length > 0 && renderKanbanBoard()}

      {/* Content List - Collapsible Cards (when specific filter selected) */}
      {!isLoading && filter !== "" && content.length > 0 && (
        <div className="space-y-2">
          {content.map((item) => {
            const isExpanded = expandedCards.has(item.id);
            const hasCarousel = !!(item.copy_carousel_slides && item.copy_carousel_slides.length > 0);
            const { parsed: carouselSlides } = parseCarouselSlides(item.copy_carousel_slides);
            const totalSlides = carouselSlides?.length || 0;
            const allSlidesApproved = totalSlides > 0 ? areAllSlidesApproved(item.id, totalSlides) : true;
            const postType = getPostType(item);
            const allImages = getAllContentImages(item.id);
            const currentSlide = getCurrentSlide(item.id);
            const hasImages = hasGeneratedImage(item.id);

            return (
              <Card key={item.id} className="overflow-hidden">
                {/* Collapsed Header Row - Enhanced with quick actions */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCard(item.id)}
                >
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

                  {/* Title/Concept */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.ideas?.concept || item.copy_primary.slice(0, 60) + "..."}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.copy_primary.slice(0, 100)}...
                    </p>
                  </div>

                  {/* Post Type Badge */}
                  <Badge variant="outline" className="text-xs shrink-0">
                    {hasCarousel && <Images className="mr-1 h-3 w-3" />}
                    {postType}
                    {hasCarousel && ` (${totalSlides})`}
                  </Badge>

                  {/* Image status indicator */}
                  <div className="flex-shrink-0">
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
                  </div>

                  {/* Generation Status (compact) */}
                  <GenerationStatus
                    job={getLatestJob(item.id)}
                    compact
                    onRetry={() => {
                      const job = getLatestJob(item.id);
                      if (job) {
                        clearJob(job.id);
                        // Re-trigger generation based on type
                        if (job.type === 'composite') {
                          handleGenerateCompositeCarousel(item.id, carouselSlides || []);
                        } else if (item.metadata?.imagePrompt) {
                          handleGenerateImage(item.id, item.metadata?.imagePrompt || "");
                        }
                      }
                    }}
                  />

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(item.created_at)}</span>
                  </div>

                  {/* Theme Badge */}
                  {item.ideas?.angle && (
                    <Badge variant="secondary" className="text-xs capitalize shrink-0">
                      {item.ideas?.angle}
                    </Badge>
                  )}

                  {/* Status Badge */}
                  <Badge className={cn("text-xs capitalize shrink-0", statusColors[item.status] || "")}>
                    {item.status}
                  </Badge>

                  {/* Quick Actions */}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
                              if (job.type === 'composite') {
                                handleGenerateCompositeCarousel(item.id, carouselSlides || []);
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
                          <TabsTrigger value="caption">
                            <Pencil className="h-4 w-4 mr-2" />
                            Caption
                          </TabsTrigger>
                          {hasCarousel && carouselSlides && (
                            <TabsTrigger value="slides">
                              <Images className="h-4 w-4 mr-2" />
                              Slides ({totalSlides})
                            </TabsTrigger>
                          )}
                        </TabsList>
                      </div>

                      {/* Preview Tab - Platform Mockup */}
                      <TabsContent value="preview" className="m-0 p-4">
                        <div className="max-w-md mx-auto">
                          {hasCarousel && carouselSlides ? (
                            <PlatformPostMockup platform={item.platform}>
                              <div className="relative">
                                <div className="relative aspect-[4/5] bg-black/10">
                                  {(() => {
                                    const slideNum = carouselSlides[currentSlide]?.slideNumber || 1;
                                    const slideImgs = getSlideImages(item.id, slideNum);
                                    const versionIdx = getVersionIndex(item.id, slideNum);
                                    const safeVersionIdx = Math.min(versionIdx, slideImgs.length - 1);
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

                          {/* Slide Thumbnails for Preview */}
                          {hasCarousel && carouselSlides && (
                            <div className="mt-4">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Slides</p>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {carouselSlides.map((slide, idx) => {
                                  const slideImgs = getSlideImages(item.id, slide.slideNumber);
                                  const versionIdx = getVersionIndex(item.id, slide.slideNumber);
                                  const displayImg = slideImgs[Math.min(versionIdx, slideImgs.length - 1)];
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
                          )}

                          {/* Single post image generation */}
                          {!hasCarousel && item.metadata?.imagePrompt && (
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
                          <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Published</span>
                          </div>
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
    </div>
  );
}
