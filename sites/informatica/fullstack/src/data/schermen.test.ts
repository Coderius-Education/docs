import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Een les van fullstack is in tabbladen verdeeld, en een tabblad met
// `###`-koppen in stappen (zie de root-CLAUDE.md, Les-tabbladen). Een tabblad
// of stap is alles wat de leerling op dat moment ziet. Bij het omzetten wees
// "hierboven" of "hieronder" op 26 plekken naar een ander scherm ("zet de
// parameter erbij, zoals in regel 2 hierboven" stond bij Er gaat iets mis,
// en regel 2 in de uitleg), stond de rij tabbladen in vijf lessen op twee
// regels, en was een controlelijst over zeven tabbladen verdeeld.
//
// Deze test leest elke les met dezelfde stap als de build
// (packages/shared/plugins/les-schermen.js). Faalt hij, wijs dan naar wat in
// hetzelfde scherm staat, of noem het andere scherm bij zijn naam ("zoals bij
// De controle in het endpoint", "uit de volgende stap").

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan, DOORGAAND } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

type Blok = { soort: string; tekst: string; inVraag?: boolean };
type Scherm = { les: string; tab: string; opTab: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
// Onderdelen die iets laten zien zonder dat er een alinea of codeblok staat.
const ZICHTBAAR = [
  'VerzoekCyclus',
  'DevtoolsPaneel',
  'NetwerkTabel',
  'ConsoleRegels',
  'Routekaart',
  'Gastenboek',
  'Gelukt',
];

function bestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((f) => {
    if (f.isDirectory()) return bestanden(join(map, f.name));
    return /\.mdx?$/.test(f.name) ? [join(map, f.name)] : [];
  });
}

const parse = await mdxParser();
const paginas = bestanden(join(SITE, 'docs')).map((pad) => ({
  naam: relative(SITE, pad),
  bron: readFileSync(pad, 'utf8'),
}));
const lessen = paginas.map(({ naam, bron }) => ({
  naam,
  bron,
  schermen: (schermenVan(bron, parse, { velden: ZICHTBAAR }) as Omit<Scherm, 'les'>[]).map((s) => ({
    les: naam,
    ...s,
  })),
}));
const schermen = lessen.flatMap((les) => les.schermen);
const isTeZien = (b: Blok) => b.soort !== 'tekst' && b.soort !== 'antwoord';
const zonderTabs = (bron: string) => /^les_tabs:\s*false\s*$/m.test(bron.split('\n---\n')[0]);

describe('elk scherm van een les staat op zichzelf', () => {
  it('de lessen zijn in schermen verdeeld', () => {
    // Zonder schermen slagen de tests hieronder op niets.
    expect(lessen.filter((les) => les.schermen.length > 0).length).toBeGreaterThan(140);
    expect(schermen.length).toBeGreaterThan(1200);
    expect(schermen.some((s) => s.naam.includes(' › '))).toBe(true);
  });

  it('"hieronder" wijst naar iets dat in hetzelfde scherm volgt', () => {
    const fout: string[] = [];
    for (const s of schermen) {
      s.blokken.forEach((b, i) => {
        if (!['tekst', 'lijst'].includes(b.soort)) return;
        if (!/\b(hieronder|onderstaande?)\b/i.test(b.tekst)) return;
        if (!s.blokken.slice(i + 1).some(isTeZien))
          fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('"hierboven" wijst naar iets dat in hetzelfde scherm ervoor staat', () => {
    const fout: string[] = [];
    for (const s of schermen) {
      s.blokken.forEach((b, i) => {
        if (!['tekst', 'lijst'].includes(b.soort)) return;
        if (!/\b(hierboven|bovenstaande?)\b/i.test(b.tekst)) return;
        if (!s.blokken.slice(0, i).some(isTeZien))
          fout.push(`${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('Er gaat iets mis wijst niet naar "hierboven": de uitleg staat op een ander tabblad', () => {
    // Bij een fout staat de melding en de oorzaak in het scherm, en "zoals
    // hierboven" bedoelde in tien lessen de code uit de uitleg. De test
    // hierboven ziet dat niet: de foutmelding zelf staat er ook boven.
    const fout = schermen
      .filter((s) => s.tab === 'Er gaat iets mis')
      .flatMap((s) =>
        s.blokken
          .filter((b) => b.soort === 'tekst' && /\b(hierboven|hieronder)\b/i.test(b.tekst))
          .map((b) => `${s.les} | ${s.naam}: ${b.tekst.slice(0, 80)}`),
      );
    expect(fout).toEqual([]);
  });

  it('elk scherm van een les heeft een eigen naam', () => {
    const fout = lessen.flatMap((les) => {
      const namen = les.schermen.map((s) => s.naam);
      return [...new Set(namen.filter((n, i) => namen.indexOf(n) !== i))].map(
        (n) => `${les.naam}: ${n}`,
      );
    });
    expect(fout).toEqual([]);
  });

  it('geen stap heeft een nummer in zijn naam', () => {
    // De knop van een stap nummert al, en een stap Vooraf of De basis ervoor
    // schuift de telling op.
    const fout = schermen
      .filter((s) => /› Stap \d/.test(s.naam))
      .map((s) => `${s.les} | ${s.naam}`);
    expect(fout).toEqual([]);
  });

  it('de rij tabbladen past op één regel', () => {
    // Een tweede regel kost elk paneel veertig pixels. Naast de lessenlijst is
    // op 1280 pixels 948 pixels over; een tabblad kost ongeveer 32 pixels plus
    // 7 per letter (gemeten in Chromium: "Testen" is 76 breed, "Waarom de
    // naam niet in de cookie hoort" 296; dezelfde schatting als bij robotica). Vijf lessen stonden zo op twee regels, met koppen als "Als
    // je wijziging niet doorkomt"; die heet nu De cache. Het echte getal meet
    // alleen een browser (`node scripts/meet-les-tabs.mjs fullstack`).
    const fout = lessen.flatMap((les) => {
      const labels = [...new Set(les.schermen.map((s) => s.opTab))];
      const breedte = labels.reduce((som, label) => som + 32 + 7 * label.length, 0);
      return breedte > 948
        ? [`${les.naam}: ${labels.length} tabbladen, ongeveer ${breedte} px`]
        : [];
    });
    expect(fout).toEqual([]);
  });
});

describe('wat een doorloop als leerling vond', () => {
  // Een doorloop van 26 lessen las elk scherm zoals een leerling het ziet, en
  // klikte op elke knop. Wat een script kan vastpinnen, staat hier.

  it('een scherm begint niet met een zin die op het vorige scherm doorgaat', () => {
    // "Daaronder legt de tekst zelf uit …" na een stap met de uitvoer, "Daarom
    // maakt de Dockerfile …" na een vraag, "Klik op de regel." na een tabel:
    // op de lange pagina stond het eronder, nu is het een scherm verder. De
    // lijst staat één keer in packages/shared/plugins/les-schermen.js.
    for (const zin of ['Daaronder legt de tekst zelf uit', 'Klik op de regel.', 'Daarom maakt'])
      expect(DOORGAAND.test(zin), zin).toBe(true);
    const fout = lessen.flatMap((les) =>
      les.schermen
        .slice(1)
        .filter((s) => s.blokken[0]?.soort === 'tekst' && DOORGAAND.test(s.blokken[0].tekst.trim()))
        .map((s) => `${s.les} | ${s.naam}: ${s.blokken[0].tekst.trim().slice(0, 60)}`),
    );
    expect(fout).toEqual([]);
  });

  it('een scherm dat een stap van <VerzoekCyclus> noemt, toont het diagram of noemt de titel', () => {
    // "Stap 3 is het hele verschil", "Vergelijk stap 5 en 6": op de lange
    // pagina stond het diagram erboven, in tabbladen een scherm terug. Een
    // stap heet daarom naar zijn titel ("de stap De server zoekt de sessie
    // op"), of het diagram staat op hetzelfde scherm.
    const bron = readFileSync(join(SITE, 'src/components/VerzoekCyclus/index.tsx'), 'utf8');
    const reeksen = new Map(
      [...bron.matchAll(/const (\w+): Stap\[\] = \[([\s\S]*?)\n\];/g)].map((m) => [
        m[1],
        [...m[2].matchAll(/titel: '([^']+)'/g)].map((t) => t[1]),
      ]),
    );
    const titels = new Map(
      [...bron.matchAll(/^\s+(\w+): \{ stappen: (\w+),/gm)].map((m) => [
        m[1],
        reeksen.get(m[2]) ?? [],
      ]),
    );
    expect(titels.get('sessie')?.[2]).toBe('De server zoekt de sessie op');
    const metDiagram = lessen.filter((les) => les.bron.includes('<VerzoekCyclus'));
    expect(metDiagram.length).toBeGreaterThan(10);
    const fout = metDiagram.flatMap((les) => {
      const varianten = [...les.bron.matchAll(/<VerzoekCyclus variant="(\w+)"/g)].map((m) => m[1]);
      // Alleen het diagram telt hier als veld: een DevtoolsPaneel is geen diagram.
      const schermen = schermenVan(les.bron, parse, { velden: ['VerzoekCyclus'] }) as Scherm[];
      return schermen
        .filter((s) => !s.blokken.some((b) => b.soort === 'veld'))
        .flatMap((s) => {
          const tekst = s.blokken
            .filter((b) => ['tekst', 'lijst'].includes(b.soort))
            .map((b) => b.tekst)
            .join(' ');
          return [...tekst.matchAll(/\b[Ss]tap(?:pen)?\s+\d+(?:\s*(?:,|en|of|tot)\s*\d+)*/g)]
            .filter((m) =>
              (m[0].match(/\d+/g) ?? []).some(
                (n) =>
                  !varianten.some((v) => {
                    const titel = titels.get(v)?.[Number(n) - 1];
                    return titel && tekst.includes(titel);
                  }),
              ),
            )
            .map((m) => `${les.naam} | ${s.naam}: ${m[0]}`);
        });
    });
    expect(fout).toEqual([]);
  });

  it('de uitleg bij een keuze wijst niet naar "hierboven" of "hieronder"', () => {
    // Een controlevraag is een eigen scherm. "Hoeveel fouten meldde hij in de
    // Gelukt hierboven?" stond in `uitleg="…"` van een <Keuze>, en dat leest
    // de test op alinea's niet.
    const fout = lessen.flatMap(({ naam, bron }) =>
      [...bron.matchAll(/<Keuze\b[^>]*\buitleg=(?:"([^"]*)"|'([^']*)')/g)]
        .map((m) => m[1] ?? m[2])
        .filter((uitleg) => /\b(hierboven|hieronder|bovenstaande?|onderstaande?)\b/i.test(uitleg))
        .map((uitleg) => `${naam}: ${uitleg.slice(0, 80)}`),
    );
    expect(fout).toEqual([]);
  });

  it('het hele bestand na de les is het laatste tabblad, niet een stap ergens in de les', () => {
    // "Zo ziet je main.py er nu uit" stond bij 24 lessen onder de laatste
    // opdracht en bij vier onder één fout van Er gaat iets mis.
    const metStand = lessen.filter(
      (les) =>
        les.schermen.length > 0 && /<summary>Zo ziet je [^<]+ er nu uit<\/summary>/.test(les.bron),
    );
    expect(metStand.length).toBeGreaterThan(50);
    const fout = metStand
      .filter((les) => !/\.(py|html)$/.test(les.schermen.at(-1)?.tab ?? ''))
      .map((les) => `${les.naam}: het laatste tabblad heet ${les.schermen.at(-1)?.tab}`);
    expect(fout).toEqual([]);
    // En het staat op dat tabblad open: geen uitklapblok met alleen de code.
    const dicht = metStand
      .filter((les) => les.schermen.at(-1)?.blokken.some((b) => b.soort === 'antwoord'))
      .map((les) => les.naam);
    expect(dicht).toEqual([]);
  });

  it('een les heeft hooguit één stap die De basis heet', () => {
    // In Formulieren, Je site in een image en Compose heetten drie stappen
    // zo. De stap heet naar wat erin staat: geef het begin van de sectie een
    // eigen `###`.
    const fout = lessen.flatMap((les) => {
      const basis = les.schermen.filter((s) => s.naam.endsWith(' › De basis'));
      return basis.length > 1 ? [`${les.naam}: ${basis.map((s) => s.naam).join(', ')}`] : [];
    });
    expect(fout).toEqual([]);
  });

  it('wat je na een opdracht terugzet, staat in de opdracht en niet in het antwoord', () => {
    // "Haal het endpoint weer weg" en "Zet de limiet daarna terug" stonden
    // aan het eind van het antwoord. Wie het antwoord niet openklapt, leest
    // het niet, en de les erna gaat uit van de oude code. Een zin die alleen
    // beschrijft ("Gooi je dat bestand weg, dan …") is geen opdracht.
    const OPRUIMEN =
      /(?:^|[.?]\s+|\n)(?:Haal|Zet|Gooi|Start)\b(?! je\b)[^.\n]*\b(?:weer weg|terug|daarna weer)\b[^.\n]*\./;
    const fout = lessen.flatMap(({ naam, bron }) =>
      [...bron.matchAll(/### (Opdracht[^\n]*)\n([\s\S]*?)(?=\n### |\n## |$)/g)].flatMap((m) =>
        m[2]
          .split('<details>')
          .slice(1)
          .filter((blok) => blok.trimStart().startsWith('<summary>Antwoord') && OPRUIMEN.test(blok))
          .map(() => `${naam}: ${m[1]}`),
      ),
    );
    expect(fout).toEqual([]);
  });

  it('een opdracht zegt niet "uit het voorbeeld" in een les zonder sectie Voorbeeld', () => {
    const fout = lessen
      .filter((les) => !/^## Voorbeeld\b/m.test(les.bron))
      .filter((les) =>
        /\b(uit|Bouw) het voorbeeld\b/.test(les.bron.split(/^## Opdrachten\b/m)[1] ?? ''),
      )
      .map((les) => les.naam);
    expect(fout).toEqual([]);
  });

  it('de Run-opdrachten van Templates en formulieren stellen een vraag', () => {
    // Ze zeiden "maak het formulier en de endpoints", en dat had de leerling
    // in de uitleg net gedaan. Nu laat elke Run hem iets waarnemen.
    for (const naam of ['templates', 'forms', 'post_met_templates']) {
      const bron = lessen.find((les) => les.naam.endsWith(`formulieren/${naam}.mdx`))?.bron ?? '';
      const run =
        /### Opdracht \d+: Run[^\n]*\n\n([\s\S]*?)(?=\n### |\n## |$)/.exec(bron)?.[1] ?? '';
      expect(run.split('<details>')[0], naam).toContain('?');
      expect(run, naam).toContain('<summary>Antwoord</summary>');
    }
  });
});

describe('een regel code staat heel op één regel', () => {
  // De opdrachtgever wil geen regel code die afbreekt of zijwaarts buiten zijn
  // vak valt. Past de langste regel van een blok niet, dan maakt de les de
  // letters kleiner, tot 80% (packages/shared/components/LesTabs/pasCode.ts).
  // Gemeten in Chromium op 1280 pixels: met de kleinste letters passen er 84
  // tekens naast de uitleg van een <CodeUitleg>, en 123 over de volle breedte.
  // Wat langer is, hoort korter in de les: 55 regels zijn zo herschreven (een
  // functiekop met elke parameter op een eigen regel, een dictionary over
  // meer regels). Een blok zonder taal (een foutmelding, uitvoer van de
  // terminal) telt niet mee: dat breekt af, zoals in een terminal. Of het in
  // de browser past, meet `node scripts/meet-les-tabs.mjs fullstack`.
  const TALEN = /^(python|html|js|css|json|yaml|bash|jinja)$/;
  const regels = lessen.flatMap(({ naam, bron }) => {
    const uit: { naam: string; regel: string; inUitleg: boolean }[] = [];
    let taal: string | null = null;
    let inUitleg = false;
    for (const regel of bron.split('\n')) {
      if (regel.startsWith('<CodeUitleg')) inUitleg = true;
      if (regel.startsWith('</CodeUitleg')) inUitleg = false;
      const hek = /^\s*```(\w*)/.exec(regel);
      if (hek) taal = taal === null ? hek[1] || 'geen' : null;
      else if (taal !== null && TALEN.test(taal)) uit.push({ naam, regel, inUitleg });
    }
    return uit;
  });

  it('de test ziet de code van de lessen', () => {
    expect(regels.length).toBeGreaterThan(5000);
    expect(regels.filter((r) => r.inUitleg).length).toBeGreaterThan(500);
  });

  it('naast de uitleg van een <CodeUitleg> hooguit 84 tekens', () => {
    const fout = regels
      .filter((r) => r.inUitleg && r.regel.length > 84)
      .map((r) => `${r.naam} (${r.regel.length}): ${r.regel.trim().slice(0, 60)}`);
    expect(fout).toEqual([]);
  });

  it('en verder hooguit 122 tekens', () => {
    const fout = regels
      .filter((r) => r.regel.length > 122)
      .map((r) => `${r.naam} (${r.regel.length}): ${r.regel.trim().slice(0, 60)}`);
    expect(fout).toEqual([]);
  });
});

describe("pagina's waar je zoekt of afvinkt, hebben geen tabbladen", () => {
  it('de cheatsheet, Er gaat iets mis, de overzichten en de hand-outs', () => {
    // Zoeken met Ctrl+F vindt geen tekst in een tabblad dat dicht staat, en
    // een hand-out print je in zijn geheel.
    const vast = [
      'docs/cheatsheet.md',
      'docs/troubleshooting.md',
      'docs/FastAPI/index.mdx',
      'docs/veiligheid/index.mdx',
      'docs/online/index.mdx',
      'docs/FastAPI/projectstructuur.mdx',
      'docs/FastAPI/sqlitedict/op-een-rij.mdx',
      'docs/voor-de-docent/schoolserver.mdx',
    ];
    const handouts = paginas.filter((p) => p.naam.startsWith(join('docs', 'unplugged')));
    expect(handouts.length).toBeGreaterThan(5);
    const fout = [...vast.map((naam) => paginas.find((p) => p.naam === naam)), ...handouts]
      .filter((p) => !p || !zonderTabs(p.bron))
      .map((p) => p?.naam ?? 'pagina ontbreekt');
    expect(fout).toEqual([]);
  });

  it('een controlelijst met vakjes staat op één pagina', () => {
    // Beveilig je eigen project is één lijst om af te lopen, per reeks een
    // kop. In tabbladen stond hij over acht schermen, en de rij paste niet.
    const fout = paginas
      .filter((p) => (p.bron.match(/^- \[ \] /gm) ?? []).length >= 10 && !zonderTabs(p.bron))
      .map((p) => p.naam);
    expect(fout).toEqual([]);
    expect(
      zonderTabs(paginas.find((p) => p.naam.endsWith('veiligheid/eigen-project.mdx'))?.bron ?? ''),
    ).toBe(true);
  });
});

describe('de docentenhandleiding', () => {
  it('gaat over de literatuur, en is verder kort', () => {
    // Wij gaan niet over hoe iemand lesgeeft (schrijfgids §15). De
    // handleiding was 209 regels: lesadvies, een tabel met alle lessen en
    // een beschrijving van elke route. Wat een docent nodig heeft en niet
    // over lesgeven gaat (één server voor de klas), staat in voor-de-docent.
    const mdx = readFileSync(join(SITE, 'src/theme/MDXComponents.tsx'), 'utf8');
    expect(mdx).toMatch(/^\s+Werkvormen,$/m);
    const handleiding = readFileSync(join(SITE, 'src/pages/docenten.mdx'), 'utf8');
    expect(handleiding).toMatch(/^<Werkvormen \/>$/m);
    expect(handleiding).toContain('site:didactiek/');
    expect(handleiding.split('\n').length).toBeLessThanOrEqual(50);
    expect(handleiding).not.toMatch(/^## .*(Klassikaal|Didactische aanpak|Leerlijn)/m);
    expect(handleiding).toContain('(site:fullstack/docs/voor-de-docent/schoolserver)');
  });

  it('telt de diagrammen zoals de pagina waar ze staan', () => {
    // De handleiding zei vijf, de pagina Hoe een verzoek werkt zes.
    const pagina = paginas.find((p) => p.naam.endsWith('afronden/hoe-een-verzoek-werkt.mdx'));
    const aantal = /in (\w+) diagrammen/.exec(pagina?.bron ?? '')?.[1];
    expect(aantal).toBeTruthy();
    const handleiding = readFileSync(join(SITE, 'src/pages/docenten.mdx'), 'utf8');
    expect(handleiding).toContain(`de ${aantal} diagrammen`);
  });
});
