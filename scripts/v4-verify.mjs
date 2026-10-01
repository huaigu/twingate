import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const origin = process.env.V4_BASE_URL || "http://localhost:3004";
const out = process.env.V4_QA_DIR || "/tmp/signalpass-v4-qa";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => sessionStorage.setItem('signalpass-demo', '1'));
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  const assertSessionAlignment = async (label) => {
    await page.locator('#session-action').waitFor();
    const layout = await page.evaluate(() => {
      const header = document.querySelector('.site-header,.preview-header');
      const slot = document.getElementById('session-slot');
      const h = header.getBoundingClientRect(), b = document.getElementById('session-action').getBoundingClientRect();
      const children = [...header.children].filter(e => {
        const r = e.getBoundingClientRect(), s = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && s.position !== 'absolute' && s.visibility !== 'hidden';
      }).map(e => e.getBoundingClientRect());
      const overlaps = children.some((a,i) => children.slice(i+1).some(b => Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
      return { integrated: slot.parentElement === header, contained: b.left >= h.left && b.right <= h.right + 1 && b.top >= h.top && b.bottom <= h.bottom + 1, height: b.height, overlaps };
    });
    assert(layout.integrated && layout.contained && !layout.overlaps, 'Account/navigation geometry: ' + label + JSON.stringify(layout));
    assert(layout.height >= 43.5, 'Account target size: ' + label);
  };
  const routes = [
    ["landing", "/"],
    ["profile", "/profile/import"],
    ["agent", "/agent"],
    ["discover", "/discover"],
    ["widget", "/widget/create"],
    ["compose", "/introductions/new"],
    ["inbox", "/inbox"],
    ["widget-preview", "/widget/preview"],
  ];
  for (const width of [1440, 1920, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const [name, route] of routes) {
      await page.goto(origin + route, { waitUntil: "networkidle" });
      assert.equal(
        await page
          .locator("iframe,.prototype-nav,.mobile-page-nav,.review-controls")
          .count(),
        0,
        `Review UI remains: ${route}`,
      );
      const geometry = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        missing: [...document.images]
          .filter((i) => !i.complete || i.naturalWidth === 0)
          .map((i) => i.src),
      }));
      assert(
        geometry.scroll <= width + 1,
        `Horizontal overflow: ${route} at ${width}`,
      );
      assert.deepEqual(geometry.missing, [], `Missing image: ${route}`);
      await assertSessionAlignment(route + ' at ' + width);
      await page.screenshot({
        path: `${out}/${name}-${width}.png`,
        fullPage: true,
      });
      console.log("capture", name, width);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + "/profile/import");
  await page.locator("[data-source=x]").click();
  await page.locator("#source-url").fill("https://x.com/alex");
  await page.getByRole("button", { name: "Save source", exact: true }).click();
  await page.locator("[data-edit=profile]").click();
  await page.locator("#edit-name").fill("Jamie Chen");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.locator("[data-action=review-draft]").click();
  await page.locator("[data-action=approve-profile]").click();
  await page.waitForURL("**/agent");
  assert(await page.locator("[name=visibility][value=private]").isChecked());
  await page.locator("#matching-toggle").uncheck();
  await page.reload();
  assert(
    !(await page.locator("#matching-toggle").isChecked()),
    "Matching toggle did not persist",
  );
  assert(
    await page.locator("[name=visibility][value=private]").isChecked(),
    "Visibility was coupled to matching",
  );
  await page.locator("#matching-toggle").check();
  await page.locator("[data-action=save-agent]").click();
  await page
    .getByRole("link", { name: "Discover people →", exact: true })
    .click();
  await page.waitForURL("**/discover");
  await page.locator("[data-person=Maya]").click();
  await page
    .getByRole("link", { name: "Draft an introduction", exact: false })
    .click();
  await page.waitForURL("**/introductions/new/maya");
  assert.equal(
    await page.locator(".intro-portrait.them h3").innerText(),
    "Maya",
  );
  await page
    .locator("#intro-field-1")
    .fill("Hi Maya — I would love to talk about community design.");
  await page.reload();
  assert(
    (await page.locator("#intro-field-1").inputValue()).includes("Hi Maya"),
  );
  await page.locator("[data-action=toggle-context]").click();
  await page.locator("#hide-context").click();
  await page.locator("[data-action=approve-introduction]").click();
  await page.locator("#dialog-confirm").click();
  await page.waitForURL("**/receipt");
  assert(
    (await page.locator("#receipt-people").innerText()).includes(
      "Jamie Chen → Maya",
    ),
  );
  assert(
    (await page.locator("#receipt-context").innerText()).includes(
      "message only",
    ),
  );
  assert(
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("signalpass-v4"));
      const r = s.introductions.at(-1);
      return r.senderBio === "" && r.interests.length === 0;
    }),
  );
  const receiptURL = page.url();
  await page.locator("#recipient-link").click();
  await page.waitForURL("**/inbox/*");
  assert(
    (await page.locator(".v4-result-message").innerText()).includes("Hi Maya"),
  );
  await page.locator("[data-action=ask-context]").click();
  await page
    .locator("#context-question")
    .fill("What kind of communities are you exploring?");
  await page
    .getByRole("button", { name: "Save context request", exact: true })
    .click();
  await page.goto(receiptURL);
  assert.equal(
    await page.locator("#receipt-status").innerText(),
    "Context requested",
  );
  await page
    .locator("#reply-context")
    .fill("I organize open source reading groups and small community events.");
  await page
    .getByRole("button", { name: "Approve and add context", exact: true })
    .click();
  await page.waitForLoadState("networkidle");
  assert.equal(
    await page.locator("#receipt-status").innerText(),
    "Awaiting a response",
  );
  await page.locator("#recipient-link").click();
  assert(
    (await page.locator(".v4-result-message").innerText()).includes(
      "reading groups",
    ),
  );
  await page.locator("[data-action=accept-introduction]").click();
  await page.locator("#dialog-confirm").click();
  assert(await page.locator("[data-action=decline-introduction]").isDisabled());
  await page.goto(receiptURL);
  assert.equal(await page.locator("#receipt-status").innerText(), "Accepted");
  for (const width of [1440, 1920, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await assertSessionAlignment('receipt at ' + width);
    await page.screenshot({ path: out + '/receipt-' + width + '.png', fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + "/widget/create");
  assert.equal(await page.locator("#widget-name").inputValue(), "Jamie Chen");
  await page.locator("#widget-name").fill("Jamie & friends");
  await page.locator("[data-persona=rohan]").click();
  await page.locator("[data-remove-widget-tag]").first().click();
  const tagCount = await page.locator("[data-widget-tags] .widget-tag").count();
  await page.reload();
  assert.equal(
    await page.locator("[data-widget-tags] .widget-tag").count(),
    tagCount,
  );
  assert(
    (await page.locator("#embed-code").innerText()).includes(
      `${origin}/v4/embed/widget.js`,
    ),
  );
  await page.goto(origin + "/widget/preview", { waitUntil: "networkidle" });
  assert.equal(
    await page.locator("#signalpass-widget h2").innerText(),
    "Jamie & friends",
  );
  await page.goto(origin + "/discover");
  await page.locator("#curiosity").fill("zzqvnoresults");
  await page
    .locator("#discovery-form")
    .evaluate((form) => form.requestSubmit());
  await page.locator("#clear-search").waitFor();
  await page.locator("#clear-search").click();
  await page.waitForFunction(
    () =>
      document.querySelector(".people-grid").getAttribute("aria-busy") ===
      "false",
  );
  assert.equal(await page.locator("[data-person]:visible").count(), 3);
  // Agent import: malformed JSON is recoverable; imported text never executes.
  await page.goto(origin + "/profile/import");
  await page.locator("[data-source=agent]").click();
  await page.locator("#agent-json").fill("{bad json");
  await page.getByRole("button", { name: "Import draft", exact: true }).click();
  assert(
    (await page.locator("#import-error").innerText()).includes("valid JSON"),
  );
  await page
    .locator("#agent-json")
    .fill(
      JSON.stringify({
        name: "<img src=x onerror=alert(1)>",
        bio: "Research and creative work",
      }),
    );
  await page.getByRole("button", { name: "Import draft", exact: true }).click();
  assert.equal(await page.locator("[data-profile=name] img").count(), 0);
  assert(
    (await page.locator("[data-profile=name]").innerText()).includes("<img"),
  );
  await page.locator("[data-edit=profile]").click();
  await page.locator("#edit-name").fill("Jamie Chen");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  // Decline has a separate terminal branch; pending context cannot silently revert it.
  await page.goto(origin + "/introductions/new/leo");
  await page.locator("[data-action=approve-introduction]").click();
  await page.locator("#dialog-confirm").click();
  await page.waitForURL("**/receipt");
  const declineReceipt = page.url();
  await page.locator("#recipient-link").click();
  await page.locator("[data-action=decline-introduction]").click();
  await page.locator("#dialog-confirm").click();
  assert(await page.locator("[data-action=accept-introduction]").isDisabled());
  await page.goto(declineReceipt);
  assert.equal(await page.locator("#receipt-status").innerText(), "Declined");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${out}/receipt-390.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + "/agent");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Discover", exact: true })
    .click();
  await page.waitForURL("**/discover");
  await page.locator("[data-person=Leo]").click();
  await page.keyboard.press("Escape");
  assert(!(await page.locator("#app-dialog").evaluate((d) => d.open)));
  // All primary links resolve; responsive breakpoints keep controls in bounds.
  for (const width of [768, 1180, 1280, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/profile/import", "/discover", "/inbox"]) {
      await page.goto(origin + route);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Overflow at ${width}: ${route}`,
      );
    }
  }
  const linkTargets = new Set();
  for (const [, route] of routes) {
    await page.goto(origin + route);
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")))) {
      if (href.startsWith("/") && !href.startsWith("//"))
        linkTargets.add(href.split("#")[0] || "/");
    }
  }
  for (const href of linkTargets) {
    const response = await context.request.get(origin + href);
    assert(response.ok(), `Broken product link: ${href}`);
  }
  // Verify animation reaches its final readable layout and never covers the face.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin + "/");
  await page.waitForFunction(
    () => {
      const a = document
        .querySelector("#heroScene")
        ?.getAnimations({ subtree: true });
      return a?.length > 0 && a.every((x) => x.playState === "finished");
    },
    {},
    { timeout: 12000 },
  );
  assert(
    await page
      .locator(".node-motion")
      .evaluateAll((nodes) =>
        nodes.every((n) => Number(getComputedStyle(n).opacity) > 0.98),
      ),
  );
  assert(
    await page.locator(".hero-scene").evaluate((scene) => {
      const face = scene.querySelector(".face-safe").getBoundingClientRect();
      return [...scene.querySelectorAll(".context-pill")].every((p) => {
        const r = p.getBoundingClientRect();
        return (
          r.right <= face.left ||
          r.left >= face.right ||
          r.bottom <= face.top ||
          r.top >= face.bottom
        );
      });
    }),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: page routes, responsive assets, source/edit/review, independent privacy, persistent draft, context consent, receipt/inbox decisions, widget embed, empty search, mobile navigation and Escape.",
  );
  await context.close();
} finally {
  await browser.close();
}
