// Haalt de GDScript-voorbeelden uit de lespagina's en schrijft ze als losse
// .gd-bestanden in het testproject, zodat Godot ze headless kan compileren.
//
// Waarom dit nodig is: de cursus laat leerlingen elk script zelf opbouwen, dus
// staan de tussenstanden alleen in de tekst. Een typefout of een API die in
// 4.7 niet meer bestaat, valt hier verder nergens op — de docusaurus-build
// leest die blokken niet.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { alleLesbestanden } from '@coderius/shared/voorkennis';

export type Fragment = {
  /** bestandsnaam zonder .gd, uniek binnen de bundel */
  naam: string;
  /** docs-pad van de bron, voor de foutmelding */
  bron: string;
  /** 1-gebaseerd regelnummer waar het codeblok begint */
  regel: number;
  /**
   * eerste en laatste regel die bij het blok horen (twee regels erboven, voor
   * een marker, en de sluitende fence); `--alleen` legt dit tegen de diff
   */
  begin: number;
  eind: number;
  /** de GDScript-broncode, klaar om te compileren */
  code: string;
  /** de dichtstbijzijnde `##`-kop erboven; de gedragstest kiest hierop */
  kop: string;
  /**
   * Bij een foutvoorbeeld met `{/* verwacht-fout: … *\/}` erboven: de melding
   * die Godot hoort te geven. De testrunner eist dan dat het blok níét
   * compileert, en dat deze tekst in een van de meldingen staat.
   */
  verwachtFout?: string;
  /**
   * Bij `{/* verwacht-runtime-fout: … *\/}`: de melding die het script tijdens
   * het draaien geeft. De testrunner compileert het, hangt het aan een node
   * van zijn soort, laat `_ready()` draaien en zoekt de melding.
   */
  verwachtRuntimeFout?: string;
};

export type Overgeslagen = {
  bron: string;
  regel: number;
  reden: string;
};

/**
 * Een GDScript-codeblok, ook met iets achter de taal (```gdscript title=…)
 * en met Windows-regeleinden. Gedeeld met de andere tests over de codeblokken,
 * zodat die dezelfde blokken zien als de extractie.
 */
export const BLOK = /```gdscript[^\n]*\r?\n([\s\S]*?)```/g;

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

/**
 * Markers vlak boven een codeblok, in de MDX-vorm die de leerling niet ziet:
 *
 *  - `{/* verwacht-fout: <melding> *\/}`: een foutvoorbeeld dat juist wél door
 *    Godot moet. De les citeert de melding die het geeft, en die melding moet
 *    kloppen. Zonder deze controle stond in de tweens-les dat
 *    `tween_callback(queue_free())` het muntje meteen laat verdwijnen, terwijl
 *    Godot het script weigert. Alles vanaf een regel `# GOED` hoort bij de
 *    verbetering en gaat niet mee.
 *  - `{/* verwacht-runtime-fout: <melding> *\/}`: hetzelfde voor een melding
 *    die pas tijdens het spelen komt (een ontbrekende sleutel, een kapotte
 *    tween). Het script compileert gewoon; de testrunner hangt het aan een
 *    node van zijn soort, laat `_ready()` draaien en zoekt de melding. Schrijf
 *    zo'n voorbeeld dus zo dat `_ready()` de fout maakt.
 *  - `{/* compileer-als: extends Area2D *\/}`: een losse functie die de les
 *    toont zonder de rest van het script ("pas `_on_body_entered` van je vijand
 *    aan"), zodat wat de leerling er verder in heeft niet verdwijnt als hij het
 *    overneemt. De extractie zet die regel bovenaan, zodat hij toch compileert.
 *
 * De inhoud loopt nooit over een `*\/}` heen: met twee markers kort na elkaar
 * hoort elk blok alleen bij de zijne.
 */
const MARKER_SOORTEN = ['verwacht-fout', 'verwacht-runtime-fout', 'compileer-als'] as const;
type MarkerSoort = (typeof MARKER_SOORTEN)[number];
const MARKER =
  /\{\/\*\s*(verwacht-fout|verwacht-runtime-fout|compileer-als):\s*((?:(?!\*\/\})[\s\S])*?)\s*\*\/\}/g;

/** De marker die direct boven een blok staat, met zijn inhoud op één regel. */
function markerBoven(ervoor: string): { soort: MarkerSoort; inhoud: string } | undefined {
  const laatste = [...ervoor.matchAll(MARKER)].at(-1);
  if (!laatste || ervoor.slice((laatste.index ?? 0) + laatste[0].length).trim() !== '') {
    return undefined;
  }
  return { soort: laatste[1] as MarkerSoort, inhoud: laatste[2].replace(/\s+/g, ' ').trim() };
}

/**
 * Of een citaat uit de les klopt met de melding in de marker. Een `...` of `…`
 * in het citaat staat voor iets wat per keer verschilt (een node-id).
 */
export function citaatKlopt(citaat: string, melding: string): boolean {
  const patroon = citaat
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\.\.\.|…/)
    .map((deel) => deel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\s\\S]*?');
  return new RegExp(`^${patroon}$`).test(melding);
}

/**
 * Een foutvoorbeeld staat in een uitklapblok waarvan de summary de melding
 * noemt, vaak met de melding nog eens in een kaal codeblok. Wat de leerling
 * leest, moet de melding zijn die Godot geeft, en die staat in de marker.
 */
function controleerCitaten(ervoor: string, melding: string, waar: string): void {
  const begin = ervoor.lastIndexOf('<details>');
  if (begin === -1)
    throw new Error(
      `${waar}: een verwacht-fout of verwacht-runtime-fout hoort in een <details> met de melding`,
    );
  const stuk = ervoor.slice(begin);
  const summary = stuk.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1];
  const zonderTags = (summary ?? '').replace(/<[^>]+>/g, '').replace(/^Foutmelding:\s*/, '');
  if (!citaatKlopt(zonderTags, melding)) {
    throw new Error(
      `${waar}: de summary "${zonderTags.trim()}" is niet de melding uit de marker: "${melding}"`,
    );
  }
  for (const kaal of stuk.matchAll(/^```\n([\s\S]*?)```/gm)) {
    if (!citaatKlopt(kaal[1], melding)) {
      throw new Error(
        `${waar}: het meldingsblok "${kaal[1].trim()}" is niet de melding uit de marker: "${melding}"`,
      );
    }
  }
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
  ruw: string,
): { fragmenten: Fragment[]; overgeslagen: Overgeslagen[] } {
  const inhoud = ruw.replace(/\r\n/g, '\n');
  for (const m of inhoud.matchAll(MARKER)) {
    const erna = inhoud.slice((m.index ?? 0) + m[0].length);
    if (!/^\s*```gdscript/.test(erna)) {
      const regel = inhoud.slice(0, m.index).split('\n').length;
      throw new Error(`${bron}:${regel}: ${m[1]} staat niet direct boven een gdscript-blok`);
    }
  }
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
    const begin = Math.max(1, regel - 2);
    const eind = regel + match[0].split('\n').length - 1;
    const koppen = ervoor.match(/^#{2,3} (.+)$/gm);
    const kop = koppen ? koppen[koppen.length - 1].replace(/^#+ /, '') : '';
    n += 1;
    const naam = `${slug.replace(/[^a-z0-9]+/gi, '_')}_${n}`;

    const marker = markerBoven(ervoor);
    if (marker?.soort === 'verwacht-fout') {
      const fout = code.split(/^\s*#\s*GOED\b/m)[0].replace(/\s+$/, '');
      if (!/^extends\s+\w+/m.test(fout)) {
        throw new Error(
          `${bron}:${regel}: een verwacht-fout-blok moet een heel script zijn, met extends`,
        );
      }
      controleerCitaten(ervoor, marker.inhoud, `${bron}:${regel}`);
      fragmenten.push({
        naam,
        bron,
        regel,
        begin,
        eind,
        kop,
        code: `${fout}\n`,
        verwachtFout: marker.inhoud,
      });
      continue;
    }
    if (marker?.soort === 'verwacht-runtime-fout') {
      const fout = code.split(/^\s*#\s*GOED\b/m)[0].replace(/\s+$/, '');
      if (!/^extends\s+\w+/m.test(fout) || !/^func _ready\(/m.test(fout)) {
        throw new Error(
          `${bron}:${regel}: een verwacht-runtime-fout-blok moet een heel script zijn, met extends en een _ready()`,
        );
      }
      controleerCitaten(ervoor, marker.inhoud, `${bron}:${regel}`);
      fragmenten.push({
        naam,
        bron,
        regel,
        begin,
        eind,
        kop,
        code: `${fout}\n`,
        verwachtRuntimeFout: marker.inhoud,
      });
      continue;
    }
    if (isFoutVoorbeeld(code) || ervoor.slice(-200).includes(NIET_COMPILEREN)) {
      overgeslagen.push({ bron, regel, reden: 'bewust fout voorbeeld' });
      continue;
    }

    if (/^extends\s+\w+/m.test(code)) {
      fragmenten.push({ naam, bron, regel, begin, eind, kop, code: `${code}\n` });
      continue;
    }

    if (marker?.soort === 'compileer-als') {
      if (!/^extends\s+\w+$/.test(marker.inhoud) || /^\s/.test(code)) {
        throw new Error(
          `${bron}:${regel}: compileer-als hoort "extends <Node>" te zijn, boven code die links begint`,
        );
      }
      fragmenten.push({
        naam,
        bron,
        regel,
        begin,
        eind,
        kop,
        code: `${marker.inhoud}\n\n${code}\n`,
      });
      continue;
    }

    overgeslagen.push({ bron, regel, reden: 'fragment, geen zelfstandig script' });
  }

  return { fragmenten, overgeslagen };
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
export function autoloadUit(ruw: string): string | undefined {
  const inhoud = ruw.replace(/\r\n/g, '\n');
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
