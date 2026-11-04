import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BLOOM,
  cijferTekst,
  cijferVoor,
  leesLeerdoelen,
  moeilijkheidVoorstel,
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
    it(`${site.id}: klopt met de vorm`, () => {
      const bestand = join(ROOT, siteDir(site.id), 'src', 'leerdoelen.json');
      expect(() =>
        leesLeerdoelen(JSON.parse(readFileSync(bestand, 'utf8')), bestand),
      ).not.toThrow();
    });
  }
});

describe('leesLeerdoelen', () => {
  const goed = {
    niveaus: [
      { id: 'start', label: 'Start' },
      { id: 'havo', label: 'Verdieping havo' },
    ],
    onderwerpen: [{ id: 'gd', label: 'GDScript' }],
    concepten: [
      { id: 'gd-groups', onderwerp: 'gd', concept: 'groups', start: 'gevorderd', havo: 'basis' },
      {
        id: 'gd-loops',
        onderwerp: 'gd',
        concept: 'loops',
        bloom: 'toepassen',
        start: 'gevorderd',
        havo: 'expert',
      },
    ],
  };

  it('zet de niveaus van een rij bij elkaar', () => {
    expect(leesLeerdoelen(goed).concepten).toEqual([
      {
        id: 'gd-groups',
        onderwerp: 'gd',
        concept: 'groups',
        niveau: { start: 'gevorderd', havo: 'basis' },
      },
      {
        id: 'gd-loops',
        onderwerp: 'gd',
        concept: 'loops',
        bloom: 'toepassen',
        niveau: { start: 'gevorderd', havo: 'expert' },
      },
    ]);
  });

  it('meldt alle fouten tegelijk, met de naam van het bestand', () => {
    const fout = {
      ...goed,
      concepten: [
        { id: 'gd-groups', onderwerp: 'gd', concept: 'groups', start: 'gevorderd' },
        { id: 'gd-groups', onderwerp: 'x', concept: '', start: 'moeilijk', havo: 'basis' },
        {
          id: 'gd-tweens',
          onderwerp: 'gd',
          concept: 'tweens',
          start: 'basis',
          havo: 'basis',
          vwo: 'basis',
        },
        {
          id: 'gd-json',
          onderwerp: 'gd',
          concept: 'JSON',
          start: 'basis',
          havo: 'basis',
          bloom: 'weten',
        },
      ],
    };
    let melding = '';
    try {
      leesLeerdoelen(fout, 'godot/src/leerdoelen.json');
    } catch (e) {
      melding = (e as Error).message;
    }
    expect(melding).toContain('godot/src/leerdoelen.json');
    expect(melding).toContain("concept 'gd-groups': niveau 'havo' ontbreekt");
    expect(melding).toContain("concept 'gd-groups' staat er twee keer");
    expect(melding).toContain("onbekend onderwerp 'x'");
    expect(melding).toContain('concept (de tekst) ontbreekt');
    expect(melding).toContain("'moeilijk' bij start");
    // Een niveau dat er niet is: een tikfout in een kolom valt op.
    expect(melding).toContain("concept 'gd-tweens': onbekend veld 'vwo'");
    expect(melding).toContain("onbekende denkvaardigheid 'weten'");
  });

  it('weigert een bestand zonder niveaus of met een niveau dat een veld heet', () => {
    expect(() => leesLeerdoelen({ ...goed, niveaus: [] })).toThrow(/minstens één niveau/);
    expect(() =>
      leesLeerdoelen({ ...goed, niveaus: [{ id: 'concept', label: 'Concept' }] }),
    ).toThrow(/heeft de naam van een veld/);
  });
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

  it('verwijst naar het artikel van Krathwohl over de herziene taxonomie', () => {
    expect(BLOOM.bronnen[0].url).toBe('https://doi.org/10.1207/s15430421tip4104_2');
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

  it('zonder expertconcepten in het niveau blijft gevorderd het hoogste', () => {
    expect(moeilijkheidVoorstel(web([1, 1], [1, 1], [1, 1])).reden).toBe(
      'Bij elk onderwerp een concept op gevorderd.',
    );
  });
});

describe('plugin en createConfig', () => {
  const leerdoelen = leesLeerdoelen({
    niveaus: [
      { id: 'start', label: 'Start' },
      { id: 'vwo', label: 'Verdieping vwo' },
    ],
    onderwerpen: [{ id: 'gd', label: 'GDScript' }],
    concepten: [{ id: 'gd-a', onderwerp: 'gd', concept: 'a', start: 'basis', vwo: 'basis' }],
  });

  it('maakt /leerdoelen, /leerdoelen/bloom en bij meer niveaus een route per niveau', () => {
    expect(plugin.routes('/godot/', leerdoelen).map((r: { path: string }) => r.path)).toEqual([
      '/godot/leerdoelen',
      '/godot/leerdoelen/bloom',
      '/godot/leerdoelen/start',
      '/godot/leerdoelen/vwo',
    ]);
    const een = { ...leerdoelen, niveaus: [leerdoelen.niveaus[0]] };
    expect(plugin.routes('/web/', een).map((r: { path: string }) => r.path)).toEqual([
      '/web/leerdoelen',
      '/web/leerdoelen/bloom',
    ]);
  });

  it("weigert een niveau dat 'bloom' heet: dat is de route van de Bloom-pagina", () => {
    const fout = { ...leerdoelen, niveaus: [...leerdoelen.niveaus, { id: 'bloom', label: 'B' }] };
    expect(() => plugin.routes('/x/', fout)).toThrow(/bloom/);
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
          niveaus: [{ id: 'start', label: 'Start' }],
          onderwerpen: [{ id: 'a', label: 'A' }],
          concepten: [{ id: 'a-1', onderwerp: 'a', concept: 'één', start: 'basis' }],
        }),
      );
      const p = plugin({ siteDir: map, baseUrl: '/x/' }, { siteId: 'x' });
      const content = p.loadContent();
      await p.postBuild({ outDir: map, content });
      expect(JSON.parse(readFileSync(join(map, 'leerdoelen.json'), 'utf8'))).toEqual({
        cursus: 'x',
        ...content,
      });
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

    vi.spyOn(process, 'cwd').mockReturnValue(join(ROOT, siteDir('algorithms')));
    const algorithms = createConfig({ siteId: 'algorithms' });
    expect(voetLinks(algorithms)).not.toContain('/leerdoelen');
    expect(plugins(algorithms)).toEqual([]);
    vi.restoreAllMocks();
  });
});
