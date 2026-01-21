/**
 * Retry utility with exponential backoff for API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  shouldRetry: (error) => {
    // Retry on network errors and 5xx status codes
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Network errors
      if (message.includes("network") || message.includes("timeout") || message.includes("econnreset")) {
        return true;
      }
      // Rate limiting
      if (message.includes("429") || message.includes("rate limit")) {
        return true;
      }
      // Server errors
      if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("504")) {
        return true;
      }
    }
    return false;
  },
  onRetry: (attempt, error, delay) => {
    console.log(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
  },
};

/**
 * Calculate exponential backoff delay with jitter
 */
function getBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelay * 0.5; // Up to 50% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Execute a function with automatic retry on failure
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }

      // Calculate delay and wait
      const delay = getBackoffDelay(attempt, opts.baseDelay, opts.maxDelay);
      opts.onRetry(attempt + 1, error, delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Retry specifically for fetch requests
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, init);
      
      // Throw on server errors to trigger retry
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Throw on rate limiting to trigger retry
      if (response.status === 429) {
        throw new Error("Rate limited (429)");
      }
      
      return response;
    },
    {
      ...options,
      shouldRetry: (error) => {
        // Use custom shouldRetry if provided
        if (options.shouldRetry) {
          return options.shouldRetry(error);
        }
        return defaultOptions.shouldRetry(error);
      },
    }
  );
}

/**
 * Create a retry wrapper for a specific API client
 */
export function createRetryableClient<T extends Record<string, (...args: unknown[]) => Promise<unknown>>>(
  client: T,
  options: RetryOptions = {}
): T {
  const wrapped = {} as T;
  
  for (const key of Object.keys(client) as (keyof T)[]) {
    const method = client[key];
    if (typeof method === "function") {
      (wrapped as Record<string, unknown>)[key as string] = (...args: unknown[]) =>
        withRetry(() => method.apply(client, args), options);
    }
  }
  
  return wrapped;
}
