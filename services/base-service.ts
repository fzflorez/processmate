/**
 * Base Service class providing common functionality for all services
 * Implements standard patterns for error handling, logging, and result management
 */

import type { AsyncStatus } from "@/types";
import {
  ServiceError,
  ServiceErrorCategory,
  ServiceErrorSeverity,
} from "./service-error";
import {
  ServiceResult,
  createSuccessResult,
  createErrorResult,
  createLoadingResult,
  createIdleResult,
  wrapServiceResult,
} from "./service-result";

/**
 * Base service interface
 */
export interface BaseService {
  readonly serviceName: string;
  readonly version: string;
}

/**
 * Base service configuration
 */
export interface BaseServiceConfig {
  serviceName: string;
  version?: string;
  timeout?: number;
  retries?: number;
  enableLogging?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
}

/**
 * Abstract base service class
 */
export abstract class AbstractBaseService implements BaseService {
  public readonly serviceName: string;
  public readonly version: string;
  protected readonly config: Required<BaseServiceConfig>;

  constructor(config: BaseServiceConfig) {
    this.serviceName = config.serviceName;
    this.version = config.version || "1.0.0";
    this.config = {
      ...config,
      version: this.version,
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      enableLogging: config.enableLogging ?? true,
      logLevel: config.logLevel || "info",
    };
  }

  /**
   * Execute an operation with standard error handling and result wrapping
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    operationName?: string,
  ): Promise<ServiceResult<T>> {
    const startTime = Date.now();
    const opName = operationName || "unknown_operation";

    this.log("info", `Starting operation: ${opName}`, {
      service: this.serviceName,
      operation: opName,
    });

    try {
      const result = await wrapServiceResult(operation);

      const duration = Date.now() - startTime;
      this.log("info", `Operation completed: ${opName}`, {
        service: this.serviceName,
        operation: opName,
        duration,
        success: result.success,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const serviceError = ServiceError.wrap(
        error as Error,
        "OPERATION_FAILED",
        ServiceErrorCategory.INTERNAL,
        ServiceErrorSeverity.MEDIUM,
      );

      this.log("error", `Operation failed: ${opName}`, {
        service: this.serviceName,
        operation: opName,
        duration,
        error: serviceError.toJSON(),
      });

      return createErrorResult(serviceError);
    }
  }

  /**
   * Execute an operation with timeout
   */
  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs?: number,
    operationName?: string,
  ): Promise<ServiceResult<T>> {
    const timeout = timeoutMs || this.config.timeout;
    const opName = operationName || "timeout_operation";

    return this.executeOperation(async () => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new ServiceError(
              "TIMEOUT",
              `Operation ${opName} timed out after ${timeout}ms`,
              ServiceErrorCategory.TIMEOUT,
              ServiceErrorSeverity.MEDIUM,
            ),
          );
        }, timeout);
      });

      return Promise.race([operation(), timeoutPromise]);
    }, opName);
  }

  /**
   * Execute an operation with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    operationName?: string,
  ): Promise<ServiceResult<T>> {
    const retries = maxRetries || this.config.retries;
    const opName = operationName || "retry_operation";

    let lastError: Error | ServiceError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const result = await this.executeOperation(
        operation,
        `${opName}_attempt_${attempt + 1}`,
      );

      if (result.success) {
        if (attempt > 0) {
          this.log(
            "info",
            `Operation succeeded after ${attempt} retries: ${opName}`,
            {
              service: this.serviceName,
              operation: opName,
              attempts: attempt + 1,
            },
          );
        }
        return result;
      }

      lastError = result.error || null;

      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        this.log("warn", `Retrying operation in ${delay}ms: ${opName}`, {
          service: this.serviceName,
          operation: opName,
          attempt: attempt + 1,
          maxRetries: retries + 1,
          delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.log("error", `Operation failed after all retries: ${opName}`, {
      service: this.serviceName,
      operation: opName,
      totalAttempts: retries + 1,
    });

    return createErrorResult(
      ServiceError.wrap(
        lastError || new Error("Maximum retries exceeded"),
        "MAX_RETRIES_EXCEEDED",
        ServiceErrorCategory.INTERNAL,
        ServiceErrorSeverity.MEDIUM,
      ),
    );
  }

  /**
   * Create a success result
   */
  protected success<T>(data: T): ServiceResult<T> {
    return createSuccessResult(data);
  }

  /**
   * Create an error result
   */
  protected error<T = never>(
    error: ServiceError | string,
    status: AsyncStatus = "error",
  ): ServiceResult<T> {
    return createErrorResult(error, status);
  }

  /**
   * Create a loading result
   */
  protected loading<T = unknown>(): ServiceResult<T> {
    return createLoadingResult<T>();
  }

  /**
   * Create an idle result
   */
  protected idle<T = unknown>(): ServiceResult<T> {
    return createIdleResult<T>();
  }

  /**
   * Logging utility
   */
  protected log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    if (!this.config.enableLogging) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      version: this.version,
      message,
      metadata,
    };

    // In a real implementation, this would integrate with a logging service
    // For now, we'll use console methods with proper formatting
    const logMethod =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : level === "info"
            ? console.info
            : console.debug;

    logMethod(`[${this.serviceName}] ${message}`, logEntry);
  }

  /**
   * Health check method
   */
  public async healthCheck(): Promise<
    ServiceResult<{ status: string; timestamp: string }>
  > {
    return this.executeOperation(async () => {
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
      };
    }, "health_check");
  }

  /**
   * Get service information
   */
  public getServiceInfo(): ServiceResult<{
    name: string;
    version: string;
    config: Partial<BaseServiceConfig>;
  }> {
    return this.success({
      name: this.serviceName,
      version: this.version,
      config: {
        timeout: this.config.timeout,
        retries: this.config.retries,
        enableLogging: this.config.enableLogging,
        logLevel: this.config.logLevel,
      },
    });
  }
}
