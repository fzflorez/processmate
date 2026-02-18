/**
 * Chat Message Types
 * Defines the structure and behavior of chat messages in the system
 */

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface MessageContent {
  text: string;
  type?: 'text' | 'markdown' | 'code';
  metadata?: Record<string, unknown>;
}

export interface AIMetadata {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  processingTime?: number;
  confidence?: number;
  sources?: string[];
  reasoning?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: MessageContent[];
  timestamp: Date;
  metadata?: AIMetadata;
  conversationId: string;
  parentId?: string;
  status: MessageStatus;
  error?: string;
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EDITED = 'edited',
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  metadata?: Record<string, unknown>;
}

export interface ExtendedChatMessage extends ChatMessage {
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  isEdited?: boolean;
  editedAt?: Date;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface MessageStreamChunk {
  id: string;
  content: string;
  isComplete: boolean;
  timestamp: Date;
}
