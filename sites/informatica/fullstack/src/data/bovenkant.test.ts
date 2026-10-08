import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Een les toont vaak alleen de bovenkant van main.py: de imports en
// `app = FastAPI()`. In HTML in bestanden stond daar
// `from fastapi.responses import FileResponse`, zonder de HTMLResponse die
// /pagina en /styled uit de vorige les nog gebruikten. Wie de bovenkant
// overnam, kreeg een NameError, en de browser bleef laden zonder foutpagina.
// Deze test eist dat elke naam die de stand van de vorige les uit een module
// importeert, ook in zo'n bovenkant staat.
//
// Daarnaast de Run-opdrachten in de eerste twee hoofdstukken: die herhaalden
// wat de hoofdtekst al liet doen ("start de server en kijk of het werkt"), met
// niets om te controleren. Nu stelt elke Run een vraag.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const categorieen = sidebars.apiSidebar as unknown as { label: string; items: Item[] }[];
const lessen = plat(sidebars.apiSidebar as unknown as Item[]);
const tekst = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');

const STAND = /<summary>Zo ziet je `main\.py` er nu uit<\/summary>[\s\S]*?```python\n([\s\S]*?)```/;
const imports = (code: string) => {
  const per = new Map<string, Set<string>>();
  for (const m of code.matchAll(/^from ([\w.]+) import ([\w, ]+)$/gm))
    per.set(m[1], new Set(m[2].split(',').map((n) => n.trim())));
  return per;
};

describe('de bovenkant van main.py', () => {
  it('neemt elke import uit de stand van de vorige les over', () => {
    let vorige: Map<string, Set<string>> | undefined;
    const fout: string[] = [];
    for (const id of lessen) {
      const bron = tekst(id);
      const hoofd = bron.split(/\n## Opdrachten\n/)[0].replace(/<details>[\s\S]*?<\/details>/g, '');
      for (const blok of hoofd.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)) {
        if (!vorige || !/^app = FastAPI\(\)$/m.test(blok[1])) continue;
        const hier = imports(blok[1]);
        for (const [module, namen] of vorige) {
          if (!hier.has(module)) continue;
          for (const naam of namen)
            if (!hier.get(module)?.has(naam)) fout.push(`${id}: ${module} mist ${naam}`);
        }
      }
      const stand = bron.match(STAND);
      if (stand) vorige = imports(stand[1]);
    }
    expect(fout).toEqual([]);
  });
});

describe('Run-opdrachten in de eerste twee hoofdstukken', () => {
  const vroeg = categorieen
    .filter((c) => c.label === 'Je eerste server' || c.label === "HTML-pagina's")
    .flatMap((c) => plat(c.items));

  it('vinden de lessen', () => {
    expect(vroeg).toContain('FastAPI/html/html_bestanden');
  });

  it('elke Run stelt een vraag en zegt niet "start de server"', () => {
    const fout = vroeg.flatMap((id) =>
      [...tekst(id).matchAll(/### Opdracht \d+: Run\n\n([\s\S]*?)(?=\n### |\n## |$)/g)]
        .filter((m) => !m[1].includes('?') || /start de server/i.test(m[1]))
        .map(() => id),
    );
    expect(fout).toEqual([]);
  });
});
