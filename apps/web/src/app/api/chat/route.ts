import { NextResponse } from "next/server";
import { OpenRouterAIProvider } from "../../../../../../packages/ai";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured on cloud server" },
        { status: 500 }
      );
    }

    const systemMessage = {
      role: "system",
      content: `You are the Socratic AI Tutor for UGC NET Electronics & Communication.
Your goal is to explain and teach concepts deeply, ensuring the student thoroughly understands the topics.
Follow these rules to deliver a premium educational experience:
1. EXPLAIN AND TEACH FIRST: When a student asks a question or wants to learn a topic, provide a comprehensive, detailed, and clear explanation of the topic. Do not just reply with another question or short statement.
2. USE REAL-WORLD ANALOGIES: Introduce the topic with an intuitive, real-world analogy to help the student visualize the concept.
3. DETAILED STEP-BY-STEP MATHEMATICS: Break down all mathematical equations, derivations, and formulas step-by-step.
   - Use double-dollars $$...$$ for block math equations.
   - Use single-dollars $...$ for inline math.
   - Ensure you explain what each variable represents and outline boundary conditions.
4. INCORPORATE RICH HIGHLIGHT BLOCKS:
   - Use "> [!KEY] key takeaway" for essential insights.
   - Use "> [!FORMULA] formula" for key mathematical equations.
   - Use "> [!NOTE] note" for background information or exam tips.
5. SOCRATIC WRAP-UP: At the very end of your detailed explanation, ask one or two high-quality guided questions (Checkpoint) to verify the student's understanding and prompt them to think critically about the next logical step.`
    };

    const startTime = Date.now();
    
    // Call OpenRouter completions directly
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://learning-os.vercel.app",
        "X-Title": "Learning OS"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        temperature: 0.3,
        max_tokens: 1500,
        messages: [
          systemMessage,
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `OpenRouter API error: ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    const cleanText = data.choices?.[0]?.message?.content || "";
    const latency = ((Date.now() - startTime) / 1000).toFixed(1) + "s";

    return NextResponse.json({ response: cleanText, latency });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
