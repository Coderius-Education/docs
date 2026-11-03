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
// - Opdracht 1 van les 2 linkte voor SameSite naar de praktijk, en noemde de
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
    expect(stappen).toContain('verlopen');
  });

  it('nergens in de cursus is uitloggen een GET', () => {
    const fout = alleDocs(DOCS).filter((pad) =>
      /@app\.get\(\s*["']\/uitloggen/.test(readFileSync(pad, 'utf8')),
    );
    expect(fout).toEqual([]);
  });

  it('Cookie of sessie? logt uit met een formulier dat post', () => {
    const tekst = readFileSync(join(DOCS, 'FastAPI/onthouden/cookie-of-sessie.mdx'), 'utf8');
    expect(tekst).toContain('@app.post("/uitloggen")');
    expect(tekst).toContain('<form method="post" action="/uitloggen">');
  });

  // Uitloggen en een sessie laten verlopen stonden samen in uitloggen.mdx
  // (1518 woorden, twee ideeën in één les). Het verlopen staat nu in een eigen
  // les, verlopen.mdx, direct na uitloggen; deze twee tests kijken daarom
  // daar.
  it('een sessie verloopt op de server, in de hoofdtekst van verlopen', () => {
    const code = pythonBlokken(zonderUitklap(lees('verlopen'))).join('\n');
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

  it('de stand van verlopen controleert de tijd in elk endpoint dat de sessie leest', () => {
    const tekst = lees('verlopen');
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

  it('set-cookie bekijken staat één keer, in de hoofdtekst van samesite, met de Reactieheaders', () => {
    // De PR zette set-cookie bekijken in de hoofdtekst van samesite, maar les 2
    // hield dezelfde stap als opdracht 1: de leerling deed hem twee keer, en de
    // Gelukt van samesite ("hetzelfde als eerst") wees naar die opdracht. Les 2
    // laat nu zien wat iemand met het gekopieerde getal kan.
    const samesite = zonderUitklap(lees('samesite'));
    expect(samesite).toContain('**Reactieheaders**');
    expect(samesite).toContain('`set-cookie`');
    expect(lees('zwakheid')).not.toContain('set-cookie');
    expect(lees('zwakheid')).toMatch(/cookies=\{"sessie_id": gestolen\}/);
    for (const stap of stappen) expect(lees(stap), stap).not.toContain('antwoordkoppen');
  });

  it('het startbestand heeft Alles wissen uit Wie mag wat, les 5', () => {
    const code = pythonBlokken(lees('formulier')).find((b) => b.includes('app = FastAPI()')) ?? '';
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
    expect(lees('samesite')).toContain('](site:fullstack/docs/veiligheid/cookies/praktijk)');
  });

  // Uit de leerling-doorloop van oktober 2026.
  it('uitloggen gaat over uitloggen, verlopen over de tijd', () => {
    // Na de splitsing hoort sessie_ophalen niet meer in uitloggen, en komt
    // verlopen direct na uitloggen.
    expect(stappen.indexOf('verlopen')).toBe(stappen.indexOf('uitloggen') + 1);
    expect(lees('uitloggen')).not.toContain('sessie_ophalen');
    expect(lees('uitloggen')).toContain('](site:fullstack/docs/veiligheid/cookies/verlopen)');
  });

  it('de scripts van uitloggen en verlopen zeggen eerst welke databases weg moeten', () => {
    // uitloggen.py en verlopen.py registreren Sara met zon123. Bestond ze al
    // met een ander wachtwoord, dan gaf het inloggen 401 en het script
    // KeyError: 'sleutel', zonder dat de les zei waarom.
    for (const [stap, script] of [
      ['uitloggen', 'oud_id = '],
      ['verlopen', 'mijn["tot"] = time.time() - 1'],
    ]) {
      const tekst = lees(stap);
      const ervoor = tekst.slice(0, tekst.indexOf(script));
      const laatsteTest = ervoor.slice(ervoor.lastIndexOf('## Doe de test'));
      for (const db of ['gastenboek.db', 'sessies.db', 'gebruikers.db']) {
        expect(laatsteTest, `${stap}: ${db}`).toContain(db);
      }
    }
  });

  it('de scripts van uitloggen en verlopen hebben uitleg per regel', () => {
    for (const [stap, script] of [
      ['uitloggen', 'oud_id = '],
      ['verlopen', 'mijn["tot"] = time.time() - 1'],
    ]) {
      const blokken = [...lees(stap).matchAll(/<CodeUitleg>([\s\S]*?)<\/CodeUitleg>/g)];
      expect(
        blokken.some((m) => m[1].includes(script)),
        stap,
      ).toBe(true);
    }
  });

  it('cookies van eerdere projecten op 127.0.0.1 staan erbij, met hoe je ze kwijtraakt', () => {
    // Een cookie hoort bij 127.0.0.1, niet bij de map of de poort. Wie eerder
    // Onthouden met een cookie deed, zag na httponly geen '' maar
    // 'naam=sara; volgorde=nieuw', en dacht dat httponly niet werkte.
    const tekst = `${lees('zwakheid')}\n${lees('httponly')}`.replace(/\s+/g, ' ');
    expect(tekst).toMatch(/eerdere projecten/);
    expect(tekst).toMatch(/hoort bij het adres `127\.0\.0\.1`, niet bij de map of de poort/);
    expect(tekst).toMatch(/privévenster|tabblad \*\*App\*\*/);
  });

  it('kleine punten uit de doorloop', () => {
    // Het kwartier kwam nergens vandaan (GELDIG is 30 dagen), de test print
    // over een Client in een script, niet over een browser, en de GET-versie
    // van /uitloggen uit Cookie of sessie? bestaat niet meer.
    expect(lees('verlopen')).not.toContain('Een kwartier of dertig dagen');
    expect(lees('verlopen')).not.toContain('Cookie nog in de browser');
    expect(lees('eigen-project')).not.toMatch(/versie met `@app\.get`/);
    // De tekst zet sessie_ophalen waar de stand hem heeft: onder app.mount.
    expect(lees('verlopen')).toContain('Zet onder `app.mount(...)` een functie');
    // De httponly-les toont een formulier dat niets kan verwijderen.
    expect(lees('httponly')).not.toContain('verwijderverzoek');
    // samesite zegt waar de set_cookie hoort.
    expect(lees('samesite')).toMatch(/Vervang in `inloggen` de `set_cookie`/);
  });

  // Uit de leerling-doorloop van november 2026 (PR #169).
  it('samesite zegt dat de poort niet meetelt, en de praktijk belooft niet dat lax op 127.0.0.1 dicht is', () => {
    // Nagedraaid in Chromium: een formulier op 127.0.0.1:8213 dat naar
    // 127.0.0.1:8203/bericht post, stuurt de lax-cookie mee (het bericht komt
    // er op jouw naam in); vanaf localhost:8213 komt het zonder cookie aan.
    // Wie een "andere site" op een andere poort bouwde, zag het tegendeel van
    // de tabel, en de praktijk zei dat je daarvoor samesite="none" nodig had.
    const mis = lees('samesite').split('\n## Er gaat iets mis\n')[1] ?? '';
    expect(mis).toMatch(/### [^\n]*poort/);
    expect(mis).toContain('localhost');
    const csrf = lees('praktijk').replace(/\s+/g, ' ');
    expect(csrf).toMatch(/andere poort telt niet/);
  });

  it('verlopen noemt de fout als sessie_ophalen zichzelf aanroept', () => {
    // sessie_ophalen bevat dezelfde twee regels als het with-blok dat in drie
    // endpoints vervangen wordt. Met "alles vervangen" staat er in de functie
    // mijn = sessie_ophalen(sessie_id) met de rest nog ingesprongen: fastapi
    // dev stopt met IndentationError. Wie alleen de inspringing herstelt,
    // krijgt RecursionError in de terminal en een 500 bij /bericht.
    const mis = lees('verlopen').split('\n## Er gaat iets mis\n')[1] ?? '';
    expect(mis).toMatch(/### IndentationError in `sessie_ophalen`/);
    expect(mis).toContain('IndentationError: unexpected indent');
    expect(mis).toContain('RecursionError: maximum recursion depth exceeded');
  });

  it('na het weggooien van gebruikers.db laat een opdracht niet zomaar "log in" doen', () => {
    // Uitloggen en verlopen laten de databases weggooien, en een opdracht zei
    // daarna "log in": dat gaf 401, want het account uit les 1 bestond niet
    // meer. Zo'n opdracht zegt nu dat je eerst een account maakt.
    const fout: string[] = [];
    for (const stap of stappen) {
      const proza = lees(stap)
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/\s+/g, ' ');
      const opdrachten = proza.split('## Opdrachten')[1] ?? '';
      const hoofdtekst = lees(stap).replace(/\s+/g, ' ').split('## Opdrachten')[0];
      if (!/Gooi (?:(?!\. ).)*`gebruikers\.db` weg/.test(hoofdtekst)) continue;
      for (const opdracht of opdrachten.split('### ').slice(1)) {
        if (/\blog (?:\w+ )?in\b/i.test(opdracht) && !/account/.test(opdracht))
          fout.push(`${stap}: ${opdracht.slice(0, 60)}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('de praktijk zegt dat de tot vanaf het inloggen telt, niet vanaf de laatste activiteit', () => {
    const tekst = lees('praktijk').replace(/\s+/g, ' ');
    expect(tekst).toContain('telt vanaf het inloggen');
    expect(tekst).not.toContain('nog twee dingen');
  });
});
