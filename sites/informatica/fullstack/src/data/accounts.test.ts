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
const eersteUitbreiding = zijbalk.findIndex(
  (i) => typeof i !== 'string' && i.label.startsWith('Uitbreiding:'),
);
const basis = plat(zijbalk.slice(0, eersteUitbreiding));
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
  it('Registreren en Inloggen staan in Gegevens opslaan en tonen, na Eén item tonen', () => {
    const categorie = zijbalk.find(
      (i): i is Exclude<Item, string> =>
        typeof i !== 'string' && i.label === 'Gegevens opslaan en tonen',
    );
    const items = plat(categorie?.items ?? []);
    const plek = items.indexOf('FastAPI/detailpagina');
    expect(items.slice(plek, plek + 3)).toEqual([
      'FastAPI/detailpagina',
      'FastAPI/registreren',
      'FastAPI/inloggen',
    ]);
  });

  it('beide lessen hebben het hele main.py, met de nieuwe endpoints', () => {
    for (const [id, kop] of [
      ['FastAPI/registreren', '@app.post("/registreer")'],
      ['FastAPI/inloggen', 'wachtwoord: str = Form(...)'],
    ]) {
      const stand = tekst(id).match(
        /<summary>Zo ziet je `main\.py` er nu uit<\/summary>[\s\S]*?```python\n([\s\S]*?)```/,
      )?.[1];
      expect(stand, id).toContain('app = FastAPI()');
      expect(stand, id).toContain(kop);
    }
  });

  it('het wachtwoordveld is een type="password" met de naam van de parameter', () => {
    for (const id of ['FastAPI/registreren', 'FastAPI/inloggen']) {
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
    expect(versies.some((v) => v.pad === 'FastAPI/registreren.mdx')).toBe(true);
  });

  it.each(versies.map((v, i) => [`${v.pad} #${i}`, v.stuk]))('%s', (_, stuk) => {
    expect(stuk).toMatch(/if naam in \w+:\s+raise HTTPException\(status_code=400/);
  });
});

describe('na Inloggen heeft een bericht in de basis een wachtwoord nodig', () => {
  const vanaf = basis.slice(basis.indexOf('FastAPI/inloggen'));

  it('vindt de lessen', () => {
    expect(vanaf[0]).toBe('FastAPI/inloggen');
  });

  it('elk volledig POST /gastenboek controleert het wachtwoord vóór het opslaan', () => {
    const fout = vanaf.flatMap((id) =>
      blokken(tekst(id), 'python')
        .filter((b) => b.includes('@app.post("/gastenboek")'))
        .map((b) => endpoint(b, '@app.post("/gastenboek")'))
        .filter((stuk) => stuk.includes('SqliteDict("gastenboek.db")'))
        .filter(
          (stuk) =>
            !stuk.includes('gebruikers.get(naam)') ||
            stuk.indexOf('status_code=401') > stuk.indexOf('SqliteDict("gastenboek.db")'),
        )
        .map(() => id),
    );
    expect(fout).toEqual([]);
  });

  it('een onbekende naam en een fout wachtwoord krijgen één melding', () => {
    const code = blokken(hoofdtekst('FastAPI/inloggen'), 'python').join('\n');
    expect(code).toContain('detail="Naam of wachtwoord klopt niet"');
    expect(code).not.toMatch(/bestaat niet|Fout wachtwoord/);
  });
});

describe('de lessen zeggen eerlijk wat nog niet veilig is', () => {
  it('Registreren waarschuwt dat het wachtwoord leesbaar in gebruikers.db staat', () => {
    const les = hoofdtekst('FastAPI/registreren');
    expect(les).toContain(':::caution[Nog niet veilig]');
    expect(les).toContain('](/docs/veiligheid/wachtwoorden/gewone-tekst)');
    expect(les).toContain('sara = welkom123');
  });

  it('Inloggen noemt wat nog niet af is, en zegt bij elke vooruitwijzing dat het later komt', () => {
    const deel = hoofdtekst('FastAPI/inloggen').split('\n## Wat nog niet af is\n')[1] ?? '';
    const punten = deel.split(/\n## /)[0].split('\n- ').slice(1);
    expect(punten.length).toBe(3);
    for (const doel of [
      '/docs/FastAPI/sessies',
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
  expect(lessen.indexOf('FastAPI/inloggen')).toBeLessThan(lessen.indexOf('FastAPI/htmx'));
});
