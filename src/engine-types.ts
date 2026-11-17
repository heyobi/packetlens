// Plain-JSON shapes passed between the engine worker and the UI.
export type Req = { id: number; method: string; args: unknown[] };
export type Res = { id: number; ok: true; value: unknown } | { id: number; ok: false; error: string };

export type Summary = { file_type: string; encap: string; packets: number; start: number; stop: number; elapsed: number; length: number };
/** One packet-list row: number, columns (No., Time, Source, Destination, Protocol, Length, Info), colouring rule colours. */
export type Row = { n: number; c: string[]; bg: number; fg: number };
/** Protocol tree node: label, filter field, byte start/length in data source `ds`, type, frame link, children. */
export type Node = { l: string; f: string; s: number; n: number; ds: number; t: string; fn?: number; c: Node[] };
export type FrameDetail = { n: number; tree: Node[]; sources: { name: string; bytes: Uint8Array }[]; follow: string[][]; comments: string[] };
export type StreamData = { client: string; server: string; cbytes: number; sbytes: number; chunks: { n: number; server: boolean; bytes: Uint8Array }[] };
export type Conv = { a: string; ap: string; b: string; bp: string; frames: number; bytes: number; start: number; stop: number; filter: string };
export type Host = { host: string; port: string; frames: number; bytes: number; filter: string };
export type ConvTable = { convs: Conv[]; hosts: Host[] };
