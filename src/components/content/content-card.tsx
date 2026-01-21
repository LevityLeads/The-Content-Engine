"use client";

import { useState } from "react";
import { 
  FileText, Send, Clock, Loader2, 
  Twitter, Linkedin, Instagram, Copy, Check, 
  Images, CheckCircle2, XCircle, ChevronDown, ChevronRight, 
  Trash2, Eye, Calendar, Video, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageCarousel, type CarouselImage } from "@/components/ui/image-carousel";
import { GenerationStatus } from "@/components/ui/generation-status";
import { cn } from "@/lib/utils";
import type { GenerationJob } from "@/hooks/use-generation-jobs";

// Platform configuration
const platformConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  twitter: {
    icon: <Twitter className="h-4 w-4" />,
    label: "Twitter",
    color: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  },
  instagram: {
    icon: <Instagram className="h-4 w-4" />,
    label: "Instagram",
    color: "bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 text-pink-400 border-pink-500/30",
  },
  linkedin: {
    icon: <Linkedin className="h-4 w-4" />,
    label: "LinkedIn",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: "Draft",
    color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    icon: <FileText className="h-3 w-3" />,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  published: {
    label: "Published",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: <Send className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: <XCircle className="h-3 w-3" />,
  },
};

interface ContentItem {
  id: string;
  status: string;
  platform: string;
  copy_primary: string;
  copy_secondary?: string;
  hashtags?: string[];
  cta?: string;
  scheduled_for?: string;
  created_at: string;
  ideas?: {
    concept: string;
    angle: string;
  };
}

interface ContentImage {
  id: string;
  image_url: string;
  prompt?: string;
  model?: string;
  slide_number?: number;
  media_type?: "image" | "video";
  video_url?: string;
}

interface ContentCardProps {
  content: ContentItem;
  images: ContentImage[];
  slideImages: Record<number, CarouselImage[]>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onSchedule: () => void;
  onMagicSchedule: () => void;
  onRetry?: () => void;
  onPreview: () => void;
  onDownloadImage: (url: string, platform: string, slideNumber?: number) => void;
  isPublishing?: boolean;
  isDeleting?: boolean;
  generationJob?: GenerationJob | null;
}

export function ContentCard({
  content,
  images,
  slideImages,
  isExpanded,
  onToggleExpand,
  onApprove,
  onDelete,
  onPublish,
  onSchedule,
  onMagicSchedule,
  onRetry,
  onPreview,
  onDownloadImage,
  isPublishing = false,
  isDeleting = false,
  generationJob,
}: ContentCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const platform = platformConfig[content.platform] || platformConfig.twitter;
  const status = statusConfig[content.status] || statusConfig.draft;

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Check if this is a carousel (multiple images or slide images)
  const isCarousel = images.length > 1 || Object.keys(slideImages).length > 0;
  
  // Get carousel images in order
  const getCarouselImages = (): CarouselImage[] => {
    if (Object.keys(slideImages).length > 0) {
      // Use slide images if available
      const allSlides: CarouselImage[] = [];
      const slideNumbers = Object.keys(slideImages).map(Number).sort((a, b) => a - b);
      for (const num of slideNumbers) {
        if (slideImages[num] && slideImages[num].length > 0) {
          allSlides.push(slideImages[num][0]);
        }
      }
      return allSlides;
    }
    // Fall back to regular images
    return images.map((img) => ({
      id: img.id,
      url: img.video_url || img.image_url,
      model: img.model,
      mediaType: img.media_type,
      prompt: img.prompt,
    }));
  };

  const carouselImages = getCarouselImages();
  const hasImages = carouselImages.length > 0;
  const hasVideo = images.some((img) => img.media_type === "video");

  // Handle download with current image tracking
  const handleDownload = (url: string) => {
    // Find the index of the current image in carousel
    const index = carouselImages.findIndex((img) => img.url === url);
    onDownloadImage(url, content.platform, index >= 0 ? index + 1 : undefined);
  };

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:border-border/60",
      isExpanded && "ring-1 ring-primary/20"
    )}>
      <CardContent className="p-4">
        {/* Header: Platform, Status, Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("gap-1", platform.color)}>
              {platform.icon}
              {platform.label}
            </Badge>
            <Badge variant="outline" className={cn("gap-1", status.color)}>
              {status.icon}
              {status.label}
            </Badge>
            {isCarousel && (
              <Badge variant="outline" className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                <Images className="h-3 w-3" />
                Carousel
              </Badge>
            )}
            {hasVideo && (
              <Badge variant="outline" className="gap-1 bg-violet-500/20 text-violet-400 border-violet-500/30">
                <Video className="h-3 w-3" />
                Video
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Concept/Angle */}
        {content.ideas && (
          <div className="mb-3">
            <p className="text-sm font-medium text-foreground">
              {content.ideas.concept}
            </p>
            <p className="text-xs text-muted-foreground">
              {content.ideas.angle}
            </p>
          </div>
        )}

        {/* Copy Preview */}
        <div className="mb-3">
          <p className="text-sm text-muted-foreground">
            {isExpanded ? content.copy_primary : truncateText(content.copy_primary)}
          </p>
        </div>

        {/* Generation Status */}
        {generationJob && generationJob.status !== "completed" && (
          <div className="mb-3">
            <GenerationStatus
              job={generationJob}
              onRetry={onRetry}
            />
          </div>
        )}

        {/* Image/Video Preview */}
        {hasImages && (
          <div className="mb-3">
            <ImageCarousel
              images={carouselImages}
              onDownload={handleDownload}
              className="rounded-lg overflow-hidden"
            />
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            {/* Secondary Copy */}
            {content.copy_secondary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Secondary Copy
                </p>
                <p className="text-sm">{content.copy_secondary}</p>
              </div>
            )}

            {/* Hashtags */}
            {content.hashtags && content.hashtags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Hashtags
                </p>
                <p className="text-sm text-blue-400">
                  {content.hashtags.map((h) => `#${h}`).join(" ")}
                </p>
              </div>
            )}

            {/* CTA */}
            {content.cta && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Call to Action
                </p>
                <p className="text-sm">{content.cta}</p>
              </div>
            )}

            {/* Scheduled Time */}
            {content.scheduled_for && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Scheduled For
                </p>
                <p className="text-sm">{formatDate(content.scheduled_for)}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(content.copy_primary, content.id)}
              className="h-8 px-2"
            >
              {copiedId === content.id ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreview}
              className="h-8 px-2"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {content.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                onClick={onApprove}
                className="h-8"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            {content.status === "approved" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onMagicSchedule}
                  className="h-8"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Magic
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSchedule}
                  className="h-8"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
                <Button
                  size="sm"
                  onClick={onPublish}
                  disabled={isPublishing}
                  className="h-8"
                >
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Publish
                </Button>
              </>
            )}
            {content.status === "failed" && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="h-8"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
