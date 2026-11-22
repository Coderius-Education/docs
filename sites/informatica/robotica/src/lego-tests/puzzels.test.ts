import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { gebreken, puzzelsIn } from '../../../../../packages/shared/components/Puzzel/controle';

// Twee lessen van de Lego-auto hebben een tabblad Puzzel: de regels van een
// if-blok staan door elkaar, en de leerling zet ze in de goede volgorde
// (<Puzzel>, packages/shared/components/Puzzel; zie vakdidactiek,
// Parsons-puzzels). Daar is de volgorde het nieuwe: welke tak staat
// bovenaan. Een puzzel keurt één volgorde goed, dus de code mag er maar één
// hebben.

const MAP = fileURLToPath(new URL('../../lego_auto', import.meta.url));

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) => {
    const pad = join(map, e.name);
    if (e.isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(e.name) ? [pad] : [];
  });
}

const lessen = bestanden(MAP)
  .map((pad) => ({ naam: relative(MAP, pad), inhoud: readFileSync(pad, 'utf8') }))
  .filter((les) => les.inhoud.includes('<Puzzel'));
const puzzels = lessen.flatMap((les) =>
  puzzelsIn(les.inhoud).map((puzzel) => ({ ...les, puzzel })),
);

describe('puzzels in de Lego-auto', () => {
  it('staan in een paar lessen, een per les', () => {
    expect(lessen.length).toBeGreaterThanOrEqual(2);
    expect(lessen.length).toBeLessThanOrEqual(4);
    expect(puzzels).toHaveLength(lessen.length);
  });

  it('hebben de vorm van een puzzel, in Python', () => {
    for (const { naam, puzzel } of puzzels) {
      expect(gebreken(puzzel), naam).toEqual([]);
      // Met `taal="python"` telt de inspringing mee: een print in een tak
      // is een andere regel dan dezelfde print erbuiten.
      expect(puzzel.taal, naam).toBe('python');
    }
  });

  it('staan vóór de stap waarin de leerling het blok zelf schrijft', () => {
    for (const { naam, inhoud, puzzel } of puzzels) {
      const plek = inhoud.indexOf('<Puzzel');
      expect(puzzel.kopNa, naam).toMatch(/^Stap \d+:/);
      for (const later of ['\n## Opdracht', '\n## Er gaat iets mis', '\n## Je script'])
        expect(inhoud.indexOf(later), `${naam}: ${later.trim()}`).toBeGreaterThan(plek);
    }
  });

  it('hebben één goede volgorde', () => {
    for (const { naam, puzzel } of puzzels) {
      const code = puzzel.code ?? '';
      // `motor_a.forward(…)` en `motor_b.forward(…)` onder elkaar mogen in
      // elke volgorde. Een tak zegt daarom met één print wat de robot doet.
      expect(code, naam).not.toMatch(/motor_|oled\./);
      // Wat de lessen van de Lego-auto niet schrijven, staat ook niet in een
      // puzzel.
      expect(code, naam).not.toMatch(/^\s*(else:|for |def )/m);
      // Geen twee regels achter elkaar op dezelfde diepte die allebei iets
      // doen: die twee kunnen dan om.
      const regels = code.split('\n');
      const doet = (r: string) => !/^\s*(if|elif|while)\b/.test(r);
      const diepte = (r: string) => r.length - r.trimStart().length;
      regels.forEach((regel, i) => {
        const vorige = regels[i - 1];
        if (!vorige || !doet(regel) || !doet(vorige)) return;
        expect(diepte(regel) === diepte(vorige), `${naam}: ${vorige} | ${regel}`).toBe(false);
      });
    }
  });
});
