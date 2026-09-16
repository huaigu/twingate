import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const out = process.argv[2] || "/tmp/signalpass-v4-reference";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const width of [1440, 390]) {
  const page = await browser.newPage({
    viewport: { width, height: width === 390 ? 844 : 1000 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  for (const name of [
    "landing",
    "index",
    "agent",
    "discover",
    "widget",
    "compose",
    "inbox",
  ]) {
    await page.goto(`http://localhost:4324/${name}.html`, {
      waitUntil: "networkidle",
    });
    await page.screenshot({
      path: `${out}/${name}-${width}.png`,
      fullPage: true,
    });
    console.log(
      name,
      width,
      await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      })),
    );
  }
  await page.close();
}
await browser.close();
