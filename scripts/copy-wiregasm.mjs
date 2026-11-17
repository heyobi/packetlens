// Copies the Wiregasm loader, WebAssembly binary and Wireshark data package into public/wiregasm/
// so Vite serves them as-is (they are loaded at runtime by the engine worker, not bundled).
import fs from 'node:fs';
import path from 'node:path';

const src = path.join('node_modules', '@goodtools', 'wiregasm', 'dist');
const dst = path.join('public', 'wiregasm');
fs.mkdirSync(dst, { recursive: true });
for (const f of ['wiregasm.js', 'wiregasm.wasm', 'wiregasm.data']) {
  const a = path.join(src, f), b = path.join(dst, f);
  if (fs.existsSync(b) && fs.statSync(b).size === fs.statSync(a).size) continue;
  fs.copyFileSync(a, b);
  console.log('copied', f);
}
