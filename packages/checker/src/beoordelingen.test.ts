import { describe, expect, it } from 'vitest';
import {
  type Bak,
  type Beoordeling,
  Bewaarder,
  type Opslag,
  type Project,
  databaseNaam,
  geheugenOpslag,
  opslagMelding,
  pdfNaamMetLeerling,
  ruimOp,
} from './beoordelingen';
import type { ProjectFiles } from './types';

// Een docent neemt achter elkaar mondelingen af en maakt de PDF's later. Deze
// tests leggen vast dat een beoordeling blijft staan als er een volgende
// leerling bij komt, dat hij met project en al weer opengaat, en dat de
// vinkjes en opmerkingen van leerling A nooit bij leerling B terechtkomen.
// Daarnaast de fouten die een review in de eerste versie vond: een vinkje
// vlak na de upload dat verloren ging, een upload terwijl de opslag nog
// openging, een project dat achterbleef als het bewaren halverwege mislukte,
// en verwijderen dat stil halverwege stopte.

const files = (naam: string): ProjectFiles => ({
  'index.html': {
    path: 'index.html',
    kind: 'html',
    content: `<h1>${naam}</h1>`,
    sizeBytes: 10,
    tooLarge: false,
  },
});

const project = (naam: string): Project => ({ files: files(naam), warnings: [] });

/** Een klok die elke keer een minuut verder staat, vanaf 19 oktober 9:00. */
function klok() {
  let minuut = 0;
  return () => new Date(2026, 9, 19, 9, minuut++);
}

function bewaarder(opslag: Opslag | Promise<Opslag> = geheugenOpslag()) {
  const fouten: string[] = [];
  const b = new Bewaarder(Promise.resolve(opslag), {
    onLijst: () => {},
    onFout: (m) => fouten.push(m),
    nu: klok(),
  });
  return { b, fouten };
}

/** Wacht tot alles in de rij van de bewaarder klaar is. */
const stil = (b: Bewaarder) => b.open('niets');

/** Een geheugenopslag die telt, kan wachten en kan falen. */
function nepOpslag() {
  const echt = geheugenOpslag();
  const teller = { beoordelingSchrijf: 0 };
  const gedrag = {
    beoordelingFout: null as unknown,
    wisFoutBij: null as string | null,
    wachtProject: null as Promise<void> | null,
    /** Houdt de eerstvolgende schrijfactie van een beoordeling vast. */
    houdBeoordeling: null as { gestart: () => void; los: Promise<void> } | null,
  };
  const beoordelingen: Bak<Beoordeling> = {
    ...echt.beoordelingen,
    schrijf: async (id, w) => {
      teller.beoordelingSchrijf++;
      if (gedrag.beoordelingFout) throw gedrag.beoordelingFout;
      const houd = gedrag.houdBeoordeling;
      if (houd) {
        gedrag.houdBeoordeling = null;
        houd.gestart();
        await houd.los;
      }
      await echt.beoordelingen.schrijf(id, w);
    },
    wis: async (id) => {
      if (id === gedrag.wisFoutBij) throw new Error('wissen mislukt');
      await echt.beoordelingen.wis(id);
    },
  };
  const projecten: Bak<Project> = {
    ...echt.projecten,
    schrijf: async (id, w) => {
      if (gedrag.wachtProject) await gedrag.wachtProject;
      await echt.projecten.schrijf(id, w);
    },
  };
  return { opslag: { beoordelingen, projecten } as Opslag, echt, teller, gedrag };
}

function uitgesteld() {
  let los = () => {};
  const p = new Promise<void>((r) => {
    los = r;
  });
  return { p, los };
}

describe('Bewaarder: beoordelingen bewaren', () => {
  it('houdt de vorige leerling als er een volgende bij komt, en opent hem met project', async () => {
    const opslag = geheugenOpslag();
    const { b } = bewaarder(opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { handmatig: ['uitleg'], notes: 'Goed verteld.' });
    b.nieuw('Noor', project('Noor'), null);
    await stil(b);

    // Een nieuwe pagina (herladen) leest hetzelfde terug.
    const { b: na } = bewaarder(opslag);
    await na.klaar;
    const terug = await na.open(sam.id);
    expect(terug?.beoordeling).toMatchObject({
      naam: 'Sam',
      handmatig: ['uitleg'],
      notes: 'Goed verteld.',
    });
    expect(terug?.project.files['index.html'].content).toBe('<h1>Sam</h1>');
  });

  it('begint elke nieuwe leerling leeg, zonder vinkjes of opmerkingen van de vorige', () => {
    const { b } = bewaarder();
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { handmatig: ['uitleg'], notes: 'Goed.' });
    expect(b.nieuw('Noor', project('Noor'), 'a')).toMatchObject({
      handmatig: [],
      notes: '',
      track: 'a',
    });
  });

  it('zet de laatst bewerkte bovenaan, ook als die als eerste begon', () => {
    const { b } = bewaarder();
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.nieuw('Noor', project('Noor'), null);
    expect(b.lijst().map((x) => x.naam)).toEqual(['Noor', 'Sam']);
    // 's Middags nog één keer Sam bijwerken voor de PDF.
    b.wijzig(sam.id, { notes: 'Nog een punt.' });
    expect(b.lijst().map((x) => x.naam)).toEqual(['Sam', 'Noor']);
  });

  it('geeft een naam als de docent niets invulde, en houdt de oude bij een lege nieuwe', () => {
    const { b } = bewaarder();
    const x = b.nieuw('  ', project('x'), null);
    expect(x.naam).toBe('Leerling 19-10 09:00');
    expect(b.wijzig(x.id, { naam: '' })?.naam).toBe('Leerling 19-10 09:00');
  });

  it('bewaart een vinkje dat de docent zet terwijl het project nog wordt weggeschreven', async () => {
    const nep = nepOpslag();
    const wacht = uitgesteld();
    nep.gedrag.wachtProject = wacht.p;
    const { b } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { handmatig: ['uitleg'] });
    b.wijzig(sam.id, { notes: 'Snel getypt' });
    wacht.los();
    await stil(b);
    expect(await nep.echt.beoordelingen.lees(sam.id)).toMatchObject({
      handmatig: ['uitleg'],
      notes: 'Snel getypt',
    });
  });

  it('bewaart een wijziging die binnenkomt terwijl de beoordeling zelf wordt weggeschreven', async () => {
    const nep = nepOpslag();
    const gestart = uitgesteld();
    const los = uitgesteld();
    nep.gedrag.houdBeoordeling = { gestart: gestart.los, los: los.p };
    const { b } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    await gestart.p;
    b.wijzig(sam.id, { notes: 'Tijdens het schrijven' });
    los.los();
    await stil(b);
    expect((await nep.echt.beoordelingen.lees(sam.id))?.notes).toBe('Tijdens het schrijven');
  });

  it('raakt een upload niet kwijt die binnenkomt terwijl de opslag nog opengaat', async () => {
    const echt = geheugenOpslag();
    let open = (_o: Opslag) => {};
    const later = new Promise<Opslag>((r) => {
      open = r;
    });
    const b = new Bewaarder(later, { onLijst: () => {}, onFout: () => {}, nu: klok() });
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { notes: 'Vroeg' });
    expect(b.get(sam.id)?.notes).toBe('Vroeg');
    open(echt);
    await stil(b);
    expect((await echt.beoordelingen.lees(sam.id))?.notes).toBe('Vroeg');
    expect(await echt.projecten.lees(sam.id)).toBeDefined();
  });

  it('voegt een rij toetsaanslagen samen tot een paar schrijfacties', async () => {
    const nep = nepOpslag();
    const { b } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    await stil(b);
    nep.teller.beoordelingSchrijf = 0;
    const tekst = 'Legt de canvas goed uit.';
    for (let i = 1; i <= tekst.length; i++) b.wijzig(sam.id, { notes: tekst.slice(0, i) });
    await stil(b);
    expect(nep.teller.beoordelingSchrijf).toBeLessThanOrEqual(2);
    expect((await nep.echt.beoordelingen.lees(sam.id))?.notes).toBe(tekst);
  });

  it('laat geen project achter als het bewaren halverwege mislukt, en meldt waarom', async () => {
    const nep = nepOpslag();
    nep.gedrag.beoordelingFout = new DOMException('vol', 'QuotaExceededError');
    const { b, fouten } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    await stil(b);
    expect(await nep.echt.projecten.sleutels()).toEqual([]);
    expect(fouten).toEqual([opslagMelding(new DOMException('vol', 'QuotaExceededError'))]);
    expect(fouten[0]).toContain('vol');
    // Op deze pagina blijft Sam wel te openen, tot de pagina sluit.
    expect((await b.open(sam.id))?.project.files['index.html'].content).toBe('<h1>Sam</h1>');
  });

  it('ruimt bij het openen projecten op waar geen beoordeling meer bij hoort', async () => {
    const opslag = geheugenOpslag();
    await opslag.projecten.schrijf('wees', project('x'));
    const { b } = bewaarder(opslag);
    await b.klaar;
    expect(await opslag.projecten.sleutels()).toEqual([]);
  });

  it('verwijdert de beoordeling én het project', async () => {
    const opslag = geheugenOpslag();
    const { b } = bewaarder(opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    expect(await b.verwijder(sam.id)).toBe(true);
    expect(b.lijst()).toEqual([]);
    expect(await opslag.beoordelingen.sleutels()).toEqual([]);
    expect(await opslag.projecten.sleutels()).toEqual([]);
  });

  it('zegt het als alles verwijderen halverwege mislukt, en toont wat er nog staat', async () => {
    const nep = nepOpslag();
    const { b, fouten } = bewaarder(nep.opslag);
    b.nieuw('Sam', project('Sam'), null);
    const noor = b.nieuw('Noor', project('Noor'), null);
    b.nieuw('Ali', project('Ali'), null);
    await stil(b);
    nep.gedrag.wisFoutBij = noor.id;

    expect(await b.verwijderAlles()).toBe(false);
    expect(fouten).toHaveLength(1);
    // De lijst liegt niet: Noor staat er nog, de anderen zijn echt weg.
    expect(b.lijst().map((x) => x.naam)).toEqual(['Noor']);
    expect(await nep.echt.beoordelingen.sleutels()).toEqual([noor.id]);
  });

  it('schrijft een verwijderde beoordeling niet alsnog terug', async () => {
    const opslag = geheugenOpslag();
    const { b } = bewaarder(opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { notes: 'x' });
    await b.verwijder(sam.id);
    await stil(b);
    expect(await opslag.beoordelingen.sleutels()).toEqual([]);
    expect(await opslag.projecten.sleutels()).toEqual([]);
  });

  it('ruimOp laat projecten met een beoordeling staan', async () => {
    const opslag = geheugenOpslag();
    const { b } = bewaarder(opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    await stil(b);
    await ruimOp(opslag);
    expect(await opslag.projecten.sleutels()).toEqual([sam.id]);
  });
});

describe('databaseNaam', () => {
  it('hoort bij de site, want alle cursussen van een vak delen één IndexedDB', () => {
    expect(
      databaseNaam({
        teacher: { password: 'x', storageKey: 'coderius:web:webChecker.docentUnlocked' },
      }),
    ).toBe('coderius:web:nakijker.beoordelingen');
    expect(
      databaseNaam({
        teacher: { password: 'x', storageKey: 'coderius:godot:godotChecker.docent' },
      }),
    ).toBe('coderius:godot:nakijker.beoordelingen');
  });
});

describe('pdfNaamMetLeerling', () => {
  it('zet de naam vóór .pdf', () => {
    expect(pdfNaamMetLeerling('Beoordeling Web Project - 2026-10-19.pdf', 'Sam, 5V2')).toBe(
      'Beoordeling Web Project - 2026-10-19 - Sam, 5V2.pdf',
    );
  });

  it('haalt tekens weg die een bestandssysteem weigert', () => {
    expect(pdfNaamMetLeerling('a.pdf', 'Sam / Noor: 5V2?')).toBe('a - Sam Noor 5V2.pdf');
  });

  it('laat de naam staan zonder leerling', () => {
    expect(pdfNaamMetLeerling('a.pdf', '  ')).toBe('a.pdf');
  });
});
