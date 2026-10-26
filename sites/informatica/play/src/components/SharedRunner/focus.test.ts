import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildSharedRunnerSrcDoc } from '../CodeRunner/engine';

// Na een klik op ▶ bleef de focus in de pagina. Een pijltje of een spatie
// scrolde dan de pagina, en het spel kreeg de toets niet. Dat is browsergedrag,
// dus node kan het niet naspelen; met de hand gecontroleerd in Chromium (zie de
// commit). Deze tests houden de code vast die het regelt.

const index = readFileSync(new URL('./index.js', import.meta.url), 'utf8');

/** De tekst van een functie in index.js, tot de volgende functie op het hoogste niveau. */
function functie(naam: string): string {
  const begin = index.search(new RegExp(`^(export )?function ${naam}\\(`, 'm'));
  expect(begin).toBeGreaterThanOrEqual(0);
  const rest = index.slice(begin + 1);
  const eind = rest.search(/^(export )?function /m);
  return eind < 0 ? rest : rest.slice(0, eind);
}

describe('de speeltuin krijgt de toetsen', () => {
  it('een run geeft de iframe de focus', () => {
    expect(functie('requestRun')).toMatch(/iframe\.focus\(\)/);
  });

  // Een element met focus hoort niet aria-hidden te zijn: een schermlezer ziet
  // het dan niet, terwijl de toetsen er wel heen gaan.
  it('de iframe is alleen aria-hidden als hij verborgen is', () => {
    expect(functie('positionOverSlot')).toMatch(/removeAttribute\('aria-hidden'\)/);
    expect(functie('hideIframe')).toMatch(/setAttribute\('aria-hidden', 'true'\)/);
  });

  it('in de iframe scrollen pijltjes de pagina niet, maar spatie blijft voor tekstvelden', () => {
    const srcdoc = buildSharedRunnerSrcDoc(['import play']);
    const lijst = srcdoc.match(/const SCROLTOETSEN = \[([^\]]*)\]/)?.[1] ?? '';
    for (const toets of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageDown']) {
      expect(lijst).toContain(`'${toets}'`);
    }
    expect(lijst).not.toMatch(/' '|Space/);
    expect(srcdoc).toMatch(/addEventListener\('keydown'[\s\S]*?preventDefault\(\)/);
  });
});
