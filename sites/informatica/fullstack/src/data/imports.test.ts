import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import { IMPORT_VAN, gebruikt, geimporteerd } from '../checker/imports';

// Leerlingen liepen vast op de imports. De lessen tonen meestal alleen wat
// erbij komt ("zet onder je andere endpoints"), en een nieuwe naam stond dan
// in één zin ("Zet `Form` bij je imports") of stil in een bestaande regel van
// een groot codeblok. Wie hem miste, kreeg een NameError en een server die
// niet start. Deze test eist dat elke les die een naam voor het eerst
// importeert, de import-regel aanwijst: in een eigen blok met alleen de
// import-regel en een zin erboven die de naam of zijn module noemt, of in een
// <CodeUitleg> met een <Regel> op die import-regel die hem uitlegt.

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

type Blok = { code: string; ervoor: string; uitleg: { van: number; tot: number; tekst: string }[] };

/** De python-blokken van de hoofdtekst, met de alinea's erboven en de uitleg per regel. */
function blokkenMetContext(stuk: string): Blok[] {
  const uit: Blok[] = [];
  const fence = /```python[^\n]*\n([\s\S]*?)```/g;
  let vorige = 0;
  for (const m of stuk.matchAll(fence)) {
    const ervoor = stuk
      .slice(vorige, m.index)
      .split(/\n\s*\n/)
      .map((a) => a.trim())
      .filter((a) => a && !/^<[A-Z][\w]*[\s\S]*\/>$|^<\/?CodeUitleg>$|^\{\/\*/.test(a))
      .slice(-2)
      .join('\n');
    vorige = (m.index ?? 0) + m[0].length;
    const open = stuk.lastIndexOf('<CodeUitleg>', m.index);
    const dicht = stuk.lastIndexOf('</CodeUitleg>', m.index);
    const uitleg: Blok['uitleg'] = [];
    if (open > dicht) {
      const einde = stuk.indexOf('</CodeUitleg>', m.index);
      for (const r of stuk
        .slice(vorige, einde)
        .matchAll(/<Regel n=\{(\d+)\}(?: tot=\{(\d+)\})?>([\s\S]*?)<\/Regel>/g))
        uitleg.push({ van: Number(r[1]), tot: Number(r[2] ?? r[1]), tekst: r[3] });
    }
    uit.push({ code: m[1], ervoor, uitleg });
  }
  return uit;
}

const noemt = (tekst: string, naam: string, module: string) =>
  [naam, module, module.split('.')[0]].some((w) => tekst.includes(`\`${w}\``));

/** Wijst dit blok de import-regel van `naam` aan, met een zin of een Regel die hem noemt? */
function wijstAan(blok: Blok, naam: string): boolean {
  const module = geimporteerd(blok.code).get(naam);
  if (!module) return false;
  if (importBlok(blok.code) && noemt(blok.ervoor, naam, module)) return true;
  const nr =
    blok.code
      .split('\n')
      .findIndex((r) => /^\s*from /.test(r) && new RegExp(`\\b${naam}\\b`).test(r)) + 1;
  return blok.uitleg.some((u) => u.van <= nr && nr <= u.tot && noemt(u.tekst, naam, module));
}

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
          const hier = blokkenMetContext(hoofdtekst(bron));
          const stand = bron.match(STAND)?.[1];
          // De eerste les van een project toont het hele bestand.
          const nieuwProject = bekend.size === 0;
          // Wat nieuw is: met een stand alles wat die stand nieuw importeert,
          // zonder stand (de uitbreidingen) elke naam uit de tabel die de
          // hoofdtekst voor het eerst gebruikt.
          const nieuw = new Set<string>();
          if (stand)
            for (const naam of geimporteerd(stand).keys()) if (!bekend.has(naam)) nieuw.add(naam);
          for (const blok of hier)
            for (const naam of gebruikt(blok.code).keys()) if (!bekend.has(naam)) nieuw.add(naam);
          // Een los script toont zijn eigen imports.
          for (const blok of hier.filter((b) => losScript(b.code) && !importBlok(b.code)))
            for (const naam of geimporteerd(blok.code).keys()) nieuw.delete(naam);
          if (!nieuwProject)
            for (const naam of nieuw)
              if (!hier.some((b) => wijstAan(b, naam)))
                fout.push(`${id}: ${naam} komt erbij zonder dat de les de import-regel aanwijst`);
          // Een blok met alleen imports toont de regel zoals hij in de stand staat.
          if (stand && !nieuwProject)
            for (const blok of hier.filter((b) => importBlok(b.code)))
              for (const [module, regel] of regels(blok.code))
                if (regels(stand).has(module) && regels(stand).get(module) !== regel)
                  fout.push(
                    `${id}: "${regel}" is niet de regel uit de stand: "${regels(stand).get(module)}"`,
                  );
          for (const naam of nieuw) bekend.add(naam);
          for (const blok of hier)
            for (const naam of geimporteerd(blok.code).keys()) bekend.add(naam);
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
