import { ContextPackage } from "knowledge";
import { OpenRouterAIProvider } from "ai";

const SOCRATIC_SYSTEM_PROMPT = `You are the Learning OS Socratic Tutor.
Your goal is to help students learn concepts deeply by guiding them through questioning, analogy, and structured explanation.
Follow these rules:
1. Do NOT just dump direct answers. Explain the core mechanism using a clear, real-world analogy.
2. Be extremely clear and use Markdown and LaTeX formatting for equations if necessary.
3. Break the topic down into logical parts. Explain the first part, then ask a simple conceptual question to verify the student's understanding before moving forward.
4. Keep your responses concise and engaging. Do not overload the student.`;

/**
 * Teacher Service & Socratic Dialogue Manager
 */
export class TeacherService {
  private aiProvider: OpenRouterAIProvider;

  constructor(apiKey: string) {
    // Initialize AI provider (meta-llama/llama-3.3-70b-instruct or other OpenRouter model)
    this.aiProvider = new OpenRouterAIProvider(apiKey);
  }

  /**
   * Generates a Socratic explanation for the student based on their context package
   */
  async explainConcept(contextPkg: ContextPackage, userQuery?: string): Promise<string> {
    const studentProfile = `Student: ${contextPkg.studentName}
Target Exam: ${contextPkg.targetExam}
Active Concept: ${contextPkg.activeConcept.name}
Active Concept Description: ${contextPkg.activeConcept.description}
Mastery Levels: Knowledge: ${contextPkg.masteryState[contextPkg.activeConcept.id].knowledge}%, Understanding: ${contextPkg.masteryState[contextPkg.activeConcept.id].understanding}%`;

    const prerequisites = contextPkg.prerequisites.length > 0
      ? `Prerequisites:\n${contextPkg.prerequisites.map(p => `  - ${p.name}: ${p.description}`).join("\n")}`
      : "Prerequisites: None (Introductory topic)";

    const prompt = `Here is the current learning context:
=========================================
${studentProfile}

${prerequisites}
=========================================

${userQuery ? `The student asked/replied: "${userQuery}"` : "The student wants to start learning this concept. Provide the introductory Socratic explanation and ask a guiding verification question."}

Generate the Socratic response:`;

    try {
      const response = await this.aiProvider.generateText(prompt, SOCRATIC_SYSTEM_PROMPT, {
        temperature: 0.3,
        maxTokens: 1200
      });
      return response;
    } catch (err: any) {
      throw new Error(`Teacher Service failed to generate explanation: ${err.message}`);
    }
  }
}
