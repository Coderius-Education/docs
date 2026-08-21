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

/**
 * Sommige lessen tónen juist een kapot script — "wat is er mis?" is dan de
 * opdracht. Die horen niet te compileren, dus markeert de bron ze met een
 * commentaar vlak boven het blok. Onzichtbaar voor de leerling. Let op: de
 * MDX-vorm, want `<!-- -->` laat de docusaurus-build stuklopen.
 */
const NIET_COMPILEREN = '{/* niet-compileren:';

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

    if (isFoutVoorbeeld(code) || ervoor.slice(-200).includes(NIET_COMPILEREN)) {
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

/**
 * Bouwt het Global-autoloadscript uit de les zelf, in plaats van het naast de
 * cursus te onderhouden. De les toont `Global` in stukjes — variabelen in de
 * ene stap, `reset()` in de volgende, `is_game_over()` weer verderop — dus
 * voegen we alle `extends Node`-blokken van die pagina samen tot één script
 * met elk lid één keer. Van een lid dat meermaals voorkomt wint de langste
 * versie, want dat is de uitgewerkte.
 */
export function autoloadUit(inhoud: string): string | undefined {
  const leden = new Map<string, string>();

  for (const match of inhoud.matchAll(BLOK)) {
    const code = match[1].replace(/\s+$/, '');
    // Het volledige script, of een los lid dat de tekst erbij laat zetten
    // ("Zet daarnaast in je global script:"). Alles wat binnen een functie
    // hoort of een aanroep laat zien, valt af.
    const heelScript = code.startsWith('extends Node');
    if (!heelScript && !/^(?:func|var|const)\s/.test(code)) continue;

    let naam: string | undefined;
    let body: string[] = [];
    const bewaar = () => {
      if (!naam) return;
      const tekst = body.join('\n').replace(/\s+$/, '');
      const eerder = leden.get(naam);
      if (eerder === undefined || tekst.length > eerder.length) leden.set(naam, tekst);
    };

    for (const regel of code.split('\n').slice(heelScript ? 1 : 0)) {
      const kop = regel.match(/^(?:var|const)\s+(\w+)|^func\s+(\w+)/);
      if (kop) {
        bewaar();
        naam = kop[1] ?? kop[2];
        body = [regel];
      } else if (naam) {
        body.push(regel);
      }
    }
    bewaar();
  }

  if (leden.size === 0) return undefined;
  return `extends Node\n\n${[...leden.values()].join('\n\n')}\n`;
}
