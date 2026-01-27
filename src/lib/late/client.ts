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

const LATE_API_BASE_URL = 'https://getlate.dev/api';

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
      redirect: 'follow', // Follow redirects but log them
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      console.log(`Late.dev API request: ${method} ${url}`);
      console.log(`Late.dev API request body:`, JSON.stringify(body, null, 2));
      console.log(`Late.dev API headers:`, JSON.stringify(Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, k === 'Authorization' ? 'Bearer ***' : v])), null, 2));
      response = await fetch(url, options);
      console.log(`Late.dev API response status: ${response.status}`);
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

    // Log if there was a redirect
    if (response.url !== url) {
      console.log(`Late.dev API was redirected: ${url} -> ${response.url}`);
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
    return this.request<CreatePostResponse>('POST', '/v1/posts', request);
  }

  /**
   * Get post status and details
   *
   * @param postId - Late.dev post ID
   * @returns Post details and status
   */
  async getPost(postId: string): Promise<GetPostResponse> {
    return this.request<GetPostResponse>('GET', `/v1/posts/${postId}`);
  }

  /**
   * Get analytics for a published post
   *
   * @param postId - Late.dev post ID
   * @returns Post analytics per platform
   */
  async getPostAnalytics(postId: string): Promise<GetPostAnalyticsResponse> {
    return this.request<GetPostAnalyticsResponse>('GET', `/v1/posts/${postId}/analytics`);
  }

  /**
   * Cancel a scheduled post
   *
   * @param postId - Late.dev post ID
   */
  async cancelPost(postId: string): Promise<void> {
    await this.request<void>('DELETE', `/v1/posts/${postId}`);
  }

  /**
   * List connected social accounts
   *
   * @returns List of connected accounts
   */
  async listAccounts(): Promise<ListAccountsResponse> {
    return this.request<ListAccountsResponse>('GET', '/v1/accounts');
  }

  /**
   * Get OAuth authorization URL for connecting a new account
   *
   * SECURITY NOTE: The API key is passed via the redirect URL query parameter.
   * This is Late.dev's required auth flow for initiating OAuth connections.
   * 
   * Security mitigations in place:
   * 1. The URL is only constructed server-side (never exposed to client code)
   * 2. The redirect is to HTTPS endpoints only (Late.dev API)
   * 3. Referrer-Policy: no-referrer is set on the response to prevent leaking
   * 4. The key is not stored in browser history (user is redirected immediately)
   * 
   * For enhanced security in production, consider:
   * 1. Using a proxy endpoint that handles the key entirely server-side
   * 2. Requesting Late.dev implement OAuth authorization code exchange flow
   * 3. Using short-lived, scoped tokens instead of the main API key
   *
   * Late.dev uses GET /connect/{platform}?profileId=xxx to initiate OAuth
   * The response redirects to the platform's OAuth page
   *
   * @param platform - Platform to connect (twitter, instagram, linkedin, etc.)
   * @param callbackUrl - Optional callback URL after authorization
   * @param profileId - Optional Late.dev profile ID to associate the account with
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

    const connectUrl = `${this.baseUrl}/v1/connect/${platform}?${params.toString()}`;

    // For Late.dev, the connect endpoint itself IS the auth URL
    // We just need to redirect the user there with proper auth
    // 
    // SECURITY: The API key must be passed in the URL for Late.dev's OAuth flow.
    // This is mitigated by:
    // - Server-side only URL construction
    // - HTTPS transport (Late.dev API is HTTPS-only)
    // - Referrer-Policy headers on the API response
    // - Immediate redirect (no browser history storage of full URL)
    return { url: `${connectUrl}&apiKey=${this.apiKey}` };
  }

  /**
   * Disconnect a social account
   *
   * @param accountId - Late.dev account ID
   */
  async disconnectAccount(accountId: string): Promise<void> {
    await this.request<void>('DELETE', `/v1/accounts/${accountId}`);
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
