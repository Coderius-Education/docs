import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Het werk in een oefenveld bleef niet bewaard: verversen en het was weg.
// Nu staat het in de IndexedDB van de browser. De opslag en de hook staan in
// packages/shared/oefenveld, met eigen tests (ook wat er bij herladen en op
// een trage computer gebeurt). Deze bronscan bewaakt hoe het veld van web ze
// gebruikt.

const lees = (pad: string) => readFileSync(fileURLToPath(new URL(pad, import.meta.url)), 'utf8');

const veld = lees('../components/CodeEditor/CodeEditor.tsx');
const opslag = lees('../components/CodeEditor/opslag.ts');

describe('het oefenveld bewaart het werk van de leerling', () => {
  it('toont de editor pas als het bewaarde werk er is', () => {
    // CodeMirror neemt een wijziging van buitenaf op in zijn undo-lijst. Kwam
    // het bewaarde werk pas binnen als de editor al stond, dan bracht Ctrl+Z
    // de leerling terug naar de startcode.
    expect(veld).toMatch(/!opslag\.geladen \?/);
  });

  it('gebruikt de gedeelde hook, met de opslag van web', () => {
    expect(veld).toMatch(/from '@coderius\/shared\/oefenveld\/useOpslag'/);
    expect(veld).toMatch(/useOpslag\(\{\s*opslag: veldOpslag,/);
  });

  it('onderscheidt velden met dezelfde startcode', () => {
    expect(veld).toMatch(/data-zaad=\{opslag\.zaad\}/);
  });

  it('Reset wist ook de bewaarde versie', () => {
    expect(veld).toMatch(/opslag\.wis\(\)/);
  });

  it('de database en de bestanden zijn die van altijd', () => {
    // Een andere naam of een andere volgorde, en het werk van elke leerling
    // is onvindbaar (packages/shared/oefenveld/opslag.test.ts pint de rest).
    expect(opslag).toMatch(/site: 'web',\s*naam: 'oefenvelden',\s*delen: \['html', 'css', 'js'\]/);
  });
});
