// Shared image model configuration for both API and frontend

export const IMAGE_MODELS = {
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash-exp",
    name: "Gemini Flash",
    description: "Fast generation, good quality",
    speed: "fast" as const,
  },
  "gemini-3-pro": {
    id: "gemini-3-pro-image-preview",
    name: "Nano Banana Pro",
    description: "Highest quality with thinking",
    speed: "slow" as const,
  },
} as const;

export type ImageModelKey = keyof typeof IMAGE_MODELS;
export type ImageModel = (typeof IMAGE_MODELS)[ImageModelKey];

export const DEFAULT_MODEL: ImageModelKey = "gemini-3-pro";

export const MODEL_OPTIONS = Object.entries(IMAGE_MODELS).map(([key, value]) => ({
  key: key as ImageModelKey,
  ...value,
}));
