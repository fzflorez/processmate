/**
 * Chat Conversation Types
 * Defines the structure and behavior of chat conversations
 */

import { ChatMessage } from "./chat-message.types";

export interface ChatConversation {
  id: string;
  title: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  status: ConversationStatus;
  metadata?: ConversationMetadata;
  settings?: ConversationSettings;
}

export enum ConversationStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  DELETED = "deleted",
  LOCKED = "locked",
}

export interface ConversationMetadata {
  totalMessages: number;
  totalTokens: number;
  lastMessageAt?: Date;
  tags?: string[];
  category?: string;
  priority?: ConversationPriority;
  source?: "web" | "mobile" | "api";
}

export enum ConversationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export interface ConversationSettings {
  aiModel?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  enableMemory?: boolean;
  enableTools?: boolean;
  autoSave?: boolean;
  notifications?: NotificationSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  email?: boolean;
  push?: boolean;
  frequency?: "immediate" | "hourly" | "daily" | "weekly";
}

export interface ConversationSummary {
  id: string;
  conversationId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  generatedAt: Date;
  model: string;
}

export interface ConversationTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  settings: ConversationSettings;
  category: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationFilter {
  status?: ConversationStatus[];
  priority?: ConversationPriority[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  totalTokensUsed: number;
  averageResponseTime: number;
}
