// Saved capture files. On iOS they live in Documents/Captures (visible in the Files app under "Packet Lens");
// in a desktop browser (development) they go to IndexedDB through storage.ts.
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { list, readBlob, remove, writeBlob } from './storage';

const native = Capacitor.isNativePlatform();
const FOLDER = 'Captures';
const META = 'pl-captures';

export type CaptureMeta = { name: string; size: number; added: number; packets?: number; opened?: number };

function readMeta(): Record<string, CaptureMeta> {
  try { return JSON.parse(localStorage.getItem(META) || '{}'); } catch { return {}; }
}
function writeMeta(m: Record<string, CaptureMeta>) { try { localStorage.setItem(META, JSON.stringify(m)); } catch { /* ignore */ } }

export const CAPTURE_EXT = /\.(pcapng|pcap|cap|ntar|pcapng\.gz|pcap\.gz|gz|snoop|erf|trc|enc|log)$/i;

export async function listCaptures(): Promise<CaptureMeta[]> {
  const names = (await list('docs', FOLDER)).filter((n) => !n.endsWith('.tmp'));
  const meta = readMeta();
  const out = names.map((n) => meta[n] ?? { name: n, size: 0, added: 0 });
  return out.sort((a, b) => (b.opened ?? b.added) - (a.opened ?? a.added));
}

/** Picks a file name that does not collide with an existing capture. */
export async function uniqueName(name: string): Promise<string> {
  const clean = name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'capture.pcapng';
  const existing = new Set(await list('docs', FOLDER));
  if (!existing.has(clean)) return clean;
  const m = clean.match(/^(.*?)(\.[^.]+(?:\.gz)?)?$/)!;
  for (let i = 2; ; i++) { const c = `${m[1]} ${i}${m[2] ?? ''}`; if (!existing.has(c)) return c; }
}

export async function saveCapture(name: string, bytes: Uint8Array): Promise<CaptureMeta> {
  const n = await uniqueName(name);
  await writeBlob('docs', `${FOLDER}/${n}`, new Blob([bytes as BlobPart]));
  const meta = readMeta();
  meta[n] = { name: n, size: bytes.length, added: Date.now() };
  writeMeta(meta);
  return meta[n];
}

export function touchCapture(name: string, packets: number) {
  const meta = readMeta();
  meta[name] = { ...(meta[name] ?? { name, size: 0, added: Date.now() }), packets, opened: Date.now() };
  writeMeta(meta);
}

export async function readCapture(name: string): Promise<Uint8Array | null> {
  if (native) {
    // Large files: read through the WebView's file URL instead of base64 over the bridge.
    try {
      const { uri } = await Filesystem.getUri({ directory: Directory.Documents, path: `${FOLDER}/${name}` });
      const r = await fetch(Capacitor.convertFileSrc(uri));
      if (r.ok) return new Uint8Array(await r.arrayBuffer());
    } catch { /* fall back below */ }
  }
  const b = await readBlob('docs', `${FOLDER}/${name}`);
  return b ? new Uint8Array(await b.arrayBuffer()) : null;
}

export async function deleteCapture(name: string) {
  await remove('docs', `${FOLDER}/${name}`);
  const meta = readMeta();
  delete meta[name];
  writeMeta(meta);
}

export async function renameCapture(from: string, to: string): Promise<string> {
  const bytes = await readCapture(from);
  if (!bytes) throw new Error('file not found');
  const n = await uniqueName(to);
  await writeBlob('docs', `${FOLDER}/${n}`, new Blob([bytes as BlobPart]));
  await remove('docs', `${FOLDER}/${from}`);
  const meta = readMeta();
  meta[n] = { ...(meta[from] ?? { size: bytes.length, added: Date.now() }), name: n };
  delete meta[from];
  writeMeta(meta);
  return n;
}
