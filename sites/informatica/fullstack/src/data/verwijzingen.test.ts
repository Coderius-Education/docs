import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Na het herindelen van het gastenboek wezen vijf verwijzingen nog naar de oude
// plek: "de verwijderknop uit Doorsturen na opslaan" (die knop zit in Een
// bericht verwijderen), "zoals je in Alles tonen een lege lijst opving" (dat
// is Nog niets?), en "een 404, zoals in Eén item tonen" (de 404 zit in Een 404
// sturen). Twee markers boven een codeblok noemden nog een les die er niet
// meer is. lesvolgorde.test.ts keek alleen naar linkteksten met een dubbele
// punt of haakjes.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const lessen = plat(sidebars.apiSidebar as unknown as Item[]);
const tekst = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
const titel = (id: string) => tekst(id).match(/^# (.+)$/m)?.[1] ?? '';

// Elke titel, en het deel vóór de dubbele punt, wijst naar zijn les.
const naarLes = new Map<string, string>();
for (const id of lessen) {
  const t = titel(id);
  naarLes.set(t, id);
  if (t.includes(':')) naarLes.set(t.split(':')[0], id);
  if (t.includes(' (')) naarLes.set(t.split(' (')[0], id);
  naarLes.set(`${id.split('/').at(-1)}.mdx`, id);
}

const allePaginas = (map: string): string[] =>
  readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return allePaginas(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });

describe('verwijzingen naar een les van de FastAPI-route', () => {
  it('een linktekst die een lestitel noemt, wijst naar die les', () => {
    const fout = allePaginas(DOCS).flatMap((pad) =>
      // Een link met een anker mag de naam van een sectie dragen, zoals het
      // htmx-recept Een formulier versturen.
      [
        ...readFileSync(pad, 'utf8').matchAll(
          /\[([^\]]+)\]\(\/docs\/(FastAPI\/[\w/-]+)(#[^)]*)?\)/g,
        ),
      ]
        .filter((m) => !m[3] && naarLes.has(m[1]) && naarLes.get(m[1]) !== m[2])
        .map((m) => `${relative(DOCS, pad)}: [${m[1]}] → ${m[2]}, hoort ${naarLes.get(m[1])}`),
    );
    expect(fout).toEqual([]);
  });

  it('een route-dubbel-marker noemt een les waarin die route echt staat', () => {
    const fout: string[] = [];
    for (const id of lessen) {
      for (const m of tekst(id).matchAll(
        /route-dubbel:[^*]*?vervangt (GET|POST|DELETE) (\S+)(?: \([^)]*\))? uit (.+?)(?:,|;| met | nu |\s*\*\/)/g,
      )) {
        const [, methode, pad, bron] = m;
        const delen = bron
          .split(' of ')
          .map((d) => (d === 'het htmx-recept' ? 'htmx-overzicht.mdx' : d));
        for (const deel of delen) {
          const les = naarLes.get(deel.trim());
          const decorator = `@app.${methode.toLowerCase()}("${pad}"`;
          if (!les) fout.push(`${id}: "${deel}" is geen les`);
          else if (!tekst(les).includes(decorator))
            fout.push(`${id}: ${decorator} staat niet in ${les}`);
        }
      }
    }
    expect(fout).toEqual([]);
  });

  it('elk diagram staat in de FastAPI-route op precies één pagina', () => {
    // Het sessie-diagram stond in Cookie of sessie? en in de les erna, die
    // het pas stap voor stap uitlegde.
    const perVariant = new Map<string, string[]>();
    for (const id of lessen) {
      for (const m of tekst(id).matchAll(/<VerzoekCyclus variant="(\w+)"/g)) {
        perVariant.set(m[1], [...(perVariant.get(m[1]) ?? []), id]);
      }
    }
    const dubbel = [...perVariant].filter(([, ids]) => ids.length > 1);
    expect(dubbel).toEqual([]);
    expect(perVariant.get('sessie')).toEqual(['FastAPI/onthouden/verzoek-sessie']);
  });
});
