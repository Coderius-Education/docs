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

const IS_OPDRACHT = /^Opdracht(?:\s|:)/;

function opdrachten(p: Pagina): Opdracht[] {
  const koppen = [...p.proza.matchAll(/^(#{2,4}) (.*)$/gm)];
  const uit: Opdracht[] = [];
  koppen.forEach((k, i) => {
    if (!IS_OPDRACHT.test(k[2])) return;
    // Een sectie loopt tot de volgende kop van hetzelfde of een hoger niveau,
    // of tot de volgende opdracht op welk niveau ook: anders telde de
    // oplossing van een H3-opdracht eronder mee voor deze.
    const volgende = koppen
      .slice(i + 1)
      .find((v) => v[1].length <= k[1].length || IS_OPDRACHT.test(v[2]));
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

/** De teksten van de summaries in een sectie, zonder inline tags. */
function summaries(sectie: string): string[] {
  return [...sectie.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').trim(),
  );
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
      (o) => !ZONDER_TIP.has(o.kop) && !summaries(o.sectie).some((t) => /\btip\b/i.test(t)),
    ).map((o) => `${o.pad}: ${o.kop}`);
    expect(fout).toEqual([]);
  });

  it('geven elke les in een hoofdstuk een eigen positie, 1 tot en met n', () => {
    // Het nummer van een opdracht komt uit de sidebar_position. Twee lessen met
    // dezelfde positie hebben allebei een "Opdracht 5.1.a", en een gat laat
    // een les verspringen ten opzichte van wat de leerling in de sidebar telt.
    const fout: string[] = [];
    for (const h of new Set(PAGINAS.map((p) => p.hoofdstuk))) {
      const posities = PAGINAS.filter((p) => p.hoofdstuk === h)
        .map((p) => p.positie)
        .sort((a, b) => a - b);
      const verwacht = posities.map((_, i) => i + 1);
      if (posities.join() !== verwacht.join()) fout.push(`hoofdstuk ${h}: ${posities.join(', ')}`);
    }
    expect(fout).toEqual([]);
  });

  it('houdt de uitzonderingen schoon', () => {
    const koppen = new Set(ALLE.map((o) => o.kop));
    const weg = [...ZONDER_OPLOSSING.keys(), ...ZONDER_TIP.keys()].filter((k) => !koppen.has(k));
    expect(weg).toEqual([]);
  });
});

describe('de controle zelf', () => {
  const pagina = (proza: string): Pagina => ({ pad: 'x.md', hoofdstuk: 2, positie: 1, proza });
  const TIP = '<details>\n<summary>Klik hier voor een tip.</summary>\n\nx\n\n</details>\n';
  const OPLOSSING =
    '<details>\n<summary>Klik hier voor de <code>oplossing</code>.</summary>\n\nx\n\n</details>\n';

  it('rekent de oplossing van een opdracht eronder niet mee', () => {
    const [a, b] = opdrachten(
      pagina(
        `## Opdracht 2.1.a: een\n\nDoe iets.\n\n### Opdracht 2.1.b: twee\n\n${TIP}${OPLOSSING}`,
      ),
    );
    expect(summaries(a.sectie)).toEqual([]);
    expect(summaries(b.sectie)).toHaveLength(2);
  });

  it('ziet een groepskop "Opdrachten" niet als opdracht, en een H4-opdracht wel', () => {
    const gevonden = opdrachten(pagina('## Opdrachten\n\n#### Opdracht 2.1.a: diep\n\nx\n'));
    expect(gevonden.map((o) => o.kop)).toEqual(['Opdracht 2.1.a: diep']);
  });

  it('telt alleen het woord tip, en leest een summary met inline tags', () => {
    expect(
      summaries('<summary>Waarom is mijn lijn een stippellijn?</summary>').some((t) =>
        /\btip\b/i.test(t),
      ),
    ).toBe(false);
    expect(summaries(OPLOSSING)).toEqual(['Klik hier voor de oplossing.']);
  });
});
