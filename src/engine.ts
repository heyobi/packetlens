// Main-thread client for the engine worker: promise-based RPC plus a small status observable.
import EngineWorker from './engine.worker.ts?worker';
import type { ConvTable, FrameDetail, Req, Res, Row, StreamData, Summary } from './engine-types';

export type Status = { state: 'starting' | 'ready' | 'error'; message: string };

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
let status: Status = { state: 'starting', message: '' };
const listeners = new Set<(s: Status) => void>();

function setStatus(s: Status) { status = s; for (const l of listeners) l(s); }
export function onStatus(fn: (s: Status) => void) { listeners.add(fn); fn(status); return () => listeners.delete(fn); }
export const getStatus = () => status;

function w(): Worker {
  if (worker) return worker;
  worker = new EngineWorker();
  worker.onmessage = (e: MessageEvent<Res>) => {
    const r = e.data;
    if (r.id === -1) { if (r.ok && status.state === 'starting') setStatus({ state: 'starting', message: String((r.value as { status: string }).status ?? '') }); return; }
    const p = pending.get(r.id);
    if (!p) return;
    pending.delete(r.id);
    if (r.ok) p.resolve(r.value); else p.reject(new Error(r.error));
  };
  worker.onerror = (e) => setStatus({ state: 'error', message: e.message || 'engine crashed' });
  return worker;
}

function call<T>(method: string, args: unknown[] = [], transfer: Transferable[] = []): Promise<T> {
  const id = ++seq;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w().postMessage({ id, method, args } satisfies Req, transfer);
  });
}

let ready: Promise<void> | null = null;
export function start(): Promise<void> {
  if (!ready) {
    const t0 = performance.now();
    ready = call('init').then(
      () => { initMs = performance.now() - t0; setStatus({ state: 'ready', message: '' }); },
      (e: Error) => { setStatus({ state: 'error', message: e.message }); ready = null; throw e; });
  }
  return ready;
}
export let initMs = 0;

export async function load(name: string, bytes: Uint8Array): Promise<Summary> {
  await start();
  const copy = bytes.slice();
  return call<Summary>('load', [name, copy], [copy.buffer]);
}
export const frames = (filter: string, skip: number, limit: number) => call<{ rows: Row[]; matched: number }>('frames', [filter, skip, limit]);
export const frame = (n: number) => call<FrameDetail>('frame', [n]);
export const checkFilter = (f: string) => call<{ ok: boolean; error: string }>('checkFilter', [f]);
export const complete = (prefix: string) => call<{ field: string; name: string }[]>('complete', [prefix]);
export const follow = (proto: string, filter: string) => call<StreamData>('follow', [proto, filter]);
export const conversations = (tap: string) => call<ConvTable>('conversations', [tap]);
