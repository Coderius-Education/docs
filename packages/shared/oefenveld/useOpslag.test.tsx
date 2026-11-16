// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Kast, type Lade, type Opslag, maakOpslag, veldSleutel } from './opslag';
import { type OpslagStand, useOpslag } from './useOpslag';

// Hoe een oefenveld zijn opslag gebruikt: wanneer het leest, wanneer het
// schrijft, en wat er gebeurt als de pagina sluit of de database niet
// antwoordt. Eerst bewaakte een bronscan bij web dit; twee fouten zag die
// niet (issue 216):
//
// - Wie typte en binnen een halve seconde herlaadde, was dat werk kwijt. De
//   schrijfactie naar IndexedDB die bij `pagehide` begint, breekt de browser
//   af. In Chromium nagespeeld: tot 450 ms na de laatste toets was het werk
//   drie van de drie keer weg, vanaf 600 ms nooit.
// - Op een trage computer gaf het veld het lezen na anderhalve seconde op,
//   terwijl de database nog niet aan de beurt was geweest: met een twintig
//   keer vertraagde processor kwam het werk in drie van de vier velden niet
//   terug.

type Py = { code: string };
const START: Py = { code: '' };

let data: Map<string, unknown>;
let nood: Map<string, string>;
/** Schrijfacties die begonnen zijn en nog niet klaar: los ze op met `klaar()`. */
let wachtend: { sleutel: string; waarde: unknown; klaar: () => void }[];
let schrijftMeteen: boolean;
let leest: { los: (waarde?: unknown) => void; faal: (fout: unknown) => void } | null;
let leestMeteen: boolean;
let opslag: Opslag<Py>;

beforeEach(() => {
  data = new Map();
  nood = new Map();
  wachtend = [];
  schrijftMeteen = true;
  leestMeteen = true;
  leest = null;
  const kast: Kast = {
    get: (sleutel) =>
      leestMeteen
        ? Promise.resolve(data.get(sleutel))
        : new Promise((los, faal) => {
            leest = { los: (waarde) => los(waarde ?? data.get(sleutel)), faal };
          }),
    set: (sleutel, waarde) =>
      new Promise((los) => {
        const klaar = () => {
          data.set(sleutel, waarde);
          los();
        };
        if (schrijftMeteen) klaar();
        else wachtend.push({ sleutel, waarde, klaar });
      }),
    del: async (sleutel) => {
      data.delete(sleutel);
    },
  };
  const lade: Lade = {
    getItem: (sleutel) => nood.get(sleutel) ?? null,
    setItem: (sleutel, waarde) => {
      nood.set(sleutel, waarde);
    },
    removeItem: (sleutel) => {
      nood.delete(sleutel);
    },
  };
  opslag = maakOpslag<Py>({ site: 'python', naam: 'oefenvelden', delen: ['code'], kast, lade });
  window.history.replaceState(null, '', '/python/docs/basis/les/');
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const sleutel = (n = 0) => veldSleutel('/python/docs/basis/les', opslag.zaadVan(START), n);
const regel = (code: string) => ({ versie: 1, zaad: opslag.zaadVan(START), code, opgeslagenOp: 1 });

let typ: (code: string) => void;
let reset: () => void;
let stand: () => { code: string; geladen: boolean; stand: OpslagStand };

function Veld({ met = true }: { met?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState(START.code);
  const o = useOpslag<Py>({
    opslag: met ? opslag : null,
    start: START,
    huidig: { code },
    containerRef: ref,
    onHerstel: (c) => setCode(c.code),
  });
  typ = setCode;
  reset = () => {
    o.wis();
    setCode(START.code);
  };
  stand = () => ({ code, geladen: o.geladen, stand: o.stand });
  return <div ref={ref} data-zaad={o.zaad} />;
}

/** Laat beloftes aflopen zonder de klok te verzetten. */
const even = () => act(async () => {});
const later = (ms: number) => act(async () => vi.advanceTimersByTime(ms));

describe('laden', () => {
  it('zet het bewaarde werk terug en zegt dat het bewaard is', async () => {
    data.set(sleutel(), regel('print("hoi")'));
    render(<Veld />);
    expect(stand().geladen).toBe(false);
    await even();

    expect(stand()).toEqual({ code: 'print("hoi")', geladen: true, stand: 'bewaard' });
  });

  it('een veld zonder werk opent met de startcode', async () => {
    render(<Veld />);
    await even();

    expect(stand()).toEqual({ code: '', geladen: true, stand: 'leeg' });
  });

  it('elk veld met dezelfde startcode heeft zijn eigen werk', async () => {
    data.set(sleutel(1), regel('tweede'));
    render(
      <>
        <Veld />
        <Veld />
      </>,
    );
    await even();

    // `stand` is van het laatst gerenderde veld: het tweede.
    expect(stand().code).toBe('tweede');
  });

  it('zonder opslag is het veld meteen klaar en schrijft het niets', async () => {
    render(<Veld met={false} />);
    expect(stand().geladen).toBe(true);
    await act(async () => typ('x = 1'));
    await later(1000);

    expect(data.size).toBe(0);
    expect(nood.size).toBe(0);
  });
});

describe('schrijven', () => {
  it('wacht een halve seconde na de laatste toets', async () => {
    render(<Veld />);
    await even();
    await act(async () => typ('x'));
    await later(400);
    await act(async () => typ('x = 1'));
    await later(400);
    expect(data.size).toBe(0);

    await later(100);
    expect(data.get(sleutel())).toMatchObject({ code: 'x = 1' });
    expect(stand().stand).toBe('bewaard');
  });

  it('terug naar de startcode ruimt de regel op', async () => {
    data.set(sleutel(), regel('x = 1'));
    render(<Veld />);
    await even();
    await act(async () => typ(''));
    await later(500);

    expect(data.size).toBe(0);
    expect(stand().stand).toBe('leeg');
  });

  it('Reset wist het bewaarde werk en een noodkopie', async () => {
    data.set(sleutel(), regel('x = 1'));
    render(<Veld />);
    await even();
    opslag.zetNood(sleutel(), { code: 'oud' }, opslag.zaadVan(START));
    await act(async () => reset());

    expect(data.size).toBe(0);
    expect(nood.size).toBe(0);
    expect(stand()).toMatchObject({ code: '', stand: 'leeg' });
  });
});

describe('de pagina sluit terwijl er nog iets te bewaren is', () => {
  it('typen en meteen herladen: het werk komt terug', async () => {
    const { unmount } = render(<Veld />);
    await even();
    await act(async () => typ('print("net getypt")'));
    await later(100);

    // De browser begint de schrijfactie, en gooit de pagina weg voordat hij
    // klaar is: in de database komt niets aan.
    schrijftMeteen = false;
    window.dispatchEvent(new Event('pagehide'));
    expect(wachtend).toHaveLength(1);
    expect(data.size).toBe(0);
    unmount();
    cleanup();

    // De volgende keer dat de les opent.
    schrijftMeteen = true;
    render(<Veld />);
    await even();
    expect(stand()).toEqual({ code: 'print("net getypt")', geladen: true, stand: 'bewaard' });
    // Nu staat het in de database, en is de noodkopie weg.
    expect(data.get(sleutel())).toMatchObject({ code: 'print("net getypt")' });
    expect(nood.size).toBe(0);
  });

  it('een noodkopie is nieuwer dan wat de database nog heeft', async () => {
    data.set(sleutel(), regel('oud'));
    opslag.zetNood(sleutel(), { code: 'nieuw' }, opslag.zaadVan(START));
    render(<Veld />);
    await even();

    expect(stand().code).toBe('nieuw');
    expect(data.get(sleutel())).toMatchObject({ code: 'nieuw' });
  });

  it('wisselen naar een ander tabblad van de browser bewaart meteen', async () => {
    render(<Veld />);
    await even();
    await act(async () => typ('x = 1'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });

    // De pagina leeft nog: de database krijgt het, en de noodkopie is weg.
    expect(data.get(sleutel())).toMatchObject({ code: 'x = 1' });
    expect(nood.size).toBe(0);
  });

  it('doorklikken naar de volgende les (een unmount) bewaart ook', async () => {
    const { unmount } = render(<Veld />);
    await even();
    await act(async () => typ('x = 1'));
    unmount();
    await even();

    expect(data.get(sleutel())).toMatchObject({ code: 'x = 1' });
    expect(nood.size).toBe(0);
  });

  it('zonder wijziging schrijft het vertrek niets', async () => {
    data.set(sleutel(), regel('x = 1'));
    render(<Veld />);
    await even();
    window.dispatchEvent(new Event('pagehide'));

    expect(nood.size).toBe(0);
  });
});

describe('een database die niet antwoordt', () => {
  beforeEach(() => {
    leestMeteen = false;
  });

  it('na anderhalve seconde opent het veld met de startcode en bewaart het niets', async () => {
    data.set(sleutel(), regel('bewaard werk'));
    render(<Veld />);
    await later(1400);
    expect(stand().geladen).toBe(false);
    await later(100);
    expect(stand()).toEqual({ code: '', geladen: true, stand: 'geweigerd' });

    // Schrijven over werk dat niet te lezen was, zou het weggooien.
    await act(async () => typ('x'));
    await later(1000);
    expect(data.get(sleutel())).toMatchObject({ code: 'bewaard werk' });
    // Ook een antwoord dat nog komt, verandert het veld niet meer.
    await act(async () => leest?.los());
    expect(stand().code).toBe('x');
  });

  it('een trage computer is geen hangende database', async () => {
    // De processor is tien seconden bezig met de pagina. In die tijd loopt de
    // klok door, maar komt er geen enkele tik en ook geen antwoord van de
    // database. Daarna komt er één tik, en dan het antwoord.
    data.set(sleutel(), regel('bewaard werk'));
    const tikken: (() => void)[] = [];
    vi.spyOn(window, 'setInterval').mockImplementation(((tik: () => void) => {
      tikken.push(tik);
      return 1;
    }) as typeof window.setInterval);
    render(<Veld />);
    await later(10_000);
    await act(async () => {
      for (const tik of tikken) tik();
    });
    expect(stand().geladen).toBe(false);

    await act(async () => leest?.los());
    expect(stand()).toEqual({ code: 'bewaard werk', geladen: true, stand: 'bewaard' });
    vi.restoreAllMocks();
  });

  it('de noodkopie komt wel terug, en blijft staan', async () => {
    opslag.zetNood(sleutel(), { code: 'net getypt' }, opslag.zaadVan(START));
    render(<Veld />);
    await later(1500);

    expect(stand()).toEqual({ code: 'net getypt', geladen: true, stand: 'geweigerd' });
    expect(nood.size).toBe(1);
  });

  it('een browser die weigert, zegt dat', async () => {
    render(<Veld />);
    await act(async () => leest?.faal(new DOMException('nee', 'InvalidStateError')));

    expect(stand()).toEqual({ code: '', geladen: true, stand: 'geweigerd' });
  });
});
