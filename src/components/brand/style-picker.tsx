"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StyleSample {
  id: string;
  visualStyle: string;
  textStyle: string;
  textColor: string;
  name: string;
  description: string;
  image: string | null;
  error?: string;
  designSystem: {
    background: string;
    primaryColor: string;
    accentColor: string;
    typography: string;
    layout: string;
    mood: string;
  };
}

export interface SelectedStyle {
  visualStyle: string;
  textStyle: string;
  textColor: string;
  designSystem: StyleSample["designSystem"];
  sampleImage?: string;
}

interface StylePickerProps {
  brandColors: {
    primary_color?: string;
    accent_color?: string;
  };
  brandName: string;
  onStyleSelected: (style: SelectedStyle) => void;
  onSkip?: () => void;
}

export function StylePicker({
  brandColors,
  brandName,
  onStyleSelected,
  onSkip,
}: StylePickerProps) {
  const [samples, setSamples] = useState<StyleSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const generateSamples = async () => {
    setIsLoading(true);
    setError(null);
    setSamples([]);
    setSelectedId(null);
    setLoadedImages(new Set());

    try {
      const res = await fetch("/api/brands/style-samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandColors,
          brandName,
        }),
      });

      const data = await res.json();

      if (data.success && data.samples) {
        setSamples(data.samples);
        // Auto-select first successful sample
        const firstSuccess = data.samples.find((s: StyleSample) => s.image);
        if (firstSuccess) {
          setSelectedId(firstSuccess.id);
        }
      } else {
        setError(data.error || "Failed to generate style samples");
      }
    } catch (err) {
      console.error("Error generating style samples:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateSamples();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (sample: StyleSample) => {
    if (!sample.image) return;
    setSelectedId(sample.id);
  };

  const handleConfirm = () => {
    const selected = samples.find((s) => s.id === selectedId);
    if (selected) {
      onStyleSelected({
        visualStyle: selected.visualStyle,
        textStyle: selected.textStyle,
        textColor: selected.textColor,
        designSystem: selected.designSystem,
        sampleImage: selected.image || undefined,
      });
    }
  };

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set([...prev, id]));
  };

  if (isLoading) {
    return (
      <div className="py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="relative mx-auto w-16 h-16">
            <Sparkles className="absolute inset-0 h-16 w-16 text-primary/20 animate-pulse" />
            <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-primary" />
          </div>
          <p className="text-sm font-medium">Generating style examples...</p>
          <p className="text-xs text-muted-foreground">
            Creating 4 unique visual styles for {brandName}
          </p>
        </div>

        {/* Preview placeholders showing what's being generated */}
        <div className="grid grid-cols-2 gap-4">
          {["Bold Typography", "Photo Style", "Modern 3D", "Abstract Art"].map((styleName, i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden border-2 border-dashed border-muted animate-pulse"
            >
              <div className="aspect-[4/5] bg-muted/50 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2
                    className="h-6 w-6 animate-spin text-muted-foreground mx-auto"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                  <p className="text-xs text-muted-foreground">{styleName}</p>
                </div>
              </div>
              <div className="p-3 bg-card/50">
                <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                <div className="h-3 bg-muted/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Using high-quality generation - this may take 30-60 seconds...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center space-y-4">
        <p className="text-sm text-red-400">{error}</p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={onSkip}>
            Skip for now
          </Button>
          <Button onClick={generateSamples}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const successfulSamples = samples.filter((s) => s.image);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">Choose Your Brand Style</h3>
        <p className="text-sm text-muted-foreground">
          Select the visual style that best fits {brandName}. This will be your default for all content.
        </p>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-2 gap-4">
        {samples.map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleSelect(sample)}
            disabled={!sample.image}
            className={cn(
              "relative rounded-lg overflow-hidden border-2 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              selectedId === sample.id
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-border hover:border-primary/50",
              !sample.image && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Image Container */}
            <div className="aspect-[4/5] bg-muted relative">
              {sample.image ? (
                <>
                  {/* Loading placeholder */}
                  {!loadedImages.has(sample.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <img
                    src={sample.image}
                    alt={sample.name}
                    className={cn(
                      "w-full h-full object-cover transition-opacity duration-300",
                      loadedImages.has(sample.id) ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => handleImageLoad(sample.id)}
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Failed to generate</p>
                </div>
              )}

              {/* Selected Indicator */}
              {selectedId === sample.id && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Label */}
            <div className="p-3 bg-card">
              <p className="font-medium text-sm">{sample.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {sample.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Regenerate Option - Always show */}
      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={generateSamples} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          {successfulSamples.length < 4 ? "Regenerate samples" : "Generate new samples"}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={handleConfirm} disabled={!selectedId}>
          <Check className="mr-2 h-4 w-4" />
          Use This Style
        </Button>
      </div>
    </div>
  );
}
