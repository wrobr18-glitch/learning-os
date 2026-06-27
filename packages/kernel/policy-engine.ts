import { ContextPackage } from "knowledge";

export interface PolicyEvaluation {
  allowStudy: boolean;
  blockReason?: string;
  missingPrerequisites: string[];
}

/**
 * Kernel Policy Engine
 * Enforces structured educational rules to guarantee cognitive mastery.
 */
export class PolicyEngine {
  /**
   * Evaluates if a student is ready to study a concept based on context parameters.
   * Rule: All prerequisite concepts must have a combined mastery of >= 70%.
   */
  evaluatePrerequisites(contextPkg: ContextPackage): PolicyEvaluation {
    const missingPrerequisites: string[] = [];

    contextPkg.prerequisites.forEach(prereq => {
      const mastery = contextPkg.masteryState[prereq.id];
      if (!mastery) {
        missingPrerequisites.push(prereq.name);
        return;
      }

      // Prerequisite mastery condition: average of knowledge + understanding must be >= 70
      const averageMastery = (mastery.knowledge + mastery.understanding) / 2;
      if (averageMastery < 70) {
        missingPrerequisites.push(`${prereq.name} (Current: ${averageMastery.toFixed(0)}%)`);
      }
    });

    if (missingPrerequisites.length > 0) {
      return {
        allowStudy: false,
        blockReason: `Prerequisites not met. You must master the following topics first: ${missingPrerequisites.join(", ")}.`,
        missingPrerequisites
      };
    }

    return {
      allowStudy: true,
      missingPrerequisites: []
    };
  }

  /**
   * Enforces mandatory revision policy.
   * Rule: If student has a pending revision overdue for > 3 days, flag revision as high-priority.
   */
  isRevisionUrgent(overdueDays: number): boolean {
    return overdueDays >= 3;
  }
}
