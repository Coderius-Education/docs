import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NIET_COMPILEREN } from '@coderius/shared/codeblokken';
import { GROEPEN, type Lesstof, type Stuk, constructiesIn } from './buitenLesstof';

// Wat de lessen behandelen: elke herkende constructie in de code van de
// lessen en de cheatsheet. Berekend bij het bouwen (lesstof-plugin.ts), dus
// een les die iets nieuws gebruikt haalt het vanzelf van de lijst buiten de
// lesstof. Eerst stond de lijst als bestand in de repo, met een test die hem
// naliep; dan viel CI om bij elke lesbewerking in docs-management, en een
// docent kan daar het commando om hem opnieuw te maken niet draaien.
//
// Alleen voor node (de plugin en de tests): leest de lessen van schijf.

/** De bronnen van de lesstof, vanaf de map van de site. */
export const LESSTOF_BRONNEN = ['docs', 'src/pages/cheatsheet.mdx'];

/**
 * Wat de dev-server in de gaten houdt: een map met alles erin, een los
 * bestand als zichzelf (een glob achter een bestandsnaam vindt niets).
 */
export function lesstofWatchPaden(siteDir: string): string[] {
  return LESSTOF_BRONNEN.map((b) =>
    /\.mdx?$/.test(b) ? join(siteDir, b) : join(siteDir, b, '**/*.{md,mdx}'),
  );
}

function bestanden(pad: string): string[] {
  if (!statSync(pad).isDirectory()) return [pad];
  return readdirSync(pad).flatMap((naam) => bestanden(join(pad, naam)));
}

/** De code op een lespagina: codeblokken en startcode in MDX-exports. */
export function stukkenUit(bron: string): Stuk[] {
  const stukken: Stuk[] = [];
  let vorigEind = 0;
  for (const m of bron.matchAll(/```(html|css|js|javascript)\b[^\n]*\n([\s\S]*?)```/g)) {
    const begin = m.index ?? 0;
    const ervoor = bron.slice(vorigEind, begin);
    vorigEind = begin + m[0].length;
    // Een fout-voorbeeld ("getElementByID met een hoofdletter D") is geen
    // lesstof. Herkend aan de marker die ook de compileercheck gebruikt, of
    // aan het blok erna: de foutmelding van de browser.
    if (ervoor.includes(NIET_COMPILEREN)) continue;
    const erna = bron.slice(vorigEind);
    if (/^\s*```[^\n]*\r?\n[^`]*?(?:fout|error)/i.test(erna)) continue;
    stukken.push({ soort: m[1] === 'javascript' ? 'js' : (m[1] as Stuk['soort']), tekst: m[2] });
  }
  for (const m of bron.matchAll(/export const \w*?(Html|Css|Js) = `([\s\S]*?)(?<!\\)`;/g)) {
    const soort = m[1].toLowerCase() as Stuk['soort'];
    stukken.push({ soort, tekst: m[2].replace(/\\([`$\\])/g, '$1') });
  }
  return stukken;
}

/** De lesstof van een site, per groep gesorteerd. */
export function berekenLesstof(siteDir: string): Lesstof {
  const stukken = LESSTOF_BRONNEN.map((b) => join(siteDir, b))
    .flatMap(bestanden)
    .filter((pad) => /\.mdx?$/.test(pad))
    .flatMap((pad) => stukkenUit(readFileSync(pad, 'utf8')));
  const perGroep: Lesstof = Object.fromEntries(GROEPEN.map((g) => [g, []]));
  for (const k of constructiesIn(stukken).keys()) {
    const [groep, ...rest] = k.split('|');
    perGroep[groep].push(rest.join('|'));
  }
  for (const labels of Object.values(perGroep)) labels.sort();
  return perGroep;
}
