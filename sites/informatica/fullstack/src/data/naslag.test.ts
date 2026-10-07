import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Wat een leerling in de lessen leest, moet hij terugvinden op de plek waar
// hij gaat zoeken: in de navbar, in zijn eigen browser en in zijn terminal.
//
// De pagina met fouten heette in 21 lessen "de troubleshooting pagina", in de
// navbar "Er gaat iets mis" en op de installatiepagina "Troubleshooting". De
// ontwikkelaarstools gaven de Engelse labels (Request Method) waar een
// Nederlandse Chrome "Verzoekmethode" toont.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const lessen = [...alleLesbestanden(`${SITE}/docs`), ...alleLesbestanden(`${SITE}/src/pages`)];
const lees = (pad: string) => readFileSync(pad, 'utf8');
const kort = (pad: string) => pad.slice(SITE.length + 1);

describe('naslag en gereedschap', () => {
  it('een link naar de foutenpagina heet zoals in de navbar: Er gaat iets mis', () => {
    const fout = lessen.flatMap((pad) =>
      [...lees(pad).matchAll(/\[([^\]]+)\]\(\/docs\/troubleshooting[#)]/g)]
        .filter((m) => !m[1].startsWith('Er gaat iets mis'))
        .map((m) => `${kort(pad)}: [${m[1]}]`),
    );
    expect(fout).toEqual([]);
  });

  // Engels label → het label van een Nederlandse Chrome (front_end/core/i18n/
  // locales/nl.json). Staat het Engelse label in een les, dan ook het
  // Nederlandse.
  const LABELS: Record<string, string> = {
    'Request URL': 'Verzoek-URL',
    'Request Method': 'Verzoekmethode',
    'Status Code': 'Statuscode',
    'Preserve log': 'Logboek behouden',
    'Disable cache': 'Cache uitzetten',
  };

  it.each(Object.entries(LABELS))('naast "%s" staat ook "%s"', (engels, nederlands) => {
    const zonder = lessen
      .filter((pad) => lees(pad).includes(engels) && !lees(pad).includes(nederlands))
      .map(kort);
    expect(zonder).toEqual([]);
  });

  // Andersom: een Nederlands label dat niet uit nl.json van DevTools komt
  // (het menu van de herlaadknop is van Chrome zelf), of dat per taal anders
  // heet, krijgt zijn Engelse naam erbij. De filters in Netwerk stonden er in
  // het Engels (Doc, CSS, JS), terwijl een Nederlandse Chrome Document, Css en
  // JavaScript toont.
  const MET_ENGELS: Record<string, string> = {
    'Cache wissen en geforceerd opnieuw laden': 'Empty Cache and Hard Reload',
    'Document (Doc)': 'Css (CSS)',
  };

  it.each(Object.entries(MET_ENGELS))('naast "%s" staat ook "%s"', (nederlands, engels) => {
    const zonder = lessen
      .filter((pad) => lees(pad).includes(nederlands) && !lees(pad).includes(engels))
      .map(kort);
    expect(zonder).toEqual([]);
  });

  it('de filters in Netwerk heten zoals in een Nederlandse Chrome', () => {
    const tekst = lees(`${SITE}/docs/FastAPI/devtools-netwerk.mdx`);
    expect(tekst).not.toMatch(/Fetch\/XHR, Doc, CSS, JS/);
    expect(tekst).toContain('Document (Doc)');
  });

  it('de les die de eerste terminalregel belooft, legt de favicon-404 uit', () => {
    const tekst = lees(`${SITE}/docs/FastAPI/devtools-netwerk.mdx`);
    expect(tekst).toContain('GET /favicon.ico HTTP/1.1" 404\n');
  });

  // De terminalregels kwamen van kale uvicorn in een pijp: `INFO:     ...
  // 200 OK`. In de terminal van VS Code (een TTY) zet fastapi dev zijn eigen
  // opmaak aan: een streepje vooraan, geen INFO:, en alleen de statuscode
  // (nagedraaid met fastapi-cli 0.0.32 onder `script`). Een leerling die zijn
  // terminal naast de les legt, zag een andere regel.
  it('een terminalregel staat zoals fastapi dev hem in VS Code toont', () => {
    const fout = lessen.flatMap((pad) =>
      lees(pad)
        .split('\n')
        .filter(
          (regel) =>
            /^(INFO|WARNING|ERROR): {2,}/.test(regel) || /HTTP\/1\.1" \d{3} [A-Z]/.test(regel),
        )
        .map((regel) => `${kort(pad)}: ${regel.trim()}`),
    );
    expect(fout).toEqual([]);
  });
});

// Er gaat iets mis en de cheatsheet zijn de naslag van de cursus. Bij een
// leerling-doorloop bleken ze achter te lopen op de lessen: 405 stond drie keer
// op de foutenpagina en KeyError twee keer, de koppen volgden de oude indeling,
// de importlijst miste time, secrets, Cookie en escape, meldingen stonden er
// zonder de letterlijke tekst, en de cheatsheet had geen time.time_ns(), geen
// verborgen veld en verwijderde zonder controle.

const DOCS = `${SITE}/docs`;
const FOUTEN = lees(`${DOCS}/troubleshooting.md`);
const CHEATSHEET = lees(`${DOCS}/cheatsheet.md`);

type FoutItem = { summary: string; tekst: string };
const foutItems: FoutItem[] = [
  ...FOUTEN.matchAll(/<details>\s*<summary>(.+?)<\/summary>([\s\S]*?)<\/details>/g),
].map((m) => ({ summary: m[1], tekst: m[2] }));
const codeblokken = (tekst: string) =>
  [...tekst.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);

/** Foutnamen (KeyError, TemplateNotFound, WinError) en statuscodes in een tekst. */
const kenmerken = (tekst: string) => [
  ...new Set([
    ...(tekst.match(/\b[A-Z]\w*(?:Error|NotFound)\b/g) ?? []),
    ...(tekst.match(/\b[1-5]\d\d\b/g) ?? []),
  ]),
];

describe('Er gaat iets mis', () => {
  it('leest de items überhaupt uit', () => {
    expect(foutItems.length).toBeGreaterThan(30);
  });

  it('elk item heeft Oorzaak, Oplossing en Meer uitleg (schrijfgids §8)', () => {
    const fout = foutItems
      .filter(
        ({ tekst }) =>
          !tekst.includes('**Oorzaak:**') ||
          !tekst.includes('**Oplossing:**') ||
          !/Meer uitleg: (\[|<SiteLink)/.test(tekst),
      )
      .map((i) => i.summary);
    expect(fout).toEqual([]);
  });

  it('een foutnaam of statuscode in de summary staat letterlijk in een codeblok', () => {
    // Zo kan een leerling zijn eigen melding naast die van de pagina leggen.
    const fout = foutItems.flatMap(({ summary, tekst }) => {
      const code = codeblokken(tekst).join('\n');
      return kenmerken(summary)
        .filter((k) => !code.includes(k))
        .map((k) => `${summary}: ${k}`);
    });
    expect(fout).toEqual([]);
  });

  // Dezelfde foutnaam in twee summaries mag alleen als het echt twee fouten
  // zijn, met een andere oorzaak en een andere oplossing.
  const MAG_DUBBEL: Record<string, string> = {
    NameError: "name 'app' (endpoint boven de app) en een ontbrekende import",
    ModuleNotFoundError: 'fastapi bij de eerste server, sqlitedict bij de database',
    '404': 'de favicon-404 is geen fout, een 404 op je eigen pagina wel',
  };

  it('geen foutnaam of statuscode onder twee koppen', () => {
    const tellingen = new Map<string, string[]>();
    for (const { summary } of foutItems) {
      for (const k of kenmerken(summary)) tellingen.set(k, [...(tellingen.get(k) ?? []), summary]);
    }
    const dubbel = [...tellingen]
      .filter(([k, summaries]) => summaries.length > 1 && !(k in MAG_DUBBEL))
      .map(([k, summaries]) => `${k}: ${summaries.join(' | ')}`);
    expect(dubbel).toEqual([]);
  });

  it('de koppen zijn de categorieën van de sidebar, in dezelfde volgorde', () => {
    const labels = (sidebars.apiSidebar as unknown as { label: string }[]).map((c) => c.label);
    const koppen = [...FOUTEN.matchAll(/^## (.+?)(?: \\?\{#[\w-]+\})?$/gm)].map((m) => m[1]);
    const zonderAlgemeen = koppen.filter((k) => k !== 'Algemeen');

    expect(zonderAlgemeen.filter((k) => !labels.includes(k))).toEqual([]);
    expect(zonderAlgemeen).toEqual(labels.filter((l) => koppen.includes(l)));
    // Algemeen is voor Python-fouten die overal kunnen, en staat onderaan.
    if (koppen.includes('Algemeen')) expect(koppen.at(-1)).toBe('Algemeen');
  });

  it('elk anker waar een les naar linkt, bestaat op de pagina', () => {
    // templates.mdx linkt naar #templates-jinja2; die kop heet nu Templates en
    // formulieren en houdt het oude anker met \{#templates-jinja2}.
    const slug = (kop: string) =>
      kop
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s/g, '-');
    const ankers = new Set(
      [...FOUTEN.matchAll(/^#{2,6} (.+?)(?: \\?\{#([\w-]+)\})?$/gm)].map((m) => m[2] ?? slug(m[1])),
    );
    const fout = lessen.flatMap((pad) =>
      [...lees(pad).matchAll(/\/docs\/troubleshooting#([\w-]+)/g)]
        .filter((m) => !ankers.has(m[1]))
        .map((m) => `${kort(pad)}: #${m[1]}`),
    );
    expect(fout).toEqual([]);
  });

  it('elke import uit de lessen staat in de importlijst', () => {
    const lesTekst = readdirSync(`${DOCS}/FastAPI`)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => lees(`${DOCS}/FastAPI/${f}`))
      .join('\n');
    const inLessen = new Set<string>();
    const pythonCode = [...lesTekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)]
      .map((m) => m[1])
      .join('\n');
    for (const m of pythonCode.matchAll(/^\s*from [\w.]+ import ([\w, ]+)$/gm)) {
      for (const naam of m[1].split(',')) inLessen.add(naam.trim());
    }
    for (const m of pythonCode.matchAll(/^\s*import (\w+)$/gm)) inLessen.add(m[1]);
    // "Zet `import time` bovenaan": ook een import in de lopende tekst telt.
    for (const m of lesTekst.matchAll(/`(?:from [\w.]+ )?import (\w+)`/g)) inLessen.add(m[1]);

    const lijst = codeblokken(FOUTEN).find(
      (c) => c.includes('from sqlitedict import SqliteDict') && c.includes('import time'),
    );
    expect(lijst, 'importlijst met sqlitedict en time').toBeDefined();
    const inLijst = new Set(
      [...(lijst as string).matchAll(/import ([\w, ]+)$/gm)].flatMap((m) =>
        m[1].split(',').map((n) => n.trim()),
      ),
    );
    expect([...inLessen].filter((n) => !inLijst.has(n)).sort()).toEqual([]);
  });

  // Meldingen die per Python-versie of per systeem anders luiden. Staat de
  // ene er, dan ook de andere: een leerling zoekt op wat hij zelf ziet.
  const PAREN: [string, string][] = [
    ['Unprocessable Entity', 'Unprocessable Content'],
    ['command not found', 'niet herkend'],
    ['Address already in use', 'WinError 10048'],
  ];

  it.each(PAREN)('naast "%s" staat ook "%s"', (een, ander) => {
    const zonder = [
      ['troubleshooting.md', FOUTEN],
      ['cheatsheet.md', CHEATSHEET],
    ]
      .filter(([, tekst]) => tekst.includes(een) && !tekst.includes(ander))
      .map(([naam]) => naam);
    expect(zonder).toEqual([]);
  });
});

describe('Cheatsheet', () => {
  // De bouwstenen van de basis, die lesvolgorde.test.ts in de hoofdtekst
  // eist: wie iets opzoekt, vindt in de cheatsheet van elk onderdeel het
  // minimale voorbeeld.
  it.each([
    'time.time_ns()',
    'list(db.values())',
    'db.items()',
    '{% for sleutel, bericht in berichten %}',
    'href="/bericht/{{ sleutel }}"',
    'type="hidden"',
    'del db[',
    'RedirectResponse',
    'status_code=303',
    'status_code=400',
    'status_code=404',
    'TemplateResponse(request',
    'term: str = ""',
    '{% if',
    'app.mount',
    'python -m pip install',
  ])('bevat %s', (bouwsteen) => {
    expect(CHEATSHEET).toContain(bouwsteen);
  });

  it('verwijderen gebeurt altijd met een controle of de sleutel bestaat', () => {
    // Zonder controle crasht de tweede klik op Verwijderen met een KeyError (500).
    const fout = codeblokken(CHEATSHEET).filter((code) =>
      [...code.matchAll(/\bdel (\w+)\[/g)].some((m) => !new RegExp(`\\bin ${m[1]}\\b`).test(code)),
    );
    expect(fout).toEqual([]);
  });
});
