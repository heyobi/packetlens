// Fast Node check: the bundled sample captures dissect with the pinned Wiregasm build.
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { Wiregasm } = require('@goodtools/wiregasm');
const loadWiregasm = require('@goodtools/wiregasm/dist/wiregasm.js');
const wg = new Wiregasm();
await wg.init(loadWiregasm, { locateFile: (f) => require.resolve(`@goodtools/wiregasm/dist/${f}`), print() {}, printErr() {} });

const cases = [
  ['http.cap', 'http', 4, 'Hypertext Transfer Protocol'],
  ['dns.cap', 'dns', 38, 'Domain Name System'],
  ['tls13-rfc8446.pcap', 'tls.handshake', 4, 'Transport Layer Security'],
  ['pgsql.cap', 'pgsql', 19, 'PostgreSQL'],
];
let failed = 0;
for (const [file, filter, expect, proto] of cases) {
  const r = wg.load(file, new Uint8Array(fs.readFileSync(`public/samples/${file}`)));
  const f = wg.frames(filter, 0, 0);
  const first = f.frames.get(0).number;
  const tree = wg.frame(first).tree;
  const labels = []; for (let i = 0; i < tree.size(); i++) labels.push(tree.get(i).label);
  const ok = r.code === 0 && f.matched === expect && labels.some((l) => l.includes(proto));
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${file}: ${f.matched} × ${filter}, tree ends with ${labels.at(-1)}`);
  if (!ok) failed++;
}
const bad = wg.testFilter('ip.addr ==');
console.log(`${!bad.ok ? 'ok  ' : 'FAIL'} invalid filter rejected`);
if (bad.ok) failed++;
wg.destroy();
process.exit(failed ? 1 : 0);
