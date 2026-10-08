import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De reeks Wat je server laat zien gaat over twee gaten die geen aanval
// nodig hebben: FastAPI zet uit zichzelf al je endpoints op /docs en
// /openapi.json, ook een vergeten GET /sessies, en een zip of een push neemt
// gastenboek.db en sessies.db mee. Deze test pint de kern van de reeks vast:
// het vergeten endpoint staat in het startbestand en is weg in de stand van de
// verdediging, de handleiding gaat op alle drie de adressen uit, en de
// .gitignore slaat elke database over.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const MAP = join(DOCS, 'veiligheid/zichtbaar');
const lees = (stap: string) => readFileSync(join(MAP, `${stap}.mdx`), 'utf8');
const blokken = (tekst: string, taal = 'python') =>
  [...tekst.matchAll(new RegExp(`\`\`\`${taal}[^\\n]*\\n([\\s\\S]*?)\`\`\``, 'g'))].map(
    (m) => m[1],
  );
const stand = (tekst: string) =>
  blokken(tekst.slice(tekst.indexOf('<summary>Zo ziet je `main.py` er nu uit')))[0] ?? '';

describe('Wat je server laat zien', () => {
  it('het startbestand heeft het vergeten GET /sessies uit Sessies', () => {
    const start = blokken(lees('handleiding')).find((b) => b.includes('app = FastAPI()')) ?? '';
    expect(start).toContain('@app.get("/sessies")');
    expect(start).toContain('return dict(sessies)');
  });

  it('de verdediging zet alle drie de adressen uit en haalt het endpoint weg', () => {
    const tekst = lees('uitzetten');
    const code = stand(tekst);
    expect(code).toContain('app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)');
    expect(code).not.toContain('/sessies');
    // Alleen uitzetten is verstoppen: de les laat zien dat /sessies dan nog
    // een 200 geeft, en daarna een 404.
    expect(tekst).toContain('/sessies 200');
    expect(tekst).toContain('/sessies 404');
    expect(tekst).toContain('<VerzoekCyclus variant="zichtbaar" />');
  });

  it('de .gitignore slaat elke database, .venv en __pycache__ over', () => {
    const gitignore = blokken(lees('gitignore'), '').find((b) => b.includes('*.db')) ?? '';
    expect(gitignore.trim().split('\n')).toEqual(['.venv/', '__pycache__/', '*.db']);
  });

  it('een les noemt geen netwerkadres van een ander als link', () => {
    // Na Laat het zien kan een klasgenoot bij /docs; de les zegt dat in
    // woorden, zonder een adres als 192.168.… dat een leerling zou proberen.
    for (const stap of ['handleiding', 'vergeten', 'uitzetten', 'bestanden', 'gitignore']) {
      expect(lees(stap), stap).not.toMatch(/\b(?:192\.168|10\.\d+|172\.\d+)\.\d+\.\d+/);
    }
  });

  it('een les die alle sessies print, noemt de sessie uit opdracht 2 van les 1', () => {
    // Execute op /docs in opdracht 2 van les 1 maakt een sessie op de naam van
    // de leerling. sessies.py en lees_sessies.py printen daarna drie regels,
    // niet de twee van Sara en Alex.
    for (const stap of ['vergeten', 'bestanden']) {
      expect(lees(stap), stap).toContain('opdracht 2 van [les 1](./handleiding)');
    }
  });

  it('Er gaat iets mis bij sessies.py zoekt het in de map van de server', () => {
    // twee.py en sessies.py praten via HTTP; in welke map het script staat,
    // maakt niet uit. Een lege lijst komt van de map waarin de server draait.
    const sectie =
      lees('vergeten')
        .split(/^## Er gaat iets mis\s*$/m)[1]
        ?.split(/^## /m)[0] ?? '';
    expect(sectie).not.toMatch(/`twee\.py`, in dezelfde map/);
    expect(sectie).toContain('via HTTP');
    expect(sectie).toContain('de map waarin je hem start');
  });

  it('de regel met set_cookie in het startbestand wijst naar Cookies afschermen', () => {
    // httponly en samesite staan in het startbestand, maar Sessies had alleen
    // max_age; de uitleg komt later, in de reeks Cookies afschermen.
    const tekst = lees('handleiding');
    const start = blokken(tekst).find((b) => b.includes('app = FastAPI()')) ?? '';
    const regel = start.split('\n').findIndex((r) => r.includes('set_cookie')) + 1;
    expect(regel).toBeGreaterThan(0);
    const uitleg = [...tekst.matchAll(/<Regel n=\{(\d+)\}(?: tot=\{(\d+)\})?>([\s\S]*?)<\/Regel>/g)]
      .filter((m) => Number(m[1]) <= regel && regel <= Number(m[2] ?? m[1]))
      .map((m) => m[3])
      .join('\n');
    expect(uitleg).toContain('httponly');
    expect(uitleg).toContain('/docs/veiligheid/cookies/httponly');
  });

  it('een opdracht gebruikt geen Client die na het script niet meer bestaat', () => {
    // Een httpx.Client leeft zolang twee.py draait; daarna is Sara's cookie weg.
    expect(lees('bestanden')).not.toMatch(/`Client` uit `twee\.py`/);
  });

  it('een PowerShell-regel staat nooit in een bash-blok', () => {
    // $env:WEER_SLEUTEL stond in een ```bash-blok; wie macOS of Linux heeft,
    // krijgt dan een commando dat zijn shell niet kent.
    const fout: string[] = [];
    const lijst = (map: string): string[] =>
      readdirSync(map).flatMap((naam) => {
        const pad = join(map, naam);
        if (statSync(pad).isDirectory()) return lijst(pad);
        return /\.mdx?$/.test(naam) ? [pad] : [];
      });
    for (const pad of lijst(DOCS)) {
      for (const m of readFileSync(pad, 'utf8').matchAll(
        /```(?:bash|sh|shell|zsh)\b[^\n]*\n([\s\S]*?)```/g,
      )) {
        if (m[1].includes('$env:')) fout.push(relative(DOCS, pad));
      }
    }
    expect(fout).toEqual([]);
  });
});
