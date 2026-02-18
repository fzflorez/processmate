/**
 * Chat Repository Interface
 * Defines the contract for chat data persistence operations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatMessage,
  ChatConversation,
  MessageStatus,
  MessageRole,
  MessageContent,
  AIMetadata,
  ConversationStatus,
  ConversationMetadata,
  ConversationSettings,
} from "../types";
import type { Database } from "../../../lib/supabase/types";

export interface ChatRepository {
  // Message operations
  /**
   * Save a message to the repository
   * @param message - The message to save
   */
  saveMessage(message: ChatMessage): Promise<void>;

  /**
   * Get a message by ID
   * @param messageId - The message ID
   * @returns The message or null if not found
   */
  getMessage(messageId: string): Promise<ChatMessage | null>;

  /**
   * Get messages for a conversation
   * @param conversationId - The conversation ID
   * @param limit - Optional limit for number of messages
   * @param offset - Optional offset for pagination
   * @returns Array of messages
   */
  getMessages(
    conversationId: string,
    limit?: number,
    offset?: number,
  ): Promise<ChatMessage[]>;

  /**
   * Update message status
   * @param messageId - The message ID
   * @param status - The new status
   */
  updateMessageStatus(messageId: string, status: MessageStatus): Promise<void>;

  /**
   * Delete a message
   * @param messageId - The message ID
   */
  deleteMessage(messageId: string): Promise<void>;

  // Conversation operations
  /**
   * Save a conversation to the repository
   * @param conversation - The conversation to save
   */
  saveConversation(conversation: ChatConversation): Promise<void>;

  /**
   * Get a conversation by ID
   * @param conversationId - The conversation ID
   * @returns The conversation or null if not found
   */
  getConversation(conversationId: string): Promise<ChatConversation | null>;

  /**
   * Get conversations for a user
   * @param userId - The user ID
   * @param limit - Optional limit for number of conversations
   * @param offset - Optional offset for pagination
   * @returns Array of conversations
   */
  getConversations(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<ChatConversation[]>;

  /**
   * Update conversation
   * @param conversationId - The conversation ID
   * @param updates - Partial conversation updates
   */
  updateConversation(
    conversationId: string,
    updates: Partial<ChatConversation>,
  ): Promise<void>;

  /**
   * Delete a conversation
   * @param conversationId - The conversation ID
   */
  deleteConversation(conversationId: string): Promise<void>;

  // Search and filtering
  /**
   * Search conversations
   * @param userId - The user ID
   * @param query - Search query
   * @param filters - Optional filters
   * @returns Array of matching conversations
   */
  searchConversations(
    userId: string,
    query: string,
    filters?: {
      status?: string[];
      dateRange?: { start: Date; end: Date };
      tags?: string[];
    },
  ): Promise<ChatConversation[]>;

  /**
   * Search messages within a conversation
   * @param conversationId - The conversation ID
   * @param query - Search query
   * @returns Array of matching messages
   */
  searchMessages(conversationId: string, query: string): Promise<ChatMessage[]>;

  // Analytics and statistics
  /**
   * Get conversation statistics for a user
   * @param userId - The user ID
   * @returns Statistics object
   */
  getConversationStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalTokens: number;
    averageResponseTime: number;
  }>;
}

/**
 * Supabase Chat Repository Implementation
 * Concrete implementation using Supabase
 */
export class SupabaseChatRepository implements ChatRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    const { error } = await this.supabase.from("chat_messages").insert({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      metadata: message.metadata,
      conversation_id: message.conversationId,
      parent_id: message.parentId,
      status: message.status,
      error: message.error,
    });

    if (error) {
      throw new Error(`Failed to save message: ${error.message}`);
    }
  }

  async getMessage(messageId: string): Promise<ChatMessage | null> {
    const { data, error } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to get message: ${error.message}`);
    }

    return this.mapDbMessageToChatMessage(data);
  }

  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0,
  ): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("timestamp", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data.map(this.mapDbMessageToChatMessage);
  }

  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("chat_messages")
      .update({ status })
      .eq("id", messageId);

    if (error) {
      throw new Error(`Failed to update message status: ${error.message}`);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  async saveConversation(conversation: ChatConversation): Promise<void> {
    const { error } = await this.supabase.from("chat_conversations").upsert({
      id: conversation.id,
      title: conversation.title,
      user_id: conversation.userId,
      created_at: conversation.createdAt.toISOString(),
      updated_at: conversation.updatedAt.toISOString(),
      status: conversation.status,
      metadata: conversation.metadata,
      settings: conversation.settings,
    });

    if (error) {
      throw new Error(`Failed to save conversation: ${error.message}`);
    }
  }

  async getConversation(
    conversationId: string,
  ): Promise<ChatConversation | null> {
    const { data, error } = await this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return this.mapDbConversationToChatConversation(data);
  }

  async getConversations(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<ChatConversation[]> {
    const { data, error } = await this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get conversations: ${error.message}`);
    }

    return data.map(this.mapDbConversationToChatConversation);
  }

  async updateConversation(
    conversationId: string,
    updates: Partial<ChatConversation>,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("chat_conversations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`);
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  async searchConversations(
    userId: string,
    query: string,
    filters?: {
      status?: string[];
      dateRange?: { start: Date; end: Date };
      tags?: string[];
    },
  ): Promise<ChatConversation[]> {
    let dbQuery = this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", userId)
      .ilike("title", `%${query}%`);

    if (filters?.status?.length) {
      dbQuery = dbQuery.in("status", filters.status);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Failed to search conversations: ${error.message}`);
    }

    return data.map(this.mapDbConversationToChatConversation);
  }

  async searchMessages(
    conversationId: string,
    query: string,
  ): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .ilike("content->>text", `%${query}%`)
      .order("timestamp", { ascending: true });

    if (error) {
      throw new Error(`Failed to search messages: ${error.message}`);
    }

    return data.map(this.mapDbMessageToChatMessage);
  }

  async getConversationStats(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
  ): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalTokens: number;
    averageResponseTime: number;
  }> {
    // Implementation would aggregate data from conversations and messages
    return {
      totalConversations: 0,
      totalMessages: 0,
      totalTokens: 0,
      averageResponseTime: 0,
    };
  }

  // Helper methods to map database records to domain objects
  private mapDbMessageToChatMessage = (
    dbMessage: Database["public"]["Tables"]["chat_messages"]["Row"],
  ): ChatMessage => ({
    id: dbMessage.id,
    role: dbMessage.role as MessageRole,
    content: dbMessage.content as unknown as MessageContent[],
    timestamp: new Date(dbMessage.timestamp),
    metadata: dbMessage.metadata as unknown as AIMetadata,
    conversationId: dbMessage.conversation_id,
    parentId: dbMessage.parent_id || undefined,
    status: dbMessage.status as MessageStatus,
    error: dbMessage.error || undefined,
  });

  private mapDbConversationToChatConversation = (
    dbConversation: Database["public"]["Tables"]["chat_conversations"]["Row"],
  ): ChatConversation => ({
    id: dbConversation.id,
    title: dbConversation.title,
    userId: dbConversation.user_id,
    messages: [], // Would need to be loaded separately
    createdAt: new Date(dbConversation.created_at),
    updatedAt: new Date(dbConversation.updated_at),
    status: dbConversation.status as ConversationStatus,
    metadata: dbConversation.metadata as unknown as ConversationMetadata,
    settings: dbConversation.settings as unknown as ConversationSettings,
  });
}

/**
 * Factory function to create repository instances
 */
export function createChatRepository(
  type: "supabase" | "local",
  config: { supabaseClient?: SupabaseClient },
): ChatRepository {
  switch (type) {
    case "supabase":
      if (!config.supabaseClient) {
        throw new Error("SupabaseClient is required for supabase repository");
      }
      return new SupabaseChatRepository(config.supabaseClient);
    case "local":
      // return new LocalChatRepository(config.storage);
      throw new Error("Local repository not implemented yet");
    default:
      throw new Error(`Unsupported repository type: ${type}`);
  }
}
