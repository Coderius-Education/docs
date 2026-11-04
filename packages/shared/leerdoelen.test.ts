import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BLOOM,
  NIVEAUS,
  cijferKolommen,
  cijferTekst,
  cijferVoor,
  leesLeerdoelen,
  moeilijkhedenTekst,
  moeilijkheidVoorstel,
  projectNiveaus,
  sjabloonZin,
} from './leerdoelen';
import { SITES, siteDir } from './sites';

const require = createRequire(import.meta.url);
const ROOT = join(__dirname, '..', '..');
const plugin = require('./plugins/leerdoelen.js');

// De leerdoelen per cursus (src/leerdoelen.json) en de beoordeling volgens
// Bloom (leerdoelen/bloom.json): de vorm van elk bestand, het cijfer uit het
// beoordelingsblad, het voorstel voor de moeilijkheid, en de routes.

function bestaat(pad: string): boolean {
  try {
    readFileSync(pad);
    return true;
  } catch {
    return false;
  }
}

const MET_LEERDOELEN = SITES.filter((s) =>
  bestaat(join(ROOT, siteDir(s.id), 'src', 'leerdoelen.json')),
);

describe('src/leerdoelen.json per cursus', () => {
  it('heeft minstens één cursus met leerdoelen', () => {
    expect(MET_LEERDOELEN.map((s) => s.id)).toContain('web');
  });

  for (const site of MET_LEERDOELEN) {
    it(`${site.id}: elke rij staat op één regel, zodat je de niveaus naast elkaar ziet`, () => {
      // Biome verdeelde een te lange rij over tien regels (Godot); de override
      // in biome.json geeft leerdoelen.json daarom een ruime regelbreedte.
      const bestand = join(ROOT, siteDir(site.id), 'src', 'leerdoelen.json');
      const tekst = readFileSync(bestand, 'utf8');
      const aantal = JSON.parse(tekst).concepten.length;
      // Alleen de regels van de concepten: de onderwerpen mogen er ook zo staan.
      const concepten = tekst.slice(tekst.indexOf('"concepten": ['));
      const rijen = concepten.split('\n').filter((r) => /^ {4}\{ "id": .* \},?$/.test(r));
      expect(rijen.length, 'rijen op één regel').toBe(aantal);
    });

    it(`${site.id}: klopt met de vorm`, () => {
      const bestand = join(ROOT, siteDir(site.id), 'src', 'leerdoelen.json');
      expect(() =>
        leesLeerdoelen(JSON.parse(readFileSync(bestand, 'utf8')), bestand),
      ).not.toThrow();
    });
  }
});

describe('alleen niveaus, geen schoolsoorten', () => {
  it('noemt geen schoolsoort in de leerdoelen, de niveaus of de pagina', () => {
    const bestanden = [
      join(__dirname, 'leerdoelen', 'niveaus.json'),
      join(__dirname, 'leerdoelen', 'bloom.json'),
      ...[
        'Bloom',
        'LeerdoelenPagina',
        'NiveauPagina',
        'Niveau',
        'Vergelijking',
        'VergelijkPagina',
        'Tentamen',
      ].map((c) => join(__dirname, 'components', 'Leerdoelen', `${c}.tsx`)),
      ...MET_LEERDOELEN.map((s) => join(ROOT, siteDir(s.id), 'src', 'leerdoelen.json')),
    ];
    for (const bestand of bestanden) {
      expect(readFileSync(bestand, 'utf8'), bestand).not.toMatch(/\b(havo|vwo)\b/i);
    }
  });
});

describe('leesLeerdoelen', () => {
  const goed = {
    niveaus: ['1', '3'],
    onderwerpen: [{ id: 'gd', label: 'GDScript' }],
    concepten: [
      { id: 'gd-groups', onderwerp: 'gd', concept: 'groups', 1: 'gevorderd', 3: 'basis' },
      {
        id: 'gd-loops',
        onderwerp: 'gd',
        concept: 'loops',
        bloom: 'toepassen',
        1: 'gevorderd',
        3: 'expert',
      },
    ],
  };

  it('kent vier niveaus, voor elke cursus dezelfde', () => {
    expect(NIVEAUS.map((n) => n.label)).toEqual(['Niveau 1', 'Niveau 2', 'Niveau 3', 'Niveau 4']);
  });

  it('zet de niveaus van een rij bij elkaar, met de naam van het niveau', () => {
    const uit = leesLeerdoelen(goed);
    expect(uit.niveaus).toEqual([
      { id: '1', label: 'Niveau 1' },
      { id: '3', label: 'Niveau 3' },
    ]);
    expect(uit.concepten).toEqual([
      {
        id: 'gd-groups',
        onderwerp: 'gd',
        concept: 'groups',
        niveau: { 1: 'gevorderd', 3: 'basis' },
      },
      {
        id: 'gd-loops',
        onderwerp: 'gd',
        concept: 'loops',
        bloom: 'toepassen',
        niveau: { 1: 'gevorderd', 3: 'expert' },
      },
    ]);
  });

  it('meldt alle fouten tegelijk, met de naam van het bestand', () => {
    const fout = {
      ...goed,
      concepten: [
        { id: 'gd-groups', onderwerp: 'gd', concept: 'groups', 1: 'gevorderd' },
        { id: 'gd-groups', onderwerp: 'x', concept: '', 1: 'moeilijk', 3: 'basis' },
        { id: 'gd-tweens', onderwerp: 'gd', concept: 'tweens', 1: 'basis', 3: 'basis', 4: 'basis' },
        { id: 'gd-json', onderwerp: 'gd', concept: 'JSON', 1: 'basis', 3: 'basis', bloom: 'weten' },
      ],
    };
    let melding = '';
    try {
      leesLeerdoelen(fout, 'godot/src/leerdoelen.json');
    } catch (e) {
      melding = (e as Error).message;
    }
    expect(melding).toContain('godot/src/leerdoelen.json');
    expect(melding).toContain("concept 'gd-groups': niveau '3' ontbreekt");
    expect(melding).toContain("concept 'gd-groups' staat er twee keer");
    expect(melding).toContain("onbekend onderwerp 'x'");
    expect(melding).toContain('concept (de tekst) ontbreekt');
    expect(melding).toContain("'moeilijk' bij 1");
    // Een niveau dat de cursus niet heeft: een tikfout in een kolom valt op.
    expect(melding).toContain("concept 'gd-tweens': onbekend veld '4'");
    expect(melding).toContain("onbekende denkvaardigheid 'weten'");
  });

  it('zet expert alleen in de cijfertabel van een cursus met expertconcepten', () => {
    // De Bloom-uitleg van web had een Expert-kolom, terwijl web geen expert heeft.
    expect(cijferKolommen(leesLeerdoelen(goed)).map((m) => m.id)).toEqual([
      'niet-aan-basis',
      'basis',
      'gevorderd',
      'expert',
    ]);
    const web = join(ROOT, siteDir('web'), 'src', 'leerdoelen.json');
    const webKolommen = cijferKolommen(leesLeerdoelen(JSON.parse(readFileSync(web, 'utf8'))));
    expect(webKolommen.map((m) => m.id)).toEqual(['niet-aan-basis', 'basis', 'gevorderd']);
  });

  it('noemt alleen de moeilijkheden die de cursus gebruikt', () => {
    // Het overzicht van web noemde expert, terwijl web geen expertconcepten heeft.
    expect(moeilijkhedenTekst(leesLeerdoelen(goed))).toBe('basis, gevorderd of expert');
    const zonderExpert = { ...goed, concepten: [goed.concepten[0]] };
    expect(moeilijkhedenTekst(leesLeerdoelen(zonderExpert))).toBe('basis of gevorderd');
    const web = join(ROOT, siteDir('web'), 'src', 'leerdoelen.json');
    expect(moeilijkhedenTekst(leesLeerdoelen(JSON.parse(readFileSync(web, 'utf8'))))).toBe(
      'basis of gevorderd',
    );
  });

  it('weigert een onbekend niveau, geen niveaus, of niveaus door elkaar', () => {
    expect(() => leesLeerdoelen({ ...goed, niveaus: [] })).toThrow(/minstens één niveau/);
    expect(() => leesLeerdoelen({ ...goed, niveaus: ['start'] })).toThrow(
      'onbekend niveau "start" (wel: 1, 2, 3, 4)',
    );
    expect(() => leesLeerdoelen({ ...goed, niveaus: ['3', '1'] })).toThrow(
      'zet de niveaus op volgorde: 1, 3',
    );
  });
});

describe('een niveau met een tentamen', () => {
  // Algoritmiek sluit niveau 2 af met een papieren tentamen, niet met een
  // project. Daar is een concept niet basis of gevorderd: er geldt een lijst
  // manieren waarop je het moet kennen (uitleggen, stellingen, aanvullen …),
  // en per manier is er een les waar je hem oefent.
  const manier = (id: string, lessen: string[]) => ({
    id,
    label: id,
    uitleg: `je kunt ${id}`,
    vraagtype: `type ${id}`,
    lessen,
  });
  const tentamen = {
    niveau: '2',
    vorm: 'Een papieren tentamen.',
    bron: '/bronnen/toetsing',
    manieren: [manier('begrijpen', ['concept', 'spel']), manier('aanvullen', ['bouwen/'])],
    onderwerpen: { zoeken: 'Van deze algoritmes ken je alles.' },
  };
  const met = (concepten: unknown[], extra: object = {}) =>
    leesLeerdoelen({
      niveaus: ['1', '2'],
      onderwerpen: [{ id: 'zoeken', label: 'Zoeken' }],
      concepten,
      tentamen: { ...tentamen, ...extra },
    });
  const rij = (id: string, manieren: unknown, les: unknown = `${id}/concept`) => ({
    id,
    onderwerp: 'zoeken',
    concept: id,
    1: 'basis',
    2: manieren,
    les,
  });

  it('leest per concept de manieren op het tentamen-niveau, en de moeilijkheid op de andere', () => {
    const l = met([rij('binair', ['begrijpen', 'aanvullen']), rij('dijkstra-papier', [])]);
    expect(l.concepten[0]).toMatchObject({
      niveau: { 1: 'basis' },
      manieren: ['begrijpen', 'aanvullen'],
    });
    expect(l.concepten[1].manieren).toEqual([]);
    expect(l.tentamen?.onderwerpen.zoeken).toBe('Van deze algoritmes ken je alles.');
    expect(projectNiveaus(l).map((n) => n.id)).toEqual(['1']);
  });

  it('weigert een onbekende of dubbele manier, en een moeilijkheid op het tentamen-niveau', () => {
    expect(() => met([rij('a', ['raden'])])).toThrow(/bij 2 \(het tentamen\) een lijst manieren/);
    expect(() => met([rij('a', 'basis')])).toThrow(/een lijst manieren/);
    expect(() => met([rij('a', ['begrijpen', 'begrijpen'])])).toThrow(/staat een manier twee keer/);
  });

  it('eist een les uit de eigen cursus bij een concept met manieren', () => {
    expect(() =>
      met([rij('a', ['begrijpen'], 'site:python/docs/basis/jij-als-variabele')]),
    ).toThrow(/met manieren hoort een les uit de eigen cursus/);
    expect(() => met([{ ...rij('a', ['begrijpen']), les: undefined }])).toThrow(
      /met manieren hoort een les/,
    );
  });

  it('weigert een tentamen op een onbekend niveau, zonder manieren of met een bron buiten vakdidactiek', () => {
    expect(() => met([rij('a', [])], { niveau: '4' })).toThrow(/niveau '4' staat niet in niveaus/);
    expect(() => met([rij('a', [])], { manieren: [] })).toThrow(/minstens één manier/);
    expect(() => met([rij('a', [])], { bron: 'https://slo.nl/x.pdf' })).toThrow(
      /bron is het pad van een pagina bij vakdidactiek/,
    );
    expect(() => met([rij('a', [])], { onderwerpen: { weg: 'x' } })).toThrow(
      /onbekend onderwerp 'weg'/,
    );
  });

  it('koppelt per manier de eerste les die in de map van het concept bestaat', () => {
    const docs = [
      { id: 'hanoi/spel', title: 'Het spel', permalink: '/a/docs/hanoi/spel' },
      {
        id: 'hanoi/bouwen/basisgeval',
        title: 'Bouwsteen 2',
        permalink: '/a/b2',
        sidebarPosition: 5,
      },
      { id: 'hanoi/bouwen/een-zet', title: 'Bouwsteen 1', permalink: '/a/b1', sidebarPosition: 4 },
    ];
    const l = plugin.koppelLessen(
      met([rij('hanoi', ['begrijpen', 'aanvullen'], 'hanoi/spel')]),
      docs,
    );
    expect(l.concepten[0].oefenen).toEqual({
      begrijpen: { id: 'hanoi/spel', titel: 'Het spel', pad: '/a/docs/hanoi/spel' },
      aanvullen: { id: 'hanoi/bouwen/een-zet', titel: 'Bouwsteen 1', pad: '/a/b1' },
    });
    expect(() =>
      plugin.koppelLessen(met([rij('hanoi', ['aanvullen'], 'hanoi/spel')]), docs.slice(0, 1)),
    ).toThrow("concept 'hanoi': geen les voor 'aanvullen' in hanoi/ (gezocht: bouwen/)");
  });

  it('linkt een les in een andere cursus via de registry, zonder hem in de eigen docs te zoeken', () => {
    const l = plugin.koppelLessen(
      met([rij('variabelen', [], 'site:python/docs/basis/jij-als-variabele')]),
      [],
    );
    expect(l.concepten[0].lessen).toEqual([
      {
        id: 'site:python/docs/basis/jij-als-variabele',
        titel: 'variabelen (cursus Python)',
        pad: 'https://informatica.coderius.nl/python/docs/basis/jij-als-variabele',
        extern: true,
      },
    ]);
  });

  it('heeft geen vergelijking als er maar één niveau met een project is', () => {
    const l = met([rij('a', [])]);
    const paden = plugin.routes('/a/', l).map((r: { path: string }) => r.path);
    expect(paden).toEqual(['/a/leerdoelen', '/a/leerdoelen/niveau-1', '/a/leerdoelen/niveau-2']);
  });

  for (const site of MET_LEERDOELEN) {
    const bestand = join(ROOT, siteDir(site.id), 'src', 'leerdoelen.json');
    const data = JSON.parse(readFileSync(bestand, 'utf8'));
    if (!data.tentamen) continue;
    it(`${site.id}: de bron van het tentamen staat bij vakdidactiek, met een tip`, () => {
      const didactiek = join(ROOT, siteDir('didactiek'));
      const slug = data.tentamen.bron.replace(/^\/bronnen\//, '');
      expect(bestaat(join(didactiek, 'docs', `${slug}.md`)), `docs/${slug}.md`).toBe(true);
      const tips = readFileSync(join(didactiek, 'src', 'data', 'tips.ts'), 'utf8');
      expect(tips).toContain(`detailPad: '${data.tentamen.bron}'`);
    });
  }
});

describe('cijfer volgens het beoordelingsblad', () => {
  it('is de tabel van het tabblad Beoordeling', () => {
    // Rij per denkvaardigheid: niet aan basis voldaan, basis, gevorderd.
    const blad: Record<string, [number, number, number]> = {
      onthouden: [1, 5, 5],
      begrijpen: [4, 6, 7],
      toepassen: [4, 6.5, 7.5],
      analyseren: [4, 6.5, 8],
      evalueren: [4, 6.5, 9],
      creëren: [4, 6.5, 10],
    };
    expect(BLOOM.denkvaardigheden.map((d) => d.id)).toEqual(Object.keys(blad));
    for (const [bloom, [niet, basis, gevorderd]] of Object.entries(blad)) {
      expect(cijferVoor(bloom, 'niet-aan-basis')).toBe(niet);
      expect(cijferVoor(bloom, 'basis')).toBe(basis);
      expect(cijferVoor(bloom, 'gevorderd')).toBe(gevorderd);
      // Expert heeft nog geen eigen kolom: hij telt als gevorderd.
      expect(cijferVoor(bloom, 'expert')).toBe(gevorderd);
    }
  });

  it('weigert een onbekende denkvaardigheid of moeilijkheid', () => {
    expect(() => cijferVoor('weten', 'basis')).toThrow(/denkvaardigheid/);
    // @ts-expect-error: geen moeilijkheid
    expect(() => cijferVoor('toepassen', 'moeilijk')).toThrow(/moeilijkheid/);
  });

  it('vult het sjabloon in, met een komma in het cijfer', () => {
    expect(cijferTekst(6.5)).toBe('6,5');
    expect(cijferTekst(5)).toBe('5,0');
    expect(sjabloonZin('toepassen', 'basis')).toBe(
      'Ik heb bij jou Bloom niveau toepassen gezien voor de moeilijkheid basis en daarbij hoort het cijfer 6,5.',
    );
    expect(sjabloonZin('creëren', 'expert')).toBe(
      'Ik heb bij jou Bloom niveau creëren gezien voor de moeilijkheid expert en daarbij hoort het cijfer 10,0.',
    );
  });

  it('noemt alleen bronnen die vakdidactiek uitlegt, met dezelfde paper', () => {
    // Een bron op de leerdoelen hoort bij een pagina op de didactiek-site,
    // met de paper en het jaar erin, en bij een tip in tips.ts.
    const didactiek = join(ROOT, siteDir('didactiek'));
    const tips = readFileSync(join(didactiek, 'src', 'data', 'tips.ts'), 'utf8');
    expect(BLOOM.bronnen.length).toBeGreaterThan(0);
    for (const bron of BLOOM.bronnen) {
      const slug = bron.didactiek.replace(/^\/bronnen\//, '');
      expect(bron.didactiek, bron.titel).toBe(`/bronnen/${slug}`);
      const pagina = readFileSync(join(didactiek, 'docs', `${slug}.md`), 'utf8');
      expect(pagina).toContain(bron.titel);
      expect(pagina).toContain(`${bron.auteurs}, D. R. (${bron.jaar})`);
      expect(pagina).toMatch(/\[Lees de paper \(DOI\)\]\(https:\/\/doi\.org\//);
      expect(pagina).toContain(`title: ${bron.didactiekLabel}`);
      expect(tips).toContain(`detailPad: '${bron.didactiek}'`);
      // Geen andere paper zonder citaat en beschrijving: elk jaartal op de
      // pagina is dat van de bron (eerst stond er "In 1956 publiceerden …").
      const jaren = new Set(pagina.match(/\b(?:19|20)\d{2}\b/g));
      expect([...jaren], slug).toEqual([String(bron.jaar)]);
    }
  });
});

describe('moeilijkheidVoorstel: de vuistregels', () => {
  const t = (used: number, total: number) => ({ used, total });
  const web = (html: number[], css: number[], js: number[]) => [
    { label: 'HTML', basis: t(html[0], 6), gevorderd: t(html[1], 1), expert: t(0, 0) },
    { label: 'CSS', basis: t(css[0], 3), gevorderd: t(css[1], 3), expert: t(0, 0) },
    { label: 'JavaScript', basis: t(js[0], 5), gevorderd: t(js[1], 7), expert: t(0, 0) },
  ];

  it('gevorderd vraagt een gevorderd concept bij elk onderwerp', () => {
    expect(moeilijkheidVoorstel(web([3, 1], [2, 1], [2, 2])).moeilijkheid).toBe('gevorderd');
  });

  it('gevorderd in HTML en JavaScript maar niet in CSS is basis, en zegt waarom', () => {
    expect(moeilijkheidVoorstel(web([3, 1], [2, 0], [2, 2]))).toEqual({
      moeilijkheid: 'basis',
      reden: 'Bij elk onderwerp een concept op basis, maar bij CSS geen concept op gevorderd.',
    });
  });

  it('heel veel van hetzelfde concept telt één keer: alleen HTML is niet aan basis', () => {
    expect(moeilijkheidVoorstel(web([6, 0], [0, 0], [0, 0]))).toEqual({
      moeilijkheid: 'niet-aan-basis',
      reden: 'Geen concept toegepast bij CSS en JavaScript.',
    });
  });

  it('een gevorderd concept telt ook voor basis', () => {
    expect(moeilijkheidVoorstel(web([0, 1], [0, 1], [0, 1])).moeilijkheid).toBe('gevorderd');
  });

  it('een onderwerp zonder concepten op een moeilijkheid telt daar niet mee', () => {
    const fullstack = [
      { label: 'FastAPI', basis: t(2, 8), gevorderd: t(1, 4), expert: t(1, 2) },
      { label: 'Database', basis: t(0, 0), gevorderd: t(1, 2), expert: t(0, 0) },
    ];
    expect(moeilijkheidVoorstel(fullstack)).toEqual({
      moeilijkheid: 'expert',
      reden: 'Bij elk onderwerp een concept op expert.',
    });
  });

  it('zegt het als een niveau geen concepten heeft, in plaats van een lege lijst', () => {
    expect(moeilijkheidVoorstel([])).toEqual({
      moeilijkheid: 'niet-aan-basis',
      reden: 'Er zijn geen concepten voor dit niveau.',
    });
  });

  it('zonder expertconcepten in het niveau blijft gevorderd het hoogste', () => {
    expect(moeilijkheidVoorstel(web([1, 1], [1, 1], [1, 1])).reden).toBe(
      'Bij elk onderwerp een concept op gevorderd.',
    );
  });
});

describe('plugin en createConfig', () => {
  const leerdoelen = leesLeerdoelen({
    niveaus: ['1', '2', '3', '4'],
    onderwerpen: [{ id: 'gd', label: 'GDScript' }],
    concepten: [
      { id: 'gd-a', onderwerp: 'gd', concept: 'a', 1: 'basis', 2: 'basis', 3: 'basis', 4: 'basis' },
    ],
  });

  it('maakt het overzicht, een route per niveau en bij meer niveaus de vergelijking', () => {
    expect(plugin.routes('/godot/', leerdoelen).map((r: { path: string }) => r.path)).toEqual([
      '/godot/leerdoelen',
      '/godot/leerdoelen/vergelijken',
      '/godot/leerdoelen/niveau-1',
      '/godot/leerdoelen/niveau-2',
      '/godot/leerdoelen/niveau-3',
      '/godot/leerdoelen/niveau-4',
    ]);
    const een = { ...leerdoelen, niveaus: [leerdoelen.niveaus[0]] };
    expect(plugin.routes('/web/', een).map((r: { path: string }) => r.path)).toEqual([
      '/web/leerdoelen',
      '/web/leerdoelen/niveau-1',
    ]);
  });

  it('elk component van een route staat in de exports van het pakket', () => {
    const exports = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8')).exports;
    for (const route of plugin.routes('/x/', leerdoelen)) {
      const sleutel = route.component.replace('@coderius/shared', '.');
      expect(exports[sleutel], route.component).toBeDefined();
    }
  });

  describe('na de build', () => {
    let map = '';
    afterEach(() => {
      if (map) rmSync(map, { recursive: true, force: true });
      map = '';
      vi.restoreAllMocks();
    });

    it('stopt bij een fout bestand en schrijft anders leerdoelen.json in de build', async () => {
      map = mkdtempSync(join(tmpdir(), 'leerdoelen-'));
      const src = join(map, 'src');
      require('node:fs').mkdirSync(src);
      writeFileSync(join(src, 'leerdoelen.json'), '{"niveaus": []}');
      expect(() => plugin({ siteDir: map, baseUrl: '/x/' }, { siteId: 'x' })).toThrow(/niveau/);

      writeFileSync(
        join(src, 'leerdoelen.json'),
        JSON.stringify({
          niveaus: ['1'],
          onderwerpen: [{ id: 'a', label: 'A' }],
          concepten: [{ id: 'a-1', onderwerp: 'a', concept: 'één', 1: 'basis', les: 'a/een' }],
        }),
      );
      const p = plugin({ siteDir: map, baseUrl: '/x/' }, { siteId: 'x' });
      const routesGezien: { path: string; props?: { leerdoelen?: unknown } }[] = [];
      const docs = [{ id: 'a/een', title: 'Les één', permalink: '/x/docs/a/een' }];
      await p.allContentLoaded({
        allContent: {
          'docusaurus-plugin-content-docs': { default: { loadedVersions: [{ docs }] } },
        },
        actions: { addRoute: (r: (typeof routesGezien)[number]) => routesGezien.push(r) },
      });
      await p.postBuild({ outDir: map });
      const uit = JSON.parse(readFileSync(join(map, 'leerdoelen.json'), 'utf8'));
      expect(uit.cursus).toBe('x');
      // De les staat in de build met titel en adres, ook voor coderius.nl.
      expect(uit.concepten[0].lessen).toEqual([
        { id: 'a/een', titel: 'Les één', pad: '/x/docs/a/een' },
      ]);
      expect(routesGezien.map((r) => r.path)).toEqual(['/x/leerdoelen', '/x/leerdoelen/niveau-1']);
    });
  });

  describe('lessen per concept', () => {
    const met = (les: unknown) =>
      leesLeerdoelen({
        niveaus: ['1'],
        onderwerpen: [{ id: 'a', label: 'A' }],
        concepten: [{ id: 'a-1', onderwerp: 'a', concept: 'één', 1: 'basis', les }],
      });

    it('neemt een doc-id of een lijst daarvan', () => {
      expect(met('html-css/flexbox').concepten[0].lessen).toEqual([{ id: 'html-css/flexbox' }]);
      expect(met(['html-css/flexbox', 'html-css/css-grid']).concepten[0].lessen).toHaveLength(2);
    });

    it('weigert een pad, een bestandsnaam of een lege lijst', () => {
      for (const fout of ['/docs/html-css/flexbox', 'html-css/flexbox.mdx', [], 3]) {
        expect(() => met(fout), String(fout)).toThrow(/les moet een doc-id zijn/);
      }
    });

    it('zoekt titel en adres op, en stopt bij een les die niet bestaat', () => {
      const docs = [
        { id: 'html-css/flexbox', title: 'Flexbox', permalink: '/web/docs/html-css/flexbox' },
      ];
      expect(plugin.koppelLessen(met('html-css/flexbox'), docs).concepten[0].lessen).toEqual([
        { id: 'html-css/flexbox', titel: 'Flexbox', pad: '/web/docs/html-css/flexbox' },
      ]);
      expect(() => plugin.koppelLessen(met('html-css/weg'), docs)).toThrow(
        "concept 'a-1': les 'html-css/weg' bestaat niet",
      );
    });

    it('vindt lessen in elke docs-plugin, en per plugin in de nieuwste versie', () => {
      const allContent = {
        'docusaurus-plugin-content-docs': {
          default: {
            loadedVersions: [
              { isLast: false, docs: [{ id: 'oud', title: 'Oud', permalink: '/x/next/oud' }] },
              { isLast: true, docs: [{ id: 'a', title: 'A', permalink: '/x/docs/a' }] },
            ],
          },
          extra: { loadedVersions: [{ docs: [{ id: 'b', title: 'B', permalink: '/x/extra/b' }] }] },
        },
      };
      expect(plugin.docsVan(allContent).map((d: { id: string }) => d.id)).toEqual(['a', 'b']);
      expect(plugin.docsVan({})).toEqual([]);
    });

    it('zegt het als de cursus geen docs heeft', () => {
      expect(() => plugin.koppelLessen(met('a/b'), [])).toThrow(/de cursus heeft geen docs/);
    });

    it('web heeft bij elk concept een les', () => {
      const web = join(ROOT, siteDir('web'), 'src', 'leerdoelen.json');
      const zonder = leesLeerdoelen(JSON.parse(readFileSync(web, 'utf8'))).concepten.filter(
        (c) => !c.lessen,
      );
      expect(zonder.map((c) => c.id)).toEqual([]);
    });
  });

  it('createConfig zet de plugin en de footerlink alleen bij een site met leerdoelen', () => {
    const { createConfig } = require('./config');
    const voetLinks = (config: {
      themeConfig: { footer: { links: { items: { to?: string }[] }[] } };
    }) => config.themeConfig.footer.links.flatMap((k) => k.items.map((i) => i.to));
    const plugins = (config: { plugins: unknown[] }) =>
      config.plugins.filter((p) => Array.isArray(p) && p[0] === plugin);

    vi.spyOn(process, 'cwd').mockReturnValue(join(ROOT, siteDir('web')));
    const web = createConfig({ siteId: 'web' });
    expect(voetLinks(web)).toContain('/leerdoelen');
    expect(plugins(web)).toEqual([[plugin, { siteId: 'web' }]]);

    vi.spyOn(process, 'cwd').mockReturnValue(join(ROOT, siteDir('python')));
    const python = createConfig({ siteId: 'python' });
    expect(voetLinks(python)).not.toContain('/leerdoelen');
    expect(plugins(python)).toEqual([]);
    vi.restoreAllMocks();
  });
});
