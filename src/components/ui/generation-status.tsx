"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import type { GenerationJob } from "@/hooks/use-generation-jobs";

interface GenerationStatusProps {
  job: GenerationJob | null;
  /** Compact mode for collapsed cards */
  compact?: boolean;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Callback when dismiss/clear is clicked */
  onDismiss?: () => void;
  /** Show progress bar */
  showProgress?: boolean;
  /** Custom class name */
  className?: string;
}

export function GenerationStatus({
  job,
  compact = false,
  onRetry,
  onDismiss,
  showProgress = true,
  className,
}: GenerationStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!job) return null;

  const { status, progress, current_step, error_message, error_code, total_items, completed_items } = job;

  // Compact badge for collapsed view
  if (compact) {
    if (status === "generating" || status === "pending") {
      const tooltipText = current_step
        ? `${current_step}${total_items > 1 ? ` (${completed_items}/${total_items} slides)` : ""}`
        : "Generating...";

      return (
        <Badge
          variant="secondary"
          className={cn(
            "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse cursor-default",
            className
          )}
          title={tooltipText}
        >
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          {progress}%
        </Badge>
      );
    }

    if (status === "failed") {
      const tooltipText = `${error_message || "Generation failed"}${error_code ? ` (${error_code})` : ""}\nClick to retry`;

      return (
        <Badge
          variant="secondary"
          className={cn(
            "bg-red-500/20 text-red-400 border-red-500/30 cursor-pointer hover:bg-red-500/30",
            className
          )}
          title={tooltipText}
          onClick={(e) => {
            e.stopPropagation();
            onRetry?.();
          }}
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }

    // Completed status - don't show anything in compact mode
    return null;
  }

  // Full status display for expanded view
  if (status === "generating" || status === "pending") {
    return (
      <div className={cn("rounded-lg border bg-blue-500/10 border-blue-500/30 p-3", className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-blue-400">
                Generating...
              </span>
              <span className="text-xs text-muted-foreground">
                {progress}%
              </span>
            </div>
            {showProgress && (
              <div className="h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {current_step && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {current_step}
              </p>
            )}
            {total_items > 1 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {completed_items}/{total_items} slides completed
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={cn("rounded-lg border bg-red-500/10 border-red-500/30 p-3", className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">
                  Generation Failed
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {error_message || "An error occurred during generation"}
                </p>
                {error_code && (
                  <button
                    className="text-xs text-muted-foreground/70 mt-0.5 hover:text-muted-foreground underline"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? "Hide details" : `Error code: ${error_code}`}
                  </button>
                )}
                {showDetails && job.error_details && (
                  <pre className="text-[10px] text-muted-foreground/60 mt-2 p-2 bg-black/20 rounded overflow-x-auto max-h-24">
                    {JSON.stringify(job.error_details, null, 2)}
                  </pre>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs border-red-500/30 text-red-400 hover:bg-red-500/20"
                    onClick={onRetry}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                    onClick={onDismiss}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "completed") {
    // Only show for a brief moment or if there was a partial error
    const hasPartialError = job.error_message && job.completed_items > 0;

    if (hasPartialError) {
      return (
        <div className={cn("rounded-lg border bg-yellow-500/10 border-yellow-500/30 p-3", className)}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-400">
                Completed with warnings
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {job.error_message}
              </p>
            </div>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground"
                onClick={onDismiss}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Don't show anything for fully successful completions
    return null;
  }

  return null;
}

/**
 * Inline status indicator for use in headers/titles
 */
export function GenerationStatusInline({
  job,
  className,
}: {
  job: GenerationJob | null;
  className?: string;
}) {
  if (!job) return null;

  const { status, progress, error_message, error_code } = job;

  if (status === "generating" || status === "pending") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-blue-400", className)}
        title="Generating..."
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="text-xs font-medium">{progress}%</span>
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-red-400", className)}
        title={`${error_message || "Generation failed"}${error_code ? ` (${error_code})` : ""}`}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Failed</span>
      </span>
    );
  }

  return null;
}
