/**
 * Chat Page
 * Main chat interface page with layout and chat container integration
 */

"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatContainer } from "@/features/chat";
import type {
  ExtendedChatMessage,
  ChatConversation,
} from "@/features/chat/types";
import { MessageStatus } from "@/features/chat/types";
import { OpenAIAIService } from "@/features/chat/services/openai-ai.service";

// Simple UUID generator for conversation IDs
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock Chat Repository implementation (replace with actual implementation)
class MockChatRepository {
  private conversations: Map<string, ChatConversation> = new Map();
  private messages: Map<string, ExtendedChatMessage[]> = new Map();

  async saveMessage(message: ExtendedChatMessage): Promise<void> {
    const conversationMessages =
      this.messages.get(message.conversationId) || [];
    const existingIndex = conversationMessages.findIndex(
      (msg) => msg.id === message.id,
    );

    if (existingIndex >= 0) {
      conversationMessages[existingIndex] = message;
    } else {
      conversationMessages.push(message);
    }

    this.messages.set(message.conversationId, conversationMessages);
  }

  async getMessage(messageId: string): Promise<ExtendedChatMessage | null> {
    for (const messages of this.messages.values()) {
      const message = messages.find((msg) => msg.id === messageId);
      if (message) return message;
    }
    return null;
  }

  async getMessages(
    conversationId: string,
    limit?: number,
    offset?: number,
  ): Promise<ExtendedChatMessage[]> {
    const messages = this.messages.get(conversationId) || [];
    let result = messages;

    if (offset) {
      result = result.slice(offset);
    }

    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }

  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
  ): Promise<void> {
    // Find and update message across all conversations
    for (const [conversationId, messages] of this.messages.entries()) {
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex >= 0) {
        messages[messageIndex] = { ...messages[messageIndex], status };
        this.messages.set(conversationId, messages);
        break;
      }
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    for (const [conversationId, messages] of this.messages.entries()) {
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex >= 0) {
        messages.splice(messageIndex, 1);
        this.messages.set(conversationId, messages);
        break;
      }
    }
  }

  async saveConversation(conversation: ChatConversation): Promise<void> {
    this.conversations.set(conversation.id, conversation);
  }

  async getConversation(
    conversationId: string,
  ): Promise<ChatConversation | null> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const messages = this.messages.get(conversationId) || [];
    return {
      ...conversation,
      messages,
    };
  }

  async getConversations(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<ChatConversation[]> {
    const conversations = Array.from(this.conversations.values())
      .filter((conv) => conv.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    let result = conversations;

    if (offset) {
      result = result.slice(offset);
    }

    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }

  async updateConversation(
    conversationId: string,
    updates: Partial<ChatConversation>,
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      this.conversations.set(conversationId, {
        ...conversation,
        ...updates,
        updatedAt: new Date(),
      });
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    this.conversations.delete(conversationId);
    this.messages.delete(conversationId);
  }

  async searchConversations(
    userId: string,
    _query: string,
    _filters?: {
      status?: string[];
      dateRange?: { start: Date; end: Date };
      tags?: string[];
    },
  ): Promise<ChatConversation[]> {
    return this.getConversations(userId);
  }

  async searchMessages(
    conversationId: string,
    query: string,
  ): Promise<ExtendedChatMessage[]> {
    const messages = this.messages.get(conversationId) || [];
    return messages.filter((msg) =>
      msg.content.some((content) =>
        content.text.toLowerCase().includes(query.toLowerCase()),
      ),
    );
  }

  async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalTokens: number;
    averageResponseTime: number;
  }> {
    const conversations = await this.getConversations(userId);
    let totalMessages = 0;

    for (const conversation of conversations) {
      const messages = this.messages.get(conversation.id) || [];
      totalMessages += messages.length;
    }

    return {
      totalConversations: conversations.length,
      totalMessages,
      totalTokens: 0,
      averageResponseTime: 0,
    };
  }
}

export default function ChatPage() {
  const params = useParams();
  const [isClient, setIsClient] = useState(false);

  // Get conversation ID from URL params or generate a new one
  const conversationId = (params?.id as string) || generateUUID();
  const userId = "demo-user"; // In a real app, get from auth context

  // Initialize services
  const [aiService] = useState(() => new OpenAIAIService());
  const [repository] = useState(() => new MockChatRepository());

  // Set client state after mount to prevent hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                ProcessMate Chat
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Conversation: {conversationId.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <ChatContainer
                conversationId={conversationId}
                userId={userId}
                aiService={aiService}
                repository={repository}
                className="shadow-lg"
                maxHeight="calc(100vh - 200px)"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            ProcessMate Chat - Powered by AI
          </div>
        </div>
      </footer>
    </div>
  );
}
