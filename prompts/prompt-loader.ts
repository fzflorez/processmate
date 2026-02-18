/**
 * AI Prompt Loader System
 * Provides dynamic loading, compilation, and management of AI prompts
 */

import type {
  PromptTemplate,
  CompiledPrompt,
  PromptValidationResult,
  PromptLoaderConfig,
  PromptExecutionContext,
  PromptExecutionResult,
} from "./prompt.types";
import { PromptCategory } from "./prompt.types";

/**
 * Template cache entry
 */
interface CacheEntry {
  template: PromptTemplate;
  timestamp: number;
  ttl: number;
}

export class PromptLoader {
  private templateCache: Map<string, CacheEntry> = new Map();
  private templates: Map<string, PromptTemplate> = new Map();
  private config: PromptLoaderConfig;

  constructor(config: PromptLoaderConfig = {}) {
    this.config = {
      enableCaching: true,
      cacheTimeout: 300000,
      enableValidation: true,
      ...config,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                               LOAD TEMPLATE                                */
  /* -------------------------------------------------------------------------- */

  async loadTemplate(id: string): Promise<PromptTemplate | undefined> {
    if (this.config.enableCaching) {
      const cached = this.getCachedTemplate(id);
      if (cached) return cached;
    }

    try {
      const template = await this.fetchTemplate(id);

      if (!template) return undefined;

      this.templates.set(id, template);

      if (this.config.enableValidation) {
        const validation = this.validateTemplate(template);

        if (!validation.isValid) {
          console.warn(`Invalid template ${id}`, validation.errors);
        }
      }

      if (this.config.enableCaching) {
        this.setTemplateCache(id, template);
      }

      return template;
    } catch (error) {
      console.error(`Failed to load template ${id}`, error);
      return undefined;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              COMPILE PROMPT                                */
  /* -------------------------------------------------------------------------- */

  async compilePrompt(
    templateId: string,
    variables: Record<string, unknown> = {},
  ): Promise<CompiledPrompt> {
    let template = this.templates.get(templateId);

    if (!template) {
      template = await this.loadTemplate(templateId);
    }

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    this.validateRequiredVariables(template, variables);

    const compiledContent = this.processTemplate(template.template, variables);

    return {
      id: templateId,
      content: compiledContent,
      variables,
      metadata: template.metadata ?? {},
      compiledAt: new Date().toISOString(),
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                               EXECUTE PROMPT                               */
  /* -------------------------------------------------------------------------- */

  async executePrompt(
    compiledPrompt: CompiledPrompt,
    context: PromptExecutionContext,
  ): Promise<PromptExecutionResult> {
    const start = Date.now();

    try {
      const result = await this.callAIService(compiledPrompt.content, context);

      return {
        success: true,
        content: result.content,
        tokens: result.tokens,
        cost: result.cost,
        latency: Date.now() - start,
        metadata: {
          ...result.metadata,
          templateId: compiledPrompt.id,
          variables: compiledPrompt.variables,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        latency: Date.now() - start,
        metadata: {
          templateId: compiledPrompt.id,
          variables: compiledPrompt.variables,
        },
      };
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            LOAD + EXECUTE HELPER                           */
  /* -------------------------------------------------------------------------- */

  async loadAndExecute(
    templateId: string,
    variables: Record<string, unknown>,
    context: PromptExecutionContext,
  ): Promise<PromptExecutionResult> {
    const compiled = await this.compilePrompt(templateId, variables);
    return this.executePrompt(compiled, context);
  }

  /* -------------------------------------------------------------------------- */
  /*                         TEMPLATE VARIABLE PROCESSOR                        */
  /* -------------------------------------------------------------------------- */

  private processTemplate(
    template: string,
    variables: Record<string, unknown>,
  ): string {
    let output = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;

      output = output.replace(
        new RegExp(this.escapeRegex(placeholder), "g"),
        String(value),
      );
    }

    return output;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* -------------------------------------------------------------------------- */
  /*                               VALIDATIONS                                  */
  /* -------------------------------------------------------------------------- */

  private validateTemplate(template: PromptTemplate): PromptValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const usedVariables = this.extractVariables(template.template);

    const requiredVariables = template.variables
      .filter((v) => v.required)
      .map((v) => v.name);

    for (const variable of requiredVariables) {
      if (!usedVariables.includes(variable)) {
        errors.push(`Required variable '${variable}' not used in template`);
      }
    }

    if (!template.template.includes("{{")) {
      warnings.push("Template may not contain variables");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateRequiredVariables(
    template: PromptTemplate,
    variables: Record<string, unknown>,
  ) {
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in variables)) {
        throw new Error(`Missing required variable: ${variable.name}`);
      }
    }
  }

  private extractVariables(template: string): string[] {
    const regex = /\{\{\s*(\w+)\s*\}\}/g;
    const matches = template.match(regex);

    if (!matches) return [];

    return [...new Set(matches.map((m) => m.replace(/[{}]/g, "").trim()))];
  }

  /* -------------------------------------------------------------------------- */
  /*                                  STORAGE                                   */
  /* -------------------------------------------------------------------------- */

  private async fetchTemplate(id: string): Promise<PromptTemplate | undefined> {
    const mockTemplates: Record<string, PromptTemplate> = {
      "chat.default": {
        id: "chat.default",
        name: "Default Chat",
        description: "Default chat prompt",
        category: PromptCategory.CHAT,
        version: "1.0.0",
        template:
          "You are a helpful AI assistant.\nContext: {{context}}\nUser: {{userInput}}",
        variables: [
          {
            name: "context",
            type: "string",
            description: "Conversation context",
            required: false,
          },
          {
            name: "userInput",
            type: "string",
            description: "User input",
            required: true,
          },
        ],
      },
    };

    return mockTemplates[id] ?? undefined;
  }

  /* -------------------------------------------------------------------------- */
  /*                               AI SERVICE MOCK                              */
  /* -------------------------------------------------------------------------- */

  private async callAIService(
    prompt: string,
    context: PromptExecutionContext,
  ): Promise<{
    content: string;
    tokens?: number;
    cost?: number;
    metadata?: Record<string, unknown>;
  }> {
    const response = `AI Response to: ${prompt.substring(0, 100)}...`;

    return {
      content: response,
      tokens: Math.floor(Math.random() * 500) + 100,
      cost: Math.random() * 0.01,
      metadata: {
        model: context.model.model,
        provider: context.model.provider,
      },
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                   CACHE                                    */
  /* -------------------------------------------------------------------------- */

  private getCachedTemplate(id: string): PromptTemplate | undefined {
    const cached = this.templateCache.get(id);

    if (!cached) return undefined;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.templateCache.delete(id);
      return undefined;
    }

    return cached.template;
  }

  private setTemplateCache(id: string, template: PromptTemplate) {
    this.templateCache.set(id, {
      template,
      timestamp: Date.now(),
      ttl: this.config.cacheTimeout!,
    });
  }

  clearCache() {
    this.templateCache.clear();
  }

  getLoadedTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getCacheStats() {
    return {
      size: this.templateCache.size,
    };
  }
}

export const promptLoader = new PromptLoader();
