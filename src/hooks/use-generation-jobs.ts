"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface GenerationJob {
  id: string;
  content_id: string;
  type: "single" | "carousel" | "composite" | "video";
  status: "pending" | "generating" | "completed" | "failed";
  progress: number;
  total_items: number;
  completed_items: number;
  current_step: string | null;
  error_message: string | null;
  error_code: string | null;
  error_details: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface UseGenerationJobsOptions {
  /** Content IDs to track (if provided, only tracks these) */
  contentIds?: string[];
  /** Polling interval in ms (default: 2000) */
  pollInterval?: number;
  /** Whether to auto-poll for active jobs (default: true) */
  autoPoll?: boolean;
}

interface UseGenerationJobsReturn {
  /** Map of content ID to their jobs */
  jobsByContent: Record<string, GenerationJob[]>;
  /** All active jobs (generating or pending) */
  activeJobs: GenerationJob[];
  /** Get the latest job for a content item */
  getLatestJob: (contentId: string) => GenerationJob | null;
  /** Get active job for a content item */
  getActiveJob: (contentId: string) => GenerationJob | null;
  /** Check if content has an active generation */
  isGenerating: (contentId: string) => boolean;
  /** Check if content has a failed job (most recent) */
  hasFailed: (contentId: string) => boolean;
  /** Get error message for content */
  getError: (contentId: string) => { message: string; code: string | null; details: Record<string, unknown> | null } | null;
  /** Refresh jobs manually */
  refresh: () => Promise<void>;
  /** Clear a failed job (for retry) */
  clearJob: (jobId: string) => Promise<void>;
  /** Loading state */
  isLoading: boolean;
}

export function useGenerationJobs(options: UseGenerationJobsOptions = {}): UseGenerationJobsReturn {
  const { contentIds, pollInterval = 2000, autoPoll = true } = options;

  const [jobsByContent, setJobsByContent] = useState<Record<string, GenerationJob[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to store jobsByContent for checking active jobs inside the interval
  // This prevents the polling effect from recreating on every state change
  const jobsByContentRef = useRef<Record<string, GenerationJob[]>>({});

  // Keep the ref in sync with state
  useEffect(() => {
    jobsByContentRef.current = jobsByContent;
  }, [jobsByContent]);

  const fetchJobs = useCallback(async () => {
    try {
      // If we have specific content IDs, fetch for each
      if (contentIds && contentIds.length > 0) {
        const allJobs: Record<string, GenerationJob[]> = {};

        await Promise.all(
          contentIds.map(async (contentId) => {
            const res = await fetch(`/api/images/jobs?contentId=${contentId}`);
            const data = await res.json();
            if (data.success && data.jobs) {
              allJobs[contentId] = data.jobs;
            }
          })
        );

        setJobsByContent(allJobs);
      } else {
        // Fetch all active jobs
        const res = await fetch("/api/images/jobs");
        const data = await res.json();

        if (data.success && data.jobs) {
          // Group by content ID
          const grouped: Record<string, GenerationJob[]> = {};
          for (const job of data.jobs) {
            if (!grouped[job.content_id]) {
              grouped[job.content_id] = [];
            }
            grouped[job.content_id].push(job);
          }
          setJobsByContent(grouped);
        }
      }
    } catch (error) {
      console.error("Error fetching generation jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [contentIds]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Polling for active jobs
  useEffect(() => {
    if (!autoPoll) return;

    const startPolling = () => {
      pollIntervalRef.current = setInterval(() => {
        // Only poll if there are active jobs
        // Use ref to avoid recreating the effect on every state change
        const hasActiveJobs = Object.values(jobsByContentRef.current).some(jobs =>
          jobs.some(job => job.status === "generating" || job.status === "pending")
        );

        if (hasActiveJobs) {
          fetchJobs();
        }
      }, pollInterval);
    };

    startPolling();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [autoPoll, pollInterval, fetchJobs]);

  const activeJobs = Object.values(jobsByContent)
    .flat()
    .filter(job => job.status === "generating" || job.status === "pending");

  const getLatestJob = useCallback((contentId: string): GenerationJob | null => {
    const jobs = jobsByContent[contentId];
    if (!jobs || jobs.length === 0) return null;
    // Jobs are ordered by created_at desc
    return jobs[0];
  }, [jobsByContent]);

  const getActiveJob = useCallback((contentId: string): GenerationJob | null => {
    const jobs = jobsByContent[contentId];
    if (!jobs || jobs.length === 0) return null;
    return jobs.find(job => job.status === "generating" || job.status === "pending") || null;
  }, [jobsByContent]);

  const isGenerating = useCallback((contentId: string): boolean => {
    return getActiveJob(contentId) !== null;
  }, [getActiveJob]);

  const hasFailed = useCallback((contentId: string): boolean => {
    const latestJob = getLatestJob(contentId);
    return latestJob?.status === "failed";
  }, [getLatestJob]);

  const getError = useCallback((contentId: string) => {
    const latestJob = getLatestJob(contentId);
    if (!latestJob || latestJob.status !== "failed") return null;
    return {
      message: latestJob.error_message || "Generation failed",
      code: latestJob.error_code,
      details: latestJob.error_details,
    };
  }, [getLatestJob]);

  const clearJob = useCallback(async (jobId: string) => {
    // Optimistically remove the job from local state immediately for instant UI feedback
    setJobsByContent(prev => {
      const updated: Record<string, GenerationJob[]> = {};
      for (const contentId in prev) {
        updated[contentId] = prev[contentId].filter(job => job.id !== jobId);
      }
      return updated;
    });

    // Then delete from server in background
    try {
      await fetch(`/api/images/jobs?jobId=${jobId}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error clearing job:", error);
      // Refetch to restore correct state if delete failed
      await fetchJobs();
    }
  }, [fetchJobs]);

  return {
    jobsByContent,
    activeJobs,
    getLatestJob,
    getActiveJob,
    isGenerating,
    hasFailed,
    getError,
    refresh: fetchJobs,
    clearJob,
    isLoading,
  };
}
