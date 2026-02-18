/**
 * Chat Message Component
 * Displays individual chat messages with different styles for user vs AI messages
 */

import React, { useState, useRef, useEffect } from "react";
import { Bot, User, Edit2, Check, X, Copy, RefreshCw } from "lucide-react";

import type { ExtendedChatMessage } from "../types";
import { MessageRole, MessageStatus } from "../types";

interface ChatMessageProps {
  message: ExtendedChatMessage;
  isEditing?: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onSaveEdit?: (messageId: string, content: string) => void;
  onCancelEdit?: () => void;
  onRegenerate?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  className?: string;
}

export function ChatMessage({
  message,
  isEditing = false,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onRegenerate,
  onCopy,
  className = "",
}: ChatMessageProps) {
  const [editContent, setEditContent] = useState(
    message.content[0]?.text || "",
  );
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isUser = message.role === MessageRole.USER;
  const isAI = message.role === MessageRole.ASSISTANT;
  const isLoading = message.status === MessageStatus.PROCESSING;
  const hasError = message.status === MessageStatus.FAILED;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editContent, isEditing]);

  const handleCopy = async () => {
    const content = message.content.map((c) => c.text).join("\n");
    await navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onCopy?.(content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onSaveEdit) {
      onSaveEdit(message.id, editContent.trim());
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content[0]?.text || "");
    onCancelEdit?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <div
      className={`
        group relative flex gap-3 p-4 transition-colors duration-200
        ${isUser ? "bg-white" : "bg-gray-50"}
        ${hasError ? "bg-red-50 border-l-4 border-red-400" : ""}
        ${className}
      `}
    >
      {/* Avatar */}
      <div
        className={`
          flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0
          ${isUser ? "bg-blue-500 text-white" : "bg-green-500 text-white"}
        `}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-2">
        {/* Message Header */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.isEdited && (
            <span className="text-xs text-gray-400 italic">(edited)</span>
          )}
          {message.status === MessageStatus.FAILED && (
            <span className="text-xs text-red-600 font-medium">Failed</span>
          )}
        </div>

        {/* Message Body */}
        {isEditing && isAI ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Edit AI response..."
              disabled={isLoading}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || isLoading}
                className="inline-flex items-center gap-1 rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-1 rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            {message.content.map((content, index) => (
              <div key={index}>
                {content.type === "markdown" ? (
                  <div className="whitespace-pre-wrap text-gray-800">
                    {content.text}
                  </div>
                ) : content.type === "code" ? (
                  <pre className="rounded-md bg-gray-100 p-3 text-sm font-mono text-gray-800">
                    <code>{content.text}</code>
                  </pre>
                ) : (
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {content.text}
                  </p>
                )}
              </div>
            ))}

            {/* Loading indicator for processing messages */}
            {isLoading && (
              <div className="flex items-center gap-1 text-gray-500">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                </div>
                <span className="text-xs">AI is thinking...</span>
              </div>
            )}

            {/* Error message */}
            {hasError && message.error && (
              <div className="mt-2 rounded-md bg-red-100 p-3 text-sm text-red-800">
                <p className="font-medium">Error:</p>
                <p>{message.error}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Metadata */}
        {isAI && message.metadata && !isEditing && (
          <div className="mt-2 text-xs text-gray-500">
            {message.metadata.model && (
              <span>Model: {message.metadata.model}</span>
            )}
            {message.metadata.totalTokens && (
              <span className="ml-3">
                Tokens: {message.metadata.totalTokens}
              </span>
            )}
            {message.metadata.processingTime && (
              <span className="ml-3">
                Time: {message.metadata.processingTime.toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isEditing && (
        <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex gap-1">
            {isAI && onEdit && !isLoading && !hasError && (
              <button
                onClick={() =>
                  onEdit(message.id, message.content[0]?.text || "")
                }
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                title="Edit message"
              >
                <Edit2 size={14} />
              </button>
            )}

            {isAI && onRegenerate && !isLoading && (
              <button
                onClick={() => onRegenerate(message.id)}
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                title="Regenerate response"
              >
                <RefreshCw size={14} />
              </button>
            )}

            <button
              onClick={handleCopy}
              className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              title={isCopied ? "Copied!" : "Copy message"}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
