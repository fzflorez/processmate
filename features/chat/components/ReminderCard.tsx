/**
 * Reminder Card Component
 * Displays reminder intent messages with event details
 */
import { Calendar, Clock, StickyNote } from "lucide-react";
import type { ReminderData } from "../types";

interface ReminderCardProps {
  title: string;
  summary: string;
  content: ReminderData;
  confidence: number;
  className?: string;
}

export function ReminderCard({
  title,
  summary,
  content,
  confidence,
  className = "",
}: ReminderCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date set";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>

      {/* Summary */}
      <p className="text-gray-600 mb-6">{summary}</p>

      {/* Event Details */}
      <div className="space-y-4">
        {/* Event Title */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Event</span>
          </div>
          <p className="text-purple-800 font-medium">{content.eventTitle}</p>
        </div>

        {/* Date and Time */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Date & Time
            </span>
          </div>
          <div className="text-gray-800">
            <p className="font-medium">{formatDate(content.date)}</p>
            {content.date && formatTime(content.date) && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(content.date)}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {content.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Notes</span>
            </div>
            <p className="text-blue-800 whitespace-pre-wrap">{content.notes}</p>
          </div>
        )}
      </div>

      {/* Confidence indicator */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>AI Confidence</span>
          <span>{Math.round(confidence * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
