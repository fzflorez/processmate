/**
 * Supabase Database Types
 * Auto-generated placeholder types for database schema
 */

// Placeholder database types - these should be generated using Supabase CLI
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Users table
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["users"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Omit<
            Database["public"]["Tables"]["users"]["Row"],
            "id" | "created_at" | "updated_at"
          >
        >;
      };

      // Profiles table
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Omit<
            Database["public"]["Tables"]["profiles"]["Row"],
            "id" | "created_at" | "updated_at"
          >
        >;
      };

      // Workflows table
      workflows: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          definition: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["workflows"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Omit<
            Database["public"]["Tables"]["workflows"]["Row"],
            "id" | "created_at" | "updated_at"
          >
        >;
      };

      // Workflow executions table
      workflow_executions: {
        Row: {
          id: string;
          workflow_id: string;
          user_id: string;
          status: "pending" | "running" | "completed" | "failed" | "cancelled";
          inputs: Json;
          outputs: Json;
          started_at: string;
          completed_at: string | null;
          error_message: string | null;
          duration_ms: number | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["workflow_executions"]["Row"],
          "id" | "started_at" | "completed_at"
        >;
        Update: Partial<
          Omit<
            Database["public"]["Tables"]["workflow_executions"]["Row"],
            "id" | "started_at" | "completed_at"
          >
        >;
      };

      // Prompts table
      prompts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          template: string;
          variables: Json;
          category: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["prompts"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Omit<
            Database["public"]["Tables"]["prompts"]["Row"],
            "id" | "created_at" | "updated_at"
          >
        >;
      };

      // API keys table
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          provider: "openai" | "anthropic" | "local";
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["api_keys"]["Row"],
          "id" | "created_at" | "last_used_at"
        >;
        Update: Partial<
          Omit<
            Database["public"]["Tables"]["api_keys"]["Row"],
            "id" | "created_at" | "last_used_at"
          >
        >;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      workflow_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled";
      api_provider: "openai" | "anthropic" | "local";
      prompt_category:
        | "chat"
        | "processing"
        | "generation"
        | "analysis"
        | "validation"
        | "transformation";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Common table types for easier usage
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
export type WorkflowInsert =
  Database["public"]["Tables"]["workflows"]["Insert"];
export type WorkflowUpdate =
  Database["public"]["Tables"]["workflows"]["Update"];

export type WorkflowExecution =
  Database["public"]["Tables"]["workflow_executions"]["Row"];
export type WorkflowExecutionInsert =
  Database["public"]["Tables"]["workflow_executions"]["Insert"];
export type WorkflowExecutionUpdate =
  Database["public"]["Tables"]["workflow_executions"]["Update"];

export type Prompt = Database["public"]["Tables"]["prompts"]["Row"];
export type PromptInsert = Database["public"]["Tables"]["prompts"]["Insert"];
export type PromptUpdate = Database["public"]["Tables"]["prompts"]["Update"];

export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type ApiKeyInsert = Database["public"]["Tables"]["api_keys"]["Insert"];
export type ApiKeyUpdate = Database["public"]["Tables"]["api_keys"]["Update"];

// Utility types for common operations
export type TableName = keyof Database["public"]["Tables"];
export type TableInsert<T extends TableName> =
  Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> =
  Database["public"]["Tables"][T]["Update"];
export type TableRow<T extends TableName> =
  Database["public"]["Tables"][T]["Row"];

// Real-time subscription payload types
export type RealtimePayload<T extends TableName> = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: T;
  schema: "public";
  commit_timestamp: string;
  errors: unknown[] | null;
  old: TableRow<T> | null;
  new: TableRow<T> | null;
};
