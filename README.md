# Packet Lens

Open and dissect packet captures (pcap / pcapng) on your iPhone, completely offline.

Packet Lens runs **Wireshark's real dissection engine** (version 4.6, 3,000+ protocols) on the phone, compiled to WebAssembly by the [Wiregasm](https://github.com/good-tools/wiregasm) project. It is not a pcap parser written from scratch: you get the same protocol trees, display filters and colouring rules you know from the desktop.

- **Packet list** with Wireshark's colouring rules, infinite scrolling for large files
- **Display filters** (`http`, `tcp.port == 443`, `dns.qry.name contains "apple"`, …) checked as you type, with field-name suggestions
- **Protocol tree** for every packet; tap a line to highlight its bytes in the hex dump, long-press to filter by it
- **Follow TCP / UDP / HTTP streams** in ASCII or hex
- **Conversations and endpoints** (TCP, UDP, IPv4, IPv6, Ethernet)
- Open files from Files, Mail or AirDrop ("Open in Packet Lens"); saved captures appear in the Files app
- Sample captures (HTTP, DNS, TLS 1.3, PostgreSQL) to try right away
- English and Turkish interface, light and dark mode
- No network access, no account, no tracking

iOS does not allow apps to capture network traffic themselves, so Packet Lens analyses capture files made elsewhere (tcpdump, Wireshark, tshark, `rvictl` for an iPhone's own traffic, PCAPdroid on Android…).

## Build

```bash
npm ci
npm run dev          # http://localhost:5207
npm test             # Node: the samples dissect with the pinned engine
npm run build && npx vite preview --port 4173 &
node tests/webkit/app.mjs   # end-to-end checks in WebKit, the iPhone's browser engine
npx cap sync ios     # then open ios/App/App.xcodeproj in Xcode
```

Stack: Capacitor 8, Vite, TypeScript, plain DOM. The engine runs in a Web Worker (`src/engine.worker.ts`).

## Releases

Every push to `main` runs `.github/workflows/ios-testflight.yml`: type check, Node test, WebKit end-to-end test, then a signed build uploaded to TestFlight. Repository secrets: `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_PRIVATE_KEY`, `BUILD_CERTIFICATE_BASE64`, `P12_PASSWORD`, `KEYCHAIN_PASSWORD`.

## Licence

GPL-2.0-or-later, the same licence as Wireshark and Wiregasm (see [LICENSE](LICENSE)). The complete source code of every App Store build is in this repository.

Packet Lens is not affiliated with or endorsed by the Wireshark Foundation. "Wireshark" is a registered trademark of the Wireshark Foundation.

Sample captures in `public/samples/` come from the [Wireshark wiki](https://wiki.wireshark.org/SampleCaptures) and the Wireshark test suite.
