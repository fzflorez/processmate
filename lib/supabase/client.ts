/**
 * Supabase Client Configuration
 * Browser-side Supabase client with public anon key
 */

import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

// Supabase configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

/**
 * Browser Supabase client instance
 * Uses public anon key for client-side operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Failed to get current user: ${error.message}`);
  }

  return user;
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Failed to get current session: ${error.message}`);
  }

  return session;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Sign in failed: ${error.message}`);
  }

  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }

  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: Record<string, unknown>) {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) {
    throw new Error(`Failed to update user metadata: ${error.message}`);
  }

  return data;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Real-time subscription helper
 */
export function subscribeToTable<T extends keyof Database["public"]["Tables"]>(
  table: T,
  event: "INSERT" | "UPDATE" | "DELETE" | "*",
  callback: (payload: unknown) => void,
) {
  return supabase
    .channel(`table-changes-${table}`)
    .on("postgres_changes", { event, schema: "public", table }, callback)
    .subscribe();
}

export default supabase;
