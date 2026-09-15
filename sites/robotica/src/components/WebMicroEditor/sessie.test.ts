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
    const afmelden = sessie.luister({ onData: () => {}, onDisconnect: () => {} });
    afmelden(); // unmount: naar een les
    expect(sessie.client).toBe(client);
    expect(sessie.status).toBe('connected');
    sessie.luister({ onData: () => {}, onDisconnect: () => {} }); // mount: terug
    expect(sessie.client).toBe(client);
  });

  it('spaart uitvoer op terwijl niemand luistert en levert die bij de volgende mount', async () => {
    const { sessie, poort } = verbondenSessie();
    const eerste: string[] = [];
    const afmelden = sessie.luister({ onData: (t) => eerste.push(t), onDisconnect: () => {} });
    poort.stuur('regel 1\n');
    await tick();
    afmelden();
    poort.stuur('regel 2\n');
    await tick();
    expect(eerste.join('')).toBe('regel 1\n');

    const tweede: string[] = [];
    sessie.luister({ onData: (t) => tweede.push(t), onDisconnect: () => {} });
    expect(tweede.join('')).toBe('regel 2\n');
  });

  it('laat de opgespaarde uitvoer niet onbeperkt groeien', async () => {
    const { sessie, poort } = verbondenSessie();
    for (let i = 0; i < 30; i++) poort.stuur('x'.repeat(1000));
    await tick();
    const later: string[] = [];
    sessie.luister({ onData: (t) => later.push(t), onDisconnect: () => {} });
    expect(later.join('').length).toBe(20000);
  });

  it('meldt een kabelverlies tijdens de afwezigheid alsnog bij terugkomst', async () => {
    const { sessie, poort } = verbondenSessie();
    sessie.luister({ onData: () => {}, onDisconnect: () => {} })();
    poort.trekLos();
    await tick();
    expect(sessie.client).toBeNull();
    expect(sessie.status).toBe('disconnected');
    const tekst: string[] = [];
    sessie.luister({ onData: (t) => tekst.push(t), onDisconnect: () => {} });
    expect(tekst.join('')).toContain('[verbinding verbroken]');
  });

  it('roept onDisconnect van de luisteraar aan als de kabel eruit gaat', async () => {
    const { sessie, poort } = verbondenSessie();
    let gemeld = 0;
    sessie.luister({
      onData: () => {},
      onDisconnect: () => {
        gemeld += 1;
      },
    });
    poort.trekLos();
    await tick();
    expect(gemeld).toBe(1);
    expect(sessie.client).toBeNull();
  });
});

describe('EditorSessie.herverbind: na een herlaad zonder kiezer', () => {
  it('verbindt opnieuw met de ene bekende poort als deze tab eerder verbonden was', async () => {
    const opslag = nepOpslag();
    opslag.setItem(WAS_VERBONDEN_KEY, '1');
    const sessie = new EditorSessie(opslag);
    const poort = nepPoort();
    const gelukt = await sessie.herverbind({ poorten: async () => [poort] });
    expect(gelukt).toBe(true);
    expect(poort.geopend).toBe(1);
    expect(sessie.status).toBe('connected');
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
