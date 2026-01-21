// Video model configuration for Veo 3 integration

export const VIDEO_MODELS = {
  "veo-3.1-fast": {
    id: "veo-3.1-generate-preview",
    name: "Veo 3.1 Fast",
    description: "Cost-effective video generation",
    speed: "fast" as const,
    costPerSecond: 0.15,
    audioCostPerSecond: 0.10,
    maxDuration: 8,
    minDuration: 3,
  },
  "veo-3.0": {
    id: "veo-3.0-generate-preview",
    name: "Veo 3.0 Standard",
    description: "Highest quality video generation",
    speed: "slow" as const,
    costPerSecond: 0.50,
    audioCostPerSecond: 0.25,
    maxDuration: 8,
    minDuration: 3,
  },
} as const;

export type VideoModelKey = keyof typeof VIDEO_MODELS;
export type VideoModel = (typeof VIDEO_MODELS)[VideoModelKey];

export const DEFAULT_VIDEO_MODEL: VideoModelKey = "veo-3.1-fast";

export const VIDEO_MODEL_OPTIONS = Object.entries(VIDEO_MODELS).map(([key, value]) => ({
  key: key as VideoModelKey,
  ...value,
}));

// Platform-specific video settings
// Note: Veo API only supports 16:9, 9:16, and 1:1 aspect ratios
export const PLATFORM_VIDEO_CONFIG = {
  instagram: {
    // Instagram Reels / Carousel first slide
    // Veo doesn't support 4:5, so we use 9:16 for vertical content
    aspectRatios: {
      feed: "9:16",      // Vertical (closest to 4:5 that Veo supports)
      reels: "9:16",    // Vertical for reels
      story: "9:16",    // Vertical for stories
    },
    defaultAspectRatio: "9:16",
    maxDuration: 8,
    recommendedDuration: 5,
    supportsAudio: true,
    supportsMixedCarousel: true, // Video can be slide 1 of carousel
  },
  linkedin: {
    aspectRatios: {
      feed: "16:9",     // Landscape for LinkedIn
      square: "1:1",    // Square option
    },
    defaultAspectRatio: "16:9",
    maxDuration: 8,
    recommendedDuration: 6,
    supportsAudio: true,
    supportsMixedCarousel: true,
  },
  twitter: {
    aspectRatios: {
      feed: "16:9",     // Landscape
      square: "1:1",    // Square
    },
    defaultAspectRatio: "16:9",
    maxDuration: 8,
    recommendedDuration: 5,
    supportsAudio: true,
    supportsMixedCarousel: false, // Twitter doesn't support mixed carousels
  },
} as const;

export type PlatformKey = keyof typeof PLATFORM_VIDEO_CONFIG;

export function getAspectRatioForPlatform(platform: string): string {
  const config = PLATFORM_VIDEO_CONFIG[platform as PlatformKey];
  return config?.defaultAspectRatio || "16:9";
}

export function platformSupportsVideo(platform: string): boolean {
  return platform in PLATFORM_VIDEO_CONFIG;
}

export function platformSupportsMixedCarousel(platform: string): boolean {
  const config = PLATFORM_VIDEO_CONFIG[platform as PlatformKey];
  return config?.supportsMixedCarousel || false;
}
