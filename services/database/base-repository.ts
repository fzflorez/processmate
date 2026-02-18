/**
 * Base Repository Pattern
 * Provides generic CRUD abstraction for database operations using the service layer
 */

import { SupabaseService } from "./supabase-service";
import { createSuccessResult, createErrorResult } from "../service-result";
import { ServiceError } from "../service-error";
import type { ServiceResult } from "../service-result";
import type { Database } from "@/lib/supabase/types";

/**
 * Repository interface defining standard CRUD operations
 */
export interface IRepository<T, TInsert, TUpdate> {
  create(data: TInsert): Promise<ServiceResult<T>>;
  findById(id: string): Promise<ServiceResult<T | null>>;
  findMany(options?: FindManyOptions<T>): Promise<ServiceResult<T[]>>;
  update(id: string, data: TUpdate): Promise<ServiceResult<T>>;
  delete(id: string): Promise<ServiceResult<void>>;
}

/**
 * Options for findMany operations
 */
export interface FindManyOptions<T> {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: keyof T;
    ascending?: boolean;
  };
  filter?: Record<string, unknown>;
  select?: string;
}

/**
 * Base repository implementation using composition with SupabaseService
 */
export abstract class BaseRepository<
  TTable extends keyof Database["public"]["Tables"],
  TRow extends Database["public"]["Tables"][TTable]["Row"] =
    Database["public"]["Tables"][TTable]["Row"],
  TInsert extends Database["public"]["Tables"][TTable]["Insert"] =
    Database["public"]["Tables"][TTable]["Insert"],
  TUpdate extends Database["public"]["Tables"][TTable]["Update"] =
    Database["public"]["Tables"][TTable]["Update"],
> implements IRepository<TRow, TInsert, TUpdate> {
  protected tableName: TTable;
  protected supabaseService: SupabaseService;

  constructor(tableName: TTable) {
    this.tableName = tableName;
    this.supabaseService = new SupabaseService();
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<ServiceResult<TRow>> {
    try {
      class RepositoryService extends SupabaseService {
        async createRecord<T extends keyof Database["public"]["Tables"]>(
          table: T,
          recordData: Database["public"]["Tables"][T]["Insert"],
        ) {
          return super.create(table, recordData);
        }
      }

      const service = new RepositoryService();
      const result = await service.createRecord(this.tableName, data);
      return result as ServiceResult<TRow>;
    } catch (error) {
      return createErrorResult(
        ServiceError.database(
          `Failed to create ${String(this.tableName)}: ${error instanceof Error ? error.message : "Unknown error"}`,
          "REPO_CREATE_ERROR",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<ServiceResult<TRow | null>> {
    try {
      class RepositoryService extends SupabaseService {
        async readRecord<T extends keyof Database["public"]["Tables"]>(
          table: T,
          recordId: string,
        ) {
          return super.read(table, recordId);
        }
      }

      const service = new RepositoryService();
      const result = await service.readRecord(this.tableName, id);

      if (!result.success && result.error?.code === "NOT_FOUND") {
        return createSuccessResult(null);
      }

      return result as ServiceResult<TRow>;
    } catch (error) {
      return createErrorResult(
        ServiceError.database(
          `Failed to find ${String(this.tableName)} by ID: ${error instanceof Error ? error.message : "Unknown error"}`,
          "REPO_FIND_ERROR",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find multiple records with optional filtering and pagination
   */
  async findMany(
    options: FindManyOptions<TRow> = {},
  ): Promise<ServiceResult<TRow[]>> {
    try {
      class RepositoryService extends SupabaseService {
        async listRecords<T extends keyof Database["public"]["Tables"]>(
          table: T,
          listOptions: {
            limit?: number;
            offset?: number;
            orderBy?: {
              column: keyof Database["public"]["Tables"][T]["Row"];
              ascending?: boolean;
            };
            filter?: Record<string, unknown>;
          },
        ) {
          return super.list(table, listOptions);
        }
      }

      const service = new RepositoryService();
      const result = await service.listRecords(this.tableName, {
        limit: options.limit,
        offset: options.offset,
        orderBy: options.orderBy
          ? {
              column: options.orderBy
                .column as keyof Database["public"]["Tables"][TTable]["Row"],
              ascending: options.orderBy.ascending ?? true,
            }
          : undefined,
        filter: options.filter,
      });

      return result as ServiceResult<TRow[]>;
    } catch (error) {
      return createErrorResult(
        ServiceError.database(
          `Failed to find many ${String(this.tableName)}: ${error instanceof Error ? error.message : "Unknown error"}`,
          "REPO_FIND_MANY_ERROR",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: TUpdate): Promise<ServiceResult<TRow>> {
    try {
      class RepositoryService extends SupabaseService {
        async updateRecord<T extends keyof Database["public"]["Tables"]>(
          table: T,
          recordId: string,
          recordData: Database["public"]["Tables"][T]["Update"],
        ) {
          return super.update(table, recordId, recordData);
        }
      }

      const service = new RepositoryService();
      const result = await service.updateRecord(this.tableName, id, data);
      return result as ServiceResult<TRow>;
    } catch (error) {
      return createErrorResult(
        ServiceError.database(
          `Failed to update ${String(this.tableName)}: ${error instanceof Error ? error.message : "Unknown error"}`,
          "REPO_UPDATE_ERROR",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      class RepositoryService extends SupabaseService {
        async deleteRecord<T extends keyof Database["public"]["Tables"]>(
          table: T,
          recordId: string,
        ) {
          return super.delete(table, recordId);
        }
      }

      const service = new RepositoryService();
      const result = await service.deleteRecord(this.tableName, id);
      return result;
    } catch (error) {
      return createErrorResult(
        ServiceError.database(
          `Failed to delete ${String(this.tableName)}: ${error instanceof Error ? error.message : "Unknown error"}`,
          "REPO_DELETE_ERROR",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Find records by a specific field (helper method)
   */
  async findByField<K extends keyof TRow>(
    field: K,
    value: TRow[K],
  ): Promise<ServiceResult<TRow[]>> {
    return this.findMany({
      filter: { [field]: value } as Record<string, unknown>,
    });
  }

  /**
   * Find one record by a specific field (helper method)
   */
  async findOneByField<K extends keyof TRow>(
    field: K,
    value: TRow[K],
  ): Promise<ServiceResult<TRow | null>> {
    const result = await this.findMany({
      filter: { [field]: value } as Record<string, unknown>,
      limit: 1,
    });

    if (!result.success) {
      return createErrorResult(
        result.error || ServiceError.unknownError("Unknown error"),
        "error",
      ) as ServiceResult<TRow | null>;
    }

    const records = result.data || [];
    return createSuccessResult(records.length > 0 ? records[0] : null);
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: string): Promise<ServiceResult<boolean>> {
    const result = await this.findById(id);

    if (!result.success) {
      return createErrorResult(
        result.error || ServiceError.unknownError("Unknown error"),
        "error",
      ) as ServiceResult<boolean>;
    }

    return createSuccessResult(result.data !== null);
  }

  /**
   * Count records with optional filters
   */
  async count(
    options: Omit<FindManyOptions<TRow>, "limit" | "offset" | "orderBy"> = {},
  ): Promise<ServiceResult<number>> {
    try {
      const result = await this.findMany(options);

      if (!result.success) {
        return createErrorResult(
          result.error || ServiceError.unknownError("Unknown error"),
          "error",
        ) as ServiceResult<number>;
      }

      return createSuccessResult((result.data || []).length);
    } catch (error) {
      return createErrorResult(
        ServiceError.database(
          `Failed to count ${String(this.tableName)}: ${error instanceof Error ? error.message : "Unknown error"}`,
          "REPO_COUNT_ERROR",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}
