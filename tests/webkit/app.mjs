// End-to-end check in WebKit (the iPhone's engine) against the production build.
// Usage: npx vite preview --port 4173 & node tests/webkit/app.mjs [--shots dir]
import { webkit } from 'playwright';
import fs from 'node:fs';

const URL_ = process.env.APP_URL || 'http://localhost:4173/?selftest';
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : '';
if (shots) fs.mkdirSync(shots, { recursive: true });

const browser = await webkit.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const fails = [];
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const closeTop = async () => { await page.locator('.modal-back:not(.out) .modal-close').last().click(); await page.waitForTimeout(350); };
const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };

await page.goto(URL_);
await page.waitForFunction(() => document.querySelector('.engine-line.ready, .engine-line.error'), null, { timeout: 90000 });
check(await page.$('.engine-line.ready') !== null, 'engine starts');
await shot('1-home');

const cases = [
  ['http.cap', 'http', 'Hypertext Transfer Protocol', 4],
  ['dns.cap', 'dns', 'Domain Name System', 38],
  ['tls13-rfc8446.pcap', 'tls.handshake', 'Transport Layer Security', 0],
  ['pgsql.cap', 'pgsql', 'PostgreSQL', 19],
];
for (const [file, filter, proto, expected] of cases) {
  await page.evaluate((f) => window.__pl.openCapture(f, true), file);
  await page.waitForSelector('.pr', { timeout: 30000 });
  const st = await page.evaluate(() => window.__pl.state().filter);
  const n = await page.$$eval('.pr', (els) => els.length);
  check(st === filter && n > 0 && (!expected || n === expected), `${file}: filter "${filter}" lists ${n} packets`);
  await page.click('.pr');
  await page.waitForSelector('.tree-row', { timeout: 15000 });
  const labels = await page.$$eval('.tree-row.top', (els) => els.map((e) => e.textContent));
  check(labels.some((l) => l.includes(proto)), `${file}: packet tree shows ${proto}`);
  check(await page.$$eval('.hex-row', (els) => els.length) > 0, `${file}: hex dump rendered`);
  if (file === 'http.cap') {
    await shot('3-packet');
    await page.locator('.tree-row.top').last().click();
    const lit = await page.$$eval('.hex span.on', (els) => els.length);
    check(lit > 0, 'tapping a tree line highlights bytes');
    const btn = await page.$('.pkt .btn');
    if (btn) {
      await btn.click();
      await page.waitForSelector('.chunk', { timeout: 15000 });
      const txt = await page.$eval('.chunk', (e) => e.textContent);
      check(txt.includes('GET /download.html'), 'follow TCP stream shows the HTTP request');
      await shot('4-stream');
      await closeTop();
    } else check(false, 'follow stream button present');
  }
  await closeTop();
  if (file === 'http.cap') await shot('2-packets');
}

// type an invalid then valid filter
await page.evaluate(() => window.__pl.openCapture('http.cap', true));
await page.waitForSelector('.pr');
await page.fill('.filter-in', 'ip.addr ==');
await page.waitForTimeout(400);
check(await page.$('.filter.bad') !== null, 'invalid filter is flagged');
await page.fill('.filter-in', 'tcp.port == 80 && frame.len > 1000');
await page.waitForTimeout(400);
check(await page.$('.filter.good') !== null, 'valid filter is accepted');
await page.press('.filter-in', 'Enter');
await page.waitForTimeout(800);
const big = await page.$$eval('.pr', (els) => els.length);
check(big > 0 && big < 43, `custom filter narrows the list (${big})`);
await page.fill('.filter-in', 'http.req');
await page.waitForTimeout(500);
check(await page.$$eval('.sugg-item', (els) => els.length) > 0, 'field suggestions appear');

// conversations
await page.click('.cap-tabs button:nth-child(2)');
await page.waitForSelector('.list .row', { timeout: 15000 });
const convs = await page.$$eval('.list .row', (els) => els.length);
check(convs >= 2, `TCP conversations listed (${convs})`);
await shot('5-conversations');

check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
await browser.close();
if (fails.length) { console.error(`${fails.length} check(s) failed`); process.exit(1); }
console.log('all WebKit checks passed');
