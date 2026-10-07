import { describe, expect, it } from 'vitest';
import { normaliseerKlas } from './klas';

describe('normaliseerKlas', () => {
  it('houdt cursussen, lessen en https-links', () => {
    const klas = normaliseerKlas({
      code: 'abcdef2345',
      naam: '4H-inf',
      vak: 'informatica',
      intro: 'Hoi',
      groepen: [
        {
          id: 'p1',
          titel: 'Periode 1',
          items: [
            { type: 'cursus', site: 'python' },
            { type: 'pagina', site: 'python', docId: 'a', pad: '/python/docs/a', label: 'Les 1' },
            { type: 'link', url: 'https://forms.example', label: 'Inleveren' },
          ],
        },
      ],
    });
    expect(klas?.groepen[0].items.map((i) => i.type)).toEqual(['cursus', 'pagina', 'link']);
  });

  it('gooit onbekende cursussen en onveilige links weg', () => {
    const klas = normaliseerKlas({
      code: 'abcdef2345',
      naam: 'x',
      groepen: [
        {
          id: 'g',
          titel: '',
          items: [
            { type: 'cursus', site: 'bestaat-niet' },
            { type: 'link', url: 'javascript:alert(1)', label: 'x' },
            { type: 'pagina', site: 'python', docId: 'a', pad: '//evil.example/x', label: 'x' },
          ],
        },
      ],
    });
    expect(klas?.groepen).toEqual([]);
  });

  it('is null voor iets dat geen klas is', () => {
    expect(normaliseerKlas(null)).toBeNull();
    expect(normaliseerKlas({ detail: 'Onbekende klas' })).toBeNull();
  });
});
