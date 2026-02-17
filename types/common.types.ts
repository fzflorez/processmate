/**
 * Common reusable types used throughout the application
 */

/**
 * Represents the status of an asynchronous operation
 */
export type AsyncStatus = "idle" | "loading" | "success" | "error";

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

/**
 * Pagination metadata for list responses
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Generic result type for operations that can fail
 */
export type Result<T, E = Error> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

/**
 * Optional utility type for better readability
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required utility type for better readability
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Deep partial utility type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Entity with standard metadata fields
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Soft deletable entity
 */
export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: string;
  isDeleted: boolean;
}

/**
 * Search and filter options
 */
export interface SearchOptions {
  query?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, unknown>;
}
