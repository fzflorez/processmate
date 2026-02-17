/**
 * Supabase Service Wrapper
 * Wraps Supabase calls with service result pattern and prevents direct SDK usage
 */

import { supabase } from "@/lib/supabase/client";
import { supabaseServer } from "@/lib/supabase/server";
import { createSuccessResult, createErrorResult } from "../service-result";
import type { ServiceResult } from "../service-result";
import { ServiceError } from "../service-error";
import type {
  Database,
  User,
  UserInsert,
  UserUpdate,
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Workflow,
  WorkflowInsert,
  WorkflowUpdate,
  WorkflowExecution,
  WorkflowExecutionInsert,
  WorkflowExecutionUpdate,
  Prompt,
  PromptInsert,
  PromptUpdate,
  ApiKey,
  ApiKeyInsert,
  ApiKeyUpdate,
} from "@/lib/supabase/types";

/**
 * Base Supabase service class
 * Provides common CRUD operations with service result pattern
 */
export class SupabaseService {
  protected client = supabase;
  protected serverClient = supabaseServer;

  /**
   * Generic create operation
   */
  protected async create<T extends keyof Database["public"]["Tables"]>(
    table: T,
    data: Database["public"]["Tables"][T]["Insert"],
  ): Promise<ServiceResult<Database["public"]["Tables"][T]["Row"]>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from(table)
        .insert(data as any)
        .select()
        .single();

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to create ${String(table)}: ${error.message}`,
            "DB_CREATE_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Generic read operation
   */
  protected async read<T extends keyof Database["public"]["Tables"]>(
    table: T,
    id: string,
  ): Promise<ServiceResult<Database["public"]["Tables"][T]["Row"]>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return createErrorResult(
            ServiceError.notFound(
              `${String(table)} not found`,
              "NOT_FOUND",
              undefined,
              error,
            ),
          );
        }
        return createErrorResult(
          ServiceError.database(
            `Failed to read ${String(table)}: ${error.message}`,
            "DB_READ_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Generic update operation
   */
  protected async update<T extends keyof Database["public"]["Tables"]>(
    table: T,
    id: string,
    data: Database["public"]["Tables"][T]["Update"],
  ): Promise<ServiceResult<Database["public"]["Tables"][T]["Row"]>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from(table)
        .update(data as any)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return createErrorResult(
            ServiceError.notFound(
              `${String(table)} not found`,
              "NOT_FOUND",
              undefined,
              error,
            ),
          );
        }
        return createErrorResult(
          ServiceError.database(
            `Failed to update ${String(table)}: ${error.message}`,
            "DB_UPDATE_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Generic delete operation
   */
  protected async delete<T extends keyof Database["public"]["Tables"]>(
    table: T,
    id: string,
  ): Promise<ServiceResult<void>> {
    try {
      const { error } = await (this.client as any)
        .from(table)
        .delete()
        .eq("id", id);

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to delete ${String(table)}: ${error.message}`,
            "DB_DELETE_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(undefined);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Generic list operation
   */
  protected async list<T extends keyof Database["public"]["Tables"]>(
    table: T,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: {
        column: keyof Database["public"]["Tables"][T]["Row"];
        ascending?: boolean;
      };
      filter?: Record<string, unknown>;
    } = {},
  ): Promise<ServiceResult<Database["public"]["Tables"][T]["Row"][]>> {
    try {
      let query = (this.client as any).from(table).select("*");

      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column as string, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1,
        );
      }

      const { data: result, error } = await query;

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to list ${String(table)}: ${error.message}`,
            "DB_LIST_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result || []);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }
}

/**
 * User service
 */
export class UserService extends SupabaseService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ServiceResult<User>> {
    return this.read("users", id);
  }

  /**
   * Create new user
   */
  async createUser(userData: UserInsert): Promise<ServiceResult<User>> {
    return this.create("users", userData);
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    userData: UserUpdate,
  ): Promise<ServiceResult<User>> {
    return this.update("users", id, userData);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<ServiceResult<void>> {
    return this.delete("users", id);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<ServiceResult<User | null>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return createSuccessResult(null);
        }
        return createErrorResult(
          ServiceError.database(
            `Failed to get user by email: ${error.message}`,
            "DB_READ_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * List users with pagination
   */
  async listUsers(
    options: {
      limit?: number;
      offset?: number;
      search?: string;
    } = {},
  ): Promise<ServiceResult<User[]>> {
    const filter: Record<string, unknown> = {};

    if (options.search) {
      // Add search filter (implementation depends on your search strategy)
      filter["name"] = options.search;
    }

    return this.list("users", {
      limit: options.limit,
      offset: options.offset,
      orderBy: { column: "created_at", ascending: false },
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
  }
}

/**
 * Profile service
 */
export class ProfileService extends SupabaseService {
  /**
   * Get profile by user ID
   */
  async getProfileByUserId(
    userId: string,
  ): Promise<ServiceResult<Profile | null>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return createSuccessResult(null);
        }
        return createErrorResult(
          ServiceError.database(
            `Failed to get profile: ${error.message}`,
            "DB_READ_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Create or update profile
   */
  async upsertProfile(
    profileData: ProfileInsert,
  ): Promise<ServiceResult<Profile>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("profiles")
        .upsert(profileData)
        .select()
        .single();

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to upsert profile: ${error.message}`,
            "DB_UPSERT_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Update profile
   */
  async updateProfile(
    userId: string,
    profileData: ProfileUpdate,
  ): Promise<ServiceResult<Profile>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("profiles")
        .update(profileData as any)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to update profile: ${error.message}`,
            "DB_UPDATE_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }
}

/**
 * Workflow service
 */
export class WorkflowService extends SupabaseService {
  /**
   * Get workflow by ID
   */
  async getWorkflowById(id: string): Promise<ServiceResult<Workflow>> {
    return this.read("workflows", id);
  }

  /**
   * Create workflow
   */
  async createWorkflow(
    workflowData: WorkflowInsert,
  ): Promise<ServiceResult<Workflow>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("workflows")
        .insert(workflowData)
        .select()
        .single();

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to create workflow: ${error.message}`,
            "DB_CREATE_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(
    id: string,
    workflowData: WorkflowUpdate,
  ): Promise<ServiceResult<Workflow>> {
    return this.update("workflows", id, workflowData);
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<ServiceResult<void>> {
    return this.delete("workflows", id);
  }

  /**
   * Get workflows by user ID
   */
  async getWorkflowsByUserId(
    userId: string,
  ): Promise<ServiceResult<Workflow[]>> {
    return this.list("workflows", {
      filter: { user_id: userId },
      orderBy: { column: "created_at", ascending: false },
    });
  }

  /**
   * Get active workflows
   */
  async getActiveWorkflows(): Promise<ServiceResult<Workflow[]>> {
    return this.list("workflows", {
      filter: { is_active: true },
      orderBy: { column: "updated_at", ascending: false },
    });
  }
}

/**
 * Workflow execution service
 */
export class WorkflowExecutionService extends SupabaseService {
  /**
   * Get execution by ID
   */
  async getExecutionById(
    id: string,
  ): Promise<ServiceResult<WorkflowExecution>> {
    return this.read("workflow_executions", id);
  }

  /**
   * Create execution
   */
  async createExecution(
    executionData: WorkflowExecutionInsert,
  ): Promise<ServiceResult<WorkflowExecution>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("workflow_executions")
        .insert(executionData)
        .select()
        .single();

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to create execution: ${error.message}`,
            "DB_CREATE_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Update execution
   */
  async updateExecution(
    id: string,
    executionData: WorkflowExecutionUpdate,
  ): Promise<ServiceResult<WorkflowExecution>> {
    return this.update("workflow_executions", id, executionData);
  }

  /**
   * Get executions by workflow ID
   */
  async getExecutionsByWorkflowId(
    workflowId: string,
  ): Promise<ServiceResult<WorkflowExecution[]>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("workflow_executions")
        .select("*")
        .eq("workflow_id", workflowId)
        .order("started_at", { ascending: false });

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to get executions by workflow: ${error.message}`,
            "DB_READ_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result || []);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Get executions by user ID
   */
  async getExecutionsByUserId(
    userId: string,
  ): Promise<ServiceResult<WorkflowExecution[]>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("workflow_executions")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to get executions: ${error.message}`,
            "DB_READ_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result || []);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Get recent executions
   */
  async getRecentExecutions(
    limit: number = 10,
  ): Promise<ServiceResult<WorkflowExecution[]>> {
    return this.list("workflow_executions", {
      limit,
      orderBy: { column: "started_at", ascending: false },
    });
  }
}

/**
 * Prompt service
 */
export class PromptService extends SupabaseService {
  /**
   * Get prompt by ID
   */
  async getPromptById(id: string): Promise<ServiceResult<Prompt>> {
    return this.read("prompts", id);
  }

  /**
   * Create prompt
   */
  async createPrompt(promptData: PromptInsert): Promise<ServiceResult<Prompt>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("prompts")
        .insert(promptData)
        .select()
        .single();

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to create prompt: ${error.message}`,
            "DB_CREATE_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Update prompt
   */
  async updatePrompt(
    id: string,
    promptData: PromptUpdate,
  ): Promise<ServiceResult<Prompt>> {
    return this.update("prompts", id, promptData);
  }

  /**
   * Delete prompt
   */
  async deletePrompt(id: string): Promise<ServiceResult<void>> {
    return this.delete("prompts", id);
  }

  /**
   * Get prompts by user ID
   */
  async getPromptsByUserId(userId: string): Promise<ServiceResult<Prompt[]>> {
    return this.list("prompts", {
      filter: { user_id: userId },
      orderBy: { column: "updated_at", ascending: false },
    });
  }

  /**
   * Get public prompts
   */
  async getPublicPrompts(): Promise<ServiceResult<Prompt[]>> {
    return this.list("prompts", {
      filter: { is_public: true },
      orderBy: { column: "updated_at", ascending: false },
    });
  }

  /**
   * Search prompts
   */
  async searchPrompts(query: string): Promise<ServiceResult<Prompt[]>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("prompts")
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order("updated_at", { ascending: false });

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to search prompts: ${error.message}`,
            "DB_SEARCH_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result || []);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }
}

/**
 * API key service
 */
export class ApiKeyService extends SupabaseService {
  /**
   * Get API key by ID
   */
  async getApiKeyById(id: string): Promise<ServiceResult<ApiKey>> {
    return this.read("api_keys", id);
  }

  /**
   * Create API key
   */
  async createApiKey(apiKeyData: ApiKeyInsert): Promise<ServiceResult<ApiKey>> {
    try {
      const { data: result, error } = await (this.client as any)
        .from("api_keys")
        .insert(apiKeyData)
        .select()
        .single();

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to create API key: ${error.message}`,
            "DB_CREATE_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(
    id: string,
    apiKeyData: ApiKeyUpdate,
  ): Promise<ServiceResult<ApiKey>> {
    return this.update("api_keys", id, apiKeyData);
  }

  /**
   * Delete API key
   */
  async deleteApiKey(id: string): Promise<ServiceResult<void>> {
    return this.delete("api_keys", id);
  }

  /**
   * Get API keys by user ID
   */
  async getApiKeysByUserId(userId: string): Promise<ServiceResult<ApiKey[]>> {
    return this.list("api_keys", {
      filter: { user_id: userId },
      orderBy: { column: "created_at", ascending: false },
    });
  }

  /**
   * Get active API keys
   */
  async getActiveApiKeys(userId: string): Promise<ServiceResult<ApiKey[]>> {
    return this.list("api_keys", {
      filter: { user_id: userId, is_active: true },
      orderBy: { column: "last_used_at", ascending: false },
    });
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(id: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await (this.client as any)
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() } as any)
        .eq("id", id);

      if (error) {
        return createErrorResult(
          ServiceError.database(
            `Failed to update last used: ${error.message}`,
            "DB_UPDATE_ERROR",
            error,
          ),
        );
      }

      return createSuccessResult(undefined);
    } catch (error) {
      return createErrorResult(
        ServiceError.unknownError(
          error instanceof Error ? error.message : "Unknown error",
        ),
      );
    }
  }
}

/**
 * Export service instances
 */
export const userService = new UserService();
export const profileService = new ProfileService();
export const workflowService = new WorkflowService();
export const workflowExecutionService = new WorkflowExecutionService();
export const promptService = new PromptService();
export const apiKeyService = new ApiKeyService();

/**
 * Default export for convenience
 */
const services = {
  userService,
  profileService,
  workflowService,
  workflowExecutionService,
  promptService,
  apiKeyService,
};

export default services;
