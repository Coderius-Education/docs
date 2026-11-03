import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import { IMPORT_VAN, gebruikt, geimporteerd } from '../checker/imports';

// Leerlingen liepen vast op de imports. De lessen tonen meestal alleen wat
// erbij komt ("zet onder je andere endpoints"), en een nieuwe naam stond dan
// in één zin ("Zet `Form` bij je imports") en pas onderaan in het uitklapblok
// met het hele main.py. Wie de zin miste, kreeg een NameError en een server
// die niet start. Deze test eist dat elke les die een naam uit de tabel
// (src/checker/imports.ts) voor het eerst gebruikt, in de hoofdtekst een
// python-blok heeft met de import-regel waar die naam in staat.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));

const tekst = (id: string) => {
  for (const ext of ['mdx', 'md'])
    try {
      return readFileSync(`${DOCS}/${id}.${ext}`, 'utf8');
    } catch {}
  return '';
};
const STAND = /<summary>Zo ziet je `main\.py` er nu uit<\/summary>[\s\S]*?```python\n([\s\S]*?)```/;
const hoofdtekst = (bron: string) =>
  bron.split(/\n## Opdrachten\n/)[0].replace(/<details>[\s\S]*?<\/details>/g, '');
const blokken = (stuk: string) =>
  [...stuk.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);

// Eén project dat groeit: de FastAPI-route telt door. Veiligheid en Online
// zetten beginnen per reeks (categorie) met een eigen startbestand.
const reeksen = (sidebar: string, doorlopend: boolean): string[][] => {
  const items = (sidebars as unknown as Record<string, Item[]>)[sidebar];
  if (doorlopend) return [plat(items)];
  return items.map((i) => (typeof i === 'string' ? [i] : plat(i.items)));
};

// Een blok voor de bovenkant van main.py: import-regels, en eventueel wat
// daar direct onder staat (`app = FastAPI()`, `templates = …`, `app.mount(…)`),
// maar geen endpoint. Dat is het stuk dat een leerling bovenaan zet of vervangt.
const BOVENKANT =
  /^(\s*|from [\w.]+ import [\w ,]+|import [\w., ]+|[\w.]+ = [\w.]+\(.*\)|app\.\w+\(.*\))$/;
const importBlok = (code: string) =>
  /^(from|import) /m.test(code) && code.split('\n').every((r) => BOVENKANT.test(r));
// Een los script (database.py, een script met httpx) is een eigen bestand en
// toont zijn imports zelf.
const losScript = (code: string) => !/^@app\.|^app = /m.test(code);
const regels = (code: string) =>
  new Map(
    [...code.matchAll(/^from ([\w.]+) import ([\w ,]+)$/gm)].map(
      (m) => [m[1], m[0]] as [string, string],
    ),
  );

describe('de import-regel staat waar hij verandert', () => {
  for (const [sidebar, doorlopend] of [
    ['apiSidebar', true],
    ['veiligheidSidebar', false],
    ['onlineSidebar', false],
  ] as const) {
    it(sidebar, () => {
      const fout: string[] = [];
      for (const lessen of reeksen(sidebar, doorlopend)) {
        const bekend = new Set<string>();
        for (const id of lessen) {
          const bron = tekst(id);
          const hier = blokken(hoofdtekst(bron));
          const stand = bron.match(STAND)?.[1];
          // De eerste les van een project toont het hele bestand.
          const nieuwProject = bekend.size === 0;
          const getoond = new Set<string>();
          // Het blok met de import-regel mag voor of na het eerste gebruik
          // staan, als het maar in de hoofdtekst van de les staat.
          const inScript = new Set<string>();
          for (const code of hier)
            if (importBlok(code) || nieuwProject || losScript(code))
              for (const naam of geimporteerd(code).keys()) {
                getoond.add(naam);
                if (losScript(code) && !importBlok(code)) inScript.add(naam);
              }
          for (const code of hier)
            for (const naam of gebruikt(code).keys()) {
              if (bekend.has(naam) || getoond.has(naam)) continue;
              fout.push(`${id}: ${naam} zonder een blok met alleen de import-regel`);
              getoond.add(naam);
            }
          // Het blok toont de regel zoals hij in de stand van de les staat.
          if (stand && !nieuwProject)
            for (const code of hier.filter(importBlok))
              for (const [module, regel] of regels(code))
                if (regels(stand).has(module) && regels(stand).get(module) !== regel)
                  fout.push(
                    `${id}: "${regel}" is niet de regel uit de stand: "${regels(stand).get(module)}"`,
                  );
          // En de tekst noemt de nieuwe naam: een naam die stil in een
          // bestaande regel verschijnt, ziet een leerling niet.
          const proza = hoofdtekst(bron).replace(/```[\s\S]*?```/g, '');
          if (!nieuwProject)
            for (const naam of getoond)
              if (
                !bekend.has(naam) &&
                !inScript.has(naam) &&
                naam in IMPORT_VAN &&
                !proza.includes(`\`${naam}\``)
              )
                fout.push(`${id}: de tekst noemt \`${naam}\` niet bij de nieuwe import`);
          for (const naam of getoond) bekend.add(naam);
          if (stand) for (const naam of geimporteerd(stand).keys()) bekend.add(naam);
        }
      }
      expect(fout).toEqual([]);
    });
  }

  it('de test ziet een gemiste import', () => {
    const code =
      '@app.post("/naam")\nasync def naam(naam: str = Form(...)):\n    return {"naam": naam}\n';
    expect([...gebruikt(code).keys()]).toEqual(['Form']);
    expect(gebruikt('x = "<form>Form</form>"  # Form\n').size).toBe(0);
    expect(gebruikt('import fastapi\nfastapi.Form()\n').size).toBe(0);
    expect([...geimporteerd('from fastapi import FastAPI, Form\n').keys()]).toEqual([
      'FastAPI',
      'Form',
    ]);
  });

  it('de tabel op de cheatsheet en bij Er gaat iets mis is de tabel uit imports.ts', () => {
    // Een rij per plek: de namen in backticks, en dan de regel.
    const rijen = (bron: string) => {
      const plek = new Map<string, string>();
      for (const [, namen, module] of bron.matchAll(
        /^\| (`[^|]+`) \| `from ([\w.]+) import [^`]*` \|$/gm,
      ))
        for (const [, naam] of namen.matchAll(/`(\w+)`/g)) plek.set(naam, module);
      return plek;
    };
    for (const pagina of ['cheatsheet.md', 'troubleshooting.md']) {
      const plek = rijen(readFileSync(`${DOCS}/${pagina}`, 'utf8'));
      expect(Object.fromEntries(plek), pagina).toEqual(IMPORT_VAN);
    }
  });
});
