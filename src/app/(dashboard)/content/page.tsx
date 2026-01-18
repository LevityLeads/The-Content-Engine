"use client";

import { useState, useEffect } from "react";
import { FileText, Eye, Send, Clock, RefreshCw, Loader2, Image as ImageIcon, Sparkles, Twitter, Linkedin, Instagram, Copy, Check, Download } from "lucide-react";
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

interface Content {
  id: string;
  platform: string;
  copy_primary: string;
  copy_hashtags: string[];
  copy_cta: string | null;
  copy_thread_parts: string[] | null;
  copy_carousel_slides: string[] | null;
  status: string;
  scheduled_for: string | null;
  metadata: {
    imagePrompt?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("draft");
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedCopy, setEditedCopy] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        // Fetch images for each content item
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
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  const handleGenerateImage = async (contentId: string, prompt: string) => {
    setGeneratingImage(contentId);
    setImageMessage(null);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, prompt }),
      });
      const data = await res.json();
      if (data.success) {
        setImageMessage(data.message);
        // Refresh images for this content
        fetchImagesForContent(contentId);
      } else {
        setImageMessage(data.error || "Failed to generate image");
      }
    } catch (err) {
      console.error("Error generating image:", err);
      setImageMessage("Error generating image");
    } finally {
      setGeneratingImage(null);
      // Clear message after 5 seconds
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

  const handleCopyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (id: string) => {
    await handleUpdateContent(id, { status: "approved" });
  };

  const handleDownloadImage = (url: string, platform: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${platform}-image.png`;
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
                    <Badge variant={item.status === "draft" ? "secondary" : item.status === "approved" ? "default" : "outline"}>
                      {item.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Generated Image Display */}
                  {generatedImage && (
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

                  {/* Post Copy */}
                  <div className="space-y-2">
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

                  {/* Carousel Slides for Instagram */}
                  {item.copy_carousel_slides && item.copy_carousel_slides.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Carousel ({item.copy_carousel_slides.length} slides)</p>
                      <div className="grid grid-cols-2 gap-2">
                        {item.copy_carousel_slides.map((slide, i) => (
                          <div key={i} className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground mb-1">Slide {i + 1}</p>
                            <p className="text-sm">{slide}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Generation */}
                  {item.metadata?.imagePrompt && (
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
