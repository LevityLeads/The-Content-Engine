"use client";

import { useState } from "react";
import { Loader2, Check, RefreshCw, Sparkles, X, Plus, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Suggested style tags organized by category
const STYLE_TAG_CATEGORIES = [
  {
    name: "Visual Style",
    tags: ["illustration", "photography", "3d", "abstract", "minimalist", "collage"],
  },
  {
    name: "Mood",
    tags: ["soft", "bold", "playful", "serious", "elegant", "energetic"],
  },
  {
    name: "Color Feel",
    tags: ["warm", "cool", "vibrant", "muted", "dark", "light"],
  },
];

const ALL_SUGGESTED_TAGS = STYLE_TAG_CATEGORIES.flatMap((c) => c.tags);

export interface StyleSample {
  id: string;
  visualStyle: string;
  textStyle: string;
  textColor: string;
  name: string;
  description: string;
  image: string | null;
  error?: string;
  keywords: string[];
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
  keywords?: string[];
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

type Step = "select-keywords" | "generating" | "select-styles";

export function StylePicker({
  brandColors,
  brandName,
  onStyleSelected,
  onSkip,
}: StylePickerProps) {
  // Step management
  const [step, setStep] = useState<Step>("select-keywords");

  // Keyword selection
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState("");

  // Generated samples
  const [samples, setSamples] = useState<StyleSample[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Multi-select for favorite styles
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Lightbox for enlarged view
  const [enlargedSample, setEnlargedSample] = useState<StyleSample | null>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomKeyword = () => {
    const keyword = customKeyword.trim().toLowerCase();
    if (keyword && !selectedTags.includes(keyword)) {
      setSelectedTags((prev) => [...prev, keyword]);
      setCustomKeyword("");
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const generateSamples = async () => {
    setStep("generating");
    setError(null);
    setSamples([]);
    setSelectedIds(new Set());
    setLoadedImages(new Set());

    try {
      const res = await fetch("/api/brands/style-samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandColors,
          brandName,
          keywords: selectedTags,
          count: 8,
        }),
      });

      const data = await res.json();

      if (data.success && data.samples) {
        setSamples(data.samples);
        setStep("select-styles");
      } else {
        setError(data.error || "Failed to generate style samples");
        setStep("select-keywords");
      }
    } catch (err) {
      console.error("Error generating style samples:", err);
      setError("Network error. Please try again.");
      setStep("select-keywords");
    }
  };

  const toggleStyleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    // Get the first selected sample as the primary default
    const selectedSamples = samples.filter((s) => selectedIds.has(s.id) && s.image);
    if (selectedSamples.length > 0) {
      const primary = selectedSamples[0];
      onStyleSelected({
        visualStyle: primary.visualStyle,
        textStyle: primary.textStyle,
        textColor: primary.textColor,
        designSystem: primary.designSystem,
        sampleImage: primary.image || undefined,
        keywords: selectedTags,
      });
    }
  };

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set([...prev, id]));
  };

  // Step 1: Select Keywords
  if (step === "select-keywords") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">What styles fit {brandName}?</h3>
          <p className="text-sm text-muted-foreground">
            Select keywords that describe your brand&apos;s visual style. We&apos;ll generate 8 examples.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Selected keywords:</label>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="cursor-pointer pr-1.5"
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggested tags by category */}
        <div className="space-y-4">
          {STYLE_TAG_CATEGORIES.map((category) => (
            <div key={category.name} className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">{category.name}</label>
              <div className="flex flex-wrap gap-2">
                {category.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Custom keyword input */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Add custom keyword:</label>
          <div className="flex gap-2">
            <Input
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="e.g., vintage, tech, organic..."
              onKeyDown={(e) => e.key === "Enter" && addCustomKeyword()}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={addCustomKeyword} disabled={!customKeyword.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
          <Button onClick={generateSamples} disabled={selectedTags.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate {selectedTags.length > 0 ? "8" : ""} Examples
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Generating
  if (step === "generating") {
    return (
      <div className="py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="relative mx-auto w-16 h-16">
            <Sparkles className="absolute inset-0 h-16 w-16 text-primary/20 animate-pulse" />
            <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-primary" />
          </div>
          <p className="text-sm font-medium">Generating style examples...</p>
          <p className="text-xs text-muted-foreground">
            Creating 8 unique styles based on: {selectedTags.join(", ")}
          </p>
        </div>

        {/* Preview placeholders */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden border-2 border-dashed border-muted animate-pulse"
            >
              <div className="aspect-[4/5] bg-muted/50 flex items-center justify-center">
                <Loader2
                  className="h-6 w-6 animate-spin text-muted-foreground"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              </div>
              <div className="p-2.5 bg-card">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted/50 rounded w-1/2 mt-1" />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          This may take 30-60 seconds...
        </p>
      </div>
    );
  }

  // Step 3: Select Styles
  const successfulSamples = samples.filter((s) => s.image);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">Select your favorite styles</h3>
        <p className="text-sm text-muted-foreground">
          Click to select the styles that work best for {brandName}. Select at least one.
        </p>
      </div>

      {/* Keywords used */}
      <div className="flex flex-wrap gap-1 justify-center">
        {selectedTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Style Grid - 4 columns with larger images */}
      <div className="grid grid-cols-4 gap-4">
        {samples.map((sample) => (
          <div
            key={sample.id}
            className={cn(
              "relative rounded-lg overflow-hidden border-2 transition-all group",
              selectedIds.has(sample.id)
                ? "border-primary ring-2 ring-primary ring-offset-1"
                : "border-border hover:border-primary/50",
              !sample.image && "opacity-50"
            )}
          >
            {/* Image Container - larger aspect ratio */}
            <button
              onClick={() => sample.image && toggleStyleSelection(sample.id)}
              disabled={!sample.image}
              className="w-full aspect-[4/5] bg-muted relative focus:outline-none"
            >
              {sample.image ? (
                <>
                  {!loadedImages.has(sample.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              )}

              {/* Selected Indicator */}
              {selectedIds.has(sample.id) && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}

              {/* Magnify button - appears on hover */}
              {sample.image && loadedImages.has(sample.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEnlargedSample(sample);
                  }}
                  className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Enlarge"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              )}
            </button>

            {/* Label */}
            <div className="p-2.5 bg-card">
              <p className="font-medium text-sm truncate">{sample.name}</p>
              <p className="text-xs text-muted-foreground truncate">{sample.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Selection count */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {selectedIds.size} style{selectedIds.size !== 1 ? "s" : ""} selected
        </p>
      </div>

      {/* Regenerate Option */}
      <div className="flex justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setStep("select-keywords")}>
          ← Change keywords
        </Button>
        <Button variant="ghost" size="sm" onClick={generateSamples}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
          <Check className="mr-2 h-4 w-4" />
          Use Selected Style{selectedIds.size !== 1 ? "s" : ""}
        </Button>
      </div>

      {/* Lightbox for enlarged view */}
      <Dialog open={!!enlargedSample} onOpenChange={() => setEnlargedSample(null)}>
        <DialogContent className="sm:max-w-[600px] p-2">
          {enlargedSample && enlargedSample.image && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden">
                <img
                  src={enlargedSample.image}
                  alt={enlargedSample.name}
                  className="w-full h-auto"
                />
              </div>
              <div className="px-2 pb-2">
                <h4 className="font-semibold">{enlargedSample.name}</h4>
                <p className="text-sm text-muted-foreground">{enlargedSample.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {enlargedSample.visualStyle}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {enlargedSample.textStyle}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 px-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEnlargedSample(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    toggleStyleSelection(enlargedSample.id);
                    setEnlargedSample(null);
                  }}
                >
                  {selectedIds.has(enlargedSample.id) ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Deselect
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Select
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
