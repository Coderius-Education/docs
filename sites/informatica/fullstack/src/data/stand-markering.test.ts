import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Het tabblad `main.py` toont het hele bestand na de les. Wat er sinds de
// vorige les bij kwam of veranderde, was daarin niet te zien: een leerling
// die een regel miste (de naam die erbij kwam op de import-regel, een
// handler die nu iets anders teruggeeft), moest de twee bestanden zelf naast
// elkaar leggen. De stand markeert die regels nu (```python {1,14-19}), en de
// zin erboven zegt het ook in woorden: een markering is een kleur, en op
// papier en voor een schermlezer is hij er niet.
//
// De markering is uit te rekenen: het verschil met de stand van de les
// ervoor. Deze test doet dat, en schrijft hem ook:
//
//   SCHRIJF_MARKERING=1 pnpm exec vitest run stand-markering
//
// Verander je een stand, draai dat dan: ook de markering van de les erna
// schuift mee.

const require = createRequire(import.meta.url);
const { nieuwSinds, wegSinds, uitMeta, alsMeta, zinOverStand, ZIN_OVER_STAND, plekVoorZin } =
  require('../../../../../packages/shared/nieuw-sinds.js') as {
    nieuwSinds: (vorige: string[], nu: string[]) => number[];
    wegSinds: (vorige: string[], nu: string[]) => number;
    uitMeta: (meta: string) => number[];
    alsMeta: (nummers: number[]) => string;
    zinOverStand: (nieuw: number[], weg: number) => string;
    ZIN_OVER_STAND: RegExp;
    plekVoorZin: (tussen: string) => number;
  };

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const SCHRIJF = process.env.SCHRIJF_MARKERING === '1';

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));

// Een reeks in Veiligheid die op de server van een eerdere reeks voortbouwt:
// zijn eerste stand vergelijkt de test met de laatste stand van die reeks.
// Cookies afschermen begint met "de server uit Wie mag wat, met twee nieuwe
// regels erin"; zonder dit had die stand geen markering.
const BOUWT_VOORT_OP: Record<string, string> = { 'Cookies afschermen': 'Wie mag wat' };

// Eén project is één reeks standen. De FastAPI-route is één project dat
// groeit; in Veiligheid begint elke reeks in een eigen map opnieuw.
const reeksen: { naam: string; lessen: string[] }[] = [
  { naam: 'FastAPI', lessen: plat(sidebars.apiSidebar as unknown as Item[]) },
  ...(sidebars.veiligheidSidebar as unknown as Item[]).flatMap((item) =>
    typeof item === 'string' ? [] : [{ naam: item.label, lessen: plat(item.items) }],
  ),
];

const padVan = (id: string) =>
  [`${DOCS}/${id}.mdx`, `${DOCS}/${id}.md`].find((pad) => existsSync(pad));

// De stand: wat er tussen de summary en de fence staat, de metastring en de code.
const STAND =
  /(<summary>Zo ziet je `main\.py` er nu uit<\/summary>)([\s\S]*?)(```python)([^\n]*)\n([\s\S]*?)```/;

interface Stand {
  les: string;
  pad: string;
  tussen: string;
  meta: string;
  regels: string[];
  /** Wat de markering hoort te zijn: het verschil met de stand ervoor. */
  hoort: string;
  /** De zin die erboven hoort: wat de markering betekent en wat er weg is. */
  zin: string;
}

function standenVan(lessen: string[], ervoor?: Stand): Stand[] {
  const uit: Stand[] = [];
  for (const les of lessen) {
    const pad = padVan(les);
    if (!pad) continue;
    const m = STAND.exec(readFileSync(pad, 'utf8'));
    if (!m) continue;
    const regels = m[5].replace(/\n$/, '').split('\n');
    const vorige = uit.at(-1) ?? ervoor;
    // De eerste stand van een project heeft niets om mee te vergelijken.
    const nieuw = vorige ? nieuwSinds(vorige.regels, regels) : [];
    uit.push({
      les,
      pad,
      tussen: m[2],
      meta: m[4].trim(),
      regels,
      hoort: alsMeta(nieuw),
      zin: zinOverStand(nieuw, vorige ? wegSinds(vorige.regels, regels) : 0),
    });
  }
  return uit;
}

const perReeks = new Map<string, Stand[]>();
for (const reeks of reeksen) {
  const ervoor = perReeks.get(BOUWT_VOORT_OP[reeks.naam] ?? '')?.at(-1);
  perReeks.set(reeks.naam, standenVan(reeks.lessen, ervoor));
}
const standen = reeksen.flatMap((reeks) =>
  (perReeks.get(reeks.naam) ?? []).map((stand) => ({ reeks: reeks.naam, ...stand })),
);

if (SCHRIJF) {
  for (const stand of standen) {
    const bron = readFileSync(stand.pad, 'utf8');
    const nieuw = bron.replace(STAND, (_heel, summary, tussen, fence, _meta, code) => {
      const zonderZin = (tussen as string).replace(ZIN_OVER_STAND, '');
      // De zin komt als eigen alinea na de summary-alinea's, vóór het label
      // van het bestand en vóór markers, die direct boven hun fence horen.
      const plek = plekVoorZin(zonderZin);
      const metZin = stand.zin
        ? `${zonderZin.slice(0, plek)}${stand.zin}\n\n${zonderZin.slice(plek)}`
        : zonderZin;
      return `${summary}${metZin}${fence}${stand.hoort ? ` ${stand.hoort}` : ''}\n${code}\`\`\``;
    });
    if (nieuw !== bron) writeFileSync(stand.pad, nieuw);
  }
}

describe('het tabblad main.py markeert wat er in deze les bij kwam', () => {
  it('er zijn standen in de FastAPI-route en in elke reeks van Veiligheid', () => {
    expect(standen.filter((s) => s.reeks === 'FastAPI').length).toBeGreaterThan(15);
    expect(new Set(standen.map((s) => s.reeks)).size).toBeGreaterThan(5);
  });

  it.each(standen)(
    '$les: de gemarkeerde regels zijn het verschil met de stand ervoor',
    ({ pad, hoort }) => {
      // Opnieuw gelezen: met SCHRIJF_MARKERING is het bestand net bijgewerkt.
      const meta = STAND.exec(readFileSync(pad, 'utf8'))?.[4].trim() ?? '';
      expect(alsMeta(uitMeta(meta))).toBe(hoort);
    },
  );

  it.each(standen.filter((s) => s.zin))(
    '$les: de tekst boven het bestand zegt in woorden wat de markering is en wat er weg is',
    ({ pad, zin }) => {
      const tussen = STAND.exec(readFileSync(pad, 'utf8'))?.[2] ?? '';
      expect(tussen).toContain(zin);
      // Een marker in commentaar blijft direct boven zijn fence.
      expect(tussen.slice(tussen.indexOf(zin))).not.toMatch(
        /\*\/\}\s*\n\n(?!\s*(?:<Bestand|\{\/\*|$))/,
      );
    },
  );

  it('een reeks die op een eerdere voortbouwt, begint met een markering', () => {
    const eerste = standen.find((s) => s.reeks === 'Cookies afschermen');
    expect(eerste?.hoort).not.toBe('');
  });

  it('een markering wijst alleen regels aan die bestaan en niet leeg zijn', () => {
    const fout = standen.flatMap((s) => {
      const meta = STAND.exec(readFileSync(s.pad, 'utf8'))?.[4] ?? '';
      return uitMeta(meta)
        .filter((n) => !s.regels[n - 1]?.trim())
        .map((n) => `${s.les}: regel ${n}`);
    });
    expect(fout).toEqual([]);
  });
});
