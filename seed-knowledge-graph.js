/**
 * Seed Knowledge Graph Script for Learning OS
 * 
 * Connects to Neo4j Aura and seeds the initial UGC NET Electronics concept fabric:
 *   - Concepts: Semiconductor Physics, PN Junction, Diode, FET, MOSFET
 *   - Relationships: REQUIRES, BUILDS_UPON, EXPLAINED_BY
 * 
 * Run using:
 *   node --env-file=.env.local seed-knowledge-graph.js
 */

const neo4j = require("neo4j-driver");

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

const concepts = [
  {
    id: "electronics.semiconductor.physics",
    name: "Semiconductor Physics",
    subject: "Electronics",
    chapter: "Semiconductor Devices",
    difficulty: 2,
    importance: 5,
    description: "Fundamental physics of carrier transport, intrinsic/extrinsic doping, energy band diagrams, carrier concentration equations, and mobility in semiconductor crystals."
  },
  {
    id: "electronics.semiconductor.pn_junction",
    name: "PN Junction Electrostatics",
    subject: "Electronics",
    chapter: "Semiconductor Devices",
    difficulty: 3,
    importance: 5,
    description: "Electrostatics of the p-n junction interface under zero bias, forward bias, and reverse bias conditions. Covers depletion width, barrier potential, and current equations."
  },
  {
    id: "electronics.devices.diode",
    name: "Diode Applications",
    subject: "Electronics",
    chapter: "Electronic Circuits",
    difficulty: 2,
    importance: 4,
    description: "Behavior of diodes in rectifiers, clippers, clampers, and voltage regulation (Zener diodes). Analyzes equivalent models and load lines."
  },
  {
    id: "electronics.devices.fet",
    name: "Field Effect Transistors (FET)",
    subject: "Electronics",
    chapter: "Semiconductor Devices",
    difficulty: 3,
    importance: 4,
    description: "Introduction to voltage-controlled current devices. Focuses on Junction FET (JFET) structures, transfer characteristics, and drain currents."
  },
  {
    id: "electronics.devices.mosfet_structure",
    name: "MOSFET Device Structure",
    subject: "Electronics",
    chapter: "Semiconductor Devices",
    difficulty: 4,
    importance: 5,
    description: "Metal-Oxide-Semiconductor Field-Effect Transistor structure, including depletion and enhancement types, threshold voltage equations, and channel formation."
  },
  {
    id: "electronics.devices.mosfet_equations",
    name: "MOSFET Transconductance & Current Equations",
    subject: "Electronics",
    chapter: "Semiconductor Devices",
    difficulty: 4,
    importance: 5,
    description: "Derivation of drain current equations in linear and saturation regions, channel length modulation, and transconductance calculations."
  }
];

const relationships = [
  {
    from: "electronics.semiconductor.pn_junction",
    to: "electronics.semiconductor.physics",
    type: "REQUIRES"
  },
  {
    from: "electronics.devices.diode",
    to: "electronics.semiconductor.pn_junction",
    type: "REQUIRES"
  },
  {
    from: "electronics.devices.fet",
    to: "electronics.semiconductor.physics",
    type: "REQUIRES"
  },
  {
    from: "electronics.devices.mosfet_structure",
    to: "electronics.semiconductor.pn_junction",
    type: "REQUIRES"
  },
  {
    from: "electronics.devices.mosfet_structure",
    to: "electronics.devices.fet",
    type: "BUILDS_UPON"
  },
  {
    from: "electronics.devices.mosfet_equations",
    to: "electronics.devices.mosfet_structure",
    type: "REQUIRES"
  }
];

async function runSeed() {
  console.log("=========================================");
  console.log("    SEEDING NEO4J KNOWLEDGE GRAPH        ");
  console.log("=========================================\n");

  if (!uri || !password) {
    console.error("❌ Error: Missing Neo4j environment variables in .env.local\n");
    return;
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    // 1. Clear database to ensure fresh start
    console.log("🧹 Cleaning existing nodes and relationships...");
    await session.run("MATCH (n) DETACH DELETE n");

    // 2. Create constraints if they do not exist
    console.log("🔧 Configuring database constraints...");
    await session.run("CREATE CONSTRAINT UNIQUE_CONCEPT_ID IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE");

    // 3. Create Concept Nodes
    console.log("🌿 Inserting Concept Nodes...");
    for (const concept of concepts) {
      await session.run(
        `CREATE (c:Concept {
          id: $id,
          name: $name,
          subject: $subject,
          chapter: $chapter,
          difficulty: toInteger($difficulty),
          importance: toInteger($importance),
          description: $description,
          created_at: datetime()
        })`,
        concept
      );
      console.log(`   + Created Concept: "${concept.name}"`);
    }

    // 4. Create Relationships
    console.log("🔗 Creating Concept Relationship Edges...");
    for (const rel of relationships) {
      await session.run(
        `MATCH (a:Concept {id: $from})
         MATCH (b:Concept {id: $to})
         CREATE (a)-[r:${rel.type}]->(b)`,
        { from: rel.from, to: rel.to }
      );
      console.log(`   + Linked: (${rel.from}) -[:${rel.type}]-> (${rel.to})`);
    }

    console.log("\n✅ Knowledge Graph Seeded Successfully!");
  } catch (err) {
    console.error("❌ Seeding FAILED:");
    console.error(err.message || err);
  } finally {
    await session.close();
    await driver.close();
  }

  console.log("\n=========================================");
}

runSeed();
