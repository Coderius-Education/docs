import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// /registreer deed `db[naam] = …` zonder te kijken of de naam al bestond. Wie
// zich als sara registreerde, overschreef Sara's wachtwoord en kon als haar
// inloggen, buiten de controle op het oude wachtwoord uit les 7 om. In een
// reeks over veilige wachtwoorden namen leerlingen dat gat zo over. Elke
// versie van /registreer weigert daarom een naam die al bestaat.

const MAP = fileURLToPath(new URL('../../docs/veiligheid/wachtwoorden', import.meta.url));

const lessen = readdirSync(MAP)
  .filter((naam) => naam.endsWith('.mdx'))
  .map((naam) => ({ naam, tekst: readFileSync(join(MAP, naam), 'utf8') }));

const pythonBlokken = lessen.flatMap(({ naam, tekst }) =>
  [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => ({ naam, code: m[1] })),
);

const blokken = pythonBlokken.filter(({ code }) => code.includes('@app.post("/registreer")'));

// Het stuk van een blok vanaf een endpoint tot het volgende endpoint.
const endpoint = (code: string, kop: string) => {
  const begin = code.indexOf(kop);
  const eind = code.indexOf('\n@app.', begin + kop.length);
  return code.slice(begin, eind === -1 ? undefined : eind);
};

describe('registreren in de wachtwoordenreeks', () => {
  it('vindt de versies van /registreer', () => {
    expect(blokken.length).toBeGreaterThanOrEqual(5);
  });

  it.each(blokken.map((b, i) => [`${b.naam} #${i}`, b.code]))(
    '%s weigert een naam die al bestaat',
    (_, code) => {
      const registreer = endpoint(code, '@app.post("/registreer")');
      expect(registreer).toMatch(/if naam in db:\s+raise HTTPException\(status_code=400/);
      expect(code).toMatch(/from fastapi import [^\n]*HTTPException/);
    },
  );
});

// Het blok met /inloggen in les 6 importeerde `from fastapi import FastAPI,
// Form`, terwijl het main.py ernaast /registreer met HTTPException had. Wie die
// importregel overnam, kreeg een NameError bij de eerste dubbele naam. Een blok
// dat HTTPException gebruikt, importeert hem dus zelf. En omdat main.py in deze
// reeks vanaf les 1 /registreer met HTTPException heeft, houdt elke
// fastapi-importregel naast een endpoint HTTPException erin.
describe('imports in de wachtwoordenreeks', () => {
  const metImport = pythonBlokken.filter(
    ({ code }) => code.includes('@app.') && /^from fastapi import/m.test(code),
  );

  it.each(metImport.map((b, i) => [`${b.naam} #${i}`, b.code]))(
    '%s laat HTTPException niet uit de importregel van main.py vallen',
    (_, code) => {
      expect(code).toMatch(/^from fastapi import [^\n]*\bHTTPException\b/m);
    },
  );

  const metHttpException = pythonBlokken.filter(({ code }) => code.includes('HTTPException'));

  it('vindt blokken met HTTPException', () => {
    expect(metHttpException.length).toBeGreaterThanOrEqual(5);
  });

  it.each(metHttpException.map((b, i) => [`${b.naam} #${i}`, b.code]))(
    '%s importeert HTTPException uit fastapi',
    (_, code) => {
      expect(code).toMatch(/^from fastapi import [^\n]*\bHTTPException\b/m);
    },
  );
});

// /inloggen antwoordde bij een onbekende naam meteen (een paar milliseconden)
// en bij een bestaande naam pas na het trage ph.verify (zo'n 90 ms). De melding
// was gelijk, maar de tijd verraadde welke namen een account hadden. Elk
// endpoint dat ph.verify gebruikt, rekent daarom bij een onbekende naam ook een
// verify uit, tegen de nep-hash NEP, en laat die naam daarna niet binnen.
// Sinds de accounts in de basis (issue #126) staat in pogingen.mdx ook het
// /inloggen van het eigen gastenboek: dat noemt de database `gebruikers` en
// antwoordt met de 401 uit de basis in plaats van een dictionary. Ook die
// versie moet dezelfde tijd kosten, dus de test accepteert beide vormen.
describe('een onbekende naam kost even veel tijd', () => {
  const versies = pythonBlokken.flatMap(({ naam, code }) =>
    ['@app.post("/inloggen")', '@app.post("/wijzig")']
      .filter((kop) => code.includes(kop))
      .map((kop) => ({ naam, kop, code, stuk: endpoint(code, kop) }))
      .filter(({ stuk }) => stuk.includes('ph.verify')),
  );

  it('vindt de versies van /inloggen en /wijzig met ph.verify', () => {
    expect(versies.length).toBeGreaterThanOrEqual(5);
  });

  it.each(versies.map((v, i) => [`${v.naam} #${i} ${v.kop}`, v.code, v.stuk]))(
    '%s doet ook bij een onbekende naam een verify',
    (_, code, stuk) => {
      expect(stuk).toMatch(/\b(db|gebruikers)\.get\(naam, NEP\)/);
      expect(stuk).not.toMatch(/is None:\s+return/);
      expect(stuk).toMatch(
        /if opgeslagen == NEP:\s+(return \{"bericht": "Naam of wachtwoord klopt niet"\}|raise HTTPException\(status_code=401, detail="Naam of wachtwoord klopt niet"\))/,
      );
      // De controle op NEP staat na ph.verify, anders is de tijd weer ongelijk.
      expect(stuk.indexOf('if opgeslagen == NEP')).toBeGreaterThan(stuk.indexOf('ph.verify'));
      if (code.includes('app = FastAPI()')) {
        expect(code).toMatch(/^NEP = ph\.hash\(/m);
      }
    },
  );
});

// hash.mdx zei "Regel 9 wordt:", maar sinds de controle `if naam in db` erbij
// kwam, was dat regel 11. Wie regel 9 verving, kreeg een IndentationError. Een
// les noemt een regel daarom bij zijn inhoud, niet bij zijn nummer.
describe('regels bij hun inhoud', () => {
  it.each(lessen.map((l) => [l.naam, l.tekst]))('%s noemt geen regel bij nummer', (_, tekst) => {
    const proza = tekst.replace(/```[\s\S]*?```/g, '');
    expect(proza).not.toMatch(/\b[Rr]egels? \d+/);
  });
});

// Argon2 beschermt een gelekte database, maar /inloggen liet iedereen
// eindeloos proberen; de praktijk noemde een limiet alleen in een zin. Nu zet
// pogingen.mdx de limiet uit Te veel verzoeken op elk endpoint dat ph.verify
// doet, ook /wijzig: daar kon een script anders hetzelfde proberen. En
// @limiter.limit staat onder @app.post, want erboven telt slowapi stil niets.
describe('inlogpogingen beperken', () => {
  const pogingen = pythonBlokken.filter(({ naam }) => naam === 'pogingen.mdx');
  const stand = pogingen.find(({ code }) => code.includes('app = FastAPI()'))?.code ?? '';

  it('de stand van pogingen.mdx heeft een limiter', () => {
    expect(stand).toContain('limiter = Limiter(key_func=get_remote_address)');
    expect(stand).toContain('app.state.limiter = limiter');
    expect(stand).toMatch(/^from fastapi import [^\n]*\bRequest\b/m);
  });

  it.each(['@app.post("/inloggen")', '@app.post("/wijzig")'])(
    'in de stand heeft %s een limiet en request: Request',
    (kop) => {
      const stuk = endpoint(stand, kop);
      expect(stuk).toContain('ph.verify');
      expect(stuk).toMatch(
        /^@app\.post\("[^"]+"\)\n@limiter\.limit\("5\/minute"\)\nasync def \w+\(request: Request, /,
      );
    },
  );

  it('nergens in de cursus staat @limiter.limit boven @app., behalve in een FOUT-voorbeeld', () => {
    const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
    const alle = (map: string): string[] =>
      readdirSync(map, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory()
          ? alle(join(map, d.name))
          : /\.mdx?$/.test(d.name)
            ? [join(map, d.name)]
            : [],
      );
    const fout = alle(DOCS).flatMap((pad) =>
      [...readFileSync(pad, 'utf8').matchAll(/```python[^\n]*\n([\s\S]*?)```/g)]
        .map((m) => m[1].split('# GOED')[0])
        .filter(
          (code) => !code.startsWith('# FOUT') && /@limiter\.limit\([^)]*\)\n@app\./.test(code),
        )
        .map(() => pad),
    );
    expect(fout).toEqual([]);
  });
});
