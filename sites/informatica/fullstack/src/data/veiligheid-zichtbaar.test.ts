import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De reeks Wat je server laat zien gaat over twee gaten die geen aanval
// nodig hebben: FastAPI zet uit zichzelf al je endpoints op /docs en
// /openapi.json, ook een vergeten GET /sessies, en een zip of een push neemt
// gastenboek.db en sessies.db mee. Deze test pint de kern van de reeks vast:
// het vergeten endpoint staat in het startbestand en is weg in de stand van de
// verdediging, de handleiding gaat op alle drie de adressen uit, en de
// .gitignore slaat elke database over.

const MAP = fileURLToPath(new URL('../../docs/veiligheid/zichtbaar', import.meta.url));
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
});
