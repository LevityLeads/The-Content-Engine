/**
 * Social Media Posting Best Practices
 *
 * This module defines optimal posting times and frequencies for various social media platforms.
 * The data is based on aggregated research from multiple sources including:
 * - Sprout Social's 2024 Best Times to Post Report
 * - Hootsuite's Global Social Media Trends
 * - Buffer's State of Social Media Report
 * - HubSpot's Social Media Marketing Research
 *
 * Note: These are general guidelines. Actual optimal times may vary based on:
 * - Target audience demographics and timezone
 * - Industry/niche
 * - Specific account engagement patterns
 * - Content type
 *
 * For best results, analyze your own analytics and adjust accordingly.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Days of the week (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Hour of the day in 24-hour format (0-23)
 */
export type HourOfDay = number;

/**
 * A time slot representing an optimal posting window
 */
export interface TimeSlot {
  /** Hour in 24-hour format (0-23) */
  hour: HourOfDay;
  /** Priority ranking (1 = highest priority) */
  priority: number;
  /** Human-readable label for this time slot */
  label: string;
}

/**
 * Configuration for optimal posting times on a specific day
 */
export interface DayConfig {
  /** Whether this day is recommended for posting */
  isOptimal: boolean;
  /** Optimal hours to post (in 24-hour format) */
  optimalHours: HourOfDay[];
  /** Priority ranking for this day (1 = best day) */
  dayPriority: number;
}

/**
 * Platform-specific posting best practices
 */
export interface PlatformBestPractices {
  /** Display name of the platform */
  name: string;
  /** General description of best posting practices */
  description: string;
  /** Target audience type */
  audienceType: string;
  /** Day-by-day configuration (0 = Sunday, 6 = Saturday) */
  days: Record<DayOfWeek, DayConfig>;
  /** General notes about the platform */
  notes: string[];
}

/**
 * Posting frequency recommendations
 */
export interface PostingFrequency {
  /** Minimum recommended posts per day */
  minPostsPerDay: number;
  /** Maximum recommended posts per day */
  maxPostsPerDay: number;
  /** Minimum hours to wait between posts */
  minHoursBetweenPosts: number;
  /** Description of the frequency strategy */
  strategy: string;
}

/**
 * Supported platform identifiers
 */
export type PlatformId = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok';

// ============================================================================
// Platform Best Practices Data
// ============================================================================

/**
 * Optimal posting times and strategies for each social media platform.
 *
 * Research basis:
 * - Twitter/X: High engagement during commute times and lunch breaks.
 *   Business users check during work hours; general audience peaks mid-week.
 *
 * - LinkedIn: Professional network with peak activity during business hours.
 *   Early morning (before work), lunch, and end-of-day are prime times.
 *   B2B content performs best Tuesday-Thursday.
 *
 * - Instagram: Visual platform with engagement peaks during breaks and evenings.
 *   Monday shows high engagement as users catch up; Thursday is optimal for reach.
 *
 * - Facebook: Mature platform with afternoon engagement peaks.
 *   Users are most active during lunch and post-work hours mid-week.
 *
 * - TikTok: Younger demographic with afternoon/evening engagement.
 *   Highest activity when users are off work/school.
 */
export const PLATFORM_BEST_PRACTICES: Record<PlatformId, PlatformBestPractices> = {
  twitter: {
    name: 'Twitter/X',
    description: 'Best times are weekdays 8-10 AM and 12-1 PM. Tuesday-Thursday perform best.',
    audienceType: 'General / News-focused',
    days: {
      0: { isOptimal: false, optimalHours: [10, 11, 12], dayPriority: 7 }, // Sunday
      1: { isOptimal: true, optimalHours: [8, 9, 10, 12], dayPriority: 4 }, // Monday
      2: { isOptimal: true, optimalHours: [8, 9, 10, 12, 13], dayPriority: 1 }, // Tuesday
      3: { isOptimal: true, optimalHours: [8, 9, 10, 12, 13], dayPriority: 2 }, // Wednesday
      4: { isOptimal: true, optimalHours: [8, 9, 10, 12, 13], dayPriority: 3 }, // Thursday
      5: { isOptimal: true, optimalHours: [8, 9, 10, 12], dayPriority: 5 }, // Friday
      6: { isOptimal: false, optimalHours: [10, 11], dayPriority: 6 }, // Saturday
    },
    notes: [
      'Morning commute (8-10 AM) catches professionals starting their day',
      'Lunch hour (12-1 PM) is a secondary peak for engagement',
      'Tuesday-Thursday see highest engagement rates',
      'Weekend engagement is lower but can work for casual/entertainment content',
    ],
  },

  linkedin: {
    name: 'LinkedIn',
    description: 'Best times are Tuesday-Thursday 7-8 AM, 12 PM, and 5-6 PM. B2B focused.',
    audienceType: 'B2B / Professional',
    days: {
      0: { isOptimal: false, optimalHours: [], dayPriority: 7 }, // Sunday
      1: { isOptimal: true, optimalHours: [7, 8, 12, 17, 18], dayPriority: 4 }, // Monday
      2: { isOptimal: true, optimalHours: [7, 8, 12, 17, 18], dayPriority: 1 }, // Tuesday
      3: { isOptimal: true, optimalHours: [7, 8, 12, 17, 18], dayPriority: 2 }, // Wednesday
      4: { isOptimal: true, optimalHours: [7, 8, 12, 17, 18], dayPriority: 3 }, // Thursday
      5: { isOptimal: false, optimalHours: [7, 8, 12], dayPriority: 5 }, // Friday
      6: { isOptimal: false, optimalHours: [], dayPriority: 6 }, // Saturday
    },
    notes: [
      'Early morning (7-8 AM) catches professionals before meetings',
      'Lunch break (12 PM) is prime time for content consumption',
      'End of workday (5-6 PM) is good for thought leadership content',
      'Avoid weekends - professional engagement drops significantly',
      'Tuesday-Thursday are the strongest days for B2B content',
    ],
  },

  instagram: {
    name: 'Instagram',
    description: 'Best times are weekdays 11 AM-1 PM and 7-9 PM. Monday and Thursday perform best.',
    audienceType: 'Visual / Lifestyle',
    days: {
      0: { isOptimal: false, optimalHours: [10, 11, 19, 20], dayPriority: 5 }, // Sunday
      1: { isOptimal: true, optimalHours: [11, 12, 13, 19, 20, 21], dayPriority: 1 }, // Monday
      2: { isOptimal: true, optimalHours: [11, 12, 13, 19, 20, 21], dayPriority: 3 }, // Tuesday
      3: { isOptimal: true, optimalHours: [11, 12, 13, 19, 20, 21], dayPriority: 4 }, // Wednesday
      4: { isOptimal: true, optimalHours: [11, 12, 13, 19, 20, 21], dayPriority: 2 }, // Thursday
      5: { isOptimal: true, optimalHours: [11, 12, 13, 19, 20], dayPriority: 5 }, // Friday
      6: { isOptimal: false, optimalHours: [10, 11, 19, 20], dayPriority: 6 }, // Saturday
    },
    notes: [
      'Lunch break (11 AM-1 PM) is peak scroll time',
      'Evening hours (7-9 PM) see high engagement as users unwind',
      'Monday is great as users catch up after the weekend',
      'Thursday shows consistently high engagement rates',
      'Visual quality matters more than timing for Instagram',
    ],
  },

  facebook: {
    name: 'Facebook',
    description: 'Best times are Tuesday-Thursday 1-4 PM.',
    audienceType: 'General / Community',
    days: {
      0: { isOptimal: false, optimalHours: [12, 13, 14], dayPriority: 6 }, // Sunday
      1: { isOptimal: true, optimalHours: [13, 14, 15, 16], dayPriority: 4 }, // Monday
      2: { isOptimal: true, optimalHours: [13, 14, 15, 16], dayPriority: 1 }, // Tuesday
      3: { isOptimal: true, optimalHours: [13, 14, 15, 16], dayPriority: 2 }, // Wednesday
      4: { isOptimal: true, optimalHours: [13, 14, 15, 16], dayPriority: 3 }, // Thursday
      5: { isOptimal: false, optimalHours: [13, 14, 15], dayPriority: 5 }, // Friday
      6: { isOptimal: false, optimalHours: [12, 13], dayPriority: 7 }, // Saturday
    },
    notes: [
      'Afternoon hours (1-4 PM) see highest engagement',
      'Users often check Facebook during work breaks',
      'Tuesday-Thursday are optimal for business pages',
      'Weekend engagement is lower but varies by audience',
      'Video content can perform well outside peak hours',
    ],
  },

  tiktok: {
    name: 'TikTok',
    description: 'Best times are Tuesday-Thursday 2-6 PM.',
    audienceType: 'Young / Entertainment',
    days: {
      0: { isOptimal: false, optimalHours: [14, 15, 16, 17], dayPriority: 5 }, // Sunday
      1: { isOptimal: true, optimalHours: [14, 15, 16, 17, 18], dayPriority: 4 }, // Monday
      2: { isOptimal: true, optimalHours: [14, 15, 16, 17, 18], dayPriority: 1 }, // Tuesday
      3: { isOptimal: true, optimalHours: [14, 15, 16, 17, 18], dayPriority: 2 }, // Wednesday
      4: { isOptimal: true, optimalHours: [14, 15, 16, 17, 18], dayPriority: 3 }, // Thursday
      5: { isOptimal: true, optimalHours: [14, 15, 16, 17], dayPriority: 5 }, // Friday
      6: { isOptimal: false, optimalHours: [14, 15, 16], dayPriority: 6 }, // Saturday
    },
    notes: [
      'Afternoon/evening (2-6 PM) catches users after school/work',
      'Young audience is most active in late afternoon',
      'Consistency matters more than perfect timing on TikTok',
      'The algorithm can surface content hours after posting',
      'Trending sounds and hashtags can outweigh timing considerations',
    ],
  },
};

// ============================================================================
// Posting Frequency Data
// ============================================================================

/**
 * Recommended posting frequency for each platform.
 *
 * Research basis:
 * - Twitter: Fast-moving feed benefits from higher frequency. 2-hour gaps
 *   prevent overwhelming followers while maintaining visibility.
 *
 * - LinkedIn: Professional content needs time to gain traction. Algorithm
 *   favors quality over quantity. 8-hour gaps allow posts to perform.
 *
 * - Instagram: Quality over quantity. Algorithm rewards engagement, not
 *   frequency. 6-hour gaps prevent feed fatigue.
 *
 * - Facebook: Similar to Instagram. Organic reach is limited, so fewer
 *   high-quality posts perform better than frequent low-quality ones.
 *
 * - TikTok: Algorithm-driven discovery means frequency can be higher.
 *   4-hour gaps allow each video to find its audience.
 */
const POSTING_FREQUENCIES: Record<PlatformId, PostingFrequency> = {
  twitter: {
    minPostsPerDay: 3,
    maxPostsPerDay: 5,
    minHoursBetweenPosts: 2,
    strategy: 'High frequency with consistent spacing. Mix of original content, replies, and retweets.',
  },

  linkedin: {
    minPostsPerDay: 1,
    maxPostsPerDay: 2,
    minHoursBetweenPosts: 8,
    strategy: 'Quality over quantity. Allow each post time to gain engagement before posting again.',
  },

  instagram: {
    minPostsPerDay: 1,
    maxPostsPerDay: 2,
    minHoursBetweenPosts: 6,
    strategy: 'Focus on visual quality. Supplement feed posts with Stories for higher frequency.',
  },

  facebook: {
    minPostsPerDay: 1,
    maxPostsPerDay: 2,
    minHoursBetweenPosts: 6,
    strategy: 'Prioritize engaging content. Use varied formats (video, links, images) across posts.',
  },

  tiktok: {
    minPostsPerDay: 1,
    maxPostsPerDay: 3,
    minHoursBetweenPosts: 4,
    strategy: 'Experiment with posting times. Algorithm discovery means good content can surface anytime.',
  },
};

// ============================================================================
// Functions
// ============================================================================

/**
 * Normalizes a platform string to a valid PlatformId.
 * Handles common variations and aliases.
 *
 * @param platform - The platform string to normalize
 * @returns The normalized PlatformId, or null if not recognized
 */
function normalizePlatformId(platform: string): PlatformId | null {
  const normalized = platform.toLowerCase().trim();

  const platformMap: Record<string, PlatformId> = {
    twitter: 'twitter',
    'twitter/x': 'twitter',
    x: 'twitter',
    linkedin: 'linkedin',
    instagram: 'instagram',
    ig: 'instagram',
    facebook: 'facebook',
    fb: 'facebook',
    tiktok: 'tiktok',
    'tik tok': 'tiktok',
  };

  return platformMap[normalized] || null;
}

/**
 * Returns an array of optimal time slots for a given platform and date,
 * sorted by priority (highest priority first).
 *
 * The function considers:
 * - Day of the week (weekdays vs weekends)
 * - Platform-specific optimal hours
 * - Day priority (some days are better than others)
 *
 * @param platform - The platform identifier (e.g., 'twitter', 'linkedin')
 * @param date - The date to get optimal times for
 * @returns Array of TimeSlot objects sorted by priority, or empty array if platform not found
 *
 * @example
 * ```typescript
 * // Get optimal times for Twitter on a Tuesday
 * const tuesday = new Date('2024-01-16'); // A Tuesday
 * const slots = getOptimalTimeSlotsForPlatform('twitter', tuesday);
 * // Returns: [
 * //   { hour: 8, priority: 1, label: '8:00 AM' },
 * //   { hour: 9, priority: 2, label: '9:00 AM' },
 * //   { hour: 10, priority: 3, label: '10:00 AM' },
 * //   { hour: 12, priority: 4, label: '12:00 PM' },
 * //   { hour: 13, priority: 5, label: '1:00 PM' }
 * // ]
 * ```
 */
export function getOptimalTimeSlotsForPlatform(
  platform: string,
  date: Date
): TimeSlot[] {
  const platformId = normalizePlatformId(platform);
  if (!platformId) {
    return [];
  }

  const practices = PLATFORM_BEST_PRACTICES[platformId];
  if (!practices) {
    return [];
  }

  const dayOfWeek = date.getDay() as DayOfWeek;
  const dayConfig = practices.days[dayOfWeek];

  if (!dayConfig || dayConfig.optimalHours.length === 0) {
    return [];
  }

  // Convert hours to time slots with priority
  const timeSlots: TimeSlot[] = dayConfig.optimalHours.map((hour, index) => ({
    hour,
    priority: index + 1,
    label: formatHourLabel(hour),
  }));

  // Sort by priority (already in order from optimalHours, but ensure it)
  return timeSlots.sort((a, b) => a.priority - b.priority);
}

/**
 * Returns the recommended posting frequency for a given platform.
 *
 * @param platform - The platform identifier (e.g., 'twitter', 'linkedin')
 * @returns PostingFrequency object with min/max posts per day and spacing requirements,
 *          or null if platform not found
 *
 * @example
 * ```typescript
 * const frequency = getPlatformPostingFrequency('twitter');
 * // Returns: {
 * //   minPostsPerDay: 3,
 * //   maxPostsPerDay: 5,
 * //   minHoursBetweenPosts: 2,
 * //   strategy: 'High frequency with consistent spacing...'
 * // }
 * ```
 */
export function getPlatformPostingFrequency(platform: string): PostingFrequency | null {
  const platformId = normalizePlatformId(platform);
  if (!platformId) {
    return null;
  }

  return POSTING_FREQUENCIES[platformId] || null;
}

/**
 * Formats an hour (0-23) as a human-readable time label.
 *
 * @param hour - Hour in 24-hour format (0-23)
 * @returns Formatted time string (e.g., "8:00 AM", "1:00 PM")
 */
function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

/**
 * Gets the best days of the week for posting on a given platform.
 *
 * @param platform - The platform identifier
 * @returns Array of day numbers (0-6, where 0 is Sunday) sorted by priority
 *
 * @example
 * ```typescript
 * const bestDays = getBestDaysForPlatform('linkedin');
 * // Returns: [2, 3, 4, 1, 5] (Tue, Wed, Thu, Mon, Fri)
 * ```
 */
export function getBestDaysForPlatform(platform: string): DayOfWeek[] {
  const platformId = normalizePlatformId(platform);
  if (!platformId) {
    return [];
  }

  const practices = PLATFORM_BEST_PRACTICES[platformId];
  if (!practices) {
    return [];
  }

  // Get all days sorted by priority
  const days = (Object.entries(practices.days) as [string, DayConfig][])
    .filter(([, config]) => config.isOptimal)
    .sort(([, a], [, b]) => a.dayPriority - b.dayPriority)
    .map(([day]) => parseInt(day) as DayOfWeek);

  return days;
}

/**
 * Checks if a given date is an optimal day for posting on a platform.
 *
 * @param platform - The platform identifier
 * @param date - The date to check
 * @returns true if the date falls on an optimal posting day
 */
export function isOptimalPostingDay(platform: string, date: Date): boolean {
  const platformId = normalizePlatformId(platform);
  if (!platformId) {
    return false;
  }

  const practices = PLATFORM_BEST_PRACTICES[platformId];
  if (!practices) {
    return false;
  }

  const dayOfWeek = date.getDay() as DayOfWeek;
  return practices.days[dayOfWeek]?.isOptimal ?? false;
}

/**
 * Gets all supported platform IDs.
 *
 * @returns Array of valid platform identifiers
 */
export function getSupportedPlatforms(): PlatformId[] {
  return Object.keys(PLATFORM_BEST_PRACTICES) as PlatformId[];
}
