// Chat Feature Module
// Export all chat-related components, hooks, services, types, and schemas

export * from "./components/index";
export * from "./hooks/index";
export * from "./services/index";
export * from "./types/index";
export * from "./schemas/index";

// Main exports
export { useChat } from "./hooks/index";
export type { UseChatReturn } from "./hooks/index";
export type { AIService, OpenAIService } from "./services/index";
export { createAIService } from "./services/index";
export type { ChatRepository, SupabaseChatRepository } from "./services/index";
export { createChatRepository } from "./services/index";

// Component exports
export {
  ChatContainer,
  ChatMessage,
  ChatInput,
  TypingIndicator,
} from "./components/index";
