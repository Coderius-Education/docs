import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES_BY_ID } from '@coderius/shared/sites';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';
import { problemen } from './components/Voorspel/logica';

// <Voorspel> toont na een keuze of die goed of fout is. Staan er twee keuzes
// met `goed`, of geen, dan klopt dat oordeel niet; zonder `uitleg` krijgt de
// leerling bij een foute gok alleen "Niet goed" en weet hij niet waarom. Aan
// de pagina zie je dat pas als je de verkeerde knop indrukt, dus deze guard
// leest de bron van elke les in elke site.

const SITES_ROOT = fileURLToPath(new URL('../../sites', import.meta.url));
const OVERSLAAN = new Set([
  'node_modules',
  'build',
  '.docusaurus',
  'static',
  '__fixtures__',
  'extracted',
  'src',
]);

/** Elk lesbestand van elke site: docs/, en ook click_golfer/, lego_auto/ en zo. */
function alleLessen(): { site: string; bestand: string; pad: string }[] {
  const uit: { site: string; bestand: string; pad: string }[] = [];
  for (const site of Object.keys(SITES_BY_ID)) {
    const siteMap = join(SITES_ROOT, site);
    if (!existsSync(siteMap)) continue;
    for (const entry of readdirSync(siteMap, { withFileTypes: true })) {
      if (!entry.isDirectory() || OVERSLAAN.has(entry.name)) continue;
      for (const pad of alleLesbestanden(join(siteMap, entry.name))) {
        if (pad.split(/[\\/]/).some((deel) => OVERSLAAN.has(deel))) continue;
        uit.push({ site, bestand: pad.slice(SITES_ROOT.length + 1).replace(/\\/g, '/'), pad });
      }
    }
  }
  // De pagina's in src/pages (docenten.mdx en zo) tellen ook.
  for (const site of Object.keys(SITES_BY_ID)) {
    const pages = join(SITES_ROOT, site, 'src', 'pages');
    if (!existsSync(pages)) continue;
    for (const pad of alleLesbestanden(pages))
      uit.push({ site, bestand: pad.slice(SITES_ROOT.length + 1).replace(/\\/g, '/'), pad });
  }
  return uit;
}

// Een attribuut: `goed`, `goed={true}`, `uitleg="…"` of `uitleg='…'`. Een `>`
// binnen de quotes ("groter dan" als `>`) breekt de tag zo niet af.
const ATTR = String.raw`\s+[A-Za-z]+(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?`;
const VOORSPEL = new RegExp(String.raw`<Voorspel((?:${ATTR})*)\s*>([\s\S]*?)</Voorspel>`, 'g');
const KEUZE = new RegExp(String.raw`<Keuze((?:${ATTR})*)\s*>([\s\S]*?)</Keuze>`, 'g');

function attribuut(attrs: string, naam: string): string | true | undefined {
  const m = attrs.match(
    new RegExp(String.raw`\s${naam}(?:=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}))?(?=\s|$)`),
  );
  if (!m) return undefined;
  if (m[1] === undefined && m[2] === undefined && m[3] === undefined) return true;
  return m[1] ?? m[2] ?? m[3];
}

interface Blok {
  vraag: string;
  keuzes: { goed: boolean; uitleg: string; tekst: string }[];
}

/** Alle <Voorspel>-blokken in een bron, met hun keuzes. */
function voorspellingen(bron: string): Blok[] {
  return [...bron.matchAll(VOORSPEL)].map((m) => {
    const vraag = attribuut(m[1], 'vraag');
    return {
      vraag: typeof vraag === 'string' ? vraag : '',
      keuzes: [...m[2].matchAll(KEUZE)].map((k) => {
        const goed = attribuut(k[1], 'goed');
        const uitleg = attribuut(k[1], 'uitleg');
        return {
          goed: goed === true || goed === 'true',
          uitleg: typeof uitleg === 'string' ? uitleg : '',
          tekst: k[2].trim(),
        };
      }),
    };
  });
}

function fouten(bron: string): string[] {
  const uit: string[] = [];
  const blokken = voorspellingen(bron);
  if ((bron.match(/<Voorspel\b/g) ?? []).length !== blokken.length)
    uit.push('een <Voorspel> zonder </Voorspel> of met een tag die de guard niet kan lezen');
  blokken.forEach((blok, i) => {
    const naam = `voorspelling ${i + 1}`;
    if (!blok.vraag.trim()) uit.push(`${naam}: geen vraag`);
    for (const p of problemen(blok.keuzes)) uit.push(`${naam}: ${p}`);
    blok.keuzes.forEach((k, j) => {
      if (!k.tekst) uit.push(`${naam}: keuze ${j + 1} heeft geen tekst`);
    });
  });
  // Een <Keuze> buiten een <Voorspel> tekent niets.
  const zonderBlokken = bron.replace(VOORSPEL, '');
  if (/<Keuze\b/.test(zonderBlokken)) uit.push('een <Keuze> buiten een <Voorspel>');
  return uit;
}

const lessen = alleLessen().map((l) => ({ ...l, bron: readFileSync(l.pad, 'utf8') }));
const metVoorspel = lessen.filter((l) => /<Voorspel\b/.test(l.bron));

describe('de guard leest <Voorspel> zoals een schrijver hem typt', () => {
  it('vindt de vraag, de keuzes, goed en de uitleg', () => {
    const bron = `<Voorspel vraag="Wat doet het asje?">
  <Keuze goed uitleg="Klopt, want A0 > 300 betekent geen bal.">Het draait **heen** en weer</Keuze>
  <Keuze uitleg='Nee, het Leaphy-blok loopt "één" keer.'>Het stopt</Keuze>
  <Uitleg>Algemeen.</Uitleg>
</Voorspel>`;
    expect(voorspellingen(bron)).toEqual([
      {
        vraag: 'Wat doet het asje?',
        keuzes: [
          {
            goed: true,
            uitleg: 'Klopt, want A0 > 300 betekent geen bal.',
            tekst: 'Het draait **heen** en weer',
          },
          { goed: false, uitleg: 'Nee, het Leaphy-blok loopt "één" keer.', tekst: 'Het stopt' },
        ],
      },
    ]);
    expect(fouten(bron)).toEqual([]);
  });

  it('meldt twee goede keuzes, één keuze en een keuze zonder uitleg', () => {
    expect(
      fouten(
        `<Voorspel vraag="?"><Keuze goed uitleg="a">x</Keuze><Keuze goed={true} uitleg="b">y</Keuze></Voorspel>`,
      ),
    ).toEqual(['voorspelling 1: 2 goede keuzes; precies één nodig']);
    expect(fouten(`<Voorspel vraag="?"><Keuze goed uitleg="a">x</Keuze></Voorspel>`)).toEqual([
      'voorspelling 1: 1 keuze(s); minstens twee nodig',
    ]);
    expect(
      fouten(`<Voorspel vraag="?"><Keuze goed uitleg="a">x</Keuze><Keuze>y</Keuze></Voorspel>`),
    ).toEqual(['voorspelling 1: keuze 2 heeft geen uitleg']);
  });
});

describe('<Voorspel> in de lessen', () => {
  it('staat in elk geval in de Click Golfer', () => {
    // Zonder vondsten zou de controle hieronder stil groen zijn.
    expect(metVoorspel.some((l) => l.bestand.startsWith('robotica/click_golfer/'))).toBe(true);
  });

  it('heeft precies één goede keuze, minstens twee keuzes, en bij elke keuze een uitleg', () => {
    const fout = metVoorspel.flatMap((l) => fouten(l.bron).map((f) => `${l.bestand}: ${f}`));
    expect(fout).toEqual([]);
  });

  it('staat alleen op sites die hem in hun MDXComponents registreren', () => {
    // Zonder registratie stopt de build met "Expected component `Voorspel`
    // to be defined". Deze melding zegt waar het moet.
    const sites = new Set(metVoorspel.map((l) => l.site));
    const zonder = [...sites].filter((site) => {
      const theme = ['tsx', 'ts', 'js', 'jsx']
        .map((ext) => join(SITES_ROOT, site, 'src', 'theme', `MDXComponents.${ext}`))
        .find((p) => existsSync(p));
      if (!theme) return true;
      const bron = readFileSync(theme, 'utf8');
      return (
        !/components\/Voorspel['"]/.test(bron) ||
        !/\bKeuze\b/.test(bron) ||
        !/\bUitleg\b/.test(bron)
      );
    });
    expect(zonder).toEqual([]);
  });
});
