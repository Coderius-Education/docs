import { afterEach, describe, expect, it, vi } from 'vitest';
import { SerialClient } from './serial';

// Test het raw-paste-protocol van de editor-kopie van SerialClient tegen een
// nagemaakt board: een SerialPort van web-streams waarachter een klein
// state-machientje de MicroPython-kant naspeelt (raw REPL-prompt,
// window-handshake, stdout/stderr-frames). Zelfde techniek als
// sites/robotica/src/components/WebMicroEditor/serial.test.ts; de nep-poort
// komt hier binnen via een gestubde navigator.serial.requestPort.
//
// Deze kopie wijkt bewust op een paar punten af van de robotica-versie, en
// deze tests leggen dat vast in plaats van het "recht te trekken":
// - geen attach(): de poort komt alleen via connect() en WebSerial binnen,
//   vandaar de navigator-stub (en de SerialPort-interface is niet geëxporteerd);
// - geen portInfo/getInfo();
// - geen live-uitvoer: runCode kent geen onOutput en geen 'stream'-leestype,
//   stdout en stderr worden gebufferd tot het frame compleet is;
// - readLoop rejecteert een openstaande read niet bij kabelverlies. Omdat de
//   reads hier allemaal een timeout hebben, eindigt een lopende run dan via
//   die timeout in plaats van meteen met 'disconnected' (de robotica-versie
//   heeft een timeoutloos stream-leestype en móet daarom wel rejecteren).

const ENC = new TextEncoder();

interface NepPoort {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

class NepBoard {
  /** Alles wat de client naar het board schreef, als bytes. */
  geschreven: number[] = [];
  /** De code-bytes die tijdens raw-paste binnenkwamen. */
  codeBytes: number[] = [];
  /** Waarmee de poort geopend werd (baudRate). */
  openOpties: { baudRate: number } | null = null;
  gesloten = false;

  private stand: 'normaal' | 'raw' | 'paste' = 'normaal';
  private beginReeks: number[] = [];
  private ontvangenInWindow = 0;
  private stuur!: (bytes: number[] | Uint8Array | string) => void;
  private kabelLos!: (e: Error) => void;

  constructor(
    private window: number,
    private stdout: string,
    private stderr: string,
    private rawPasteOndersteund = true,
    /** stuur stdout druppelsgewijs met echte vertraging, zoals een print-loop */
    private druppelStdout = false,
    /** stuur na de EOF-ack niets meer, zodat de client blijft wachten */
    private zwijgNaEof = false,
  ) {}

  /** Laat het board uit zichzelf tekst sturen (zoals print-uitvoer van main.py). */
  stuurTekst(t: string): void {
    this.stuur(t);
  }

  /** Simuleer een losgetrokken kabel: de leesstroom faalt hard. */
  trekKabelLos(): void {
    this.kabelLos(new Error('unplugged'));
  }

  maakPoort(): NepPoort {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const readable = new ReadableStream<Uint8Array>({
      start: (c) => {
        controller = c;
        this.kabelLos = (e) => controller.error(e);
      },
    });
    this.stuur = (bytes) => {
      controller.enqueue(typeof bytes === 'string' ? ENC.encode(bytes) : new Uint8Array(bytes));
    };
    const writable = new WritableStream<Uint8Array>({
      write: (chunk) => {
        for (const b of chunk) this.verwerkByte(b);
      },
    });
    return {
      readable,
      writable,
      open: async (options) => {
        this.openOpties = options;
      },
      close: async () => {
        this.gesloten = true;
      },
    };
  }

  private verwerkByte(b: number): void {
    this.geschreven.push(b);
    if (this.stand === 'paste') {
      if (b === 0x04) {
        // einde input: ack, dan stdout- en stderr-frames en de raw-prompt
        this.stand = 'raw';
        this.stuur([0x04]);
        if (this.zwijgNaEof) return; // programma "draait" en print niets
        const sluitAf = () => {
          this.stuur([0x04]);
          this.stuur(this.stderr);
          this.stuur([0x04]);
          this.stuur('>');
        };
        if (this.druppelStdout) {
          // eerste helft nu, tweede helft en het einde pas later — zoals een
          // programma dat al draaiend print
          const helft = Math.ceil(this.stdout.length / 2);
          this.stuur(this.stdout.slice(0, helft));
          setTimeout(() => {
            this.stuur(this.stdout.slice(helft));
            setTimeout(sluitAf, 5);
          }, 5);
        } else {
          this.stuur(this.stdout);
          sluitAf();
        }
        return;
      }
      this.codeBytes.push(b);
      this.ontvangenInWindow += 1;
      if (this.ontvangenInWindow === this.window) {
        this.ontvangenInWindow = 0;
        this.stuur([0x01]); // window vrijgeven
      }
      return;
    }

    // begin-reeks van raw-paste: 0x05 0x41 0x01
    if (this.beginReeks.length > 0 || b === 0x05) {
      this.beginReeks.push(b);
      if (this.beginReeks.length === 3) {
        const klopt =
          this.beginReeks[0] === 0x05 && this.beginReeks[1] === 0x41 && this.beginReeks[2] === 0x01;
        this.beginReeks = [];
        if (klopt) {
          if (!this.rawPasteOndersteund) {
            this.stuur([0x52, 0x00]); // 'R' zonder support-vlag
            return;
          }
          this.stand = 'paste';
          this.ontvangenInWindow = 0;
          this.stuur([0x52, 0x01, this.window & 0xff, this.window >> 8, 0x01]);
        }
      }
      return;
    }

    if (b === 0x01) {
      this.stand = 'raw';
      this.stuur('raw REPL; CTRL-B to exit\r\n>');
    } else if (b === 0x02) {
      this.stand = 'normaal';
    }
    // 0x03 (Ctrl-C) en gewone REPL-invoer: geen reactie nodig
  }
}

interface RequestPortOptions {
  filters: { usbVendorId?: number; usbProductId?: number }[];
}

/** Stub WebSerial: requestPort levert de nep-poort en onthoudt de gevraagde filters. */
function stubWebSerial(poort: NepPoort): { gevraagd: RequestPortOptions[] } {
  const gevraagd: RequestPortOptions[] = [];
  vi.stubGlobal('navigator', {
    serial: {
      requestPort: async (options: RequestPortOptions) => {
        gevraagd.push(options);
        return poort;
      },
    },
  });
  return { gevraagd };
}

async function verbonden(board: NepBoard): Promise<SerialClient> {
  stubWebSerial(board.maakPoort());
  const client = new SerialClient();
  await client.connect();
  return client;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SerialClient.connect', () => {
  it('weigert zonder WebSerial in de browser', async () => {
    vi.stubGlobal('navigator', {});
    await expect(new SerialClient().connect()).rejects.toThrow('WebSerial niet ondersteund');
    expect(SerialClient.isSupported()).toBe(false);
  });

  it('vraagt alleen RP2040-poorten en opent op 115200 baud', async () => {
    const board = new NepBoard(64, '', '');
    const { gevraagd } = stubWebSerial(board.maakPoort());
    const client = new SerialClient();

    await client.connect();

    expect(gevraagd).toEqual([{ filters: [{ usbVendorId: 0x2341 }, { usbVendorId: 0x2e8a }] }]);
    expect(board.openOpties).toEqual({ baudRate: 115200 });
    expect(client.status).toBe('connected');
  });

  it('sluit de poort bij disconnect en meldt zich daarna als disconnected', async () => {
    const board = new NepBoard(64, '', '');
    const client = await verbonden(board);

    await client.disconnect();

    expect(board.gesloten).toBe(true);
    expect(client.status).toBe('disconnected');
  });
});

describe('SerialClient raw-paste', () => {
  it('stuurt code naar het board en geeft stdout en stderr terug', async () => {
    const board = new NepBoard(64, 'hallo\r\n', '');
    const client = await verbonden(board);

    const { stdout, stderr } = await client.runCode('print("hallo")');

    expect(stdout).toBe('hallo\r\n');
    expect(stderr).toBe('');
    expect(new TextDecoder().decode(new Uint8Array(board.codeBytes))).toBe('print("hallo")');
  });

  it('geeft een traceback op stderr onaangetast door', async () => {
    const board = new NepBoard(64, '', 'Traceback (most recent call last):\r\nNameError: x\r\n');
    const client = await verbonden(board);

    const { stderr } = await client.runCode('x');

    expect(stderr).toContain('NameError');
  });

  it('respecteert het window: lange code komt volledig aan', async () => {
    // Window van 16 bytes dwingt meerdere rondes flow-control af.
    const board = new NepBoard(16, '', '');
    const client = await verbonden(board);
    const code = `teller = 0\n${'teller = teller + 1\n'.repeat(10)}`;

    await client.runCode(code);

    expect(new TextDecoder().decode(new Uint8Array(board.codeBytes))).toBe(code);
  });

  it('buffert druppelsgewijze uitvoer tot het frame compleet is', async () => {
    const board = new NepBoard(64, 'Links: 800\r\nLinks: 5000\r\n', '', true, true);
    const client = await verbonden(board);

    const { stdout } = await client.runCode('x');

    expect(stdout).toBe('Links: 800\r\nLinks: 5000\r\n');
  });

  it('meldt een board zonder raw-paste-ondersteuning', async () => {
    const board = new NepBoard(64, '', '', false);
    const client = await verbonden(board);

    await expect(client.runCode('x = 1')).rejects.toThrow('raw-paste niet ondersteund');
  });

  it('is busy tijdens een run en verlaat de raw REPL na afloop weer (Ctrl-B)', async () => {
    const board = new NepBoard(64, '', '');
    const client = await verbonden(board);

    const run = client.runCode('x = 1');
    expect(client.status).toBe('busy');
    await run;

    expect(board.geschreven).toContain(0x02);
    expect(client.status).toBe('connected');
  });

  it('typt een losse regel in de normale REPL met regeleinde', async () => {
    const board = new NepBoard(64, '', '');
    const client = await verbonden(board);

    await client.typeLine('print(1)');

    expect(new TextDecoder().decode(new Uint8Array(board.geschreven))).toBe('print(1)\r\n');
  });

  it('weigert typeLine terwijl een run bezig is', async () => {
    const board = new NepBoard(64, '', '', true, false, true);
    const client = await verbonden(board);

    const run = client.runCode('while True:\n    pass', 200);
    await new Promise((r) => setTimeout(r, 100));
    await expect(client.typeLine('print(1)')).rejects.toThrow('not in normal REPL');

    await expect(run).rejects.toThrow('read timeout');
  });

  it('geeft spontane board-uitvoer door via onData', async () => {
    const board = new NepBoard(64, '', '');
    const client = await verbonden(board);
    const ontvangen: string[] = [];
    client.onData = (t) => ontvangen.push(t);

    board.stuurTekst('rondje\r\n');
    await new Promise((r) => setTimeout(r, 10));

    expect(ontvangen.join('')).toBe('rondje\r\n');
  });

  it('meldt kabelverlies via onDisconnect; een lopende run eindigt via de leestimeout', async () => {
    // Zie het kopje bovenaan: geen pending-reject in readLoop in deze kopie,
    // dus niet 'disconnected' maar de timeout van readUntil beëindigt de run.
    const board = new NepBoard(64, '', '', true, false, true);
    const client = await verbonden(board);
    const onDisconnect = vi.fn();
    client.onDisconnect = onDisconnect;

    const run = client.runCode('while True:\n    pass', 200);
    // wacht tot de run voorbij de 50ms-interruptpauze van enterRawRepl is en
    // echt op de stdout-frame wacht
    await new Promise((r) => setTimeout(r, 120));
    board.trekKabelLos();
    await new Promise((r) => setTimeout(r, 10));

    expect(onDisconnect).toHaveBeenCalledTimes(1);
    await expect(run).rejects.toThrow('read timeout (pattern not seen)');
  });
});
