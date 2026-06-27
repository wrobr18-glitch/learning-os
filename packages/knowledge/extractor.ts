import { OpenRouterAIProvider } from "ai";

export interface ExtractedConcept {
  name: string;
  description: string;
  difficulty: number; // 1-5
  importance: number; // 1-5
  prerequisites: string[]; // Names/keywords of prerequisites
}

export interface ExtractedFormula {
  equation: string;
  name: string;
  variables: string[]; // e.g. ["Id", "Vgs", "Vth"]
  units: string[]; // e.g. ["Amperes", "Volts", "Volts"]
  derivationSummary: string;
}

export interface ExtractedQuestion {
  text: string;
  type: "MCQ" | "NUMERICAL" | "SHORT_ANSWER";
  difficulty: number; // 1-5
  options: string[]; // Empty for numerical
  answer: string;
  solution: string;
  hints: string[];
}

export interface ExtractionResult {
  concepts: ExtractedConcept[];
  formulas: ExtractedFormula[];
  questions: ExtractedQuestion[];
}

const SYSTEM_PROMPT = `You are the Learning OS Ingestion Engine.
Your job is to read text passages from educational materials (specifically electronics and UGC NET syllabi) and extract structured knowledge.
You must output ONLY a valid JSON object matching the requested schema. Do not write any markdown code fences, headers, or conversational text.

JSON Output Schema:
{
  "concepts": [
    {
      "name": "Concept name",
      "description": "2-3 sentence definition/details",
      "difficulty": 3,
      "importance": 4,
      "prerequisites": ["prerequisite name 1", "prerequisite name 2"]
    }
  ],
  "formulas": [
    {
      "equation": "LaTeX or raw string equation (e.g. Id = K * (Vgs - Vth)^2)",
      "name": "Name of the formula",
      "variables": ["variable name 1"],
      "units": ["unit 1"],
      "derivationSummary": "Short derivation context"
    }
  ],
  "questions": [
    {
      "text": "Question statement",
      "type": "MCQ",
      "difficulty": 3,
      "options": ["A) Opt 1", "B) Opt 2"],
      "answer": "A",
      "solution": "Step-by-step solution details",
      "hints": ["First hint"]
    }
  ]
}`;

/**
 * AI-powered Knowledge Extractor Service
 */
export class KnowledgeExtractor {
  private aiProvider: OpenRouterAIProvider;

  constructor(apiKey: string) {
    this.aiProvider = new OpenRouterAIProvider(apiKey);
  }

  /**
   * Reads a text passage and returns extracted Concepts, Formulas, and Questions.
   */
  async extractFromPassage(textPassage: string): Promise<ExtractionResult> {
    const prompt = `Read the following text passage and extract all concepts, formulas, and test questions. 
If no concepts, formulas, or questions are found, return empty arrays.

Passage:
"""
${textPassage}
"""`;

    try {
      const responseText = await this.aiProvider.generateText(prompt, SYSTEM_PROMPT, {
        temperature: 0.1, // low temp for structured accuracy
        maxTokens: 2048
      });

      // Clean response (strip potential markdown wrapping if the model ignored instructions)
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.substring(7);
      }
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.substring(3);
      }
      if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
      cleanJson = cleanJson.trim();

      const result: ExtractionResult = JSON.parse(cleanJson);
      
      // Ensure all arrays exist
      return {
        concepts: result.concepts || [],
        formulas: result.formulas || [],
        questions: result.questions || []
      };

    } catch (err: any) {
      console.error("AI Ingestion Extraction Error:", err.message);
      // Return empty structures on failure to prevent pipeline crashes
      return { concepts: [], formulas: [], questions: [] };
    }
  }
}
