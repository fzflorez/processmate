/**
 * Reminder Detection Hook
 * Analyzes chat messages to detect dates, tasks, and reminders
 */

import { useState, useCallback, useEffect } from "react";
import type { ChatMessage } from "../../chat/types";
import { MessageRole } from "../../chat/types";
import {
  ProcessStep,
  ProcessStepPriority,
  ProcessStepType,
  ProcessStepStatus,
} from "../../process-builder/types";

// Simple UUID generator
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Date and time patterns for detection
const DATE_PATTERNS = [
  /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/gi, // MM/DD/YYYY, MM-DD-YYYY, MM/DD/YY
  /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/gi, // MM/DD/YY
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\d{1,2}\b/gi, // January 15, Feb 23
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\w*\d{1,2}\b/gi, // January 15th
  /\b(mon|tue|wed|thu|fri|sat|sun)\w*\d{1,2}\b/gi, // Monday 15th
  /(\d{1,2})\/(\d{1,2})\/(\d{4})\b/gi, // 12/25/2024
  /(\d{4})-(\d{2})-(\d{2})\b/gi, // 2024-12-25
];

// Task and reminder keywords
const TASK_KEYWORDS = [
  "task",
  "todo",
  "assign",
  "complete",
  "finish",
  "deadline",
  "due",
  "deliverable",
  "milestone",
  "goal",
  "objective",
  "action",
  "follow-up",
  "check",
  "review",
  "appointment",
  "meeting",
  "schedule",
  "calendar",
  "reminder",
  "notify",
  "alert",
];

const REMINDER_KEYWORDS = [
  "remind",
  "reminder",
  "don't forget",
  "remember",
  "alert",
  "notify",
  "wake up",
  "call",
  "check in",
  "follow up",
  "deadline approaching",
  "due soon",
  "meeting reminder",
  "appointment reminder",
];

// Priority keywords
const PRIORITY_KEYWORDS = {
  high: [
    "urgent",
    "asap",
    "critical",
    "important",
    "high priority",
    "emergency",
  ],
  medium: ["medium priority", "normal", "standard"],
  low: ["low priority", "when possible", "low", "nice to have"],
};

interface DetectedReminder {
  id: string;
  type: "date" | "task" | "reminder" | "deadline" | "appointment" | "milestone";
  title: string;
  description: string;
  date: Date;
  priority: ProcessStepPriority;
  confidence: number; // 0-100
  sourceMessage: string;
  sourceMessageId: string;
  metadata: {
    extractedDate?: Date;
    keywords?: string[];
    context?: string;
    [key: string]: unknown;
  };
}

interface ReminderDetectionState {
  isAnalyzing: boolean;
  detectedReminders: DetectedReminder[];
  error: string | null;
  lastAnalyzedMessageId: string | null;
}

interface UseReminderDetectionOptions {
  onReminderDetected?: (reminder: DetectedReminder) => void;
  onTaskDetected?: (reminder: DetectedReminder) => void;
  onDeadlineDetected?: (reminder: DetectedReminder) => void;
  autoCreateProcess?: boolean;
  workflowEngine?: unknown;
}

export function useReminderDetection({
  onReminderDetected,
  onTaskDetected,
  onDeadlineDetected,
  autoCreateProcess = false,
  workflowEngine,
}: UseReminderDetectionOptions) {
  const [state, setState] = useState<ReminderDetectionState>({
    isAnalyzing: false,
    detectedReminders: [],
    error: null,
    lastAnalyzedMessageId: null,
  });

  // Extract dates from text
  const extractDates = (
    text: string,
  ): Array<{ date: Date; text: string; confidence: number }> => {
    const matches = [];
    let match;

    while ((match = DATE_PATTERNS[0].exec(text)) !== null) {
      const date = new Date(match[0]);
      const isValidDate = !isNaN(date.getTime());

      if (isValidDate) {
        matches.push({
          date,
          text: match[0],
          confidence: 85,
        });
      }

      // Move past this match
      text = text.substring(match.index + match[0].length);
    }

    return matches;
  };

  // Extract tasks and reminders
  const extractTasksAndReminders = (
    text: string,
  ): Array<{
    type: "task" | "reminder";
    text: string;
    priority: ProcessStepPriority;
    confidence: number;
  }> => {
    const items: Array<{
      type: "task" | "reminder";
      text: string;
      priority: ProcessStepPriority;
      confidence: number;
    }> = [];
    const words = text.toLowerCase().split(/\s+/);

    for (const word of words) {
      let priority: ProcessStepPriority = ProcessStepPriority.MEDIUM;
      let confidence = 50;

      // Check priority keywords
      for (const [level, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
        if (keywords.some((keyword: string) => word.includes(keyword))) {
          priority = level as ProcessStepPriority;
          confidence += 20;
          break;
        }
      }

      // Check if it's a reminder
      const isReminder = REMINDER_KEYWORDS.some((keyword: string) =>
        word.includes(keyword),
      );
      const isTask = TASK_KEYWORDS.some((keyword: string) =>
        word.includes(keyword),
      );

      if (isReminder || isTask) {
        confidence += 30;

        items.push({
          type: isReminder ? "reminder" : "task",
          text: word,
          priority,
          confidence: Math.min(confidence, 90),
        });
      }
    }

    return items;
  };

  // Analyze a single message
  const analyzeMessage = useCallback(
    async (message: ChatMessage) => {
      if (message.role !== MessageRole.USER) return;

      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        error: null,
      }));

      try {
        const detectedReminders: DetectedReminder[] = [];
        const text = message.content.map((c) => c.text).join(" ");
        const words = text.split(/\s+/);

        // Extract dates
        const dates = extractDates(text);
        dates.forEach(({ date, text: dateText, confidence }) => {
          detectedReminders.push({
            id: generateUUID(),
            type: "date",
            title: `Date Detected: ${date.toLocaleDateString()}`,
            description: `Date mentioned: ${dateText}`,
            date,
            priority: ProcessStepPriority.MEDIUM,
            confidence,
            sourceMessage: message.content.map((c) => c.text).join(" "),
            sourceMessageId: message.id,
            metadata: {
              extractedDate: date,
              keywords: ["date", "calendar", "schedule"],
              context: "date_extraction",
            },
          });
        });

        // Extract tasks and reminders
        const tasks = extractTasksAndReminders(text);
        tasks.forEach(({ type, text: taskText, priority, confidence }) => {
          detectedReminders.push({
            id: generateUUID(),
            type,
            title: `${type === "task" ? "Task" : "Reminder"}: ${taskText}`,
            description: `${type === "task" ? "Task identified" : "Reminder detected"}: ${taskText}`,
            date: new Date(), // Current date for tasks/reminders
            priority,
            confidence,
            sourceMessage: message.content.map((c) => c.text).join(" "),
            sourceMessageId: message.id,
            metadata: {
              keywords: [type],
              context: "task_detection",
            },
          });
        });

        // Look for deadlines (tasks with time sensitivity)
        const deadlineWords = words.filter(
          (word: string) =>
            word.includes("deadline") ||
            word.includes("due") ||
            word.includes("deliverable"),
        );

        deadlineWords.forEach((word: string) => {
          const contextWords = words.slice(
            Math.max(0, words.indexOf(word) - 5),
            words.indexOf(word) + 6,
          );
          const context = contextWords.join(" ");

          detectedReminders.push({
            id: generateUUID(),
            type: "deadline",
            title: `Deadline Detected: ${word}`,
            description: `Deadline or due date detected: ${context}`,
            date: new Date(),
            priority: ProcessStepPriority.HIGH,
            confidence: 75,
            sourceMessage: message.content.map((c) => c.text).join(" "),
            sourceMessageId: message.id,
            metadata: {
              keywords: ["deadline", "due", "deliverable"],
              context: "deadline_detection",
            },
          });
        });

        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          detectedReminders,
          lastAnalyzedMessageId: message.id,
        }));

        // Trigger callbacks
        detectedReminders.forEach((reminder) => {
          if (reminder.type === "date" && onReminderDetected) {
            onReminderDetected(reminder);
          } else if (reminder.type === "reminder" && onReminderDetected) {
            onReminderDetected(reminder);
          } else if (reminder.type === "task" && onTaskDetected) {
            onTaskDetected(reminder);
          } else if (reminder.type === "deadline" && onDeadlineDetected) {
            onDeadlineDetected(reminder);
          }

          // Auto-create process step if enabled
          if (autoCreateProcess && workflowEngine) {
            try {
              const processStep: ProcessStep = {
                id: generateUUID(),
                name: reminder.title,
                description: reminder.description,
                type:
                  reminder.type === "task"
                    ? ProcessStepType.TASK
                    : reminder.type === "reminder"
                      ? ProcessStepType.NOTIFICATION
                      : ProcessStepType.VALIDATION,
                status: ProcessStepStatus.PENDING,
                priority: reminder.priority,
                dependencies: [],
                inputs: [
                  {
                    id: "reminder_input",
                    name: "Reminder Details",
                    type: "text",
                    required: true,
                    description: "Details from chat analysis",
                  },
                ],
                outputs: [
                  {
                    id: "reminder_output",
                    name: "Processed Reminder",
                    type: "object",
                    description: "Processed reminder information",
                  },
                ],
                metadata: {
                  category: "automation",
                  tags: ["reminder", "chat", "auto-generated"],
                  color: "#3B82F6",
                  icon: "bell",
                  source: "chat_analysis",
                  confidence: reminder.confidence,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Add to workflow engine (implementation would depend on specific engine)
              console.log(
                "Auto-creating process step from reminder:",
                processStep,
              );
            } catch (error) {
              console.error("Failed to auto-create process step:", error);
            }
          }
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to analyze message",
        }));
      }
    },
    [
      onReminderDetected,
      onTaskDetected,
      onDeadlineDetected,
      autoCreateProcess,
      workflowEngine,
    ],
  );

  // Clear reminders
  const clearReminders = useCallback(() => {
    setState((prev) => ({
      ...prev,
      detectedReminders: [],
      error: null,
      lastAnalyzedMessageId: null,
    }));
  }, []);

  // Dismiss specific reminder
  const dismissReminder = useCallback((reminderId: string) => {
    setState((prev) => ({
      ...prev,
      detectedReminders: prev.detectedReminders.filter(
        (r) => r.id !== reminderId,
      ),
    }));
  }, []);

  // Set error
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  // Auto-analyze new messages
  useEffect(() => {
    // This would integrate with chat system to automatically analyze new messages
    // Implementation depends on chat system architecture
  }, []);

  return {
    // State
    state,

    // Actions
    actions: {
      analyzeMessage,
      clearReminders,
      dismissReminder,
      setError,
    },
  };
}

export type UseReminderDetectionReturn = ReturnType<
  typeof useReminderDetection
>;
