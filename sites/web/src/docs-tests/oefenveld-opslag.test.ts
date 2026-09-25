import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Het werk in een oefenveld bleef niet bewaard: verversen en het was weg.
// Nu staat het in de IndexedDB van de browser (opslag.ts, met eigen tests).
// Deze bronscan bewaakt hoe het veld die opslag gebruikt; dat gedrag hangt
// aan React en de browser, en is in node niet na te spelen.

const lees = (pad: string) => readFileSync(fileURLToPath(new URL(pad, import.meta.url)), 'utf8');

const veld = lees('../components/CodeEditor/CodeEditor.tsx');
const hook = lees('../components/CodeEditor/useOpslag.ts');

describe('het oefenveld bewaart het werk van de leerling', () => {
  it('toont de editor pas als het bewaarde werk er is', () => {
    // CodeMirror neemt een wijziging van buitenaf op in zijn undo-lijst. Kwam
    // het bewaarde werk pas binnen als de editor al stond, dan bracht Ctrl+Z
    // de leerling terug naar de startcode.
    expect(veld).toMatch(/!opslag\.geladen \?/);
  });

  it('schrijft de laatste wijziging weg bij verlaten, ook naar de volgende les', () => {
    expect(hook).toMatch(/addEventListener\('pagehide'/);
    expect(hook).toMatch(/visibilityState === 'hidden'/);
    // De cleanup van het effect: doorklikken in Docusaurus is een unmount.
    expect(hook).toMatch(/removeEventListener\('pagehide', schrijf\);\s*schrijf\(\);/);
  });

  it('onderscheidt velden met dezelfde startcode', () => {
    expect(veld).toMatch(/data-zaad=\{opslag\.zaad\}/);
    expect(hook).toMatch(/querySelectorAll\(`\[data-zaad=/);
  });

  it('Reset wist ook de bewaarde versie', () => {
    expect(veld).toMatch(/opslag\.wis\(\)/);
  });

  it('gebruikt IndexedDB, niet localStorage', () => {
    expect(veld).not.toMatch(/localStorage/);
    expect(hook).not.toMatch(/localStorage/);
  });
});
