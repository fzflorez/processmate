/**
 * Export Options Component
 * Handles document export functionality with various format options
 */

import React, { useState } from 'react';
import { Download, FileText, File, Code, Hash, Settings } from 'lucide-react';

import type { Document, DocumentExportOptions } from '../types';

interface ExportOptionsProps {
  document: Document;
  onExport: (options: DocumentExportOptions) => Promise<void>;
}

export function ExportOptions({ document, onExport }: ExportOptionsProps) {
  const [selectedFormat, setSelectedFormat] = useState<DocumentExportOptions['format']>('pdf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatOptions = [
    {
      value: 'pdf' as const,
      label: 'PDF Document',
      description: 'Best for printing and sharing',
      icon: FileText,
      extension: '.pdf',
    },
    {
      value: 'docx' as const,
      label: 'Word Document',
      description: 'Microsoft Word compatible',
      icon: File,
      extension: '.docx',
    },
    {
      value: 'html' as const,
      label: 'HTML Web Page',
      description: 'For web publishing',
      icon: Code,
      extension: '.html',
    },
    {
      value: 'markdown' as const,
      label: 'Markdown',
      description: 'Plain text with formatting',
      icon: FileText,
      extension: '.md',
    },
    {
      value: 'txt' as const,
      label: 'Plain Text',
      description: 'Simple text format',
      icon: File,
      extension: '.txt',
    },
    {
      value: 'json' as const,
      label: 'JSON Data',
      description: 'Structured data format',
      icon: Hash,
      extension: '.json',
    },
  ];

  const selectedFormatOption = formatOptions.find(option => option.value === selectedFormat);

  const handleExport = async () => {
    setIsExporting(true);
    
    const exportOptions: DocumentExportOptions = {
      format: selectedFormat,
      includeMetadata,
      includeAnswers,
      customOptions: showAdvanced ? {
        template: 'default',
        pageSize: 'A4',
        margins: 'normal',
        fontSize: 12,
        fontFamily: 'Arial',
      } : undefined,
    };

    try {
      await onExport(exportOptions);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const safeTitle = document.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${safeTitle}_${timestamp}${selectedFormatOption?.extension || ''}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Export Document
          </h2>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Settings size={16} />
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Format Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formatOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedFormat(option.value)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    selectedFormat === option.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-6 w-6 mt-1 ${
                      selectedFormat === option.value ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {option.label}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {option.extension}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Include metadata</span>
                <p className="text-sm text-gray-600">
                  Add document information like creation date, word count, etc.
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAnswers}
                onChange={(e) => setIncludeAnswers(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Include answers</span>
                <p className="text-sm text-gray-600">
                  Add the questionnaire answers that generated this document
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="default">Default Template</option>
                  <option value="professional">Professional</option>
                  <option value="academic">Academic</option>
                  <option value="creative">Creative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Size
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <input
                  type="number"
                  defaultValue={12}
                  min={8}
                  max={24}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Export Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Format: <span className="font-medium">{selectedFormatOption?.label}</span></p>
            <p>Filename: <span className="font-medium">{generateFilename()}</span></p>
            <p>Size: <span className="font-medium">~{Math.round(document.metadata.wordCount * 0.5)}KB</span></p>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-center">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={20} />
                Export {selectedFormatOption?.label}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportOptions;
