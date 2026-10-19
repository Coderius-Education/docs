import { describe, expect, it } from 'vitest';
import {
  BEWAARTERMIJN_DAGEN,
  type Beoordeling,
  Bewaarder,
  LEESFOUT,
  type Opslag,
  type Project,
  aangevuld,
  databaseNaam,
  geheugenOpslag,
  opslagMelding,
  pdfNaamMetLeerling,
  verlopen,
} from './beoordelingen';
import type { ProjectFiles } from './types';

// Een docent neemt achter elkaar mondelingen af en maakt de PDF's later. Deze
// tests leggen vast dat een beoordeling blijft staan als er een volgende
// leerling bij komt, dat hij met project en al weer opengaat, en dat de
// vinkjes en opmerkingen van leerling A nooit bij leerling B terechtkomen.
// Daarnaast de fouten die twee reviews vonden: een vinkje vlak na de upload
// dat verloren ging, een upload terwijl de opslag nog openging, een project
// dat achterbleef als het bewaren halverwege mislukte, verwijderen dat stil
// halverwege stopte, een leesfout die een lege lijst gaf zonder melding, en
// een mislukte schrijfactie die de wijzigingen van andere leerlingen meenam.

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

/** Een klok die elke keer een minuut verder staat, vanaf `start`. */
function klok(start = new Date(2026, 9, 19, 9, 0)) {
  let minuut = 0;
  return () => new Date(start.getTime() + 60_000 * minuut++);
}

function bewaarder(opslag: Opslag | Promise<Opslag> = geheugenOpslag(), nu = klok()) {
  // null: een eerdere schrijffout is opgelost.
  const fouten: (string | null)[] = [];
  const b = new Bewaarder(Promise.resolve(opslag), {
    onLijst: () => {},
    onFout: (m) => fouten.push(m),
    nu,
  });
  return { b, fouten };
}

/** Wacht tot alles in de rij van de bewaarder klaar is. */
const stil = (b: Bewaarder) => b.open('niets');

/** Een geheugenopslag die telt, kan wachten en kan falen. */
function nepOpslag() {
  const echt = geheugenOpslag();
  const teller = { bewaarBeoordeling: 0 };
  const gedrag = {
    nieuwFout: null as unknown,
    bewaarFoutBij: null as string | null,
    wisFoutBij: null as string | null,
    leesFout: false,
    /** Houdt het inlezen van de lijst vast tot dit klaar is. */
    wachtLezen: null as Promise<void> | null,
    wachtNieuw: null as Promise<void> | null,
    /** Houdt de eerstvolgende bewaarNieuw vast, nadat hij is begonnen. */
    houdNieuw: null as { gestart: () => void; los: Promise<void> } | null,
  };
  const opslag: Opslag = {
    alleBeoordelingen: async () => {
      if (gedrag.wachtLezen) await gedrag.wachtLezen;
      if (gedrag.leesFout) throw new Error('lezen mislukt');
      return echt.alleBeoordelingen();
    },
    leesProject: (id) => echt.leesProject(id),
    bewaarNieuw: async (b, p) => {
      if (gedrag.wachtNieuw) await gedrag.wachtNieuw;
      const houd = gedrag.houdNieuw;
      if (houd) {
        gedrag.houdNieuw = null;
        houd.gestart();
        await houd.los;
      }
      if (gedrag.nieuwFout) throw gedrag.nieuwFout;
      await echt.bewaarNieuw(b, p);
    },
    bewaarBeoordeling: async (b) => {
      teller.bewaarBeoordeling++;
      if (b.id === gedrag.bewaarFoutBij) throw new Error('bewaren mislukt');
      await echt.bewaarBeoordeling(b);
    },
    wis: async (id) => {
      if (id === gedrag.wisFoutBij) throw new Error('wissen mislukt');
      await echt.wis(id);
    },
  };
  return { opslag, echt, teller, gedrag };
}

function uitgesteld() {
  let los = () => {};
  const p = new Promise<void>((r) => {
    los = r;
  });
  return { p, los };
}

const ids = async (o: Opslag) => (await o.alleBeoordelingen()).map((b) => b.id).sort();

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
      vragen: [],
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
    nep.gedrag.wachtNieuw = wacht.p;
    const { b } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { handmatig: ['uitleg'] });
    b.wijzig(sam.id, { notes: 'Snel getypt' });
    wacht.los();
    await stil(b);
    expect((await nep.echt.alleBeoordelingen())[0]).toMatchObject({
      handmatig: ['uitleg'],
      notes: 'Snel getypt',
    });
  });

  it('bewaart een wijziging die binnenkomt terwijl de beoordeling zelf wordt weggeschreven', async () => {
    const nep = nepOpslag();
    const gestart = uitgesteld();
    const los = uitgesteld();
    nep.gedrag.houdNieuw = { gestart: gestart.los, los: los.p };
    const { b } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    await gestart.p;
    b.wijzig(sam.id, { notes: 'Tijdens het schrijven' });
    los.los();
    await stil(b);
    expect((await nep.echt.alleBeoordelingen())[0].notes).toBe('Tijdens het schrijven');
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
    expect((await echt.alleBeoordelingen())[0].notes).toBe('Vroeg');
    expect(await echt.leesProject(sam.id)).toBeDefined();
  });

  it('voegt een rij toetsaanslagen samen tot een paar schrijfacties', async () => {
    const nep = nepOpslag();
    const { b } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    await stil(b);
    nep.teller.bewaarBeoordeling = 0;
    const tekst = 'Legt de canvas goed uit.';
    for (let i = 1; i <= tekst.length; i++) b.wijzig(sam.id, { notes: tekst.slice(0, i) });
    await stil(b);
    expect(nep.teller.bewaarBeoordeling).toBeLessThanOrEqual(2);
    expect((await nep.echt.alleBeoordelingen())[0].notes).toBe(tekst);
  });

  it('bewaart beoordeling en project samen of niet: een volle opslag laat niets achter', async () => {
    const nep = nepOpslag();
    nep.gedrag.nieuwFout = new DOMException('vol', 'QuotaExceededError');
    const { b, fouten } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { notes: 'Hoort niet in de opslag' });
    await stil(b);
    expect(await nep.echt.alleBeoordelingen()).toEqual([]);
    expect(await nep.echt.leesProject(sam.id)).toBeUndefined();
    // De wijziging erna probeert het opnieuw en faalt ook: dezelfde melding.
    expect(new Set(fouten)).toEqual(
      new Set([opslagMelding(new DOMException('vol', 'QuotaExceededError'))]),
    );
    expect(fouten[0]).toContain('vol');
    // Op deze pagina blijft Sam wel te openen, tot de pagina sluit.
    expect((await b.open(sam.id))?.project.files['index.html'].content).toBe('<h1>Sam</h1>');
  });

  it('schrijft de andere leerlingen gewoon weg als één schrijfactie mislukt, en probeert die later opnieuw', async () => {
    const nep = nepOpslag();
    const { b, fouten } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    const noor = b.nieuw('Noor', project('Noor'), null);
    await stil(b);
    nep.gedrag.bewaarFoutBij = sam.id;
    b.wijzig(sam.id, { notes: 'Sam later' });
    b.wijzig(noor.id, { notes: 'Noor nu' });
    await stil(b);
    const opgeslagen = async (id: string) =>
      (await nep.echt.alleBeoordelingen()).find((x) => x.id === id)?.notes;
    expect(await opgeslagen(noor.id)).toBe('Noor nu');
    expect(await opgeslagen(sam.id)).toBe('');
    expect(fouten).toHaveLength(1);

    // De opslag werkt weer; de volgende wijziging neemt Sam mee, en de
    // melding verdwijnt.
    nep.gedrag.bewaarFoutBij = null;
    b.wijzig(noor.id, { notes: 'Noor nog eens' });
    await stil(b);
    expect(await opgeslagen(sam.id)).toBe('Sam later');
    expect(fouten.at(-1)).toBeNull();
  });

  it('bewaart een nieuwe beoordeling die niet paste alsnog, zodra verwijderen ruimte maakt', async () => {
    const nep = nepOpslag();
    const { b, fouten } = bewaarder(nep.opslag);
    const oud = b.nieuw('Oud', project('Oud'), null);
    await stil(b);
    nep.gedrag.nieuwFout = new DOMException('vol', 'QuotaExceededError');
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { notes: 'Goed verteld' });
    await stil(b);
    expect(await ids(nep.echt)).toEqual([oud.id]);

    // De docent doet wat de melding zegt: een oude beoordeling weg.
    nep.gedrag.nieuwFout = null;
    await b.verwijder(oud.id);
    await stil(b);
    expect(await ids(nep.echt)).toEqual([sam.id]);
    expect((await nep.echt.alleBeoordelingen())[0].notes).toBe('Goed verteld');
    expect((await nep.echt.leesProject(sam.id))?.files['index.html'].content).toBe('<h1>Sam</h1>');
    expect(fouten.at(-1)).toBeNull();
  });

  it('probeert een mislukte wijziging opnieuw na een verwijdering, ook zonder nieuwe wijziging', async () => {
    const nep = nepOpslag();
    const { b } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    const oud = b.nieuw('Oud', project('Oud'), null);
    await stil(b);
    nep.gedrag.bewaarFoutBij = sam.id;
    b.wijzig(sam.id, { notes: 'Laatste notitie' });
    await stil(b);
    nep.gedrag.bewaarFoutBij = null;
    await b.verwijder(oud.id);
    await stil(b);
    expect((await nep.echt.alleBeoordelingen()).find((x) => x.id === sam.id)?.notes).toBe(
      'Laatste notitie',
    );
  });

  it('verwijdert ook wat nog niet was ingelezen als de docent alles verwijdert', async () => {
    const nep = nepOpslag();
    await nep.echt.bewaarNieuw(
      {
        ...aangevuld({} as Beoordeling),
        id: 'eerder',
        naam: 'Eerder',
        aangemaakt: 0,
        bijgewerkt: Date.now(),
        track: null,
      },
      project('Eerder'),
    );
    const lezen = uitgesteld();
    nep.gedrag.wachtLezen = lezen.p;
    const { b } = bewaarder(nep.opslag, () => new Date());
    b.nieuw('Nu', project('Nu'), null);
    const klaar = b.verwijderAlles();
    lezen.los();
    expect(await klaar).toBe(true);
    await stil(b);
    expect(b.lijst()).toEqual([]);
    expect(await ids(nep.echt)).toEqual([]);
  });

  it('laat een leesfout staan, ook als bewaren daarna lukt', async () => {
    const nep = nepOpslag();
    nep.gedrag.leesFout = true;
    const { b, fouten } = bewaarder(nep.opslag);
    await b.klaar;
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { notes: 'x' });
    await stil(b);
    expect(fouten).toEqual([LEESFOUT]);
  });

  it('houdt een beoordeling niet vast die werd verwijderd terwijl het bewaren mislukte', async () => {
    const nep = nepOpslag();
    const gestart = uitgesteld();
    const los = uitgesteld();
    nep.gedrag.houdNieuw = { gestart: gestart.los, los: los.p };
    nep.gedrag.nieuwFout = new DOMException('vol', 'QuotaExceededError');
    const { b, fouten } = bewaarder(nep.opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    await gestart.p;
    const weg = b.verwijder(sam.id);
    los.los();
    await weg;
    await stil(b);
    expect(b.lijst()).toEqual([]);
    // Geen melding over iets dat niet meer bestaat, en geen project dat in
    // het geheugen blijft hangen: open() vindt niets.
    expect(fouten.filter((f) => f !== null)).toEqual([]);
    expect(await b.open(sam.id)).toBeNull();
  });

  it('meldt het als de bewaarde beoordelingen niet te lezen zijn, in plaats van een lege lijst', async () => {
    const nep = nepOpslag();
    nep.gedrag.leesFout = true;
    const { b, fouten } = bewaarder(nep.opslag);
    await b.klaar;
    expect(fouten).toEqual([LEESFOUT]);
  });

  it(`gooit een beoordeling weg die ${BEWAARTERMIJN_DAGEN} dagen niet is gewijzigd`, async () => {
    const opslag = geheugenOpslag();
    const { b } = bewaarder(opslag, klok(new Date(2026, 9, 1, 9, 0)));
    const oud = b.nieuw('Oud', project('Oud'), null);
    await stil(b);
    const { b: twaalfDagen } = bewaarder(opslag, klok(new Date(2026, 9, 13, 9, 0)));
    const recent = twaalfDagen.nieuw('Recent', project('Recent'), null);
    await stil(twaalfDagen);

    const { b: later } = bewaarder(opslag, klok(new Date(2026, 9, 16, 9, 0)));
    await later.klaar;
    expect(later.lijst().map((x) => x.naam)).toEqual(['Recent']);
    expect(await ids(opslag)).toEqual([recent.id]);
    expect(await opslag.leesProject(oud.id)).toBeUndefined();
  });

  it('verlopen telt vanaf de laatste wijziging', () => {
    const nu = new Date(2026, 9, 19, 12, 0);
    const dag = 24 * 60 * 60 * 1000;
    expect(verlopen({ bijgewerkt: nu.getTime() - (BEWAARTERMIJN_DAGEN - 1) * dag }, nu)).toBe(
      false,
    );
    expect(verlopen({ bijgewerkt: nu.getTime() - (BEWAARTERMIJN_DAGEN + 1) * dag }, nu)).toBe(true);
  });

  it('verwijdert de beoordeling én het project', async () => {
    const opslag = geheugenOpslag();
    const { b } = bewaarder(opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    expect(await b.verwijder(sam.id)).toBe(true);
    expect(b.lijst()).toEqual([]);
    expect(await ids(opslag)).toEqual([]);
    expect(await opslag.leesProject(sam.id)).toBeUndefined();
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
    expect(await ids(nep.echt)).toEqual([noor.id]);
  });

  it('schrijft een verwijderde beoordeling niet alsnog terug', async () => {
    const opslag = geheugenOpslag();
    const { b } = bewaarder(opslag);
    const sam = b.nieuw('Sam', project('Sam'), null);
    b.wijzig(sam.id, { notes: 'x' });
    await b.verwijder(sam.id);
    await stil(b);
    expect(await ids(opslag)).toEqual([]);
    expect(await opslag.leesProject(sam.id)).toBeUndefined();
  });

  it('bewaart de vragen voor het mondeling, en vult ze aan bij een oudere beoordeling', async () => {
    const opslag = geheugenOpslag();
    // Een beoordeling zoals de eerste versie van de nakijker hem bewaarde.
    const oud = {
      id: 'oud',
      naam: 'Oud',
      aangemaakt: Date.now(),
      bijgewerkt: Date.now(),
      handmatig: [],
      notes: '',
      track: null,
    } as unknown as Beoordeling;
    await opslag.bewaarNieuw(oud, project('Oud'));
    const { b } = bewaarder(opslag, () => new Date());
    await b.klaar;
    expect(b.get('oud')?.vragen).toEqual([]);

    const vraag = {
      id: 'v',
      bestand: 'index.html',
      van: 1,
      tot: 1,
      vraag: 'Wat doet h1?',
      oordeel: null,
      notitie: '',
    };
    b.wijzig('oud', { vragen: [vraag] });
    await stil(b);
    expect((await opslag.alleBeoordelingen())[0].vragen).toEqual([vraag]);
    expect(aangevuld(oud).vragen).toEqual([]);
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
