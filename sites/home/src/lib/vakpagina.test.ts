import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUBJECTS } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';
import { inleiding } from './vakken';
import { markdownNaarHtml, veiligeHref } from './vakpagina/markdown';
import { standaardDocument } from './vakpagina/standaard';
import { themaCss } from './vakpagina/thema';
import type { Vakpagina } from './vakpagina/types';
import { contrast, valideerVakpagina } from './vakpagina/valideer';

// De vakpagina's: elk bestand moet geldig zijn (anders breekt de build), en
// dezelfde voorbeeldbestanden gaan door de Python-validatie van docs-management
// (backend/tests/fixtures/vakpagina). Zo lopen de twee niet uit elkaar.

const HIER = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = join(HIER, 'vakpagina', '__fixtures__');
const lees = (pad: string) => JSON.parse(readFileSync(pad, 'utf8'));

describe('vakpagina-bestanden', () => {
  it('zijn geldig en horen bij het vak van hun bestandsnaam', () => {
    const map = join(HIER, 'vakpaginas');
    const vakken = SUBJECTS.map((v) => v.id);
    for (const naam of readdirSync(map).filter((n) => n.endsWith('.json'))) {
      const vak = naam.replace(/\.json$/, '');
      expect(vakken).toContain(vak);
      expect(valideerVakpagina(lees(join(map, naam)), vak)).toEqual([]);
    }
  });

  it('de standaardpagina is geldig en houdt kop en inleiding van vroeger', () => {
    for (const vak of SUBJECTS.map((v) => v.id)) {
      expect(valideerVakpagina(standaardDocument(vak), vak)).toEqual([]);
    }
    const [overzicht] = standaardDocument('informatica').blokken;
    expect(overzicht).toMatchObject({
      type: 'Courses',
      props: { automatischeKop: true, filters: true },
    });
    expect(inleiding(['wo'], 1)).toContain('wetenschapsoriëntatie');
  });
});

describe('gedeelde voorbeelden (ook in de Python-validatie)', () => {
  for (const naam of readdirSync(join(FIXTURES, 'geldig'))) {
    it(`geldig: ${naam}`, () => {
      expect(valideerVakpagina(lees(join(FIXTURES, 'geldig', naam)), 'informatica')).toEqual([]);
    });
  }
  for (const naam of readdirSync(join(FIXTURES, 'ongeldig'))) {
    it(`ongeldig: ${naam}`, () => {
      expect(valideerVakpagina(lees(join(FIXTURES, 'ongeldig', naam)), 'informatica')).not.toEqual(
        [],
      );
    });
  }
});

describe('markdown in blokken', () => {
  it('escapet HTML en laat alleen veilige links door', () => {
    expect(markdownNaarHtml('<script>alert(1)</script>')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    );
    expect(markdownNaarHtml('[klik](javascript:alert(1))')).not.toContain('<a');
    expect(markdownNaarHtml('[klik](javascript:void)')).toBe('<p>klik</p>');
    expect(markdownNaarHtml('[x](//evil.example)')).toBe('<p>x</p>');
    expect(markdownNaarHtml('[x](https://a.nl/?q=1&b=2)')).toBe(
      '<p><a href="https://a.nl/?q=1&amp;b=2" target="_blank" rel="noopener noreferrer">x</a></p>',
    );
    expect(markdownNaarHtml('[x](/docent" onmouseover="alert(1))')).not.toContain('onmouseover="');
  });

  it('kent alinea’s, lijstjes, vet, schuin en code', () => {
    expect(markdownNaarHtml('**vet** en *schuin*\nregel 2\n\n- a\n- `b`')).toBe(
      '<p><strong>vet</strong> en <em>schuin</em><br>regel 2</p><ul><li>a</li><li><code>b</code></li></ul>',
    );
    expect(markdownNaarHtml('[docenten](/docent)')).toBe('<p><a href="/docent">docenten</a></p>');
  });

  it('veiligeHref', () => {
    expect(veiligeHref('mailto:a@b.nl')).toBe('mailto:a@b.nl');
    expect(veiligeHref('/\t/evil')).toBeNull();
    expect(veiligeHref('http://onveilig.nl')).toBeNull();
  });
});

describe('thema', () => {
  it('rekent contrast zoals WCAG', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#007e57', '#ffffff')).toBeGreaterThan(4.5);
  });

  it('maakt CSS per vak, alleen met gevalideerde waarden', () => {
    const doc = lees(join(FIXTURES, 'geldig', 'vol.json')) as Vakpagina;
    const css = themaCss({ informatica: doc });
    expect(css).toContain(
      'html[data-vak="informatica"]{--primary:#1d4ed8;--ring:#1d4ed8;--primary-foreground:#ffffff;}',
    );
    expect(css).toContain('html[data-vak="informatica"].dark{--primary:#93c5fd;');
    expect(css).toContain('.vak-logo-informatica-donker{display:block}');
    expect(themaCss({ 'x"]{}*{': doc })).toBe('');
  });
});
