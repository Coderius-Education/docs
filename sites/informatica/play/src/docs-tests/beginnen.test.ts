import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// "Wanneer kan ik beginnen?" zegt per Python-concept vanaf welke les play het
// gebruikt. Die tabel liep achter: hij noemde def vanaf 4.1 terwijl 2.3 al
// een functie heeft (de sensor met @zone.when_touching), if vanaf 4.3
// terwijl 4.1 al if key == 'up' gebruikt, en de f-string helemaal niet. De
// les in de tabel mag niet later liggen dan de eerste les in de volgorde van
// de sidebar waarvan de code in de hoofdtekst (buiten een uitklapblok) het
// concept gebruikt.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const PAGINA = join(DOCS, 'eerste-keer-python', 'wanneer_beginnen.md');

const CONCEPTEN: { rij: RegExp; code: RegExp }[] = [
  { rij: /f-string/, code: /\bf["'][^"'\n]*\{/ },
  { rij: /`if` en `else`/, code: /(?<![\w#])if\s+.+:/ },
  { rij: /`def`/, code: /^\s*(async\s+)?def\s/m },
  { rij: /lijsten/, code: /=\s*\[/ },
];

const positie = (map: string) => {
  const cat = join(DOCS, map, '_category_.json');
  return existsSync(cat) ? Number(JSON.parse(readFileSync(cat, 'utf8')).position) : 0;
};
const zijPositie = (tekst: string) => Number(tekst.match(/^sidebar_position:\s*(\d+)/m)?.[1] ?? 0);

/** Elke les met een plek in de cursus: [hoofdstuk, plek, map/naam, tekst]. */
const LESSEN = readdirSync(DOCS, { withFileTypes: true })
  .filter((e) => e.isDirectory() && positie(e.name) > 0)
  .filter(
    (e) =>
      !['eerste-keer-python', 'installatie', 'voor-de-docent', 'jouw_project'].includes(e.name),
  )
  .flatMap((e) =>
    readdirSync(join(DOCS, e.name))
      .filter((n) => /\.mdx?$/.test(n))
      .map((n) => {
        const tekst = readFileSync(join(DOCS, e.name, n), 'utf8');
        const naam = n.replace(/^\d+_/, '').replace(/\.mdx?$/, '');
        return { volgorde: [positie(e.name), zijPositie(tekst)], id: `${e.name}/${naam}`, tekst };
      }),
  )
  .sort((a, b) => a.volgorde[0] - b.volgorde[0] || a.volgorde[1] - b.volgorde[1]);

const hoofdtekstCode = (tekst: string) => {
  const zonder = tekst.replace(/<details>[\s\S]*?<\/details>/g, '');
  return [
    ...zonder.matchAll(/<PygbagRunner code=\{`([\s\S]*?)`\}/g),
    ...zonder.matchAll(/```python[^\n]*\n([\s\S]*?)```/g),
  ]
    .map((m) => m[1])
    .join('\n');
};

describe('Wanneer kan ik beginnen?', () => {
  it('noemt elk concept vanaf een les die niet later ligt dan het eerste gebruik', () => {
    const regels = readFileSync(PAGINA, 'utf8').split('\n');
    const plek = (id: string) => LESSEN.findIndex((l) => l.id === id);
    const fout: string[] = [];
    for (const { rij, code } of CONCEPTEN) {
      const regel = regels.find((r) => r.startsWith('|') && rij.test(r));
      // Een les die heet als zijn map (acties/acties) is het adres van de map:
      // site:play/docs/acties. Een link naar acties/acties brak de build.
      const pad = regel?.match(/site:play\/docs\/([\w/-]+)/)?.[1];
      const les = pad && (pad.includes('/') ? pad : `${pad}/${pad}`);
      if (!regel || !les) {
        fout.push(`geen rij voor ${rij}`);
        continue;
      }
      const eerste = LESSEN.find((l) => code.test(hoofdtekstCode(l.tekst)));
      if (eerste && plek(les) > plek(eerste.id))
        fout.push(`${rij}: tabel zegt ${les}, maar ${eerste.id} gebruikt het al`);
    }
    expect(fout).toEqual([]);
  });
});
