/**
 * Chat Message Validation Schemas
 * Zod schemas for validating chat message data structures
 */

import { z } from "zod";

export const MessageRoleSchema = z.enum([
  "user",
  "assistant",
  "system",
] as const);

export const MessageContentSchema = z.object({
  text: z.string().min(1, "Message content cannot be empty"),
  type: z
    .enum(["text", "markdown", "code"] as const)
    .optional()
    .default("text"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AIMetadataSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  promptTokens: z.number().nonnegative().optional(),
  completionTokens: z.number().nonnegative().optional(),
  totalTokens: z.number().nonnegative().optional(),
  processingTime: z.number().nonnegative().optional(),
  confidence: z.number().min(0).max(1).optional(),
  sources: z.array(z.string()).optional(),
  reasoning: z.string().optional(),
});

export const MessageStatusSchema = z.enum([
  "sending",
  "sent",
  "processing",
  "completed",
  "failed",
  "edited",
] as const);

export const ChatMessageSchema = z.object({
  id: z
    .string()
    .uuid()
    .optional()
    .default(() => crypto.randomUUID()),
  role: MessageRoleSchema,
  content: z.array(MessageContentSchema).default([]),
  timestamp: z.coerce.date().default(() => new Date()),
  metadata: AIMetadataSchema.optional(),
  conversationId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  status: MessageStatusSchema.default("completed"),
  error: z.string().optional(),
});

export const MessageAttachmentSchema = z.object({
  id: z.string().uuid("Invalid attachment ID format"),
  name: z.string().min(1, "Attachment name is required"),
  type: z.string().min(1, "Attachment type is required"),
  size: z.number().nonnegative(),
  url: z.string().url("Invalid attachment URL"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const MessageReactionSchema = z.object({
  id: z.string().uuid("Invalid reaction ID format"),
  emoji: z.string().min(1, "Emoji is required"),
  userId: z.string().uuid("Invalid user ID format"),
  timestamp: z.coerce.date(),
});

export const ExtendedChatMessageSchema = ChatMessageSchema.extend({
  attachments: z.array(MessageAttachmentSchema).optional(),
  reactions: z.array(MessageReactionSchema).optional(),
  isEdited: z.boolean().optional(),
  editedAt: z.coerce.date().optional(),
});

export const MessageStreamChunkSchema = z.object({
  id: z.string().uuid("Invalid stream chunk ID format"),
  content: z.string(),
  isComplete: z.boolean(),
  timestamp: z.coerce.date(),
});

// Validation functions
export const validateChatMessage = (data: unknown) => {
  return ChatMessageSchema.safeParse(data);
};

export const validateExtendedChatMessage = (data: unknown) => {
  return ExtendedChatMessageSchema.safeParse(data);
};

export const validateMessageStreamChunk = (data: unknown) => {
  return MessageStreamChunkSchema.safeParse(data);
};

// Type exports for inference
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type ExtendedChatMessageInput = z.infer<
  typeof ExtendedChatMessageSchema
>;
export type MessageStreamChunkInput = z.infer<typeof MessageStreamChunkSchema>;
