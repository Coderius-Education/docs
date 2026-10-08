import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Issue #126: het gastenboek kreeg accounts. Iedereen typte zelf een naam, en
// wie "Sara" intypte, was Sara. Nu maakt de basis een account
// (registreren.mdx) en controleert het gastenboek het wachtwoord bij elk
// bericht (inloggen.mdx). Een server in de basis onthoudt niemand tussen twee
// verzoeken; één keer inloggen komt pas met Sessies. Deze test houdt drie
// dingen vast: waar de lessen staan, dat elke registratie een bestaande naam
// weigert en elk bericht na Inloggen een wachtwoord nodig heeft, en dat de
// lessen eerlijk zeggen wat nog niet veilig is.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const zijbalk = sidebars.apiSidebar as unknown as Item[];
const lessen = plat(zijbalk);
const tekst = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
const blokken = (bron: string, taal: string) =>
  [...bron.matchAll(new RegExp(`\`\`\`${taal}[^\\n]*\\n([\\s\\S]*?)\`\`\``, 'g'))].map((m) => m[1]);
const hoofdtekst = (id: string) =>
  tekst(id)
    .split(/\n## Opdrachten\n/)[0]
    .replace(/<details>[\s\S]*?<\/details>/g, '');

// Het stuk van een blok vanaf een endpoint tot het volgende endpoint.
const endpoint = (code: string, kop: string) => {
  const begin = code.indexOf(kop);
  const eind = code.indexOf('\n@app.', begin + kop.length);
  return code.slice(begin, eind === -1 ? undefined : eind);
};

function alleDocs(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return alleDocs(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

describe('accounts in de basis', () => {
  it('Registreren en Inloggen zijn de categorie Accounts, direct na Opslaan en tonen in je server', () => {
    const labels = zijbalk.map((i) => (typeof i === 'string' ? i : i.label));
    const plek = labels.indexOf('Accounts');
    expect(labels[plek - 1]).toBe('Opslaan en tonen in je server');
    const categorie = zijbalk[plek] as Exclude<Item, string>;
    expect(plat(categorie.items)).toEqual([
      'FastAPI/accounts/registreren',
      'FastAPI/accounts/inloggen',
    ]);
  });

  it('beide lessen hebben het hele main.py, met de nieuwe endpoints', () => {
    for (const [id, kop] of [
      ['FastAPI/accounts/registreren', '@app.post("/registreer")'],
      ['FastAPI/accounts/inloggen', 'wachtwoord: str = Form(...)'],
    ]) {
      const stand = tekst(id).match(
        /<summary>Zo ziet je `main\.py` er nu uit<\/summary>[\s\S]*?```python\n([\s\S]*?)```/,
      )?.[1];
      expect(stand, id).toContain('app = FastAPI()');
      expect(stand, id).toContain(kop);
    }
  });

  it('het wachtwoordveld is een type="password" met de naam van de parameter', () => {
    for (const id of ['FastAPI/accounts/registreren', 'FastAPI/accounts/inloggen']) {
      const html = blokken(hoofdtekst(id), 'html').join('\n');
      expect(html, id).toContain('<input type="password" name="wachtwoord"');
    }
  });
});

describe('elke registratie weigert een naam die al bestaat', () => {
  // Zonder die controle overschrijft een tweede registratie als sara het
  // wachtwoord van Sara. wachtwoorden.test.ts bewaakt dat in de reeks; dit is
  // dezelfde eis voor de hele cursus, de basis meegeteld.
  const versies = alleDocs(DOCS).flatMap((pad) =>
    blokken(readFileSync(pad, 'utf8'), 'python')
      .filter((b) => b.includes('@app.post("/registreer")'))
      .map((b) => ({
        pad: pad.slice(DOCS.length + 1),
        stuk: endpoint(b, '@app.post("/registreer")'),
      })),
  );

  it('vindt de versies, ook in de basis', () => {
    expect(versies.some((v) => v.pad === 'FastAPI/accounts/registreren.mdx')).toBe(true);
  });

  it.each(versies.map((v, i) => [`${v.pad} #${i}`, v.stuk]))('%s', (_, stuk) => {
    expect(stuk).toMatch(/if naam in \w+:\s+raise HTTPException\(status_code=400/);
  });
});

// Eerst gold dit alleen voor de basis. Nu de uitbreidingen op de accounts
// aansluiten, geldt het voor elke les na Inloggen: een vervangend POST
// /gastenboek (het htmx-recept, Cookies, Sessies) liet de controle anders
// stil vallen, en dan kon iedereen weer onder elke naam schrijven.
describe('na Inloggen heeft elk bericht een wachtwoord of een sessie nodig', () => {
  const vanaf = lessen.slice(lessen.indexOf('FastAPI/accounts/inloggen'));
  const versies = vanaf.flatMap((id) =>
    blokken(tekst(id), 'python')
      .filter((b) => b.includes('@app.post("/gastenboek")'))
      .map((b) => ({ id, stuk: endpoint(b, '@app.post("/gastenboek")') }))
      .filter(({ stuk }) => stuk.includes('SqliteDict("gastenboek.db")')),
  );
  const opslaan = (stuk: string) => stuk.indexOf('SqliteDict("gastenboek.db")');

  it('vindt de lessen en de versies, ook in de uitbreidingen', () => {
    expect(vanaf[0]).toBe('FastAPI/accounts/inloggen');
    expect(versies.map((v) => v.id)).toEqual(
      expect.arrayContaining([
        'FastAPI/accounts/inloggen',
        'FastAPI/zonder-herladen/htmx-overzicht',
        'FastAPI/onthouden/cookies',
        'FastAPI/onthouden/sessies',
      ]),
    );
  });

  it.each(versies.map((v, i) => [`${v.id} #${i}`, v.stuk]))(
    '%s controleert vóór het opslaan het wachtwoord of de sessie',
    (_, stuk) => {
      const wachtwoord = stuk.includes('gebruikers.get(naam)');
      const sessie = stuk.includes('sessies.get(sessie_id') && stuk.includes('mijn["naam"]');
      expect(wachtwoord || sessie).toBe(true);
      const controle = stuk.indexOf('status_code=401');
      expect(controle).toBeGreaterThan(-1);
      expect(controle).toBeLessThan(opslaan(stuk));
    },
  );

  it('vanaf Sessies komt de naam bij een bericht uit de sessie, niet uit het formulier', () => {
    const naSessies = versies.filter(
      ({ id }) => lessen.indexOf(id) >= lessen.indexOf('FastAPI/onthouden/sessies'),
    );
    expect(naSessies.length).toBeGreaterThan(0);
    for (const { id, stuk } of naSessies) {
      expect(stuk, id).not.toContain('naam: str = Form(');
      expect(stuk, id).toContain('{"naam": mijn["naam"]');
    }
  });

  it('Sessies maakt de sessie in /inloggen, pas nadat het wachtwoord klopt', () => {
    const code = blokken(hoofdtekst('FastAPI/onthouden/sessies'), 'python').join('\n');
    const inloggen = endpoint(code, '@app.post("/inloggen")');
    expect(inloggen).toContain('gebruikers.get(naam)');
    expect(inloggen.indexOf('secrets.token_hex(16)')).toBeGreaterThan(
      inloggen.indexOf('status_code=401'),
    );
    expect(inloggen).toContain('sessies.commit()');
    expect(inloggen).toContain('set_cookie(key="sessie_id"');
  });

  it('een onbekende naam en een fout wachtwoord krijgen één melding', () => {
    const code = blokken(hoofdtekst('FastAPI/accounts/inloggen'), 'python').join('\n');
    expect(code).toContain('detail="Naam of wachtwoord klopt niet"');
    expect(code).not.toMatch(/bestaat niet|Fout wachtwoord/);
  });
});

describe('de lessen zeggen eerlijk wat nog niet veilig is', () => {
  it('Registreren waarschuwt dat het wachtwoord leesbaar in gebruikers.db staat', () => {
    const les = hoofdtekst('FastAPI/accounts/registreren');
    expect(les).toContain(':::caution[Nog niet veilig]');
    expect(les).toContain('](/docs/veiligheid/wachtwoorden/gewone-tekst)');
    expect(les).toContain('sara = welkom123');
  });

  it('Inloggen noemt wat nog niet af is, en zegt bij elke vooruitwijzing dat het later komt', () => {
    const deel =
      hoofdtekst('FastAPI/accounts/inloggen').split('\n## Wat nog niet af is\n')[1] ?? '';
    const punten = deel.split(/\n## /)[0].split('\n- ').slice(1);
    expect(punten.length).toBe(3);
    for (const doel of [
      '/docs/FastAPI/onthouden/sessies',
      '/docs/veiligheid/wachtwoorden/gewone-tekst',
      '/docs/veiligheid/toegang/zwakheid',
    ]) {
      const punt = punten.find((p) => p.includes(`](${doel})`));
      expect(punt, doel).toBeDefined();
      expect(punt, doel).toMatch(/later/);
    }
  });
});

describe('de startpagina en de naslag kennen de accounts', () => {
  it('de startpagina en het nagebouwde gastenboek noemen het wachtwoord', () => {
    expect(tekst('FastAPI/index')).toMatch(/account met een naam en een wachtwoord/);
    const component = readFileSync(
      fileURLToPath(new URL('../components/Gastenboek/index.tsx', import.meta.url)),
      'utf8',
    );
    expect(component).toContain('Je wachtwoord');
  });

  it('de cheatsheet heeft registreren en de 401, en de statuscodes noemen 401', () => {
    const cheatsheet = readFileSync(`${DOCS}/cheatsheet.md`, 'utf8');
    expect(cheatsheet).toContain('<summary>Hoe maak ik een account? (registreren)</summary>');
    expect(cheatsheet).toContain('status_code=401');
    expect(cheatsheet).toMatch(/\| `401` \|/);
  });
});

it('de lessen van de basis staan vóór de uitbreidingen', () => {
  expect(lessen.indexOf('FastAPI/accounts/inloggen')).toBeLessThan(
    lessen.indexOf('FastAPI/zonder-herladen/htmx'),
  );
});
