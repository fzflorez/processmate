/**
 * Service Result pattern for consistent error handling and response management
 * Provides a standardized way to handle success and error cases across all services
 */

import type { AsyncStatus } from "@/types";
import { ServiceError } from "./service-error";

/**
 * Base service result interface
 */
export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  status: AsyncStatus;
  timestamp: string;
}

/**
 * Success result factory
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
    status: "success",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Error result factory
 */
export function createErrorResult<T = never>(
  error: ServiceError | string,
  status: AsyncStatus = "error",
): ServiceResult<T> {
  const serviceError =
    typeof error === "string"
      ? new ServiceError("UNKNOWN_ERROR", error)
      : error;

  return {
    success: false,
    error: serviceError,
    status,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Loading result factory
 */
export function createLoadingResult<T = unknown>(): ServiceResult<T> {
  return {
    success: false,
    status: "loading",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Idle result factory
 */
export function createIdleResult<T = unknown>(): ServiceResult<T> {
  return {
    success: false,
    status: "idle",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Async service result with promise support
 */
export type AsyncServiceResult<T> = Promise<ServiceResult<T>>;

/**
 * Utility to wrap async operations in service results
 */
export async function wrapServiceResult<T>(
  operation: () => Promise<T>,
): Promise<ServiceResult<T>> {
  try {
    const data = await operation();
    return createSuccessResult(data);
  } catch (error) {
    if (error instanceof ServiceError) {
      return createErrorResult(error);
    }

    // Handle unknown errors
    const serviceError = new ServiceError(
      "UNKNOWN_ERROR",
      error instanceof Error ? error.message : "An unknown error occurred",
    );

    return createErrorResult(serviceError);
  }
}

/**
 * Type guard for success results
 */
export function isSuccessResult<T>(
  result: ServiceResult<T>,
): result is ServiceResult<T> & { success: true; data: T } {
  return result.success;
}

/**
 * Type guard for error results
 */
export function isErrorResult<T>(
  result: ServiceResult<T>,
): result is ServiceResult<T> & { success: false; error: ServiceError } {
  return !result.success;
}

/**
 * Extract data from result or throw error
 */
export function getResultData<T>(result: ServiceResult<T>): T {
  if (isSuccessResult(result)) {
    return result.data;
  }
  throw (
    result.error ||
    new ServiceError("NO_DATA", "No data available in error result")
  );
}

/**
 * Extract error from result or throw if success
 */
export function getResultError<T>(result: ServiceResult<T>): ServiceError {
  if (isErrorResult(result)) {
    return result.error;
  }
  throw new ServiceError("NO_ERROR", "No error available in success result");
}
