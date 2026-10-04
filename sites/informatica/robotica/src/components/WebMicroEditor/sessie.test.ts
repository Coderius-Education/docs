import { describe, expect, it } from 'vitest';
import type { SerialPort } from './serial';
import { SerialClient } from './serial';
import { EditorSessie, type Luisteraar, WAS_VERBONDEN_KEY } from './sessie';
import { TEMPLATES } from './templates';

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

function nepOpslag() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

/** Een component-luisteraar die alles bijhoudt wat hij hoort. */
function luisteraar() {
  const tekst: string[] = [];
  const status: string[] = [];
  const standen: string[] = [];
  const l: Luisteraar = {
    onData: (t) => tekst.push(t),
    onStatus: (s) => status.push(s),
    onStand: (s) => standen.push(s.currentFile ?? '-'),
  };
  return { l, tekst, status, standen, shell: () => tekst.join('') };
}

function verbondenSessie() {
  const tab = nepOpslag();
  const sessie = new EditorSessie(tab, nepOpslag());
  const poort = nepPoort();
  const client = new SerialClient();
  client.attach(poort);
  sessie.neemOver(client);
  return { sessie, tab, poort, client };
}

/** Een client die pas verbindt als de test dat toestaat; voor race-scenario's. */
function tragePoorten() {
  const poort = nepPoort();
  let vrijgeven!: () => void;
  const poorten = () =>
    new Promise<SerialPort[]>((r) => {
      vrijgeven = () => r([poort]);
    });
  return { poort, poorten, vrijgeven: () => vrijgeven() };
}

const tick = () => new Promise((r) => setTimeout(r, 5));

describe('EditorSessie: de verbinding overleeft een paginawissel', () => {
  it('houdt dezelfde client vast als de component weggaat en terugkomt', () => {
    const { sessie, client } = verbondenSessie();
    const afmelden = sessie.luister(luisteraar().l);
    afmelden(); // unmount: naar een les
    expect(sessie.client).toBe(client);
    expect(sessie.status).toBe('connected');
    sessie.luister(luisteraar().l); // mount: terug
    expect(sessie.client).toBe(client);
  });

  it('bewaart uitvoer die binnenkomt terwijl niemand luistert in replText', async () => {
    const { sessie, poort } = verbondenSessie();
    const eerste = luisteraar();
    const afmelden = sessie.luister(eerste.l);
    poort.stuur('regel 1\n');
    await tick();
    afmelden();
    poort.stuur('regel 2\n');
    await tick();
    expect(eerste.shell()).toBe('regel 1\n');
    // De volgende component leest bij mount de hele tekst uit de sessie.
    expect(sessie.replText).toBe('regel 1\nregel 2\n');
  });

  it('laat de shell-tekst niet boven de 20 KB groeien, met of zonder luisteraar', async () => {
    const { sessie, poort } = verbondenSessie();
    for (let i = 0; i < 15; i++) poort.stuur('x'.repeat(1000));
    await tick();
    sessie.luister(luisteraar().l);
    for (let i = 0; i < 15; i++) poort.stuur('y'.repeat(1000));
    await tick();
    expect(sessie.replText.length).toBe(20000);
    expect(sessie.replText.endsWith('y')).toBe(true);
  });

  it('meldt een kabelverlies tijdens de afwezigheid alsnog bij terugkomst', async () => {
    const { sessie, poort } = verbondenSessie();
    sessie.luister(luisteraar().l)();
    poort.trekLos();
    await tick();
    expect(sessie.client).toBeNull();
    expect(sessie.status).toBe('disconnected');
    expect(sessie.replText).toContain('[verbinding verbroken]');
  });

  it('meldt disconnected aan de luisteraar als de kabel eruit gaat', async () => {
    const { sessie, poort } = verbondenSessie();
    const l = luisteraar();
    sessie.luister(l.l);
    poort.trekLos();
    await tick();
    expect(l.status).toEqual(['disconnected']);
    expect(sessie.client).toBeNull();
  });

  it('meldt het einde van een operatie aan de component die er dán is, niet aan de oude', () => {
    // Test direct begint, de leerling gaat naar een les en komt terug; de test
    // eindigt daarna. De nieuwe component start op 'busy' en moet 'connected'
    // horen — anders blijven Run en de rest voor altijd uitgeschakeld.
    const { sessie } = verbondenSessie();
    const oud = luisteraar();
    const afmelden = sessie.luister(oud.l);
    const operatie = sessie.beginOperatie();
    expect(oud.status).toEqual(['busy']);
    afmelden();
    const nieuw = luisteraar();
    sessie.luister(nieuw.l);
    expect(sessie.status).toBe('busy');
    sessie.eindOperatie(operatie);
    expect(nieuw.status).toEqual(['connected']);
    expect(oud.status).toEqual(['busy']);
  });

  it('laat een verlopen operatie de bezig-vlag van een nieuwe niet wissen', async () => {
    // De installer hangt op een trage download als de kabel eruit gaat. De
    // leerling verbindt opnieuw en start de installer nog een keer. Rondt de
    // eerste dan alsnog af, dan mag die de tweede niet op 'connected' zetten.
    const { sessie, poort } = verbondenSessie();
    const l = luisteraar();
    sessie.luister(l.l);
    const eerste = sessie.beginOperatie();
    poort.trekLos();
    await tick();
    const client2 = new SerialClient();
    client2.attach(nepPoort());
    sessie.neemOver(client2);
    const tweede = sessie.beginOperatie();
    sessie.eindOperatie(eerste); // de verlopen afronding
    expect(sessie.status).toBe('busy');
    sessie.eindOperatie(tweede);
    expect(sessie.status).toBe('connected');
    expect(l.status).toEqual(['busy', 'disconnected', 'connected', 'busy', 'connected']);
  });

  it('valt een operatie samen met een kabelverlies, dan blijft het disconnected', async () => {
    const { sessie, poort } = verbondenSessie();
    const l = luisteraar();
    sessie.luister(l.l);
    const operatie = sessie.beginOperatie();
    poort.trekLos();
    await tick();
    sessie.eindOperatie(operatie); // de afronding van de operatie
    expect(l.status).toEqual(['busy', 'disconnected']);
    expect(sessie.status).toBe('disconnected');
  });

  it('schrijf() komt in replText en bij de huidige component', () => {
    const { sessie } = verbondenSessie();
    sessie.schrijf('[eerst]\n');
    const l = luisteraar();
    sessie.luister(l.l);
    sessie.schrijf('[daarna]\n');
    expect(l.shell()).toBe('[daarna]\n');
    expect(sessie.replText).toBe('[eerst]\n[daarna]\n');
    sessie.wis();
    expect(sessie.replText).toBe('');
  });

  it('meldt connected bij Verbind en disconnected bij Verbreek', async () => {
    const sessie = new EditorSessie(nepOpslag(), nepOpslag());
    const l = luisteraar();
    sessie.luister(l.l);
    const poort = nepPoort();
    expect(await sessie.verbind(() => new SerialClient())).toBe(false); // geen WebSerial in node
    expect(l.shell()).toContain('[verbinden mislukt');
    const client = new SerialClient();
    client.attach(poort);
    sessie.neemOver(client);
    await sessie.verbreek();
    expect(l.status).toEqual(['connected', 'disconnected']);
  });
});

describe('EditorSessie.stand: wat een operatie na een await verandert', () => {
  it('begint met de bewaarde code en het bewaarde bestand, of anders de eerste template', () => {
    const leeg = new EditorSessie(nepOpslag(), nepOpslag());
    expect(leeg.stand).toEqual({
      code: TEMPLATES[0].code,
      loadedCode: TEMPLATES[0].code,
      currentFile: null,
      progress: null,
    });
    const blijvend = nepOpslag();
    blijvend.setItem('webMicroEditor.code', 'print(1)\n');
    blijvend.setItem('webMicroEditor.currentFile', '/blink.py');
    const bewaard = new EditorSessie(nepOpslag(), blijvend);
    expect(bewaard.stand.code).toBe('print(1)\n');
    expect(bewaard.stand.currentFile).toBe('/blink.py');
  });

  it('bewaart code en bestand in localStorage en meldt de stand aan de component die er is', () => {
    // Run schrijft main.py terwijl de leerling wegklikt; de nieuwe component
    // moet bij mount /main.py als geopend bestand zien, niet /blink.py.
    const blijvend = nepOpslag();
    const sessie = new EditorSessie(nepOpslag(), blijvend);
    const oud = luisteraar();
    const afmelden = sessie.luister(oud.l);
    sessie.zet({ currentFile: '/blink.py' });
    afmelden();
    sessie.zet({ currentFile: '/main.py', loadedCode: 'x' });
    expect(oud.standen).toEqual(['/blink.py']);
    expect(sessie.stand.currentFile).toBe('/main.py');
    expect(blijvend.getItem('webMicroEditor.currentFile')).toBe('/main.py');
    sessie.zet({ currentFile: null, code: 'y' });
    expect(blijvend.getItem('webMicroEditor.currentFile')).toBeNull();
    expect(blijvend.getItem('webMicroEditor.code')).toBe('y');
  });
});

describe('EditorSessie.herverbind: na een herlaad zonder kiezer', () => {
  function sessieMetVlag() {
    const tab = nepOpslag();
    tab.setItem(WAS_VERBONDEN_KEY, '1');
    return new EditorSessie(tab, nepOpslag());
  }

  it('verbindt opnieuw met de ene bekende poort als deze tab eerder verbonden was', async () => {
    const sessie = sessieMetVlag();
    const l = luisteraar();
    sessie.luister(l.l);
    const poort = nepPoort();
    const gelukt = await sessie.herverbind({ poorten: async () => [poort] });
    expect(gelukt).toBe(true);
    expect(poort.geopend).toBe(1);
    expect(sessie.status).toBe('connected');
    expect(l.status).toEqual(['verbindt', 'connected']);
    expect(l.shell()).toContain('[opnieuw verbonden]');
  });

  it('meldt het resultaat aan de component die er is als de poging klaar is', async () => {
    // Herlaad, herverbind loopt; de leerling klikt intussen naar een les en
    // terug. De tweede component moet 'connected' horen, niet de eerste.
    const sessie = sessieMetVlag();
    const { poort, poorten, vrijgeven } = tragePoorten();
    const eerste = luisteraar();
    const afmelden = sessie.luister(eerste.l);
    const poging = sessie.herverbind({ poorten });
    afmelden();
    const tweede = luisteraar();
    sessie.luister(tweede.l);
    expect(sessie.status).toBe('verbindt');
    expect(await sessie.herverbind({ poorten: async () => [poort] })).toBe(false);
    vrijgeven();
    expect(await poging).toBe(true);
    expect(eerste.status).toEqual(['verbindt']);
    expect(tweede.status).toEqual(['connected']);
  });

  it('laat Verbind wachten op een lopende poging en slaat de kiezer over als die slaagt', async () => {
    const sessie = sessieMetVlag();
    const { poorten, vrijgeven } = tragePoorten();
    const poging = sessie.herverbind({ poorten });
    let kiezerGebruikt = false;
    const verbind = sessie.verbind(() => {
      kiezerGebruikt = true;
      return new SerialClient();
    });
    vrijgeven();
    expect(await poging).toBe(true);
    expect(await verbind).toBe(true);
    expect(kiezerGebruikt).toBe(false);
  });

  it('laat Verbind na een mislukte poging alsnog de kiezer openen', async () => {
    const sessie = sessieMetVlag();
    const poort = nepPoort();
    poort.open = async () => {
      throw new Error('port already open');
    };
    const l = luisteraar();
    sessie.luister(l.l);
    let kiezerGebruikt = false;
    const poging = sessie.herverbind({ poorten: async () => [poort] });
    const verbind = sessie.verbind(() => {
      kiezerGebruikt = true;
      return new SerialClient();
    });
    expect(await poging).toBe(false);
    await verbind;
    expect(kiezerGebruikt).toBe(true);
    expect(l.shell()).toContain('[opnieuw verbinden mislukt');
    expect(l.status).toEqual(['verbindt', 'disconnected']);
  });

  it('geeft false als getPorts zelf weigert (Permissions-Policy, iframe)', async () => {
    const sessie = sessieMetVlag();
    const gelukt = await sessie.herverbind({
      poorten: async () => {
        throw new Error('SecurityError');
      },
    });
    expect(gelukt).toBe(false);
    expect(sessie.verbindt).toBe(false);
    expect(sessie.replText).toBe(''); // stil: geen bekende poort, geen melding
  });

  it('doet niets in een tab die nooit zelf verbonden was', async () => {
    const sessie = new EditorSessie(nepOpslag(), nepOpslag());
    const poort = nepPoort();
    expect(await sessie.herverbind({ poorten: async () => [poort] })).toBe(false);
    expect(poort.geopend).toBe(0);
  });

  it('doet niets meer na een bewust Verbreek', async () => {
    const { sessie, tab } = verbondenSessie();
    expect(tab.getItem(WAS_VERBONDEN_KEY)).toBe('1');
    await sessie.verbreek();
    expect(sessie.client).toBeNull();
    const poort = nepPoort();
    expect(await sessie.herverbind({ poorten: async () => [poort] })).toBe(false);
    expect(poort.geopend).toBe(0);
  });

  it('kiest niet zelf als er twee bekende boards zijn', async () => {
    const sessie = sessieMetVlag();
    const a = nepPoort();
    const b = nepPoort();
    expect(await sessie.herverbind({ poorten: async () => [a, b] })).toBe(false);
    expect(a.geopend + b.geopend).toBe(0);
  });

  it('start geen tweede poging terwijl de eerste nog loopt', async () => {
    const sessie = sessieMetVlag();
    const { poort, poorten, vrijgeven } = tragePoorten();
    const eerste = sessie.herverbind({ poorten });
    expect(sessie.verbindt).toBe(true);
    expect(await sessie.herverbind({ poorten: async () => [poort] })).toBe(false);
    vrijgeven();
    expect(await eerste).toBe(true);
    expect(poort.geopend).toBe(1);
  });
});
