/**
 * Design Context Provider
 *
 * Single source of truth for all visual decisions in carousel generation.
 * Design context is computed ONCE and flows to all downstream components.
 *
 * The design context captures:
 * - Visual style (typography, photorealistic, illustration, etc.)
 * - Colors (primary, accent, background)
 * - Typography (font sizes, weights, family)
 * - Layout (padding)
 * - Aesthetic description (for AI prompts)
 * - Optional master brand prompt (authoritative brand direction)
 *
 * Usage:
 *   import { computeDesignContext, type DesignContext } from '@/lib/design';
 *
 *   const context = computeDesignContext({
 *     visualStyle: 'typography',
 *     brandVisualConfig: brand.visual_config,
 *     textStyle: 'bold-editorial'
 *   });
 *
 *   // Pass context to content generation, background generation, and compositor
 *   // The same context object is used throughout - no reinterpretation
 */

export { computeDesignContext } from './context-provider';
export type {
  DesignContext,
  DesignContextInput,
  BrandVisualConfig,
  VisualStyle,
} from './types';
