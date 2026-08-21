// Haalt de GDScript-voorbeelden uit de lespagina's en schrijft ze als losse
// .gd-bestanden in het testproject, zodat Godot ze headless kan compileren.
//
// Waarom dit nodig is: de cursus laat leerlingen elk script zelf opbouwen, dus
// staan de tussenstanden alleen in de tekst. Een typefout of een API die in
// 4.7 niet meer bestaat, valt hier verder nergens op — de docusaurus-build
// leest die blokken niet.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type Fragment = {
  /** bestandsnaam zonder .gd, uniek binnen de bundel */
  naam: string;
  /** docs-pad van de bron, voor de foutmelding */
  bron: string;
  /** 1-gebaseerd regelnummer waar het codeblok begint */
  regel: number;
  /** de GDScript-broncode, klaar om te compileren */
  code: string;
  /** de dichtstbijzijnde `##`-kop erboven; de gedragstest kiest hierop */
  kop: string;
};

export type Overgeslagen = {
  bron: string;
  regel: number;
  reden: string;
};

const BLOK = /```gdscript\n([\s\S]*?)```/g;

/** Regels die op zichzelf geen geldig script vormen maar wel voorkomen. */
function isFoutVoorbeeld(code: string): boolean {
  return /^\s*#\s*FOUT\b/m.test(code);
}

function slugVan(inhoud: string): string | undefined {
  return inhoud.match(/^slug:\s*\/(\S+)/m)?.[1];
}

/**
 * Alleen blokken die met `extends` beginnen gaan mee: die zijn op zichzelf een
 * compileerbaar script. Losse fragmenten wijzen naar variabelen en functies die
 * elders op de pagina staan; die onder een `extends` plakken levert
 * compileerfouten op die niets over de les zeggen, en zo'n test wordt genegeerd.
 */
export function fragmentenUit(
  bron: string,
  inhoud: string,
): { fragmenten: Fragment[]; overgeslagen: Overgeslagen[] } {
  // Pagina's zonder slug (cheatsheet, tips) krijgen hun bestandsnaam, zodat de
  // namen niet van het absolute pad afhangen.
  const slug = slugVan(inhoud) ?? (bron.split('/').pop() ?? bron).replace(/\.mdx?$/, '');
  const fragmenten: Fragment[] = [];
  const overgeslagen: Overgeslagen[] = [];
  let n = 0;

  for (const match of inhoud.matchAll(BLOK)) {
    const code = match[1].replace(/\s+$/, '');
    const ervoor = inhoud.slice(0, match.index);
    const regel = ervoor.split('\n').length;
    const koppen = ervoor.match(/^#{2,3} (.+)$/gm);
    const kop = koppen ? koppen[koppen.length - 1].replace(/^#+ /, '') : '';
    n += 1;
    const naam = `${slug.replace(/[^a-z0-9]+/gi, '_')}_${n}`;

    if (isFoutVoorbeeld(code)) {
      overgeslagen.push({ bron, regel, reden: 'bewust fout voorbeeld' });
      continue;
    }

    if (/^extends\s+\w+/m.test(code)) {
      fragmenten.push({ naam, bron, regel, kop, code: `${code}\n` });
      continue;
    }

    overgeslagen.push({ bron, regel, reden: 'fragment, geen zelfstandig script' });
  }

  return { fragmenten, overgeslagen };
}

function alleLesbestanden(map: string): string[] {
  const paden: string[] = [];
  for (const entry of readdirSync(map, { withFileTypes: true })) {
    const volledig = join(map, entry.name);
    if (entry.isDirectory()) paden.push(...alleLesbestanden(volledig));
    else if (/\.mdx?$/.test(entry.name)) paden.push(volledig);
  }
  return paden;
}

export function verzamel(wortels: string[]): {
  fragmenten: Fragment[];
  overgeslagen: Overgeslagen[];
} {
  const fragmenten: Fragment[] = [];
  const overgeslagen: Overgeslagen[] = [];
  for (const wortel of wortels) {
    for (const pad of alleLesbestanden(wortel).sort()) {
      const resultaat = fragmentenUit(pad, readFileSync(pad, 'utf8'));
      fragmenten.push(...resultaat.fragmenten);
      overgeslagen.push(...resultaat.overgeslagen);
    }
  }
  return { fragmenten, overgeslagen };
}
