/**
 * Process Progress Component
 * Visualizes process execution progress with timeline and metrics
 */

import React from 'react';
import { Play, Pause, Square, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

import type { ProcessProgressData, ProcessExecutionContext } from '../types';

interface ProcessProgressProps {
  progressData: ProcessProgressData;
  executionContext?: ProcessExecutionContext | null;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  showDetails?: boolean;
}

export function ProcessProgress({
  progressData,
  executionContext,
  onPause,
  onResume,
  onCancel,
  showDetails = true,
}: ProcessProgressProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const getEstimatedTimeRemaining = () => {
    if (!progressData.estimatedCompletion || !progressData.startTime) return null;
    
    const now = new Date();
    const totalEstimated = progressData.estimatedCompletion.getTime() - progressData.startTime.getTime();
    const elapsed = now.getTime() - progressData.startTime.getTime();
    const remaining = totalEstimated - elapsed;
    
    if (remaining <= 0) return 'Completed';
    return formatDuration(now, new Date(now.getTime() + remaining));
  };

  const isRunning = progressData.status === 'running';
  const isPaused = progressData.status === 'paused';

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Process Progress</h2>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(progressData.status)}`}>
              {progressData.status.toUpperCase()}
            </span>
            {progressData.progressPercentage > 0 && (
              <span className="text-sm text-gray-600">
                {progressData.progressPercentage}% Complete
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{progressData.progressPercentage}%</div>
            <div className="text-sm text-gray-600">Progress</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{progressData.completedSteps}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{progressData.totalSteps - progressData.completedSteps}</div>
            <div className="text-sm text-gray-600">Remaining</div>
          </div>
        </div>

        {/* Main Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{progressData.completedSteps} of {progressData.totalSteps} steps</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressData.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Time Tracking</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Started:</span>
                <span className="font-medium">{progressData.startTime.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Elapsed:</span>
                <span className="font-medium">{formatDuration(progressData.startTime)}</span>
              </div>
              {progressData.estimatedCompletion && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Remaining:</span>
                  <span className="font-medium">{getEstimatedTimeRemaining()}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Performance Metrics</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Step Time:</span>
                <span className="font-medium">
                  {progressData.completedSteps > 0 
                    ? formatDuration(progressData.startTime, new Date(progressData.startTime.getTime() + (2 * progressData.completedSteps * 1000)))
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Efficiency:</span>
                <span className="font-medium text-green-600">
                  {progressData.progressPercentage > 0 ? 'Good' : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {isRunning && onPause && (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Pause size={16} />
              Pause
            </button>
          )}
          
          {isPaused && onResume && (
            <button
              onClick={onResume}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Play size={16} />
              Resume
            </button>
          )}
          
          {(isRunning || isPaused) && onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Square size={16} />
              Cancel
            </button>
          )}
        </div>

        {/* Step Details */}
        {showDetails && executionContext && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Step Details</h3>
            <div className="space-y-3">
              {executionContext.stepExecutions.map((execution, index) => (
                <div
                  key={execution.stepId}
                  className={`border rounded-lg p-4 ${
                    execution.status === 'completed' ? 'border-green-200 bg-green-50' :
                    execution.status === 'failed' ? 'border-red-200 bg-red-50' :
                    execution.status === 'in_progress' ? 'border-blue-200 bg-blue-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Step {index + 1}</h4>
                        <p className="text-sm text-gray-600">
                          {execution.stepId}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {execution.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {execution.status === 'failed' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                      {execution.status === 'in_progress' && <Clock className="h-5 w-5 text-blue-500 animate-pulse" />}
                      {execution.duration && (
                        <span className="text-sm text-gray-600">
                          {formatDuration(execution.startTime, execution.endTime)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {execution.error && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
                      <p className="text-sm text-red-700">{execution.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        {progressData.milestones.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Milestones</h3>
            <div className="space-y-3">
              {progressData.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    milestone.completed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      milestone.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {milestone.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <div className="w-2 h-2 bg-current rounded-full" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                      {milestone.completedAt && (
                        <p className="text-sm text-gray-600">
                          Completed: {milestone.completedAt.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProcessProgress;
