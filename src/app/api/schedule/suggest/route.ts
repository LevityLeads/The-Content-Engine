import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOptimalTimeSlotsForPlatform,
  getPlatformPostingFrequency,
  isOptimalPostingDay,
} from "@/lib/scheduling/best-practices";

// Types for request/response
interface SingleContentRequest {
  contentId: string;
  brandId: string;
  platform: string;
}

interface BulkContentRequest {
  contentIds: string[];
  brandId: string;
  platforms?: string[];
}

type ScheduleSuggestRequest = SingleContentRequest | BulkContentRequest;

interface ScheduleSuggestion {
  contentId: string;
  suggestedTime: string;
  reasoning: string;
  score: number;
  alternatives: Array<{
    time: string;
    score: number;
  }>;
}

interface ScheduleSuggestResponse {
  success: boolean;
  suggestions: ScheduleSuggestion[];
  error?: string;
}

// Scoring weights
const WEIGHTS = {
  PLATFORM_BEST_PRACTICE: 0.4, // Weight for platform optimal time
  GAP_SCORE: 0.35, // Weight for spacing from other content
  RECENCY_SCORE: 0.25, // Weight for preferring sooner times
};

/**
 * Calculate how well-spaced a time slot is from existing scheduled content
 */
function calculateGapScore(
  slotTime: Date,
  scheduledTimes: Date[],
  minHoursBetween: number
): number {
  if (scheduledTimes.length === 0) {
    return 100; // Perfect score if no other content
  }

  const minGapMs = minHoursBetween * 60 * 60 * 1000;
  let closestGapMs = Infinity;

  for (const scheduledTime of scheduledTimes) {
    const gapMs = Math.abs(slotTime.getTime() - scheduledTime.getTime());
    if (gapMs < closestGapMs) {
      closestGapMs = gapMs;
    }
  }

  // If within minimum gap, return 0
  if (closestGapMs < minGapMs) {
    return 0;
  }

  // Score based on how much beyond minimum gap
  // Ideal is 2x the minimum gap
  const idealGapMs = minGapMs * 2;
  if (closestGapMs >= idealGapMs) {
    return 100;
  }

  // Scale between minimum and ideal
  const ratio = (closestGapMs - minGapMs) / (idealGapMs - minGapMs);
  return Math.round(50 + ratio * 50);
}

/**
 * Calculate a recency score - prefer sooner but not too immediate
 */
function calculateRecencyScore(slotTime: Date, now: Date): number {
  const hoursFromNow = (slotTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Ideal is 4-24 hours from now
  if (hoursFromNow >= 4 && hoursFromNow <= 24) {
    return 100;
  }

  // 1-4 hours is okay but rushed
  if (hoursFromNow >= 1 && hoursFromNow < 4) {
    return 70 + ((hoursFromNow - 1) / 3) * 30;
  }

  // 24-48 hours is good
  if (hoursFromNow > 24 && hoursFromNow <= 48) {
    return 90 - ((hoursFromNow - 24) / 24) * 15;
  }

  // 48-72 hours is acceptable
  if (hoursFromNow > 48 && hoursFromNow <= 72) {
    return 75 - ((hoursFromNow - 48) / 24) * 15;
  }

  // Beyond 72 hours, gradually decrease
  if (hoursFromNow > 72) {
    const daysOut = hoursFromNow / 24;
    return Math.max(30, 60 - (daysOut - 3) * 5);
  }

  return 30; // Too soon or in the past
}

/**
 * Convert a platform priority (1 = best) to a score (100 = best)
 */
function priorityToScore(priority: number, maxPriority: number): number {
  if (maxPriority <= 1) return 100;
  // Priority 1 = 100, highest priority = ~50
  return Math.round(100 - ((priority - 1) / (maxPriority - 1)) * 50);
}

/**
 * Generate candidate time slots for the next N days
 */
function generateCandidateSlots(
  platform: string,
  startDate: Date,
  days: number = 7
): Array<{ date: Date; platformScore: number; label: string }> {
  const candidates: Array<{ date: Date; platformScore: number; label: string }> = [];
  const now = new Date();
  const minScheduleTime = new Date(now.getTime() + 60 * 60 * 1000); // At least 1 hour from now

  for (let day = 0; day < days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    currentDate.setHours(0, 0, 0, 0);

    // Get optimal time slots for this day and platform
    const timeSlots = getOptimalTimeSlotsForPlatform(platform, currentDate);

    if (timeSlots.length === 0) {
      // If no optimal slots, add some default slots with lower scores
      const defaultHours = [9, 12, 17]; // Morning, lunch, evening
      for (const hour of defaultHours) {
        const slotDate = new Date(currentDate);
        slotDate.setHours(hour, 0, 0, 0);

        if (slotDate > minScheduleTime) {
          const dayName = slotDate.toLocaleDateString("en-US", { weekday: "long" });
          candidates.push({
            date: slotDate,
            platformScore: isOptimalPostingDay(platform, currentDate) ? 50 : 30,
            label: `${dayName} ${formatHour(hour)} (default slot)`,
          });
        }
      }
    } else {
      // Get max priority for scoring
      const maxPriority = Math.max(...timeSlots.map((s) => s.priority));

      for (const slot of timeSlots) {
        const slotDate = new Date(currentDate);
        slotDate.setHours(slot.hour, 0, 0, 0);

        if (slotDate > minScheduleTime) {
          const dayName = slotDate.toLocaleDateString("en-US", { weekday: "long" });
          candidates.push({
            date: slotDate,
            platformScore: priorityToScore(slot.priority, maxPriority),
            label: `${dayName} ${slot.label}`,
          });
        }
      }
    }
  }

  return candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Format an hour as a time string
 */
function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

/**
 * Generate reasoning text for a suggestion
 */
function generateReasoning(
  slotDate: Date,
  platformScore: number,
  gapScore: number,
  recencyScore: number,
  platform: string,
  scheduledTimes: Date[]
): string {
  const parts: string[] = [];
  const dayName = slotDate.toLocaleDateString("en-US", { weekday: "long" });
  const timeStr = slotDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Platform timing
  if (platformScore >= 80) {
    parts.push(`${dayName} ${timeStr} is a peak engagement time for ${platform}`);
  } else if (platformScore >= 60) {
    parts.push(`${dayName} ${timeStr} is a good time for ${platform} engagement`);
  } else {
    parts.push(`${dayName} ${timeStr} is an acceptable posting time for ${platform}`);
  }

  // Gap from other content
  if (scheduledTimes.length === 0) {
    parts.push("No other content is scheduled nearby");
  } else if (gapScore >= 80) {
    parts.push("well-spaced from your other scheduled content");
  } else if (gapScore >= 50) {
    parts.push("reasonable spacing from other content");
  } else if (gapScore > 0) {
    parts.push("close to other scheduled content, consider spreading out");
  }

  // Recency
  const hoursFromNow = (slotDate.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursFromNow <= 24) {
    parts.push("gives your content timely visibility");
  } else if (hoursFromNow <= 48) {
    parts.push("allows time for review while staying timely");
  }

  return parts.join(". ") + ".";
}

/**
 * Check if request is for bulk content
 */
function isBulkRequest(body: ScheduleSuggestRequest): body is BulkContentRequest {
  return "contentIds" in body && Array.isArray(body.contentIds);
}

export async function POST(request: NextRequest): Promise<NextResponse<ScheduleSuggestResponse>> {
  try {
    const supabase = await createClient();
    const body: ScheduleSuggestRequest = await request.json();

    // Validate required fields
    if (!body.brandId) {
      return NextResponse.json(
        { success: false, suggestions: [], error: "brandId is required" },
        { status: 400 }
      );
    }

    // Normalize to array format
    let contentItems: Array<{ contentId: string; platform?: string }>;

    if (isBulkRequest(body)) {
      if (!body.contentIds || body.contentIds.length === 0) {
        return NextResponse.json(
          { success: false, suggestions: [], error: "contentIds array is required and must not be empty" },
          { status: 400 }
        );
      }
      contentItems = body.contentIds.map((id, index) => ({
        contentId: id,
        platform: body.platforms?.[index],
      }));
    } else {
      if (!body.contentId) {
        return NextResponse.json(
          { success: false, suggestions: [], error: "contentId is required" },
          { status: 400 }
        );
      }
      if (!body.platform) {
        return NextResponse.json(
          { success: false, suggestions: [], error: "platform is required for single content requests" },
          { status: 400 }
        );
      }
      contentItems = [{ contentId: body.contentId, platform: body.platform }];
    }

    // Fetch all scheduled content for the brand in the next 14 days
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const { data: scheduledContent, error: fetchError } = await supabase
      .from("content")
      .select("id, scheduled_for, platform")
      .eq("brand_id", body.brandId)
      .eq("status", "scheduled")
      .gte("scheduled_for", now.toISOString())
      .lte("scheduled_for", twoWeeksFromNow.toISOString());

    if (fetchError) {
      console.error("Error fetching scheduled content:", fetchError);
      return NextResponse.json(
        { success: false, suggestions: [], error: "Failed to fetch scheduled content" },
        { status: 500 }
      );
    }

    // Group scheduled times by platform
    const scheduledByPlatform: Record<string, Date[]> = {};
    for (const content of scheduledContent || []) {
      if (content.scheduled_for) {
        const platform = content.platform.toLowerCase();
        if (!scheduledByPlatform[platform]) {
          scheduledByPlatform[platform] = [];
        }
        scheduledByPlatform[platform].push(new Date(content.scheduled_for));
      }
    }

    // If bulk request, fetch content to get platforms
    let contentData: Array<{ id: string; platform: string }> = [];
    if (isBulkRequest(body) && !body.platforms) {
      const { data: fetchedContent, error: contentError } = await supabase
        .from("content")
        .select("id, platform")
        .in(
          "id",
          contentItems.map((c) => c.contentId)
        );

      if (contentError) {
        console.error("Error fetching content details:", contentError);
        return NextResponse.json(
          { success: false, suggestions: [], error: "Failed to fetch content details" },
          { status: 500 }
        );
      }

      contentData = fetchedContent || [];
    }

    // Generate suggestions for each content item
    const suggestions: ScheduleSuggestion[] = [];

    for (const item of contentItems) {
      // Determine platform
      let platform = item.platform;
      if (!platform) {
        const contentInfo = contentData.find((c) => c.id === item.contentId);
        platform = contentInfo?.platform || "twitter"; // Default to twitter if not found
      }
      platform = platform.toLowerCase();

      // Get posting frequency for minimum gap
      const frequency = getPlatformPostingFrequency(platform);
      const minHoursBetween = frequency?.minHoursBetweenPosts || 4;

      // Get scheduled times for this platform
      const scheduledTimes = scheduledByPlatform[platform] || [];

      // Generate candidate slots for the next 7 days
      const candidates = generateCandidateSlots(platform, now, 7);

      if (candidates.length === 0) {
        suggestions.push({
          contentId: item.contentId,
          suggestedTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          reasoning: "No optimal time slots found. Defaulting to 24 hours from now.",
          score: 50,
          alternatives: [],
        });
        continue;
      }

      // Score each candidate
      const scoredCandidates = candidates.map((candidate) => {
        const gapScore = calculateGapScore(candidate.date, scheduledTimes, minHoursBetween);
        const recencyScore = calculateRecencyScore(candidate.date, now);

        // Skip if gap score is 0 (conflicts with existing content)
        if (gapScore === 0) {
          return {
            ...candidate,
            gapScore,
            recencyScore,
            totalScore: 0,
          };
        }

        const totalScore = Math.round(
          candidate.platformScore * WEIGHTS.PLATFORM_BEST_PRACTICE +
            gapScore * WEIGHTS.GAP_SCORE +
            recencyScore * WEIGHTS.RECENCY_SCORE
        );

        return {
          ...candidate,
          gapScore,
          recencyScore,
          totalScore,
        };
      });

      // Filter out conflicts and sort by total score
      const validCandidates = scoredCandidates
        .filter((c) => c.totalScore > 0)
        .sort((a, b) => b.totalScore - a.totalScore);

      if (validCandidates.length === 0) {
        // All slots conflict - suggest the one with the best platform score anyway
        const bestByPlatform = candidates.sort((a, b) => b.platformScore - a.platformScore)[0];
        suggestions.push({
          contentId: item.contentId,
          suggestedTime: bestByPlatform.date.toISOString(),
          reasoning:
            "All optimal time slots conflict with scheduled content. Consider rescheduling existing content or using this sub-optimal time.",
          score: 30,
          alternatives: [],
        });
        continue;
      }

      // Get the best suggestion
      const best = validCandidates[0];
      const alternatives = validCandidates
        .slice(1, 4)
        .map((c) => ({
          time: c.date.toISOString(),
          score: c.totalScore,
        }));

      suggestions.push({
        contentId: item.contentId,
        suggestedTime: best.date.toISOString(),
        reasoning: generateReasoning(
          best.date,
          best.platformScore,
          best.gapScore,
          best.recencyScore,
          platform,
          scheduledTimes
        ),
        score: best.totalScore,
        alternatives,
      });
    }

    return NextResponse.json(
      {
        success: true,
        suggestions,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error("Error in POST /api/schedule/suggest:", error);
    return NextResponse.json(
      { success: false, suggestions: [], error: "Internal server error" },
      { status: 500 }
    );
  }
}
