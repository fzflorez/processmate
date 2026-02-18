/**
 * Document Builder Types
 * TypeScript definitions for document generation and builder functionality
 */

export interface DocumentQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'date' | 'number';
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
  conditional?: {
    questionId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
    value: string | number | boolean;
  };
}

export interface DocumentAnswer {
  questionId: string;
  value: string | string[] | number | boolean | Date;
  metadata?: Record<string, unknown>;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  questions: DocumentQuestion[];
  promptTemplate: string;
  outputFormat: 'markdown' | 'html' | 'plain-text' | 'json';
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'header' | 'paragraph' | 'list' | 'table' | 'image' | 'code';
  metadata?: Record<string, unknown>;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  sections: DocumentSection[];
  templateId: string;
  answers: DocumentAnswer[];
  metadata: {
    wordCount: number;
    readingTime: number;
    format: string;
    language: string;
  };
  status: 'draft' | 'review' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
}

export interface DocumentBuilderState {
  currentStep: 'template-selection' | 'questionnaire' | 'generation' | 'editing' | 'export';
  selectedTemplate: DocumentTemplate | null;
  answers: DocumentAnswer[];
  currentQuestionIndex: number;
  generatedDocument: Document | null;
  isGenerating: boolean;
  error: string | null;
  progress: number;
}

export interface DocumentExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'markdown' | 'txt' | 'json';
  includeMetadata: boolean;
  includeAnswers: boolean;
  template?: string;
  customOptions?: Record<string, unknown>;
}

export interface DocumentGenerationRequest {
  templateId: string;
  answers: DocumentAnswer[];
  customPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DocumentGenerationResponse {
  document: Document;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTime: number;
}

export interface DocumentValidationError {
  field: string;
  message: string;
  code: string;
}

export interface DocumentBuilderContext {
  state: DocumentBuilderState;
  actions: {
    selectTemplate: (template: DocumentTemplate) => void;
    updateAnswer: (questionId: string, value: DocumentAnswer['value']) => void;
    nextQuestion: () => void;
    previousQuestion: () => void;
    generateDocument: (request: DocumentGenerationRequest) => Promise<void>;
    updateDocument: (updates: Partial<Document>) => void;
    exportDocument: (options: DocumentExportOptions) => Promise<void>;
    reset: () => void;
    setError: (error: string | null) => void;
  };
}

export type DocumentBuilderHook = DocumentBuilderContext;

// Utility types
export type QuestionType = DocumentQuestion['type'];
export type DocumentStatus = Document['status'];
export type ExportFormat = DocumentExportOptions['format'];
export type BuilderStep = DocumentBuilderState['currentStep'];
