/**
 * Standardized API Response Helpers
 * Ensures consistent response format across all API routes
 */

import { NextResponse } from "next/server";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Standard success response
 */
export function successResponse<T>(
  data: T,
  options?: {
    status?: number;
    headers?: Record<string, string>;
  }
): NextResponse<ApiResponse<T>> {
  const { status = 200, headers = {} } = options || {};
  
  return NextResponse.json(
    { success: true, data },
    { status, headers }
  );
}

/**
 * Standard error response
 */
export function errorResponse(
  code: string,
  message: string,
  options?: {
    status?: number;
    details?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): NextResponse<ApiResponse<never>> {
  const { status = 500, details, headers = {} } = options || {};
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status, headers }
  );
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Client errors (4xx)
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  
  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  
  // AI-specific errors
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  AI_RATE_LIMITED: "AI_RATE_LIMITED",
  AI_CONTENT_FILTERED: "AI_CONTENT_FILTERED",
} as const;

/**
 * Common error responses factory
 */
export const Errors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    errorResponse(ErrorCodes.BAD_REQUEST, message, { status: 400, details }),
  
  unauthorized: (message = "Authentication required") =>
    errorResponse(ErrorCodes.UNAUTHORIZED, message, { status: 401 }),
  
  forbidden: (message = "Access denied") =>
    errorResponse(ErrorCodes.FORBIDDEN, message, { status: 403 }),
  
  notFound: (resource = "Resource") =>
    errorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, { status: 404 }),
  
  validationError: (message: string, details?: Record<string, unknown>) =>
    errorResponse(ErrorCodes.VALIDATION_ERROR, message, { status: 422, details }),
  
  rateLimited: (message = "Too many requests, please try again later") =>
    errorResponse(ErrorCodes.RATE_LIMITED, message, { status: 429 }),
  
  internal: (message = "Internal server error") =>
    errorResponse(ErrorCodes.INTERNAL_ERROR, message, { status: 500 }),
  
  serviceUnavailable: (message = "Service temporarily unavailable") =>
    errorResponse(ErrorCodes.SERVICE_UNAVAILABLE, message, { status: 503 }),
  
  externalApi: (service: string, message: string) =>
    errorResponse(ErrorCodes.EXTERNAL_API_ERROR, `${service}: ${message}`, { status: 502 }),
  
  database: (message = "Database error") =>
    errorResponse(ErrorCodes.DATABASE_ERROR, message, { status: 500 }),
  
  aiGeneration: (message: string, details?: Record<string, unknown>) =>
    errorResponse(ErrorCodes.AI_GENERATION_FAILED, message, { status: 500, details }),
  
  aiRateLimited: (service: string) =>
    errorResponse(ErrorCodes.AI_RATE_LIMITED, `${service} rate limit exceeded`, { status: 429 }),
  
  aiContentFiltered: (message = "Content was filtered by safety systems") =>
    errorResponse(ErrorCodes.AI_CONTENT_FILTERED, message, { status: 400 }),
};

/**
 * Wrap an async handler with standard error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  return handler().catch((error) => {
    console.error("[API Error]", error);
    
    if (error instanceof Error) {
      return Errors.internal(error.message);
    }
    
    return Errors.internal();
  });
}
