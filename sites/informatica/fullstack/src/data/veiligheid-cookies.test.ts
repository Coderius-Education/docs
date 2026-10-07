import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Een leerling-doorloop van de reeks Cookies afschermen vond vijf fouten die
// elk een leerling op het verkeerde been zetten:
// - Een sessie "verliep" met max_age. Dat gooit alleen de cookie in de browser
//   weg; sessies.db had geen tijd, en een gekopieerd sessie-id bleef eeuwig
//   geldig. De server bewaart nu zelf een tijd in de sessie en vergelijkt die.
// - /uitloggen was in Cookie of sessie? een GET. Met samesite=lax gaat de
//   cookie mee bij een link vanaf een andere site, dus die link logde je uit.
// - De uitlogtest gaf dezelfde uitvoer met en zonder de sessie op de server
//   weg te gooien. Nu stuurt het script het oude sessie-id zelf mee.
// - samesite.mdx zei "zet het in je code", maar de standen erna misten het.
// - Opdracht 1 van les 1 linkte voor SameSite naar de praktijk, en noemde de
//   Reactieheaders van Chrome "antwoordkoppen".

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const COOKIES = join(DOCS, 'veiligheid/cookies');

const lees = (stap: string) => readFileSync(join(COOKIES, `${stap}.mdx`), 'utf8');
const pythonBlokken = (tekst: string) =>
  [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);
const zonderUitklap = (tekst: string) => tekst.replace(/<details>[\s\S]*?<\/details>/g, '');

function alleDocs(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return alleDocs(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

type Categorie = { type: string; items: string[] };
const stappen = (
  (sidebars.veiligheidSidebar as unknown as (string | Categorie)[]).find(
    (c): c is Categorie => typeof c !== 'string' && c.items[0]?.startsWith('veiligheid/cookies/'),
  )?.items ?? []
).map((id) => id.slice('veiligheid/cookies/'.length));

describe('de reeks Cookies afschermen', () => {
  it('vindt de lessen in de sidebar', () => {
    expect(stappen).toContain('samesite');
    expect(stappen).toContain('uitloggen');
  });

  it('nergens in de cursus is uitloggen een GET', () => {
    const fout = alleDocs(DOCS).filter((pad) =>
      /@app\.get\(\s*["']\/uitloggen/.test(readFileSync(pad, 'utf8')),
    );
    expect(fout).toEqual([]);
  });

  it('Cookie of sessie? logt uit met een formulier dat post', () => {
    const tekst = readFileSync(join(DOCS, 'FastAPI/cookie-of-sessie.mdx'), 'utf8');
    expect(tekst).toContain('@app.post("/uitloggen")');
    expect(tekst).toContain('<form method="post" action="/uitloggen">');
  });

  it('een sessie verloopt op de server, in de hoofdtekst van uitloggen', () => {
    const code = pythonBlokken(zonderUitklap(lees('uitloggen'))).join('\n');
    // De tijd gaat in de sessie. Eerst gebeurde dat bij elk bericht
    // (mijn["tot"] = …); sinds de accounts uit de basis (issue #126) maakt
    // alleen /inloggen een sessie, dus daar komt "tot" in de nieuwe sessie ...
    expect(code).toMatch(/"tot": time\.time\(\)\s*\+/);
    expect(code).toContain('@app.post("/inloggen")');
    // ... en bij het uitlezen vergelijkt de server hem met nu en gooit hij
    // een verlopen sessie weg.
    expect(code).toMatch(/\.get\("tot"[^)]*\)\s*<\s*time\.time\(\)/);
    expect(code).toMatch(/< time\.time\(\):\s+del sessies\[sessie_id\]/);
  });

  it('de stand van uitloggen controleert de tijd in elk endpoint dat de sessie leest', () => {
    const tekst = lees('uitloggen');
    const stand = tekst.slice(tekst.indexOf('<summary>Zo ziet je `main.py` er nu uit'));
    const code = pythonBlokken(stand)[0] ?? '';
    expect(code).toContain('app = FastAPI()');
    for (const endpoint of ['bericht_plaatsen', 'bericht_verwijderen', 'alles_wissen']) {
      const begin = code.indexOf(`async def ${endpoint}(`);
      expect(begin, endpoint).toBeGreaterThan(-1);
      const romp = code.slice(begin, code.indexOf('@app.', begin));
      expect(romp, endpoint).toContain('sessie_ophalen(sessie_id)');
    }
  });

  it('de uitlogtest stuurt het oude sessie-id zelf mee', () => {
    // Met alleen delete_cookie gaf de oude test ook 403: de client had geen
    // cookie meer. Een dief met het bewaarde id krijgt nu 403, en op de foute
    // versie 200.
    const tekst = lees('uitloggen');
    expect(tekst).toMatch(/cookies=\{"sessie_id": oud_id\}/);
    expect(tekst).toContain('Met het oude sessie-id: 403');
  });

  it('elke sessie-cookie na samesite.mdx zet samesite', () => {
    const na = stappen.slice(stappen.indexOf('samesite'));
    expect(na.length).toBeGreaterThan(1);
    for (const stap of na) {
      for (const code of pythonBlokken(lees(stap))) {
        for (const m of code.matchAll(/set_cookie\(([\s\S]*?)\)/g)) {
          if (!m[1].includes('sessie_id')) continue;
          expect(m[1], stap).toContain('samesite="lax"');
        }
      }
    }
  });

  it('les 1 verwijst voor SameSite naar de les over samesite, en noemt de Reactieheaders', () => {
    const tekst = lees('zwakheid');
    expect(tekst).toContain('](./samesite)');
    expect(tekst).toContain('**Reactieheaders**');
    expect(tekst).not.toContain('antwoordkoppen');
  });

  it('het startbestand heeft Alles wissen uit Wie mag wat, les 4', () => {
    const code = pythonBlokken(lees('zwakheid')).find((b) => b.includes('app = FastAPI()')) ?? '';
    expect(code).toContain('@app.delete("/berichten")');
  });

  it('de praktijk heeft het CSRF-token als uitklapblok, en samesite wijst ernaar', () => {
    // CSRF stond alleen als uitleg in samesite. Een eigen les met een token
    // past niet: met lax is de aanval op de eigen server niet te zien. Wie
    // meer wil, vindt de code in de praktijk; compare_digest krijgt bytes,
    // want met een str als "é" geeft hij een TypeError en de server een 500.
    const tekst = lees('praktijk');
    const blok = tekst.slice(tekst.indexOf('(CSRF-token)</summary>'));
    const csrf = blok.slice(0, blok.indexOf('</details>'));
    expect(csrf).toContain('<input type="hidden" name="token" value="{{ token }}">');
    expect(csrf).toContain('secrets.token_hex(16)');
    expect(csrf).toMatch(/secrets\.compare_digest\(token\.encode\(\), [^)]*\)\.encode\(\)\)/);
    expect(csrf).toContain('status_code=403');
    expect(lees('samesite')).toContain('](./praktijk)');
  });
});
