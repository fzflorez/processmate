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
import { validateProcessMateResponse } from "@/features/chat/schemas/chat-response.schema";

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
    const {
      message,
      conversationId,
      model = "gpt-4o-mini",
      temperature = 0.7,
      maxTokens = 1000,
    } = body;

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
          content: `
You are ProcessMate AI.

Your job is to convert user messages into structured actionable outputs.

You must ALWAYS return a valid JSON object.
Never return plain text.
Never add explanations outside JSON.
Never use markdown.

Detect the user intention and classify it into one of the following:

- "document"
- "process"
- "reminder"
- "general"

Return JSON with this exact structure:

{
  "intent": "document | process | reminder | general",
  "title": "short descriptive title",
  "summary": "short explanation of what was understood",
  "content": {},
  "confidence": 0.0
}

Rules for content depending on intent:

If intent = "document":
content must be:
{
  "documentType": "formal letter | email | request | other",
  "sections": [
    { "heading": "string", "body": "string" }
  ]
}

If intent = "process":
content must be:
{
  "steps": [
    { "step": 1, "description": "string", "status": "pending" }
  ],
  "estimatedDuration": "string"
}

If intent = "reminder":
content must be:
{
  "eventTitle": "string",
  "date": "YYYY-MM-DD or null",
  "notes": "string"
}

If intent = "general":
content must be:
{
  "response": "normal helpful answer"
}

confidence must be between 0 and 1.

Return only valid JSON.
`,
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
          let accumulatedContent = "";

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || "";

            if (content) {
              accumulatedContent += content;
            }
          }

          // Try to parse and validate complete JSON response
          try {
            const jsonResponse = JSON.parse(accumulatedContent);
            const validation = validateProcessMateResponse(jsonResponse);

            if (validation.success) {
              // Send validated structured JSON as a single chunk
              const streamChunk: StreamChunk = {
                content: JSON.stringify(validation.data),
                isComplete: true,
              };

              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify(streamChunk)}\n\n`,
                ),
              );
            } else {
              // If validation fails, send error response
              const errorChunk: StreamChunk = {
                content: JSON.stringify({
                  intent: "general",
                  title: "Validation Error",
                  summary: "AI response validation failed",
                  content: { response: accumulatedContent },
                  confidence: 0.1,
                }),
                isComplete: true,
              };

              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify(errorChunk)}\n\n`,
                ),
              );
            }
          } catch (_parseError) {
            // If JSON parsing fails, send as plain text
            const fallbackChunk: StreamChunk = {
              content: JSON.stringify({
                intent: "general",
                title: "Response",
                summary: "AI response",
                content: { response: accumulatedContent },
                confidence: 0.5,
              }),
              isComplete: true,
            };

            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify(fallbackChunk)}\n\n`,
              ),
            );
          }

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
