import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lessen } from '../data/lessen';
import { activiteiten } from '../data/projecten';

// De unplugged hand-outs (docs/projecten/unplugged) volgen de vorm van de
// algoritmes-cursus: wat je nodig hebt, de werkvorm, Bespreek na, een
// antwoordblad dat op het scherm dicht staat, en links de site op die niet op
// papier komen. Of de code en de beloofde uitvoer kloppen, controleert
// scripts/draai-python-blokken.py; deze test bewaakt de vorm, de koppeling
// met de lessen en de projectkiezer, en de codestroken.

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const DOCS = join(SITE, 'docs');
const UNPLUGGED = join(DOCS, 'projecten', 'unplugged');

const handouts = readdirSync(UNPLUGGED)
  .filter((n) => n.endsWith('.mdx') && n !== 'index.mdx')
  .map((n) => ({
    slug: n.replace(/\.mdx$/, ''),
    naam: n,
    tekst: readFileSync(join(UNPLUGGED, n), 'utf8'),
  }));

function alleMdx(map: string): string[] {
  return readdirSync(map).flatMap((n) => {
    const pad = join(map, n);
    if (statSync(pad).isDirectory()) return alleMdx(pad);
    return n.endsWith('.mdx') ? [pad] : [];
  });
}

/** Het antwoordblad, en alles wat erbuiten staat. */
function splits(tekst: string): { blad: string; rest: string } {
  const m = tekst.match(/<Antwoordblad[^>]*>([\s\S]*?)<\/Antwoordblad>/);
  return { blad: m?.[1] ?? '', rest: m ? tekst.replace(m[0], '') : tekst };
}

/** De codeblokken op volgorde, met hun taal ('' voor een kaal blok). */
function blokken(tekst: string): { taal: string; code: string }[] {
  const uit: { taal: string; code: string }[] = [];
  let open: { taal: string; regels: string[] } | null = null;
  for (const regel of tekst.split('\n')) {
    const hek = regel.match(/^```(\w*)$/);
    if (open === null && hek) open = { taal: hek[1], regels: [] };
    else if (open !== null && regel === '```') {
      uit.push({ taal: open.taal, code: `${open.regels.join('\n')}\n` });
      open = null;
    } else open?.regels.push(regel);
  }
  return uit;
}

const python = (t: string) =>
  blokken(t)
    .filter((b) => b.taal === 'python')
    .map((b) => b.code);
const kaal = (t: string) =>
  blokken(t)
    .filter((b) => b.taal === '')
    .map((b) => b.code);

describe('de unplugged hand-outs', () => {
  it('er zijn er negen', () => {
    expect(handouts.map((h) => h.slug).sort()).toEqual([
      'bekertjes',
      'beslismachine',
      'codestroken',
      'etiketten',
      'functiemachine',
      'jij-bent-de-loop',
      'kluisjes',
      'raad-het-getal',
      'waar-of-niet-waar',
    ]);
  });

  for (const { slug, naam, tekst } of handouts) {
    describe(naam, () => {
      const { blad, rest } = splits(tekst);

      it('heeft de vaste opbouw van een hand-out', () => {
        expect(tekst).toMatch(/^<Handout>$/m);
        expect(tekst).toMatch(/^## Wat je nodig hebt$/m);
        expect(rest).toMatch(/^## Bespreek na$/m);
        expect(blad, 'een <Antwoordblad> met antwoorden').not.toBe('');
        // De antwoorden staan alleen op het antwoordblad.
        expect(rest).not.toMatch(/^## Antwoorden/m);
      });

      it('de links de site op komen niet op papier', () => {
        const scherm = rest.match(/<div className="handout-alleen-scherm">([\s\S]*?)<\/div>/)?.[1];
        expect(scherm, 'een handout-alleen-scherm-blok').toBeDefined();
        expect(scherm).toMatch(/^## Verder op de site$/m);
      });

      it('wijst naar de les die hij oefent', () => {
        const paden = new Set(lessen.map((l) => l.pad));
        const naarLes = [...tekst.matchAll(/\]\(site:python(\/docs\/[^)#\s]+)/g)].filter((m) =>
          paden.has(m[1]),
        );
        expect(naarLes.length, 'minstens één link naar een les').toBeGreaterThan(0);
      });

      it('het antwoordblad laat Python het narekenen', () => {
        // Een programma met een beloofde uitvoer: een commentaar achter een
        // print, of een uitvoerblok eronder. Dat legt de blokcontrole naast
        // wat Python echt doet.
        const programmas = python(blad);
        const belooft =
          programmas.some((p) => /print\(.*\)\s+#\s*\S/.test(p)) ||
          /Uitvoer:\s*\n\s*```\n/.test(blad);
        expect(belooft).toBe(true);
      });

      it('een les of project wijst ernaar, en de projectkiezer kent hem', () => {
        const link = `site:python/docs/projecten/unplugged/${slug})`;
        const wijzers = alleMdx(DOCS)
          .filter((p) => !p.startsWith(UNPLUGGED))
          .filter((p) => readFileSync(p, 'utf8').includes(link))
          .map((p) => relative(DOCS, p));
        expect(wijzers.length, `geen les met een link naar ${slug}`).toBeGreaterThan(0);

        const kaart = activiteiten.find(
          (a) => 'to' in a.link && a.link.to === `/docs/projecten/unplugged/${slug}`,
        );
        expect(kaart?.soort).toBe('unplugged');
      });
    });
  }

  it('de navbar heeft een link Unplugged, met een eigen sidebar', () => {
    const config = readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8');
    expect(config).toMatch(/sidebarId: 'unpluggedSidebar',[^}]*label: 'Unplugged'/);
    expect(config).toContain('zonderUnplugged(items)');
    const sidebars = readFileSync(join(SITE, 'sidebars.ts'), 'utf8');
    expect(sidebars).toMatch(
      /unpluggedSidebar: \[\{ type: 'autogenerated', dirName: 'projecten\/unplugged' \}\]/,
    );
    expect(readdirSync(UNPLUGGED)).toContain('index.mdx');
  });

  it('elke unplugged kaart in de projectkiezer heeft een hand-out', () => {
    for (const a of activiteiten.filter((x) => x.soort === 'unplugged')) {
      const slug = 'to' in a.link ? a.link.to.split('/').at(-1) : undefined;
      expect(
        handouts.some((h) => h.slug === slug),
        a.id,
      ).toBe(true);
    }
  });
});

describe('codestroken', () => {
  const tekst = handouts.find((h) => h.slug === 'codestroken')?.tekst ?? '';
  const { blad, rest } = splits(tekst);
  const puzzels = rest.split(/^## Puzzel \d+$/m).slice(1);
  const oplossingen = python(blad);
  const uitvoer = kaal(blad);

  it('heeft bij elke puzzel een oplossing met uitvoer', () => {
    expect(puzzels.length).toBe(3);
    expect(oplossingen.length).toBe(puzzels.length);
    expect(uitvoer.length).toBe(puzzels.length);
  });

  puzzels.forEach((puzzel, i) => {
    it(`puzzel ${i + 1}: de stroken zijn de oplossing plus één strook te veel`, () => {
      const stroken = [...puzzel.matchAll(/^\| `(.+)` \|$/gm)].map((m) => m[1]);
      const regels = oplossingen[i]
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r !== '');
      const over = [...stroken];
      for (const r of regels) {
        const plek = over.indexOf(r);
        expect(plek, `regel uit de oplossing zonder strook: ${r}`).toBeGreaterThanOrEqual(0);
        over.splice(plek, 1);
      }
      expect(over.length, `stroken over: ${over.join(', ')}`).toBe(1);
      // De stroken staan geschud: niet in de volgorde van de oplossing.
      expect(stroken.filter((s) => !over.includes(s))).not.toEqual(regels);
    });

    it(`puzzel ${i + 1}: de gevraagde uitvoer is wat de oplossing echt print`, () => {
      // Het uitvoerblok in het antwoordblad legt de blokcontrole naast
      // Python; de opgave moet daar letterlijk mee overeenkomen.
      const gevraagd = kaal(puzzel)[0];
      expect(gevraagd).toBe(uitvoer[i]);
    });
  });
});
