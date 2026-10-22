import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UITLEG, bestandInfo } from './logica';

describe('bestandInfo', () => {
  it('main.py en elk ander .py-bestand draaien op de server', () => {
    expect(bestandInfo('main.py')).toEqual({
      plek: 'server',
      taal: 'python',
      uitleg: UITLEG.server,
    });
    expect(bestandInfo('bekijk_db.py').plek).toBe('server');
  });

  it('een template vult de server in, en de browser toont hem', () => {
    expect(bestandInfo('templates/berichten.html')).toMatchObject({
      plek: 'server-browser',
      taal: 'jinja',
    });
  });

  it('wat in static/ staat, gaat zoals het is naar de browser', () => {
    expect(bestandInfo('static/pages/home.html')).toMatchObject({ plek: 'browser', taal: 'html' });
    expect(bestandInfo('static/css/style.css')).toMatchObject({ plek: 'browser', taal: 'css' });
    expect(bestandInfo('static/js/app.js')).toMatchObject({ plek: 'browser', taal: 'js' });
  });

  it('zonder pad is het het antwoord dat de browser krijgt', () => {
    expect(bestandInfo(undefined).plek).toBe('antwoord');
  });

  it('een pad dat nergens past, is een fout in de les', () => {
    expect(() => bestandInfo('home.html')).toThrow(/static\/ of templates\//);
  });
});

describe('de stijl van het label', () => {
  it('trekt het codeblok niet over zich heen', () => {
    // Een negatieve ondermarge schoof het codeblok over het label, en dan
    // bleef van het pad maar een halve regel zichtbaar.
    const css = readFileSync(new URL('./styles.module.css', import.meta.url), 'utf8');
    const marge = css.match(/\.bestand \{[^}]*\bmargin:\s*([^;]+);/)?.[1] ?? '';
    expect(marge).not.toBe('');
    expect(marge).not.toMatch(/-/);
  });
});
