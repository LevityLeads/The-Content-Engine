"use client";

import { useState, useEffect } from "react";
import { Video, DollarSign, Clock, Volume2, VolumeX, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VIDEO_MODELS, type VideoModelKey } from "@/lib/video-models";

interface VideoEstimate {
  model: VideoModelKey;
  modelName: string;
  duration: number;
  includeAudio: boolean;
  totalCost: number;
  formatted: string;
}

interface VideoLimits {
  monthlyBudget: number | null;
  monthlyUsed: number;
  budgetRemaining: number | null;
  dailyLimit: number | null;
  dailyUsed: number;
  withinBudget: boolean;
  withinDailyLimit: boolean;
}

interface VideoConfig {
  defaultModel: VideoModelKey;
  defaultDuration: number;
  maxDuration: number;
  includeAudioDefault: boolean;
}

interface VideoCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (options: { model: VideoModelKey; duration: number; includeAudio: boolean }) => void;
  onFallbackToImage: () => void;
  brandId: string;
  isGenerating?: boolean;
}

export function VideoCostDialog({
  open,
  onOpenChange,
  onConfirm,
  onFallbackToImage,
  brandId,
  isGenerating = false,
}: VideoCostDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [estimate, setEstimate] = useState<VideoEstimate | null>(null);
  const [limits, setLimits] = useState<VideoLimits | null>(null);
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [canGenerate, setCanGenerate] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  // Local state for user selections
  const [selectedModel, setSelectedModel] = useState<VideoModelKey>("veo-3.1-fast");
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [includeAudio, setIncludeAudio] = useState(false);

  // Fetch estimate when dialog opens or settings change
  useEffect(() => {
    if (open && brandId) {
      fetchEstimate();
    }
  }, [open, brandId, selectedModel, selectedDuration, includeAudio]);

  const fetchEstimate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/videos/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          model: selectedModel,
          duration: selectedDuration,
          includeAudio,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEnabled(data.enabled);
        setCanGenerate(data.canGenerate);
        setWarning(data.warning);
        setEstimate(data.estimate);
        setLimits(data.limits);
        setConfig(data.config);

        // Initialize selections from config on first load
        if (data.config && !estimate) {
          setSelectedModel(data.config.defaultModel);
          setSelectedDuration(data.config.defaultDuration);
          setIncludeAudio(data.config.includeAudioDefault);
        }
      }
    } catch (err) {
      console.error("Error fetching video estimate:", err);
      setWarning("Failed to fetch estimate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      model: selectedModel,
      duration: selectedDuration,
      includeAudio,
    });
  };

  const usagePercentage = limits?.monthlyBudget
    ? Math.min((limits.monthlyUsed / limits.monthlyBudget) * 100, 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-violet-500" />
            Generate Video
          </DialogTitle>
          <DialogDescription>
            AI video generation using Veo 3. Review cost before proceeding.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !enabled ? (
          <div className="py-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <p className="text-muted-foreground mb-4">
              Video generation is not enabled for this brand.
            </p>
            <p className="text-sm text-muted-foreground">
              Enable it in Settings → Video Generation
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Cost Display */}
            <div className="rounded-lg bg-violet-500/10 border border-violet-500/30 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
              <p className="text-3xl font-bold text-violet-400">
                {estimate?.formatted || "$0.00"}
              </p>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(VIDEO_MODELS) as VideoModelKey[]).map((modelKey) => {
                  const model = VIDEO_MODELS[modelKey];
                  return (
                    <button
                      key={modelKey}
                      onClick={() => setSelectedModel(modelKey)}
                      className={cn(
                        "flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left",
                        selectedModel === modelKey
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-muted hover:border-muted-foreground/50"
                      )}
                    >
                      <span className="font-medium text-sm">{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ${model.costPerSecond.toFixed(2)}/sec
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration: {selectedDuration} seconds
              </label>
              <div className="flex gap-2">
                {[3, 4, 5, 6, 7, 8].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    disabled={Boolean(config?.maxDuration && d > config.maxDuration)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                      selectedDuration === d
                        ? "border-violet-500 bg-violet-500/10 text-violet-400"
                        : "border-muted hover:border-muted-foreground/50",
                      config?.maxDuration && d > config.maxDuration && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                {includeAudio ? (
                  <Volume2 className="h-4 w-4 text-violet-400" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Include Audio</span>
                <Badge variant="outline" className="text-xs">
                  +${(VIDEO_MODELS[selectedModel].audioCostPerSecond * selectedDuration).toFixed(2)}
                </Badge>
              </div>
              <button
                onClick={() => setIncludeAudio(!includeAudio)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  includeAudio ? "bg-violet-500" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                    includeAudio ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Budget Status */}
            {limits && limits.monthlyBudget !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Monthly Budget
                  </span>
                  <span>
                    ${limits.monthlyUsed.toFixed(2)} / ${limits.monthlyBudget.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      usagePercentage >= 90
                        ? "bg-red-500"
                        : usagePercentage >= 70
                          ? "bg-yellow-500"
                          : "bg-violet-500"
                    )}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                {limits.budgetRemaining !== null && (
                  <p className="text-xs text-muted-foreground text-right">
                    ${limits.budgetRemaining.toFixed(2)} remaining
                  </p>
                )}
              </div>
            )}

            {/* Daily Limit */}
            {limits && limits.dailyLimit !== null && (
              <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                <span className="text-muted-foreground">Daily videos</span>
                <span>
                  {limits.dailyUsed} / {limits.dailyLimit}
                </span>
              </div>
            )}

            {/* Warning */}
            {warning && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm">{warning}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onFallbackToImage} disabled={isGenerating}>
            Use Image Instead
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canGenerate || isLoading || isGenerating}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Generate Video {estimate?.formatted}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
