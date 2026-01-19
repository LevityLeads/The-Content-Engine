"use client";

import { useState, useEffect } from "react";
import { FileText, Send, Clock, RefreshCw, Loader2, Image as ImageIcon, Sparkles, Twitter, Linkedin, Instagram, Copy, Check, Download, Images, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface ContentImage {
  id: string;
  url: string;
  prompt: string;
  is_primary: boolean;
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

export default function ContentPage() {
  const [content, setContent] = useState<Content[]>([]);
  const [images, setImages] = useState<Record<string, ContentImage[]>>({});
  const [slideImages, setSlideImages] = useState<Record<string, Record<number, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("draft");
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [generatingSlides, setGeneratingSlides] = useState<Record<string, number[]>>({});
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedCopy, setEditedCopy] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [approvedSlides, setApprovedSlides] = useState<Record<string, number[]>>({});

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
        // Map images to slides by matching prompts
        const imgMap: Record<number, string> = {};
        data.images.forEach((img: ContentImage) => {
          if (img.url && !img.url.startsWith("placeholder:")) {
            // Try to match by slide number in prompt
            const slideMatch = img.prompt?.match(/slide\s*(\d+)/i);
            if (slideMatch) {
              imgMap[parseInt(slideMatch[1])] = img.url;
            }
          }
        });
        if (Object.keys(imgMap).length > 0) {
          setSlideImages((prev) => ({ ...prev, [contentId]: imgMap }));
        }
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
        body: JSON.stringify({ contentId, prompt: slidePrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setImageMessage(data.message);
        if (slideNumber && data.image?.url && !data.image.url.startsWith("placeholder:")) {
          // For slide images, set directly - don't refetch as it may overwrite with stale data
          setSlideImages((prev) => ({
            ...prev,
            [contentId]: {
              ...(prev[contentId] || {}),
              [slideNumber]: data.image.url,
            },
          }));
        } else if (!slideNumber) {
          // Only refetch for non-slide (primary) images
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

  const getContentImages = (contentId: string): ContentImage[] => {
    return images[contentId] || [];
  };

  const hasGeneratedImage = (contentId: string): boolean => {
    const contentImages = getContentImages(contentId);
    return contentImages.some((img) => img.url && !img.url.startsWith("placeholder:"));
  };

  const getSlideImage = (contentId: string, slideNumber: number): string | null => {
    return slideImages[contentId]?.[slideNumber] || null;
  };

  const isSlideGenerating = (contentId: string, slideNumber: number): boolean => {
    return (generatingSlides[contentId] || []).includes(slideNumber);
  };

  // Helper to normalize a slide - handles objects, JSON strings, or plain strings
  const normalizeSlide = (slide: CarouselSlide | string | unknown): CarouselSlide | null => {
    if (!slide) return null;

    // First, ensure we have an object to work with
    let obj: Record<string, unknown> | null = null;

    if (typeof slide === "object") {
      // Already an object - use directly
      obj = slide as Record<string, unknown>;
    } else if (typeof slide === "string") {
      // Try to parse JSON string
      try {
        const parsed = JSON.parse(slide);
        if (parsed && typeof parsed === "object") {
          obj = parsed;
        }
      } catch {
        // Not valid JSON - could be legacy plain text
        return null;
      }
    }

    // Check if object has required carousel slide properties
    if (obj && "text" in obj && "imagePrompt" in obj) {
      return {
        slideNumber: typeof obj.slideNumber === "number" ? obj.slideNumber : 1,
        text: String(obj.text || ""),
        imagePrompt: String(obj.imagePrompt || ""),
      };
    }

    return null;
  };

  // Helper to parse carousel slides (handles JSON strings from database)
  const parseCarouselSlides = (slides: CarouselSlide[] | string[] | null): { parsed: CarouselSlide[] | null; legacy: string[] | null } => {
    if (!slides || slides.length === 0) return { parsed: null, legacy: null };

    // Try to normalize all slides
    const validSlides: CarouselSlide[] = [];
    const legacySlides: string[] = [];

    slides.forEach((slide, index) => {
      const normalized = normalizeSlide(slide);
      if (normalized) {
        // Ensure slideNumber is set correctly
        normalized.slideNumber = normalized.slideNumber || index + 1;
        validSlides.push(normalized);
      } else if (typeof slide === "string" && !slide.trim().startsWith("{")) {
        // Only treat as legacy if it's not JSON-like
        legacySlides.push(slide);
      }
    });

    // If we got valid parsed slides, use them
    if (validSlides.length > 0) {
      return { parsed: validSlides, legacy: null };
    }

    // Otherwise return legacy if we have any
    return { parsed: null, legacy: legacySlides.length > 0 ? legacySlides : null };
  };

  const draftCount = content.filter((c) => c.status === "draft").length;
  const approvedCount = content.filter((c) => c.status === "approved").length;

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

      {/* Content List */}
      {!isLoading && content.length > 0 && (
        <div className="grid gap-4">
          {content.map((item) => {
            const contentImages = getContentImages(item.id);
            const generatedImage = contentImages.find(
              (img) => img.url && !img.url.startsWith("placeholder:")
            );
            const hasCarousel = !!(item.copy_carousel_slides && item.copy_carousel_slides.length > 0);
            const { parsed: carouselSlides, legacy: legacySlides } = parseCarouselSlides(item.copy_carousel_slides);
            const totalSlides = carouselSlides?.length || legacySlides?.length || 0;
            const allSlidesApproved = totalSlides > 0 ? areAllSlidesApproved(item.id, totalSlides) : true;

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${platformColors[item.platform] || "bg-gray-500"}`}>
                        {platformIcons[item.platform] || <FileText className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <CardTitle className="text-base capitalize">{item.platform}</CardTitle>
                        {item.ideas && (
                          <CardDescription className="text-xs">
                            From: {item.ideas.concept?.slice(0, 50)}...
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasCarousel && (
                        <Badge variant="outline" className="text-xs">
                          <Images className="mr-1 h-3 w-3" />
                          Carousel ({totalSlides} slides)
                        </Badge>
                      )}
                      <Badge variant={item.status === "draft" ? "secondary" : item.status === "approved" ? "default" : "outline"}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Non-carousel Generated Image Display */}
                  {!hasCarousel && generatedImage && (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={generatedImage.url}
                        alt="Generated content image"
                        className="w-full max-h-96 object-contain bg-black/5"
                      />
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-black/50 hover:bg-black/70 text-white border-0"
                          onClick={() => handleDownloadImage(generatedImage.url, item.platform)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Post Copy / Caption */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Caption</p>
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

                  {/* NEW FORMAT: Carousel Slides with Individual Image Prompts */}
                  {carouselSlides && carouselSlides.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          Carousel Slides ({carouselSlides.length})
                          {item.metadata?.carouselStyle && (
                            <span className="ml-2 text-primary">Style: {item.metadata.carouselStyle.slice(0, 50)}...</span>
                          )}
                        </p>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleGenerateAllSlides(item.id, carouselSlides)}
                          disabled={Object.keys(generatingSlides[item.id] || {}).length > 0}
                        >
                          <Images className="mr-2 h-4 w-4" />
                          Generate All Images
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        {carouselSlides.map((slide) => {
                          const slideImg = getSlideImage(item.id, slide.slideNumber);
                          const isGenerating = isSlideGenerating(item.id, slide.slideNumber);
                          const isApproved = isSlideApproved(item.id, slide.slideNumber);

                          return (
                            <div
                              key={slide.slideNumber}
                              className={`rounded-lg border p-4 ${isApproved ? "border-emerald-500 bg-emerald-500/5" : "bg-muted/20"}`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Slide {slide.slideNumber}
                                  </Badge>
                                  {isApproved && (
                                    <Badge className="bg-emerald-500 text-xs">
                                      <Check className="mr-1 h-3 w-3" />
                                      Approved
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {!isApproved ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10"
                                      onClick={() => handleApproveSlide(item.id, slide.slideNumber)}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-500 border-red-500 hover:bg-red-500/10"
                                      onClick={() => handleRejectSlide(item.id, slide.slideNumber)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                {/* Slide Image */}
                                <div className="space-y-2">
                                  {slideImg ? (
                                    <div className="relative rounded-lg overflow-hidden border aspect-[4/5]">
                                      <img
                                        src={slideImg}
                                        alt={`Slide ${slide.slideNumber}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute bottom-2 right-2 flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          className="bg-black/50 hover:bg-black/70 text-white border-0 h-8 w-8 p-0"
                                          onClick={() => handleDownloadImage(slideImg, item.platform, slide.slideNumber)}
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg border border-dashed aspect-[4/5] flex items-center justify-center bg-muted/10">
                                      <div className="text-center p-4">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">No image yet</p>
                                      </div>
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant={slideImg ? "outline" : "default"}
                                    className="w-full"
                                    onClick={() => handleGenerateImage(item.id, slide.imagePrompt, slide.slideNumber)}
                                    disabled={isGenerating}
                                    title={slide.imagePrompt}
                                  >
                                    {isGenerating ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                      </>
                                    ) : slideImg ? (
                                      <>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Regenerate
                                      </>
                                    ) : (
                                      <>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Generate Image
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* Slide Content */}
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Slide Text</p>
                                    <p className="text-sm">{slide.text}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Image Prompt</p>
                                    <p className="text-xs text-muted-foreground">{slide.imagePrompt}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* LEGACY FORMAT: Old carousel slides (just text) - with image generation */}
                  {legacySlides && legacySlides.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          Carousel ({legacySlides.length} slides)
                        </p>
                        {item.metadata?.imagePrompt && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              // Generate all legacy slide images
                              legacySlides.forEach((slideText, i) => {
                                const slidePrompt = `${item.metadata?.imagePrompt || ''} - Slide ${i + 1}: ${slideText.slice(0, 100)}`;
                                handleGenerateImage(item.id, slidePrompt, i + 1);
                              });
                            }}
                            disabled={Object.keys(generatingSlides[item.id] || {}).length > 0}
                          >
                            <Images className="mr-2 h-4 w-4" />
                            Generate All Images
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4">
                        {legacySlides.map((slideText, i) => {
                          const slideNum = i + 1;
                          const slideImg = getSlideImage(item.id, slideNum);
                          const isGenerating = isSlideGenerating(item.id, slideNum);
                          const isApproved = isSlideApproved(item.id, slideNum);
                          const slideImagePrompt = item.metadata?.imagePrompt
                            ? `${item.metadata.imagePrompt} - Slide ${slideNum}: ${slideText.slice(0, 100)}`
                            : `Create an image for: ${slideText}`;

                          return (
                            <div
                              key={i}
                              className={`rounded-lg border p-4 ${isApproved ? "border-emerald-500 bg-emerald-500/5" : "bg-muted/20"}`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Slide {slideNum}
                                  </Badge>
                                  {isApproved && (
                                    <Badge className="bg-emerald-500 text-xs">
                                      <Check className="mr-1 h-3 w-3" />
                                      Approved
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {!isApproved ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-emerald-500 border-emerald-500 hover:bg-emerald-500/10"
                                      onClick={() => handleApproveSlide(item.id, slideNum)}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-500 border-red-500 hover:bg-red-500/10"
                                      onClick={() => handleRejectSlide(item.id, slideNum)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                {/* Slide Image */}
                                <div className="space-y-2">
                                  {slideImg ? (
                                    <div className="relative rounded-lg overflow-hidden border aspect-[4/5]">
                                      <img
                                        src={slideImg}
                                        alt={`Slide ${slideNum}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute bottom-2 right-2 flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          className="bg-black/50 hover:bg-black/70 text-white border-0 h-8 w-8 p-0"
                                          onClick={() => handleDownloadImage(slideImg, item.platform, slideNum)}
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg border border-dashed aspect-[4/5] flex items-center justify-center bg-muted/10">
                                      <div className="text-center p-4">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">No image yet</p>
                                      </div>
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant={slideImg ? "outline" : "default"}
                                    className="w-full"
                                    onClick={() => handleGenerateImage(item.id, slideImagePrompt, slideNum)}
                                    disabled={isGenerating}
                                    title={slideImagePrompt}
                                  >
                                    {isGenerating ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                      </>
                                    ) : slideImg ? (
                                      <>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Regenerate
                                      </>
                                    ) : (
                                      <>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Generate Image
                                      </>
                                    )}
                                  </Button>
                                </div>

                                {/* Slide Content */}
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Slide Text</p>
                                    <p className="text-sm">{slideText}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Image Prompt</p>
                                    <p className="text-xs text-muted-foreground italic">{slideImagePrompt}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Thread Parts for Twitter */}
                  {item.copy_thread_parts && item.copy_thread_parts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Thread ({item.copy_thread_parts.length} tweets)</p>
                      <div className="space-y-2">
                        {item.copy_thread_parts.map((tweet, i) => (
                          <div key={i} className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground mb-1">Tweet {i + 1}</p>
                            <p className="text-sm">{tweet}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Non-carousel Image Generation */}
                  {!hasCarousel && item.metadata?.imagePrompt && (
                    <div className="rounded-lg border border-dashed p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Image Prompt</p>
                          <p className="text-sm text-muted-foreground">{item.metadata.imagePrompt}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={hasGeneratedImage(item.id) ? "outline" : "default"}
                          onClick={() => handleGenerateImage(item.id, item.metadata.imagePrompt!)}
                          disabled={generatingImage === item.id}
                        >
                          {generatingImage === item.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : hasGeneratedImage(item.id) ? (
                            <>
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Regenerate
                            </>
                          ) : (
                            <>
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Generate Image
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopyToClipboard(
                        `${item.copy_primary}\n\n${item.copy_hashtags?.map(h => `#${h}`).join(" ") || ""}`,
                        item.id
                      )}
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    {item.status === "draft" && (
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                        onClick={() => handleApprove(item.id)}
                        disabled={hasCarousel && !allSlidesApproved}
                        title={hasCarousel && !allSlidesApproved ? "Approve all slides first" : "Approve post"}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {hasCarousel && !allSlidesApproved
                          ? `Approve All Slides First (${approvedSlides[item.id]?.length || 0}/${totalSlides})`
                          : "Approve Post"
                        }
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
                </CardContent>
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
