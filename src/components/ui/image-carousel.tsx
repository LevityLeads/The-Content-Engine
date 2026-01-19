"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
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
}

export function ImageCarousel({
  images,
  aspectRatio = "aspect-video",
  onDownload,
  onDelete,
  modelBadge,
  className,
  emptyState,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter to only valid images (not placeholders)
  const validImages = images.filter(
    (img) => img.url && !img.url.startsWith("placeholder:")
  );

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
    <div className={cn("relative rounded-lg overflow-hidden border group", className)}>
      {/* Image */}
      <div className={cn("relative bg-black/5", aspectRatio)}>
        <img
          src={currentImage.url}
          alt={`Generated image ${safeIndex + 1} of ${validImages.length}`}
          className="w-full h-full object-cover"
        />

        {/* Model badge */}
        {currentImage.model && modelBadge && (
          <div className="absolute top-2 left-2">
            {modelBadge(currentImage.model)}
          </div>
        )}

        {/* Image counter */}
        {hasMultiple && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="bg-black/60 text-white border-0 text-xs"
            >
              {safeIndex + 1} / {validImages.length}
            </Badge>
          </div>
        )}

        {/* Navigation arrows - only show if multiple images */}
        {hasMultiple && (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Bottom action bar */}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDownload && (
            <Button
              size="sm"
              variant="secondary"
              className="bg-black/50 hover:bg-black/70 text-white border-0 h-8 w-8 p-0"
              onClick={() => onDownload(currentImage.url)}
              title="Download image"
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="secondary"
              className="bg-black/50 hover:bg-red-600/80 text-white border-0 h-8 w-8 p-0"
              onClick={() => onDelete(currentImage.id)}
              title="Delete image"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Dot indicators - only show if multiple and less than 10 */}
      {hasMultiple && validImages.length <= 10 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
          {validImages.map((_, idx) => (
            <button
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === safeIndex
                  ? "bg-white scale-110"
                  : "bg-white/50 hover:bg-white/75"
              )}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
