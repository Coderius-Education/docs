import { describe, expect, it } from 'vitest';
import { dedent, fragmentenUit } from './extract';

// De extractie bepaalt wat CI compileert. Te grof en de check staat vol valse
// alarmen; te fijn en een kapot voorbeeld glipt erdoor.

function pagina(body: string): string {
  return `---\nslug: /voorbeeld\n---\n\n${body}`;
}

describe('Python uit de lespagina´s halen', () => {
  it('neemt een codeblok mee, met kop en regelnummer', () => {
    const { fragmenten } = fragmentenUit(
      'les.md',
      pagina('## Stap 1\n\n```python\nprint("hoi")\n```'),
    );
    expect(fragmenten).toHaveLength(1);
    expect(fragmenten[0].kop).toBe('Stap 1');
    expect(fragmenten[0].code).toBe('print("hoi")\n');
  });

  it('haalt gemeenschappelijke inspringing weg (blok in een lijst)', () => {
    expect(dedent('    a = 1\n    if a:\n        print(a)')).toBe('a = 1\nif a:\n    print(a)');
    // maar echte inspringing binnen het blok blijft staan
    expect(dedent('if x:\n    print(x)')).toBe('if x:\n    print(x)');
  });

  it('slaat een blok over dat de bron als niet-compileerbaar markeert', () => {
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina(
        '{/* niet-compileren: bewust kapot, dat is de opdracht */}\n\n' +
          '```python\nwhile True\n    pass\n```',
      ),
    );
    expect(fragmenten).toHaveLength(0);
    expect(overgeslagen[0].reden).toBe('bewust niet-compileerbaar (marker)');
  });

  it('slaat REPL-transcripten over', () => {
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina('```python\n>>> 1 + 1\n2\n```'),
    );
    expect(fragmenten).toHaveLength(0);
    expect(overgeslagen[0].reden).toBe('REPL-transcript');
  });

  it('geeft elk blok een naam die niet van het absolute pad afhangt', () => {
    const zonderSlug = '# Cheatsheet\n\n```python\nx = 1\n```';
    const a = fragmentenUit('/ergens/Tutorial-x/cheatsheet.md', zonderSlug);
    const b = fragmentenUit('/heel/ander/pad/Tutorial-x/cheatsheet.md', zonderSlug);
    expect(a.fragmenten[0].naam).toBe(b.fragmenten[0].naam);
    expect(a.fragmenten[0].naam).toBe('Tutorial_x_cheatsheet_1');
  });

  it('geeft gelijknamige bestanden in verschillende mappen verschillende namen', () => {
    const zonderSlug = '```python\nx = 1\n```';
    const a = fragmentenUit('/docs/Tutorial-Dcmotor/4_code.md', zonderSlug);
    const b = fragmentenUit('/docs/Tutorial-lampje/4_code.md', zonderSlug);
    expect(a.fragmenten[0].naam).not.toBe(b.fragmenten[0].naam);
  });

  it('laat de marker niet doorlekken naar het volgende blok', () => {
    // Het FOUT/GOED-patroon uit de schrijfgids: een kort kapot blok direct
    // gevolgd door het gecorrigeerde blok. Alleen het eerste mag overslaan.
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina(
        '{/* niet-compileren: bewust kapot */}\n\n' +
          '```python\nwhile True\n```\n\n' +
          '```python\nwhile True:\n    pass\n```',
      ),
    );
    expect(overgeslagen).toHaveLength(1);
    expect(fragmenten).toHaveLength(1);
    expect(fragmenten[0].code).toBe('while True:\n    pass\n');
  });

  it('marker blijft werken met veel tekst tussen marker en blok', () => {
    const veelProza = 'Uitleg. '.repeat(50);
    const { fragmenten, overgeslagen } = fragmentenUit(
      'les.md',
      pagina(
        `{/* niet-compileren: bewust kapot */}\n\n${veelProza}\n\n\`\`\`python\nwhile True\n\`\`\``,
      ),
    );
    expect(fragmenten).toHaveLength(0);
    expect(overgeslagen).toHaveLength(1);
  });

  it('matcht alleen python-fences, geen taalloze output-blokken', () => {
    const { fragmenten } = fragmentenUit('les.md', pagina('```\ngeen code\n```'));
    expect(fragmenten).toHaveLength(0);
  });
});
