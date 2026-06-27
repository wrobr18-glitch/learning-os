import { supabase } from "database";

export interface RevisionScheduleInput {
  studentId: string;
  conceptId: string;
  isCorrect: boolean;
  confidenceScore: number; // Scale 1-5 (1 = guessed, 5 = highly confident)
  currentIntervalDays?: number;
}

export interface DueRevision {
  id: string;
  conceptId: string;
  conceptName: string;
  intervalDays: number;
}

/**
 * Spaced Repetition Scheduler & Revision Engine
 */
export class RevisionScheduler {
  /**
   * Calculates the next revision interval based on a variant of SuperMemo (SM-2)
   * modified with student self-reported confidence.
   */
  calculateNextInterval(input: RevisionScheduleInput): { nextInterval: number; quality: number } {
    // Quality factor (0-5) based on correctness and confidence
    // If correct: quality matches confidence (3-5)
    // If incorrect: quality is low (0-2)
    let quality = 0;
    if (input.isCorrect) {
      quality = Math.max(3, Math.min(5, input.confidenceScore));
    } else {
      quality = Math.max(0, Math.min(2, input.confidenceScore - 2));
    }

    const currentInterval = input.currentIntervalDays || 1;
    let nextInterval = 1;

    if (quality >= 3) {
      if (currentInterval === 1) {
        nextInterval = 4; // First interval: 4 days
      } else if (currentInterval === 4) {
        nextInterval = 10; // Second interval: 10 days
      } else {
        // Subsequent intervals: multiply by ease factor (normally ~2.5)
        // Adjust multiplier based on quality (4 = 2.4x, 5 = 2.8x)
        const easeFactor = 1.3 + (quality * 0.3); 
        nextInterval = Math.round(currentInterval * easeFactor);
      }
    } else {
      // If student got it wrong, reset interval back to 1 day
      nextInterval = 1;
    }

    // Safeguard minimum interval to 1 day
    return {
      nextInterval: Math.max(1, nextInterval),
      quality
    };
  }

  /**
   * Schedules the next revision date in the database
   */
  async scheduleRevision(input: RevisionScheduleInput): Promise<void> {
    const { nextInterval, quality } = this.calculateNextInterval(input);
    
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + nextInterval);
    
    // Format date string as YYYY-MM-DD
    const dateString = scheduledDate.toISOString().split("T")[0];

    const { error } = await supabase
      .from("revisions")
      .insert({
        student_id: input.studentId,
        concept_id: input.conceptId,
        scheduled_date: dateString,
        completed: false,
        interval_days: nextInterval,
        retention_score: quality * 20 // Map quality to 0-100% retention forecast
      });

    if (error) {
      throw new Error(`Failed to schedule revision in database: ${error.message}`);
    }
  }

  /**
   * Retrieves all revisions due today or overdue for a student
   */
  async getDueRevisions(studentId: string): Promise<DueRevision[]> {
    const today = new Date().toISOString().split("T")[0];

    // Fetch active revisions where scheduled_date <= today
    const { data, error } = await supabase
      .from("revisions")
      .select(`
        id,
        concept_id,
        interval_days,
        concepts ( name )
      `)
      .eq("student_id", studentId)
      .eq("completed", false)
      .lte("scheduled_date", today);

    if (error) {
      throw new Error(`Failed to fetch due revisions: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      conceptId: row.concept_id,
      conceptName: row.concepts?.name || "Unknown Concept",
      intervalDays: row.interval_days || 1
    }));
  }

  /**
   * Marks a scheduled revision as completed
   */
  async completeRevision(revisionId: string): Promise<void> {
    const { error } = await supabase
      .from("revisions")
      .update({
        completed: true
      })
      .eq("id", revisionId);

    if (error) {
      throw new Error(`Failed to update revision completion: ${error.message}`);
    }
  }
}
