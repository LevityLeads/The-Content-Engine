"use client";

import { useState, useEffect } from "react";
import { FileText, Send, Clock, RefreshCw, Loader2, Image as ImageIcon, Sparkles, Twitter, Linkedin, Instagram, Copy, Check, Download, Images, CheckCircle2, XCircle, Zap, Brain, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { MODEL_OPTIONS, DEFAULT_MODEL, IMAGE_MODELS, type ImageModelKey } from "@/lib/image-models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ImageCarousel, type CarouselImage } from "@/components/ui/image-carousel";
import { PlatformPostMockup } from "@/components/ui/platform-mockups";
import { cn } from "@/lib/utils";

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
  copy_hashtags: string[];
  copy_cta: string | null;
  copy_thread_parts: string[] | null;
  copy_carousel_slides: CarouselSlide[] | string[] | null;
  status: string;
  scheduled_for: string | null;
  metadata: {
    imagePrompt?: string;
    carouselStyle?: string;
  };
  created_at: string;
  ideas?: {
    concept: string;
    angle: string;
  };
}

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

export default function ContentPage() {
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
  const [approvedSlides, setApprovedSlides] = useState<Record<string, number[]>>({});
  const [selectedModel, setSelectedModel] = useState<ImageModelKey>(DEFAULT_MODEL);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [currentSlideIndex, setCurrentSlideIndex] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchContent();
  }, [filter]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const url = filter ? `/api/content?status=${filter}` : "/api/content";
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
    const promises = slides.map((slide) =>
      handleGenerateImage(contentId, slide.imagePrompt, slide.slideNumber)
    );
    await Promise.all(promises);
    setImageMessage("All slide images generated!");
    setTimeout(() => setImageMessage(null), 5000);
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

  const handleCopyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApproveSlide = (contentId: string, slideNumber: number) => {
    setApprovedSlides((prev) => ({
      ...prev,
      [contentId]: [...(prev[contentId] || []), slideNumber],
    }));
  };

  const handleRejectSlide = (contentId: string, slideNumber: number) => {
    setApprovedSlides((prev) => ({
      ...prev,
      [contentId]: (prev[contentId] || []).filter((n) => n !== slideNumber),
    }));
  };

  const isSlideApproved = (contentId: string, slideNumber: number) => {
    return (approvedSlides[contentId] || []).includes(slideNumber);
  };

  const areAllSlidesApproved = (contentId: string, totalSlides: number) => {
    const approved = approvedSlides[contentId] || [];
    return approved.length >= totalSlides;
  };

  const handleApprove = async (id: string) => {
    await handleUpdateContent(id, { status: "approved" });
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

  const getCurrentSlide = (contentId: string, totalSlides: number): number => {
    return currentSlideIndex[contentId] || 0;
  };

  const setCurrentSlide = (contentId: string, index: number) => {
    setCurrentSlideIndex((prev) => ({ ...prev, [contentId]: index }));
  };

  const draftCount = content.filter((c) => c.status === "draft").length;
  const approvedCount = content.filter((c) => c.status === "approved").length;

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
          {/* Model Selector */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {MODEL_OPTIONS.map((model) => (
              <Button
                key={model.key}
                variant={selectedModel === model.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedModel(model.key)}
                className="gap-1"
                title={model.description}
              >
                {model.speed === "fast" ? (
                  <Zap className="h-3 w-3" />
                ) : (
                  <Brain className="h-3 w-3" />
                )}
                {model.name}
              </Button>
            ))}
          </div>
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

      {/* Content List - Collapsible Cards */}
      {!isLoading && content.length > 0 && (
        <div className="space-y-2">
          {content.map((item) => {
            const isExpanded = expandedCards.has(item.id);
            const hasCarousel = !!(item.copy_carousel_slides && item.copy_carousel_slides.length > 0);
            const { parsed: carouselSlides } = parseCarouselSlides(item.copy_carousel_slides);
            const totalSlides = carouselSlides?.length || 0;
            const allSlidesApproved = totalSlides > 0 ? areAllSlidesApproved(item.id, totalSlides) : true;
            const postType = getPostType(item);
            const allImages = getAllContentImages(item.id);
            const currentSlide = getCurrentSlide(item.id, totalSlides);

            return (
              <Card key={item.id} className="overflow-hidden">
                {/* Collapsed Header Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCard(item.id)}
                >
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

                  {/* Theme Badge */}
                  {item.ideas?.angle && (
                    <Badge variant="secondary" className="text-xs capitalize shrink-0">
                      {item.ideas.angle}
                    </Badge>
                  )}

                  {/* Status Badge */}
                  <Badge className={cn("text-xs capitalize shrink-0", statusColors[item.status] || "")}>
                    {item.status}
                  </Badge>

                  {/* Quick Actions */}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopyToClipboard(
                        `${item.copy_primary}\n\n${item.copy_hashtags?.map(h => `#${h}`).join(" ") || ""}`,
                        item.id
                      )}
                    >
                      {copiedId === item.id ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <CardContent className="border-t pt-4">
                    <div className="grid lg:grid-cols-2 gap-6">
                      {/* Left Column: Text Content */}
                      <div className="space-y-4">
                        {/* Caption Editor */}
                        <div>
                          <p className="text-sm font-medium mb-2">Caption</p>
                          {editingId === item.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editedCopy}
                                onChange={(e) => setEditedCopy(e.target.value)}
                                className="min-h-[150px] font-mono text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateContent(item.id, { copy_primary: editedCopy })}
                                >
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
                            <div
                              className="rounded-lg border bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                setEditingId(item.id);
                                setEditedCopy(item.copy_primary);
                              }}
                            >
                              <p className="text-sm whitespace-pre-wrap">{item.copy_primary}</p>
                              {item.copy_hashtags && item.copy_hashtags.length > 0 && (
                                <p className="text-sm text-primary mt-2">
                                  {item.copy_hashtags.map((h) => `#${h}`).join(" ")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Carousel Slides Text (if carousel) */}
                        {carouselSlides && carouselSlides.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Slide {currentSlide + 1} Text</p>
                            <div className="rounded-lg border bg-muted/30 p-4">
                              <p className="text-sm">{carouselSlides[currentSlide]?.text}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Image Prompt:</span> {carouselSlides[currentSlide]?.imagePrompt}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          {item.status === "draft" && (
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                              onClick={() => handleApprove(item.id)}
                              disabled={hasCarousel && !allSlidesApproved}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="flex-1">
                            <Clock className="mr-2 h-4 w-4" />
                            Schedule
                          </Button>
                          <Button size="sm" className="flex-1">
                            <Send className="mr-2 h-4 w-4" />
                            Publish
                          </Button>
                        </div>
                      </div>

                      {/* Right Column: Image in Platform Mockup */}
                      <div className="space-y-4">
                        {/* Carousel Post */}
                        {carouselSlides && carouselSlides.length > 0 ? (
                          <div className="space-y-4">
                            <PlatformPostMockup platform={item.platform}>
                              <div className="relative">
                                {/* Main Carousel Image */}
                                <div className="relative aspect-[4/5] bg-black/10">
                                  {(() => {
                                    const slideImgs = getSlideImages(item.id, carouselSlides[currentSlide]?.slideNumber || 1);
                                    if (slideImgs.length > 0) {
                                      return (
                                        <ImageCarousel
                                          images={slideImgs}
                                          aspectRatio="aspect-[4/5]"
                                          showThumbnails={false}
                                          onDownload={(url) => handleDownloadImage(url, item.platform, currentSlide + 1)}
                                          modelBadge={renderModelBadge}
                                        />
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

                                {/* Carousel Navigation (Big Arrows) */}
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
                                  </>
                                )}

                                {/* Slide Counter */}
                                {totalSlides > 1 && (
                                  <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0 z-10">
                                    Slide {currentSlide + 1} / {totalSlides}
                                  </Badge>
                                )}
                              </div>
                            </PlatformPostMockup>

                            {/* Slide Thumbnails */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {carouselSlides.map((slide, idx) => {
                                const slideImgs = getSlideImages(item.id, slide.slideNumber);
                                const hasImage = slideImgs.length > 0;
                                return (
                                  <button
                                    key={slide.slideNumber}
                                    onClick={() => setCurrentSlide(item.id, idx)}
                                    className={cn(
                                      "flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all",
                                      idx === currentSlide
                                        ? "border-primary ring-2 ring-primary/30"
                                        : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                  >
                                    {hasImage ? (
                                      <img
                                        src={slideImgs[0].url}
                                        alt={`Slide ${slide.slideNumber}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground">{slide.slideNumber}</span>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Generate Image Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const slide = carouselSlides[currentSlide];
                                if (slide) {
                                  handleGenerateImage(item.id, slide.imagePrompt, slide.slideNumber);
                                }
                              }}
                              disabled={isSlideGenerating(item.id, carouselSlides[currentSlide]?.slideNumber || 1)}
                            >
                              {isSlideGenerating(item.id, carouselSlides[currentSlide]?.slideNumber || 1) ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="mr-2 h-4 w-4" />
                                  Generate Image for Slide {currentSlide + 1}
                                </>
                              )}
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleGenerateAllSlides(item.id, carouselSlides)}
                              disabled={Object.keys(generatingSlides[item.id] || {}).length > 0}
                              className="w-full"
                            >
                              <Images className="mr-2 h-4 w-4" />
                              Generate All Slide Images
                            </Button>
                          </div>
                        ) : (
                          /* Single Post */
                          <div className="space-y-4">
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

                            {item.metadata?.imagePrompt && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Image Prompt:</span> {item.metadata.imagePrompt}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => handleGenerateImage(item.id, item.metadata.imagePrompt!)}
                                  disabled={generatingImage === item.id}
                                >
                                  {generatingImage === item.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Generating...
                                    </>
                                  ) : allImages.length > 0 ? (
                                    <>
                                      <ImageIcon className="mr-2 h-4 w-4" />
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
                        )}
                      </div>
                    </div>
                  </CardContent>
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
    </div>
  );
}
