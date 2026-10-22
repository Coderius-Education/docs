import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De unplugged hand-outs (docs/unplugged) volgen de vorm van de python- en de
// algoritmes-cursus: wat je nodig hebt, de werkvorm met een gok vooraf,
// Bespreek na, een antwoordblad dat op het scherm dicht staat, en links de
// site op die niet op papier komen. Elke hand-out hoort bij een les, en die
// les wijst ernaar met een tip "Eerst op papier" vlak voor de opdrachten.

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const DOCS = join(SITE, 'docs');
const UNPLUGGED = join(DOCS, 'unplugged');

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

/** Bestaat de pagina achter een site:fullstack-pad? */
function bestaat(pad: string): boolean {
  const zonder = pad.replace(/^\/docs\//, '').replace(/#.*$/, '');
  return ['.mdx', '.md', '/index.mdx'].some((ext) => existsSync(join(DOCS, `${zonder}${ext}`)));
}

describe('de unplugged hand-outs van fullstack', () => {
  it('er zijn er zeven, en elk staat in de eigen sidebar', () => {
    expect(handouts.map((h) => h.slug).sort()).toEqual([
      'postbode',
      'template-invullen',
      'vertrouw-de-bezoeker',
      'verzoek-rollenspel',
      'volg-de-naam',
      'welke-route',
      'welke-taal-waar',
    ]);
    const lijst = sidebars.unpluggedSidebar as string[];
    expect(lijst[0]).toBe('unplugged/index');
    expect([...lijst.slice(1)].sort()).toEqual(handouts.map((h) => `unplugged/${h.slug}`).sort());
  });

  it('de navbar heeft een link Unplugged naar de eigen sidebar', () => {
    const config = readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8');
    expect(config).toMatch(/sidebarId: 'unpluggedSidebar',[^}]*label: 'Unplugged'/);
  });

  it('het overzicht en de docentenhandleiding noemen elke hand-out', () => {
    const overzicht = readFileSync(join(UNPLUGGED, 'index.mdx'), 'utf8');
    const docenten = readFileSync(join(SITE, 'src', 'pages', 'docenten.mdx'), 'utf8');
    for (const { slug } of handouts) {
      expect(overzicht, slug).toContain(`(site:fullstack/docs/unplugged/${slug})`);
      expect(docenten, slug).toContain(`(site:fullstack/docs/unplugged/${slug})`);
    }
  });

  for (const { slug, naam, tekst } of handouts) {
    describe(naam, () => {
      const { blad, rest } = splits(tekst);

      it('heeft de vaste opbouw van een hand-out', () => {
        expect(tekst).toMatch(/^<Handout>$/m);
        expect(tekst).toMatch(/^## Wat je nodig hebt$/m);
        expect(rest).toMatch(/^## Bespreek na$/m);
        expect(blad, 'een <Antwoordblad> met antwoorden').not.toBe('');
        expect(rest).not.toMatch(/^## Antwoorden/m);
        // Een knipblad komt na het antwoordblad, als laatste pagina.
        if (tekst.includes('handout-knipblad'))
          expect(tekst.indexOf('handout-knipblad')).toBeGreaterThan(
            tekst.indexOf('</Antwoordblad>'),
          );
      });

      it('de links de site op komen niet op papier, en wijzen naar een les', () => {
        const scherm = rest.match(/<div className="handout-alleen-scherm">([\s\S]*?)<\/div>/)?.[1];
        expect(scherm, 'een handout-alleen-scherm-blok').toBeDefined();
        expect(scherm).toMatch(/^## Verder op de site$/m);
        const lessen = [...(scherm ?? '').matchAll(/\]\(site:fullstack(\/docs\/(?:FastAPI|veiligheid)\/[^)\s]+)\)/g)];
        expect(lessen.length, 'minstens één link naar een les').toBeGreaterThan(0);
        for (const [, pad] of lessen) expect(bestaat(pad), pad).toBe(true);
      });

      it('een gokregel blijft op papier bij zijn opgave', () => {
        // Op plek, niet op tekst: "Mijn gok: ______" staat op meer plekken.
        const samen = [...rest.matchAll(/<div className="handout-samen">([\s\S]*?)<\/div>/g)].map(
          (m) => ({ van: m.index ?? 0, tot: (m.index ?? 0) + m[0].length }),
        );
        const losseGokken = [...rest.matchAll(/^(?!\|).*______.*$/gm)]
          .filter((m) => !samen.some((b) => (m.index ?? 0) > b.van && (m.index ?? 0) < b.tot))
          .map((m) => m[0]);
        expect(losseGokken).toEqual([]);
      });

      it('een les wijst ernaar met Eerst op papier, vlak voor de opdrachten', () => {
        const link = `(site:fullstack/docs/unplugged/${slug})`;
        const wijzers = alleMdx(DOCS)
          .filter((p) => !p.startsWith(UNPLUGGED))
          .filter((p) => readFileSync(p, 'utf8').includes(link));
        expect(wijzers.length, `geen les met een link naar ${slug}`).toBeGreaterThan(0);
        const metTip = wijzers.filter((p) =>
          new RegExp(
            String.raw`:::tip\[Eerst op papier\]\n[^\n]*${link.replace(/[()]/g, '\\$&')}[^\n]*\n:::\n\n## Opdrachten`,
          ).test(readFileSync(p, 'utf8')),
        );
        expect(
          metTip.map((p) => relative(DOCS, p)),
          'een tip Eerst op papier direct boven ## Opdrachten',
        ).not.toEqual([]);
      });
    });
  }
});

describe('welke taal, waar?', () => {
  const tekst = handouts.find((h) => h.slug === 'welke-taal-waar')?.tekst ?? '';
  const { blad, rest } = splits(tekst);
  const knipblad = rest.match(/<div className="handout-paginawissel handout-knipblad">([\s\S]*?)<\/div>/)?.[1] ?? '';

  it('de stroken op het knipblad zijn precies de stroken in de antwoorden, geschud', () => {
    const stroken = [...knipblad.matchAll(/^\| (\d+ `.+`) \|$/gm)].map((m) => m[1]);
    const antwoorden = [...blad.matchAll(/^\| (\d+ `.+`) \| [^|]+ \|$/gm)].map((m) => m[1]);
    expect(stroken.length).toBe(12);
    expect([...stroken].sort()).toEqual([...antwoorden].sort());
    expect(stroken).not.toEqual(antwoorden);
  });
});
