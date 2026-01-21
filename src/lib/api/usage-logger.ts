/**
 * API Usage Logger
 * Tracks API calls, tokens, and estimated costs for monitoring
 */

// Pricing per 1M tokens (as of 2024)
const PRICING = {
  "claude-opus-4-5-20251101": { input: 15, output: 75 },
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "gemini-2.0-flash-exp": { input: 0.075, output: 0.30 },
  "gemini-1.5-pro": { input: 1.25, output: 5.00 },
  "veo-3.1-fast": { perSecond: 0.25 }, // video + audio combined
  "veo-3.0": { perSecond: 0.75 },
} as const;

export interface UsageEntry {
  timestamp: Date;
  service: "anthropic" | "google" | "late.dev" | "supabase";
  model?: string;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  durationSeconds?: number;
  estimatedCost?: number;
  metadata?: Record<string, unknown>;
}

// In-memory usage log (for current session)
const usageLog: UsageEntry[] = [];

/**
 * Log an API usage entry
 */
export function logUsage(entry: Omit<UsageEntry, "timestamp">): void {
  const fullEntry: UsageEntry = {
    ...entry,
    timestamp: new Date(),
    estimatedCost: entry.estimatedCost ?? calculateCost(entry),
  };
  
  usageLog.push(fullEntry);
  
  // Log to console for debugging
  const costStr = fullEntry.estimatedCost 
    ? ` ($${fullEntry.estimatedCost.toFixed(4)})`
    : "";
  console.log(
    `[Usage] ${entry.service}/${entry.model || "default"} - ${entry.operation}${costStr}`
  );
  
  // Keep only last 1000 entries in memory
  if (usageLog.length > 1000) {
    usageLog.shift();
  }
}

/**
 * Calculate estimated cost based on usage
 */
function calculateCost(entry: Omit<UsageEntry, "timestamp" | "estimatedCost">): number | undefined {
  if (!entry.model) return undefined;
  
  const pricing = PRICING[entry.model as keyof typeof PRICING];
  if (!pricing) return undefined;
  
  // Video pricing (per second)
  if ("perSecond" in pricing && entry.durationSeconds) {
    return pricing.perSecond * entry.durationSeconds;
  }
  
  // Token-based pricing
  if ("input" in pricing && "output" in pricing) {
    const inputCost = ((entry.inputTokens || 0) / 1_000_000) * pricing.input;
    const outputCost = ((entry.outputTokens || 0) / 1_000_000) * pricing.output;
    return inputCost + outputCost;
  }
  
  return undefined;
}

/**
 * Log Anthropic API usage
 */
export function logAnthropicUsage(
  model: string,
  operation: string,
  inputTokens: number,
  outputTokens: number,
  metadata?: Record<string, unknown>
): void {
  logUsage({
    service: "anthropic",
    model,
    operation,
    inputTokens,
    outputTokens,
    metadata,
  });
}

/**
 * Log Google AI usage
 */
export function logGoogleUsage(
  model: string,
  operation: string,
  options?: {
    inputTokens?: number;
    outputTokens?: number;
    durationSeconds?: number;
    metadata?: Record<string, unknown>;
  }
): void {
  logUsage({
    service: "google",
    model,
    operation,
    ...options,
  });
}

/**
 * Log video generation usage
 */
export function logVideoUsage(
  model: string,
  durationSeconds: number,
  metadata?: Record<string, unknown>
): void {
  logUsage({
    service: "google",
    model,
    operation: "video_generation",
    durationSeconds,
    metadata,
  });
}

/**
 * Get usage summary for current session
 */
export function getUsageSummary(): {
  totalCalls: number;
  totalEstimatedCost: number;
  byService: Record<string, { calls: number; cost: number }>;
  byModel: Record<string, { calls: number; cost: number }>;
} {
  const summary = {
    totalCalls: usageLog.length,
    totalEstimatedCost: 0,
    byService: {} as Record<string, { calls: number; cost: number }>,
    byModel: {} as Record<string, { calls: number; cost: number }>,
  };
  
  for (const entry of usageLog) {
    const cost = entry.estimatedCost || 0;
    summary.totalEstimatedCost += cost;
    
    // By service
    if (!summary.byService[entry.service]) {
      summary.byService[entry.service] = { calls: 0, cost: 0 };
    }
    summary.byService[entry.service].calls++;
    summary.byService[entry.service].cost += cost;
    
    // By model
    if (entry.model) {
      if (!summary.byModel[entry.model]) {
        summary.byModel[entry.model] = { calls: 0, cost: 0 };
      }
      summary.byModel[entry.model].calls++;
      summary.byModel[entry.model].cost += cost;
    }
  }
  
  return summary;
}

/**
 * Clear usage log (for testing)
 */
export function clearUsageLog(): void {
  usageLog.length = 0;
}

/**
 * Get recent usage entries
 */
export function getRecentUsage(limit: number = 100): UsageEntry[] {
  return usageLog.slice(-limit);
}
