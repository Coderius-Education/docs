import { describe, expect, it } from 'vitest';
import {
  bewaarNieuw,
  databaseNaam,
  geheugenOpslag,
  lijst,
  open,
  pdfNaamMetLeerling,
  standaardNaam,
  verwijder,
  werkBij,
} from './beoordelingen';
import type { ProjectFiles } from './types';

// Een docent neemt achter elkaar mondelingen af en maakt de PDF's later. Deze
// tests leggen vast dat een beoordeling blijft staan als er een volgende
// leerling bij komt, dat hij met project en al weer opengaat, en dat de
// vinkjes en opmerkingen van leerling A nooit bij leerling B terechtkomen.

const files = (naam: string): ProjectFiles => ({
  'index.html': {
    path: 'index.html',
    kind: 'html',
    content: `<h1>${naam}</h1>`,
    sizeBytes: 10,
    tooLarge: false,
  },
});

const om = (uur: number, minuut = 0) => new Date(2026, 9, 19, uur, minuut);

describe('beoordelingen bewaren', () => {
  it('houdt de vorige leerling als er een volgende bij komt', async () => {
    const opslag = geheugenOpslag();
    const sam = await bewaarNieuw(
      opslag,
      'Sam',
      { files: files('Sam'), warnings: [] },
      om(9),
      null,
    );
    await werkBij(opslag, sam, { handmatig: ['uitleg'], notes: 'Goed verteld.' }, om(9, 20));
    await bewaarNieuw(opslag, 'Noor', { files: files('Noor'), warnings: [] }, om(9, 30), null);

    const terug = await open(opslag, sam.id);
    expect(terug?.beoordeling).toMatchObject({
      naam: 'Sam',
      handmatig: ['uitleg'],
      notes: 'Goed verteld.',
    });
    expect(terug?.project.files['index.html'].content).toBe('<h1>Sam</h1>');
  });

  it('begint elke nieuwe leerling leeg, zonder vinkjes of opmerkingen van de vorige', async () => {
    const opslag = geheugenOpslag();
    const sam = await bewaarNieuw(
      opslag,
      'Sam',
      { files: files('Sam'), warnings: [] },
      om(9),
      null,
    );
    await werkBij(opslag, sam, { handmatig: ['uitleg'], notes: 'Goed.' }, om(9, 10));
    const noor = await bewaarNieuw(
      opslag,
      'Noor',
      { files: files('Noor'), warnings: [] },
      om(10),
      'a',
    );
    expect(noor).toMatchObject({ handmatig: [], notes: '', track: 'a' });
  });

  it('zet de laatst bewerkte bovenaan, ook als die als eerste begon', async () => {
    const opslag = geheugenOpslag();
    const sam = await bewaarNieuw(
      opslag,
      'Sam',
      { files: files('Sam'), warnings: [] },
      om(9),
      null,
    );
    await bewaarNieuw(opslag, 'Noor', { files: files('Noor'), warnings: [] }, om(10), null);
    expect((await lijst(opslag)).map((b) => b.naam)).toEqual(['Noor', 'Sam']);

    // 's Middags nog één keer Sam bijwerken voor de PDF.
    await werkBij(opslag, sam, { notes: 'Nog een punt.' }, om(14));
    expect((await lijst(opslag)).map((b) => b.naam)).toEqual(['Sam', 'Noor']);
  });

  it('verwijdert de beoordeling én het project', async () => {
    const opslag = geheugenOpslag();
    const sam = await bewaarNieuw(
      opslag,
      'Sam',
      { files: files('Sam'), warnings: [] },
      om(9),
      null,
    );
    await verwijder(opslag, sam.id);
    expect(await lijst(opslag)).toEqual([]);
    expect(await opslag.projecten.lees(sam.id)).toBeUndefined();
    expect(await open(opslag, sam.id)).toBeNull();
  });

  it('geeft een naam als de docent niets invulde, en houdt de oude bij een lege nieuwe', async () => {
    const opslag = geheugenOpslag();
    const b = await bewaarNieuw(opslag, '  ', { files: files('x'), warnings: [] }, om(9, 5), null);
    expect(b.naam).toBe(standaardNaam(om(9, 5)));
    expect(b.naam).toBe('Leerling 19-10 09:05');
    const nieuw = await werkBij(opslag, b, { naam: '' }, om(9, 6));
    expect(nieuw.naam).toBe('Leerling 19-10 09:05');
  });

  it('een opgeslagen beoordeling verandert niet mee met het object in de pagina', async () => {
    const opslag = geheugenOpslag();
    const b = await bewaarNieuw(opslag, 'Sam', { files: files('Sam'), warnings: [] }, om(9), null);
    b.handmatig.push('stiekem');
    expect((await open(opslag, b.id))?.beoordeling.handmatig).toEqual([]);
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
