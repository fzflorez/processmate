/**
 * OpenAI AI Service
 * Handles streaming chat responses using the API route
 */

import type { AIService } from "./ai-service.interface";
import type { MessageStreamChunk } from "../types";

export class OpenAIAIService implements AIService {
  private model: string = "gpt-4o-mini";
  private temperature: number = 0.7;
  private maxTokens: number = 1000;

  async sendMessage(
    message: string,
    conversationId: string,
  ): Promise<AsyncIterable<MessageStreamChunk>> {
    return this.streamResponse(message, conversationId);
  }

  async regenerateResponse(
    messageId: string,
    conversationId: string,
  ): Promise<AsyncIterable<MessageStreamChunk>> {
    return this.streamResponse(
      "Please regenerate your previous response.",
      conversationId,
    );
  }

  async cancelRequest(_conversationId: string): Promise<void> {
    // Implementation would cancel ongoing requests
    // For now, this is a no-op as we're using fetch API
  }

  async getAvailableModels(): Promise<string[]> {
    return ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];
  }

  setModel(model: string): void {
    this.model = model;
  }

  getModelConfig(): {
    model: string;
    temperature: number;
    maxTokens: number;
  } {
    return {
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };
  }

  private async streamResponse(
    message: string,
    conversationId: string,
  ): Promise<AsyncIterable<MessageStreamChunk>> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        conversationId,
        model: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return (async function* () {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);

              if (jsonStr.trim()) {
                try {
                  const chunk = JSON.parse(jsonStr);

                  yield {
                    id: crypto.randomUUID(),
                    content: chunk.content,
                    isComplete: chunk.isComplete,
                    timestamp: new Date(),
                  };

                  if (chunk.isComplete) {
                    return;
                  }
                } catch (parseError) {
                  console.error("Failed to parse chunk:", jsonStr, parseError);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Stream reading error:", error);
        throw error;
      } finally {
        reader.releaseLock();
      }
    })();
  }
}
