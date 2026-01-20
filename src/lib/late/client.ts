/**
 * Late.dev API Client
 *
 * Client library for interacting with the Late.dev social media publishing API.
 * Documentation: https://docs.getlate.dev/
 */

import {
  CreatePostRequest,
  CreatePostResponse,
  GetPostResponse,
  GetPostAnalyticsResponse,
  ListAccountsResponse,
  LateApiError,
} from './types';

const LATE_API_BASE_URL = 'https://getlate.dev/api/v1';

/**
 * Custom error class for Late.dev API errors
 */
export class LateApiException extends Error {
  code: string;
  details?: Record<string, unknown>;
  statusCode: number;

  constructor(error: LateApiError, statusCode: number) {
    super(error.message);
    this.name = 'LateApiException';
    this.code = error.code;
    this.details = error.details;
    this.statusCode = statusCode;
  }
}

/**
 * Late.dev API Client
 */
export class LateClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.LATE_API_KEY;
    if (!key) {
      throw new Error('LATE_API_KEY is required. Set it in environment variables or pass it to the constructor.');
    }
    this.apiKey = key;
    this.baseUrl = LATE_API_BASE_URL;
  }

  /**
   * Make an authenticated request to the Late.dev API
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (error) {
      // Network error - API unreachable
      const message = error instanceof Error ? error.message : 'Network request failed';
      throw new LateApiException(
        {
          code: 'NETWORK_ERROR',
          message: `Failed to connect to Late.dev API: ${message}. Please check your LATE_API_KEY and network connection.`,
        },
        0
      );
    }

    // Handle error responses
    if (!response.ok) {
      let errorData: LateApiError;
      try {
        const responseText = await response.text();
        console.error('Late.dev API error response:', response.status, responseText);
        try {
          const parsed = JSON.parse(responseText);
          errorData = {
            code: parsed.code || parsed.error || 'API_ERROR',
            message: parsed.message || parsed.error || responseText || `Request failed with status ${response.status}`,
            details: parsed,
          };
        } catch {
          errorData = {
            code: 'UNKNOWN_ERROR',
            message: responseText || `Request failed with status ${response.status}`,
          };
        }
      } catch {
        errorData = {
          code: 'UNKNOWN_ERROR',
          message: `Request failed with status ${response.status}`,
        };
      }
      throw new LateApiException(errorData, response.status);
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Create a new post
   *
   * @param request - Post creation request
   * @returns Created post response
   *
   * @example
   * ```typescript
   * const post = await client.createPost({
   *   platforms: ['instagram'],
   *   content: {
   *     text: 'Check out our new product! #launch #startup',
   *     media: [{ url: 'https://example.com/image.jpg', type: 'image' }]
   *   },
   *   platformSpecificData: {
   *     instagram: { contentType: 'feed' }
   *   }
   * });
   * ```
   */
  async createPost(request: CreatePostRequest): Promise<CreatePostResponse> {
    return this.request<CreatePostResponse>('POST', '/posts', request);
  }

  /**
   * Get post status and details
   *
   * @param postId - Late.dev post ID
   * @returns Post details and status
   */
  async getPost(postId: string): Promise<GetPostResponse> {
    return this.request<GetPostResponse>('GET', `/posts/${postId}`);
  }

  /**
   * Get analytics for a published post
   *
   * @param postId - Late.dev post ID
   * @returns Post analytics per platform
   */
  async getPostAnalytics(postId: string): Promise<GetPostAnalyticsResponse> {
    return this.request<GetPostAnalyticsResponse>('GET', `/posts/${postId}/analytics`);
  }

  /**
   * Cancel a scheduled post
   *
   * @param postId - Late.dev post ID
   */
  async cancelPost(postId: string): Promise<void> {
    await this.request<void>('DELETE', `/posts/${postId}`);
  }

  /**
   * List connected social accounts
   *
   * @returns List of connected accounts
   */
  async listAccounts(): Promise<ListAccountsResponse> {
    return this.request<ListAccountsResponse>('GET', '/accounts');
  }

  /**
   * Get OAuth authorization URL for connecting a new account
   *
   * Late.dev uses GET /connect/{platform}?profileId=xxx to initiate OAuth
   * The response redirects to the platform's OAuth page
   *
   * @param platform - Platform to connect (twitter, instagram, linkedin, etc.)
   * @param profileId - Optional Late.dev profile ID to associate the account with
   * @param callbackUrl - Optional callback URL after authorization
   * @returns Authorization URL to redirect the user to
   */
  async getAuthUrl(platform: string, callbackUrl?: string, profileId?: string): Promise<{ url: string }> {
    // Build the connect URL - this is a redirect endpoint, not a JSON API
    const params = new URLSearchParams();
    if (profileId) {
      params.set('profileId', profileId);
    }
    if (callbackUrl) {
      params.set('callbackUrl', callbackUrl);
    }

    const connectUrl = `${this.baseUrl}/connect/${platform}?${params.toString()}`;

    // For Late.dev, the connect endpoint itself IS the auth URL
    // We just need to redirect the user there with proper auth
    // Return the URL with the API key in the header requirement
    return { url: `${connectUrl}&apiKey=${this.apiKey}` };
  }

  /**
   * Disconnect a social account
   *
   * @param accountId - Late.dev account ID
   */
  async disconnectAccount(accountId: string): Promise<void> {
    await this.request<void>('DELETE', `/accounts/${accountId}`);
  }
}

// Export a singleton instance for convenience
let defaultClient: LateClient | null = null;

/**
 * Get the default Late.dev client instance
 *
 * @returns Late.dev client
 */
export function getLateClient(): LateClient {
  if (!defaultClient) {
    defaultClient = new LateClient();
  }
  return defaultClient;
}

// Re-export types for convenience
export * from './types';
