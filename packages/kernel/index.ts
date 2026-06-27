export interface ConceptState {
  id: string;
  name: string;
  mastery: number; // 0 to 100
  prerequisites: string[];
}

export interface StudentContext {
  studentId: string;
  subject: string;
  activeGoal: string;
  weakConcepts: string[];
  activeSessionId?: string;
}

/**
 * Checks if a concept's prerequisites are met based on student mastery states.
 * Educational Policy: A prerequisite is satisfied if mastery >= 70%.
 */
export const checkPrerequisites = (
  concept: ConceptState,
  allConcepts: Record<string, ConceptState>
): { satisfied: boolean; missing: string[] } => {
  const missing: string[] = [];

  for (const prereqId of concept.prerequisites) {
    const prereq = allConcepts[prereqId];
    if (!prereq || prereq.mastery < 70) {
      missing.push(prereq ? prereq.name : prereqId);
    }
  }

  return {
    satisfied: missing.length === 0,
    missing
  };
};

/**
 * Workflow Engine Definitions
 */
export type WorkflowStep = "RETRIEVE_CONTEXT" | "GENERATE_LESSON" | "ASSESS" | "UPDATE_GENOME" | "SCHEDULE_REVISION";

export interface WorkflowInstance {
  id: string;
  type: "TEACH" | "REVISION" | "QUIZ";
  steps: WorkflowStep[];
  currentStepIndex: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
}

export const createTeachWorkflow = (sessionId: string): WorkflowInstance => {
  return {
    id: sessionId,
    type: "TEACH",
    steps: ["RETRIEVE_CONTEXT", "GENERATE_LESSON", "ASSESS", "UPDATE_GENOME", "SCHEDULE_REVISION"],
    currentStepIndex: 0,
    status: "PENDING"
  };
};

export * from "./context-manager";
export * from "./policy-engine";
export * from "./teacher";
export * from "./assessment";
export * from "./scheduler";
