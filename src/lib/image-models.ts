// Shared image model configuration for both API and frontend

export const IMAGE_MODELS = {
  "gemini-flash": {
    id: "gemini-2.5-flash-image",
    name: "Gemini Flash",
    description: "Fast generation, good quality",
    speed: "fast" as const,
    supportsThinking: false,
  },
  "gemini-3-pro": {
    id: "gemini-3-pro-image-preview",
    name: "Nano Banana Pro",
    description: "Highest quality",
    speed: "slow" as const,
    supportsThinking: false,
  },
  "gemini-3-pro-thinking": {
    id: "gemini-3-pro-image-preview",
    name: "Nano Banana Pro (Thinking)",
    description: "Extended reasoning for brand consistency",
    speed: "slow" as const,
    supportsThinking: true,
    thinkingBudget: 2048,
  },
} as const;

export type ImageModelKey = keyof typeof IMAGE_MODELS;
export type ImageModel = (typeof IMAGE_MODELS)[ImageModelKey];

export const DEFAULT_MODEL: ImageModelKey = "gemini-3-pro";

export const MODEL_OPTIONS = Object.entries(IMAGE_MODELS).map(([key, value]) => ({
  key: key as ImageModelKey,
  ...value,
}));
