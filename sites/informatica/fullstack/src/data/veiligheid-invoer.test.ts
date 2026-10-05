import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Een endpoint dat een bezoeker met ?naam= een bestand laat kiezen, stuurt met
// FileResponse(f"static/pages/{naam}") ook ../../main.py terug: nagedraaid
// met fastapi 0.142, een 200 met de code van de server. Met een
// path-parameter (/pagina/{naam}) gaf hetzelfde een 404, want een
// path-parameter houdt op bij een /. Dat is geluk en geen controle, dus de les
// in Invoer controleren laat de query-parameter zien en zet er een lijst met
// wat mag tegenover. Deze test pint die les vast, en weert in de hele cursus
// een parameter van een endpoint in FileResponse(f"…") zonder controle tegen
// een lijst, tenzij het blok met {/* onveilig-voorbeeld: reden */} bewust de
// fout toont.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const LES = join(DOCS, 'veiligheid/invoer/paden.mdx');

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bestanden(pad);
    return /\.mdx?$/.test(naam) ? [pad] : [];
  });
}

type Blok = { code: string; gemarkeerd: boolean };

function pythonBlokken(tekst: string): Blok[] {
  return [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => {
    const ervoor = tekst.slice(Math.max(0, (m.index ?? 0) - 300), m.index);
    return {
      code: m[1],
      gemarkeerd: /\{\/\* onveilig-voorbeeld: \S[^*]*\*\/\}\s*(<CodeUitleg>\s*)?$/.test(ervoor),
    };
  });
}

// Per FileResponse(f"…") de parameters van het endpoint die erin staan zonder
// dat de functie ze eerder met `if <naam> not in` tegen een lijst houdt.
function ongecontroleerd(code: string): string[] {
  const fouten: string[] = [];
  for (const functie of code.split(/^(?=\s*async def |\s*def )/m)) {
    const kop = functie.match(/def \w+\(([\s\S]*?)\):/);
    if (!kop) continue;
    const parameters = [...kop[1].matchAll(/(\w+)\s*:/g)].map((p) => p[1]);
    for (const r of functie.matchAll(/FileResponse\(f(["'])([\s\S]*?)\1/g)) {
      const ervoor = functie.slice(0, r.index);
      for (const [, inhoud] of r[2].matchAll(/\{([^{}]+)\}/g)) {
        const naam = inhoud.match(/^\s*(\w+)/)?.[1];
        if (!naam || !parameters.includes(naam)) continue;
        if (new RegExp(`if ${naam} not in [A-Z_]+:`).test(ervoor)) continue;
        fouten.push(`{${inhoud}}`);
      }
    }
  }
  return fouten;
}

describe('een bestandsnaam van een bezoeker', () => {
  it('de controle herkent de fout en laat een lijst met wat mag door', () => {
    const fout = 'async def p(naam: str):\n    return FileResponse(f"static/pages/{naam}")';
    const goed =
      'async def p(naam: str):\n    if naam not in PAGINAS:\n        raise HTTPException(status_code=404)\n    return FileResponse(f"static/pages/{naam}")';
    const vast = 'async def p():\n    return FileResponse("static/pages/home.html")';
    expect(ongecontroleerd(fout)).toEqual(['{naam}']);
    expect(ongecontroleerd(goed)).toEqual([]);
    expect(ongecontroleerd(vast)).toEqual([]);
  });

  it('de les staat in Invoer controleren, vlak voor de praktijk', () => {
    type Categorie = { type: string; label: string; items: string[] };
    const invoer = (sidebars.veiligheidSidebar as unknown as Categorie[]).find(
      (c) => c.type === 'category' && c.label === 'Invoer controleren',
    );
    expect(invoer?.items.slice(-2)).toEqual([
      'veiligheid/invoer/paden',
      'veiligheid/invoer/praktijk',
    ]);
    expect(existsSync(LES)).toBe(true);
  });

  it('de les toont het gat met een query-parameter, als bewust fout voorbeeld', () => {
    const tekst = readFileSync(LES, 'utf8');
    const onveilig = pythonBlokken(tekst).filter((b) => ongecontroleerd(b.code).length > 0);
    // De query-parameter in de hoofdtekst en de path-parameter in opdracht 1.
    expect(onveilig.map((b) => b.code.split('\n')[0])).toEqual([
      '@app.get("/pagina")',
      '@app.get("/pagina/{naam}")',
    ]);
    expect(onveilig.every((b) => b.gemarkeerd)).toBe(true);
    // Nagedraaide uitvoer: de query-parameter geeft main.py, de path-parameter
    // een 404, de lijst een 404.
    expect(tekst).toContain('httpx.get("http://127.0.0.1:8000/pagina?naam=../../main.py")');
    expect(tekst).toContain('../../main.py -> 404');
    expect(tekst).toMatch(/```\n200\n404\n```/);
  });

  it('de stand van main.py houdt de naam tegen een lijst, en houdt de endpoints van les 5', () => {
    const tekst = readFileSync(LES, 'utf8');
    const stand =
      pythonBlokken(tekst.slice(tekst.indexOf('<summary>Zo ziet je `main.py` er nu uit')))[0]
        ?.code ?? '';
    expect(stand).toContain('PAGINAS = ["home.html", "over.html"]');
    expect(stand).toContain('if naam not in PAGINAS:');
    expect(stand).toContain('from fastapi.responses import FileResponse');
    expect(stand).toContain('@app.post("/bericht")');
    expect(stand).toContain('STEMMINGEN');
    expect(ongecontroleerd(stand)).toEqual([]);
  });

  for (const pad of bestanden(DOCS)) {
    const blokken = pythonBlokken(readFileSync(pad, 'utf8')).filter(
      (b) => !b.gemarkeerd && b.code.includes('FileResponse(f'),
    );
    if (blokken.length === 0) continue;
    it(`${relative(DOCS, pad)}: elke bestandsnaam van een bezoeker gaat eerst langs een lijst`, () => {
      for (const blok of blokken) expect(ongecontroleerd(blok.code)).toEqual([]);
    });
  }
});
