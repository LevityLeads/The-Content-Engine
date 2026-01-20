"use client";

import { useBrand } from "@/contexts/brand-context";
import { useCallback } from "react";

/**
 * Hook that provides API fetch helpers with automatic brand filtering
 */
export function useBrandApi() {
  const { selectedBrand } = useBrand();

  /**
   * Build a URL with brandId query param automatically added
   */
  const buildUrl = useCallback(
    (path: string, params?: Record<string, string | undefined>) => {
      const url = new URL(path, window.location.origin);

      // Add brandId if we have a selected brand
      if (selectedBrand?.id) {
        url.searchParams.set("brandId", selectedBrand.id);
      }

      // Add any additional params
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            url.searchParams.set(key, value);
          }
        });
      }

      return url.toString();
    },
    [selectedBrand]
  );

  /**
   * Fetch with automatic brand filtering
   */
  const fetchWithBrand = useCallback(
    async (path: string, params?: Record<string, string | undefined>) => {
      const url = buildUrl(path, params);
      const res = await fetch(url);
      return res.json();
    },
    [buildUrl]
  );

  /**
   * POST/PATCH with automatic brand_id in body
   */
  const mutateWithBrand = useCallback(
    async (
      path: string,
      method: "POST" | "PATCH" | "PUT",
      body: Record<string, unknown>
    ) => {
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          // Include brandId for creates
          ...(method === "POST" && selectedBrand?.id
            ? { brandId: selectedBrand.id }
            : {}),
        }),
      });
      return res.json();
    },
    [selectedBrand]
  );

  return {
    selectedBrand,
    brandId: selectedBrand?.id,
    buildUrl,
    fetchWithBrand,
    mutateWithBrand,
  };
}
