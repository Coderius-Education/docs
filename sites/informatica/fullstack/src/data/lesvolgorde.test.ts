import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De volgorde van de FastAPI-lessen, en wat een les mag aannemen.
//
// Jinja2 kwam eerst binnen als bijzaak in "POST met templates", samen met een
// formulier. Het gastenboek, waar alles na de database op bouwt, stond alleen
// in opdracht 5 van "Een formulier opslaan", en het verwijderen alleen in
// opdracht 5 van de redirect-les. Een leerling die een opdracht oversloeg
// (en dat mag, zegt de docentenhandleiding) liep daarna vast. Deze test eist
// dat een bouwsteen de eerste keer in de hoofdtekst staat, niet in een
// uitklapblok. Daarnaast komt de basis vóór de uitbreidingen, en noemt
// elke titel het begrip dat de les leert.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

type Item = string | { type: string; label: string; items: Item[] };

function plat(items: Item[]): string[] {
  return items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
}

const categorieen = sidebars.apiSidebar as unknown as { label: string; items: Item[] }[];
const lessen = plat(sidebars.apiSidebar as unknown as Item[]);
const tekst = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
const titel = (id: string) => tekst(id).match(/^# (.+)$/m)?.[1] ?? '';
// De hoofdtekst: alles vóór de opdrachten en buiten <details>-blokken. Een
// opdracht, zijn tip en zijn antwoord mag een leerling overslaan.
const hoofdtekst = (id: string) =>
  tekst(id)
    .split(/\n## Opdrachten\n/)[0]
    .replace(/<details>[\s\S]*?<\/details>/g, '');

describe('volgorde van de FastAPI-lessen', () => {
  it('de eerste les met TemplateResponse is Templates met Jinja2', () => {
    const eerste = lessen.find((id) => tekst(id).includes('TemplateResponse'));
    expect(eerste).toBe('FastAPI/formulieren/templates');
  });

  // Path-parameters kwamen pas binnen bij Eén item tonen, midden in het
  // gastenboek en samen met de database en de 404. Nu maakt de leerling eerst
  // losse pagina's met elk een eigen route, en ziet hij daarna in een eigen
  // les waarom één route met een plekhouder beter is.
  it("de eerste route met een path-parameter staat in Eén route voor veel pagina's", () => {
    const pad = /@app\.\w+\("[^"]*\{\w+\}/;
    const eerste = lessen.find((id) => pad.test(tekst(id)));
    expect(eerste).toBe('FastAPI/veel-paginas/path-parameters');
    expect(hoofdtekst('FastAPI/veel-paginas/path-parameters')).toMatch(pad);
    const plek = categorieen.findIndex((c) => c.label === "Eén route voor veel pagina's");
    expect(categorieen[plek - 1].label).toBe("Losse pagina's en routes");
    // Het probleem staat vóór de oplossing: losse routes per pagina, eerst in
    // de les, dan de plekhouder.
    const les = hoofdtekst('FastAPI/veel-paginas/path-parameters');
    expect(les.indexOf('@app.get("/kat"')).toBeGreaterThan(-1);
    expect(les.indexOf('@app.get("/kat"')).toBeLessThan(les.indexOf('@app.get("/dier/{naam}")'));
  });

  it.each([
    'time.time_ns()',
    'db.items()',
    'type="hidden"',
    'del db[',
    'RedirectResponse',
    'HTTPException',
    'TemplateResponse',
    '{% for',
    '{% if',
    'app.mount',
  ])('%s staat de eerste keer in de hoofdtekst, niet alleen in een antwoord', (bouwsteen) => {
    const eerste = lessen.find((id) => tekst(id).includes(bouwsteen));
    expect(eerste, `${bouwsteen} komt nergens voor`).toBeDefined();
    expect(hoofdtekst(eerste as string), `eerste keer in ${eerste}`).toContain(bouwsteen);
  });

  // Eerst de basis, dan de uitbreidingen: wie na de basis stopt, heeft een
  // werkend gastenboek met alles wat de basis leert.
  const items = sidebars.apiSidebar as unknown as Item[];
  const label = (i: Item | undefined) => (typeof i === 'string' ? i : i?.label);
  const grens = items.findIndex((i) => label(i)?.startsWith('Uitbreiding:'));

  it('de basis eindigt met Accounts, daarna alleen uitbreidingen', () => {
    expect(label(items[grens - 1])).toBe('Accounts');
    expect(items.slice(grens, grens + 3).every((i) => label(i)?.startsWith('Uitbreiding:'))).toBe(
      true,
    );
  });

  it('de basis heeft geen les uit een uitbreiding nodig', () => {
    const basis = plat(items.slice(0, grens));
    const uitbreiding = new Set(plat(items.slice(grens)));
    // Een link naar een uitbreiding mag, als de zin zegt dat die later komt,
    // of in een sectie die over uitbreidingen gaat.
    const later = /uitbreiding|later|aan het eind/i;
    const fout = basis.flatMap((id) =>
      hoofdtekst(id)
        .split(/\n(?=## )/)
        .filter((sectie) => !later.test(sectie.split('\n')[0]))
        .flatMap((sectie) => sectie.split('\n'))
        .flatMap((regel) =>
          [...regel.matchAll(/\]\(\/docs\/(FastAPI\/[\w/-]+)/g)]
            .filter((m) => uitbreiding.has(m[1]) && !later.test(regel))
            .map((m) => `${id} → ${m[1]}`),
        ),
    );
    expect(fout).toEqual([]);
  });
});

describe('titels en categorieën', () => {
  it('elke les heeft een eigen titel', () => {
    const titels = lessen.map(titel);
    expect(titels.filter((t, i) => titels.indexOf(t) !== i)).toEqual([]);
  });

  it.each([
    ['FastAPI/veel-paginas/path-parameters', /path-parameters/],
    ['FastAPI/gastenboek/detailpagina', /opzoeken/],
    ['FastAPI/gastenboek/detailpagina', /404/],
    ['FastAPI/gastenboek/redirect', /redirect/],
    ['FastAPI/formulieren/templates', /Jinja2/],
    ['FastAPI/sqlitedict/database', /SqliteDict/],
    ['FastAPI/sqlitedict/database-sleutels', /SqliteDict/],
    ['FastAPI/sqlitedict/database-waarden', /SqliteDict/],
    ['FastAPI/css-en-afbeeldingen/static_files', /static files/],
    ['FastAPI/gastenboek/lijst_tonen', /for-lus/],
    ['FastAPI/accounts/registreren', /account/],
    ['FastAPI/accounts/inloggen', /wachtwoord/],
    ['FastAPI/afronden/foutpagina', /404/],
  ])('de titel van %s noemt %s', (id, begrip) => {
    expect(titel(id)).toMatch(begrip);
  });

  it('geen categorie heet naar het voorbeeldproject', () => {
    expect(categorieen.map((c) => c.label).filter((l) => /gastenboek/i.test(l))).toEqual([]);
  });

  it('Projectstructuur is naslag: niet in de sidebar, wel bovenaan de cheatsheet', () => {
    expect(lessen).not.toContain('FastAPI/projectstructuur');
    const cheatsheet = readFileSync(`${DOCS}/cheatsheet.md`, 'utf8').split('\n## ')[0];
    expect(cheatsheet).toContain('(/docs/FastAPI/projectstructuur)');
  });
});

describe('verwijzingen naar een les', () => {
  // Na de nieuwe titels bleven oude namen staan: "CSS en afbeeldingen (static
  // files)" in vier linkteksten, "Static files" en "Terug naar de lijst" in de
  // diagrammen. Een linktekst die als titel bedoeld is (met een dubbele punt of
  // haakjes) moet de titel van de doelles zijn; een label in het diagram ook,
  // of het deel vóór de dubbele punt.
  const titelVan = (to: string) => titel(to.replace(/^\/docs\//, '').split('#')[0]);
  const alleTeksten = [...lessen, 'troubleshooting', 'cheatsheet'].map((id) => ({
    id,
    tekst: readFileSync(`${DOCS}/${id}${id.startsWith('FastAPI/') ? '.mdx' : '.md'}`, 'utf8'),
  }));

  it('een linktekst met een dubbele punt of haakjes is de titel van de doelles', () => {
    const fout = alleTeksten.flatMap(({ id, tekst }) =>
      [...tekst.matchAll(/\[([^\]]*[:(][^\]]*)\]\((\/docs\/FastAPI\/[\w/-]+)[^)]*\)/g)]
        .filter((m) => m[1] !== titelVan(m[2]))
        .map((m) => `${id}: [${m[1]}] → ${titelVan(m[2])}`),
    );
    expect(fout).toEqual([]);
  });

  it('elk les-label in het verzoekdiagram is de titel van de les', () => {
    const bron = readFileSync(
      new URL('../components/VerzoekCyclus/index.tsx', import.meta.url),
      'utf8',
    );
    const fout = [...bron.matchAll(/to: '(\/docs\/FastAPI\/[^']+)',\s*les: '([^']+)'/g)]
      .map((m) => [m[0], m[1], m[2].replace(/’/g, "'")])
      .filter((m) => m[2] !== titelVan(m[1]) && m[2] !== titelVan(m[1]).split(':')[0])
      .map((m) => `${m[2]} → ${titelVan(m[1])}`);
    expect(fout).toEqual([]);
  });
});
