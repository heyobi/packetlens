# Writes store/listing.json (App Store text in 5 languages) and checks App Store length limits.
# Usage: python scripts/listing.py
import json

FEATURES = {
    "en-US": {
        "intro": "Open packet captures on your iPhone and see what is really on the wire.\n\nPacket Lens runs the open-source dissection engine from Wireshark (version 4.6) directly on your phone, compiled to WebAssembly. It is not a simple pcap reader: more than 3,000 protocols are decoded exactly as on the desktop, from Ethernet, IP, TCP and UDP to HTTP, DNS, TLS, QUIC, DHCP, SMB, PostgreSQL, MySQL and many more.",
        "sections": [
            ("PACKET LIST", ["Every packet with time, source, destination, protocol, length and summary", "Familiar colouring rules", "Smooth scrolling through large captures"]),
            ("DISPLAY FILTERS", ["Full display filter language: http, tcp.port == 443, dns.qry.name contains \"apple\", tcp.analysis.flags…", "Checked as you type, with field-name suggestions", "One-tap quick filters"]),
            ("PACKET DETAILS", ["Complete protocol tree for every packet", "Tap a line to highlight its bytes in the hex dump", "Long-press a line to filter by that field", "Reassembled data and decompressed bodies as separate byte views"]),
            ("STREAMS AND STATISTICS", ["Follow TCP, UDP and HTTP streams in ASCII or hex", "Conversations and endpoints for TCP, UDP, IPv4, IPv6 and Ethernet"]),
            ("FILES", ["Open .pcap, .pcapng and other capture formats from Files, Mail or AirDrop", "Saved captures appear in the Files app", "Sample captures included: HTTP, DNS, TLS 1.3, PostgreSQL"]),
            ("PRIVATE BY DESIGN", ["Everything happens on your device; nothing is uploaded", "No network access, no account, no tracking"]),
        ],
        "outro": "Note: iOS does not allow apps to capture network traffic. Packet Lens analyses capture files you record elsewhere, for example with tcpdump, Wireshark or tshark on a computer, rvictl for an iPhone's own traffic, or PCAPdroid on Android.\n\nFree and open source under the GNU GPL. Source code: github.com/heyobi/packetlens\nPacket Lens is not affiliated with or endorsed by the Wireshark Foundation.",
    },
    "tr": {
        "intro": "Paket yakalama dosyalarını iPhone'unuzda açın, ağda gerçekte neler olduğunu görün.\n\nPacket Lens, Wireshark'ın açık kaynak çözümleme motorunu (sürüm 4.6) WebAssembly'ye derlenmiş olarak doğrudan telefonunuzda çalıştırır. Basit bir pcap okuyucu değildir: Ethernet, IP, TCP ve UDP'den HTTP, DNS, TLS, QUIC, DHCP, SMB, PostgreSQL, MySQL ve daha fazlasına kadar 3.000'den fazla protokol masaüstündekiyle aynı şekilde çözülür.",
        "sections": [
            ("PAKET LİSTESİ", ["Her paket: zaman, kaynak, hedef, protokol, uzunluk ve özet", "Tanıdık renklendirme kuralları", "Büyük dosyalarda akıcı kaydırma"]),
            ("GÖRÜNTÜLEME FİLTRELERİ", ["Tam filtre dili: http, tcp.port == 443, dns.qry.name contains \"apple\", tcp.analysis.flags…", "Yazarken denetlenir, alan adları önerilir", "Tek dokunuşla hızlı filtreler"]),
            ("PAKET AYRINTILARI", ["Her paket için eksiksiz protokol ağacı", "Bir satıra dokunun, baytları hex dökümünde vurgulansın", "Satıra basılı tutun, o alana göre filtreleyin", "Birleştirilmiş veriler ve açılmış gövdeler ayrı bayt görünümlerinde"]),
            ("AKIŞLAR VE İSTATİSTİKLER", ["TCP, UDP ve HTTP akışlarını ASCII ya da hex olarak izleyin", "TCP, UDP, IPv4, IPv6 ve Ethernet için konuşmalar ve uç noktalar"]),
            ("DOSYALAR", [".pcap, .pcapng ve diğer biçimleri Dosyalar, Mail ya da AirDrop'tan açın", "Kaydedilen dosyalar Dosyalar uygulamasında görünür", "Örnek dosyalar: HTTP, DNS, TLS 1.3, PostgreSQL"]),
            ("GİZLİLİK ÖNCELİKLİ", ["Her şey cihazınızda olur; hiçbir şey yüklenmez", "İnternet erişimi yok, hesap yok, izleme yok"]),
        ],
        "outro": "Not: iOS uygulamaların ağ trafiğini yakalamasına izin vermez. Packet Lens başka yerde kaydettiğiniz dosyaları çözümler: bilgisayarda tcpdump, Wireshark ya da tshark, iPhone'un kendi trafiği için rvictl veya Android'de PCAPdroid gibi.\n\nGNU GPL ile ücretsiz ve açık kaynak. Kaynak kodu: github.com/heyobi/packetlens\nPacket Lens, Wireshark Foundation ile bağlantılı değildir ve onun tarafından onaylanmamıştır.",
    },
    "es-MX": {
        "intro": "Abre capturas de paquetes en tu iPhone y mira lo que realmente pasa por la red.\n\nPacket Lens ejecuta en tu teléfono el motor de disección de código abierto de Wireshark (versión 4.6), compilado a WebAssembly. No es un simple lector de pcap: más de 3,000 protocolos se decodifican igual que en la computadora, desde Ethernet, IP, TCP y UDP hasta HTTP, DNS, TLS, QUIC, DHCP, SMB, PostgreSQL, MySQL y muchos más.",
        "sections": [
            ("LISTA DE PAQUETES", ["Cada paquete con hora, origen, destino, protocolo, longitud y resumen", "Reglas de color conocidas", "Desplazamiento fluido en capturas grandes"]),
            ("FILTROS DE VISUALIZACIÓN", ["Lenguaje de filtros completo: http, tcp.port == 443, dns.qry.name contains \"apple\", tcp.analysis.flags…", "Se validan mientras escribes, con sugerencias de campos", "Filtros rápidos con un toque"]),
            ("DETALLES DEL PAQUETE", ["Árbol de protocolos completo para cada paquete", "Toca una línea para resaltar sus bytes en el volcado hexadecimal", "Mantén presionada una línea para filtrar por ese campo"]),
            ("FLUJOS Y ESTADÍSTICAS", ["Sigue flujos TCP, UDP y HTTP en ASCII o hexadecimal", "Conversaciones y puntos finales para TCP, UDP, IPv4, IPv6 y Ethernet"]),
            ("ARCHIVOS", ["Abre .pcap, .pcapng y otros formatos desde Archivos, Mail o AirDrop", "Las capturas guardadas aparecen en la app Archivos", "Capturas de ejemplo: HTTP, DNS, TLS 1.3, PostgreSQL"]),
            ("PRIVADO", ["Todo ocurre en tu dispositivo; no se sube nada", "Sin acceso a la red, sin cuenta, sin rastreo"]),
        ],
        "outro": "Nota: iOS no permite que las apps capturen tráfico de red. Packet Lens analiza archivos de captura grabados en otro lugar, por ejemplo con tcpdump, Wireshark o tshark en una computadora, rvictl para el tráfico del propio iPhone o PCAPdroid en Android.\n\nGratis y de código abierto bajo la GNU GPL. Código fuente: github.com/heyobi/packetlens\nPacket Lens no está afiliado ni respaldado por la Wireshark Foundation.",
    },
    "pt-BR": {
        "intro": "Abra capturas de pacotes no seu iPhone e veja o que realmente passa pela rede.\n\nO Packet Lens roda no seu telefone o motor de dissecação de código aberto do Wireshark (versão 4.6), compilado para WebAssembly. Não é um simples leitor de pcap: mais de 3.000 protocolos são decodificados como no computador, de Ethernet, IP, TCP e UDP a HTTP, DNS, TLS, QUIC, DHCP, SMB, PostgreSQL, MySQL e muitos outros.",
        "sections": [
            ("LISTA DE PACOTES", ["Cada pacote com horário, origem, destino, protocolo, tamanho e resumo", "Regras de cores conhecidas", "Rolagem suave em capturas grandes"]),
            ("FILTROS DE EXIBIÇÃO", ["Linguagem de filtros completa: http, tcp.port == 443, dns.qry.name contains \"apple\", tcp.analysis.flags…", "Validados enquanto você digita, com sugestões de campos", "Filtros rápidos com um toque"]),
            ("DETALHES DO PACOTE", ["Árvore de protocolos completa para cada pacote", "Toque em uma linha para destacar seus bytes no dump hexadecimal", "Pressione e segure uma linha para filtrar por aquele campo"]),
            ("FLUXOS E ESTATÍSTICAS", ["Siga fluxos TCP, UDP e HTTP em ASCII ou hexadecimal", "Conversas e endpoints para TCP, UDP, IPv4, IPv6 e Ethernet"]),
            ("ARQUIVOS", ["Abra .pcap, .pcapng e outros formatos pelo Arquivos, Mail ou AirDrop", "As capturas salvas aparecem no app Arquivos", "Capturas de exemplo: HTTP, DNS, TLS 1.3, PostgreSQL"]),
            ("PRIVADO", ["Tudo acontece no seu aparelho; nada é enviado", "Sem acesso à rede, sem conta, sem rastreamento"]),
        ],
        "outro": "Observação: o iOS não permite que apps capturem tráfego de rede. O Packet Lens analisa arquivos de captura gravados em outro lugar, por exemplo com tcpdump, Wireshark ou tshark no computador, rvictl para o tráfego do próprio iPhone ou PCAPdroid no Android.\n\nGratuito e de código aberto sob a GNU GPL. Código-fonte: github.com/heyobi/packetlens\nO Packet Lens não é afiliado nem endossado pela Wireshark Foundation.",
    },
    "de-DE": {
        "intro": "Öffne Paketmitschnitte auf deinem iPhone und sieh, was wirklich über die Leitung geht.\n\nPacket Lens führt die Open-Source-Analyse-Engine von Wireshark (Version 4.6), kompiliert zu WebAssembly, direkt auf deinem Telefon aus. Kein einfacher pcap-Leser: Über 3.000 Protokolle werden genau wie am Desktop dekodiert, von Ethernet, IP, TCP und UDP bis HTTP, DNS, TLS, QUIC, DHCP, SMB, PostgreSQL, MySQL und vielen mehr.",
        "sections": [
            ("PAKETLISTE", ["Jedes Paket mit Zeit, Quelle, Ziel, Protokoll, Länge und Zusammenfassung", "Vertraute Farbregeln", "Flüssiges Scrollen auch bei großen Mitschnitten"]),
            ("ANZEIGEFILTER", ["Vollständige Filtersprache: http, tcp.port == 443, dns.qry.name contains \"apple\", tcp.analysis.flags…", "Prüfung während der Eingabe, mit Feldvorschlägen", "Schnellfilter mit einem Tipp"]),
            ("PAKETDETAILS", ["Vollständiger Protokollbaum für jedes Paket", "Tippe auf eine Zeile, um ihre Bytes im Hex-Dump hervorzuheben", "Halte eine Zeile gedrückt, um nach diesem Feld zu filtern"]),
            ("STREAMS UND STATISTIK", ["TCP-, UDP- und HTTP-Streams in ASCII oder Hex verfolgen", "Verbindungen und Endpunkte für TCP, UDP, IPv4, IPv6 und Ethernet"]),
            ("DATEIEN", [".pcap, .pcapng und weitere Formate aus Dateien, Mail oder AirDrop öffnen", "Gespeicherte Mitschnitte erscheinen in der Dateien-App", "Beispielmitschnitte: HTTP, DNS, TLS 1.3, PostgreSQL"]),
            ("PRIVAT", ["Alles passiert auf deinem Gerät; nichts wird hochgeladen", "Kein Netzwerkzugriff, kein Konto, kein Tracking"]),
        ],
        "outro": "Hinweis: iOS erlaubt Apps nicht, Netzwerkverkehr mitzuschneiden. Packet Lens analysiert Mitschnitte, die du anderswo aufnimmst, etwa mit tcpdump, Wireshark oder tshark am Computer, rvictl für den Verkehr eines iPhones oder PCAPdroid unter Android.\n\nKostenlos und Open Source unter der GNU GPL. Quellcode: github.com/heyobi/packetlens\nPacket Lens steht in keiner Verbindung zur Wireshark Foundation und wird von ihr nicht unterstützt.",
    },
}

META = {
    "en-US": ("Offline packet capture viewer", "pcap,pcapng,tcpdump,network,packet,sniffer,protocol,tcp,dns,http,tls,dissector,filter,hex,ip",
              "Open pcap and pcapng files on your iPhone and inspect every packet with a real 3,000-protocol dissection engine. Offline, no account."),
    "tr": ("İnternetsiz paket çözümleyici", "pcap,pcapng,tcpdump,ağ,paket,sniffer,protokol,tcp,dns,http,tls,çözümleyici,filtre,hex,ip",
           "pcap ve pcapng dosyalarını iPhone'unuzda açın, her paketi 3.000 protokollü gerçek bir çözümleme motoruyla inceleyin. İnternetsiz, hesap yok."),
    "es-MX": ("Visor de capturas sin conexión", "pcap,pcapng,tcpdump,red,paquete,sniffer,protocolo,tcp,dns,http,tls,analizador,filtro,hex,ip",
              "Abre archivos pcap y pcapng en tu iPhone e inspecciona cada paquete con un motor de disección real de más de 3,000 protocolos. Sin conexión, sin cuenta."),
    "pt-BR": ("Leitor de capturas offline", "pcap,pcapng,tcpdump,rede,pacote,sniffer,protocolo,tcp,dns,http,tls,analisador,filtro,hex,ip",
              "Abra arquivos pcap e pcapng no iPhone e inspecione cada pacote com um motor de dissecação real de mais de 3.000 protocolos. Offline, sem conta."),
    "de-DE": ("Paketmitschnitte offline lesen", "pcap,pcapng,tcpdump,netzwerk,paket,sniffer,protokoll,tcp,dns,http,tls,analyse,filter,hex,ip",
              "Öffne pcap- und pcapng-Dateien auf dem iPhone und untersuche jedes Paket mit einer echten Analyse-Engine für über 3.000 Protokolle. Offline, ohne Konto."),
}

out = {}
for loc, f in FEATURES.items():
    desc = f["intro"] + "\n\n" + "\n\n".join(t + "\n" + "\n".join("• " + x for x in items) for t, items in f["sections"]) + "\n\n" + f["outro"]
    sub, kw, promo = META[loc]
    d = {"name": "Packet Lens: PCAP Analyzer", "subtitle": sub, "keywords": kw, "promo": promo, "description": desc}
    for k, lim in [("name", 30), ("subtitle", 30), ("keywords", 100), ("promo", 170), ("description", 4000)]:
        assert len(d[k]) <= lim, (loc, k, len(d[k]))
    out[loc] = d
    print(loc, {k: len(v) for k, v in d.items()})
with open("store/listing.json", "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
