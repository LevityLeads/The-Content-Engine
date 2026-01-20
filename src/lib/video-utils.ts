// Video generation utilities - cost estimation and validation

import { VIDEO_MODELS, type VideoModelKey, DEFAULT_VIDEO_MODEL } from "./video-models";
import { type BrandVideoConfig, DEFAULT_VIDEO_CONFIG } from "@/types/database";

// Video cost estimation
export interface VideoEstimate {
  model: VideoModelKey;
  modelName: string;
  duration: number;
  includeAudio: boolean;
  videoCost: number;
  audioCost: number;
  totalCost: number;
  formatted: string;
}

export function estimateVideoCost(
  model: VideoModelKey = DEFAULT_VIDEO_MODEL,
  durationSeconds: number = 5,
  includeAudio: boolean = false
): VideoEstimate {
  const modelConfig = VIDEO_MODELS[model];
  const videoCost = durationSeconds * modelConfig.costPerSecond;
  const audioCost = includeAudio ? durationSeconds * modelConfig.audioCostPerSecond : 0;
  const totalCost = videoCost + audioCost;

  return {
    model,
    modelName: modelConfig.name,
    duration: durationSeconds,
    includeAudio,
    videoCost,
    audioCost,
    totalCost,
    formatted: `$${totalCost.toFixed(2)}`,
  };
}

// Budget validation
export interface BudgetCheckResult {
  canGenerate: boolean;
  estimatedCost: number;
  monthlyBudget: number | null;
  monthlyUsed: number;
  budgetRemaining: number | null;
  dailyLimit: number | null;
  dailyUsed: number;
  withinDailyLimit: boolean;
  withinBudget: boolean;
  warning: string | null;
}

export function checkBudgetLimits(
  videoConfig: BrandVideoConfig | null,
  monthlyUsed: number,
  dailyCount: number,
  estimatedCost: number
): BudgetCheckResult {
  const config = videoConfig || DEFAULT_VIDEO_CONFIG;

  const budgetRemaining = config.monthly_budget_usd !== null
    ? config.monthly_budget_usd - monthlyUsed
    : null;

  const withinBudget = budgetRemaining === null || estimatedCost <= budgetRemaining;
  const withinDailyLimit = config.daily_limit === null || dailyCount < config.daily_limit;

  let warning: string | null = null;
  if (!withinBudget) {
    warning = `Would exceed monthly budget ($${config.monthly_budget_usd} limit, $${monthlyUsed.toFixed(2)} used)`;
  } else if (!withinDailyLimit) {
    warning = `Daily video limit reached (${config.daily_limit} videos/day)`;
  } else if (budgetRemaining !== null && estimatedCost > budgetRemaining * 0.8) {
    warning = `Low budget remaining ($${budgetRemaining.toFixed(2)} left after this video)`;
  }

  return {
    canGenerate: config.enabled && withinBudget && withinDailyLimit,
    estimatedCost,
    monthlyBudget: config.monthly_budget_usd,
    monthlyUsed,
    budgetRemaining,
    dailyLimit: config.daily_limit,
    dailyUsed: dailyCount,
    withinDailyLimit,
    withinBudget,
    warning,
  };
}

// Duration validation
export function validateDuration(
  duration: number,
  videoConfig: BrandVideoConfig | null
): { valid: boolean; adjustedDuration: number; message: string | null } {
  const config = videoConfig || DEFAULT_VIDEO_CONFIG;
  const minDuration = 3;
  const maxDuration = config.max_duration;

  if (duration < minDuration) {
    return {
      valid: false,
      adjustedDuration: minDuration,
      message: `Minimum duration is ${minDuration} seconds`,
    };
  }

  if (duration > maxDuration) {
    return {
      valid: false,
      adjustedDuration: maxDuration,
      message: `Maximum duration is ${maxDuration} seconds`,
    };
  }

  return {
    valid: true,
    adjustedDuration: duration,
    message: null,
  };
}

// Format cost for display
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

// Format usage percentage
export function formatUsagePercentage(used: number, budget: number | null): string {
  if (budget === null) return "No limit";
  const percentage = Math.min((used / budget) * 100, 100);
  return `${percentage.toFixed(0)}%`;
}

// Get usage status color
export function getUsageStatusColor(used: number, budget: number | null): "green" | "yellow" | "red" {
  if (budget === null) return "green";
  const percentage = (used / budget) * 100;
  if (percentage >= 90) return "red";
  if (percentage >= 70) return "yellow";
  return "green";
}

// Calculate actual cost after generation (for recording)
export function calculateActualCost(
  model: VideoModelKey,
  durationSeconds: number,
  hasAudio: boolean
): number {
  const modelConfig = VIDEO_MODELS[model];
  const videoCost = durationSeconds * modelConfig.costPerSecond;
  const audioCost = hasAudio ? durationSeconds * modelConfig.audioCostPerSecond : 0;
  return videoCost + audioCost;
}
