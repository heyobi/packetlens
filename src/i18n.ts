// Interface language (English / Turkish) and appearance (system / light / dark). Both are per-device preferences.
// Strings are keyed by their English text; a missing translation falls back to English.

export type Lang = 'en' | 'tr';
export type LangPref = 'system' | Lang;
export type Theme = 'system' | 'light' | 'dark';

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

let langPref = (read('pl-lang') as LangPref) || 'system';
let themePref = (read('pl-theme') as Theme) || 'system';

export const getLangPref = () => langPref;
export const getThemePref = () => themePref;
export const lang = (): Lang => (langPref === 'system' ? (navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en' : langPref);

export function setLangPref(v: LangPref) { langPref = v; write('pl-lang', v); document.documentElement.lang = lang(); }
export function setThemePref(v: Theme) { themePref = v; write('pl-theme', v); applyTheme(); }

export function isDark(): boolean {
  if (themePref === 'dark') return true;
  if (themePref === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
export function applyTheme() {
  const r = document.documentElement;
  if (themePref === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', themePref);
  r.style.colorScheme = isDark() ? 'dark' : 'light';
}
applyTheme();
document.documentElement.lang = lang();

const TR: Record<string, string> = {
  ', then capture on rvi0.': ', sonra rvi0 üzerinde yakalayın.',
  'About': 'Hakkında',
  'Appearance': 'Görünüm',
  'Apply as filter': 'Filtre olarak uygula',
  'Bytes': 'Baytlar',
  'Cancel': 'Vazgeç',
  'Capture info': 'Dosya bilgisi',
  'Captures': 'Yakalamalar',
  'Clear filter': 'Filtreyi temizle',
  'Copied': 'Kopyalandı',
  'Copy filter': 'Filtreyi kopyala',
  'Copy line': 'Satırı kopyala',
  'Could not open this file': 'Bu dosya açılamadı',
  'Delete capture?': 'Yakalama silinsin mi?',
  'Delete': 'Sil',
  'Display filter': 'Görüntüleme filtresi',
  'Display filter, e.g. http or ip.addr == 10.0.0.1': 'Görüntüleme filtresi, ör. http ya da ip.addr == 10.0.0.1',
  'Dissecting…': 'Çözümleniyor…',
  'Engine error': 'Motor hatası',
  'Engine ready · works offline': 'Motor hazır · internetsiz çalışır',
  'Engine start': 'Motorun açılışı',
  'File not found': 'Dosya bulunamadı',
  'Filter': 'Filtrele',
  'Follow {p} stream': '{p} akışını izle',
  '{p} stream': '{p} akışı',
  'Tap a line to see its bytes. Long-press to filter by it.': 'Baytlarını görmek için satıra dokunun. Filtrelemek için basılı tutun.',
  'Invalid filter': 'Geçersiz filtre',
  'Language': 'Dil',
  'Loading the dissection engine…': 'Çözümleme motoru yükleniyor…',
  'Loading…': 'Yükleniyor…',
  'More': 'Diğer',
  'Name': 'Ad',
  'Next packet': 'Sonraki paket',
  'No captures yet. Open a .pcap or .pcapng file, or try a sample below.': 'Henüz yakalama yok. Bir .pcap ya da .pcapng dosyası açın veya aşağıdaki örnekleri deneyin.',
  'No packets match this filter.': 'Bu filtreye uyan paket yok.',
  'No payload in this stream.': 'Bu akışta veri yok.',
  'None in this capture.': 'Bu yakalamada yok.',
  'OK': 'Tamam',
  'Open capture file': 'Yakalama dosyası aç',
  'Packet Lens is free software under the GNU General Public License v2 or later. It is not affiliated with or endorsed by the Wireshark Foundation.': 'Packet Lens, GNU Genel Kamu Lisansı v2 veya sonrası altında özgür yazılımdır. Wireshark Foundation ile bağlantılı değildir ve onun tarafından onaylanmamıştır.',
  'Packet': 'Paket',
  'Packets are dissected on this iPhone by Wireshark’s open-source dissection engine (version 4.6), compiled to WebAssembly by the Wiregasm project. Nothing is uploaded; no account, no tracking.': 'Paketler bu iPhone’da, Wireshark’ın açık kaynak çözümleme motoruyla (sürüm 4.6) çözümlenir; motor Wiregasm projesi tarafından WebAssembly’ye derlenmiştir. Hiçbir şey yüklenmez; hesap yok, izleme yok.',
  'Previous packet': 'Önceki paket',
  'Protocol tree': 'Protokol ağacı',
  'Rename': 'Yeniden adlandır',
  'Sample captures': 'Örnek yakalamalar',
  'Samples from the Wireshark wiki and test suite.': 'Örnekler Wireshark wiki’sinden ve test paketinden.',
  'Save to my captures': 'Yakalamalarıma kaydet',
  'Saved': 'Kaydedildi',
  'Settings': 'Ayarlar',
  'Share file': 'Dosyayı paylaş',
  'Share': 'Paylaş',
  'Source code on GitHub': 'GitHub’da kaynak kodu',
  'Tap a conversation to show its packets.': 'Paketlerini görmek için bir konuşmaya dokunun.',
  'Tap an endpoint to show its packets.': 'Paketlerini görmek için bir uç noktaya dokunun.',
  'Type a name first.': 'Önce bir ad yazın.',
  'Where do captures come from?': 'Yakalama dosyaları nereden gelir?',
  'Your captures': 'Yakalamalarınız',
  'Your iPhone’s own traffic: ': 'iPhone’unuzun kendi trafiği: ',
  'connect it to a Mac and run': 'bir Mac’e bağlayıp şunu çalıştırın:',
  'iOS does not let apps capture network traffic themselves; Packet Lens opens and analyses capture files.': 'iOS uygulamaların ağ trafiğini kendisinin yakalamasına izin vermez; Packet Lens yakalama dosyalarını açar ve çözümler.',
  'more': 'daha',
  'packets match': 'paket eşleşti',
  'packets': 'paket',
  'pcap, pcapng and other formats Wireshark reads. You can also share a file to Packet Lens from Files, Mail or AirDrop.': 'pcap, pcapng ve Wireshark’ın okuduğu diğer biçimler. Dosyaları Dosyalar, Mail ya da AirDrop’tan Packet Lens’e de paylaşabilirsiniz.',
  'save as pcapng and AirDrop the file to this iPhone.': 'pcapng olarak kaydedip dosyayı AirDrop ile bu iPhone’a gönderin.',

  'Packets': 'Paketler',
  'Conversations': 'Konuşmalar',
  'Endpoints': 'Uç noktalar',
  'System': 'Sistem',
  'Light': 'Açık',
  'Dark': 'Koyu',
  'English': 'English',
  'Türkçe': 'Türkçe',
  'A web page download over plain HTTP': 'Düz HTTP üzerinden bir web sayfası indirme',
  'Queries for A, MX, TXT, LOC, AAAA… records': 'A, MX, TXT, LOC, AAAA… kayıt sorguları',
  'A full TLS 1.3 handshake': 'Eksiksiz bir TLS 1.3 el sıkışması',
  'Client and server talking the PostgreSQL wire protocol': 'PostgreSQL protokolüyle konuşan istemci ve sunucu',
};

/** Translate an English UI string. */
export function t(s: string): string {
  return lang() === 'tr' ? TR[s] ?? s : s;
}
