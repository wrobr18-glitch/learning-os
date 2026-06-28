import { NextResponse } from "next/server";
import { getNeo4jDriver } from "knowledge";
import { supabase, supabaseAdmin } from "database";

// Predefined layout coordinates for the 6 core seeded concepts
const LAYOUT_MAP: Record<string, { x: number; y: number }> = {
  "electronics.semiconductor.physics": { x: 250, y: 200 },
  "electronics.semiconductor.pn_junction": { x: 100, y: 300 },
  "electronics.devices.diode": { x: 250, y: 330 },
  "electronics.devices.fet": { x: 400, y: 300 },
  "electronics.devices.mosfet_structure": { x: 400, y: 110 },
  "electronics.devices.mosfet_equations": { x: 250, y: 70 },
};

export async function GET() {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    // 1. Fetch concepts and prerequisites from Neo4j
    const cypherQuery = `
      MATCH (c:Concept)
      OPTIONAL MATCH (c)-[r:REQUIRES|BUILDS_UPON]->(dep:Concept)
      RETURN c.id AS id, c.name AS name, c.chapter AS chapter, c.difficulty AS difficulty,
             collect(dep.id) AS dependencies
    `;
    const result = await session.run(cypherQuery);
    
    const neoNodes = result.records.map((record) => ({
      id: record.get("id"),
      label: record.get("name"),
      chapter: record.get("chapter"),
      difficulty: record.get("difficulty"),
      dependencies: record.get("dependencies").filter(Boolean),
    }));

    // 2. Fetch student mastery scores from Supabase using admin client to bypass RLS
    const dbClient = supabaseAdmin || supabase;
    const { data: masteryData, error: masteryErr } = await dbClient
      .from("mastery")
      .select("concept_id, knowledge_score");

    const masteryMap: Record<string, number> = {};
    if (!masteryErr && masteryData) {
      masteryData.forEach((row) => {
        masteryMap[row.concept_id] = Number(row.knowledge_score || 0);
      });
    }

    // 3. Construct dynamic nodes with layout coordinates and mastery scores
    const nodes = neoNodes.map((n, index) => {
      const coord = LAYOUT_MAP[n.id] || {
        x: 100 + (index % 3) * 150,
        y: 100 + Math.floor(index / 3) * 100,
      };
      // Default to 0 if not found in Supabase mastery table
      const mastery = masteryMap[n.id] ?? 0;

      return {
        id: n.id,
        label: n.label,
        chapter: n.chapter,
        x: coord.x,
        y: coord.y,
        mastery,
      };
    });

    // 4. Construct edges (connections) based on prerequisites
    const edges: { from: string; to: string }[] = [];
    neoNodes.forEach((node) => {
      node.dependencies.forEach((depId: string) => {
        // depId is the prerequisite (source), node.id is the target
        edges.push({
          from: depId,
          to: node.id,
        });
      });
    });

    return NextResponse.json({ success: true, nodes, edges });

  } catch (err: any) {
    console.error("API Error in knowledge-graph route:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch knowledge graph data" },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
