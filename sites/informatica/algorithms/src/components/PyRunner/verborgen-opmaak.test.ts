import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// De code die al klaarstaat stond eerst in een uitklapblok onder de editor.
// In een les-tabblad kreeg dat blok de opmaak van een tip (77 pixels), en ook
// zonder die opmaak kostte de regel 34 pixels: zestien schermen Aan de slag
// van de route machine learning waren daardoor op 1280×720 te lang. Nu is
// het een knop in de werkbalk, op de plek van het label Python. Of het in de
// browser past, meet scripts/meet-les-tabs.mjs.

const bron = readFileSync(new URL('./PyRunnerImpl.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./styles.module.css', import.meta.url), 'utf8');

describe('de code die al klaarstaat', () => {
  it('is geen uitklapblok onder de editor', () => {
    expect(bron).not.toMatch(/<details[\s\S]{0,80}verborgen/);
    expect(bron).not.toContain('<summary>');
  });

  it('opent met een knop in de werkbalk, die zegt of hij open is', () => {
    const balk = bron.slice(
      bron.indexOf('className={styles.toolbar}'),
      bron.indexOf('className={styles.codeVak}'),
    );
    expect(balk).toContain('Klaargezette code');
    expect(balk).toContain('aria-expanded={toonKlaar}');
    expect(balk).toContain('aria-controls={klaarId}');
  });

  it('een smalle werkbalk breekt af in plaats van de knoppen te verbergen', () => {
    const regel = css.match(/\.toolbar \{([^}]*)\}/)?.[1] ?? '';
    expect(regel).toMatch(/flex-wrap: wrap;/);
  });
});
