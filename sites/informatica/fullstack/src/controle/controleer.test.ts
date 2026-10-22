import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES_BY_ID } from '@coderius/shared/sites';
import { createSlugger } from '@docusaurus/utils';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// static/controleer.py kijkt de draaiende server van een leerling na, per
// hoofdstuk van de basis, en wijst bij elke fout naar de uitleg. Het script
// draait bij de leerling, buiten de site, dus de links erin zijn volledige
// URL's en de hoofdstukken een eigen lijst. Deze test houdt die gelijk met de
// registry, de docs en sidebars.ts. Of de controles zelf kloppen, draait
// draai.py met uvicorn tegen het referentieproject en een kapotte kopie (job
// fullstack in CI).

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');
const SCRIPT = readFileSync(join(SITE, 'static/controleer.py'), 'utf8');
const REFERENTIE = join(SITE, 'src/controle/referentie');

/** De regels van een dictionary-literal `NAAM = { ... }` in het script. */
function dictUitScript(naam: string): [string, string][] {
  const blok = SCRIPT.split(`\n${naam} = {\n`)[1]?.split('\n}\n')[0];
  if (!blok) throw new Error(`${naam} niet gevonden in controleer.py`);
  return [...blok.matchAll(/^\s*"([^"]+)":\s*(?:"([^"]*)"|(\w+)),?$/gm)].map((m) => [
    m[1],
    m[2] ?? m[3],
  ]);
}

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const api = sidebars.apiSidebar as unknown as Item[];
const basis = api
  .slice(
    0,
    api.findIndex((i) => typeof i !== 'string' && i.label.startsWith('Uitbreiding:')),
  )
  .filter((i): i is Exclude<Item, string> => typeof i !== 'string');

const lesTekst = (id: string) => readFileSync(join(DOCS, `${id}.mdx`), 'utf8');
const STAND = /<summary>Zo ziet je `main\.py` er nu uit<\/summary>[\s\S]*?```python\n([\s\S]*?)```/;

// Een categorie heeft een server als een van haar lessen een stand van
// main.py met een endpoint heeft; SqliteDict (losse scripts) heeft dat niet.
const metServer = basis
  .filter((c) => plat(c.items).some((id) => STAND.exec(lesTekst(id))?.[1].includes('@app.')))
  .map((c) => ({ map: plat(c.items)[0].split('/')[1], label: c.label }));

describe('controleer.py en de cursus', () => {
  it('elk hoofdstuk wijst een leerling naar het script, in een eigen les', () => {
    // Een tip vlak voor de opdrachten, in de laatste les van het hoofdstuk
    // met een eigen stand van main.py. Zonder zo'n tip vindt een leerling
    // het script alleen als hij toevallig op Project checken komt.
    for (const c of basis) {
      const map = plat(c.items)[0].split('/')[1];
      if (!metServer.some((m) => m.map === map)) continue;
      const tip = new RegExp(
        String.raw`:::tip\[Controleer je server\]\n[^\n]*\x60python controleer\.py ${map}\x60[^\n]*\(site:fullstack/project-checken#je-server-controleren\)`,
      );
      expect(
        plat(c.items).filter((id) => tip.test(lesTekst(id))),
        map,
      ).toHaveLength(1);
    }
  });

  it('de basis-URL is die van de registry', () => {
    const cursus = SCRIPT.match(/^CURSUS = "([^"]+)"$/m)?.[1];
    expect(`${cursus}/`).toBe(SITES_BY_ID.fullstack.url);
  });

  it('de hoofdstukken zijn de categorieën van de basis met een server, in volgorde', () => {
    expect(metServer.map((c) => c.map)).not.toContain('sqlitedict');
    expect(dictUitScript('HOOFDSTUKKEN')).toEqual(metServer.map((c) => [c.map, c.label]));
    expect(dictUitScript('CONTROLES').map(([k]) => k)).toEqual(metServer.map((c) => c.map));
  });

  it('elke link wijst naar een bestaande pagina en een kop die erop staat', () => {
    const fout: string[] = [];
    for (const [sleutel, doel] of dictUitScript('UITLEG')) {
      const [pad, anker] = doel.split('#');
      if (!pad.startsWith('docs/')) {
        fout.push(`${sleutel}: ${pad} begint niet met docs/`);
        continue;
      }
      const bestand = ['.mdx', '.md']
        .map((ext) => join(SITE, `${pad}${ext}`))
        .find((b) => existsSync(b));
      if (!bestand) {
        fout.push(`${sleutel}: geen pagina ${pad}`);
        continue;
      }
      const tekst = readFileSync(bestand, 'utf8');
      if (/^slug:/m.test(tekst)) fout.push(`${sleutel}: ${pad} heeft een eigen slug`);
      if (!anker) {
        fout.push(`${sleutel}: ${pad} zonder anker`);
      } else if (!ankers(tekst).includes(anker)) {
        fout.push(`${sleutel}: geen kop #${anker} op ${pad}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('elke link in UITLEG wordt gebruikt', () => {
    const naUitleg = SCRIPT.split('\nWACHTTIJD = ')[1];
    const ongebruikt = dictUitScript('UITLEG')
      .map(([k]) => k)
      .filter((k) => !naUitleg.includes(`"${k}"`));
    expect(ongebruikt).toEqual([]);
  });

  it('de pagina Project checken linkt naar het script, met de baseUrl', () => {
    const pagina = readFileSync(join(SITE, 'src/pages/project-checken.mdx'), 'utf8');
    expect(pagina).toContain("useBaseUrl('/controleer.py')");
    for (const { map } of metServer) expect(pagina).toContain(`\`${map}\``);
  });
});

/** De ankers van de koppen op een pagina, zoals Docusaurus ze maakt. */
function ankers(tekst: string): string[] {
  const slugger = createSlugger();
  const uit: string[] = [];
  let inCode = false;
  for (const regel of tekst.split('\n')) {
    if (/^\s*```/.test(regel)) inCode = !inCode;
    if (inCode) continue;
    const m = regel.match(/^#{1,6}\s+(.*?)\s*$/);
    if (!m) continue;
    const vast = m[1].match(/\\?\{#([^}]+)\}$/);
    if (vast) {
      uit.push(vast[1]);
      continue;
    }
    const kaal = m[1]
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*_]/g, '')
      .trim();
    uit.push(slugger.slug(kaal));
  }
  return uit;
}

// Het referentieproject is het eindproject van de basis, letterlijk uit de
// lessen: main.py is de laatste stand, en elk ander bestand de laatste
// volledige versie die een les in de hoofdtekst toont (met <Bestand pad=…>).
describe('het referentieproject volgt de lessen', () => {
  const lessen = basis.flatMap((c) => plat(c.items));
  const laatste = new Map<string, string>();
  let stand = '';
  for (const id of lessen) {
    const tekst = lesTekst(id);
    stand = STAND.exec(tekst)?.[1] ?? stand;
    const hoofd = tekst.split('\n## Opdrachten\n')[0];
    for (const m of hoofd.matchAll(
      /<Bestand pad="([^"]+)" \/>\s*\n(?:\{\/\*[^\n]*\*\/\}\s*\n)?```(\w+)[^\n]*\n([\s\S]*?)```/g,
    )) {
      const [, pad, taal, code] = m;
      if (pad === 'main.py') continue;
      if (taal === 'html' && !code.trimStart().startsWith('<!DOCTYPE')) continue;
      laatste.set(pad, code);
    }
  }

  const bestanden = (map: string): string[] =>
    readdirSync(map).flatMap((naam) => {
      const pad = join(map, naam);
      return statSync(pad).isDirectory() ? bestanden(pad) : [relative(REFERENTIE, pad)];
    });

  it('main.py is de laatste stand uit de basis', () => {
    expect(readFileSync(join(REFERENTIE, 'main.py'), 'utf8')).toBe(stand);
  });

  it('elk ander bestand is de laatste volledige versie uit de lessen', () => {
    const eigen = bestanden(REFERENTIE)
      .map((p) => p.split('\\').join('/'))
      .filter((p) => p !== 'main.py' && p !== 'static/kat.jpg')
      .sort();
    expect(eigen).toEqual([...laatste.keys()].sort());
    for (const [pad, code] of laatste) {
      expect(readFileSync(join(REFERENTIE, pad), 'utf8'), pad).toBe(code);
    }
  });
});
