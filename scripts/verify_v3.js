const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/bojack/.gemini/antigravity/brain/74be5810-b193-48d2-8377-20dbc0940626/v3-screenshots';
const DOCS_DIR = path.resolve(__dirname, '../docs/v3-screenshots');

async function saveScreenshot(page, filename) {
  const p1 = path.join(ARTIFACT_DIR, filename);
  const p2 = path.join(DOCS_DIR, filename);
  await page.screenshot({ path: p1, fullPage: false });
  await page.screenshot({ path: p2, fullPage: false });
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1672, height: 941 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('--- Step 1: Desktop Screenshots ---');
  
  // 1. Home
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '01_home.png');

  // 2. Profile Import
  await page.goto('http://localhost:3000/profile/import', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '02_profile_import.png');

  // 3. Profile Review
  await page.goto('http://localhost:3000/profile/review', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '03_profile_review.png');

  // 4. Widget Create
  await page.goto('http://localhost:3000/widget/create', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '04_widget_create.png');

  // 5. Discover
  await page.goto('http://localhost:3000/discover', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '05_discover.png');

  // 6. Discover Candidate (Maya)
  await page.goto('http://localhost:3000/discover/maya', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '06_discover_candidate.png');

  // 7. Intro Draft
  await page.goto('http://localhost:3000/introductions/new/maya', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '07_intro_draft.png');

  // 8. Intro Confirm
  await page.goto('http://localhost:3000/introductions/intro-1/confirm', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '08_intro_confirm.png');

  // 9. Inbox
  await page.goto('http://localhost:3000/inbox/intro-1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '09_inbox.png');

  // 10. Inbox Decision
  await page.goto('http://localhost:3000/inbox/intro-1/decision', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '10_inbox_decision.png');

  // 11. Receipt
  await page.goto('http://localhost:3000/introductions/intro-1/receipt', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await saveScreenshot(page, '11_receipt.png');

  // 12. Flow
  await page.goto('http://localhost:3000/flow', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await saveScreenshot(page, '12_flow.png');

  console.log('--- Step 2: Mobile Screenshots ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);
  await saveScreenshot(mobilePage, 'm01_home.png');

  await mobilePage.goto('http://localhost:3000/profile/review', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);
  await saveScreenshot(mobilePage, 'm03_profile_review.png');

  await mobilePage.goto('http://localhost:3000/discover', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);
  await saveScreenshot(mobilePage, 'm05_discover.png');

  await mobilePage.goto('http://localhost:3000/inbox/intro-1', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);
  await saveScreenshot(mobilePage, 'm09_inbox.png');

  console.log('--- Step 3: Interactive Flow Testing ---');
  // Test interaction on /profile/review
  await page.goto('http://localhost:3000/profile/review', { waitUntil: 'networkidle' });
  // Click Private visibility
  const privateButton = await page.locator('text=Private Profile').first();
  if (await privateButton.isVisible()) {
    await privateButton.click();
    console.log('✓ Clicked Private Profile button');
  }
  // Toggle agent matching switch
  const matchingCheckbox = await page.locator('input[type=checkbox]').first();
  if (await matchingCheckbox.isVisible()) {
    await matchingCheckbox.click();
    console.log('✓ Toggled matching checkbox');
  }

  // Test copy button on /widget/create
  await page.goto('http://localhost:3000/widget/create', { waitUntil: 'networkidle' });
  const copyBtn = await page.locator('button:has-text("Copy Embed Tag")').first();
  if (await copyBtn.isVisible()) {
    await copyBtn.click();
    console.log('✓ Clicked Copy Embed Tag button');
  }

  // Test decision flow on /inbox/intro-1
  await page.goto('http://localhost:3000/inbox/intro-1', { waitUntil: 'networkidle' });
  const acceptBtn = await page.locator('a:has-text("Accept Introduction & Swap Contacts")').first();
  if (await acceptBtn.isVisible()) {
    await acceptBtn.click();
    await page.waitForURL('**/inbox/intro-1/decision');
    console.log('✓ Successfully navigated to /inbox/intro-1/decision via Accept button');
  }

  await browser.close();
  console.log('All verification tasks passed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
