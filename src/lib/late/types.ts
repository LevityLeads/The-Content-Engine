/**
 * Late.dev API Types
 *
 * Type definitions for the Late.dev social media publishing API.
 * Documentation: https://docs.getlate.dev/
 */

// Supported platforms
export type LatePlatform = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok';

// Instagram-specific content types
export type InstagramContentType = 'feed' | 'story' | 'reel' | 'carousel';

// Media types
export type MediaType = 'image' | 'video';

// Post status from Late.dev
export type LatePostStatus =
  | 'pending'      // Queued for processing
  | 'processing'   // Currently being published
  | 'published'    // Successfully published
  | 'failed'       // Publication failed
  | 'scheduled';   // Scheduled for future publication

/**
 * Media item for a post
 */
export interface LateMedia {
  /** URL to the media file (must be publicly accessible) */
  url: string;
  /** Type of media */
  type: MediaType;
  /** Alt text for accessibility (optional) */
  altText?: string;
}

/**
 * Platform-specific data for Instagram
 */
export interface InstagramSpecificData {
  /** Type of Instagram content */
  contentType: InstagramContentType;
  /** Location tag (optional) */
  location?: string;
  /** Cover image URL for reels (optional) */
  coverImageUrl?: string;
  /** Share to feed when posting story (optional) */
  shareToFeed?: boolean;
}

/**
 * Platform-specific data union
 */
export interface PlatformSpecificData {
  instagram?: InstagramSpecificData;
}

/**
 * Content payload for creating a post
 */
export interface LatePostContent {
  /** Main text/caption for the post */
  text: string;
  /** Media attachments (images/videos) */
  media?: LateMedia[];
  /** First comment (Instagram only, for hashtags) */
  firstComment?: string;
}

/**
 * Request to create a new post
 */
export interface CreatePostRequest {
  /** Target platforms for this post */
  platforms: LatePlatform[];
  /** The content to post */
  content: LatePostContent;
  /** ISO 8601 timestamp for scheduled posting (optional) */
  scheduledFor?: string;
  /** Platform-specific configuration */
  platformSpecificData?: PlatformSpecificData;
  /** External reference ID for tracking */
  externalId?: string;
}

/**
 * Platform result within a post response
 */
export interface LatePlatformResult {
  /** Platform name */
  platform: LatePlatform;
  /** Status of the post on this platform */
  status: LatePostStatus;
  /** Platform-specific post ID (e.g., Instagram post ID) */
  platformPostId?: string;
  /** URL to the published post */
  postUrl?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Response from creating a post
 */
export interface CreatePostResponse {
  /** Late.dev post ID */
  id: string;
  /** Overall status */
  status: LatePostStatus;
  /** Scheduled time if applicable */
  scheduledFor?: string;
  /** Results per platform */
  platforms: LatePlatformResult[];
  /** Timestamp when the post was created */
  createdAt: string;
}

/**
 * Response from getting post status
 */
export interface GetPostResponse {
  /** Late.dev post ID */
  id: string;
  /** Overall status */
  status: LatePostStatus;
  /** Results per platform */
  platforms: LatePlatformResult[];
  /** Original content */
  content: LatePostContent;
  /** Scheduled time if applicable */
  scheduledFor?: string;
  /** Actual publish time */
  publishedAt?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Analytics data for a post
 */
export interface PostAnalytics {
  /** Impressions count */
  impressions: number;
  /** Reach (unique views) */
  reach: number;
  /** Total engagements */
  engagements: number;
  /** Likes/favorites */
  likes: number;
  /** Comments */
  comments: number;
  /** Shares/retweets */
  shares: number;
  /** Link clicks */
  clicks: number;
  /** Saves/bookmarks */
  saves: number;
}

/**
 * Analytics response per platform
 */
export interface PlatformAnalytics {
  /** Platform name */
  platform: LatePlatform;
  /** Analytics data */
  analytics: PostAnalytics;
  /** When analytics were last updated */
  updatedAt: string;
}

/**
 * Response from getting post analytics
 */
export interface GetPostAnalyticsResponse {
  /** Late.dev post ID */
  postId: string;
  /** Analytics per platform */
  platforms: PlatformAnalytics[];
}

/**
 * Error response from Late.dev API
 */
export interface LateApiError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Connected social account
 */
export interface LateAccount {
  /** Late.dev account ID */
  id: string;
  /** Platform */
  platform: LatePlatform;
  /** Platform username */
  username: string;
  /** Profile picture URL */
  profileImageUrl?: string;
  /** Whether the account is active */
  isActive: boolean;
  /** Account creation timestamp */
  createdAt: string;
}

/**
 * Response from listing connected accounts
 */
export interface ListAccountsResponse {
  /** Connected accounts */
  accounts: LateAccount[];
}
