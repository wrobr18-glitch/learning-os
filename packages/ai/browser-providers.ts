import { Page, BrowserContext } from "playwright";
import { getPersistentBrowserContext, AIProvider, AIRequestOptions } from "./index";

// Resilient selectors based on priority lists (Selector Manager pattern)
const SELECTORS = {
  gemini: {
    input: [
      'div[contenteditable="true"]',
      'textarea[aria-label="Prompt"]',
      '.chat-input textarea',
      '#chat-input'
    ],
    sendBtn: [
      'button[aria-label="Send message"]',
      'button.send-button',
      'button[type="submit"]',
      'button:has-text("Send")'
    ],
    responses: [
      '.message-content',
      'model-response',
      '.chat-response-content',
      '.response-container-content'
    ],
    streamingIndicator: [
      '.progress-linear',
      '.loading-spinner',
      '.streaming-cursor',
      '.stop-button'
    ]
  },
  chatgpt: {
    input: [
      'div[contenteditable="true"]',
      '[placeholder*="Ask anything"]',
      'textarea#prompt-textarea',
      'textarea[placeholder*="Ask anything"]',
      'textarea[placeholder*="Message ChatGPT"]'
    ],
    sendBtn: [
      'button[data-testid="send-button"]',
      'button.send-button',
      'button[aria-label="Send prompt"]',
      'button[type="submit"]',
      'button:has(svg)'
    ],
    responses: [
      'div[data-message-author-role="assistant"]',
      '.markdown.prose',
      '.chatgpt-response'
    ],
    streamingIndicator: [
      'button[aria-label="Stop generating"]',
      '.streaming',
      '.stop-generating-button'
    ]
  }
};

/**
 * Helper to find the first matching selector from a priority list
 */
async function findSelector(page: Page, selectors: string[]): Promise<string | null> {
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

/**
 * Base Browser Provider Wrapper
 */
export class BrowserAIProvider implements AIProvider {
  id: string;
  name: string;
  private profilePath: string;
  private targetUrl: string;
  private config: { input: string[]; sendBtn: string[]; responses: string[]; streamingIndicator: string[] };

  constructor(id: string, name: string, profilePath: string, targetUrl: string, config: typeof SELECTORS.gemini) {
    this.id = id;
    this.name = name;
    this.profilePath = profilePath;
    this.targetUrl = targetUrl;
    this.config = config;
  }

  async generateText(prompt: string, systemPrompt = "", options: AIRequestOptions = {}): Promise<string> {
    let context: BrowserContext | null = null;
    try {
      // Launch browser context using saved persistent profile
      context = await getPersistentBrowserContext(this.profilePath, true);
      const page = await context.newPage();
      
      await page.goto(this.targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

      // 1. Resolve prompt input box
      const inputSelector = await findSelector(page, this.config.input);
      if (!inputSelector) {
        throw new Error(`Could not find prompt input field. Ensure you are logged in by running the headed login script.`);
      }

      // 2. Prepend system prompt guidelines if specified
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser Request: ${prompt}` : prompt;

      // 3. Type the prompt
      await page.fill(inputSelector, fullPrompt);
      await page.keyboard.press("Enter");

      // Fallback submit click if pressing enter didn't submit
      const sendBtnSelector = await findSelector(page, this.config.sendBtn);
      if (sendBtnSelector) {
        try {
          await page.click(sendBtnSelector, { timeout: 2000 });
        } catch {
          // Accept failure if Enter already submitted
        }
      }

      // 4. Wait for text streaming to complete
      // We check for the disappearance of indicators or wait for the send button to become active again
      await page.waitForTimeout(2000); // initial delay to let streaming start
      const indicator = await findSelector(page, this.config.streamingIndicator);
      if (indicator) {
        try {
          await page.waitForSelector(indicator, { state: "detached", timeout: 45000 });
        } catch {
          // Proceed if timeout is reached, we will extract what is generated
        }
      } else {
        // Fallback sleep if indicator not detected
        await page.waitForTimeout(6000);
      }

      // 5. Extract responses
      const responseSelector = await findSelector(page, this.config.responses);
      if (!responseSelector) {
        throw new Error("Could not find generated response elements.");
      }

      const elements = await page.$$(responseSelector);
      if (elements.length === 0) {
        throw new Error("No responses generated on page.");
      }

      const lastElement = elements[elements.length - 1];
      const text = await lastElement.innerText();
      return text.trim();

    } catch (err: any) {
      throw new Error(`[${this.name} Error]: ${err.message}`);
    } finally {
      if (context) {
        await context.close();
      }
    }
  }

  async health(): Promise<boolean> {
    let context: BrowserContext | null = null;
    try {
      context = await getPersistentBrowserContext(this.profilePath, true);
      const page = await context.newPage();
      const res = await page.goto(this.targetUrl, { timeout: 10000 });
      return (res?.status() || 0) < 400;
    } catch {
      return false;
    } finally {
      if (context) await context.close();
    }
  }
}

/**
 * Gemini Browser Provider
 */
export class GeminiBrowserProvider extends BrowserAIProvider {
  constructor(profilePath: string) {
    super("gemini-browser", "Gemini Browser Provider", profilePath, "https://gemini.google.com/", SELECTORS.gemini);
  }
}

/**
 * ChatGPT Browser Provider
 */
export class ChatGPTBrowserProvider extends BrowserAIProvider {
  constructor(profilePath: string) {
    super("chatgpt-browser", "ChatGPT Browser Provider", profilePath, "https://chatgpt.com/", SELECTORS.chatgpt);
  }
}
