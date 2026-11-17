import './style.css';
import './style2.css';
import './app.css';
import { App as CapApp } from '@capacitor/app';
import { Filesystem } from '@capacitor/filesystem';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import * as engine from './engine';
import type { Row, Summary } from './engine-types';
import { deleteCapture, listCaptures, readCapture, renameCapture, saveCapture, touchCapture, type CaptureMeta } from './captures';
import { applyTheme, getLangPref, getThemePref, setLangPref, setThemePref, t, type LangPref, type Theme } from './i18n';
import { conversationsView, fmtBytes, openPacket } from './packet';
import { captureOpened } from './review';
import { confirmBox, fmtDate, fmtMs, h, icon, native, promptBox, sheet, shareFile, toast } from './ui';

const app = document.getElementById('app')!;
const VERSION = '1.0.0';
const SOURCE_URL = 'https://github.com/heyobi/packetlens';

// ---------------- samples ----------------
type Sample = { file: string; title: string; sub: string; filter: string };
const SAMPLES: Sample[] = [
  { file: 'http.cap', title: 'HTTP', sub: 'A web page download over plain HTTP', filter: 'http' },
  { file: 'dns.cap', title: 'DNS', sub: 'Queries for A, MX, TXT, LOC, AAAA… records', filter: 'dns' },
  { file: 'tls13-rfc8446.pcap', title: 'TLS 1.3', sub: 'A full TLS 1.3 handshake', filter: 'tls.handshake' },
  { file: 'pgsql.cap', title: 'PostgreSQL', sub: 'Client and server talking the PostgreSQL wire protocol', filter: 'pgsql' },
];

// ---------------- state ----------------
type Route = { view: 'home' } | { view: 'capture'; name: string; sample?: boolean };
let route: Route = { view: 'home' };
let current: { name: string; sample: boolean; summary: Summary } | null = null;
let filter = '';
let tab: 'packets' | 'conv' | 'endpt' = 'packets';

function go(r: Route) { route = r; render(); window.scrollTo(0, 0); }

function render() {
  document.body.classList.toggle('in-capture', route.view === 'capture');
  app.replaceChildren(route.view === 'home' ? home() : captureView());
}

// ---------------- home ----------------
function engineLine() {
  const el = h('div', { class: 'engine-line' });
  const off = engine.onStatus((s) => {
    el.className = `engine-line ${s.state}`;
    el.textContent = s.state === 'ready' ? t('Engine ready · works offline') : s.state === 'error' ? `${t('Engine error')}: ${s.message}` : t('Loading the dissection engine…');
  });
  new MutationObserver(() => { if (!el.isConnected) off(); }).observe(document.body, { childList: true, subtree: true });
  return el;
}

async function importFile(file: File) {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const meta = await saveCapture(file.name || 'capture.pcapng', bytes);
    await openCapture(meta.name, false, bytes);
  } catch (e) {
    toast((e as Error).message, 'err');
  }
}

function pickCapture(): Promise<File | null> {
  // No `accept` filter: iOS has no system type for .pcap/.pcapng, so a filter would grey those files out.
  return new Promise((resolve) => {
    const input = h('input', { type: 'file' }) as HTMLInputElement;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

function captureRow(c: CaptureMeta, refresh: () => void) {
  const more = h('button', { class: 'more', 'aria-label': t('More') }, icon('more'));
  more.addEventListener('click', (e) => {
    e.stopPropagation();
    sheet(c.name, [
      { label: t('Share'), run: async () => { const b = await readCapture(c.name); if (b) await shareFile(c.name, new Blob([b as BlobPart]), 'application/vnd.tcpdump.pcap'); } },
      { label: t('Rename'), run: async () => { const n = await promptBox(t('Rename'), t('Name'), c.name); if (n && n !== c.name) { await renameCapture(c.name, n); refresh(); } } },
      { label: t('Delete'), danger: true, run: async () => { if (await confirmBox(t('Delete capture?'), c.name, t('Delete'), true)) { await deleteCapture(c.name); refresh(); } } },
    ]);
  });
  const sub = [c.size ? fmtBytes(c.size) : '', c.packets != null ? `${c.packets} ${t('packets')}` : '', c.opened || c.added ? fmtDate(c.opened || c.added) : ''].filter(Boolean).join(' · ');
  return h('div', { class: 'row', role: 'button', onclick: () => void openCapture(c.name, false) },
    h('div', { class: 'row-icon' }, icon('wave')),
    h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, c.name), h('div', { class: 'row-sub' }, sub)),
    more);
}

function settingsBlock() {
  const segOf = <T extends string>(val: T, opts: [T, string][], set: (v: T) => void) =>
    h('div', { class: 'seg' }, opts.map(([v, label]) => h('button', { class: v === val ? 'on' : '', onclick: () => { set(v); render(); } }, t(label))));
  return h('div', { id: 'settings' },
    h('div', { class: 'section' }, t('Settings')),
    h('div', { class: 'list' },
      h('div', { class: 'row' }, h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, t('Appearance'))),
        segOf<Theme>(getThemePref(), [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']], setThemePref)),
      h('div', { class: 'row' }, h('div', { class: 'row-main' }, h('div', { class: 'row-title' }, t('Language'))),
        segOf<LangPref>(getLangPref(), [['system', 'System'], ['en', 'English'], ['tr', 'Türkçe']], setLangPref))),
    h('div', { class: 'section' }, t('About')),
    h('div', { class: 'info' },
      h('div', {}, h('b', {}, 'Packet Lens '), VERSION),
      h('div', { class: 'muted' }, t('Packets are dissected on this iPhone by Wireshark’s open-source dissection engine (version 4.6), compiled to WebAssembly by the Wiregasm project. Nothing is uploaded; no account, no tracking.')),
      h('div', { class: 'muted' }, t('Packet Lens is free software under the GNU General Public License v2 or later. It is not affiliated with or endorsed by the Wireshark Foundation.')),
      h('a', { class: 'link', href: SOURCE_URL, target: '_blank', rel: 'noopener' }, t('Source code on GitHub')),
      engine.initMs ? h('div', { class: 'muted small' }, `${t('Engine start')}: ${fmtMs(engine.initMs)}`) : ''));
}

function home() {
  const listBox = h('div', {});
  const refresh = async () => {
    const caps = await listCaptures();
    listBox.replaceChildren(
      h('div', { class: 'section' }, t('Your captures')),
      caps.length ? h('div', { class: 'list' }, caps.map((c) => captureRow(c, () => void refresh())))
        : h('div', { class: 'list' }, h('div', { class: 'empty' }, t('No captures yet. Open a .pcap or .pcapng file, or try a sample below.'))));
  };
  void refresh();
  const gear = h('button', { class: 'gear', 'aria-label': t('Settings'), onclick: () => document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' }) }, icon('gear'));
  return h('div', { class: 'page' },
    h('header', { class: 'bar' }, h('div', { class: 'bar-title big' }, 'Packet Lens'), gear),
    engineLine(),
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary grow', onclick: async () => { const f = await pickCapture(); if (f) await importFile(f); } }, icon('import'), t('Open capture file'))),
    h('div', { class: 'pad muted small' }, t('pcap, pcapng and other formats Wireshark reads. You can also share a file to Packet Lens from Files, Mail or AirDrop.')),
    listBox,
    h('div', { class: 'section' }, t('Sample captures')),
    h('div', { class: 'cards' }, SAMPLES.map((s) =>
      h('button', { class: 'card', onclick: () => void openCapture(s.file, true) },
        h('div', { class: 'card-title' }, s.title), h('div', { class: 'card-sub' }, t(s.sub))))),
    h('div', { class: 'pad muted small' }, t('Samples from the Wireshark wiki and test suite.')),
    h('div', { class: 'section' }, t('Where do captures come from?')),
    h('div', { class: 'info tips' },
      h('div', {}, h('b', {}, 'Mac / Linux: '), h('code', {}, 'sudo tcpdump -i en0 -w out.pcap')),
      h('div', {}, h('b', {}, t('Your iPhone’s own traffic: ')), t('connect it to a Mac and run'), ' ', h('code', {}, 'rvictl -s <UDID>'), t(', then capture on rvi0.')),
      h('div', {}, h('b', {}, 'Wireshark / tshark: '), t('save as pcapng and AirDrop the file to this iPhone.')),
      h('div', { class: 'muted small' }, t('iOS does not let apps capture network traffic themselves; Packet Lens opens and analyses capture files.'))),
    settingsBlock());
}

// ---------------- open ----------------
let opening = false;
async function openCapture(name: string, sample: boolean, bytes?: Uint8Array) {
  if (opening) return;
  opening = true;
  const busy = h('div', { class: 'busy' }, h('div', { class: 'busy-card' }, h('div', { class: 'spinner' }), h('div', {}, t('Dissecting…')), h('div', { class: 'muted small' }, name)));
  document.body.append(busy);
  try {
    if (!bytes) {
      if (sample) {
        const r = await fetch(`samples/${name}`);
        if (!r.ok) throw new Error(`sample ${name}: ${r.status}`);
        bytes = new Uint8Array(await r.arrayBuffer());
      } else {
        const b = await readCapture(name);
        if (!b) throw new Error(t('File not found'));
        bytes = b;
      }
    }
    const summary = await engine.load(name, bytes);
    if (!sample) touchCapture(name, summary.packets);
    current = { name, sample, summary };
    filter = sample ? SAMPLES.find((s) => s.file === name)?.filter ?? '' : '';
    tab = 'packets';
    captureOpened();
    go({ view: 'capture', name, sample });
  } catch (e) {
    toast(`${t('Could not open this file')}: ${(e as Error).message}`, 'err');
  } finally {
    busy.remove();
    opening = false;
  }
}

// ---------------- capture view ----------------
const QUICK = ['http', 'dns', 'tls', 'tcp', 'udp', 'icmp || icmpv6', 'arp', 'quic', 'tcp.analysis.flags', 'tcp.flags.syn == 1 && tcp.flags.ack == 0', 'pgsql', 'mysql', 'dhcp', 'mdns', 'smb2'];

function packetRow(r: Row, onOpen: (n: number) => void) {
  const [no, time, src, dst, proto, len, info] = r.c;
  const color = r.bg ? `#${r.bg.toString(16).padStart(6, '0')}` : '';
  const el = h('div', { class: 'pr', role: 'button', 'data-n': no, onclick: () => onOpen(r.n) },
    h('div', { class: 'pr-1' },
      h('span', { class: 'pr-no' }, no),
      h('span', { class: 'pr-time' }, time),
      h('span', { class: 'pr-proto', style: color ? { background: color, color: `#${(r.fg || 0x101010).toString(16).padStart(6, '0')}` } : {} }, proto),
      h('span', { class: 'pr-len' }, len)),
    h('div', { class: 'pr-addr' }, `${src} → ${dst}`),
    h('div', { class: 'pr-info' }, info));
  if (color) el.style.setProperty('--row', color);
  return el;
}

function captureView() {
  if (!current) { route = { view: 'home' }; return home(); }
  const cap = current;
  const s = cap.summary;
  const page = h('div', { class: 'page capture' });
  const back = h('button', { class: 'back', onclick: () => go({ view: 'home' }) }, icon('back'), t('Captures'));
  const more = h('button', { class: 'gear', 'aria-label': t('More') }, icon('more'));
  more.addEventListener('click', () => sheet(cap.name, [
    ...(cap.sample ? [{ label: t('Save to my captures'), run: async () => { const r = await fetch(`samples/${cap.name}`); const m = await saveCapture(cap.name, new Uint8Array(await r.arrayBuffer())); toast(`${t('Saved')}: ${m.name}`); } }] : []),
    { label: t('Share file'), run: async () => { const b = cap.sample ? new Uint8Array(await (await fetch(`samples/${cap.name}`)).arrayBuffer()) : await readCapture(cap.name); if (b) await shareFile(cap.name, new Blob([b as BlobPart]), 'application/vnd.tcpdump.pcap'); } },
    { label: t('Capture info'), run: () => toast(`${s.file_type} · ${s.encap} · ${fmtBytes(s.length)}`) },
  ]));
  const dur = s.elapsed ? `${s.elapsed.toFixed(s.elapsed < 10 ? 3 : 1)} s` : '';
  const header = h('header', { class: 'bar' }, back, h('div', { class: 'grow' }), more);
  const titleEl = h('div', { class: 'cap-title' }, h('div', { class: 'cap-name' }, cap.name), h('div', { class: 'cap-sub muted' }, [`${s.packets} ${t('packets')}`, dur, s.file_type].filter(Boolean).join(' · ')));

  const tabs = h('div', { class: 'seg cap-tabs' },
    ([['packets', 'Packets'], ['conv', 'Conversations'], ['endpt', 'Endpoints']] as const).map(([k, label]) =>
      h('button', { class: tab === k ? 'on' : '', onclick: () => { tab = k; render(); } }, t(label))));

  const applyFilter = (f: string) => { filter = f; tab = 'packets'; render(); window.scrollTo(0, 0); };
  page.append(header, titleEl, tabs);
  if (tab !== 'packets') { page.append(conversationsView(tab, applyFilter)); return page; }

  // ----- filter bar -----
  const input = h('input', { class: 'filter-in', type: 'search', value: filter, placeholder: t('Display filter, e.g. http or ip.addr == 10.0.0.1'), 'aria-label': t('Display filter'), autocapitalize: 'none', autocorrect: 'off', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'search' }) as HTMLInputElement;
  const errLine = h('div', { class: 'filter-err' });
  const sugg = h('div', { class: 'sugg hidden' });
  const form = h('form', { class: 'filter', onsubmit: (e: Event) => { e.preventDefault(); input.blur(); void apply(input.value.trim()); } }, icon('filter'), input);
  let checkSeq = 0;
  input.addEventListener('input', async () => {
    const v = input.value;
    const my = ++checkSeq;
    const r = await engine.checkFilter(v.trim()).catch(() => ({ ok: false, error: '' }));
    if (my !== checkSeq) return;
    form.classList.toggle('bad', !r.ok && !!v.trim());
    form.classList.toggle('good', r.ok && !!v.trim());
    errLine.textContent = r.ok ? '' : r.error;
    const tok = v.match(/([A-Za-z_][\w.-]*)$/)?.[1] ?? '';
    if (tok.length >= 2) {
      const list = await engine.complete(tok).catch(() => []);
      if (my !== checkSeq) return;
      sugg.replaceChildren(...list.slice(0, 12).map((x) => h('button', { type: 'button', class: 'sugg-item', onclick: () => { input.value = v.slice(0, v.length - tok.length) + x.field; input.focus(); input.dispatchEvent(new Event('input')); } },
        h('span', { class: 'mono' }, x.field), h('span', { class: 'muted small' }, x.name))));
      sugg.classList.toggle('hidden', list.length === 0);
    } else sugg.classList.add('hidden');
  });
  input.addEventListener('blur', () => setTimeout(() => sugg.classList.add('hidden'), 200));
  const chips = h('div', { class: 'hscroll chips' }, QUICK.map((q) => h('button', { class: `chip${q === filter ? ' on' : ''}`, onclick: () => { input.value = q; void apply(q); } }, q)));
  const clear = filter ? h('button', { class: 'link', onclick: () => { input.value = ''; void apply(''); } }, t('Clear filter')) : '';

  const count = h('div', { class: 'count muted small' });
  const listEl = h('div', { class: 'plist' });
  const sentinel = h('div', { class: 'sentinel' });
  page.append(form, sugg, errLine, chips, h('div', { class: 'count-row' }, count, clear), listEl, sentinel);

  // ----- packet list with paging -----
  const PAGE = 300;
  let rows: Row[] = [];
  let matched = 0;
  let loading = false;
  let gen = 0;
  const openRow = (n: number) => void openPacket(n, {
    applyFilter,
    neighbor: (cur, dir) => {
      const i = rows.findIndex((r) => r.n === cur);
      if (i >= 0 && rows[i + dir]) return rows[i + dir].n;
      if (!filter) { const n2 = cur + dir; return n2 >= 1 && n2 <= s.packets ? n2 : null; }
      return null;
    },
  });
  const more_ = async () => {
    if (loading || (rows.length >= matched && rows.length > 0)) return;
    loading = true;
    const my = gen;
    try {
      const r = await engine.frames(filter, rows.length, PAGE);
      if (my !== gen) return;
      matched = r.matched;
      rows.push(...r.rows);
      const frag = document.createDocumentFragment();
      for (const row of r.rows) frag.append(packetRow(row, openRow));
      listEl.append(frag);
      count.textContent = filter ? `${matched} / ${s.packets} ${t('packets match')}` : `${s.packets} ${t('packets')}`;
      if (!matched) listEl.replaceChildren(h('div', { class: 'empty' }, t('No packets match this filter.')));
    } catch (e) {
      count.textContent = '';
      listEl.replaceChildren(h('div', { class: 'empty err' }, (e as Error).message));
    } finally {
      loading = false;
    }
    if (sentinel.getBoundingClientRect().top < window.innerHeight + 600) void more_();
  };
  const apply = async (f: string) => {
    if (f) {
      const r = await engine.checkFilter(f);
      if (!r.ok) { form.classList.add('bad'); errLine.textContent = r.error || t('Invalid filter'); return; }
    }
    if (f !== filter) { filter = f; render(); }
  };
  new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) void more_(); }, { rootMargin: '800px' }).observe(sentinel);
  gen++;
  void more_();
  return page;
}

// ---------------- files shared to the app ----------------
async function openSharedUrl(url: string) {
  if (!/^file:/i.test(url)) return;
  try {
    const name = decodeURIComponent(url.split('/').pop() || 'capture.pcapng');
    let bytes: Uint8Array | null = null;
    try {
      const r = await fetch((window as unknown as { Capacitor: { convertFileSrc(u: string): string } }).Capacitor.convertFileSrc(url));
      if (r.ok) bytes = new Uint8Array(await r.arrayBuffer());
    } catch { /* try Filesystem */ }
    if (!bytes) {
      const f = await Filesystem.readFile({ path: url });
      const bin = atob(typeof f.data === 'string' ? f.data : '');
      bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    }
    const meta = await saveCapture(name, bytes);
    Filesystem.deleteFile({ path: url }).catch(() => {});
    await openCapture(meta.name, false, bytes);
  } catch (e) {
    toast(`${t('Could not open this file')}: ${(e as Error).message}`, 'err');
  }
}

// ---------------- boot ----------------
async function boot() {
  applyTheme();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());
  render();
  if (native) {
    StatusBar.setStyle({ style: Style.Default }).catch(() => {});
    Keyboard.addListener('keyboardWillShow', () => document.body.classList.add('kb-open')).catch(() => {});
    Keyboard.addListener('keyboardWillHide', () => document.body.classList.remove('kb-open')).catch(() => {});
    CapApp.addListener('appUrlOpen', (e) => void openSharedUrl(e.url)).catch(() => {});
    CapApp.getLaunchUrl().then((u) => { if (u?.url) void openSharedUrl(u.url); }).catch(() => {});
  }
  // Close the keyboard when the list is scrolled.
  window.addEventListener('scroll', () => { const a = document.activeElement as HTMLElement | null; if (a?.tagName === 'INPUT') a.blur(); }, { passive: true });
  setTimeout(() => SplashScreen.hide().catch(() => {}), 150);
  void engine.start().catch(() => {});
  if (location.search.includes('selftest')) {
    (window as unknown as Record<string, unknown>).__pl = { engine, openCapture, samples: SAMPLES.map((x) => x.file), state: () => ({ route, filter, tab, current }) };
  }
}
void boot();
