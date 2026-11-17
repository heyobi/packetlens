/// <reference lib="webworker" />
// Runs Wireshark's dissection engine (Wiregasm) off the main thread. Embind objects never leave this file:
// every result is converted to plain JSON before it is posted back.
import { Wiregasm } from '@goodtools/wiregasm';
import type { ProtoTree, Vector } from '@goodtools/wiregasm';
import type { Req, Res, Row, Node, FrameDetail, StreamData, ConvTable } from './engine-types';

declare const self: DedicatedWorkerGlobalScope & { loadWiregasm?: unknown };
// Absolute /wiregasm/ on the same origin (works for http://localhost and capacitor://localhost alike).
const dir = new URL('/wiregasm/', self.location.href).href;
let lastPath = '';

let wg: Wiregasm | null = null;
let initPromise: Promise<void> | null = null;

const arr = <T>(v: Vector<T> | undefined | null): T[] => {
  if (!v) return [];
  const out: T[] = [];
  for (let i = 0; i < v.size(); i++) out.push(v.get(i));
  return out;
};

function init(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    importScripts(dir + 'wiregasm.js');
    const w = new Wiregasm();
    await w.init(self.loadWiregasm as never, {
      locateFile: (p: string) => dir + p,
      print: () => {},
      printErr: () => {},
      handleStatus: (_t: number, m: string) => post({ id: -1, ok: true, value: { status: m } }),
    });
    wg = w;
  })();
  return initPromise;
}

const need = () => { if (!wg) throw new Error('engine not ready'); return wg; };

function tree(nodes: Vector<ProtoTree>): Node[] {
  return arr(nodes).map((n) => ({ l: n.label, f: n.filter, s: n.start, n: n.length, ds: n.data_source_idx, t: n.type, fn: n.fnum, c: tree(n.tree) }));
}

function b64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const handlers: Record<string, (...a: any[]) => unknown> = {
  async init() { await init(); return { version: 'ok' }; },
  async load(name: string, bytes: Uint8Array) {
    await init();
    const w = need() as Wiregasm & { lib: { FS: { unlink(p: string): void } }; uploadDir: string };
    // Wiregasm keeps every uploaded file in its in-memory filesystem; drop the previous capture first.
    if (lastPath) { try { w.lib.FS.unlink(lastPath); } catch { /* already gone */ } }
    const ext = (name.match(/\.(pcapng|pcap|cap|ntar|snoop|erf|gz|zst)$/i)?.[1] ?? 'pcap').toLowerCase();
    const fname = `capture.${ext}`;
    lastPath = `${w.uploadDir}/${fname}`;
    const r = w.load(fname, bytes);
    if (r.code !== 0) throw new Error(r.error || `could not read this file (code ${r.code})`);
    const s = r.summary;
    return { file_type: s.file_type, encap: s.file_encap_type, packets: s.packet_count, start: s.start_time, stop: s.stop_time, elapsed: s.elapsed_time, length: s.file_length };
  },
  frames(filter: string, skip: number, limit: number) {
    const r = need().frames(filter, skip, limit);
    const rows: Row[] = arr(r.frames).map((f) => ({ n: f.number, c: arr(f.columns), bg: f.bg, fg: f.fg }));
    r.frames.delete();
    return { rows, matched: r.matched };
  },
  frame(n: number): FrameDetail {
    const f = need().frame(n);
    const out: FrameDetail = {
      n: f.number,
      tree: tree(f.tree),
      sources: arr(f.data_sources).map((d) => ({ name: d.name, bytes: b64(d.data) })),
      follow: arr(f.follow).map((v) => arr(v)),
      comments: arr(f.comments),
    };
    return out;
  },
  checkFilter(filter: string) {
    if (!filter.trim()) return { ok: true, error: '' };
    const r = need().testFilter(filter);
    return { ok: r.ok, error: r.error };
  },
  complete(prefix: string) {
    const list = need().completeFilter(prefix).fields as unknown as { field: string; name: string }[];
    return list.slice(0, 40).map((x) => ({ field: x.field, name: x.name }));
  },
  follow(proto: string, filter: string): StreamData {
    const f = need().follow(proto, filter);
    const out: StreamData = {
      client: `${f.chost}:${f.cport}`, server: `${f.shost}:${f.sport}`, cbytes: f.cbytes, sbytes: f.sbytes,
      chunks: arr(f.payloads).map((p) => ({ n: p.number, server: !!p.server, bytes: b64(p.data) })),
    };
    return out;
  },
  conversations(tap: string): ConvTable {
    const r = need().tap({ tap0: tap } as never) as unknown as { error: string; taps: any[] };
    if (r.error) throw new Error(r.error);
    const t = r.taps[0] ?? {};
    const conv = (t.convs ?? []) as any[];
    const hosts = (t.hosts ?? []) as any[];
    return {
      convs: conv.map((c) => ({ a: c.saddr, ap: c.sport, b: c.daddr, bp: c.dport, frames: c.txf + c.rxf, bytes: c.txb + c.rxb, start: c.start, stop: c.stop, filter: c.filter })),
      hosts: hosts.map((h) => ({ host: h.host, port: h.port, frames: h.txf + h.rxf, bytes: h.txb + h.rxb, filter: h.filter })),
    };
  },
};

function post(r: Res, transfer: Transferable[] = []) { self.postMessage(r, transfer); }

self.onmessage = async (e: MessageEvent<Req>) => {
  const { id, method, args } = e.data;
  try {
    const value = await handlers[method](...args);
    const transfer: Transferable[] = [];
    if (method === 'frame') for (const s of (value as FrameDetail).sources) transfer.push(s.bytes.buffer);
    post({ id, ok: true, value }, transfer);
  } catch (err) {
    post({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
