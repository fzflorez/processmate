/**
 * Chat API Route
 * Handles streaming chat responses using OpenAI
 *
 * ENVIRONMENT SETUP:
 * Add OPENAI_API_KEY to your .env.local file:
 * OPENAI_API_KEY=your_openai_api_key_here
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Set runtime to Node.js for OpenAI compatibility
export const runtime = "nodejs";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatRequest {
  message: string;
  conversationId: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface StreamChunk {
  content: string;
  isComplete: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationId, model = "gpt-4o-mini", temperature = 0.7, maxTokens = 1000 } = body;

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: "Missing required fields: message, conversationId" },
        { status: 400 },
      );
    }

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant. Respond in a clear and concise manner.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      stream: true,
      max_tokens: maxTokens,
      temperature,
    });

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || "";

            if (content) {
              const streamChunk: StreamChunk = {
                content,
                isComplete: false,
              };
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify(streamChunk)}\n\n`,
                ),
              );
            }
          }

          // Send final completion chunk
          const finalChunk: StreamChunk = {
            content: "",
            isComplete: true,
          };
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(finalChunk)}\n\n`),
          );

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
