import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Beloftes in de uitbreidingen (htmx, JavaScript) die een leerling niet zelf
// kan controleren, en die in de leerling-doorloop fout bleken:
// - de recepten zetten hx-attributen op gastenboek_form.html en berichten.html
//   zonder te zeggen dat htmx daar ook geladen moet worden; het formulier
//   verstuurde zichzelf dan als GET en er werd niets opgeslagen;
// - de Netwerk-tabel beloofde 21 B voor een antwoord waarvan alleen de headers
//   al ruim honderd bytes zijn (gemeten: 151 B);
// - "Typ dit in de Console": een leerling plakt, en Chrome houdt dat de eerste
//   keer tegen tot je "plakken toestaan" typt;
// - het htmx-diagram linkte naar Server of browser?, een les die pas later komt.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };

function plat(items: Item[]): string[] {
  return items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
}

const lessen = plat(sidebars.apiSidebar as unknown as Item[]);
const tekst = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
const blokken = (bron: string, taal: string) =>
  [...bron.matchAll(new RegExp(`\`\`\`${taal}[^\\n]*\\n([\\s\\S]*?)\`\`\``, 'g'))].map((m) => ({
    code: m[1],
    index: m.index ?? 0,
  }));

describe('htmx wordt geladen waar hx-attributen staan', () => {
  it('een les met hx- in een HTML-blok noemt de script-tag van htmx.min.js', () => {
    const fout = lessen.filter((id) => {
      const bron = tekst(id);
      return (
        blokken(bron, 'html').some((b) => /\shx-[a-z]/.test(b.code)) &&
        !bron.includes('<script src="/static/js/htmx.min.js"')
      );
    });
    expect(fout).toEqual([]);
  });
});

describe('Netwerk-tabel', () => {
  it('een 200-antwoord is minstens 100 B: de headers alleen zijn al groter', () => {
    const fout = lessen.flatMap((id) =>
      [...tekst(id).matchAll(/status: 200,[^}]*grootte: '(\d+) B'/g)]
        .filter((m) => Number(m[1]) < 100)
        .map((m) => `${id}: ${m[1]} B`),
    );
    expect(fout).toEqual([]);
  });
});

describe('Console', () => {
  it('een les die code in de Console laat typen, zegt hoe plakken werkt', () => {
    const fout = lessen.filter((id) => {
      const bron = tekst(id);
      const typen = blokken(bron, 'js').some((b) => {
        const ervoor = bron.slice(Math.max(0, b.index - 300), b.index);
        return /Console/.test(ervoor) && /\b[Tt]yp\b/.test(ervoor);
      });
      return typen && !bron.includes('plakken toestaan');
    });
    expect(fout).toEqual([]);
  });
});

describe('het verzoekdiagram wijst niet vooruit', () => {
  const bron = readFileSync(
    new URL('../components/VerzoekCyclus/index.tsx', import.meta.url),
    'utf8',
  );
  const stappen = new Map(
    [...bron.matchAll(/const (\w+): Stap\[\] = \[([\s\S]*?)\n\];/g)].map((m) => [
      m[1],
      [...m[2].matchAll(/to: '\/docs\/([^'#]+)/g)].map((t) => t[1]),
    ]),
  );
  const varianten = new Map(
    [...bron.matchAll(/(\w+): \{ stappen: (\w+),/g)].map((m) => [m[1], stappen.get(m[2]) ?? []]),
  );

  // Twee links op verzoek-get, in de basis, wijzen naar een uitbreiding. Die
  // pagina valt buiten de uitbreidingen; de lijst is de exacte achterstand.
  const ACHTERSTAND = [
    // Stap 7 van één klik (de browser voert JavaScript uit) hoort bij de
    // uitbreiding; de pagina zegt erbij dat die later komt.
    'FastAPI/berichten-verwijderen/verzoek-get (get) → FastAPI/in-de-browser/javascript',
  ];

  it('elke les in het diagram komt vóór of op de pagina die het toont', () => {
    expect(varianten.size).toBeGreaterThan(5);
    const fout = lessen.flatMap((id, plek) =>
      [...tekst(id).matchAll(/<VerzoekCyclus variant="(\w+)"/g)].flatMap((m) =>
        (varianten.get(m[1]) ?? [])
          .filter((doel) => lessen.indexOf(doel) > plek)
          .map((doel) => `${id} (${m[1]}) → ${doel}`),
      ),
    );
    expect([...new Set(fout)].sort()).toEqual(ACHTERSTAND);
  });
});
