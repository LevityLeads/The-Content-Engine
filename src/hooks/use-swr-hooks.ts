/**
 * SWR-based data fetching hooks for automatic caching, revalidation, and optimistic updates
 */
import useSWR, { mutate } from 'swr';
import { useBrand } from '@/contexts/brand-context';

// Generic fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  const data = await res.json();
  return data;
};

// Types
interface Content {
  id: string;
  status: string;
  platform: string;
  copy_primary: string;
  copy_secondary?: string;
  hashtags?: string[];
  cta?: string;
  scheduled_for?: string;
  created_at: string;
  brand_id: string;
  idea_id?: string;
  ideas?: {
    concept: string;
    angle: string;
  };
  brands?: {
    name: string;
  };
}

interface Idea {
  id: string;
  concept: string;
  angle: string;
  target_platforms: string[];
  key_points: string[];
  potential_hooks: string[];
  ai_reasoning: string;
  confidence_score: number;
  status: string;
  created_at: string;
  brand_id: string;
  inputs?: {
    raw_content: string;
    type: string;
  };
}

interface ContentImage {
  id: string;
  content_id: string;
  image_url: string;
  prompt?: string;
  model?: string;
  slide_number?: number;
  media_type?: 'image' | 'video';
  video_url?: string;
  duration_seconds?: number;
  created_at: string;
}

interface UseContentOptions {
  status?: string;
  platform?: string;
  limit?: number;
}

interface UseIdeasOptions {
  status?: string;
  limit?: number;
}

/**
 * Hook for fetching content with automatic caching
 */
export function useContent(options: UseContentOptions = {}) {
  const { selectedBrand } = useBrand();
  const { status, platform, limit = 50 } = options;

  const params = new URLSearchParams();
  if (selectedBrand?.id) params.set('brandId', selectedBrand.id);
  if (status) params.set('status', status);
  if (platform) params.set('platform', platform);
  params.set('limit', limit.toString());

  const key = selectedBrand?.id ? `/api/content?${params.toString()}` : null;

  const { data, error, isLoading, isValidating, mutate: mutateContent } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  return {
    content: (data?.content || []) as Content[],
    isLoading,
    isValidating,
    error,
    mutate: mutateContent,
  };
}

/**
 * Hook for fetching ideas with automatic caching
 */
export function useIdeas(options: UseIdeasOptions = {}) {
  const { selectedBrand } = useBrand();
  const { status, limit = 50 } = options;

  const params = new URLSearchParams();
  if (selectedBrand?.id) params.set('brandId', selectedBrand.id);
  if (status) params.set('status', status);
  params.set('limit', limit.toString());

  const key = selectedBrand?.id ? `/api/ideas?${params.toString()}` : null;

  const { data, error, isLoading, isValidating, mutate: mutateIdeas } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    ideas: (data?.ideas || []) as Idea[],
    isLoading,
    isValidating,
    error,
    mutate: mutateIdeas,
  };
}

/**
 * Hook for fetching images for a specific content item
 */
export function useContentImages(contentId: string | null) {
  const key = contentId ? `/api/images/generate?contentId=${contentId}` : null;

  const { data, error, isLoading, mutate: mutateImages } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // Images don't change often
    }
  );

  return {
    images: (data?.images || []) as ContentImage[],
    isLoading,
    error,
    mutate: mutateImages,
  };
}

/**
 * Hook for fetching all images for multiple content items
 * Uses SWR's cache to avoid duplicate requests
 */
export function useAllContentImages(contentIds: string[]) {
  // Create individual SWR hooks for each content ID
  // SWR will automatically dedupe and cache these
  const keys = contentIds.map(id => `/api/images/generate?contentId=${id}`);
  
  // Use a single combined key for the batch
  const combinedKey = contentIds.length > 0 ? `images-batch-${contentIds.join(',')}` : null;

  const { data, error, isLoading } = useSWR(
    combinedKey,
    async () => {
      // Fetch all in parallel
      const results = await Promise.all(
        keys.map(async (key) => {
          try {
            const res = await fetch(key.replace('images-batch-', ''));
            const data = await res.json();
            return data;
          } catch {
            return { images: [] };
          }
        })
      );
      
      // Build a map of contentId -> images
      const imageMap: Record<string, ContentImage[]> = {};
      contentIds.forEach((id, index) => {
        imageMap[id] = results[index]?.images || [];
      });
      return imageMap;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    imagesByContent: (data || {}) as Record<string, ContentImage[]>,
    isLoading,
    error,
  };
}

/**
 * Optimistic update helper for content status changes
 */
export async function updateContentOptimistic(
  contentId: string,
  updates: Partial<Content>,
  currentKey: string | null
) {
  if (!currentKey) return;

  // Optimistically update the local data
  await mutate(
    currentKey,
    async (currentData: { content: Content[] } | undefined) => {
      if (!currentData) return currentData;
      
      // Update local state immediately
      const updatedContent = currentData.content.map((c) =>
        c.id === contentId ? { ...c, ...updates } : c
      );
      
      // Make the API call
      try {
        await fetch('/api/content', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: contentId, ...updates }),
        });
      } catch (error) {
        // Revert on error by returning original data
        throw error;
      }
      
      return { ...currentData, content: updatedContent };
    },
    {
      optimisticData: (currentData: { content: Content[] } | undefined) => {
        if (!currentData) return { content: [] };
        return {
          ...currentData,
          content: currentData.content.map((c) =>
            c.id === contentId ? { ...c, ...updates } : c
          ),
        };
      },
      rollbackOnError: true,
      revalidate: false,
    }
  );
}

/**
 * Optimistic delete helper for content
 */
export async function deleteContentOptimistic(
  contentId: string,
  currentKey: string | null
) {
  if (!currentKey) return;

  await mutate(
    currentKey,
    async (currentData: { content: Content[] } | undefined) => {
      if (!currentData) return currentData;
      
      // Make the API call
      const res = await fetch(`/api/content?id=${contentId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      
      // Return filtered content
      return {
        ...currentData,
        content: currentData.content.filter((c) => c.id !== contentId),
      };
    },
    {
      optimisticData: (currentData: { content: Content[] } | undefined) => {
        if (!currentData) return { content: [] };
        return {
          ...currentData,
          content: currentData.content.filter((c) => c.id !== contentId),
        };
      },
      rollbackOnError: true,
      revalidate: false,
    }
  );
}

/**
 * Optimistic update helper for ideas
 */
export async function updateIdeaOptimistic(
  ideaId: string,
  updates: Partial<Idea>,
  currentKey: string | null
) {
  if (!currentKey) return;

  await mutate(
    currentKey,
    async (currentData: { ideas: Idea[] } | undefined) => {
      if (!currentData) return currentData;
      
      // Make the API call
      await fetch('/api/ideas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ideaId, ...updates }),
      });
      
      return {
        ...currentData,
        ideas: currentData.ideas.map((i) =>
          i.id === ideaId ? { ...i, ...updates } : i
        ),
      };
    },
    {
      optimisticData: (currentData: { ideas: Idea[] } | undefined) => {
        if (!currentData) return { ideas: [] };
        return {
          ...currentData,
          ideas: currentData.ideas.map((i) =>
            i.id === ideaId ? { ...i, ...updates } : i
          ),
        };
      },
      rollbackOnError: true,
      revalidate: false,
    }
  );
}

// Re-export mutate for manual cache invalidation
export { mutate };
