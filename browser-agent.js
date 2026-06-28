/**
 * Learning OS — Background Browser Automation Agent
 * 
 * Runs locally on your machine. Polls the Supabase `browser_tasks` table,
 * executes headless browser prompts utilizing your logged-in profiles, 
 * and writes responses back.
 * 
 * Run using:
 *   node --env-file=.env.local browser-agent.js
 */

const { createClient } = require("@supabase/supabase-js");
const { chromium } = require("playwright");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Error: Missing Supabase configurations in env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const profileDir = path.join(__dirname, "profiles", "google_profile");

const SELECTORS = {
  gemini: {
    url: "https://gemini.google.com/",
    input: ['div[contenteditable="true"]', 'textarea[aria-label="Prompt"]', '#chat-input'],
    sendBtn: ['button[aria-label="Send message"]', 'button.send-button', 'button[type="submit"]'],
    responses: ['.message-content', 'model-response', '.chat-response-content'],
    streamingIndicator: ['.progress-linear', '.loading-spinner', '.streaming-cursor', '.stop-button']
  },
  chatgpt: {
    url: "https://chatgpt.com/",
    input: [
      'div[contenteditable="true"]',
      '[placeholder*="Ask anything"]',
      'textarea#prompt-textarea',
      'textarea[placeholder*="Ask anything"]',
      'textarea[placeholder*="Message ChatGPT"]'
    ],
    sendBtn: ['button[data-testid="send-button"]', 'button.send-button', 'button[type="submit"]', 'button:has(svg)'],
    responses: ['div[data-message-author-role="assistant"]', '.markdown.prose'],
    streamingIndicator: ['button[aria-label="Stop generating"]', '.streaming']
  }
};

async function findSelector(page, selectors) {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) return selector;
    } catch {
      continue;
    }
  }
  return null;
}

async function processTask(task) {
  const config = SELECTORS[task.provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${task.provider}`);
  }

  console.log(`🤖 Starting task ${task.id} for ${task.provider.toUpperCase()}...`);

  // Launch browser context using saved persistent profile
  // BROWSER_HEADLESS defaults to false for bypass compatibility
  const isHeadless = process.env.BROWSER_HEADLESS === "true";
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: isHeadless,
    viewport: { width: 1280, height: 800 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled"
    ]
  });

  let page;
  try {
    page = await context.newPage();
    await page.goto(config.url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // 1. Resolve prompt input
    const inputSelector = await findSelector(page, config.input);
    if (!inputSelector) {
      // Capture screenshot for debugging before throwing error
      await page.screenshot({ path: path.join(__dirname, "error-screenshot.png") });
      throw new Error(`Input field not found. Screenshot saved to error-screenshot.png. Please log in first by running: node browser-login.js ${task.provider}`);
    }

    const fullPrompt = task.system_prompt 
      ? `${task.system_prompt}\n\nUser Request: ${task.prompt}` 
      : task.prompt;

    // 2. Type and Submit prompt
    await page.fill(inputSelector, fullPrompt);
    await page.keyboard.press("Enter");

    const sendBtnSelector = await findSelector(page, config.sendBtn);
    if (sendBtnSelector) {
      try {
        await page.click(sendBtnSelector, { timeout: 2000 });
      } catch {}
    }

    // 3. Wait for streaming response to finish
    await page.waitForTimeout(2000);
    const indicator = await findSelector(page, config.streamingIndicator);
    if (indicator) {
      try {
        await page.waitForSelector(indicator, { state: "detached", timeout: 45000 });
      } catch {}
    } else {
      await page.waitForTimeout(6000);
    }

    // 4. Extract result
    const responseSelector = await findSelector(page, config.responses);
    if (!responseSelector) {
      throw new Error("Could not locate response block on page.");
    }

    // Evaluate in page context to extract clean text with math symbols intact
    const cleanTextRaw = await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      if (elements.length === 0) return null;
      
      // Get the last response element
      const el = elements[elements.length - 1];
      const clone = el.cloneNode(true);

      // 1. Process KaTeX math elements
      const katexElements = clone.querySelectorAll(".katex");
      katexElements.forEach((katexEl) => {
        const annotation = katexEl.querySelector('annotation[encoding="application/x-tex"]');
        if (annotation) {
          const formula = annotation.textContent || "";
          const isDisplay = katexEl.closest(".katex-display") !== null;
          const replacement = isDisplay ? `\n$$${formula}$$\n` : `$${formula}$`;
          katexEl.parentNode?.replaceChild(document.createTextNode(replacement), katexEl);
        }
      });

      // 2. Process MathJax elements (if present)
      // MathJax v2 script tags
      const mathjaxScripts = clone.querySelectorAll('script[type^="math/tex"]');
      mathjaxScripts.forEach((script) => {
        const formula = script.textContent || "";
        const typeAttr = script.getAttribute("type") || "";
        const isDisplay = typeAttr.includes("display");
        const replacement = isDisplay ? `\n$$${formula}$$\n` : `$${formula}$`;
        script.parentNode?.replaceChild(document.createTextNode(replacement), script);
      });

      // MathJax v3 container tags
      const mjxContainers = clone.querySelectorAll("mjx-container");
      mjxContainers.forEach((container) => {
        const mathEl = container.querySelector("math");
        if (mathEl) {
          const altText = mathEl.getAttribute("alttext") || "";
          if (altText) {
            const isDisplay = container.getAttribute("display") === "true";
            const replacement = isDisplay ? `\n$$${altText}$$\n` : `$${altText}$`;
            container.parentNode?.replaceChild(document.createTextNode(replacement), container);
          }
        }
      });

      // 3. Remove copy buttons and other UI noise inside code blocks
      const copyButtons = clone.querySelectorAll("button");
      copyButtons.forEach((btn) => btn.remove());

      return clone.innerText || clone.textContent || "";
    }, responseSelector);

    if (!cleanTextRaw) {
      throw new Error("Response was empty or blocked.");
    }

    const cleanText = cleanTextRaw.trim();

    if (!cleanText) {
      throw new Error("Extracted response text is empty.");
    }

    // Update database row to completed
    const { error } = await supabase
      .from("browser_tasks")
      .update({ status: "COMPLETED", response: cleanText, updated_at: new Date() })
      .eq("id", task.id);

    if (error) throw error;
    console.log(`✅ Task ${task.id} completed successfully!`);

  } catch (err) {
    console.error(`❌ Task ${task.id} failed:`, err.message);
    try {
      if (page) {
        await page.screenshot({ path: path.join(__dirname, "error-screenshot.png") });
      }
    } catch (ssErr) {
      console.warn("Could not save diagnostic screenshot:", ssErr.message);
    }
    await supabase
      .from("browser_tasks")
      .update({ status: "FAILED", error: err.message, updated_at: new Date() })
      .eq("id", task.id);
  } finally {
    await context.close();
  }
}

async function startAgent() {
  console.log("\n======================================================");
  console.log("   LEARNING OS BACKGROUND BROWSER AUTOMATION AGENT    ");
  console.log("   Status: Running. Polling queue table...            ");
  console.log("======================================================\n");

  setInterval(async () => {
    try {
      // Find one PENDING task
      const { data, error } = await supabase
        .from("browser_tasks")
        .select("*")
        .eq("status", "PENDING")
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        const task = data[0];
        
        // Claim the task to prevent multiple agents processing it
        const { data: claimData, error: claimError } = await supabase
          .from("browser_tasks")
          .update({ status: "IN_PROGRESS" })
          .eq("id", task.id)
          .eq("status", "PENDING")
          .select();

        if (claimError) throw claimError;
        
        if (claimData && claimData.length > 0) {
          // Successfully claimed, process it!
          await processTask(task);
        }
      }
    } catch (err) {
      console.error("Queue Polling Error:", err.message);
    }
  }, 2000);
}

startAgent();
