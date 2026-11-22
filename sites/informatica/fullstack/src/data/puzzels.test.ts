import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { gebreken, puzzelsIn } from '../../../../../packages/shared/components/Puzzel/controle';

// Doorsturen na opslaan heeft een tabblad Puzzel: de regels van een endpoint
// dat een formulier verwerkt staan door elkaar (<Puzzel>,
// packages/shared/components/Puzzel; zie vakdidactiek, Parsons-puzzels).
// Daar is de volgorde het nieuwe: eerst opslaan, dan commit, dan doorsturen.
// In de andere lessen komt er een endpoint of een regel bij, en is de
// volgorde niet waar het om gaat; de cursus heeft er dus maar een paar.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    const pad = join(map, e.name);
    if (e.isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(e.name) ? [pad] : [];
  });
}

const alle = bestanden(DOCS).map((pad) => ({
  naam: relative(DOCS, pad),
  inhoud: readFileSync(pad, 'utf8'),
}));
const lessen = alle.filter((les) => les.inhoud.includes('<Puzzel'));
const puzzels = lessen.flatMap((les) =>
  puzzelsIn(les.inhoud).map((puzzel) => ({ ...les, puzzel })),
);

const regelsVan = (code: string) =>
  code
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

describe('puzzels in fullstack', () => {
  it('staan in een paar lessen, een per les', () => {
    expect(lessen.map((l) => l.naam)).toContain('FastAPI/berichten-opslaan/redirect.mdx');
    expect(lessen.length).toBeLessThanOrEqual(3);
    expect(puzzels).toHaveLength(lessen.length);
  });

  it('hebben de vorm van een puzzel, in Python', () => {
    for (const { naam, puzzel } of puzzels) {
      expect(gebreken(puzzel), naam).toEqual([]);
      expect(puzzel.taal, naam).toBe('python');
    }
  });

  it('staan na de uitleg en vóór de opdrachten', () => {
    for (const { naam, puzzel } of puzzels) expect(puzzel.kopNa, naam).toBe('Opdrachten');
  });

  it('zijn een eigen endpoint, geen kopie van de les', () => {
    for (const { naam, inhoud, puzzel } of puzzels) {
      const regels = regelsVan(puzzel.code ?? '');
      // Een eigen pad: een leerling die de puzzel overtypt, krijgt geen
      // tweede endpoint op een pad dat de cursus al heeft (routes.test.ts
      // leest alleen codeblokken).
      const pad = /@app\.(?:get|post)\("([^"]+)"\)/.exec(regels[0])?.[1];
      expect(pad, naam).toBeDefined();
      for (const les of alle)
        for (const blok of les.inhoud.matchAll(/```python[^\n]*\n([\s\S]*?)```/g))
          expect(blok[1].includes(`("${pad}")`), `${naam}: ${pad} staat ook in ${les.naam}`).toBe(
            false,
          );
      // Minder dan de helft van de regels staat letterlijk in een codeblok
      // van de les.
      for (const blok of inhoud.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)) {
        const daar = new Set(regelsVan(blok[1]));
        const gedeeld = regels.filter((r) => daar.has(r));
        expect(gedeeld.length * 2, `${naam}: deelt ${gedeeld.join(' | ')}`).toBeLessThan(
          regels.length,
        );
      }
    }
  });
});
