import { getNeo4jDriver } from "./index";
import { supabase } from "database";

export interface ConceptContext {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  importance: number;
  prerequisites: string[];
}

export interface StudentMasteryState {
  conceptId: string;
  knowledge: number;
  understanding: number;
  application: number;
}

export interface ContextPackage {
  studentName: string;
  targetExam: string;
  activeConcept: ConceptContext;
  prerequisites: ConceptContext[];
  masteryState: Record<string, StudentMasteryState>;
  linkedFormulas: string[];
  suggestedQuestions: string[];
}

/**
 * Context Builder Engine for Learning OS
 * Merges student progress data (Supabase) with Graph relations (Neo4j) 
 * to assemble comprehensive teaching contexts.
 */
export class ContextBuilder {
  /**
   * Builds the Context Package for a student studying a specific concept
   */
  async buildContextPackage(studentId: string, conceptId: string): Promise<ContextPackage> {
    const driver = getNeo4jDriver();
    const session = driver.session();

    try {
      // 1. Fetch Student Profile from Supabase
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("name, target_exam")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;

      const studentName = studentData?.name || "Learner";
      const targetExam = studentData?.target_exam || "UGC NET Electronics";

      // 2. Fetch Active Concept & its Prerequisites from Neo4j Aura Graph
      const graphResult = await session.run(
        `MATCH (c:Concept {id: $conceptId})
         OPTIONAL MATCH (c)-[:REQUIRES|BUILDS_UPON]->(p:Concept)
         RETURN c, collect(p) AS prereqs`,
        { conceptId }
      );

      if (graphResult.records.length === 0) {
        throw new Error(`Concept with ID ${conceptId} was not found in the Knowledge Graph.`);
      }

      const activeConceptRecord = graphResult.records[0].get("c").properties;
      const prerequisitesRecords = graphResult.records[0].get("prereqs");

      const activeConcept: ConceptContext = {
        id: activeConceptRecord.id,
        name: activeConceptRecord.name,
        description: activeConceptRecord.description,
        difficulty: activeConceptRecord.difficulty?.toNumber() || 3,
        importance: activeConceptRecord.importance?.toNumber() || 3,
        prerequisites: []
      };

      const prerequisites: ConceptContext[] = prerequisitesRecords.map((p: any) => {
        const props = p.properties;
        activeConcept.prerequisites.push(props.id);
        return {
          id: props.id,
          name: props.name,
          description: props.description,
          difficulty: props.difficulty?.toNumber() || 3,
          importance: props.importance?.toNumber() || 3,
          prerequisites: []
        };
      });

      // 3. Fetch Student Mastery records from Supabase
      const conceptIdsToFetch = [conceptId, ...prerequisites.map(p => p.id)];
      const { data: masteryData, error: masteryError } = await supabase
        .from("mastery")
        .select("concept_id, knowledge_score, understanding_score, application_score")
        .eq("student_id", studentId)
        .in("concept_id", conceptIdsToFetch);

      if (masteryError) throw masteryError;

      const masteryState: Record<string, StudentMasteryState> = {};
      masteryData?.forEach((m: any) => {
        masteryState[m.concept_id] = {
          conceptId: m.concept_id,
          knowledge: Number(m.knowledge_score || 0),
          understanding: Number(m.understanding_score || 0),
          application: Number(m.application_score || 0)
        };
      });

      // Populate default empty mastery scores for missing records
      conceptIdsToFetch.forEach(id => {
        if (!masteryState[id]) {
          masteryState[id] = { conceptId: id, knowledge: 0, understanding: 0, application: 0 };
        }
      });

      // 4. Fetch linked formulas from Neo4j (mocked placeholder return for now)
      const linkedFormulas: string[] = [];

      // 5. Fetch suggested questions from Neo4j/Supabase (mocked placeholder return for now)
      const suggestedQuestions: string[] = [];

      return {
        studentName,
        targetExam,
        activeConcept,
        prerequisites,
        masteryState,
        linkedFormulas,
        suggestedQuestions
      };

    } finally {
      await session.close();
    }
  }

  /**
   * Formats the Context Package into a clean string ready for prompt template integration
   */
  formatContextString(pkg: ContextPackage): string {
    let output = `Student Profile:
  - Name: ${pkg.studentName}
  - Target Exam: ${pkg.targetExam}

Active Topic of Study:
  - Concept: ${pkg.activeConcept.name}
  - Description: ${pkg.activeConcept.description}
  - Difficulty Level: ${pkg.activeConcept.difficulty}/5
  - Student Current Mastery: Knowledge: ${pkg.masteryState[pkg.activeConcept.id].knowledge}%, Understanding: ${pkg.masteryState[pkg.activeConcept.id].understanding}%, Application: ${pkg.masteryState[pkg.activeConcept.id].application}%

Prerequisites Required:\n`;

    if (pkg.prerequisites.length === 0) {
      output += "  - None (Introductory concept)\n";
    } else {
      pkg.prerequisites.forEach(p => {
        const mastery = pkg.masteryState[p.id];
        output += `  - ${p.name}: ${p.description} (Mastery: Knowledge: ${mastery.knowledge}%, Understanding: ${mastery.understanding}%)\n`;
      });
    }

    return output;
  }
}
