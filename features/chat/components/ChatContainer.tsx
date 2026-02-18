/**
 * Chat Container Component
 * Main chat interface with message list, input, and state management
 */

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Settings, Trash2 } from "lucide-react";
import { MessageRole, MessageStatus } from "../types";
import { useChat } from "../hooks";
import type { AIService } from "../services/ai-service.interface";
import type { ChatRepository } from "../services/chat-repository.interface";

import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";

interface ChatContainerProps {
  conversationId: string;
  userId: string;
  aiService: AIService;
  repository: ChatRepository;
  className?: string;
  showHeader?: boolean;
  showSettings?: boolean;
  maxHeight?: string;
}

export function ChatContainer({
  conversationId,
  userId,
  aiService,
  repository,
  className = "",
  showHeader = true,
  showSettings = true,
  maxHeight = "600px",
}: ChatContainerProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const chat = useChat({
    conversationId,
    userId,
    aiService,
    repository,
  });

  const {
    messages,
    isLoading,
    isSending,
    error,
    conversation,
    sendMessage,
    regenerateResponse,
    editMessage,
    clearError,
    resetConversation,
  } = chat;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingMessageId(null);
        setEditContent("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleSaveEdit = async (messageId: string, content: string) => {
    try {
      await editMessage(messageId, content);
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleCopyMessage = (content: string) => {
    // Toast notification could be added here
    console.log("Message copied:", content);
  };

  const handleClearConversation = () => {
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      resetConversation();
    }
  };

  const isAITyping = messages.some(
    (msg) =>
      msg.role === MessageRole.ASSISTANT &&
      msg.status === MessageStatus.PROCESSING,
  );

  const hasMessages = messages.length > 0;

  return (
    <div
      className={`flex flex-col bg-white border rounded-lg shadow-sm ${className}`}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <div>
              <h2 className="font-semibold text-gray-900">
                {conversation?.title || "New Chat"}
              </h2>
              <p className="text-xs text-gray-500">
                {messages.length} messages
                {conversation &&
                  ` • Updated ${new Intl.DateTimeFormat("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }).format(conversation.updatedAt)}`}
              </p>
            </div>
          </div>

          {showSettings && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearConversation}
                className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Clear conversation"
              >
                <Trash2 size={16} />
              </button>
              <button
                className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Chat settings"
              >
                <Settings size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 rounded-md bg-red-50 border border-red-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-800">Error:</span>
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
              </div>
              <span>Loading conversation...</span>
            </div>
          </div>
        ) : !hasMessages ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-sm text-gray-600 text-center max-w-md">
              Ask me anything! I can help you with questions, generate content,
              assist with tasks, and much more.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isEditing={editingMessageId === message.id}
                onEdit={handleEditMessage}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onRegenerate={regenerateResponse}
                onCopy={handleCopyMessage}
              />
            ))}

            {/* Typing Indicator */}
            {isAITyping && !isSending && (
              <TypingIndicator message="AI is typing..." />
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={sendMessage}
        disabled={isLoading}
        isLoading={isSending || isAITyping}
        placeholder="Type your message..."
        showAttachments={true}
        showVoiceRecord={true}
      />
    </div>
  );
}
