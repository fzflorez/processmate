/**
 * Document Preview Component
 * Displays generated document with editing capabilities
 */

import React, { useState } from 'react';
import { Edit3, Save, X, Eye, EyeOff } from 'lucide-react';

import type { Document } from '../types';

interface DocumentPreviewProps {
  document: Document;
  onDocumentUpdate: (updates: Partial<Document>) => void;
}

export function DocumentPreview({ document, onDocumentUpdate }: DocumentPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(document.title);
  const [editedContent, setEditedContent] = useState(document.content);
  const [showMetadata, setShowMetadata] = useState(false);

  const handleSave = () => {
    onDocumentUpdate({
      title: editedTitle,
      content: editedContent,
      updatedAt: new Date(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(document.title);
    setEditedContent(document.content);
    setIsEditing(false);
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Content
            </label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {document.title}
        </h1>
        
        {document.description && (
          <p className="text-lg text-gray-600 mb-8 italic">
            {document.description}
          </p>
        )}

        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
          {document.content}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Document Preview
            </h2>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                document.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                document.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                document.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {document.status}
              </span>
              
              <span className="text-sm text-gray-500">
                v{document.version}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              title={showMetadata ? 'Hide metadata' : 'Show metadata'}
            >
              {showMetadata ? <EyeOff size={16} /> : <Eye size={16} />}
              Metadata
            </button>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  title="Save changes"
                >
                  <Save size={16} />
                  Save
                </button>
                
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="Cancel editing"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="Edit document"
              >
                <Edit3 size={16} />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {renderContent()}
      </div>

      {/* Metadata */}
      {showMetadata && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Metadata</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Word Count
              </label>
              <p className="text-gray-900">{document.metadata.wordCount}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reading Time
              </label>
              <p className="text-gray-900">{document.metadata.readingTime} min</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <p className="text-gray-900">{document.metadata.format}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <p className="text-gray-900">{document.metadata.language}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <p className="text-gray-900">
                {new Date(document.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <p className="text-gray-900">
                {new Date(document.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Sections */}
          {document.sections.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Sections</h4>
              <div className="space-y-2">
                {document.sections.map((section, index) => (
                  <div key={section.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">
                        {index + 1}.
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{section.title}</p>
                        <p className="text-sm text-gray-600">{section.type}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      Order: {section.order}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answers Summary */}
          {document.answers.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Answers Summary</h4>
              <div className="text-sm text-gray-600">
                {document.answers.length} questions answered
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentPreview;
