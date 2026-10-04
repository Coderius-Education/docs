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
  /** De tekst in <Uitleg>, of leeg. */
  uitleg: string;
}

/** Alle <Voorspel>-blokken in een bron, met hun keuzes. */
function voorspellingen(bron: string): Blok[] {
  return [...bron.matchAll(VOORSPEL)].map((m) => {
    const vraag = attribuut(m[1], 'vraag');
    return {
      vraag: typeof vraag === 'string' ? vraag : '',
      uitleg: (m[2].match(/<Uitleg>([\s\S]*?)<\/Uitleg>/)?.[1] ?? '').trim(),
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

/** Kleine letters, zonder opmaak en leestekens, met een spatie eromheen. */
function normaal(tekst: string): string {
  const woorden = tekst
    .toLowerCase()
    .replace(/[*`_]/g, '')
    .replace(/[^\p{L}\p{N}°<>=…]+/gu, ' ')
    .trim();
  return woorden ? ` ${woorden} ` : '';
}

/**
 * Wat er mis is aan de uitleg, los van de vorm: de uitleg bij een foute keuze
 * die het goede antwoord noemt, en een goede uitleg die <Uitleg> herhaalt.
 */
function verklapt(blok: Blok): { antwoord: string[]; herhaling: string[] } {
  const antwoord: string[] = [];
  const herhaling: string[] = [];
  const uit = { antwoord, herhaling };
  const goed = blok.keuzes.find((k) => k.goed);
  if (!goed) return uit;
  // Wie eerst fout gokt, leest de uitleg bij zijn keuze en mag daarna nog
  // een keer kiezen. Staat het goede antwoord in die uitleg, dan is de
  // tweede keuze geen denkwerk meer. Ook een deel van het antwoord telt: bij
  // "A0, op het signaal van A0" verklapt "met Lees anapin A0" het al.
  const delen = [goed.tekst, ...goed.tekst.split(/[,:;]/)].map(normaal).filter(Boolean);
  blok.keuzes.forEach((k, j) => {
    if (k.goed) return;
    const deel = delen.find((d) => normaal(k.uitleg).includes(d));
    if (deel)
      antwoord.push(`de uitleg bij keuze ${j + 1} noemt het goede antwoord ("${deel.trim()}")`);
  });
  // Wie meteen goed kiest, ziet de uitleg bij zijn keuze en daaronder
  // <Uitleg>. Staat dezelfde zin er twee keer, dan leest hij hem twee keer.
  // Alleen zinsdelen van vijf woorden of meer: "met de servo" mag terugkomen.
  const algemeen = normaal(blok.uitleg);
  for (const zinsdeel of goed.uitleg.split(/[.,:;?]/)) {
    const n = normaal(zinsdeel);
    if (n.trim().split(' ').length >= 5 && algemeen.includes(n))
      herhaling.push(`de uitleg bij de goede keuze staat ook in <Uitleg> ("${n.trim()}")`);
  }
  return uit;
}

/** Per <Voorspel> in een bron: wat de uitleg verklapt of herhaalt. */
function verklaptIn(bron: string, soort: 'antwoord' | 'herhaling'): string[] {
  return voorspellingen(bron).flatMap((blok, i) =>
    verklapt(blok)[soort].map((v) => `voorspelling ${i + 1}: ${v}`),
  );
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
        uitleg: 'Algemeen.',
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

describe('de uitleg verklapt niets en herhaalt niets', () => {
  it('meldt een foute keuze waarvan de uitleg het goede antwoord noemt, ook een deel ervan', () => {
    // Uit de Click Golfer, ir-sensor, vóór de fix.
    const bron = `<Voorspel vraag="Welke sluit je aan?">
  <Keuze goed uitleg="A0 geeft een getal.">A0, op het signaal van A0 op het shield</Keuze>
  <Keuze uitleg="Je gebruikt er maar één: de robot leest één getal, met Lees anapin A0.">Allebei</Keuze>
</Voorspel>`;
    expect(verklaptIn(bron, 'antwoord')).toEqual([
      'voorspelling 1: de uitleg bij keuze 2 noemt het goede antwoord ("a0")',
    ]);
    // Met **vet** en andere hoofdletters is het hetzelfde antwoord.
    expect(
      verklaptIn(
        `<Voorspel vraag="?">
  <Keuze uitleg="Nee, want het antwoord is een **kwart cirkel**.">Een halve cirkel</Keuze>
  <Keuze goed uitleg="Klopt.">Een kwart cirkel</Keuze>
</Voorspel>`,
        'antwoord',
      ),
    ).toEqual([
      'voorspelling 1: de uitleg bij keuze 1 noemt het goede antwoord ("een kwart cirkel")',
    ]);
  });

  it('laat een uitleg die zegt waarom het niet klopt, zonder het antwoord, met rust', () => {
    expect(
      verklaptIn(
        `<Voorspel vraag="?">
  <Keuze uitleg="Een halve cirkel is het hele stuk van 0° tot 180°. Het asje stopt al eerder.">Een halve cirkel</Keuze>
  <Keuze goed uitleg="Klopt.">Een kwart cirkel</Keuze>
</Voorspel>`,
        'antwoord',
      ),
    ).toEqual([]);
  });

  it('meldt een goede uitleg die <Uitleg> letterlijk herhaalt', () => {
    // Uit de Click Golfer, servo, vóór de fix.
    const bron = `<Voorspel vraag="?">
  <Keuze uitleg="Het asje stopt al eerder.">Een halve cirkel</Keuze>
  <Keuze goed uitleg="Een halve cirkel is 180°, en 90° is daar de helft van.">Een kwart cirkel</Keuze>
  <Uitleg>

Een kwart cirkel. Een halve cirkel is 180°, en 90° is daar de helft van.

  </Uitleg>
</Voorspel>`;
    expect(verklaptIn(bron, 'herhaling')).toEqual([
      'voorspelling 1: de uitleg bij de goede keuze staat ook in <Uitleg> ("een halve cirkel is 180°")',
      'voorspelling 1: de uitleg bij de goede keuze staat ook in <Uitleg> ("en 90° is daar de helft van")',
    ]);
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

  it('de uitleg bij een foute keuze noemt het goede antwoord niet', () => {
    const fout = metVoorspel.flatMap((l) =>
      verklaptIn(l.bron, 'antwoord').map((f) => `${l.bestand}: ${f}`),
    );
    expect(fout).toEqual([]);
  });

  it('de uitleg bij de goede keuze herhaalt <Uitleg> niet letterlijk', () => {
    const fout = metVoorspel.flatMap((l) =>
      verklaptIn(l.bron, 'herhaling').map((f) => `${l.bestand}: ${f}`),
    );
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
