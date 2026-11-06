import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De Materiaal-sectie van een onderdeel was een genummerde lijst met daaronder
// elke foto op volle breedte: de LED 600 pixels hoog, de multiplexer 900, en
// op het OLED-scherm was de sectie bijna twee schermen lang. Nu staat elk ding
// op een kaart met een kleine foto (<Onderdelenlijst>), die je groot kunt
// klikken. Deze test eist die vorm, en dat elke foto bestaat en een alt-tekst
// heeft: de stijlcontrole kijkt alleen naar markdown-plaatjes. Wat de
// component tekent, staat in components/Onderdelenlijst/Onderdelenlijst.test.tsx.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const ONDERDELEN = join(SITE, 'docs/onderdelen');

/** De tekst van de Materiaal-sectie, met een geïmporteerde partial erin geplakt. */
function materiaal(pagina: string): string | undefined {
  const tekst = readFileSync(join(ONDERDELEN, pagina), 'utf8');
  const sectie = tekst.match(/^## Materiaal\n([\s\S]*?)(?=^## )/m)?.[1];
  if (sectie === undefined) return undefined;
  const partial = tekst.match(
    /^import Materiaal from '@site\/(docs\/onderdelen\/_delen\/[^']+)'/m,
  )?.[1];
  return /<Materiaal \/>/.test(sectie) && partial
    ? sectie + readFileSync(join(SITE, partial), 'utf8')
    : sectie;
}

const PAGINAS = readdirSync(ONDERDELEN)
  .filter((f) => /\.mdx?$/.test(f))
  .map((f) => ({ pagina: f, sectie: materiaal(f) }))
  .filter((p): p is { pagina: string; sectie: string } => p.sectie !== undefined);

const attr = (tag: string, naam: string) => tag.match(new RegExp(`\\b${naam}="([^"]*)"`))?.[1];

describe('de materiaallijst van een onderdeel', () => {
  it('er zijn onderdelen met een Materiaal-sectie', () => {
    expect(PAGINAS.length).toBeGreaterThan(12);
  });

  it('elke Materiaal-sectie is een Onderdelenlijst, zonder losse foto op volle breedte', () => {
    const fout: string[] = [];
    for (const { pagina, sectie } of PAGINAS) {
      if (!sectie.includes('<Onderdelenlijst>')) fout.push(`${pagina}: geen <Onderdelenlijst>`);
      if (/!\[/.test(sectie)) fout.push(`${pagina}: een markdown-plaatje in Materiaal`);
    }
    expect(fout).toEqual([]);
  });

  it('elk onderdeel heeft een naam, en elke foto bestaat en heeft een alt-tekst', () => {
    const fout: string[] = [];
    for (const { pagina, sectie } of PAGINAS)
      for (const [tag] of sectie.matchAll(/<Onderdeel\b[^>]*>/g)) {
        if (!attr(tag, 'naam')) fout.push(`${pagina}: ${tag} zonder naam`);
        const foto = attr(tag, 'foto');
        if (foto === undefined) continue;
        if (!existsSync(join(ONDERDELEN, 'img', foto)))
          fout.push(`${pagina}: ${foto} bestaat niet`);
        if ((attr(tag, 'alt') ?? '').length < 10) fout.push(`${pagina}: ${foto} zonder alt-tekst`);
      }
    expect(fout).toEqual([]);
  });
});
