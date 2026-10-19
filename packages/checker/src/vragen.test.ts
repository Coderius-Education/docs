import { describe, expect, it } from 'vitest';
import type { ProjectFiles } from './types';
import {
  type Vraag,
  fragment,
  nieuweVraag,
  plekLabel,
  verplaatsVraag,
  verwijderVraag,
  wijzigVraag,
} from './vragen';

// De vragen voor het mondeling: vooraf gemarkeerd, tijdens het gesprek
// beoordeeld, en in die vorm in de PDF.

const files: ProjectFiles = {
  'app.js': {
    path: 'app.js',
    kind: 'js',
    content: 'const a = 1;\r\nconst b = 2;\nconst c = 3;\n',
    sizeBytes: 10,
    tooLarge: false,
  },
};

const drie = (): Vraag[] => [
  nieuweVraag('1', 'app.js', 1, 1, 'Eén?'),
  nieuweVraag('2', 'app.js', 2, 2, 'Twee?'),
  nieuweVraag('3', 'app.js', 3, 3, 'Drie?'),
];

describe('vragen', () => {
  it('maakt een vraag ook als de docent eerst de onderste regel aanklikte', () => {
    expect(nieuweVraag('x', 'app.js', 5, 2, '  Wat doet dit? ')).toEqual({
      id: 'x',
      bestand: 'app.js',
      van: 2,
      tot: 5,
      vraag: 'Wat doet dit?',
      oordeel: null,
      notitie: '',
    });
  });

  it('wijzigt en verwijdert alleen de bedoelde vraag', () => {
    const v = wijzigVraag(drie(), '2', { oordeel: 'goed', notitie: 'Legt het uit' });
    expect(v.map((x) => x.oordeel)).toEqual([null, 'goed', null]);
    expect(verwijderVraag(v, '2').map((x) => x.id)).toEqual(['1', '3']);
  });

  it('verplaatst een vraag, en doet aan de rand niets', () => {
    expect(verplaatsVraag(drie(), '3', -1).map((x) => x.id)).toEqual(['1', '3', '2']);
    expect(verplaatsVraag(drie(), '1', -1).map((x) => x.id)).toEqual(['1', '2', '3']);
    expect(verplaatsVraag(drie(), '3', 1).map((x) => x.id)).toEqual(['1', '2', '3']);
  });

  it('noemt de plek in woorden', () => {
    expect(plekLabel({ bestand: 'app.js', van: 2, tot: 2 })).toBe('app.js, regel 2');
    expect(plekLabel({ bestand: 'app.js', van: 2, tot: 4 })).toBe('app.js, regels 2–4');
  });
});

describe('fragment', () => {
  it('geeft de regels met hun nummer, zonder Windows-regeleinde', () => {
    expect(fragment(files, { bestand: 'app.js', van: 1, tot: 2 })).toEqual({
      regels: [
        { nr: 1, tekst: 'const a = 1;' },
        { nr: 2, tekst: 'const b = 2;' },
      ],
      meer: 0,
      ontbreekt: false,
    });
  });

  it('kort een lang fragment in en zegt hoeveel er nog volgen', () => {
    const f = fragment(files, { bestand: 'app.js', van: 1, tot: 3 }, 2);
    expect(f.regels.map((r) => r.nr)).toEqual([1, 2]);
    expect(f.meer).toBe(1);
  });

  it('zegt het als het bestand of de regel er niet (meer) is', () => {
    expect(fragment(files, { bestand: 'weg.js', van: 1, tot: 1 }).ontbreekt).toBe(true);
    expect(fragment(files, { bestand: 'app.js', van: 99, tot: 99 }).ontbreekt).toBe(true);
  });
});
