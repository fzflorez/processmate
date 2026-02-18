/**
 * Typing Indicator Component
 * Shows when AI is processing or typing a response
 */

import React from "react";
import { Bot } from "lucide-react";

interface TypingIndicatorProps {
  message?: string;
  className?: string;
  variant?: "dots" | "pulse" | "wave";
}

export function TypingIndicator({
  message = "AI is thinking...",
  className = "",
  variant = "dots",
}: TypingIndicatorProps) {
  const renderDots = () => (
    <div className="flex gap-1">
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
    </div>
  );

  const renderPulse = () => (
    <div className="flex gap-1">
      <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400"></div>
      <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 [animation-delay:0.2s]"></div>
      <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 [animation-delay:0.4s]"></div>
    </div>
  );

  const renderWave = () => (
    <div className="flex gap-1 items-end">
      <div className="h-3 w-1.5 animate-pulse rounded-full bg-gray-400"></div>
      <div className="h-4 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:0.1s]"></div>
      <div className="h-2 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:0.2s]"></div>
      <div className="h-3 w-1.5 animate-pulse rounded-full bg-gray-400 [animation-delay:0.3s]"></div>
    </div>
  );

  const renderIndicator = () => {
    switch (variant) {
      case "pulse":
        return renderPulse();
      case "wave":
        return renderWave();
      default:
        return renderDots();
    }
  };

  return (
    <div className={`flex gap-3 p-4 bg-gray-50 ${className}`}>
      {/* Avatar */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shrink-0">
        <Bot size={16} />
      </div>

      {/* Typing Content */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            AI Assistant
          </span>
          <span className="text-xs text-gray-500">Typing...</span>
        </div>

        <div className="flex items-center gap-2">
          {renderIndicator()}
          <span className="text-sm text-gray-600">{message}</span>
        </div>
      </div>
    </div>
  );
}
