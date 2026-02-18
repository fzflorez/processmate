/**
 * Document Builder Component
 * Main orchestrator for document generation workflow
 */

import React from "react";
import { FileText, ArrowLeft, Download, RotateCcw } from "lucide-react";

import { useDocumentBuilder } from "../hooks";
import { DynamicQuestionFlow } from ".";
import { DocumentPreview } from ".";
import { ExportOptions } from ".";
import type { DocumentTemplate } from "../types";

interface DocumentBuilderProps {
  userId: string;
  templates?: DocumentTemplate[];
  className?: string;
}

export function DocumentBuilder({
  userId,
  templates = [],
  className = "",
}: DocumentBuilderProps) {
  const {
    state,
    selectTemplate,
    updateAnswer,
    nextQuestion,
    previousQuestion,
    generateDocument,
    updateDocument,
    exportDocument,
    reset,
    setError,
    setCurrentStep,
  } = useDocumentBuilder({ userId });

  const renderTemplateSelection = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <FileText className="h-16 w-16 mx-auto text-blue-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Document Generator
        </h1>
        <p className="text-lg text-gray-600">
          Choose a template to get started
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 mb-4">No templates available</div>
            <p className="text-sm text-gray-400">
              Create templates to enable document generation
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => selectTemplate(template)}
            >
              <div className="flex items-center justify-between mb-4">
                <FileText className="h-8 w-8 text-blue-500" />
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {template.category}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {template.description}
              </p>
              <div className="text-xs text-gray-500">
                {template.questions.length} questions
              </div>
            </div>
          ))
        )}
      </div>

      {/* Demo template for testing */}
      {templates.length === 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() =>
              selectTemplate({
                id: "demo-template",
                name: "Demo Template",
                description:
                  "A sample template for testing the document builder",
                category: "Demo",
                questions: [
                  {
                    id: "q1",
                    type: "text",
                    question: "What is the main topic of your document?",
                    required: true,
                  },
                  {
                    id: "q2",
                    type: "textarea",
                    question: "Provide a brief description",
                    required: true,
                  },
                  {
                    id: "q3",
                    type: "select",
                    question: "What is the target audience?",
                    required: true,
                    options: ["General", "Technical", "Business", "Academic"],
                  },
                ],
                promptTemplate:
                  "Generate a document about {topic} for {audience}",
                outputFormat: "markdown",
                variables: ["topic", "audience"],
                createdAt: new Date(),
                updatedAt: new Date(),
              })
            }
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Demo Template
          </button>
        </div>
      )}
    </div>
  );

  const renderQuestionnaire = () => {
    if (!state.selectedTemplate) return null;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {state.selectedTemplate.name}
            </h2>
            <button
              onClick={reset}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Start over"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((state.currentQuestionIndex + 1) / state.selectedTemplate.questions.length) * 100}%`,
              }}
            />
          </div>

          <p className="text-sm text-gray-600">
            Question {state.currentQuestionIndex + 1} of{" "}
            {state.selectedTemplate.questions.length}
          </p>
        </div>

        <DynamicQuestionFlow
          template={state.selectedTemplate}
          answers={state.answers}
          currentQuestionIndex={state.currentQuestionIndex}
          onAnswerUpdate={updateAnswer}
          onNext={nextQuestion}
          onPrevious={previousQuestion}
          onGenerate={() =>
            state.selectedTemplate &&
            generateDocument({
              templateId: state.selectedTemplate.id,
              answers: state.answers,
            })
          }
        />
      </div>
    );
  };

  const renderGeneration = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-blue-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generating Document
          </h2>
          <p className="text-gray-600">
            AI is creating your document based on your answers
          </p>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{state.progress}% complete</p>
        </div>

        <button
          onClick={() => {
            setError(null);
            reset();
          }}
          className="mt-8 text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderEditing = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Document</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                generateDocument({
                  templateId: state.selectedTemplate?.id || "",
                  answers: state.answers,
                })
              }
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RotateCcw size={16} />
              Regenerate
            </button>
            <button
              onClick={() => setCurrentStep("export")}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {state.generatedDocument && (
        <DocumentPreview
          document={state.generatedDocument}
          onDocumentUpdate={updateDocument}
        />
      )}
    </div>
  );

  const renderExport = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setCurrentStep("editing")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Edit
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Export Document</h2>
        </div>
      </div>

      {state.generatedDocument && (
        <ExportOptions
          document={state.generatedDocument}
          onExport={exportDocument}
        />
      )}
    </div>
  );

  const renderError = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 font-bold">!</span>
          </div>
          <h3 className="text-lg font-semibold text-red-900">Error</h3>
        </div>
        <p className="text-red-700 mb-4">{state.error}</p>
        <div className="flex gap-4">
          <button
            onClick={() => setError(null)}
            className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={reset}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {state.error && renderError()}

      {!state.error && (
        <>
          {state.currentStep === "template-selection" &&
            renderTemplateSelection()}
          {state.currentStep === "questionnaire" && renderQuestionnaire()}
          {state.currentStep === "generation" && renderGeneration()}
          {state.currentStep === "editing" && renderEditing()}
          {state.currentStep === "export" && renderExport()}
        </>
      )}
    </div>
  );
}

export default DocumentBuilder;
