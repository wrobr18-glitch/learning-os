/**
 * Connection Verification Script for Learning OS
 * 
 * Verifies:
 * 1. Supabase Database connection (reads student profiles)
 * 2. OpenRouter API connection (queries meta-llama/llama-3.3-70b-instruct)
 * 3. Neo4j Aura Graph Database connection (queries Cypher version)
 * 
 * Run using:
 *   node --env-file=.env.local test-connection.js
 */

const { createClient } = require("@supabase/supabase-js");
const neo4j = require("neo4j-driver");

// Load Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;

const neo4jUri = process.env.NEO4J_URI;
const neo4jUser = process.env.NEO4J_USERNAME;
const neo4jPassword = process.env.NEO4J_PASSWORD;

async function runTest() {
  console.log("=========================================");
  console.log("      LEARNING OS CONNECTION TEST        ");
  console.log("=========================================\n");

  // 1. Test Supabase Database Connection
  console.log("1. Testing Supabase connection...");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Error: Missing Supabase environment variables in .env.local\n");
  } else {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    try {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      console.log("✅ Supabase Connection: SUCCESS");
      console.log(`📊 Found ${data.length} student profile(s) in database:`);
      console.log(JSON.stringify(data, null, 2));
      console.log("");
    } catch (err) {
      console.error("❌ Supabase Connection: FAILED");
      console.error(err.message || err);
      console.log("");
    }
  }

  // 2. Test OpenRouter Connection & Speed
  console.log("2. Testing OpenRouter API connection...");
  if (!openRouterKey) {
    console.error("❌ Error: Missing OPENROUTER_API_KEY in .env.local\n");
  } else {
    const startTime = Date.now();
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://learning-os.vercel.app",
          "X-Title": "Learning OS Test Script"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct",
          messages: [
            { role: "system", content: "You are the Learning OS Cognitive Engine." },
            { role: "user", content: "Say hello and give a one-sentence tip on semiconductor physics." }
          ]
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`HTTP Error: ${response.statusText} (${response.status}) - ${errBody}`);
      }

      const result = await response.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log("✅ OpenRouter Connection: SUCCESS");
      console.log(`⚡ Latency (Llama 3.3): ${duration}s`);
      console.log(`🤖 AI Response: "${result.choices?.[0]?.message?.content?.trim()}"`);
      console.log("");
    } catch (err) {
      console.error("❌ OpenRouter Connection: FAILED");
      console.error(err.message || err);
      console.log("");
    }
  }

  // 3. Test Neo4j Aura Database Connection
  console.log("3. Testing Neo4j Aura connection...");
  if (!neo4jUri || !neo4jPassword) {
    console.error("❌ Error: Missing Neo4j environment variables in .env.local\n");
  } else {
    const driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
    try {
      const session = driver.session();
      const result = await session.run("RETURN 1 AS test");
      const value = result.records[0].get("test").toNumber();
      
      console.log("✅ Neo4j Connection: SUCCESS");
      console.log(`🌿 Database: Connected successfully (Query returned: ${value})`);
      console.log("");
      await session.close();
    } catch (err) {
      console.error("❌ Neo4j Connection: FAILED");
      console.error(err.message || err);
      console.log("");
    } finally {
      await driver.close();
    }
  }

  console.log("=========================================");
}

runTest();
