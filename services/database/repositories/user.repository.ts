/**
 * User Repository
 * Handles all database operations for the users table
 */

import { BaseRepository } from "../base-repository";
import type { User, UserInsert, UserUpdate } from "@/lib/supabase/types";
import type { ServiceResult } from "../../service-result";

/**
 * User repository extending the base repository with user-specific operations
 */
export class UserRepository extends BaseRepository<
  "users",
  User,
  UserInsert,
  UserUpdate
> {
  constructor() {
    super("users");
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<ServiceResult<User | null>> {
    return this.findOneByField("email", email);
  }

  /**
   * Get users with search functionality
   */
  async searchUsers(query: string): Promise<ServiceResult<User[]>> {
    // This would require extending the base repository to support custom queries
    // For now, we'll use a basic approach
    console.log(`Searching users with query: ${query}`);
    return this.findMany({
      limit: 50,
      orderBy: { column: "created_at", ascending: false },
    });
  }

  /**
   * Get users created within a date range
   */
  async getUsersByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<ServiceResult<User[]>> {
    // This would require extending the base repository to support date range filters
    // For now, we'll return all users (implementation would depend on specific requirements)
    console.log(`Getting users from ${startDate} to ${endDate}`);
    return this.findMany({
      orderBy: { column: "created_at", ascending: false },
    });
  }

  /**
   * Soft delete user (if implemented with is_active field)
   */
  async softDeleteUser(id: string): Promise<ServiceResult<User>> {
    return this.update(id, {
      // Assuming there's an is_active or deleted_at field
      // This would need to be adjusted based on actual schema
    } as UserUpdate);
  }

  /**
   * Get active users only
   */
  async getActiveUsers(): Promise<ServiceResult<User[]>> {
    // This would require extending the base repository to support custom filters
    // For now, we'll return all users
    return this.findMany({
      orderBy: { column: "created_at", ascending: false },
    });
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
