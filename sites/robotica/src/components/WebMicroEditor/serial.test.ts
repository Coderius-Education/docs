import { describe, expect, it } from 'vitest';
import type { SerialPort } from './serial';
import { SerialClient } from './serial';

// Test het raw-paste-protocol tegen een nagemaakt board: een SerialPort van
// web-streams waarachter een klein state-machientje de MicroPython-kant
// naspeelt (raw REPL-prompt, window-handshake, stdout/stderr-frames). Zo
// draait de volledige runCode-flow zonder browser of hardware.

const ENC = new TextEncoder();

class NepBoard {
  /** Alles wat de client naar het board schreef, als bytes. */
  geschreven: number[] = [];
  /** De code-bytes die tijdens raw-paste binnenkwamen. */
  codeBytes: number[] = [];

  private stand: 'normaal' | 'raw' | 'paste' = 'normaal';
  private beginReeks: number[] = [];
  private ontvangenInWindow = 0;
  private stuur!: (bytes: number[] | Uint8Array | string) => void;

  constructor(
    private window: number,
    private stdout: string,
    private stderr: string,
    private rawPasteOndersteund = true,
    /** stuur stdout druppelsgewijs met echte vertraging, zoals een print-loop */
    private druppelStdout = false,
  ) {}

  /** Laat het board uit zichzelf tekst sturen (zoals print-uitvoer van main.py). */
  stuurTekst(t: string): void {
    this.stuur(t);
  }

  maakPoort(): SerialPort {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const readable = new ReadableStream<Uint8Array>({
      start(c) {
        controller = c;
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
      open: async () => {},
      close: async () => {},
      getInfo: () => ({ usbVendorId: 0x2341, usbProductId: 0x025b }),
    };
  }

  private verwerkByte(b: number): void {
    this.geschreven.push(b);
    if (this.stand === 'paste') {
      if (b === 0x04) {
        // einde input: ack, dan stdout- en stderr-frames en de raw-prompt
        this.stand = 'raw';
        this.stuur([0x04]);
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

function verbonden(board: NepBoard): SerialClient {
  const client = new SerialClient();
  client.attach(board.maakPoort());
  return client;
}

describe('SerialClient raw-paste', () => {
  it('stuurt code naar het board en geeft stdout en stderr terug', async () => {
    const board = new NepBoard(64, 'hallo\r\n', '');
    const client = verbonden(board);

    const { stdout, stderr } = await client.runCode('print("hallo")');

    expect(stdout).toBe('hallo\r\n');
    expect(stderr).toBe('');
    expect(new TextDecoder().decode(new Uint8Array(board.codeBytes))).toBe('print("hallo")');
  });

  it('geeft een traceback op stderr onaangetast door', async () => {
    const board = new NepBoard(64, '', 'Traceback (most recent call last):\r\nNameError: x\r\n');
    const client = verbonden(board);

    const { stderr } = await client.runCode('x');

    expect(stderr).toContain('NameError');
  });

  it('respecteert het window: lange code komt volledig aan', async () => {
    // Window van 16 bytes dwingt meerdere rondes flow-control af.
    const board = new NepBoard(16, '', '');
    const client = verbonden(board);
    const code = `teller = 0\n${'teller = teller + 1\n'.repeat(10)}`;

    await client.runCode(code);

    expect(new TextDecoder().decode(new Uint8Array(board.codeBytes))).toBe(code);
  });

  it('meldt een board zonder raw-paste-ondersteuning', async () => {
    const board = new NepBoard(64, '', '', false);
    const client = verbonden(board);

    await expect(client.runCode('x = 1')).rejects.toThrow('raw-paste niet ondersteund');
  });

  it('verlaat de raw REPL na afloop weer (Ctrl-B gestuurd)', async () => {
    const board = new NepBoard(64, '', '');
    const client = verbonden(board);

    await client.runCode('x = 1');

    expect(board.geschreven).toContain(0x02);
    expect(client.status).toBe('connected');
  });

  it('streamt uitvoer live via onOutput en levert dezelfde tekst als resultaat', async () => {
    const board = new NepBoard(64, 'Links: 800\r\nLinks: 5000\r\n', '', true, true);
    const client = verbonden(board);
    const live: string[] = [];

    const { stdout, stderr } = await client.runCode('x', 0, (t) => live.push(t));

    expect(live.join('')).toBe('Links: 800\r\nLinks: 5000\r\n');
    expect(stdout).toBe('Links: 800\r\nLinks: 5000\r\n');
    expect(stderr).toBe('');
    // de eerste helft kwam binnen vóór het einde van het programma
    expect(live.length).toBeGreaterThan(1);
  });

  it('streamt ook stderr, zodat een traceback live zichtbaar is', async () => {
    const board = new NepBoard(64, 'output\r\n', 'NameError: x\r\n');
    const client = verbonden(board);
    const live: string[] = [];

    const { stderr } = await client.runCode('x', 0, (t) => live.push(t));

    expect(live.join('')).toContain('NameError');
    expect(stderr).toBe('NameError: x\r\n');
  });

  it('geeft de USB-info van de poort door', () => {
    const client = verbonden(new NepBoard(64, '', ''));
    expect(client.portInfo).toEqual({ usbVendorId: 0x2341, usbProductId: 0x025b });
  });

  it('typt een losse regel in de normale REPL met regeleinde', async () => {
    const board = new NepBoard(64, '', '');
    const client = verbonden(board);

    await client.typeLine('print(1)');

    expect(new TextDecoder().decode(new Uint8Array(board.geschreven))).toBe('print(1)\r\n');
  });

  it('geeft spontane board-uitvoer door via onData', async () => {
    const board = new NepBoard(64, '', '');
    const client = verbonden(board);
    const ontvangen: string[] = [];
    client.onData = (t) => ontvangen.push(t);

    board.stuurTekst('rondje\r\n');
    await new Promise((r) => setTimeout(r, 10));

    expect(ontvangen.join('')).toBe('rondje\r\n');
  });
});
