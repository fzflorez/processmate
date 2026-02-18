/**
 * Process Form Component
 * Form for creating and editing process definitions
 */

import React, { useState } from "react";
import { Save, X, Plus } from "lucide-react";

import type { ProcessFormData } from "../types";
import { validateProcessFormData } from "../schemas";

interface ProcessFormProps {
  initialData?: Partial<ProcessFormData>;
  onSave: (data: ProcessFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function ProcessForm({
  initialData = {},
  onSave,
  onCancel,
  isEditing = false,
}: ProcessFormProps) {
  const [formData, setFormData] = useState<ProcessFormData>({
    name: initialData.name || "",
    description: initialData.description || "",
    category: initialData.category || "",
    estimatedDuration: initialData.estimatedDuration,
    complexity: initialData.complexity || "simple",
    tags: initialData.tags || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateProcessFormData(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          fieldErrors[String(issue.path[0])] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSave(formData);
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error ? error.message : "Failed to save process",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof ProcessFormData,
    value: string | number | string[] | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      handleInputChange("tags", [...formData.tags, tag]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove),
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Process" : "Create New Process"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Process Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Process Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter process name..."
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Describe what this process does..."
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select a category...</option>
              <option value="development">Development</option>
              <option value="business">Business</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Sales</option>
              <option value="hr">Human Resources</option>
              <option value="finance">Finance</option>
              <option value="operations">Operations</option>
              <option value="quality">Quality Assurance</option>
              <option value="compliance">Compliance</option>
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.estimatedDuration || ""}
              onChange={(e) =>
                handleInputChange(
                  "estimatedDuration",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              min={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Estimated time to complete..."
              disabled={isSubmitting}
            />
          </div>

          {/* Complexity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complexity *
            </label>
            <div className="flex space-x-4">
              {[
                { value: "simple", label: "Simple" },
                { value: "medium", label: "Medium" },
                { value: "complex", label: "Complex" },
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="complexity"
                    value={option.value}
                    checked={formData.complexity === option.value}
                    onChange={(e) =>
                      handleInputChange("complexity", e.target.value)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex">
                <input
                  type="text"
                  placeholder="Add a tag and press Enter..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const target = e.target as HTMLInputElement;
                      const tag = target.value.trim();
                      if (tag) {
                        handleTagAdd(tag);
                        target.value = "";
                      }
                    }
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      'input[placeholder*="Add a tag"]',
                    ) as HTMLInputElement;
                    const tag = input?.value?.trim();
                    if (tag) {
                      handleTagAdd(tag);
                      input.value = "";
                    }
                  }}
                  className="ml-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {isEditing ? "Update Process" : "Create Process"}
              </>
            )}
          </button>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default ProcessForm;
