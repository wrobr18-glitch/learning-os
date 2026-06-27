import { OpenRouterAIProvider } from "ai";

export interface GeneratedQuestion {
  text: string;
  options: string[]; // e.g. ["A) ...", "B) ..."]
  answer: string;    // "A", "B", "C", or "D"
  solution: string;
  hints: string[];
}

export interface AssessmentResult {
  isCorrect: boolean;
  solution: string;
  mistakeType?: string;
  mistakeReasoning?: string;
}

const GENERATOR_SYSTEM_PROMPT = `You are the Learning OS Assessment Engine.
Your task is to generate a high-quality, conceptual, or numerical question mapped to the student's target exam (UGC NET Electronics).
You must output ONLY a valid JSON object matching the requested schema. Do not write any markdown code fences or other text.

JSON Schema:
{
  "text": "Question statement detailing conditions or parameters",
  "options": [
    "A) Option A text",
    "B) Option B text",
    "C) Option C text",
    "D) Option D text"
  ],
  "answer": "A", // Correct option letter: A, B, C, or D
  "solution": "Step-by-step mathematical or logical solution showing derivation",
  "hints": [
    "Hint 1: Initial focus direction",
    "Hint 2: Relevant equation/formula suggestion"
  ]
}`;

const CLASSIFIER_SYSTEM_PROMPT = `You are the Learning OS Mistakes Classifier.
Analyze the student's incorrect answer, the correct solution, and the student's explanation of how they solved it.
Classify their mistake into one of these specific categories:
- "formula_error": Used the wrong mathematical equation.
- "unit_error": Calculation error due to scaling units (e.g., mA vs A, pF vs uF).
- "concept_confusion": Misunderstood the underlying physics or operational mode.
- "calculation_error": Mathematical arithmetic slip during addition/multiplication.
- "guess": Random guess without structural reasoning.
- "misread": Misunderstood or skipped reading parameters in the question text.

Output ONLY a JSON matching this schema:
{
  "mistakeType": "one_of_the_categories_above",
  "reasoning": "1-2 sentence explanation of why they made this mistake"
}`;

/**
 * Assessment & Mistakes Classification Service
 */
export class AssessmentService {
  private aiProvider: OpenRouterAIProvider;

  constructor(apiKey: string) {
    this.aiProvider = new OpenRouterAIProvider(apiKey);
  }

  /**
   * Generates a new adaptive question on a concept for the student
   */
  async generateQuestion(conceptName: string, difficulty: number): Promise<GeneratedQuestion> {
    const prompt = `Generate a level-${difficulty} (out of 5) question for the concept: "${conceptName}" suitable for a UGC NET Electronics test. Ensure the question is conceptually rigorous.`;

    try {
      const responseText = await this.aiProvider.generateText(prompt, GENERATOR_SYSTEM_PROMPT, {
        temperature: 0.7, // higher temp for question variety
        maxTokens: 1200
      });

      let cleanJson = responseText.trim();
      if (cleanJson.startsWith("```json")) cleanJson = cleanJson.substring(7);
      if (cleanJson.startsWith("```")) cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith("```")) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      cleanJson = cleanJson.trim();

      const question: GeneratedQuestion = JSON.parse(cleanJson);
      return question;
    } catch (err: any) {
      throw new Error(`Assessment Service failed to generate question: ${err.message}`);
    }
  }

  /**
   * Evaluates student's answer submission and classifies mistakes if incorrect
   */
  async evaluateSubmission(
    question: GeneratedQuestion,
    submittedAnswer: string,
    studentReasoning = ""
  ): Promise<AssessmentResult> {
    const isCorrect = submittedAnswer.trim().toUpperCase() === question.answer.trim().toUpperCase();

    if (isCorrect) {
      return {
        isCorrect: true,
        solution: question.solution
      };
    }

    // Classify mistake if incorrect
    const prompt = `Question:
"${question.text}"
Correct Answer: Option ${question.answer}
Correct Solution:
"${question.solution}"

Student Submitted: Option ${submittedAnswer}
Student Explanation of their work: "${studentReasoning || "None provided."}"`;

    try {
      const responseText = await this.aiProvider.generateText(prompt, CLASSIFIER_SYSTEM_PROMPT, {
        temperature: 0.1,
        maxTokens: 500
      });

      let cleanJson = responseText.trim();
      if (cleanJson.startsWith("```json")) cleanJson = cleanJson.substring(7);
      if (cleanJson.startsWith("```")) cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith("```")) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      cleanJson = cleanJson.trim();

      const classification = JSON.parse(cleanJson);

      return {
        isCorrect: false,
        solution: question.solution,
        mistakeType: classification.mistakeType || "concept_confusion",
        mistakeReasoning: classification.reasoning || "Misunderstood the parameters or calculation."
      };
    } catch (err) {
      // Fallback response on classification failure
      return {
        isCorrect: false,
        solution: question.solution,
        mistakeType: "concept_confusion",
        mistakeReasoning: "Made an error in calculation or concept implementation."
      };
    }
  }
}
