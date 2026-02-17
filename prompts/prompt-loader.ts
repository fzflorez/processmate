/**
 * AI Prompt Loader System
 * Provides dynamic loading, compilation, and management of AI prompts
 */

import type { 
  PromptTemplate, 
  PromptVariable, 
  CompiledPrompt, 
  PromptValidationResult,
  PromptLoaderConfig,
  PromptExecutionContext,
  PromptExecutionResult,
  AIModelConfig 
} from './prompt.types';

/**
 * Prompt cache entry
 */
interface CacheEntry {
  prompt: CompiledPrompt;
  timestamp: number;
  ttl: number;
}

/**
 * Prompt Loader class
 */
export class PromptLoader {
  private cache: Map<string, CacheEntry> = new Map();
  private templates: Map<string, PromptTemplate> = new Map();
  private config: PromptLoaderConfig;

  constructor(config: PromptLoaderConfig = {}) {
    this.config = {
      enableCaching: true,
      cacheTimeout: 300000, // 5 minutes
      enableValidation: true,
      ...config,
    };
  }

  /**
   * Load prompt template from storage
   */
  async loadTemplate(id: string): Promise<PromptTemplate | null> {
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCached(id);
      if (cached) {
        return cached.template;
      }
    }

    try {
      // In a real implementation, this would load from file system or API
      const template = await this.fetchTemplate(id);
      
      if (template) {
        this.templates.set(id, template);
        
        if (this.config.enableValidation) {
          const validation = this.validateTemplate(template);
          if (!validation.isValid) {
            console.warn(`Invalid template ${id}:`, validation.errors);
          }
        }
      }
      
      return template;
    }
    
    return null;
  }

  /**
   * Compile prompt template with variables
   */
  compilePrompt(
    templateId: string,
    variables: Record<string, unknown> = {}
  ): CompiledPrompt | null {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    try {
      const compiled = this.processTemplate(template.template, variables);
      
      const compiledPrompt: CompiledPrompt = {
        id: templateId,
        content: compiled,
        variables,
        metadata: template.metadata || {},
        compiledAt: new Date().toISOString(),
      };

      // Cache compiled prompt
      if (this.config.enableCaching) {
        this.setCache(templateId, compiledPrompt);
      }

      return compiledPrompt;
    } catch (error) {
      throw new Error(`Failed to compile template ${templateId}: ${error}`);
    }
  }

  /**
   * Execute compiled prompt
   */
  async executePrompt(
    compiledPrompt: CompiledPrompt,
    context: PromptExecutionContext
  ): Promise<PromptExecutionResult> {
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would call the AI service
      const result = await this.callAIService(compiledPrompt.content, context);
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        content: result.content,
        tokens: result.tokens,
        cost: result.cost,
        latency,
        metadata: {
          ...result.metadata,
          templateId: compiledPrompt.id,
          variables: compiledPrompt.variables,
        },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency,
        metadata: {
          templateId: compiledPrompt.id,
          variables: compiledPrompt.variables,
        },
      };
    }
  }

  /**
   * Load and execute prompt in one step
   */
  async loadAndExecute(
    templateId: string,
    variables: Record<string, unknown> = {},
    context: PromptExecutionContext
  ): Promise<PromptExecutionResult> {
    const compiled = this.compilePrompt(templateId, variables);
    if (!compiled) {
      return {
        success: false,
        error: `Failed to compile template: ${templateId}`,
        metadata: { templateId, variables },
      };
    }

    return this.executePrompt(compiled, context);
  }

  /**
   * Process template string with variable substitution
   */
  private processTemplate(template: string, variables: Record<string, unknown>): string {
    let processed = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      processed = processed.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return processed;
  }

  /**
   * Validate prompt template structure
   */
  private validateTemplate(template: PromptTemplate): PromptValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    const usedVariables = this.extractVariables(template.template);
    const requiredVariables = template.variables
      .filter(v => v.required)
      .map(v => v.name);

    for (const required of requiredVariables) {
      if (!usedVariables.includes(required)) {
        errors.push(`Required variable '${required}' is not used in template`);
      }
    }

    // Check template syntax
    if (!template.template.includes('{{') || !template.template.includes('}}')) {
      warnings.push('Template may not contain any variables');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Extract variable names from template
   */
  private extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    
    return [...new Set(matches.map(match => match[1]))];
  }

  /**
   * Fetch template from storage (placeholder implementation)
   */
  private async fetchTemplate(id: string): Promise<PromptTemplate | null> {
    // This would be implemented to load from file system, database, or API
    // For now, return a mock template
    const mockTemplates: Record<string, PromptTemplate> = {
      'chat.default': {
        id: 'chat.default',
        name: 'Default Chat',
        description: 'Default chat prompt for general conversation',
        category: 'chat' as any,
        version: '1.0.0',
        template: 'You are a helpful AI assistant. {{#if context}}Context: {{context}}{{/if}}\n\nUser: {{userInput}}',
        variables: [
          { name: 'context', type: 'string', description: 'Conversation context', required: false },
          { name: 'userInput', type: 'string', description: 'User input message', required: true },
        ],
        examples: [
          {
            input: { userInput: 'Hello, how are you?' },
            output: 'Hello! I am doing well, thank you for asking.',
            description: 'Basic greeting',
          },
        ],
      },
      'process.analysis': {
        id: 'process.analysis',
        name: 'Process Analysis',
        description: 'Analyze business processes and provide insights',
        category: 'analysis' as any,
        version: '1.0.0',
        template: 'Analyze the following business process:\n\n{{processDescription}}\n\nProvide insights on:\n1. Efficiency opportunities\n2. Potential bottlenecks\n3. Improvement suggestions\n4. Risk factors',
        variables: [
          { name: 'processDescription', type: 'string', description: 'Description of the process to analyze', required: true },
        ],
      },
    };

    return mockTemplates[id] || null;
  }

  /**
   * Call AI service (placeholder implementation)
   */
  private async callAIService(
    prompt: string,
    context: PromptExecutionContext
  ): Promise<{ content: string; tokens?: number; cost?: number; metadata?: Record<string, unknown> }> {
    // This would be implemented to call the actual AI service
    // For now, return a mock response
    const mockResponse = `AI Response to: ${prompt.substring(0, 100)}...`;
    
    return {
      content: mockResponse,
      tokens: Math.floor(Math.random() * 1000) + 100,
      cost: Math.random() * 0.01,
      metadata: {
        model: context.model.model,
        provider: context.model.provider,
      },
    };
  }

  /**
   * Get cached prompt
   */
  private getCached(id: string): CacheEntry | null {
    const cached = this.cache.get(id);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(id);
      return null;
    }
    
    return cached;
  }

  /**
   * Set cached prompt
   */
  private setCache(id: string, prompt: CompiledPrompt): void {
    if (!this.config.enableCaching) return;
    
    this.cache.set(id, {
      prompt,
      timestamp: Date.now(),
      ttl: this.config.cacheTimeout!,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all loaded templates
   */
  getLoadedTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would be calculated in real implementation
    };
  }
}

/**
 * Default prompt loader instance
 */
export const promptLoader = new PromptLoader();
