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

// Simple UUID generator for conversation IDs
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock AI Service implementation (replace with actual implementation)
class MockAIService {
  async sendMessage(message: string, conversationId: string) {
    // Simulate streaming response
    const response = `This is a mock response to: "${message}" (Conversation: ${conversationId.slice(0, 8)}...). In a real implementation, this would be connected to an AI service like OpenAI.`;

    return (async function* () {
      const words = response.split(" ");
      for (const word of words) {
        yield {
          content: word + " ",
          isComplete: false,
          metadata: null,
        };
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      yield {
        content: "",
        isComplete: true,
        metadata: null,
      };
    })();
  }

  async regenerateResponse(messageId: string, conversationId: string) {
    return this.sendMessage("Regenerating response...", conversationId);
  }
}

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
}

export default function ChatPage() {
  const params = useParams();
  const [isClient, setIsClient] = useState(false);

  // Get conversation ID from URL params or generate a new one
  const conversationId = (params?.id as string) || generateUUID();
  const userId = "demo-user"; // In a real app, get from auth context

  // Initialize services
  const [aiService] = useState(() => new MockAIService());
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
