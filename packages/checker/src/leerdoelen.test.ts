import { describe, expect, it } from 'vitest';
import { leerdoelenNaarConfig } from './leerdoelen';
import type { ConceptDetect } from './types';

const detect: ConceptDetect = { type: 'regex', pattern: /x/g };

const eenNiveau = {
  niveaus: ['1'],
  onderwerpen: [{ id: 'html', label: 'HTML' }],
  concepten: [
    { id: 'html-a', onderwerp: 'html', concept: 'a', 1: 'basis' },
    { id: 'html-forms', onderwerp: 'html', concept: 'forms', 1: 'gevorderd' },
  ],
};

const tweeNiveaus = {
  niveaus: ['1', '2'],
  onderwerpen: [{ id: 'api', label: 'FastAPI' }],
  concepten: [
    {
      id: 'api-cookies',
      onderwerp: 'api',
      concept: 'Cookies',
      bloom: 'toepassen',
      1: 'expert',
      2: 'gevorderd',
    },
    { id: 'api-routes', onderwerp: 'api', concept: 'meerdere GET-routes', 1: 'basis', 2: 'basis' },
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
    const uit = leerdoelenNaarConfig(tweeNiveaus, { 'api-cookies': detect, 'api-routes': detect });
    expect(uit.tracks).toEqual([
      { id: '1', label: 'Niveau 1 (havo start)' },
      { id: '2', label: 'Niveau 2 (vwo start)' },
    ]);
    expect(uit.concepts[0]).toMatchObject({
      level: { 1: 'expert', 2: 'gevorderd' },
      bloom: 'toepassen',
      label: 'Cookies',
      group: 'Per niveau anders',
    });
    // Overal dezelfde moeilijkheid: die is de groep, zoals bij één niveau.
    expect(uit.concepts[1]).toMatchObject({ level: { 1: 'basis', 2: 'basis' }, group: 'Basis' });
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
