import { NextResponse } from "next/server";

// Helper to perform a lightweight DuckDuckGo HTML search
async function searchWeb(query: string): Promise<string[]> {
  try {
    const url = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (!res.ok) return [];
    
    const html = await res.text();
    const results: string[] = [];
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    let count = 0;
    
    while ((match = snippetRegex.exec(html)) !== null && count < 4) {
      const snippet = match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      results.push(snippet);
      count++;
    }
    
    return results;
  } catch (err) {
    console.warn("DuckDuckGo web search failed:", err);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NVIDIA_API_KEY is not configured on the cloud server" },
        { status: 500 }
      );
    }

    // Extract the latest query from the messages history
    const userMessages = messages.filter((m: any) => m.role === "user");
    const lastUserQuery = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : "";

    // Perform real-time web search in the backend to query Google/DDG
    let searchContext = "";
    if (lastUserQuery) {
      const searchResults = await searchWeb(lastUserQuery + " UGC NET Electronics");
      if (searchResults.length > 0) {
        searchContext = `Real-time search results for reference:\n${searchResults.map((s, i) => `[Result ${i+1}]: ${s}`).join("\n")}\n\n`;
      }
    }

    const systemPrompt = `You are the Socratic AI Tutor for UGC NET Electronics & Communication.
Your goal is to explain and teach concepts deeply, ensuring the student thoroughly understands the topics.
Use the provided real-time search context to ground your knowledge and ensure absolute accuracy.

Follow these rules to deliver a premium educational experience:
1. EXPLAIN AND TEACH FIRST: When a student asks a question or wants to learn a topic, provide a comprehensive, detailed, and clear explanation of the topic. Do not just reply with another question or short statement.
2. USE REAL-WORLD ANALOGIES: Introduce the topic with an intuitive, real-world analogy to help the student visualize the concept.
3. DETAILED STEP-BY-STEP MATHEMATICS: Break down all mathematical equations, derivations, and formulas step-by-step.
   - Use double-dollars $$...$$ for block math equations.
   - Use single-dollars $...$ for inline math.
   - Ensure you explain what each variable represents and outline boundary conditions (e.g. saturation vs triode limits).
4. INCORPORATE RICH HIGHLIGHT BLOCKS:
   - Use "> [!KEY] key takeaway" for essential insights.
   - Use "> [!FORMULA] formula" for key mathematical equations.
   - Use "> [!NOTE] note" for background information or exam tips.
5. SOCRATIC WRAP-UP: At the very end of your detailed explanation, ask one or two high-quality guided questions (Checkpoint) to verify the student's understanding and prompt them to think critically about the next logical step.`;

    const systemMessage = {
      role: "system",
      content: systemPrompt
    };

    // Prepend search context if available
    const activeMessages = [...messages];
    if (searchContext && activeMessages.length > 0) {
      const lastMsg = activeMessages[activeMessages.length - 1];
      if (lastMsg.role === "user") {
        lastMsg.content = `${searchContext}User Question: ${lastMsg.content}`;
      }
    }

    const startTime = Date.now();
    
    // Call NVIDIA NIM API
    let response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        temperature: 0.3,
        max_tokens: 1500,
        messages: [
          systemMessage,
          ...activeMessages
        ]
      })
    });

    // Fallback model if Llama 3.1 70B fails
    if (!response.ok) {
      console.warn("meta/llama-3.1-70b-instruct failed, falling back to meta/llama3-8b-instruct");
      response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta/llama3-8b-instruct",
          temperature: 0.3,
          max_tokens: 1500,
          messages: [
            systemMessage,
            ...activeMessages
          ]
        })
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `NVIDIA API error: ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    const cleanText = data.choices?.[0]?.message?.content || "";
    const latency = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

    return NextResponse.json({ response: cleanText, latency });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
