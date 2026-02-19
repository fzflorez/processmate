/**
 * Process Card Component
 * Displays process intent messages with interactive checklist
 */

import React, { useState } from "react";
import { Check, Clock, ListTodo } from "lucide-react";
import type { ProcessData, ProcessStep } from "../types";

interface ProcessCardProps {
  title: string;
  summary: string;
  content: ProcessData;
  confidence: number;
  className?: string;
}

export function ProcessCard({
  title,
  summary,
  content,
  confidence,
  className = "",
}: ProcessCardProps) {
  const [steps, setSteps] = useState<ProcessStep[]>(content.steps);

  const toggleStepStatus = (stepIndex: number) => {
    setSteps((prevSteps) =>
      prevSteps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              status: step.status === "completed" ? "pending" : "completed",
            }
          : step,
      ),
    );
  };

  const completedSteps = steps.filter(
    (step) => step.status === "completed",
  ).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{content.estimatedDuration}</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-gray-600 mb-6">{summary}</p>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>
            {completedSteps} of {steps.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.step}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => toggleStepStatus(index)}
          >
            <div
              className={`
                mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors
                ${
                  step.status === "completed"
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-gray-300 hover:border-blue-400"
                }
              `}
            >
              {step.status === "completed" && <Check className="h-3 w-3" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Step {step.step}
                </span>
                {step.status === "completed" && (
                  <span className="text-xs text-green-600 font-medium">
                    Completed
                  </span>
                )}
              </div>
              <p
                className={`
                  text-sm leading-relaxed
                  ${step.status === "completed" ? "text-gray-500 line-through" : "text-gray-700"}
                `}
              >
                {step.description}
              </p>
            </div>
          </div>
        ))}
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
