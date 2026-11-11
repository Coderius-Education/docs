import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Met les-tabbladen is elk onderdeel van een les een eigen scherm: een
// tabblad, of een stap daarin. Een zin die naar een andere plek op de pagina
// wijst, klopt dan niet meer vanzelf. Bij de eerste review stond in 14 van de
// 33 lessen een Predict die vroeg naar "de startcode in de editor hieronder",
// terwijl de editor in het volgende tabblad stond: de leerling kon niet
// voorspellen. Deze test leest elke les zoals de build hem in schermen
// verdeelt, en houdt per scherm bij wat er te zien is.

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { groepeer } = require(`${GEDEELD}/les-tabs.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

type Knoop = {
  type: string;
  name?: string;
  value?: string;
  depth?: number;
  data?: { id?: string };
  children?: Knoop[];
  attributes?: { name: string; value: string }[];
};
type Blok = { soort: 'tekst' | 'code' | 'veld' | 'tabel' | 'lijst'; tekst: string };
type Scherm = { les: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');
const lessen = readdirSync(DOCS, { withFileTypes: true })
  .filter((map) => map.isDirectory())
  .flatMap((map) =>
    readdirSync(join(DOCS, map.name))
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => ({
        naam: `${map.name}/${f}`,
        bron: readFileSync(join(DOCS, map.name, f), 'utf8'),
      })),
  );

const tekstVan = (n: Knoop): string =>
  n.type === 'text' || n.type === 'inlineCode'
    ? (n.value ?? '')
    : (n.children ?? []).map(tekstVan).join(' ');
const eigenschap = (n: Knoop, naam: string) => n.attributes?.find((a) => a.name === naam)?.value;

/** Wat er in een scherm staat, in volgorde. */
function blokken(nodes: Knoop[], uit: Blok[] = []): Blok[] {
  for (const n of nodes) {
    if (n.type === 'paragraph') uit.push({ soort: 'tekst', tekst: tekstVan(n) });
    else if (n.type === 'code') uit.push({ soort: 'code', tekst: n.value ?? '' });
    else if (n.type === 'table') uit.push({ soort: 'tabel', tekst: tekstVan(n) });
    else if (n.type === 'list') uit.push({ soort: 'lijst', tekst: tekstVan(n) });
    else if (n.name === 'CodeEditor') uit.push({ soort: 'veld', tekst: '' });
    else if (n.name === 'LesStappen') continue;
    else if (n.type !== 'heading' && n.children) blokken(n.children, uit);
  }
  return uit;
}

const parse = await mdxParser();

/** De schermen van één les: elk tabblad, of elke stap van een tabblad met stappen. */
function schermenVan(les: { naam: string; bron: string }): Scherm[] {
  const tree: Knoop = parse(les.bron.replace(/^---\r?\n(?:[\s\S]*?\r?\n)?---\r?\n/, ''));
  let n = 0;
  const geefId = (node: Knoop) => {
    if (node.type === 'heading') node.data = { id: `kop-${n++}` };
    for (const kind of node.children ?? []) geefId(kind);
  };
  geefId(tree);
  const tabs = ((groepeer(tree.children) ?? []) as Knoop[]).find((k) => k.name === 'LesTabs');
  return (tabs?.children ?? []).flatMap((tab) => {
    const label = eigenschap(tab, 'label') ?? '';
    const stappen = tab.children?.find((k) => k.name === 'LesStappen');
    if (!stappen) return [{ les: les.naam, naam: label, blokken: blokken(tab.children ?? []) }];
    return (stappen.children ?? []).map((stap) => ({
      les: les.naam,
      naam: `${label} › ${eigenschap(stap, 'label')}`,
      blokken: blokken(stap.children ?? []),
    }));
  });
}

const schermen = lessen.flatMap(schermenVan);
const isTeZien = (b: Blok) => b.soort !== 'tekst';

describe('elk scherm van een les staat op zichzelf', () => {
  it('de lessen zijn in schermen verdeeld', () => {
    // Zonder schermen slagen de tests hieronder op niets.
    expect(schermen.length).toBeGreaterThan(250);
    expect(schermen.some((s) => s.naam.includes(' › '))).toBe(true);
  });

  it('"hieronder" wijst naar iets dat in hetzelfde scherm volgt', () => {
    const fout: string[] = [];
    for (const s of schermen) {
      s.blokken.forEach((b, i) => {
        if (b.soort !== 'tekst' || !/\b(hieronder|onderstaande?)\b/i.test(b.tekst)) return;
        if (!s.blokken.slice(i + 1).some(isTeZien))
          fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('"hierboven" wijst naar iets dat in hetzelfde scherm ervoor staat', () => {
    const fout: string[] = [];
    for (const s of schermen) {
      s.blokken.forEach((b, i) => {
        if (b.soort !== 'tekst' || !/\b(hierboven|bovenstaande?)\b/i.test(b.tekst)) return;
        if (i === 0) fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('wie de startcode noemt, laat hem zien: als code of in een oefenveld', () => {
    const fout = schermen
      .filter((s) => s.blokken.some((b) => b.soort === 'tekst' && /\bstartcode\b/i.test(b.tekst)))
      .filter((s) => !s.blokken.some((b) => b.soort === 'code' || b.soort === 'veld'))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('de startcode in Predict is de startcode van het oefenveld', () => {
    // De code staat er twee keer: in Predict om te lezen, en in het veld om
    // te draaien. Verandert de startcode, dan moet Predict mee, anders
    // voorspelt de leerling iets anders dan hij daarna draait.
    const fout: string[] = [];
    let gecontroleerd = 0;
    for (const les of lessen) {
      const start = [...les.bron.matchAll(/export const start\w* = `([\s\S]*?)`;/g)]
        .flatMap((m) => m[1].split('\n'))
        .map((regel) => regel.trim());
      for (const s of schermenVan(les).filter((s) => s.naam === 'Predict')) {
        if (!s.blokken.some((b) => /startcode van het oefenveld/.test(b.tekst))) continue;
        gecontroleerd++;
        // Alleen wat vóór het antwoord staat: het antwoord mag eigen code hebben.
        const regels = s.blokken
          .filter((b) => b.soort === 'code')
          .flatMap((b) => b.tekst.split('\n'))
          .map((regel) => regel.trim())
          .filter(Boolean);
        for (const regel of regels)
          if (!start.includes(regel)) fout.push(`${les.naam}: niet in de startcode: ${regel}`);
      }
    }
    expect(fout).toEqual([]);
    expect(gecontroleerd).toBeGreaterThanOrEqual(7);
  });

  it('een bestand in het oefenveld heet geen tab of tabblad', () => {
    // De onderdelen van de les zijn nu tabbladen. "Bekijk de startcode in
    // beide tabbladen" kon de tabbladen van de les betekenen, of index.html
    // en script.js in het veld.
    const bestand = '(?:index\\.html|style\\.css|script\\.js)';
    const patroon = new RegExp(
      `${bestand}\\*{0,2}[- ]\\*{0,2}tab(?:blad)?\\b|tab(?:blad)? \\*{0,2}${bestand}|beide tabbladen`,
      'i',
    );
    const fout = lessen.flatMap((les) =>
      les.bron
        .split('\n')
        .filter((regel) => patroon.test(regel))
        .map((regel) => `${les.naam}: ${regel.slice(0, 90)}`),
    );
    expect(fout).toEqual([]);
  });
});
