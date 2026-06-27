import { AIProvider, AIRequestOptions } from "./index";

export interface RouteRequestOptions extends AIRequestOptions {
  requireFastResponse?: boolean;
  requireHighReasoning?: boolean;
}

export interface ProviderMetrics {
  latencyHistory: number[];
  successCount: number;
  failureCount: number;
  lastHealthCheck: boolean;
}

/**
 * Capability Router for Learning OS
 * Scores and routes AI requests dynamically to ensure high speed and reliability
 */
export class CapabilityRouter {
  private providers: Map<string, AIProvider> = new Map();
  private metrics: Map<string, ProviderMetrics> = new Map();

  constructor() {
    // Initialize metrics maps
  }

  registerProvider(provider: AIProvider) {
    this.providers.set(provider.id, provider);
    this.metrics.set(provider.id, {
      latencyHistory: [],
      successCount: 0,
      failureCount: 0,
      lastHealthCheck: true
    });
  }

  /**
   * Scores a provider based on task preferences:
   * Score = Base Capability + Latency Score + Success Score - Cost Penalty
   */
  private scoreProvider(
    providerId: string,
    options: RouteRequestOptions
  ): number {
    const metric = this.metrics.get(providerId);
    if (!metric || !metric.lastHealthCheck) return -100; // Skip dead providers

    let score = 50; // base

    // Calculate latency factor (average of last 3 runs)
    let avgLatency = 3.0; // default assumption
    if (metric.latencyHistory.length > 0) {
      const sum = metric.latencyHistory.slice(-3).reduce((a, b) => a + b, 0);
      avgLatency = sum / Math.min(metric.latencyHistory.length, 3);
    }

    // Success Rate
    const totalRuns = metric.successCount + metric.failureCount;
    const successRate = totalRuns > 0 ? metric.successCount / totalRuns : 1.0;

    // Apply routing weights based on preferences
    if (options.requireFastResponse) {
      // Prioritize low latency (lower latency = higher score)
      score += (10 - avgLatency) * 5; 
      // Penalize slow browser automation
      if (providerId.includes("browser")) score -= 25; 
    }

    if (options.requireHighReasoning) {
      // Prioritize premium models
      if (providerId === "openrouter") score += 30; // Access to Claude 3.5/Llama 3.3
      if (providerId === "chatgpt-browser") score += 20;
    }

    // Success rate weight
    score += successRate * 15;

    return score;
  }

  /**
   * Routes a prompt to the best provider with automatic failover fallback
   */
  async executeTextQuery(
    prompt: string,
    systemPrompt = "You are the Learning OS Cognitive Engine.",
    options: RouteRequestOptions = {}
  ): Promise<{ response: string; providerId: string; duration: number }> {
    
    // Sort providers by current score
    const rankedProviders = Array.from(this.providers.keys())
      .map(id => ({ id, score: this.scoreProvider(id, options) }))
      .sort((a, b) => b.score - a.score);

    if (rankedProviders.length === 0 || rankedProviders[0].score < -50) {
      throw new Error("No healthy AI providers available to handle request.");
    }

    // Try executing with failover fallback list
    for (const entry of rankedProviders) {
      const provider = this.providers.get(entry.id)!;
      const metric = this.metrics.get(entry.id)!;
      const startTime = Date.now();

      try {
        console.log(`📡 Router: Routing query to ${provider.name} (Score: ${entry.score.toFixed(1)})`);
        
        const response = await provider.generateText(prompt, systemPrompt, options);
        
        const duration = (Date.now() - startTime) / 1000;
        
        // Update success metrics
        metric.successCount++;
        metric.latencyHistory.push(duration);
        if (metric.latencyHistory.length > 10) metric.latencyHistory.shift();

        return { response, providerId: provider.id, duration };

      } catch (err: any) {
        console.warn(`⚠️ Router: Provider ${provider.name} failed: ${err.message}. Retrying fallback...`);
        metric.failureCount++;
        metric.lastHealthCheck = false; // mark temporarily unhealthy
      }
    }

    throw new Error("All registered AI providers failed to execute query.");
  }

  /**
   * Refreshes health checks of all registered providers
   */
  async runHealthChecks() {
    for (const [id, provider] of this.providers.entries()) {
      const metric = this.metrics.get(id)!;
      try {
        metric.lastHealthCheck = await provider.health();
      } catch {
        metric.lastHealthCheck = false;
      }
    }
  }
}
