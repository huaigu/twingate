#!/usr/bin/env node
/** Presentation regression; deterministic sample identities never hit mutation APIs. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const origin = process.env.MOTION_BASE_URL || 'http://localhost:3005';
const output = process.env.MOTION_QA_DIR || '.run/motion-pass'; mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], mutations = [], measurements = [];
const watch = page => {
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/api/')) mutations.push(request.url()); });
};
const box = async locator => { const value = await locator.boundingBox(); assert(value); return value; };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  await context.addInitScript(() => {
    sessionStorage.setItem('signalpass-demo', '1');
    window.motionEvents = [];
    document.addEventListener('animationstart', e => window.motionEvents.push(e.animationName));
  });
  const page = await context.newPage(); watch(page);
  await page.goto(origin + '/?demo=1');
  await page.waitForFunction(() => document.getElementById('heroScene')?.classList.contains('is-animated'));
  assert(await page.evaluate(() => document.getElementById('heroScene').getAnimations({ subtree: true }).length > 5));
  await page.waitForFunction(() => document.getElementById('heroScene').getAnimations({ subtree: true }).every(a => a.playState === 'finished'));
  const before = await box(page.locator('#heroScene'));
  await page.getByRole('button', { name: 'Replay the connections', exact: true }).click();
  await page.waitForFunction(() => document.getElementById('heroScene').getAnimations({ subtree: true }).some(a => a.playState === 'running'));
  const after = await box(page.locator('#heroScene'));
  for (const key of ['x', 'y', 'width', 'height']) assert(Math.abs(before[key] - after[key]) < 1, 'Hero anchors moved during replay');
  assert(await page.evaluate(async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const list = document.getElementById('heroScene').getAnimations({ subtree: true }).filter(a => a.playState !== 'finished');
    await Promise.all(list.map(a => a.ready));
    const paused = list.length > 0 && list.every(a => a.playState === 'paused');
    delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));
    return paused;
  }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.documentElement.dataset.motion === 'reduced');
  assert(await page.getByRole('button', { name: 'Replay the connections', exact: true }).isHidden());
  assert(await page.evaluate(() => [...document.querySelectorAll('.node-motion')].every(e => getComputedStyle(e).opacity === '1')));
  console.log('PASS: finite hero reveal, stable replay geometry, hidden-state pause and runtime reduced-motion change');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(origin + '/discover?demo=1', { waitUntil: 'networkidle' });
  const card = page.locator('[data-person=Maya]');
  await page.waitForFunction(() => document.querySelector('[data-person=Maya]')?.classList.contains('sp-motion-card'));
  await card.scrollIntoViewIfNeeded();
  const cardBox = await box(card);
  await page.mouse.move(cardBox.x + cardBox.width * .8, cardBox.y + cardBox.height * .35, { steps: 12 });
  await page.waitForFunction(() => document.querySelector('[data-person=Maya]').style.getPropertyValue('--sp-rotate-y') !== '');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-person=Maya]')).transform.startsWith('matrix3d'));
  await page.mouse.move(2, 2);
  await page.waitForFunction(() => document.querySelector('[data-person=Maya]').style.getPropertyValue('--sp-rotate-y') === '');
  await card.focus(); await page.keyboard.press('Enter');
  await page.locator('#app-dialog[open]').waitFor();
  await page.waitForFunction(() => window.motionEvents.includes('sp-dialog-arrive'));
  await page.keyboard.press('Escape');
  assert(await card.evaluate(el => document.activeElement === el));
  console.log('PASS: desktop paper tilt resets; keyboard profile opening, dialog entry and focus restoration');

  await page.goto(origin + '/introductions/new/maya?demo=1', { waitUntil: 'networkidle' });
  const progress = page.getByRole('progressbar', { name: 'Introduction sections drafted' });
  await progress.waitFor();
  for (let i = 1; i <= 4; i++) await page.locator('#intro-field-' + i).fill('');
  assert.equal(await progress.getAttribute('aria-valuenow'), '0');
  await page.locator('#intro-field-1').fill('A specific introduction.');
  assert.equal(await progress.getAttribute('aria-valuenow'), '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (let i = 2; i <= 4; i++) await page.locator('#intro-field-' + i).fill('A thoughtful contribution and next step.');
  assert.equal(await progress.getAttribute('aria-valuenow'), '4');
  assert.equal(await progress.locator('span').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  assert.equal(mutations.length, 0, 'Presentation unexpectedly called a mutation API');
  console.log('PASS: draft meter follows actual text, works without motion, and never sends an introduction');

  const receipt = { id: 'motion-sample', sender: 'Alex', recipient: 'Maya', fields: ['A personal note.', 'A shared curiosity.', 'An offer to help.', 'A short conversation.'], sharedContext: false, createdAt: '2026-09-28T12:00:00Z', status: 'pending' };
  await page.evaluate(record => localStorage.setItem('signalpass-v4', JSON.stringify({ introductions: [record] })), receipt);
  await page.goto(origin + '/introductions/motion-sample/receipt?demo=1', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.sp-seal-ring').count(), 0);
  await page.evaluate(() => { const value = JSON.parse(localStorage.getItem('signalpass-v4')); value.introductions[0].status = 'accepted'; localStorage.setItem('signalpass-v4', JSON.stringify(value)); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-sp-sealed=true]').waitFor();
  assert.equal(await page.locator('#receipt-status').innerText(), 'Accepted');
  assert(await page.evaluate(() => document.querySelector('.v4-receipt-icon').getAnimations({ subtree: true }).length === 0));
  console.log('PASS: accepted-only seal; pending receipts never show success; reduced motion stays still');

  for (const width of [1280, 1440, 1920, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const [name, route] of [['home','/'],['discover','/discover'],['compose','/introductions/new/maya'],['receipt','/introductions/motion-sample/receipt']]) {
      await page.goto(origin + route + '?demo=1', { waitUntil: 'networkidle' });
      const measured = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        missing: [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src),
        cardOverflow: [...document.querySelectorAll('.person-card')].map(e => e.scrollWidth - e.clientWidth),
        infinite: document.getAnimations().filter(a => a.effect.getTiming().iterations === Infinity).length,
      }));
      assert(measured.overflow <= 1, name + ' overflow at ' + width); assert.deepEqual(measured.missing, []);
      assert(measured.cardOverflow.every(n => n <= 1), name + ' card text overflow at ' + width); assert.equal(measured.infinite, 0);
      measurements.push({ width, name, ...measured });
      await page.screenshot({ path: output + '/' + name + '-' + width + '.png', fullPage: true });
    }
  }
  assert.deepEqual(errors, []); await context.close();
  console.log('PASS: 16 desktop-first viewport/route checks; no overflow, broken assets, runaway animation or runtime errors');

  if (process.argv.includes('--record')) {
    const tour = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', recordVideo: { dir: output + '/recording', size: { width: 1440, height: 900 } } });
    await tour.addInitScript(() => sessionStorage.setItem('signalpass-demo', '1'));
    const t = await tour.newPage(); watch(t); const video = t.video();
    await t.goto(origin + '/?demo=1', { waitUntil: 'networkidle' }); await t.waitForTimeout(3000);
    await t.goto(origin + '/discover?demo=1', { waitUntil: 'networkidle' });
    const target = t.locator('[data-person=Maya]'); await target.scrollIntoViewIfNeeded(); const r = await box(target);
    await t.mouse.move(r.x + r.width * .75, r.y + r.height * .3, { steps: 24 }); await t.waitForTimeout(1200);
    await target.click(); await t.waitForTimeout(1500);
    await t.getByRole('link', { name: 'Draft an introduction', exact: false }).click();
    const field = t.locator('#intro-field-1'); await field.fill(''); await t.waitForTimeout(400);
    await field.pressSequentially('Hi Maya, I would love to build a thoughtful community tool together.', { delay: 26 });
    await t.waitForTimeout(600); await t.locator('[data-action=approve-introduction]').click(); await t.waitForTimeout(1500);
    await t.locator('#dialog-confirm').click(); await t.waitForURL('**/receipt'); const receiptUrl = t.url();
    await t.waitForTimeout(1000); await t.locator('#recipient-link').click();
    await t.locator('[data-action=accept-introduction]').click(); await t.waitForTimeout(900); await t.locator('#dialog-confirm').click();
    await t.goto(receiptUrl, { waitUntil: 'networkidle' });
    await t.locator('[data-sp-sealed=true]').waitFor();
    assert.equal(await t.locator('#receipt-status').innerText(), 'Accepted');
    await t.waitForTimeout(1800);
    await tour.close(); await video.saveAs(output + '/desktop-tour.webm');
    assert.deepEqual(errors, []); console.log('RECORDED: ' + output + '/desktop-tour.webm (explicit sample mode; no external delivery or payment)');
  }
  writeFileSync(output + '/verification.json', JSON.stringify({ passed: true, errors, mutations, measurements }, null, 2));
} catch (error) { console.error(error); process.exitCode = 1; }
finally { await browser.close(); }
