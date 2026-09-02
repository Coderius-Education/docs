import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Bewaakt de DVWA-cursus op drie punten die de build zelf niet vangt:
//
// 1. Elke <DvwaLab module level /> in de lessen wijst naar een bestaande
//    config in de modules-registry. Een typefout rendert anders stil de
//    "Module niet gevonden"-fallback terwijl de build groen blijft.
// 2. Elke instap-pagina (de veertien low-lessen en de index) draagt het
//    <Ethiek />-blok — het ethische kader dat sites/dvwa/CLAUDE.md eist.
// 3. De PRIMM-structuur: elke lespagina opent met "## 1. Predict" en de
//    genummerde secties lopen op vanaf 1 zonder gaten.

const HIER = fileURLToPath(new URL('.', import.meta.url));
const DOCS = join(HIER, '..', '..', 'docs', 'dvwa_tutorial');
const MODULES = join(HIER, '..', 'components', 'DvwaLab', 'modules');

type Les = { naam: string; pad: string; inhoud: string };

/** Alle .mdx onder een level-map (low/medium/high/impossible per kwetsbaarheid). */
function lesPaginas(): Les[] {
  const uit: Les[] = [];
  for (const map of readdirSync(DOCS, { withFileTypes: true })) {
    if (!map.isDirectory()) continue;
    for (const bestand of readdirSync(join(DOCS, map.name))) {
      if (!bestand.endsWith('.mdx')) continue;
      const pad = join(DOCS, map.name, bestand);
      uit.push({
        naam: `${map.name}/${bestand}`,
        pad,
        inhoud: readFileSync(pad, 'utf8'),
      });
    }
  }
  return uit;
}

/** De levels die elke module-config aanbiedt: module-key -> Set van levels. */
async function registry(): Promise<Map<string, Set<string>>> {
  const uit = new Map<string, Set<string>>();
  for (const bestand of readdirSync(MODULES)) {
    if (!bestand.endsWith('.js')) continue;
    const mod = await import(join(MODULES, bestand));
    const config = Object.values(mod)[0] as Record<string, unknown>;
    uit.set(bestand.replace(/\.js$/, ''), new Set(Object.keys(config)));
  }
  return uit;
}

const lessen = lesPaginas();

describe('DVWA-cursus', () => {
  it('leest de lessen en de index', () => {
    expect(lessen.length).toBeGreaterThanOrEqual(56);
  });

  it('elke DvwaLab-verwijzing wijst naar een bestaande module/level', async () => {
    const reg = await registry();
    const fouten: string[] = [];
    for (const les of lessen) {
      // Pak de hele tag en lees de attributen los uit, zodat de vololgorde
      // (module vóór level of andersom) de controle niet stil kan omzeilen.
      for (const m of les.inhoud.matchAll(/<DvwaLab\b[\s\S]*?\/>/g)) {
        const tag = m[0];
        const module = tag.match(/\bmodule="([^"]+)"/)?.[1];
        const level = tag.match(/\blevel="([^"]+)"/)?.[1];
        if (!module || !level) {
          fouten.push(`${les.naam}: <DvwaLab> mist module of level`);
        } else if (!reg.has(module)) {
          fouten.push(`${les.naam}: onbekende module "${module}"`);
        } else if (!reg.get(module)?.has(level)) {
          fouten.push(`${les.naam}: module "${module}" heeft geen level "${level}"`);
        }
      }
    }
    expect(fouten).toEqual([]);
  });

  it('elke low-les draagt het ethiek-blok', () => {
    const fouten = lessen
      .filter((l) => l.naam.endsWith('/low.mdx') && !l.inhoud.includes('<Ethiek'))
      .map((l) => l.naam);
    expect(fouten).toEqual([]);
  });

  it('elke low-les draagt een lab-badge (browser/deels/lokaal)', () => {
    const fouten = lessen
      .filter(
        (l) =>
          l.naam.endsWith('/low.mdx') &&
          !/<LabBadge\s+status="(browser|deels|lokaal)"/.test(l.inhoud),
      )
      .map((l) => l.naam);
    expect(fouten).toEqual([]);
  });

  it('de lab-badges op de indexpagina hebben een geldige status', () => {
    const index = readFileSync(join(DOCS, 'index.mdx'), 'utf8');
    const statussen = [...index.matchAll(/<LabBadge\s+status="([^"]*)"/g)].map((m) => m[1]);
    const ongeldig = statussen.filter((st) => !['browser', 'deels', 'lokaal'].includes(st));
    expect(statussen.length).toBeGreaterThanOrEqual(14);
    expect(ongeldig).toEqual([]);
  });

  it('de instap-pagina draagt het ethiek-blok', () => {
    const index = readFileSync(join(DOCS, 'index.mdx'), 'utf8');
    expect(index).toContain('<Ethiek');
  });

  it('elke lespagina opent met "## 1. Predict"', () => {
    const fouten = lessen
      .filter((l) => l.naam !== 'index.mdx' && !/^## 1\. Predict/m.test(l.inhoud))
      .map((l) => l.naam);
    expect(fouten).toEqual([]);
  });

  it('elke low/medium/high-les sluit af met een "Er gaat iets mis"-blok', () => {
    const fouten = lessen
      .filter((l) => /\/(low|medium|high)\.mdx$/.test(l.naam))
      .filter((l) => !/^## \d+\. Er gaat iets mis/m.test(l.inhoud))
      .map((l) => l.naam);
    expect(fouten).toEqual([]);
  });

  it('de genummerde secties lopen op vanaf 1 zonder gaten', () => {
    const fouten: string[] = [];
    for (const les of lessen) {
      if (les.naam === 'index.mdx') continue;
      const nummers = [...les.inhoud.matchAll(/^## (\d+)\. /gm)].map((m) => Number(m[1]));
      for (let i = 0; i < nummers.length; i++) {
        if (nummers[i] !== i + 1) {
          fouten.push(`${les.naam}: sectienummering springt (${nummers.join(', ')})`);
          break;
        }
      }
    }
    expect(fouten).toEqual([]);
  });
});
