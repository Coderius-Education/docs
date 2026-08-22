// WebSerial + MicroPython raw-paste protocol.
// Mirrors what pyboard.py / mpremote does, but in the browser.

// Minimal WebSerial types — the standard lib.dom typing is gated behind newer TS libs.
export interface SerialPort {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  getInfo?(): { usbVendorId?: number; usbProductId?: number };
}

interface SerialPortFilter {
  usbVendorId?: number;
  usbProductId?: number;
}

interface NavigatorWithSerial extends Navigator {
  serial: {
    requestPort(options?: { filters: SerialPortFilter[] }): Promise<SerialPort>;
  };
}

type PendingRead =
  | {
      kind: 'bytes';
      n: number;
      resolve: (v: Uint8Array) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  | {
      kind: 'pattern';
      pattern: Uint8Array;
      resolve: (v: Uint8Array) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  | {
      // Stroomt bytes direct door naar onChunk tot de terminator-byte komt.
      // Voor live output van een draaiend programma; bewust zonder timeout,
      // want een while True-loop mag uren draaien tot de leerling stopt.
      kind: 'stream';
      terminator: number;
      onChunk: (v: Uint8Array) => void;
      resolve: () => void;
      reject: (e: Error) => void;
      timer: null;
    };

function findPattern(buf: number[], pat: Uint8Array): number {
  outer: for (let i = 0; i <= buf.length - pat.length; i++) {
    for (let j = 0; j < pat.length; j++) {
      if (buf[i + j] !== pat[j]) continue outer;
    }
    return i;
  }
  return -1;
}

export type SerialStatus = 'disconnected' | 'connected' | 'busy';

// Beperk de poortkiezer tot de Arduino Nano RP2040 Connect. De RP2040 meldt
// zich met de Arduino-vendor (0x2341) of, bij een kale MicroPython-build, met
// de Raspberry Pi-vendor (0x2E8A). Andere USB-serial-apparaten blijven verborgen.
const RP2040_PORT_FILTERS = [
  { usbVendorId: 0x2341 }, // Arduino
  { usbVendorId: 0x2e8a }, // Raspberry Pi (RP2040)
];

export class SerialClient {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private buffer: number[] = [];
  private pending: PendingRead | null = null;
  private mode: 'normal' | 'raw' = 'normal';
  private readLoopDone: Promise<void> | null = null;
  private decoder = new TextDecoder('utf-8', { fatal: false });
  private encoder = new TextEncoder();

  onData?: (text: string) => void;
  onDisconnect?: () => void;

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  get status(): SerialStatus {
    if (!this.port) return 'disconnected';
    return this.mode === 'raw' ? 'busy' : 'connected';
  }

  /** USB-info van de verbonden poort (browsers geven geen vriendelijke naam). */
  get portInfo(): { usbVendorId?: number; usbProductId?: number } | null {
    return this.port?.getInfo?.() ?? null;
  }

  async connect(): Promise<void> {
    if (!SerialClient.isSupported()) throw new Error('WebSerial niet ondersteund in deze browser.');
    const port = await (navigator as NavigatorWithSerial).serial.requestPort({
      filters: RP2040_PORT_FILTERS,
    });
    await port.open({ baudRate: 115200 });
    this.attach(port);
  }

  /**
   * Koppel een al geopende poort. Los van connect() zodat tests een
   * nagemaakte poort kunnen aanbieden zonder WebSerial/browser.
   */
  attach(port: SerialPort): void {
    if (!port.readable || !port.writable) {
      throw new Error('Serieel apparaat heeft geen readable/writable stream na open().');
    }
    this.port = port;
    this.reader = port.readable.getReader();
    this.writer = port.writable.getWriter();
    this.buffer = [];
    this.mode = 'normal';
    this.readLoopDone = this.readLoop();
  }

  async disconnect(): Promise<void> {
    try {
      await this.reader?.cancel();
    } catch {
      /* ignore */
    }
    try {
      this.reader?.releaseLock();
    } catch {
      /* ignore */
    }
    try {
      this.writer?.releaseLock();
    } catch {
      /* ignore */
    }
    try {
      await this.port?.close();
    } catch {
      /* ignore */
    }
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.buffer = [];
    if (this.pending) {
      const p = this.pending;
      this.pending = null;
      if (p.timer !== null) clearTimeout(p.timer);
      p.reject(new Error('disconnected'));
    }
  }

  private async readLoop(): Promise<void> {
    if (!this.reader) return;
    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (!value || value.length === 0) continue;
        for (let i = 0; i < value.length; i++) this.buffer.push(value[i]);
        this.serviceBuffer();
      }
    } catch (e) {
      // stream error (e.g. cable unplugged)
    } finally {
      // Zonder dit blijft een pending read — het 'stream'-type heeft bewust
      // geen timeout — na een kabelverlies voor altijd hangen.
      if (this.pending) {
        const p = this.pending;
        this.pending = null;
        if (p.timer !== null) clearTimeout(p.timer);
        p.reject(new Error('disconnected'));
      }
      this.onDisconnect?.();
    }
  }

  private serviceBuffer(): void {
    while (this.pending) {
      const p = this.pending;
      if (p.kind === 'bytes') {
        if (this.buffer.length < p.n) return;
        const out = new Uint8Array(this.buffer.splice(0, p.n));
        this.pending = null;
        clearTimeout(p.timer);
        p.resolve(out);
      } else if (p.kind === 'stream') {
        const idx = this.buffer.indexOf(p.terminator);
        if (idx < 0) {
          // Terminator nog niet gezien: stuur alles door en blijf wachten.
          if (this.buffer.length > 0) p.onChunk(new Uint8Array(this.buffer.splice(0)));
          return;
        }
        if (idx > 0) p.onChunk(new Uint8Array(this.buffer.splice(0, idx)));
        this.buffer.splice(0, 1); // de terminator zelf
        this.pending = null;
        p.resolve();
      } else {
        const idx = findPattern(this.buffer, p.pattern);
        if (idx < 0) return;
        const end = idx + p.pattern.length;
        const out = new Uint8Array(this.buffer.splice(0, end));
        this.pending = null;
        clearTimeout(p.timer);
        p.resolve(out);
      }
    }
    if (this.mode === 'normal' && this.buffer.length > 0 && this.onData) {
      const bytes = new Uint8Array(this.buffer.splice(0));
      this.onData(this.decoder.decode(bytes, { stream: true }));
    }
  }

  private readBytes(n: number, timeoutMs = 3000): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      if (this.pending) return reject(new Error('concurrent read'));
      const timer = setTimeout(() => {
        if (this.pending && this.pending === r) {
          this.pending = null;
          reject(new Error(`read timeout (wanted ${n} bytes)`));
        }
      }, timeoutMs);
      const r: PendingRead = { kind: 'bytes', n, resolve, reject, timer };
      this.pending = r;
      this.serviceBuffer();
    });
  }

  /** Stroom bytes naar onChunk tot de terminator; geen timeout (zie 'stream'). */
  private readStream(terminator: number, onChunk: (v: Uint8Array) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.pending) return reject(new Error('concurrent read'));
      this.pending = { kind: 'stream', terminator, onChunk, resolve, reject, timer: null };
      this.serviceBuffer();
    });
  }

  private readUntil(pattern: Uint8Array, timeoutMs = 5000): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      if (this.pending) return reject(new Error('concurrent read'));
      const timer = setTimeout(() => {
        if (this.pending && this.pending === r) {
          this.pending = null;
          reject(new Error('read timeout (pattern not seen)'));
        }
      }, timeoutMs);
      const r: PendingRead = { kind: 'pattern', pattern, resolve, reject, timer };
      this.pending = r;
      this.serviceBuffer();
    });
  }

  private async writeRaw(data: Uint8Array | string): Promise<void> {
    if (!this.writer) throw new Error('not connected');
    const bytes = typeof data === 'string' ? this.encoder.encode(data) : data;
    await this.writer.write(bytes);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ---- MicroPython control ----

  /** Send Ctrl-C twice to interrupt running code. */
  async interrupt(): Promise<void> {
    await this.writeRaw(new Uint8Array([0x03, 0x03]));
  }

  /** Sends Ctrl-D in normal REPL → soft reboot, runs main.py. */
  async softReboot(): Promise<void> {
    this.mode = 'normal';
    this.buffer = [];
    await this.writeRaw(new Uint8Array([0x04]));
  }

  /** Type a line into the normal REPL (for ad-hoc commands). */
  async typeLine(line: string): Promise<void> {
    if (this.mode !== 'normal') throw new Error('not in normal REPL');
    await this.writeRaw(`${line}\r\n`);
  }

  /**
   * Enter raw REPL, run code via raw-paste, leave raw REPL again,
   * and return whatever the board printed on stdout/stderr.
   *
   * Met een onOutput-callback stroomt de uitvoer (stdout én stderr) live
   * binnen terwijl het programma draait, zonder timeout — voor "Test direct"
   * met een while True-loop die pas stopt als de leerling op Stop drukt.
   */
  async runCode(
    code: string,
    timeoutMs = 30000,
    onOutput?: (text: string) => void,
  ): Promise<{ stdout: string; stderr: string }> {
    await this.enterRawRepl();
    try {
      const result = await this.execRawPaste(code, timeoutMs, onOutput);
      return result;
    } finally {
      await this.exitRawRepl();
    }
  }

  private async enterRawRepl(): Promise<void> {
    this.mode = 'raw';
    // Drain any pending normal-mode output.
    this.buffer = [];
    // Ctrl-C twice to break running code.
    await this.writeRaw(new Uint8Array([0x03, 0x03]));
    await this.sleep(50);
    this.buffer = [];
    // Ctrl-A → raw REPL.
    await this.writeRaw(new Uint8Array([0x01]));
    // Expect "raw REPL; CTRL-B to exit\r\n>"
    await this.readUntil(this.encoder.encode('raw REPL; CTRL-B to exit\r\n>'), 5000);
  }

  private async exitRawRepl(): Promise<void> {
    try {
      await this.writeRaw(new Uint8Array([0x02])); // Ctrl-B
      await this.sleep(50);
    } catch {
      /* ignore */
    }
    this.buffer = [];
    this.mode = 'normal';
  }

  private async execRawPaste(
    code: string,
    timeoutMs: number,
    onOutput?: (text: string) => void,
  ): Promise<{ stdout: string; stderr: string }> {
    // Begin raw-paste: CAN 'A' SOH
    await this.writeRaw(new Uint8Array([0x05, 0x41, 0x01]));
    const head = await this.readBytes(2, 3000);
    if (head[0] !== 0x52 || head[1] !== 0x01) {
      throw new Error('raw-paste niet ondersteund door dit board');
    }
    const win = await this.readBytes(2, 3000);
    const windowSize = win[0] | (win[1] << 8);
    let windowRemain = windowSize;
    const flag = await this.readBytes(1, 3000);
    if (flag[0] !== 0x01) throw new Error('raw-paste handshake mislukt');

    const codeBytes = this.encoder.encode(code);
    let offset = 0;
    while (offset < codeBytes.length) {
      while (windowRemain === 0) {
        const b = await this.readBytes(1, 5000);
        if (b[0] === 0x01) {
          windowRemain += windowSize;
        } else if (b[0] === 0x04) {
          throw new Error('board afgebroken tijdens raw-paste');
        }
      }
      const take = Math.min(windowRemain, codeBytes.length - offset);
      await this.writeRaw(codeBytes.slice(offset, offset + take));
      offset += take;
      windowRemain -= take;
    }
    // End of input.
    await this.writeRaw(new Uint8Array([0x04]));
    const eofAck = await this.readBytes(1, 5000);
    if (eofAck[0] !== 0x04) throw new Error('einde-input niet bevestigd');

    if (onOutput) {
      // Live doorgeven; eigen decoders per fase zodat multi-byte-tekens die
      // over een chunkgrens vallen goed samenkomen.
      const verzamel = (decoder: TextDecoder, delen: string[]) => (bytes: Uint8Array) => {
        const tekst = decoder.decode(bytes, { stream: true });
        if (tekst) {
          delen.push(tekst);
          onOutput(tekst);
        }
      };
      const stdoutDelen: string[] = [];
      const stderrDelen: string[] = [];
      await this.readStream(0x04, verzamel(new TextDecoder(), stdoutDelen));
      await this.readStream(0x04, verzamel(new TextDecoder(), stderrDelen));
      await this.readUntil(new Uint8Array([0x3e]), 5000); // raw REPL '>' prompt
      return { stdout: stdoutDelen.join(''), stderr: stderrDelen.join('') };
    }

    const stdoutRaw = await this.readUntil(new Uint8Array([0x04]), timeoutMs);
    const stderrRaw = await this.readUntil(new Uint8Array([0x04]), timeoutMs);
    await this.readUntil(new Uint8Array([0x3e]), 5000); // raw REPL '>' prompt

    return {
      stdout: this.decoder.decode(stdoutRaw.slice(0, -1)),
      stderr: this.decoder.decode(stderrRaw.slice(0, -1)),
    };
  }
}
