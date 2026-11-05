import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Bewaakt de vorm van de Linux-cursus (docs/), zie CLAUDE.md:
// - de sidebar noemt elke les precies één keer, en geen les staat erbuiten;
// - de H1 heeft het nummer dat bij zijn plek in de sidebar hoort (1.1 … 2.6);
// - elke les heeft een Voorspel met het antwoord ingeklapt, en een
//   "Er gaat iets mis";
// - opdrachten zijn genummerd naar de les (1.3.a, 1.3.b) en hebben elk een
//   tip en een antwoord in <details>;
// - elke les eindigt met een link naar de volgende les in de sidebar.
// Of de oefenterminal doet wat de lessen beloven, staat in
// src/components/LinuxTerminal/schrijven.test.ts.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Categorie = { type: 'category'; label: string; items: string[] };
const linux = sidebars.linuxSidebar as unknown as (string | Categorie)[];
const delen = linux.filter((i): i is Categorie => typeof i !== 'string');
const lessen = delen.flatMap((c) => c.items);

const bestanden = (map: string): string[] =>
  readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });

const idVan = (pad: string) =>
  relative(DOCS, pad)
    .split('\\')
    .join('/')
    .replace(/\.mdx?$/, '');

// De lessen: alles in docs/ behalve de cheatsheet en de begrippen (naslag, in
// de navbar) en de hand-outs in unplugged/ (eigen sidebar, unplugged.test.ts).
const NASLAG = ['cheatsheet', 'begrippen'];
const lesbestanden = () =>
  bestanden(DOCS).filter((p) => !NASLAG.includes(idVan(p)) && !idVan(p).startsWith('unplugged/'));

const inhoud = (id: string) => {
  const pad = lesbestanden().find((p) => idVan(p) === id);
  if (!pad) throw new Error(`geen bestand voor ${id}`);
  return readFileSync(pad, 'utf8');
};

/** De tekst tussen een kop en de volgende kop van hetzelfde of een hoger niveau. */
function sectie(tekst: string, kop: RegExp): string {
  const m = kop.exec(tekst);
  if (!m) return '';
  const rest = tekst.slice(m.index + m[0].length);
  const volgende = rest.search(/^## /m);
  return volgende === -1 ? rest : rest.slice(0, volgende);
}

describe('de Linux-cursus', () => {
  it('de sidebar begint bij de startpagina en noemt elke les één keer', () => {
    expect(linux[0]).toBe('index');
    const alle = lesbestanden().map(idVan).sort();
    expect([...lessen, 'index'].sort()).toEqual(alle);
    expect(new Set(lessen).size).toBe(lessen.length);
  });

  it('de H1 heeft het nummer van zijn plek: deel.les', () => {
    const fout: string[] = [];
    delen.forEach((deel, d) => {
      deel.items.forEach((id, l) => {
        const h1 = inhoud(id).match(/^# (.+)$/m)?.[1] ?? '';
        if (!h1.startsWith(`${d + 1}.${l + 1} `)) fout.push(`${id}: "${h1}"`);
      });
    });
    expect(fout).toEqual([]);
  });

  it('elke les heeft een Voorspel met het antwoord ingeklapt, en een Er gaat iets mis', () => {
    const fout: string[] = [];
    for (const id of lessen) {
      const tekst = inhoud(id);
      if (!sectie(tekst, /^## Voorspel$/m).includes('<details>')) fout.push(`${id}: Voorspel`);
      if (!/^## Er gaat iets mis$/m.test(tekst)) fout.push(`${id}: Er gaat iets mis`);
    }
    expect(fout).toEqual([]);
  });

  it('opdrachten hebben het nummer van de les, en elk een tip en een antwoord', () => {
    const fout: string[] = [];
    delen.forEach((deel, d) => {
      deel.items.forEach((id, l) => {
        const tekst = inhoud(id);
        const koppen = [...tekst.matchAll(/^## Opdracht (\S+): /gm)].map((m) => m[1]);
        if (koppen.length === 0) fout.push(`${id}: geen opdracht`);
        koppen.forEach((nr, i) => {
          const verwacht = `${d + 1}.${l + 1}.${String.fromCharCode(97 + i)}`;
          if (nr !== verwacht) fout.push(`${id}: Opdracht ${nr}, verwacht ${verwacht}`);
          const blok = sectie(
            tekst,
            new RegExp(`^## Opdracht ${nr.replace(/\./g, '\\.')}: .*$`, 'm'),
          );
          if (!/<summary>Klik hier voor een tip<\/summary>/.test(blok))
            fout.push(`${id}: ${nr} zonder tip`);
          if (!/<summary>Klik hier voor het antwoord<\/summary>/.test(blok))
            fout.push(`${id}: ${nr} zonder antwoord`);
        });
      });
    });
    expect(fout).toEqual([]);
  });

  it('elke les eindigt met een link naar de volgende les', () => {
    const fout: string[] = [];
    lessen.forEach((id, i) => {
      const volgende = lessen[i + 1];
      if (!volgende) return;
      const laatste = inhoud(id).trim().split('\n').pop() ?? '';
      if (!laatste.includes(`(site:linux/docs/${volgende})`)) fout.push(`${id}: "${laatste}"`);
    });
    expect(fout).toEqual([]);
  });
});
