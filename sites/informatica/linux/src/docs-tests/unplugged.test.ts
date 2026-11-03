import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import { maakSessie } from '../components/LinuxTerminal/opdrachten';

// De unplugged hand-outs (docs/unplugged) volgen de vorm van fullstack en
// python: wat je nodig hebt, een gok vooraf, Bespreek na, een antwoordblad dat
// op het scherm dicht staat, en links de site op die niet op papier komen.
// Elke hand-out hoort bij een les, en die les wijst ernaar met een tip "Eerst
// op papier" vlak voor de eerste opdracht. De boom is die van de
// oefenterminal: de antwoorden typt deze test daar na.

const SITE = fileURLToPath(new URL('../../', import.meta.url));
const DOCS = join(SITE, 'docs');
const UNPLUGGED = join(DOCS, 'unplugged');

const handouts = readdirSync(UNPLUGGED)
  .filter((n) => n.endsWith('.mdx') && n !== 'index.mdx')
  .map((n) => ({ slug: n.replace(/\.mdx$/, ''), tekst: readFileSync(join(UNPLUGGED, n), 'utf8') }));

const splits = (tekst: string) => {
  const m = tekst.match(/<Antwoordblad[^>]*>([\s\S]*?)<\/Antwoordblad>/);
  return { blad: m?.[1] ?? '', rest: m ? tekst.replace(m[0], '') : tekst };
};

const lessen = (sidebars.linuxSidebar as unknown as (string | { items: string[] })[]).flatMap(
  (i) => (typeof i === 'string' ? [] : i.items),
);

describe('de unplugged hand-outs van linux', () => {
  it('elke hand-out staat in de eigen sidebar, in het overzicht en bij de docent', () => {
    expect(handouts.map((h) => h.slug).sort()).toEqual(['boom', 'rechten']);
    const lijst = sidebars.unpluggedSidebar as string[];
    expect(lijst[0]).toBe('unplugged/index');
    expect(lijst.slice(1).sort()).toEqual(handouts.map((h) => `unplugged/${h.slug}`).sort());
    const config = readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8');
    expect(config).toMatch(/sidebarId: 'unpluggedSidebar',[^}]*label: 'Unplugged'/);
    const overzicht = readFileSync(join(UNPLUGGED, 'index.mdx'), 'utf8');
    const docenten = readFileSync(join(SITE, 'src', 'pages', 'docenten.mdx'), 'utf8');
    expect(docenten).toContain('](site:linux/docs/unplugged)');
    for (const { slug } of handouts) {
      expect(overzicht, slug).toContain(`(site:linux/docs/unplugged/${slug})`);
      expect(docenten, slug).toContain(`(site:linux/docs/unplugged/${slug})`);
    }
  });

  for (const { slug, tekst } of handouts) {
    describe(slug, () => {
      const { blad, rest } = splits(tekst);

      it('heeft de vaste opbouw van een hand-out', () => {
        expect(tekst).toMatch(/^<Handout>$/m);
        expect(tekst).toMatch(/^## Wat je nodig hebt$/m);
        expect(rest).toMatch(/^## Bespreek na$/m);
        expect(rest).toMatch(/<div className="handout-samen">[\s\S]*?______[\s\S]*?<\/div>/);
        expect(blad, 'een <Antwoordblad>').not.toBe('');
        if (tekst.includes('handout-knipblad'))
          expect(tekst.indexOf('handout-knipblad')).toBeGreaterThan(
            tekst.indexOf('</Antwoordblad>'),
          );
      });

      it('de links de site op komen niet op papier, en wijzen naar een les', () => {
        const scherm = rest.match(/<div className="handout-alleen-scherm">([\s\S]*?)<\/div>/)?.[1];
        expect(scherm).toMatch(/^## Verder op de site$/m);
        const links = [...(scherm ?? '').matchAll(/\]\(site:linux\/docs\/([^)#\s]+)\)/g)];
        expect(links.length).toBeGreaterThan(0);
        for (const [, pad] of links) expect(lessen, pad).toContain(pad);
      });

      it('een les wijst ernaar met Eerst op papier, vlak voor de eerste opdracht', () => {
        const link = `(site:linux/docs/unplugged/${slug})`;
        const metTip = lessen.filter((id) => {
          const pad = join(DOCS, `${id}.mdx`);
          if (!existsSync(pad)) return false;
          const les = readFileSync(pad, 'utf8');
          const tip = les.indexOf(':::tip[Eerst op papier]');
          return (
            tip > -1 &&
            les.slice(tip).split('\n').slice(0, 3).join('\n').includes(link) &&
            les.indexOf('\n## Opdracht ') > tip &&
            /:::\n\n## Opdracht /.test(les.slice(tip))
          );
        });
        expect(metTip, 'een tip Eerst op papier direct boven de eerste opdracht').not.toEqual([]);
      });
    });
  }

  it('de boom: elke stap uit de antwoorden klopt in de oefenterminal', () => {
    const { blad } = splits(handouts.find((h) => h.slug === 'boom')?.tekst ?? '');
    const rijen = [...blad.matchAll(/^\| \d+ \| `([^`]+)` \| (.+) \|$/gm)];
    expect(rijen).toHaveLength(10);
    const sessie = maakSessie();
    for (const [, commando, antwoord] of rijen) {
      const uit = sessie.typ(commando).stand.uitvoer.join('\n');
      const pwd = sessie.typ('pwd').stand.uitvoer.join('\n').trim().split('\n').pop();
      if (commando.startsWith('cat ')) {
        expect(uit, commando).not.toMatch(/No such file|Permission denied/);
        expect(antwoord, commando).toContain('de pion blijft');
      } else if (antwoord.startsWith('lukt niet')) {
        expect(uit, commando).toMatch(/Not a directory|No such file or directory/);
        expect(blad).toContain(uit.trim().split('\n').pop());
      }
      const verwacht = antwoord
        .match(/`(\/[^`]*)`/g)
        ?.pop()
        ?.replace(/`/g, '');
      expect(pwd, commando).toBe(verwacht);
    }
  });

  it('mag dit?: bestand A, B en C staan zo in de oefenterminal', () => {
    const tekst = handouts.find((h) => h.slug === 'rechten')?.tekst ?? '';
    const sessie = maakSessie();
    for (const [letter, pad] of [
      ['A', '/home/student/notities.txt'],
      ['B', '/etc/shadow'],
      ['C', '/etc/hosts'],
    ]) {
      const kaart = tekst.match(new RegExp(`^\\| ${letter} \`(\\S+) (\\S+) (\\S+) `, 'm'));
      const regel = sessie.typ(`ls -l ${pad}`).stand.uitvoer.join('\n');
      expect(kaart, letter).not.toBeNull();
      const [, rechten, eigenaar, groep] = kaart ?? [];
      expect(regel, letter).toMatch(
        new RegExp(`^${rechten.replace(/-/g, '\\-')} 1 ${eigenaar} ${groep} `, 'm'),
      );
    }
  });
});
