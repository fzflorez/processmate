// Chat Feature Module
// Export all chat-related components, hooks, services, types, and schemas

export * from "./components";
export * from "./hooks";
export * from "./services";
export * from "./types";
export * from "./schemas";

// Main exports
export { useChat } from "./hooks";
export type { UseChatReturn } from "./hooks";
export { AIService, OpenAIService, createAIService } from "./services";
export {
  ChatRepository,
  SupabaseChatRepository,
  createChatRepository,
} from "./services";

// Component exports
export {
  ChatContainer,
  ChatMessage,
  ChatInput,
  TypingIndicator,
} from "./components";
