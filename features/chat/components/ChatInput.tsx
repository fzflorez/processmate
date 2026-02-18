/**
 * Chat Input Component
 * Handles message input with loading states and sending functionality
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Square } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  showAttachments?: boolean;
  showVoiceRecord?: boolean;
  maxLength?: number;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  isLoading = false,
  placeholder = "Type your message...",
  className = "",
  showAttachments = true,
  showVoiceRecord = true,
  maxLength = 4000,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [message]);

  // Update character count
  useEffect(() => {
    setCharCount(message.length);
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSend = async () => {
    if (!message.trim() || disabled || isLoading) return;

    const messageToSend = message.trim();
    setMessage("");
    setCharCount(0);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await onSendMessage(messageToSend);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Restore message on error
      setMessage(messageToSend);
      setCharCount(messageToSend.length);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle file attachment logic here
      console.log("Files selected:", files);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording logic here
      setIsRecording(false);
    } else {
      // Start recording logic here
      setIsRecording(true);
    }
  };

  const isNearLimit = charCount > maxLength * 0.9;
  const isAtLimit = charCount >= maxLength;

  return (
    <div className={`border-t bg-white p-4 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Character count warning */}
        {isNearLimit && (
          <div
            className={`mb-2 text-xs ${isAtLimit ? "text-red-600" : "text-yellow-600"}`}
          >
            {charCount}/{maxLength} characters
            {isAtLimit && " - Limit reached"}
          </div>
        )}

        {/* Input Container */}
        <div className="relative flex items-end gap-2 rounded-lg border border-gray-200 bg-white p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          {/* Attachment Button */}
          {showAttachments && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
              className="rounded p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          {/* Message Input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent py-2 text-sm placeholder-gray-500 focus:outline-none disabled:opacity-50"
            style={{ minHeight: "24px", maxHeight: "200px" }}
          />

          {/* Voice Record / Stop Button */}
          {showVoiceRecord && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={disabled || isLoading}
              className={`
                rounded p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  isRecording
                    ? "text-red-500 hover:text-red-600 bg-red-50"
                    : "text-gray-400 hover:text-gray-600"
                }
              `}
              title={isRecording ? "Stop recording" : "Start voice recording"}
            >
              {isRecording ? <Square size={18} /> : <Mic size={18} />}
            </button>
          )}

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || disabled || isLoading || isRecording}
            className="
              rounded p-2 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300
            "
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <div className="flex gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 [animation-delay:0.2s]"></div>
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 [animation-delay:0.4s]"></div>
            </div>
            <span>Recording... Click to stop</span>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && !isRecording && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <div className="flex gap-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
            </div>
            <span>AI is responding...</span>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-2 text-xs text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
