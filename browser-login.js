/**
 * headed Browser Login Tool for Google SSO / ChatGPT
 * 
 * Run this to manually log in once and save cookies/sessions:
 *   node browser-login.js gemini
 *   node browser-login.js chatgpt
 */

const { chromium } = require("playwright");
const path = require("path");

const target = process.argv[2];
if (target !== "gemini" && target !== "chatgpt") {
  console.error("❌ Error: Specify either 'gemini' or 'chatgpt' as an argument.");
  console.error("   Example: node browser-login.js gemini");
  process.exit(1);
}

const urls = {
  gemini: "https://gemini.google.com/",
  chatgpt: "https://chatgpt.com/"
};

const profileDir = path.join(__dirname, "profiles", "google_profile");

async function launchLogin() {
  console.log(`\n======================================================`);
  console.log(`🚀 Launching persistent headed browser for: ${target.toUpperCase()}`);
  console.log(`📁 Saved Profile: ${profileDir}`);
  console.log(`======================================================\n`);
  console.log("👉 INSTRUCTIONS:");
  console.log("1. Wait for the browser window to open.");
  console.log("2. Click 'Continue with Google' or perform standard login.");
  console.log("3. Complete any Multi-Factor Authentication (2FA/MFA) steps.");
  console.log("4. Once you are logged in and see the chat dashboard, CLOSE the browser window.");
  console.log("5. The login session will be saved for background headless workers!\n");

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false, // Must be false to let the user log in!
    viewport: { width: 1280, height: 800 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled"
    ]
  });

  const page = await context.newPage();
  await page.goto(urls[target]);

  // Keep connection open until user closes window
  page.on("close", async () => {
    console.log("\n✅ Browser window closed. Login session saved successfully!");
    await context.close();
    process.exit(0);
  });
}

launchLogin().catch(err => {
  console.error("❌ Error running browser login:", err);
  process.exit(1);
});
