// Packet details (protocol tree + hex dump), stream follow and conversation tables.
import * as engine from './engine';
import type { ConvTable, FrameDetail, Node, StreamData } from './engine-types';
import { t } from './i18n';
import { h, icon, modal, sheet, toast } from './ui';

export type Nav = { applyFilter: (f: string) => void; neighbor?: (n: number, dir: 1 | -1) => number | null };

const hex2 = (b: number) => b.toString(16).padStart(2, '0');
const printable = (b: number) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.');

export const fmtBytes = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;

async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); toast(t('Copied')); } catch { toast(text); }
}

/** Hex dump of one data source; returns the element and a function that highlights a byte range. */
function hexDump(bytes: Uint8Array) {
  const wrap = h('div', { class: 'hex' });
  const spans: HTMLSpanElement[] = [];
  const chars: HTMLSpanElement[] = [];
  const max = Math.min(bytes.length, 64 * 1024);
  for (let off = 0; off < max; off += 16) {
    const hx = h('span', { class: 'hex-b' });
    const as = h('span', { class: 'hex-a' });
    for (let i = off; i < Math.min(off + 16, max); i++) {
      const s = h('span', {}, hex2(bytes[i]));
      const c = h('span', {}, printable(bytes[i]));
      spans.push(s); chars.push(c);
      hx.append(s, i % 16 === 7 ? '  ' : ' ');
      as.append(c);
    }
    wrap.append(h('div', { class: 'hex-row' }, h('span', { class: 'hex-o' }, off.toString(16).padStart(4, '0')), hx, as));
  }
  if (bytes.length > max) wrap.append(h('div', { class: 'muted small' }, `… ${fmtBytes(bytes.length - max)} ${t('more')}`));
  let lit: number[] = [];
  const mark = (start: number, len: number) => {
    for (const i of lit) { spans[i]?.classList.remove('on'); chars[i]?.classList.remove('on'); }
    lit = [];
    if (start < 0 || len <= 0) return;
    for (let i = start; i < Math.min(start + len, spans.length); i++) { spans[i].classList.add('on'); chars[i].classList.add('on'); lit.push(i); }
    spans[start]?.scrollIntoView({ block: 'nearest' });
  };
  return { el: wrap, mark };
}

export async function openPacket(num: number, nav: Nav) {
  const body = h('div', { class: 'pkt' }, h('div', { class: 'muted pad' }, t('Loading…')));
  const title = h('div', { class: 'modal-title' }, `${t('Packet')} ${num}`);
  const prevBtn = h('button', { class: 'gear', 'aria-label': t('Previous packet') }, icon('up'));
  const nextBtn = h('button', { class: 'gear', 'aria-label': t('Next packet') }, icon('down'));
  const head = h('div', { class: 'pkt-head' }, title, h('div', { class: 'grow' }), prevBtn, nextBtn);
  const close = modal(h('div', {}, head, body));
  let current = num;

  const show = async (n: number) => {
    current = n;
    title.textContent = `${t('Packet')} ${n}`;
    let d: FrameDetail;
    try { d = await engine.frame(n); } catch (e) { body.replaceChildren(h('div', { class: 'err pad' }, (e as Error).message)); return; }
    if (current !== n) return;
    render(d);
  };
  prevBtn.addEventListener('click', () => { const p = nav.neighbor?.(current, -1); if (p) void show(p); });
  nextBtn.addEventListener('click', () => { const p = nav.neighbor?.(current, 1); if (p) void show(p); });

  const render = (d: FrameDetail) => {
    const dumps = d.sources.map((s) => hexDump(s.bytes));
    let shown = 0;
    const dumpBox = h('div', { class: 'hex-box' }, dumps[0]?.el ?? '');
    const srcTabs = d.sources.length > 1
      ? h('div', { class: 'seg src-seg' }, d.sources.map((s, i) => h('button', { class: i === 0 ? 'on' : '', onclick: (e: Event) => { pick(i); for (const b of (e.currentTarget as HTMLElement).parentElement!.children) b.classList.remove('on'); (e.currentTarget as HTMLElement).classList.add('on'); } }, s.name.replace(/\s*\(\d+ bytes\)$/, ''))))
      : null;
    const pick = (i: number) => { shown = i; dumpBox.replaceChildren(dumps[i].el); };
    let selected: HTMLElement | null = null;

    const nodeEl = (node: Node, depth: number, open: boolean): HTMLElement => {
      const hasKids = node.c.length > 0;
      const kids = h('div', { class: 'tree-kids' });
      let built = false;
      const build = () => { if (!built) { built = true; for (const c of node.c) kids.append(nodeEl(c, depth + 1, false)); } };
      const row = h('div', { class: `tree-row${depth === 0 ? ' top' : ''}${node.t === 'framenum' ? ' link' : ''}`, style: { paddingLeft: `${8 + depth * 14}px` } },
        h('span', { class: `tw${hasKids ? '' : ' leaf'}` }, hasKids ? icon('chevron') : ''),
        h('span', { class: 'tl' }, node.l));
      const wrap = h('div', { class: 'tree-node' }, row, kids);
      const setOpen = (v: boolean) => { if (v) build(); wrap.classList.toggle('open', v); };
      setOpen(open);
      row.addEventListener('click', () => {
        if (hasKids) setOpen(!wrap.classList.contains('open'));
        selected?.classList.remove('sel'); row.classList.add('sel'); selected = row;
        if (node.ds >= 0 && dumps[node.ds]) {
          if (node.ds !== shown) { pick(node.ds); srcTabs?.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === node.ds)); }
          dumps[node.ds].mark(node.s, node.n);
        }
        if (node.t === 'framenum' && node.fn) void show(node.fn);
      });
      let timer = 0;
      const menu = () => {
        const acts: { label: string; run: () => void }[] = [];
        if (node.f) acts.push({ label: t('Apply as filter'), run: () => { close(); nav.applyFilter(node.f); } });
        if (node.f) acts.push({ label: t('Copy filter'), run: () => void copy(node.f) });
        acts.push({ label: t('Copy line'), run: () => void copy(node.l) });
        sheet(node.f || node.l.slice(0, 80), acts);
      };
      row.addEventListener('contextmenu', (e) => { e.preventDefault(); menu(); });
      row.addEventListener('touchstart', () => { timer = window.setTimeout(menu, 550); }, { passive: true });
      for (const ev of ['touchend', 'touchmove', 'touchcancel']) row.addEventListener(ev, () => clearTimeout(timer), { passive: true });
      return wrap;
    };

    const treeEl = h('div', { class: 'tree' });
    d.tree.forEach((n, i) => treeEl.append(nodeEl(n, 0, i === d.tree.length - 1 && d.tree.length > 1)));

    const follows = d.follow.filter((f) => f.length >= 2);
    body.replaceChildren(
      d.comments.length ? h('div', { class: 'info' }, d.comments.map((c) => h('div', {}, c))) : '',
      follows.length ? h('div', { class: 'actions wrap' }, follows.map(([proto, filter]) =>
        h('button', { class: 'btn', onclick: () => void openFollow(proto, filter, () => { close(); nav.applyFilter(filter); }) }, icon('stream'), t('Follow {p} stream').replace('{p}', proto)))) : '',
      h('div', { class: 'group' }, t('Protocol tree')),
      h('div', { class: 'pad muted small' }, t('Tap a line to see its bytes. Long-press to filter by it.')),
      treeEl,
      h('div', { class: 'group' }, t('Bytes')),
      srcTabs ?? '',
      dumpBox,
    );
  };
  await show(num);
}

export async function openFollow(proto: string, filter: string, applyFilter: () => void) {
  const body = h('div', {}, h('div', { class: 'muted pad' }, t('Loading…')));
  modal(h('div', {}, h('div', { class: 'modal-title' }, t('{p} stream').replace('{p}', proto)), body));
  let s: StreamData;
  try { s = await engine.follow(proto, filter); } catch (e) { body.replaceChildren(h('div', { class: 'err pad' }, (e as Error).message)); return; }
  let mode: 'text' | 'hex' = 'text';
  const out = h('div', { class: 'follow' });
  const draw = () => {
    out.replaceChildren();
    if (!s.chunks.length) out.append(h('div', { class: 'empty' }, t('No payload in this stream.')));
    for (const c of s.chunks.slice(0, 2000)) {
      const text = mode === 'text'
        ? Array.from(c.bytes.subarray(0, 32768), (b) => (b === 10 || b === 13 || b === 9 || (b >= 0x20 && b < 0x7f) ? String.fromCharCode(b) : '·')).join('')
        : Array.from(c.bytes.subarray(0, 8192), hex2).join(' ').replace(/((?:\S+ ){16})/g, '$1\n');
      out.append(h('pre', { class: `chunk ${c.server ? 'srv' : 'cli'}` }, text));
    }
  };
  draw();
  body.replaceChildren(
    h('div', { class: 'follow-head' },
      h('div', { class: 'cli-k' }, `${s.client} → ${fmtBytes(s.cbytes)}`),
      h('div', { class: 'srv-k' }, `${s.server} → ${fmtBytes(s.sbytes)}`)),
    h('div', { class: 'actions' },
      h('div', { class: 'seg' },
        h('button', { class: 'on', onclick: (e: Event) => { mode = 'text'; seg(e); draw(); } }, 'ASCII'),
        h('button', { onclick: (e: Event) => { mode = 'hex'; seg(e); draw(); } }, 'Hex')),
      h('div', { class: 'grow' }),
      h('button', { class: 'btn', onclick: applyFilter }, icon('filter'), t('Filter'))),
    out);
}

function seg(e: Event) {
  const b = e.currentTarget as HTMLElement;
  for (const x of b.parentElement!.children) x.classList.remove('on');
  b.classList.add('on');
}

const CONV_TAPS: [string, string][] = [['TCP', 'conv:TCP'], ['UDP', 'conv:UDP'], ['IPv4', 'conv:IPv4'], ['IPv6', 'conv:IPv6'], ['Ethernet', 'conv:Ethernet']];

export function conversationsView(kind: 'conv' | 'endpt', applyFilter: (f: string) => void): HTMLElement {
  const box = h('div', {});
  const list = h('div', { class: 'list' });
  let which = 0;
  const load = async () => {
    list.replaceChildren(h('div', { class: 'empty' }, t('Loading…')));
    const tap = CONV_TAPS[which][1].replace('conv:', `${kind}:`);
    let r: ConvTable;
    try { r = await engine.conversations(tap); } catch (e) { list.replaceChildren(h('div', { class: 'empty err' }, (e as Error).message)); return; }
    list.replaceChildren();
    const port = (p: string) => (p ? `:${p}` : '');
    if (kind === 'conv') {
      const rows = r.convs.sort((a, b) => b.bytes - a.bytes).slice(0, 1000);
      if (!rows.length) list.append(h('div', { class: 'empty' }, t('None in this capture.')));
      for (const c of rows) list.append(h('button', { class: 'row', onclick: () => applyFilter(c.filter) },
        h('div', { class: 'row-main' },
          h('div', { class: 'row-title mono' }, `${c.a}${port(c.ap)}`),
          h('div', { class: 'row-title mono' }, `↔ ${c.b}${port(c.bp)}`),
          h('div', { class: 'row-sub' }, `${c.frames} ${t('packets')} · ${fmtBytes(c.bytes)} · ${(c.stop - c.start).toFixed(2)} s`)),
        icon('chevron')));
    } else {
      const rows = r.hosts.sort((a, b) => b.bytes - a.bytes).slice(0, 1000);
      if (!rows.length) list.append(h('div', { class: 'empty' }, t('None in this capture.')));
      for (const x of rows) list.append(h('button', { class: 'row', onclick: () => applyFilter(x.filter) },
        h('div', { class: 'row-main' },
          h('div', { class: 'row-title mono' }, `${x.host}${port(x.port)}`),
          h('div', { class: 'row-sub' }, `${x.frames} ${t('packets')} · ${fmtBytes(x.bytes)}`)),
        icon('chevron')));
    }
  };
  box.append(
    h('div', { class: 'seg conv-seg' }, CONV_TAPS.map(([label], i) => h('button', { class: i === 0 ? 'on' : '', onclick: (e: Event) => { which = i; seg(e); void load(); } }, label))),
    h('div', { class: 'pad muted small' }, kind === 'conv' ? t('Tap a conversation to show its packets.') : t('Tap an endpoint to show its packets.')),
    list);
  void load();
  return box;
}
