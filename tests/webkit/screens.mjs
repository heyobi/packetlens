// App Store screenshots (1206x2622 = iPhone 6.3" slot) from the production build in WebKit, English UI.
// Usage: npx vite preview --port 4173 & node tests/webkit/screens.mjs [outDir]
import { webkit } from 'playwright';
import fs from 'node:fs';

const URL_ = process.env.APP_URL || 'http://localhost:4173/?selftest';
const out = process.argv[2] || 'store/screens';
fs.mkdirSync(out, { recursive: true });
const b = await webkit.launch();
const shotAll = async (scheme, list) => {
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, colorScheme: scheme, locale: 'en-US' });
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { localStorage.setItem('pl-lang', 'en'); } catch {} });
  await p.goto(URL_);
  await p.waitForSelector('.engine-line.ready', { timeout: 90000 });
  await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important} .engine-line::before{animation:none!important}' });
  for (const [name, fn] of list) { await fn(p); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/${name}.png` }); console.log('saved', name); }
  await ctx.close();
};
const open = (f) => async (p) => { await p.evaluate((x) => window.__pl.openCapture(x, true), f); await p.waitForSelector('.pr'); };
const closeAll = async (p) => { for (const el of await p.$$('.modal-back')) await el.evaluate((e) => e.remove()); };

await shotAll('dark', [
  ['1-packets', async (p) => { await open('http.cap')(p); await p.fill('.filter-in', ''); await p.press('.filter-in', 'Enter'); await p.waitForTimeout(600); await p.evaluate(() => document.activeElement.blur()); }],
  ['2-detail', async (p) => { await p.locator('.pr').nth(3).click(); await p.waitForSelector('.tree-row'); await p.locator('.tree-row').filter({ hasText: 'GET /download.html' }).first().click(); }],
  ['3-stream', async (p) => { await p.locator('.pkt .btn').filter({ hasText: 'TCP' }).first().click(); await p.waitForSelector('.chunk'); }],
  ['4-filter', async (p) => { await closeAll(p); await open('dns.cap')(p); await p.fill('.filter-in', 'dns.qry.type == 15 || dns.qry.type == 16'); await p.press('.filter-in', 'Enter'); await p.waitForTimeout(600); await p.evaluate(() => document.activeElement.blur()); }],
]);
await shotAll('light', [
  ['5-pgsql', async (p) => { await open('pgsql.cap')(p); await p.locator('.pr').nth(4).click(); await p.waitForSelector('.tree-row'); }],
  ['6-conversations', async (p) => { await closeAll(p); await open('http.cap')(p); await p.click('.cap-tabs button:nth-child(2)'); await p.waitForSelector('.list .row'); }],
  ['7-home', async (p) => { await closeAll(p); await p.click('.back'); await p.waitForSelector('.cards'); }],
]);
await b.close();
