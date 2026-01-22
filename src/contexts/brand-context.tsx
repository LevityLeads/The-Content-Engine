"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Brand } from "@/types/database";

// Extended brand types for voice and visual config
export interface VoiceConfig {
  tone_keywords?: string[];
  words_to_avoid?: string[];
  example_posts?: string[];
  strictness?: number; // 0-1 scale
  source_url?: string;
  extracted_voice?: {
    tone_description?: string;
    messaging_themes?: string[];
    writing_style?: string;
  };
}

// Saved design system preset structure
export interface SavedDesignSystemPreset {
  id: string;
  name: string;
  visualStyle: string; // e.g., "typography", "photorealistic"
  designSystem: {
    background: string;
    primaryColor: string;
    accentColor: string;
    typography: string;
    layout: string;
    mood: string;
    textOverlay?: string;
  };
  createdAt: string;
}

// Default brand style configuration (selected during onboarding)
export interface BrandDefaultStyle {
  visualStyle: string; // e.g., "typography", "photorealistic", "illustration"
  textStyle: string; // e.g., "bold-editorial", "clean-modern"
  textColor: string; // e.g., "white-coral", "dark-blue"
  designSystem?: {
    background: string;
    primaryColor: string;
    accentColor: string;
    typography: string;
    layout: string;
    mood: string;
  };
  selectedAt: string; // ISO timestamp
  sampleImageUsed?: string; // The sample image that was selected during onboarding
}

// Approved style in the brand's style palette
export interface ApprovedStyle {
  id: string;
  visualStyle: string;
  textStyle: string;
  textColor: string;
  name: string; // Display name like "Bold Typography"
  sampleImage?: string; // Preview image from when it was selected
  designSystem?: {
    background: string;
    primaryColor: string;
    accentColor: string;
    typography: string;
    layout: string;
    mood: string;
  };
  addedAt: string; // ISO timestamp
}

export interface VisualConfig {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  fonts?: {
    heading?: string;
    body?: string;
  };
  image_style?: string;
  extracted_images?: string[];
  color_palette?: string[];
  example_posts?: string[]; // User-uploaded example images (base64 or URLs)
  master_brand_prompt?: string; // AI-generated visual brand description from example posts
  savedDesignSystems?: SavedDesignSystemPreset[]; // Saved design system presets
  defaultStyle?: BrandDefaultStyle; // Default style selected during onboarding
  approvedStyles?: ApprovedStyle[]; // Style palette - all approved styles for this brand
}

export interface BrandWithConfig extends Omit<Brand, "voice_config" | "visual_config"> {
  voice_config: VoiceConfig;
  visual_config: VisualConfig;
}

interface DeleteResult {
  success: boolean;
  deleted?: {
    content: number;
    ideas: number;
    inputs: number;
    images: number;
  };
  error?: string;
}

interface BrandContextType {
  brands: BrandWithConfig[];
  selectedBrand: BrandWithConfig | null;
  isLoading: boolean;
  error: string | null;
  selectBrand: (brandId: string) => void;
  refreshBrands: () => Promise<void>;
  createBrand: (brand: Partial<BrandWithConfig>) => Promise<BrandWithConfig | null>;
  updateBrand: (brandId: string, updates: Partial<BrandWithConfig>) => Promise<BrandWithConfig | null>;
  deleteBrand: (brandId: string) => Promise<DeleteResult>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const SELECTED_BRAND_KEY = "selectedBrandId";

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brands, setBrands] = useState<BrandWithConfig[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandWithConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Add timeout to prevent hanging forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      let res: Response;
      try {
        res = await fetch("/api/brands", { signal: controller.signal });
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('Request timed out. Please check your connection.');
        }
        throw fetchErr;
      }
      clearTimeout(timeoutId);

      // Check for HTTP errors first
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error fetching brands - HTTP", res.status, errorData);
        setError(errorData.error || `Failed to load brands (${res.status})`);
        setBrands([]);
        setSelectedBrand(null);
        return;
      }

      const data = await res.json();

      if (data.success && data.brands) {
        const brandsWithConfig = data.brands.map((brand: Brand) => ({
          ...brand,
          voice_config: (brand.voice_config as VoiceConfig) || {},
          visual_config: (brand.visual_config as VisualConfig) || {},
        }));
        setBrands(brandsWithConfig);

        // Auto-select brand from localStorage or first available
        const savedBrandId = localStorage.getItem(SELECTED_BRAND_KEY);
        const savedBrand = brandsWithConfig.find((b: BrandWithConfig) => b.id === savedBrandId);

        if (savedBrand) {
          setSelectedBrand(savedBrand);
        } else if (brandsWithConfig.length > 0) {
          setSelectedBrand(brandsWithConfig[0]);
          localStorage.setItem(SELECTED_BRAND_KEY, brandsWithConfig[0].id);
        } else {
          setSelectedBrand(null);
        }
      } else {
        // API returned but without success - handle gracefully
        console.error("Error fetching brands - API error:", data.error || "Unknown error");
        setError(data.error || "Failed to load brands");
        setBrands([]);
        setSelectedBrand(null);
      }
    } catch (err) {
      console.error("Error fetching brands:", err);
      setError("Failed to load brands. Please check your connection.");
      setBrands([]);
      setSelectedBrand(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const selectBrand = useCallback((brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    if (brand) {
      setSelectedBrand(brand);
      localStorage.setItem(SELECTED_BRAND_KEY, brandId);
    }
  }, [brands]);

  const refreshBrands = useCallback(async () => {
    await fetchBrands();
  }, [fetchBrands]);

  const createBrand = useCallback(async (brandData: Partial<BrandWithConfig>): Promise<BrandWithConfig | null> => {
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandData),
      });
      const data = await res.json();

      if (data.success && data.brand) {
        const newBrand: BrandWithConfig = {
          ...data.brand,
          voice_config: (data.brand.voice_config as VoiceConfig) || {},
          visual_config: (data.brand.visual_config as VisualConfig) || {},
        };
        setBrands((prev) => [...prev, newBrand]);
        // Auto-select the new brand
        setSelectedBrand(newBrand);
        localStorage.setItem(SELECTED_BRAND_KEY, newBrand.id);
        return newBrand;
      }
      return null;
    } catch (err) {
      console.error("Error creating brand:", err);
      return null;
    }
  }, []);

  const updateBrand = useCallback(async (brandId: string, updates: Partial<BrandWithConfig>): Promise<BrandWithConfig | null> => {
    try {
      const res = await fetch("/api/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: brandId, ...updates }),
      });
      const data = await res.json();

      if (data.success && data.brand) {
        const updatedBrand: BrandWithConfig = {
          ...data.brand,
          voice_config: (data.brand.voice_config as VoiceConfig) || {},
          visual_config: (data.brand.visual_config as VisualConfig) || {},
        };
        setBrands((prev) => prev.map((b) => (b.id === brandId ? updatedBrand : b)));
        if (selectedBrand?.id === brandId) {
          setSelectedBrand(updatedBrand);
        }
        return updatedBrand;
      }
      return null;
    } catch (err) {
      console.error("Error updating brand:", err);
      return null;
    }
  }, [selectedBrand]);

  const deleteBrand = useCallback(async (brandId: string): Promise<DeleteResult> => {
    try {
      const res = await fetch(`/api/brands?id=${brandId}&confirm=delete`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        // Remove from brands list
        setBrands((prev) => prev.filter((b) => b.id !== brandId));

        // If this was the selected brand, select another one
        if (selectedBrand?.id === brandId) {
          const remainingBrands = brands.filter((b) => b.id !== brandId);
          if (remainingBrands.length > 0) {
            setSelectedBrand(remainingBrands[0]);
            localStorage.setItem(SELECTED_BRAND_KEY, remainingBrands[0].id);
          } else {
            setSelectedBrand(null);
            localStorage.removeItem(SELECTED_BRAND_KEY);
          }
        }

        return {
          success: true,
          deleted: data.deleted,
        };
      }

      return {
        success: false,
        error: data.error || "Failed to delete brand",
      };
    } catch (err) {
      console.error("Error deleting brand:", err);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  }, [selectedBrand, brands]);

  return (
    <BrandContext.Provider
      value={{
        brands,
        selectedBrand,
        isLoading,
        error,
        selectBrand,
        refreshBrands,
        createBrand,
        updateBrand,
        deleteBrand,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
