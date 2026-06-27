import { chromium, BrowserContext } from "playwright";

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Core AI Provider Interface
 * All AI services (Teacher, Assessment, Ingestion) interact with LLMs through this interface,
 * keeping services independent of specific API specs.
 */
export interface AIProvider {
  id: string;
  name: string;
  generateText(prompt: string, systemPrompt?: string, options?: AIRequestOptions): Promise<string>;
  generateEmbeddings?(text: string): Promise<number[]>;
  health(): Promise<boolean>;
}

/**
 * OpenRouter API Provider Implementation
 * Standard model: meta-llama/llama-3.3-70b-instruct (Fast & high reasoning capability)
 */
export class OpenRouterAIProvider implements AIProvider {
  id = "openrouter";
  name = "OpenRouter AI Provider";
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = "meta-llama/llama-3.3-70b-instruct") {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async generateText(prompt: string, systemPrompt = "You are the Learning OS Cognitive Engine.", options: AIRequestOptions = {}): Promise<string> {
    if (!this.apiKey) throw new Error("OpenRouter API key is not configured.");

    const model = options.model || this.defaultModel;
    const temp = options.temperature ?? 0.2;
    const maxTokens = options.maxTokens ?? 1024;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://learning-os.vercel.app",
        "X-Title": "Learning OS"
      },
      body: JSON.stringify({
        model,
        temperature: temp,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error: ${response.statusText} (${response.status}) - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      return res.ok;
    } catch {
      return false;
    }
  }
}

/**
 * NVIDIA NIM API Provider Implementation
 * Primary model: meta/llama-3-8b-instruct or mistralai/mixtral-8x7b-instruct
 */
export class NvidiaAIProvider implements AIProvider {
  id = "nvidia";
  name = "NVIDIA NIM Provider";
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = "meta/llama3-8b-instruct") {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async generateText(prompt: string, systemPrompt = "You are the Learning OS Cognitive Engine.", options: AIRequestOptions = {}): Promise<string> {
    if (!this.apiKey) throw new Error("NVIDIA API key is not configured.");

    const model = options.model || this.defaultModel;
    const temp = options.temperature ?? 0.2;
    const maxTokens = options.maxTokens ?? 1024;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: temp,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`NVIDIA API error: ${response.statusText} (${response.status}) - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async health(): Promise<boolean> {
    // Check key configuration and simple endpoints
    return !!this.apiKey;
  }
}

/**
 * Hugging Face Feature Extraction Provider
 * Generates 384-dimension sentence embeddings (compatible with our Supabase VECTOR(384) schema).
 * Default model: sentence-transformers/all-MiniLM-L6-v2
 */
export class HuggingFaceEmbeddingProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "sentence-transformers/all-MiniLM-L6-v2") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    if (!this.apiKey) throw new Error("Hugging Face API key is not configured.");

    const response = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: text })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Hugging Face embedding error: ${response.statusText} (${response.status}) - ${err}`);
    }

    const embeddings: number[] = await response.json();
    return embeddings;
  }
}

/**
 * Persistent Browser Context Builder for Playwright Workers
 */
export const getPersistentBrowserContext = async (
  profilePath: string,
  headless: boolean = true
): Promise<BrowserContext> => {
  const context = await chromium.launchPersistentContext(profilePath, {
    headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled"
    ],
    viewport: { width: 1280, height: 800 }
  });
  return context;
};
