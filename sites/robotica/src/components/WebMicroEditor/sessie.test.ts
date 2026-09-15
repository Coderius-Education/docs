import { describe, expect, it } from 'vitest';
import type { SerialPort } from './serial';
import { SerialClient } from './serial';
import { EditorSessie, WAS_VERBONDEN_KEY } from './sessie';

// De verbinding hoort een paginawissel te overleven. Vroeger zat de client in
// een useRef van de component; wie naar een les navigeerde en terugkwam had
// een open poort waar de editor niets meer van wist. Deze tests spelen dat
// mounten en unmounten na met luister()/afmelden en een nagemaakte poort.

const ENC = new TextEncoder();

/** Een poort waar de test zelf bytes in kan duwen en de kabel uit kan trekken. */
function nepPoort(vendor = 0x2341): SerialPort & {
  stuur: (t: string) => void;
  trekLos: () => void;
  geopend: number;
} {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const readable = new ReadableStream<Uint8Array>({
    start: (c) => {
      controller = c;
    },
  });
  const writable = new WritableStream<Uint8Array>({ write: () => {} });
  const poort = {
    readable,
    writable,
    geopend: 0,
    open: async () => {
      poort.geopend += 1;
    },
    close: async () => {},
    getInfo: () => ({ usbVendorId: vendor }),
    stuur: (t: string) => controller.enqueue(ENC.encode(t)),
    trekLos: () => controller.error(new Error('unplugged')),
  };
  return poort;
}

function nepOpslag(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size;
    },
  };
}

function verbondenSessie() {
  const opslag = nepOpslag();
  const sessie = new EditorSessie(opslag);
  const poort = nepPoort();
  const client = new SerialClient();
  client.attach(poort);
  sessie.neemOver(client);
  return { sessie, opslag, poort, client };
}

const tick = () => new Promise((r) => setTimeout(r, 5));

describe('EditorSessie: de verbinding overleeft een paginawissel', () => {
  it('houdt dezelfde client vast als de component weggaat en terugkomt', () => {
    const { sessie, client } = verbondenSessie();
    const afmelden = sessie.luister({ onData: () => {}, onStatus: () => {} });
    afmelden(); // unmount: naar een les
    expect(sessie.client).toBe(client);
    expect(sessie.status).toBe('connected');
    sessie.luister({ onData: () => {}, onStatus: () => {} }); // mount: terug
    expect(sessie.client).toBe(client);
  });

  it('spaart uitvoer op terwijl niemand luistert en levert die bij de volgende mount', async () => {
    const { sessie, poort } = verbondenSessie();
    const eerste: string[] = [];
    const afmelden = sessie.luister({ onData: (t) => eerste.push(t), onStatus: () => {} });
    poort.stuur('regel 1\n');
    await tick();
    afmelden();
    poort.stuur('regel 2\n');
    await tick();
    expect(eerste.join('')).toBe('regel 1\n');

    const tweede: string[] = [];
    sessie.luister({ onData: (t) => tweede.push(t), onStatus: () => {} });
    expect(tweede.join('')).toBe('regel 2\n');
  });

  it('laat de opgespaarde uitvoer niet onbeperkt groeien', async () => {
    const { sessie, poort } = verbondenSessie();
    for (let i = 0; i < 30; i++) poort.stuur('x'.repeat(1000));
    await tick();
    const later: string[] = [];
    sessie.luister({ onData: (t) => later.push(t), onStatus: () => {} });
    expect(later.join('').length).toBe(20000);
  });

  it('meldt een kabelverlies tijdens de afwezigheid alsnog bij terugkomst', async () => {
    const { sessie, poort } = verbondenSessie();
    sessie.luister({ onData: () => {}, onStatus: () => {} })();
    poort.trekLos();
    await tick();
    expect(sessie.client).toBeNull();
    expect(sessie.status).toBe('disconnected');
    const tekst: string[] = [];
    sessie.luister({ onData: (t) => tekst.push(t), onStatus: () => {} });
    expect(tekst.join('')).toContain('[verbinding verbroken]');
  });

  it('meldt disconnected aan de luisteraar als de kabel eruit gaat', async () => {
    const { sessie, poort } = verbondenSessie();
    const gemeld: string[] = [];
    sessie.luister({ onData: () => {}, onStatus: (s) => gemeld.push(s) });
    poort.trekLos();
    await tick();
    expect(gemeld).toEqual(['disconnected']);
    expect(sessie.client).toBeNull();
  });

  it('meldt het einde van een operatie aan de component die er dán is, niet aan de oude', () => {
    // Test direct begint, de leerling gaat naar een les en komt terug; de test
    // eindigt daarna. De nieuwe component start op 'busy' en moet 'connected'
    // horen — anders blijven Run en de rest voor altijd uitgeschakeld.
    const { sessie } = verbondenSessie();
    const oud: string[] = [];
    const afmelden = sessie.luister({ onData: () => {}, onStatus: (s) => oud.push(s) });
    sessie.zetBezig(true);
    expect(oud).toEqual(['busy']);
    afmelden();
    const nieuw: string[] = [];
    sessie.luister({ onData: () => {}, onStatus: (s) => nieuw.push(s) });
    expect(sessie.status).toBe('busy');
    sessie.zetBezig(false);
    expect(nieuw).toEqual(['connected']);
    expect(oud).toEqual(['busy']);
  });

  it('valt een operatie samen met een kabelverlies, dan blijft het disconnected', async () => {
    const { sessie, poort } = verbondenSessie();
    const gemeld: string[] = [];
    sessie.luister({ onData: () => {}, onStatus: (s) => gemeld.push(s) });
    sessie.zetBezig(true);
    poort.trekLos();
    await tick();
    sessie.zetBezig(false); // de afronding van de operatie
    expect(gemeld).toEqual(['busy', 'disconnected', 'disconnected']);
    expect(sessie.status).toBe('disconnected');
  });

  it('schrijf() gaat naar de shell van de huidige component of wordt opgespaard', () => {
    const { sessie } = verbondenSessie();
    sessie.schrijf('[eerst]\n');
    const tekst: string[] = [];
    sessie.luister({ onData: (t) => tekst.push(t), onStatus: () => {} });
    sessie.schrijf('[daarna]\n');
    expect(tekst.join('')).toBe('[eerst]\n[daarna]\n');
  });

  it('meldt connected bij Verbind en disconnected bij Verbreek', async () => {
    const sessie = new EditorSessie(nepOpslag());
    const gemeld: string[] = [];
    sessie.luister({ onData: () => {}, onStatus: (s) => gemeld.push(s) });
    const client = new SerialClient();
    client.attach(nepPoort());
    sessie.neemOver(client);
    await sessie.verbreek();
    expect(gemeld.slice(0, 2)).toEqual(['connected', 'disconnected']);
  });
});

describe('EditorSessie.herverbind: na een herlaad zonder kiezer', () => {
  it('verbindt opnieuw met de ene bekende poort als deze tab eerder verbonden was', async () => {
    const opslag = nepOpslag();
    opslag.setItem(WAS_VERBONDEN_KEY, '1');
    const sessie = new EditorSessie(opslag);
    const gemeld: string[] = [];
    const tekst: string[] = [];
    sessie.luister({ onData: (t) => tekst.push(t), onStatus: (s) => gemeld.push(s) });
    const poort = nepPoort();
    const gelukt = await sessie.herverbind({ poorten: async () => [poort] });
    expect(gelukt).toBe(true);
    expect(poort.geopend).toBe(1);
    expect(sessie.status).toBe('connected');
    expect(gemeld).toEqual(['connected']);
    expect(tekst.join('')).toContain('[opnieuw verbonden]');
  });

  it('meldt het resultaat aan de component die er is als de poging klaar is', async () => {
    // Herlaad, herverbind loopt; de leerling klikt intussen naar een les en
    // terug. De tweede component moet 'connected' horen, niet de eerste.
    const opslag = nepOpslag();
    opslag.setItem(WAS_VERBONDEN_KEY, '1');
    const sessie = new EditorSessie(opslag);
    const poort = nepPoort();
    let vrijgeven!: () => void;
    const poorten = () =>
      new Promise<SerialPort[]>((r) => {
        vrijgeven = () => r([poort]);
      });
    const eerste: string[] = [];
    const afmelden = sessie.luister({ onData: () => {}, onStatus: (s) => eerste.push(s) });
    const poging = sessie.herverbind({ poorten });
    afmelden();
    const tweede: string[] = [];
    sessie.luister({ onData: () => {}, onStatus: (s) => tweede.push(s) });
    expect(await sessie.herverbind({ poorten: async () => [poort] })).toBe(false);
    vrijgeven();
    expect(await poging).toBe(true);
    expect(eerste).toEqual([]);
    expect(tweede).toEqual(['connected']);
  });

  it('geeft false als getPorts zelf weigert (Permissions-Policy, iframe)', async () => {
    const opslag = nepOpslag();
    opslag.setItem(WAS_VERBONDEN_KEY, '1');
    const sessie = new EditorSessie(opslag);
    const gelukt = await sessie.herverbind({
      poorten: async () => {
        throw new Error('SecurityError');
      },
    });
    expect(gelukt).toBe(false);
    expect(sessie.verbindt).toBe(false);
  });

  it('doet niets in een tab die nooit zelf verbonden was', async () => {
    const sessie = new EditorSessie(nepOpslag());
    const poort = nepPoort();
    expect(await sessie.herverbind({ poorten: async () => [poort] })).toBe(false);
    expect(poort.geopend).toBe(0);
  });

  it('doet niets meer na een bewust Verbreek', async () => {
    const { sessie, opslag } = verbondenSessie();
    expect(opslag.getItem(WAS_VERBONDEN_KEY)).toBe('1');
    await sessie.verbreek();
    expect(sessie.client).toBeNull();
    const poort = nepPoort();
    expect(await sessie.herverbind({ poorten: async () => [poort] })).toBe(false);
    expect(poort.geopend).toBe(0);
  });

  it('kiest niet zelf als er twee bekende boards zijn', async () => {
    const opslag = nepOpslag();
    opslag.setItem(WAS_VERBONDEN_KEY, '1');
    const sessie = new EditorSessie(opslag);
    const a = nepPoort();
    const b = nepPoort();
    expect(await sessie.herverbind({ poorten: async () => [a, b] })).toBe(false);
    expect(a.geopend + b.geopend).toBe(0);
  });

  it('geeft false als de poort niet open wil (bijvoorbeeld al open in een andere tab)', async () => {
    const opslag = nepOpslag();
    opslag.setItem(WAS_VERBONDEN_KEY, '1');
    const sessie = new EditorSessie(opslag);
    const poort = nepPoort();
    poort.open = async () => {
      throw new Error('port already open');
    };
    expect(await sessie.herverbind({ poorten: async () => [poort] })).toBe(false);
    expect(sessie.client).toBeNull();
    expect(sessie.verbindt).toBe(false);
  });

  it('start geen tweede poging terwijl de eerste nog loopt', async () => {
    const opslag = nepOpslag();
    opslag.setItem(WAS_VERBONDEN_KEY, '1');
    const sessie = new EditorSessie(opslag);
    const poort = nepPoort();
    let vrijgeven!: () => void;
    const poorten = () =>
      new Promise<SerialPort[]>((r) => {
        vrijgeven = () => r([poort]);
      });
    const eerste = sessie.herverbind({ poorten });
    expect(sessie.verbindt).toBe(true);
    const tweede = await sessie.herverbind({ poorten: async () => [poort] });
    expect(tweede).toBe(false);
    vrijgeven();
    expect(await eerste).toBe(true);
    expect(poort.geopend).toBe(1);
  });
});
