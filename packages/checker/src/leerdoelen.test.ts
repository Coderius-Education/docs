import { describe, expect, it } from 'vitest';
import { leerdoelenNaarConfig } from './leerdoelen';
import type { ConceptDetect } from './types';

const detect: ConceptDetect = { type: 'regex', pattern: /x/g };

const eenNiveau = {
  niveaus: [{ id: 'start', label: 'Start' }],
  onderwerpen: [{ id: 'html', label: 'HTML' }],
  concepten: [
    { id: 'html-a', onderwerp: 'html', concept: 'a', start: 'basis' },
    { id: 'html-forms', onderwerp: 'html', concept: 'forms', start: 'gevorderd' },
  ],
};

const tweeNiveaus = {
  niveaus: [
    { id: 'havo', label: 'Start havo' },
    { id: 'vwo', label: 'Start vwo' },
  ],
  onderwerpen: [{ id: 'api', label: 'FastAPI' }],
  concepten: [
    {
      id: 'api-cookies',
      onderwerp: 'api',
      concept: 'Cookies',
      bloom: 'toepassen',
      havo: 'expert',
      vwo: 'gevorderd',
    },
  ],
};

describe('leerdoelenNaarConfig', () => {
  it('één niveau: een gewone moeilijkheid per concept, met de moeilijkheid als groep', () => {
    const uit = leerdoelenNaarConfig(eenNiveau, { 'html-a': detect, 'html-forms': detect });
    expect(uit.tracks).toBeUndefined();
    expect(uit.subjects).toEqual([{ id: 'html', label: 'HTML' }]);
    expect(uit.concepts.map((c) => [c.id, c.level, c.group])).toEqual([
      ['html-a', 'basis', 'Basis'],
      ['html-forms', 'gevorderd', 'Gevorderd'],
    ]);
  });

  it('meer niveaus: de niveaus worden leerroutes, met een moeilijkheid per route', () => {
    const uit = leerdoelenNaarConfig(tweeNiveaus, { 'api-cookies': detect });
    expect(uit.tracks).toEqual(tweeNiveaus.niveaus);
    expect(uit.concepts[0]).toMatchObject({
      level: { havo: 'expert', vwo: 'gevorderd' },
      bloom: 'toepassen',
      label: 'Cookies',
    });
    expect(uit.leerdoelen.concepten[0].niveau).toEqual({ havo: 'expert', vwo: 'gevorderd' });
  });

  it('een nieuwe rij in de leerdoelen zonder herkenning stopt de nakijker', () => {
    expect(() => leerdoelenNaarConfig(eenNiveau, { 'html-a': detect })).toThrow(
      "concept 'html-forms' staat in leerdoelen.json maar heeft geen herkenning",
    );
  });

  it('een herkenning zonder rij ook: dat concept beoordeelt de docent niet meer', () => {
    expect(() =>
      leerdoelenNaarConfig(eenNiveau, {
        'html-a': detect,
        'html-forms': detect,
        'html-oud': detect,
      }),
    ).toThrow("herkenning voor 'html-oud', dat niet in leerdoelen.json staat");
  });

  it('een fout in de leerdoelen zelf komt uit leesLeerdoelen', () => {
    expect(() => leerdoelenNaarConfig({ ...eenNiveau, niveaus: [] }, {})).toThrow(/niveau/);
  });
});
