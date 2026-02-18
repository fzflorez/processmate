/**
 * API-specific types and interfaces
 */

import type { ApiResponse, PaginatedResponse } from './common.types';

/**
 * HTTP methods supported by the API
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number>;
}

/**
 * Request configuration options
 */
export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  tags?: string[];
}

/**
 * API client interface
 */
export interface ApiClient {
  request<T>(endpoint: ApiEndpoint, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
  get<T>(url: string, params?: Record<string, string | number>, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
  post<T>(url: string, body?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
  put<T>(url: string, body?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
  patch<T>(url: string, body?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
  delete<T>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
}

/**
 * API error types
 */
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * API error details
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Resource CRUD operations interface
 */
export interface ResourceApi<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  list(params?: Record<string, unknown>): Promise<PaginatedResponse<T>>;
  get(id: string): Promise<ApiResponse<T>>;
  create(data: CreateInput): Promise<ApiResponse<T>>;
  update(id: string, data: UpdateInput): Promise<ApiResponse<T>>;
  delete(id: string): Promise<ApiResponse<void>>;
}

/**
 * Batch operation types
 */
export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete';
  data?: T;
  id?: string;
}

/**
 * Batch response
 */
export interface BatchResponse<T> {
  successful: T[];
  failed: Array<{
    item: BatchOperation<T>;
    error: string;
  }>;
  totalProcessed: number;
}

/**
 * Webhook event structure
 */
export interface WebhookEvent<T = unknown> {
  id: string;
  type: string;
  timestamp: string;
  data: T;
  signature?: string;
}

/**
 * Rate limit information
 */
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}
