/**
 * Authentication Services Module
 * Placeholder for authentication-related services including user authentication, authorization, and session management
 */

// Future auth service exports
// export { AuthService } from './auth.service';
// export { SessionService } from './session.service';
// export { PermissionService } from './permission.service';

/**
 * Authentication service configuration and utilities
 */
export const authServices = {
  // Placeholder for auth service registry
  // authService: new AuthService(),
  // sessionService: new SessionService(),
  // permissionService: new PermissionService(),
};

/**
 * Authentication service types and interfaces
 */
export type AuthServiceConfig = {
  jwtSecret?: string;
  sessionTimeout?: number;
  refreshTokenExpiry?: number;
  enableMFA?: boolean;
  passwordPolicy?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
  };
};

/**
 * User authentication data
 */
export interface UserAuth {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
  isActive: boolean;
}

/**
 * Session information
 */
export interface SessionInfo {
  sessionId: string;
  userId: string;
  expiresAt: string;
  isActive: boolean;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    device: string;
  };
}
