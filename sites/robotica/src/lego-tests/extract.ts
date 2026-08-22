// Haalt de Python-voorbeelden uit de lespagina's, zodat CI ze kan compileren.
//
// Waarom: de lessen bevatten MicroPython die verder nergens wordt uitgevoerd —
// er is geen board in CI. Een typefout of kapot voorbeeld valt nu pas op als
// een leerling hem overtypt. CPython's compile() is puur syntactisch (namen en
// imports hoeven niet te bestaan), en MicroPython-syntax is daarvoor
// compatibel, dus élk blok kan mee — anders dan bij godot is er geen
// extends-achtig filter nodig.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type Fragment = {
  /** bestandsnaam zonder .py, uniek binnen de bundel */
  naam: string;
  /** docs-pad van de bron, voor de foutmelding */
  bron: string;
  /** 1-gebaseerd regelnummer waar het codeblok begint */
  regel: number;
  /** de dichtstbijzijnde kop erboven, voor context in rapportage */
  kop: string;
  /** de Python-broncode, gededent en klaar om te compileren */
  code: string;
};

export type Overgeslagen = {
  bron: string;
  regel: number;
  reden: string;
};

const BLOK = /```python\n([\s\S]*?)```/g;

/**
 * Sommige blokken horen niet te compileren: een bewust kapot voorbeeld
 * ("wat is er mis?"), of een fragment dat alleen binnen een groter script
 * betekenis heeft. De bron markeert ze met een MDX-commentaar vlak boven het
 * blok — onzichtbaar voor de leerling. Let op de MDX-vorm: `<!-- -->` laat
 * de docusaurus-build stuklopen.
 */
const NIET_COMPILEREN = '{/* niet-compileren:';

/** Gemeenschappelijke inspringing weghalen (blokken in lijsten staan ingesprongen). */
export function dedent(code: string): string {
  const regels = code.split('\n');
  let kleinste = Number.POSITIVE_INFINITY;
  for (const regel of regels) {
    if (regel.trim() === '') continue;
    const inspring = regel.length - regel.trimStart().length;
    if (inspring < kleinste) kleinste = inspring;
  }
  if (!Number.isFinite(kleinste) || kleinste === 0) return code;
  return regels.map((r) => r.slice(kleinste)).join('\n');
}

function slugVan(inhoud: string): string | undefined {
  return inhoud.match(/^slug:\s*\/(\S+)/m)?.[1];
}

export function fragmentenUit(
  bron: string,
  inhoud: string,
): { fragmenten: Fragment[]; overgeslagen: Overgeslagen[] } {
  // Pagina's zonder slug krijgen hun bestandsnaam, zodat de fragmentnamen
  // niet van het absolute pad afhangen.
  const slug = slugVan(inhoud) ?? (bron.split('/').pop() ?? bron).replace(/\.mdx?$/, '');
  const basis = slug.replace(/[^a-z0-9]+/gi, '_');
  const fragmenten: Fragment[] = [];
  const overgeslagen: Overgeslagen[] = [];
  let n = 0;

  for (const match of inhoud.matchAll(BLOK)) {
    const rauw = match[1].replace(/\s+$/, '');
    const ervoor = inhoud.slice(0, match.index);
    const regel = ervoor.split('\n').length;
    const koppen = ervoor.match(/^#{2,3} (.+)$/gm);
    const kop = koppen ? koppen[koppen.length - 1].replace(/^#+ /, '') : '';
    n += 1;

    if (ervoor.slice(-200).includes(NIET_COMPILEREN)) {
      overgeslagen.push({ bron, regel, reden: 'bewust niet-compileerbaar (marker)' });
      continue;
    }

    const code = dedent(rauw);
    if (/^>>>/m.test(code)) {
      overgeslagen.push({ bron, regel, reden: 'REPL-transcript' });
      continue;
    }

    fragmenten.push({ naam: `${basis}_${n}`, bron, regel, kop, code: `${code}\n` });
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
