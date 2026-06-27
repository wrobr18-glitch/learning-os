import { supabase } from "database";

export interface ActiveSession {
  sessionId: string;
  studentId: string;
  subject: string;
  chapter: string;
  activeWorkflow: string;
  currentStepIndex: number;
}

/**
 * Kernel Session and Context Manager
 * Manages runtime state, session instantiation, and progression through workflows.
 */
export class KernelContextManager {
  /**
   * Initializes a new learning session in the database
   */
  async startSession(
    studentId: string,
    subject: string,
    chapter: string,
    workflowName: string
  ): Promise<ActiveSession> {
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        student_id: studentId,
        subject,
        chapter,
        active_workflow: workflowName,
        current_step_index: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start learning session: ${error.message}`);
    }

    return {
      sessionId: data.id,
      studentId: data.student_id,
      subject: data.subject,
      chapter: data.chapter,
      activeWorkflow: data.active_workflow,
      currentStepIndex: data.current_step_index
    };
  }

  /**
   * Retrieves an active learning session by ID
   */
  async getSession(sessionId: string): Promise<ActiveSession | null> {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error || !data) return null;

    return {
      sessionId: data.id,
      studentId: data.student_id,
      subject: data.subject,
      chapter: data.chapter,
      activeWorkflow: data.active_workflow,
      currentStepIndex: data.current_step_index
    };
  }

  /**
   * Advances the workflow execution step index in the session state
   */
  async advanceWorkflowStep(sessionId: string, nextStepIndex: number): Promise<void> {
    const { error } = await supabase
      .from("sessions")
      .update({
        current_step_index: nextStepIndex,
        created_at: new Date() // touch timestamp
      })
      .eq("id", sessionId);

    if (error) {
      throw new Error(`Failed to advance session workflow step: ${error.message}`);
    }
  }

  /**
   * Closes the active session by writing the end_time timestamp
   */
  async endSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from("sessions")
      .update({
        end_time: new Date()
      })
      .eq("id", sessionId);

    if (error) {
      throw new Error(`Failed to close learning session: ${error.message}`);
    }
  }
}
