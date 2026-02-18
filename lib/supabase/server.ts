/**
 * Supabase Server Configuration
 * Server-side Supabase client with service role key for Next.js server components
 */

import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import type { Database, UserInsert, UserUpdate } from "./types";

// Supabase configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );
}

/**
 * Create a cached Supabase client for server-side operations
 * Uses service role key for elevated privileges
 */
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL and service key are required");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cached Supabase client instance for server components
 * Uses React cache to avoid creating multiple instances
 */
export const supabaseServer = cache(createSupabaseClient);

/**
 * Get current user from server-side
 * Bypasses RLS for admin operations
 */
export async function getServerUser() {
  const supabase = supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Failed to get server user: ${error.message}`);
  }

  return user;
}

/**
 * Get current session from server-side
 */
export async function getServerSession() {
  const supabase = supabaseServer();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to get server session: ${error.message}`);
  }

  return session;
}

/**
 * Admin operations that bypass RLS
 * Use with caution and only for trusted server operations
 */
export class SupabaseAdmin {
  private client = supabaseServer();

  /**
   * Get user by ID (bypasses RLS)
   */
  async getUserById(userId: string) {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  /**
   * Create user with admin privileges
   */
  async createUser(userData: UserInsert) {
    const { data, error } = await this.client
      .from("users")
      .insert(userData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user with admin privileges
   */
  async updateUser(userId: string, userData: UserUpdate) {
    // Create a client without strict typing to avoid the type inference issue
    const client = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await client
      .from("users")
      .update(userData)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete user with admin privileges
   */
  async deleteUser(userId: string) {
    const { error } = await this.client.from("users").delete().eq("id", userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Get all workflows (admin view)
   */
  async getAllWorkflows() {
    const { data, error } = await this.client
      .from("workflows")
      .select("*, users(name, email)");

    if (error) {
      throw new Error(`Failed to get workflows: ${error.message}`);
    }

    return data;
  }

  /**
   * Get workflow execution statistics
   */
  async getWorkflowStats() {
    const { data, error } = await this.client.rpc("get_workflow_stats");

    if (error) {
      throw new Error(`Failed to get workflow stats: ${error.message}`);
    }

    return data;
  }

  /**
   * Clean up old workflow executions
   */
  async cleanupOldExecutions(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { error } = await this.client
      .from("workflow_executions")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      throw new Error(`Failed to cleanup old executions: ${error.message}`);
    }
  }

  /**
   * Get user activity for analytics
   */
  async getUserActivity(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from("workflow_executions")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get user activity: ${error.message}`);
    }

    return data;
  }
}

/**
 * Export admin instance
 */
export const supabaseAdmin = new SupabaseAdmin();

/**
 * Helper for creating server-side Supabase clients with custom options
 */
export function createServerSupabaseClient(options?: {
  auth?: {
    autoRefreshToken?: boolean;
    persistSession?: boolean;
  };
}) {
  return createClient<Database>(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      ...options?.auth,
    },
  });
}
