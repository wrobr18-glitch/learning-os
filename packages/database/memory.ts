import { supabase } from "./index";

export interface ConceptMasteryInput {
  studentId: string;
  conceptId: string;
  knowledgeScore?: number;
  understandingScore?: number;
  applicationScore?: number;
  retentionScore?: number;
  confidenceScore?: number;
  speedScore?: number;
  teachingScore?: number;
}

export interface MistakeLogInput {
  studentId: string;
  questionId: string;
  conceptId: string;
  mistakeType: string;
  reasoning?: string;
}

/**
 * Database Memory & Student Genome Tracking Helpers
 */

/**
 * Upserts a student's concept mastery scores.
 */
export async function updateConceptMastery(input: ConceptMasteryInput): Promise<void> {
  const updates: any = {
    student_id: input.studentId,
    concept_id: input.conceptId,
    last_updated: new Date()
  };

  if (input.knowledgeScore !== undefined) updates.knowledge_score = input.knowledgeScore;
  if (input.understandingScore !== undefined) updates.understanding_score = input.understandingScore;
  if (input.applicationScore !== undefined) updates.application_score = input.applicationScore;
  if (input.retentionScore !== undefined) updates.retention_score = input.retentionScore;
  if (input.confidenceScore !== undefined) updates.confidence_score = input.confidenceScore;
  if (input.speedScore !== undefined) updates.speed_score = input.speedScore;
  if (input.teachingScore !== undefined) updates.teaching_score = input.teachingScore;

  const { error } = await supabase
    .from("mastery")
    .upsert(updates, { onConflict: "student_id,concept_id" });

  if (error) {
    throw new Error(`Failed to update concept mastery: ${error.message}`);
  }
}

/**
 * Retrieves all mastery scores for a student.
 */
export async function getStudentMastery(studentId: string) {
  const { data, error } = await supabase
    .from("mastery")
    .select("*")
    .eq("student_id", studentId);

  if (error) {
    throw new Error(`Failed to get student mastery: ${error.message}`);
  }

  return data;
}

/**
 * Logs a student's question attempt mistake.
 */
export async function logStudentMistake(input: MistakeLogInput): Promise<void> {
  const { error } = await supabase
    .from("mistakes")
    .insert({
      student_id: input.studentId,
      question_id: input.questionId,
      concept_id: input.conceptId,
      mistake_type: input.mistakeType,
      reasoning: input.reasoning || ""
    });

  if (error) {
    throw new Error(`Failed to log student mistake: ${error.message}`);
  }
}

/**
 * Updates a student's learning preference weights.
 */
export async function updateStudentPreferences(
  studentId: string,
  preferences: {
    visualWeight?: number;
    examplesWeight?: number;
    theoryWeight?: number;
    practiceWeight?: number;
    animationWeight?: number;
  }
): Promise<void> {
  const updates: any = {
    student_id: studentId,
    last_updated: new Date()
  };

  if (preferences.visualWeight !== undefined) updates.visual_weight = preferences.visualWeight;
  if (preferences.examplesWeight !== undefined) updates.visual_weight = preferences.examplesWeight;
  if (preferences.theoryWeight !== undefined) updates.theory_weight = preferences.theoryWeight;
  if (preferences.practiceWeight !== undefined) updates.practice_weight = preferences.practiceWeight;
  if (preferences.animationWeight !== undefined) updates.animation_weight = preferences.animationWeight;

  const { error } = await supabase
    .from("preferences")
    .upsert(updates, { onConflict: "student_id" });

  if (error) {
    throw new Error(`Failed to update student preferences: ${error.message}`);
  }
}
