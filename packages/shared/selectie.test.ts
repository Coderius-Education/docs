import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De code-editors zijn twee lagen: een gekleurde <pre> met de gehighlighte
// code, en daarbovenop een textarea waarvan de tekst doorzichtig is. Alleen de
// cursor en de selectie van die textarea zijn zichtbaar.
//
// Daardoor is de selectiekleur geen smaakkwestie. Zet je er een dekkende kleur
// neer, dan schildert de browser die over de code eronder en ziet de leerling
// bij het selecteren alleen nog een grijs blok. Dat gebeurde op de
// algoritmes-site met `var(--ifm-color-emphasis-300)`: in de browser
// `rgb(218, 221, 225)`, zonder alpha.
//
// Deze test loopt alle CSS-modules van de monorepo langs en eist: een selector
// die zijn tekst doorzichtig maakt, heeft een ::selection met een kleur waar
// je doorheen kijkt.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OVERSLAAN = new Set(['node_modules', 'build', '.docusaurus', '.git', 'extracted']);

function cssModules(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((entry) => {
    if (OVERSLAAN.has(entry.name)) return [];
    const pad = join(map, entry.name);
    if (entry.isDirectory()) return cssModules(pad);
    return entry.name.endsWith('.module.css') ? [pad] : [];
  });
}

/** De selectors in dit bestand die hun eigen tekst doorzichtig maken. */
function doorzichtigeTekst(css: string): string[] {
  const uit: string[] = [];
  for (const m of css.matchAll(/(\.[\w-]+)\s*\{([^}]*)\}/g)) {
    if (/(?:^|[\s;])color:\s*transparent\s*;/.test(m[2])) uit.push(m[1]);
  }
  return uit;
}

/** De achtergrond uit de ::selection-regel van een selector, als die er is. */
function selectieAchtergrond(css: string, selector: string): string | null {
  const re = new RegExp(`\\${selector}::selection\\s*\\{([^}]*)\\}`);
  const blok = css.match(re);
  if (!blok) return null;
  return blok[1].match(/background(?:-color)?:\s*([^;]+);/)?.[1].trim() ?? null;
}

/** Kun je door deze kleur heen kijken? */
function doorzichtig(kleur: string): boolean {
  if (kleur === 'transparent') return true;
  const rgba = kleur.match(/rgba?\([^)]*?,\s*([\d.]+)\s*\)/);
  if (rgba) return Number(rgba[1]) < 1;
  // color-mix(... , transparent) mengt met doorzichtig en telt dus mee.
  return /color-mix\([^)]*transparent[^)]*\)/.test(kleur);
}

describe('de selectie in een overlay-editor', () => {
  const bestanden = cssModules(ROOT).filter(
    (pad) => doorzichtigeTekst(readFileSync(pad, 'utf8')).length > 0,
  );

  it('vindt de editors met doorzichtige tekst', () => {
    expect(bestanden.length).toBeGreaterThan(1);
  });

  it.each(bestanden.map((pad) => pad.slice(ROOT.length)))(
    '%s laat de code door de selectie heen zien',
    (kort) => {
      const css = readFileSync(join(ROOT, kort), 'utf8');
      for (const selector of doorzichtigeTekst(css)) {
        const kleur = selectieAchtergrond(css, selector);
        expect(kleur, `${selector} heeft geen ::selection-regel`).not.toBeNull();
        expect(doorzichtig(kleur as string), `${selector}: ${kleur} is dekkend`).toBe(true);
      }
    },
  );
});
