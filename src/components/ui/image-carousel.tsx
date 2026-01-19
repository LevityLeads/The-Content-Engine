"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CarouselImage {
  id: string;
  url: string;
  model?: string;
  createdAt?: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  aspectRatio?: string;
  onDownload?: (url: string) => void;
  onDelete?: (id: string) => void;
  modelBadge?: (model: string) => React.ReactNode;
  className?: string;
  emptyState?: React.ReactNode;
  showThumbnails?: boolean;
}

export function ImageCarousel({
  images,
  aspectRatio = "aspect-video",
  onDownload,
  onDelete,
  modelBadge,
  className,
  emptyState,
  showThumbnails = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter to only valid images (not placeholders)
  const validImages = images.filter(
    (img) => img.url && !img.url.startsWith("placeholder:")
  );

  // Reset to first image when images array changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [validImages.length]);

  // If no valid images, show empty state
  if (validImages.length === 0) {
    return emptyState || null;
  }

  // Ensure currentIndex is within bounds
  const safeIndex = Math.min(currentIndex, validImages.length - 1);
  const currentImage = validImages[safeIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
  };

  const hasMultiple = validImages.length > 1;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main image container */}
      <div className="relative rounded-lg overflow-hidden border bg-black/5">
        <div className={cn("relative", aspectRatio)}>
          <img
            src={currentImage.url}
            alt={`Generated image ${safeIndex + 1} of ${validImages.length}`}
            className="w-full h-full object-cover"
          />

          {/* Model badge - top left */}
          {currentImage.model && modelBadge && (
            <div className="absolute top-2 left-2">
              {modelBadge(currentImage.model)}
            </div>
          )}

          {/* Image counter - top right */}
          {hasMultiple && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className="bg-black/70 text-white border-0 text-xs font-medium"
              >
                {safeIndex + 1} / {validImages.length}
              </Badge>
            </div>
          )}

          {/* Navigation arrows - ALWAYS visible when multiple images */}
          {hasMultiple && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/70 hover:bg-black/90 text-white border-0 shadow-lg"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/70 hover:bg-black/90 text-white border-0 shadow-lg"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Download button - bottom right */}
          {onDownload && (
            <div className="absolute bottom-2 right-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-black/70 hover:bg-black/90 text-white border-0 h-8 w-8 p-0"
                onClick={() => onDownload(currentImage.url)}
                title="Download image"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail strip - show when multiple images */}
      {hasMultiple && showThumbnails && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {validImages.map((img, idx) => (
            <button
              key={img.id}
              className={cn(
                "flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all",
                idx === safeIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
              onClick={() => setCurrentIndex(idx)}
              title={`Version ${idx + 1}${idx === 0 ? " (newest)" : ""}`}
            >
              <img
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Version indicator text */}
      {hasMultiple && (
        <p className="text-xs text-muted-foreground text-center">
          Showing version {safeIndex + 1} of {validImages.length}
          {safeIndex === 0 && " (newest)"}
        </p>
      )}
    </div>
  );
}
