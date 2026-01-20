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
}

export interface BrandWithConfig extends Omit<Brand, "voice_config" | "visual_config"> {
  voice_config: VoiceConfig;
  visual_config: VisualConfig;
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
      const res = await fetch("/api/brands");
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
        }
      }
    } catch (err) {
      console.error("Error fetching brands:", err);
      setError("Failed to load brands");
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
