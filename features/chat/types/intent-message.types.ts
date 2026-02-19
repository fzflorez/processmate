/**
 * Intent-based Message Types
 * Types for structured AI responses with different intents
 */

export type MessageIntent = "document" | "process" | "reminder" | "general";

export interface ProcessStep {
  step: number;
  description: string;
  status: "pending" | "in_progress" | "completed";
}

export interface DocumentSection {
  heading: string;
  body: string;
}

export interface ReminderData {
  eventTitle: string;
  date: string | null;
  notes: string;
}

export interface ProcessData {
  steps: ProcessStep[];
  estimatedDuration: string;
}

export interface DocumentData {
  documentType: "formal letter" | "email" | "request" | "other";
  sections: DocumentSection[];
}

export interface GeneralData {
  response: string;
}

export interface IntentMessageContent {
  intent: MessageIntent;
  title: string;
  summary: string;
  content: ProcessData | DocumentData | ReminderData | GeneralData;
  confidence: number;
}

// Type guard functions
export const isProcessContent = (content: unknown): content is ProcessData => {
  return Boolean(
    content &&
    typeof content === "object" &&
    "steps" in content &&
    Array.isArray((content as ProcessData).steps),
  );
};

export const isDocumentContent = (
  content: unknown,
): content is DocumentData => {
  return Boolean(
    content &&
    typeof content === "object" &&
    "sections" in content &&
    Array.isArray((content as DocumentData).sections),
  );
};

export const isReminderContent = (
  content: unknown,
): content is ReminderData => {
  return Boolean(
    content &&
    typeof content === "object" &&
    "eventTitle" in content &&
    "date" in content &&
    "notes" in content,
  );
};

export const isGeneralContent = (content: unknown): content is GeneralData => {
  return Boolean(
    content && typeof content === "object" && "response" in content,
  );
};

// Helper function to check if message has intent-based content
export const isIntentMessage = (
  message: unknown,
): message is { intentContent: IntentMessageContent } => {
  return Boolean(
    message && typeof message === "object" && "intentContent" in message,
  );
};
