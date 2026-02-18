/**
 * Chat State Management Hook
 * Manages chat messages, AI interactions, and conversation state
 */

import { useState, useCallback, useRef, useEffect } from "react";

// Simple UUID generator
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

import type {
  ChatMessage,
  ChatConversation,
  MessageStreamChunk,
  ExtendedChatMessage,
} from "../types";
import { MessageRole, MessageStatus, ConversationStatus } from "../types";
import {
  validateExtendedChatMessage,
  validateMessageStreamChunk,
} from "../schemas";

// AI Service Interface (to be implemented)
interface AIService {
  sendMessage(
    message: string,
    conversationId: string,
  ): Promise<AsyncIterable<MessageStreamChunk>>;
  regenerateResponse(
    messageId: string,
    conversationId: string,
  ): Promise<AsyncIterable<MessageStreamChunk>>;
}

// Repository Interface (to be implemented)
interface ChatRepository {
  saveMessage(message: ChatMessage): Promise<void>;
  saveConversation(conversation: ChatConversation): Promise<void>;
  getConversation(conversationId: string): Promise<ChatConversation | null>;
  updateMessageStatus(messageId: string, status: MessageStatus): Promise<void>;
}

interface UseChatOptions {
  aiService: AIService;
  repository: ChatRepository;
  conversationId: string;
  userId: string;
}

interface UseChatState {
  messages: ExtendedChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  conversation: ChatConversation | null;
}

interface UseChatActions {
  sendMessage: (content: string) => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  clearError: () => void;
  resetConversation: () => void;
}

export function useChat({
  aiService,
  repository,
  conversationId,
  userId,
}: UseChatOptions): UseChatState & UseChatActions {
  // State management
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );

  // Refs for managing streaming state
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // Initialize conversation on mount
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        setIsLoading(true);
        const existingConversation =
          await repository.getConversation(conversationId);

        if (existingConversation) {
          setConversation(existingConversation);
          setMessages(existingConversation.messages as ExtendedChatMessage[]);
        } else {
          // Create new conversation
          const newConversation: ChatConversation = {
            id: conversationId,
            title: "New Chat",
            userId,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: ConversationStatus.ACTIVE,
          };

          await repository.saveConversation(newConversation);
          setConversation(newConversation);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize conversation",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeConversation();
  }, [conversationId, userId, repository]);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update message status helper
  const updateMessageStatus = useCallback(
    async (messageId: string, status: MessageStatus) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg)),
      );

      try {
        await repository.updateMessageStatus(messageId, status);
      } catch (err) {
        console.error("Failed to update message status:", err);
      }
    },
    [repository],
  );

  // Add message to state
  const addMessage = useCallback((message: ExtendedChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Update message content (for streaming)
  const updateMessageContent = useCallback(
    (messageId: string, content: string, isComplete: boolean) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const updatedContent = [...msg.content];
            if (updatedContent.length > 0) {
              updatedContent[0] = { ...updatedContent[0], text: content };
            } else {
              updatedContent.push({ text: content, type: "text" });
            }

            return {
              ...msg,
              content: updatedContent,
              status: isComplete
                ? MessageStatus.COMPLETED
                : MessageStatus.PROCESSING,
            };
          }
          return msg;
        }),
      );
    },
    [],
  );

  // Send message to AI
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending) return;

      try {
        setIsSending(true);
        clearError();

        // Create user message
        const userMessage: ExtendedChatMessage = {
          id: generateUUID(),
          role: MessageRole.USER,
          content: [{ text: content.trim(), type: "text" }],
          timestamp: new Date(),
          conversationId,
          status: MessageStatus.SENDING,
        };

        // Validate user message
        const validation = validateExtendedChatMessage(userMessage);
        if (!validation.success) {
          throw new Error(`Invalid message: ${validation.error.message}`);
        }

        // Add user message to state
        addMessage(userMessage);
        await updateMessageStatus(userMessage.id, MessageStatus.SENT);
        await repository.saveMessage(userMessage);

        // Create AI response message
        const aiMessageId = generateUUID();
        const aiMessage: ExtendedChatMessage = {
          id: aiMessageId,
          role: MessageRole.ASSISTANT,
          content: [{ text: "", type: "text" }],
          timestamp: new Date(),
          conversationId,
          status: MessageStatus.PROCESSING,
          parentId: userMessage.id,
        };

        addMessage(aiMessage);
        currentMessageIdRef.current = aiMessageId;

        // Start streaming response
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const stream = await aiService.sendMessage(content, conversationId);

        let fullResponse = "";

        for await (const chunk of stream) {
          if (abortController.signal.aborted) break;

          // Validate chunk
          const chunkValidation = validateMessageStreamChunk(chunk);
          if (!chunkValidation.success) {
            console.warn("Invalid chunk received:", chunkValidation.error);
            continue;
          }

          fullResponse += chunk.content;
          updateMessageContent(aiMessageId, fullResponse, chunk.isComplete);

          // Update AI metadata if available
          if (chunk.isComplete && aiMessage.metadata) {
            // This would be populated by the AI service
            updateMessageStatus(aiMessageId, MessageStatus.COMPLETED);
            await repository.saveMessage({
              ...aiMessage,
              content: [{ text: fullResponse, type: "text" }],
              status: MessageStatus.COMPLETED,
            });
          }
        }

        // Update conversation
        if (conversation) {
          const updatedConversation = {
            ...conversation,
            messages: [...messages, userMessage, aiMessage],
            updatedAt: new Date(),
          };
          await repository.saveConversation(updatedConversation);
          setConversation(updatedConversation);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);

        // Update current message status to failed
        if (currentMessageIdRef.current) {
          await updateMessageStatus(
            currentMessageIdRef.current,
            MessageStatus.FAILED,
          );
        }
      } finally {
        setIsSending(false);
        currentMessageIdRef.current = null;
        abortControllerRef.current = null;
      }
    },
    [
      isSending,
      conversationId,
      addMessage,
      updateMessageStatus,
      updateMessageContent,
      repository,
      aiService,
      messages,
      conversation,
      clearError,
    ],
  );

  // Regenerate AI response
  const regenerateResponse = useCallback(
    async (messageId: string) => {
      try {
        setIsSending(true);
        clearError();

        const messageToRegenerate = messages.find(
          (msg) => msg.id === messageId,
        );
        if (
          !messageToRegenerate ||
          messageToRegenerate.role !== MessageRole.ASSISTANT
        ) {
          throw new Error("Invalid message for regeneration");
        }

        // Update message status to processing
        await updateMessageStatus(messageId, MessageStatus.PROCESSING);
        updateMessageContent(messageId, "", false);

        // Start regeneration stream
        const stream = await aiService.regenerateResponse(
          messageId,
          conversationId,
        );

        let fullResponse = "";

        for await (const chunk of stream) {
          const chunkValidation = validateMessageStreamChunk(chunk);
          if (!chunkValidation.success) continue;

          fullResponse += chunk.content;
          updateMessageContent(messageId, fullResponse, chunk.isComplete);

          if (chunk.isComplete) {
            await updateMessageStatus(messageId, MessageStatus.COMPLETED);
            await repository.saveMessage({
              ...messageToRegenerate,
              content: [{ text: fullResponse, type: "text" }],
              status: MessageStatus.COMPLETED,
            });
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to regenerate response";
        setError(errorMessage);
        await updateMessageStatus(messageId, MessageStatus.FAILED);
      } finally {
        setIsSending(false);
      }
    },
    [
      messages,
      conversationId,
      updateMessageStatus,
      updateMessageContent,
      repository,
      aiService,
      clearError,
    ],
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        const messageToEdit = messages.find((msg) => msg.id === messageId);
        if (!messageToEdit) {
          throw new Error("Message not found");
        }

        const editedMessage: ExtendedChatMessage = {
          ...messageToEdit,
          content: [{ text: content.trim(), type: "text" }],
          status: MessageStatus.EDITED,
          isEdited: true,
          editedAt: new Date(),
        };

        const validation = validateExtendedChatMessage(editedMessage);
        if (!validation.success) {
          throw new Error(`Invalid message: ${validation.error.message}`);
        }

        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? editedMessage : msg)),
        );

        await repository.saveMessage(editedMessage);

        // If it's a user message, regenerate AI response
        if (messageToEdit.role === MessageRole.USER) {
          // Find and remove the next AI message
          const aiMessageIndex = messages.findIndex(
            (msg) =>
              msg.parentId === messageId && msg.role === MessageRole.ASSISTANT,
          );

          if (aiMessageIndex !== -1) {
            const aiMessage = messages[aiMessageIndex];
            await regenerateResponse(aiMessage.id);
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to edit message";
        setError(errorMessage);
      }
    },
    [messages, repository, regenerateResponse],
  );

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      // In a real implementation, you'd mark as deleted in the repository
      // await repository.deleteMessage(messageId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete message";
      setError(errorMessage);
    }
  }, []);

  // Reset conversation
  const resetConversation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setMessages([]);
    setError(null);
    setIsSending(false);
    currentMessageIdRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    messages,
    isLoading,
    isSending,
    error,
    conversation,

    // Actions
    sendMessage,
    regenerateResponse,
    editMessage,
    deleteMessage,
    clearError,
    resetConversation,
  };
}

export type UseChatReturn = ReturnType<typeof useChat>;
