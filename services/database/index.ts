/**
 * Database Services Module
 * Contains database services, repositories, and data access layer components
 */

// Export base repository pattern
export {
  BaseRepository,
  type IRepository,
  type FindManyOptions,
} from "./base-repository";

// Export repository implementations
export { UserRepository, userRepository } from "./repositories/user.repository";
export {
  DocumentRepository,
  documentRepository,
} from "./repositories/document.repository";

// Export existing Supabase services
export {
  SupabaseService,
  UserService,
  ProfileService,
  WorkflowService,
  WorkflowExecutionService,
  PromptService,
  ApiKeyService,
  userService,
  profileService,
  workflowService,
  workflowExecutionService,
  promptService,
  apiKeyService,
} from "./supabase-service";

// Import the instances for use in databaseServices object
import { userRepository } from "./repositories/user.repository";
import { documentRepository } from "./repositories/document.repository";
import {
  userService,
  profileService,
  workflowService,
  workflowExecutionService,
  promptService,
  apiKeyService,
} from "./supabase-service";

/**
 * Database service configuration and utilities
 */
export const databaseServices = {
  // Repository instances (using imported singletons)
  userRepository,
  documentRepository,

  // Legacy service instances
  userService,
  profileService,
  workflowService,
  workflowExecutionService,
  promptService,
  apiKeyService,
};

/**
 * Database service types and interfaces
 */
export type DatabaseServiceConfig = {
  url: string;
  anonKey: string;
  connectionTimeout?: number;
  retryAttempts?: number;
  enableRealtime?: boolean;
};

/**
 * Common database operations interface (legacy - use IRepository instead)
 * @deprecated Use IRepository from base-repository.ts instead
 */
export interface DatabaseOperations<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(filters?: Record<string, unknown>): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
