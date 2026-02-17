/**
 * Service Error abstraction for consistent error handling across all services
 * Provides structured error information with categorization and context
 */

/**
 * Service error categories for better error handling and user experience
 */
export enum ServiceErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Service error severity levels
 */
export enum ServiceErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Service error interface
 */
export interface ServiceErrorData {
  code: string;
  message: string;
  category: ServiceErrorCategory;
  severity: ServiceErrorSeverity;
  details?: Record<string, unknown>;
  cause?: Error;
  timestamp: string;
  requestId?: string;
  userId?: string;
  service?: string;
  operation?: string;
}

/**
 * Service Error class
 */
export class ServiceError extends Error {
  public readonly code: string;
  public readonly category: ServiceErrorCategory;
  public readonly severity: ServiceErrorSeverity;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly service?: string;
  public readonly operation?: string;

  constructor(
    code: string,
    message: string,
    category: ServiceErrorCategory = ServiceErrorCategory.UNKNOWN,
    severity: ServiceErrorSeverity = ServiceErrorSeverity.MEDIUM,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
      requestId?: string;
      userId?: string;
      service?: string;
      operation?: string;
    }
  ) {
    super(message);
    
    this.name = 'ServiceError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.details = options?.details;
    this.cause = options?.cause;
    this.timestamp = new Date().toISOString();
    this.requestId = options?.requestId;
    this.userId = options?.userId;
    this.service = options?.service;
    this.operation = options?.operation;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }
  }

  /**
   * Convert error to JSON for logging and API responses
   */
  toJSON(): ServiceErrorData {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      service: this.service,
      operation: this.operation,
    };
  }

  /**
   * Create a validation error
   */
  static validation(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.VALIDATION,
      ServiceErrorSeverity.MEDIUM,
      { details }
    );
  }

  /**
   * Create an authentication error
   */
  static authentication(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.AUTHENTICATION,
      ServiceErrorSeverity.HIGH,
      { details }
    );
  }

  /**
   * Create an authorization error
   */
  static authorization(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.AUTHORIZATION,
      ServiceErrorSeverity.HIGH,
      { details }
    );
  }

  /**
   * Create a not found error
   */
  static notFound(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.NOT_FOUND,
      ServiceErrorSeverity.LOW,
      { details }
    );
  }

  /**
   * Create a conflict error
   */
  static conflict(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.CONFLICT,
      ServiceErrorSeverity.MEDIUM,
      { details }
    );
  }

  /**
   * Create an external service error
   */
  static externalService(
    code: string,
    message: string,
    cause?: Error,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.EXTERNAL_SERVICE,
      ServiceErrorSeverity.HIGH,
      { cause, details }
    );
  }

  /**
   * Create a database error
   */
  static database(
    code: string,
    message: string,
    cause?: Error,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.DATABASE,
      ServiceErrorSeverity.HIGH,
      { cause, details }
    );
  }

  /**
   * Create a network error
   */
  static network(
    code: string,
    message: string,
    cause?: Error,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.NETWORK,
      ServiceErrorSeverity.MEDIUM,
      { cause, details }
    );
  }

  /**
   * Create a timeout error
   */
  static timeout(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.TIMEOUT,
      ServiceErrorSeverity.MEDIUM,
      { details }
    );
  }

  /**
   * Create an internal server error
   */
  static internal(
    code: string,
    message: string,
    cause?: Error,
    details?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(
      code,
      message,
      ServiceErrorCategory.INTERNAL,
      ServiceErrorSeverity.CRITICAL,
      { cause, details }
    );
  }

  /**
   * Wrap an existing error into a ServiceError
   */
  static wrap(
    error: Error,
    code?: string,
    category?: ServiceErrorCategory,
    severity?: ServiceErrorSeverity
  ): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }

    return new ServiceError(
      code || 'WRAPPED_ERROR',
      error.message,
      category || ServiceErrorCategory.UNKNOWN,
      severity || ServiceErrorSeverity.MEDIUM,
      { cause: error }
    );
  }
}
