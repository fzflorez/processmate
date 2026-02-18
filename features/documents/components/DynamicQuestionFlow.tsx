/**
 * Dynamic Question Flow Component
 * Handles dynamic question rendering and answer collection
 */

import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react";

import type { DocumentTemplate, DocumentAnswer } from "../types";

interface DynamicQuestionFlowProps {
  template: DocumentTemplate;
  answers: DocumentAnswer[];
  currentQuestionIndex: number;
  onAnswerUpdate: (questionId: string, value: DocumentAnswer["value"]) => void;
  onNext: () => void;
  onPrevious: () => void;
  onGenerate: () => void;
}

export function DynamicQuestionFlow({
  template,
  answers,
  currentQuestionIndex,
  onAnswerUpdate,
  onNext,
  onPrevious,
  onGenerate,
}: DynamicQuestionFlowProps) {
  const [currentValue, setCurrentValue] = useState<DocumentAnswer["value"]>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = template.questions[currentQuestionIndex];
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion.id,
  );
  const isLastQuestion = currentQuestionIndex === template.questions.length - 1;
  const canProceed = currentQuestion.required
    ? currentValue !== "" && currentValue !== null && currentValue !== undefined
    : true;

  // Initialize current value when question changes
  React.useEffect(() => {
    if (currentAnswer) {
      setCurrentValue(currentAnswer.value);
    } else {
      setCurrentValue("");
    }
  }, [currentQuestion.id, currentAnswer]);

  const handleSubmit = async () => {
    if (!canProceed) return;

    setIsSubmitting(true);
    onAnswerUpdate(currentQuestion.id, currentValue);

    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    setIsSubmitting(false);

    if (isLastQuestion) {
      onGenerate();
    } else {
      onNext();
    }
  };

  const renderQuestionInput = () => {
    const baseInputClasses =
      "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

    switch (currentQuestion.type) {
      case "text":
        return (
          <input
            type="text"
            value={(currentValue as string) || ""}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder={currentQuestion.description || "Enter your answer..."}
            className={baseInputClasses}
            disabled={isSubmitting}
          />
        );

      case "textarea":
        return (
          <textarea
            value={(currentValue as string) || ""}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder={currentQuestion.description || "Enter your answer..."}
            rows={4}
            className={baseInputClasses}
            disabled={isSubmitting}
          />
        );

      case "select":
        return (
          <select
            value={(currentValue as string) || ""}
            onChange={(e) => setCurrentValue(e.target.value)}
            className={baseInputClasses}
            disabled={isSubmitting}
          >
            <option value="">Select an option...</option>
            {currentQuestion.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={((currentValue as string[]) || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = (currentValue as string[]) || [];
                    if (e.target.checked) {
                      setCurrentValue([...currentValues, option]);
                    } else {
                      setCurrentValue(
                        currentValues.filter((v) => v !== option),
                      );
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={(currentValue as boolean) || false}
              onChange={(e) => setCurrentValue(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <span className="text-gray-700">
              {currentQuestion.description || "Yes"}
            </span>
          </label>
        );

      case "date":
        return (
          <input
            type="date"
            value={
              currentValue
                ? new Date(currentValue as Date).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) =>
              setCurrentValue(
                e.target.value ? new Date(e.target.value) : new Date(),
              )
            }
            className={baseInputClasses}
            disabled={isSubmitting}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={(currentValue as number) || ""}
            onChange={(e) =>
              setCurrentValue(e.target.value ? Number(e.target.value) : "")
            }
            placeholder={currentQuestion.description || "Enter a number..."}
            className={baseInputClasses}
            disabled={isSubmitting}
            min={currentQuestion.validation?.min}
            max={currentQuestion.validation?.max}
          />
        );

      default:
        return (
          <input
            type="text"
            value={(currentValue as string) || ""}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="Enter your answer..."
            className={baseInputClasses}
            disabled={isSubmitting}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentQuestion.question}
          </h3>
          {currentQuestion.required && (
            <span className="text-red-500 text-sm font-medium">*</span>
          )}
        </div>
        {currentQuestion.description && (
          <p className="text-sm text-gray-600 mt-1">
            {currentQuestion.description}
          </p>
        )}
      </div>

      {/* Question Input */}
      <div className="mb-6">{renderQuestionInput()}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={16} />
          Previous
        </button>

        <div className="text-sm text-gray-500">
          {currentQuestionIndex + 1} of {template.questions.length}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canProceed || isSubmitting}
          className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isLastQuestion ? "Generating..." : "Saving..."}
            </>
          ) : (
            <>
              {isLastQuestion ? (
                <>
                  <Send size={16} />
                  Generate Document
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </>
          )}
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-1">
          {template.questions.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full transition-colors ${
                index < currentQuestionIndex
                  ? "bg-blue-500"
                  : index === currentQuestionIndex
                    ? "bg-blue-300"
                    : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DynamicQuestionFlow;
