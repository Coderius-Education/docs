import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Run zette de srcDoc opnieuw, maar met ongewijzigde code was dat dezelfde
// tekst, en dan laadde React de iframe niet opnieuw. In variabelen klikte een
// leerling drie keer, drukte op Run, en zag de teller op 3 blijven staan,
// terwijl de les vraagt waarom hij weer op 0 staat. Puur browsergedrag; met de
// hand gecontroleerd in headless Chromium op de gebouwde site. Deze test houdt
// de regel vast die het oplost: Run vervangt de iframe altijd (de key versie).

const bron = readFileSync(
  fileURLToPath(new URL('../components/CodeEditor/CodeEditor.tsx', import.meta.url)),
  'utf8',
);

describe('Run begint het voorbeeld altijd opnieuw', () => {
  it('ververst de iframe, ook als de code niet veranderde', () => {
    const run =
      bron.match(/const handleRun = useCallback\(\(\) => \{([\s\S]*?)\n {2}\}, \[/)?.[1] ?? '';
    expect(run).toContain('setSrcDoc(');
    expect(run).toContain('herlaadEigenPagina()');
  });

  it('herladen vervangt de iframe via zijn key', () => {
    expect(bron).toMatch(/const herlaadEigenPagina = useCallback\(\(\) => \{[\s\S]*?setVersie\(/);
    expect(bron).toMatch(/versie=\{versie\}/);
  });
});
