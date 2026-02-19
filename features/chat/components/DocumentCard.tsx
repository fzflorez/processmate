/**
 * Document Card Component
 * Displays document intent messages with formatted sections
 */

import React from "react";
import { FileText, Type } from "lucide-react";
import type { DocumentData, DocumentSection } from "../types";

interface DocumentCardProps {
  title: string;
  summary: string;
  content: DocumentData;
  confidence: number;
  className?: string;
}

export function DocumentCard({
  title,
  summary,
  content,
  confidence,
  className = "",
}: DocumentCardProps) {
  const getDocumentTypeLabel = (type: DocumentData["documentType"]) => {
    switch (type) {
      case "formal letter":
        return "Formal Letter";
      case "email":
        return "Email";
      case "request":
        return "Request";
      case "other":
        return "Document";
      default:
        return "Document";
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          <Type className="h-3 w-3" />
          <span>{getDocumentTypeLabel(content.documentType)}</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-gray-600 mb-6">{summary}</p>

      {/* Document Sections */}
      <div className="space-y-6">
        {content.sections.map((section: DocumentSection, index: number) => (
          <div key={index} className="border-l-4 border-green-200 pl-4">
            <h4 className="text-base font-semibold text-gray-900 mb-3">
              {section.heading}
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {section.body}
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
