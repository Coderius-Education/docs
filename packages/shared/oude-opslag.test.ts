import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { storageKey } from '@coderius/shared/opslag';
import {
  BRON_NIEUW,
  BRON_OUD,
  MAX_TEKENS,
  type OudeOpslagRegels,
  VERSIE,
  controleerRegels,
  leesBericht,
  nieuweSleutel,
  oudeOrigin,
  paginaGegevens,
  schrijfplan,
  sleutelMetPad,
} from '@coderius/shared/oude-opslag';
import { SITES_BY_ID, siteDir } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const ROOT = join(__dirname, '..', '..');

const regels: OudeOpslagRegels = {
  localStorage: [
    { van: 'webMicroEditor.code', label: 'Code' },
    { van: 'coderius-editor:inline:', naar: 'editor:inline:', prefix: true, label: 'Velden' },
  ],
  indexedDB: [
    {
      van: 'coderius-oefenvelden',
      store: 'velden',
      naar: 'oefenvelden',
      sleutelBegintMetPad: true,
      label: 'Oefen',
    },
  ],
};

const bericht = (over: Record<string, unknown> = {}) => ({
  source: BRON_OUD,
  type: 'gegevens',
  versie: VERSIE,
  site: 'web',
  localStorage: {},
  indexedDB: [],
  ...over,
});

describe('regels en sleutels', () => {
  it('nieuwe sleutels gaan door storageKey, ook bij een voorvoegsel', () => {
    expect(nieuweSleutel('robotica', regels, 'webMicroEditor.code')).toBe(
      storageKey('robotica', 'webMicroEditor.code'),
    );
    expect(nieuweSleutel('ctf', regels, 'coderius-editor:inline:ctf-plakken')).toBe(
      storageKey('ctf', 'editor:inline:ctf-plakken'),
    );
    expect(nieuweSleutel('ctf', regels, 'coderius-editor:inline:')).toBeNull();
    expect(nieuweSleutel('ctf', regels, 'iets-anders')).toBeNull();
  });

  it('zet het cursuspad voor een sleutel die met het pagina-pad begint', () => {
    // web/CodeEditor/opslag.ts: veldSleutel(location.pathname, zaad, n). Op
    // web.coderius.nl was dat '/docs/les', nu '/web/docs/les'.
    expect(sleutelMetPad('/docs/html/les|abc|0', '/web/')).toBe('/web/docs/html/les|abc|0');
    expect(sleutelMetPad('/|abc|0', '/web/')).toBe('/web|abc|0');
    expect(sleutelMetPad('/web/docs/les|abc|0', '/web/')).toBe('/web/docs/les|abc|0');
    expect(sleutelMetPad('/webx/les|a|0', '/web/')).toBe('/web/webx/les|a|0');
    expect(sleutelMetPad('geen-pad', '/web/')).toBe('geen-pad');
    expect(sleutelMetPad(7, '/web/')).toBe(7);
  });

  it('weigert kapotte regels bij het bouwen', () => {
    expect(() => controleerRegels({})).toThrow(/geen enkele regel/);
    expect(() => controleerRegels({ localStorage: [{ van: 'x' }] })).toThrow(/ongeldige regel/);
    expect(() => controleerRegels({ indexedDB: [{ van: 'x', label: 'y' }] })).toThrow(/ongeldige/);
  });
});

describe('leesBericht', () => {
  it('neemt alleen mee wat de regels noemen', () => {
    const gelezen = leesBericht(
      bericht({
        localStorage: {
          'webMicroEditor.code': 'print(1)',
          'coderius-editor:inline:ctf-plakken': '{"main.py":"x"}',
          theme: 'dark',
          'webMicroEditor.code.extra': 'nee',
        },
        indexedDB: [
          {
            van: 'coderius-oefenvelden',
            store: 'velden',
            items: [['/docs/les|z|0', { html: '<p>' }]],
          },
          { van: 'andere-db', store: 'velden', items: [['x', 1]] },
        ],
      }),
      'web',
      regels,
    );
    expect(gelezen?.localStorage.map(([k]) => k)).toEqual([
      'webMicroEditor.code',
      'coderius-editor:inline:ctf-plakken',
    ]);
    if (!gelezen) throw new Error('bericht niet gelezen');
    expect(gelezen.indexedDB).toHaveLength(1);
    expect(schrijfplan(gelezen, 'web', regels).indexedDB[0]).toEqual({
      database: storageKey('web', 'oefenvelden'),
      store: 'velden',
      items: [['/web/docs/les|z|0', { html: '<p>' }]],
    });
  });

  it('negeert berichten die het contract niet volgen', () => {
    expect(leesBericht(null, 'web', regels)).toBeNull();
    expect(leesBericht(bericht({ source: 'x' }), 'web', regels)).toBeNull();
    expect(leesBericht(bericht({ versie: 2 }), 'web', regels)).toBeNull();
    // Werk van een andere cursus hoort niet in deze.
    expect(leesBericht(bericht({ site: 'robotica' }), 'web', regels)).toBeNull();
    expect(leesBericht(bericht({ localStorage: [] }), 'web', regels)).toBeNull();
  });

  it('weigert een te groot bericht', () => {
    const groot = bericht({ localStorage: { 'webMicroEditor.code': 'x'.repeat(MAX_TEKENS + 1) } });
    expect(leesBericht(groot, 'web', regels)).toBeNull();
  });
});

describe('oudeOrigin', () => {
  it('is in productie de legacyUrl van de site', () => {
    for (const id of ['web', 'robotica', 'ctf', 'algorithms']) {
      const nieuw = new URL(SITES_BY_ID[id].url);
      expect(oudeOrigin(id, nieuw)).toBe(SITES_BY_ID[id].legacyUrl);
    }
  });

  it('werkt op een dev-domein met poort', () => {
    expect(
      oudeOrigin('web', { protocol: 'http:', hostname: 'informatica.localtest.me', port: '8811' }),
    ).toBe('http://web.localtest.me:8811');
  });
});

describe('de losse pagina op het oude subdomein', () => {
  const PAGINA = join(__dirname, 'oude-opslag', 'pagina');
  const js = readFileSync(join(PAGINA, 'overzetten.js'), 'utf8');
  const waarde = (naam: string) => js.match(new RegExp(`const ${naam} = '?([^';]+)'?;`))?.[1];

  it('heeft dezelfde wire-waarden als het contract', () => {
    expect(waarde('BRON_OUD')).toBe(BRON_OUD);
    expect(waarde('BRON_NIEUW')).toBe(BRON_NIEUW);
    expect(Number(waarde('VERSIE'))).toBe(VERSIE);
  });

  it('de plugin schrijft de pagina en regels.json in oud/overzetten/', () => {
    const { schrijfPagina } = require('./plugins/oude-opslag');
    const uit = mkdtempSync(join(tmpdir(), 'oude-opslag-'));
    const doel = schrijfPagina(uit, 'web', regels);
    expect(readdirSync(doel).sort()).toEqual([
      'index.html',
      'overzetten.css',
      'overzetten.js',
      'regels.json',
    ]);
    expect(JSON.parse(readFileSync(join(doel, 'regels.json'), 'utf8'))).toEqual(
      paginaGegevens('web', regels),
    );
    expect(paginaGegevens('web', regels)).toMatchObject({ vak: 'informatica', pad: '/web/' });
  });
});

describe('de sites die oudeOpslag gebruiken', () => {
  const { createConfig } = require('./config');
  const metRegels = ['web', 'robotica', 'ctf'];

  // De bron van een site plus de gedeelde packages: daar staan de sleutels
  // die de code nu gebruikt.
  function bron(id: string): string {
    const bestanden: string[] = [];
    const loop = (map: string) => {
      for (const e of readdirSync(map, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name === 'build' || e.name.startsWith('.')) continue;
        const pad = join(map, e.name);
        if (e.isDirectory()) loop(pad);
        else if (/\.(ts|tsx|js)$/.test(e.name) && !/\.test\./.test(e.name)) bestanden.push(pad);
      }
    };
    loop(join(ROOT, siteDir(id), 'src'));
    loop(join(ROOT, 'packages', 'editor', 'src'));
    return bestanden.map((b) => readFileSync(b, 'utf8')).join('\n');
  }

  for (const id of metRegels) {
    it(`${id}: regels geldig, en de code gebruikt de nieuwe sleutels nog`, async () => {
      const mod = await import(join(ROOT, siteDir(id), 'docusaurus.config.ts'));
      const r = mod.default.customFields.oudeOpslag as OudeOpslagRegels;
      expect(() => controleerRegels(r)).not.toThrow();
      const code = bron(id);
      for (const regel of [...(r.localStorage ?? []), ...(r.indexedDB ?? [])]) {
        // Wie de sleutel in de code hernoemt, laat het overzetten stil in het
        // niets schrijven. Dan moet `naar` mee.
        const naar = regel.naar ?? regel.van;
        const letterlijk = ["'", '"', '`'].some((q) => code.includes(`${q}${naar}`));
        expect(letterlijk, `${id}: '${naar}' staat niet in de code`).toBe(true);
      }
    });
  }

  it('alleen sites met een oud subdomein', () => {
    expect(() => createConfig({ siteId: 'onderzoek', oudeOpslag: regels })).toThrow(
      /eigen subdomein/,
    );
  });
});

describe('oude-opslag.js in de browserbundel', () => {
  it('heeft geen for…of (babel zou er een ES-module-helper in zetten)', () => {
    // CommonJS met een geïnjecteerde `import` laat de client-build stuk gaan:
    // "'import' and 'export' may appear only with 'sourceType: module'".
    const bron = readFileSync(join(__dirname, 'oude-opslag.js'), 'utf8')
      .split('\n')
      .filter((regel) => !regel.trim().startsWith('//'))
      .join('\n');
    expect(bron).not.toMatch(/for \((const|let|var) [^;)]* of /);
  });
});
