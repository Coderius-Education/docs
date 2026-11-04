// De lessen en hun GDScript-blokken in de volgorde van de sidebar, voor de
// tests die over de hele cursus heen kijken wat de leerling op een bepaald
// moment in zijn project heeft (global-leden.test.ts, scripts.test.ts).

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOK } from './extract';

export const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

export type Blok = {
  /** pad onder docs/, met regelnummer, voor de foutmelding */
  plek: string;
  hoofdstuk: number;
  code: string;
  /** begint met `extends`, eventueel na commentaar: een heel script */
  heelScript: boolean;
  /** een bewust fout voorbeeld (`# FOUT`, of een verwacht-fout- of niet-compileren-marker) */
  fout: boolean;
  /** staat onder een kop "Opdracht …": een opdracht die de leerling ook kan overslaan */
  opdracht: boolean;
  /**
   * een deel van een script, met `{/* compileer-als: extends … *\/}` erboven:
   * de rest van het script van de leerling blijft staan
   */
  deel: boolean;
};

function positie(tekst: string): number {
  return Number(tekst.match(/^sidebar_position:\s*(\d+)/m)?.[1] ?? 0);
}

/** Alle GDScript-blokken uit de hoofdstukken, in de volgorde van de sidebar. */
export function blokkenInVolgorde(): Blok[] {
  const hoofdstukken = readdirSync(DOCS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d+-/.test(e.name))
    .sort((a, b) => Number.parseInt(a.name, 10) - Number.parseInt(b.name, 10));
  const uit: Blok[] = [];
  for (const map of hoofdstukken) {
    const lessen = readdirSync(join(DOCS, map.name))
      .filter((f) => /\.mdx?$/.test(f))
      .map((f) => ({
        f,
        tekst: readFileSync(join(DOCS, map.name, f), 'utf8').replace(/\r\n/g, '\n'),
      }))
      .sort((a, b) => positie(a.tekst) - positie(b.tekst));
    for (const { f, tekst } of lessen) {
      for (const m of tekst.matchAll(BLOK)) {
        const ervoor = tekst.slice(0, m.index);
        const code = m[1];
        const koppen = ervoor.match(/^#{2,3} .*$/gm) ?? [];
        const kop = (koppen.at(-1) ?? '').replace(/^#+ /, '');
        uit.push({
          plek: `${map.name}/${f}:${ervoor.split('\n').length}`,
          hoofdstuk: Number.parseInt(map.name, 10),
          code,
          heelScript: /^(?:\s*#.*\n|\s*\n)*extends\s+\w+/.test(code),
          fout:
            /^\s*#\s*FOUT\b/m.test(code) ||
            /\{\/\*\s*(?:verwacht-fout|verwacht-runtime-fout|niet-compileren):[^*]*\*\/\}\s*$/.test(
              ervoor.slice(-400),
            ),
          opdracht: kop.startsWith('Opdracht'),
          deel: /\{\/\*\s*compileer-als:[^*]*\*\/\}\s*$/.test(ervoor.slice(-300)),
        });
      }
    }
  }
  return uit;
}

/** De namen die een script op het hoogste niveau definieert. */
export function leden(code: string): Set<string> {
  const namen = [
    ...code.matchAll(
      /^(?:@\w+(?:\([^)]*\))?\s+)*(?:static\s+)?(?:var|const|func|signal|enum)\s+(\w+)/gm,
    ),
  ];
  return new Set(namen.map((m) => m[1]));
}

/** Per functie op het hoogste niveau de tekst van de functie, zonder lege regels aan het eind. */
export function functies(code: string): Map<string, string> {
  const uit = new Map<string, string>();
  let naam: string | undefined;
  let regels: string[] = [];
  const bewaar = () => {
    if (naam) uit.set(naam, regels.join('\n').replace(/\s+$/, ''));
  };
  for (const regel of code.split('\n')) {
    const kop = regel.match(/^(?:static\s+)?func\s+(\w+)/);
    if (kop) {
      bewaar();
      naam = kop[1];
      regels = [regel];
    } else if (/^\S/.test(regel) && !regel.startsWith('#')) {
      bewaar();
      naam = undefined;
      regels = [];
    } else if (naam) {
      regels.push(regel);
    }
  }
  bewaar();
  return uit;
}
