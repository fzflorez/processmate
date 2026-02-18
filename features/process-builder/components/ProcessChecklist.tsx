/**
 * Process Checklist Component
 * Displays process steps as a checklist for tracking progress
 */

import React from "react";
import { Check, CheckCircle2, Clock, AlertTriangle, X } from "lucide-react";

import type { ProcessStep } from "../types";
import { ProcessStepStatus, ProcessStepPriority } from "../types";

interface ProcessChecklistProps {
  steps: ProcessStep[];
  completedSteps: string[];
  onStepToggle?: (stepId: string, completed: boolean) => void;
  onStepSelect?: (stepId: string) => void;
  selectedStepId?: string;
  showProgress?: boolean;
}

export function ProcessChecklist({
  steps,
  completedSteps,
  onStepToggle,
  onStepSelect,
  selectedStepId,
  showProgress = true,
}: ProcessChecklistProps) {
  const getStatusIcon = (status: ProcessStepStatus) => {
    switch (status) {
      case ProcessStepStatus.COMPLETED:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case ProcessStepStatus.IN_PROGRESS:
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case ProcessStepStatus.FAILED:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case ProcessStepStatus.CANCELLED:
        return <X className="h-5 w-5 text-gray-500" />;
      default:
        return <Check className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: ProcessStepPriority) => {
    switch (priority) {
      case ProcessStepPriority.CRITICAL:
        return "text-red-600 bg-red-50 border-red-200";
      case ProcessStepPriority.HIGH:
        return "text-orange-600 bg-orange-50 border-orange-200";
      case ProcessStepPriority.MEDIUM:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case ProcessStepPriority.LOW:
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStepProgress = (step: ProcessStep) => {
    const isCompleted = completedSteps.includes(step.id);
    const isInProgress = selectedStepId === step.id;

    if (isCompleted) return 100;
    if (isInProgress) return 50;
    return 0;
  };

  const handleStepClick = (step: ProcessStep) => {
    if (onStepSelect) {
      onStepSelect(step.id);
    }
  };

  const handleCheckboxChange = (stepId: string, checked: boolean) => {
    if (onStepToggle) {
      onStepToggle(stepId, checked);
    }
  };

  const sortedSteps = [...steps].sort((a, b) => {
    // Sort by priority first, then by dependencies
    const priorityOrder = {
      [ProcessStepPriority.CRITICAL]: 0,
      [ProcessStepPriority.HIGH]: 1,
      [ProcessStepPriority.MEDIUM]: 2,
      [ProcessStepPriority.LOW]: 3,
    };

    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    return 0;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Process Checklist
        </h2>
      </div>

      <div className="p-6">
        {sortedSteps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No steps defined</p>
            <p className="text-sm">Add steps to your process to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSteps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isInProgress = selectedStepId === step.id;
              const progress = getStepProgress(step);
              const canStart =
                step.dependencies.length === 0 ||
                step.dependencies.every((dep) => completedSteps.includes(dep));

              return (
                <div
                  key={step.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer ${
                    selectedStepId === step.id
                      ? "border-blue-500 bg-blue-50"
                      : isCompleted
                        ? "border-green-500 bg-green-50"
                        : canStart
                          ? "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          : "border-gray-200 bg-gray-50 opacity-75"
                  }`}
                  onClick={() => handleStepClick(step)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={(e) =>
                            handleCheckboxChange(step.id, e.target.checked)
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          disabled={!canStart && !isCompleted}
                        />
                      </div>

                      {/* Step Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {step.name}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(step.priority)}`}
                          >
                            {step.priority.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {step.description}
                        </p>

                        {/* Dependencies */}
                        {step.dependencies.length > 0 && (
                          <div className="text-xs text-gray-500 mb-2">
                            <span className="font-medium">Dependencies:</span>{" "}
                            {step.dependencies.map((dep) => {
                              const depStep = steps.find((s) => s.id === dep);
                              const isDepCompleted =
                                completedSteps.includes(dep);
                              return (
                                <span
                                  key={dep}
                                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded ${
                                    isDepCompleted
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {depStep?.name || dep}
                                  {getStatusIcon(
                                    isDepCompleted
                                      ? ProcessStepStatus.COMPLETED
                                      : ProcessStepStatus.PENDING,
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Progress Bar */}
                        {showProgress && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Icon */}
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(step.status)}
                      <span className="text-xs text-gray-500">
                        {step.estimatedDuration &&
                          `~${step.estimatedDuration}min`}
                      </span>
                    </div>
                  </div>

                  {/* Step Actions */}
                  {isInProgress && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-600 font-medium">
                          Step in progress
                        </span>
                        <div className="flex space-x-2">
                          <button
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                            onClick={() => handleCheckboxChange(step.id, false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                            onClick={() => handleCheckboxChange(step.id, true)}
                          >
                            Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {completedSteps.length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {steps.length - completedSteps.length}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {steps.length > 0
                  ? Math.round((completedSteps.length / steps.length) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessChecklist;
