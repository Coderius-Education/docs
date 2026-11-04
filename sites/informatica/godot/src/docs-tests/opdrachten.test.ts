import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De schrijfgids legt het opdracht-format vast (§3 en §6): "Opdracht H.S.x:
// titel", met een tip en een oplossing in een uitklapblok. Voor Godot
// controleerde niets dat. Een leerling die "opdracht 10.1.b" zoekt omdat de
// docent dat noemt, moet hem op die plek vinden, en elke opdracht heeft een
// antwoord: "zelf een effect bedenken" leest zonder voorbeeldoplossing als
// "hier hoeft niets bij".

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function zonderCode(tekst: string): string {
  return tekst.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' '));
}

type Pagina = { pad: string; hoofdstuk: number; positie: number; proza: string };

function paginas(): Pagina[] {
  const uit: Pagina[] = [];
  for (const map of readdirSync(DOCS, { withFileTypes: true })) {
    if (!map.isDirectory() || !/^\d+-/.test(map.name)) continue;
    for (const f of readdirSync(join(DOCS, map.name))) {
      if (!/\.mdx?$/.test(f)) continue;
      const tekst = readFileSync(join(DOCS, map.name, f), 'utf8');
      uit.push({
        pad: `${map.name}/${f}`,
        hoofdstuk: Number.parseInt(map.name, 10),
        positie: Number(tekst.match(/^sidebar_position:\s*(\d+)/m)?.[1] ?? -1),
        proza: zonderCode(tekst),
      });
    }
  }
  return uit;
}

type Opdracht = { pad: string; kop: string; sectie: string; nummer?: [number, number, string] };

function opdrachten(p: Pagina): Opdracht[] {
  const koppen = [...p.proza.matchAll(/^(#{2,3}) (.*)$/gm)];
  const uit: Opdracht[] = [];
  koppen.forEach((k, i) => {
    if (!k[2].startsWith('Opdracht')) return;
    const volgende = koppen.slice(i + 1).find((v) => v[1].length <= k[1].length);
    const sectie = p.proza.slice(k.index, volgende?.index ?? p.proza.length);
    const m = k[2].match(/^Opdracht (\d+)\.(\d+)\.([a-z]): \S/);
    uit.push({
      pad: p.pad,
      kop: k[2],
      sectie,
      nummer: m ? [Number(m[1]), Number(m[2]), m[3]] : undefined,
    });
  });
  return uit;
}

const PAGINAS = paginas();
const ALLE = PAGINAS.flatMap(opdrachten);

// Elke uitzondering staat hier met zijn reden, zodat een nieuwe afwijking een
// keuze is en geen vergissing.
const ZONDER_OPLOSSING = new Map([
  [
    'Opdracht 5.7.a: voeg een eigen kracht toe',
    'bewust zonder uitgewerkte oplossing; het info-blok in de les zegt waarom',
  ],
]);
const ZONDER_TIP = new Map([
  ['Opdracht 5.7.a: voeg een eigen kracht toe', 'de leerling kiest zelf wat hij bouwt'],
]);

describe('opdrachten in de Godot-cursus', () => {
  it('heten "Opdracht H.S.x: titel", met het hoofdstuk en de les van de pagina', () => {
    const fout: string[] = [];
    const pagina = new Map(PAGINAS.map((p) => [p.pad, p]));
    for (const o of ALLE) {
      if (!o.nummer) {
        fout.push(`${o.pad}: "${o.kop}" heeft niet de vorm Opdracht H.S.x: titel`);
        continue;
      }
      const p = pagina.get(o.pad) as Pagina;
      const [h, s] = o.nummer;
      if (h !== p.hoofdstuk || s !== p.positie) {
        fout.push(`${o.pad}: "${o.kop}" hoort ${p.hoofdstuk}.${p.positie} te zijn`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('tellen per les door vanaf a, zonder gat', () => {
    const fout: string[] = [];
    for (const p of PAGINAS) {
      const letters = opdrachten(p)
        .filter((o) => o.nummer)
        .map((o) => (o.nummer as [number, number, string])[2]);
      const verwacht = letters.map((_, i) => String.fromCharCode(97 + i));
      if (letters.join('') !== verwacht.join('')) {
        fout.push(`${p.pad}: ${letters.join(', ')} in plaats van ${verwacht.join(', ')}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('hebben een oplossing in een uitklapblok', () => {
    const fout = ALLE.filter(
      (o) =>
        !ZONDER_OPLOSSING.has(o.kop) && !/<summary>[^<]*oplossing[^<]*<\/summary>/i.test(o.sectie),
    ).map((o) => `${o.pad}: ${o.kop}`);
    expect(fout).toEqual([]);
  });

  it('hebben een tip in een uitklapblok, of een reden waarom niet', () => {
    const fout = ALLE.filter(
      (o) => !ZONDER_TIP.has(o.kop) && !/<summary>[^<]*tip[^<]*<\/summary>/i.test(o.sectie),
    ).map((o) => `${o.pad}: ${o.kop}`);
    expect(fout).toEqual([]);
  });

  it('houdt de uitzonderingen schoon', () => {
    const koppen = new Set(ALLE.map((o) => o.kop));
    const weg = [...ZONDER_OPLOSSING.keys(), ...ZONDER_TIP.keys()].filter((k) => !koppen.has(k));
    expect(weg).toEqual([]);
  });
});
