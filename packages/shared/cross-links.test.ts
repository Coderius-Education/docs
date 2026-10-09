import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildsIn,
  controleer,
  doelBestaat,
  doelVan,
  hrefsUit,
  siteVanHost,
} from '../../scripts/controleer-cross-links.mjs';

// De cross-links-job in CI is de laatste verdediging tegen kapotte links
// tussen cursussen: hij kijkt naar de href in de gebouwde HTML en of het
// bestand achter die URL in de build van de doelsite bestaat, in plaats van
// de routing van Docusaurus na te bouwen zoals de guard-tests doen. Deze test
// pint het gedrag van het script op een nep-editor (docs op de root) en een
// nep-fullstack met vijf soorten links.

const FIXTURE = fileURLToPath(new URL('./__fixtures__/cross-links', import.meta.url));

describe('siteVanHost', () => {
  it('kent de apex en de oude subdomeinen, geen andere hosts', () => {
    expect(siteVanHost('editor.coderius.nl')).toBe('editor');
    expect(siteVanHost('algoritmes.coderius.nl')).toBe('algorithms');
    expect(siteVanHost('coderius.nl')).toBe('home');
    expect(siteVanHost('stats.coderius.nl')).toBeNull();
    expect(siteVanHost('www.python.org')).toBeNull();
  });
});

describe('doelVan — vak-host plus pad naar de build van de cursus', () => {
  const doel = (href: string) => doelVan(new URL(href));

  it('het eerste padsegment kiest de cursus; de rest is het pad in diens build', () => {
    expect(doel('https://informatica.coderius.nl/python/docs/basis/x')).toEqual({
      site: 'python',
      pad: '/docs/basis/x',
    });
    expect(doel('https://informatica.coderius.nl/algoritmes/')).toEqual({
      site: 'algorithms',
      pad: '/',
    });
    expect(doel('https://informatica.coderius.nl/editor')).toEqual({ site: 'editor', pad: '/' });
  });

  it('de vak-host zelf en onbekende paden horen bij de homepage', () => {
    expect(doel('https://informatica.coderius.nl/')).toEqual({ site: 'home', pad: '/' });
    expect(doel('https://informatica.coderius.nl/algorithms/')).toEqual({
      site: 'home',
      pad: '/algorithms/',
    });
    expect(doel('https://coderius.nl/docent')).toEqual({ site: 'home', pad: '/docent' });
  });

  it('een oud subdomein is herkenbaar als oud domein', () => {
    expect(doel('https://python.coderius.nl/docs/x')).toEqual({
      site: 'python',
      pad: '/docs/x',
      oudDomein: true,
    });
    expect(doel('https://www.python.org/')).toBeNull();
    expect(doel('https://stats.coderius.nl/')).toBeNull();
  });
});

describe('hrefsUit', () => {
  it('pakt alleen absolute hrefs naar een registry-domein, zonder anker en query', () => {
    const html =
      '<a href="https://informatica.coderius.nl/editor/python/stap-4-venv#kop?x=1">a</a>' +
      '<a href="/docs/intern">b</a><a href="https://www.python.org/">c</a>';
    expect(hrefsUit(html)).toEqual([
      {
        href: 'https://informatica.coderius.nl/editor/python/stap-4-venv#kop?x=1',
        site: 'editor',
        pad: '/python/stap-4-venv',
      },
    ]);
  });
});

describe('hrefsUit — een pad zonder slash plakt aan de host vast', () => {
  it('meldt een host die met een registry-domein begint als misvormd', () => {
    // Een SiteLink-pad zonder slash plakt aan de host vast, en een URL met de
    // vak-host als prefix (informatica.coderius.nlpython) is geen bekend
    // domein: de guard-tests én dit script zouden hem anders stil laten
    // passeren.
    const html = '<a href="https://informatica.coderius.nlpython/stap-1-installeren">x</a>';
    expect(hrefsUit(html)).toEqual([
      {
        href: 'https://informatica.coderius.nlpython/stap-1-installeren',
        site: 'home',
        pad: '/stap-1-installeren',
        misvormd: true,
      },
    ]);
    expect(hrefsUit('<a href="https://editor.coderius.nl.kwaad.nl/x">y</a>')).toHaveLength(1);
    expect(hrefsUit('<a href="https://informatica.coderius.nl.kwaad.nl/x">y</a>')).toHaveLength(1);
  });
});

describe('doelBestaat — wat statische hosting serveert', () => {
  const editor = `${FIXTURE}/editor`;

  it.each(['/python/stap-4-venv', '/python/stap-4-venv/', '/git/vscode/', '/git/vscode', '/', ''])(
    '%j bestaat',
    (pad) => {
      expect(doelBestaat(editor, pad)).toBe(true);
    },
  );

  it.each(['/docs/python/stap-4-venv', '/python/stap-5-venv', '/python'])(
    '%j bestaat niet',
    (pad) => {
      expect(doelBestaat(editor, pad)).toBe(false);
    },
  );
});

describe('controleer over de fixture-builds', () => {
  const builds = buildsIn(FIXTURE);

  it('vindt de builds (hier in de kale <site>/index.html-indeling; build/ is gitignored)', () => {
    expect([...builds.keys()].sort()).toEqual(['editor', 'fullstack']);
  });

  it('meldt de link met /docs/, de aangeplakte host en het oude subdomein als kapot', () => {
    const { kapot, gecontroleerd, overgeslagen } = controleer(builds);
    expect(kapot.map((k) => k.href)).toEqual([
      'https://informatica.coderius.nl/editor/docs/python/stap-4-venv',
      'https://informatica.coderius.nlpython/stap-4-venv',
      'https://editor.coderius.nl/python/stap-4-venv',
    ]);
    expect(kapot[0]).toMatchObject({ site: 'fullstack', doelSite: 'editor' });
    expect(kapot[0].bron.split('\\').join('/')).toBe('docs/FastAPI/installatie/index.html');
    // Een oud subdomein is kapot, ook al bestaat het pad op de doelsite.
    expect(kapot[2]).toMatchObject({ doelSite: 'editor', reden: 'oud domein' });
    // Vier goede links plus de drie kapotte zijn gecontroleerd; de link naar
    // de niet-gebouwde python-site is overgeslagen, niet kapot.
    expect(gecontroleerd).toBe(7);
    expect(overgeslagen).toBe(1);
  });
});

describe('assets op een vak-host', () => {
  it('controleert model- en afbeeldingspaden zoals de browser ze oplost', () => {
    const html =
      '<div data-obj-src="/robotica/models/main.obj" data-obj-mtl="/models/main.mtl"></div>' +
      '<img src="../img/foto.png"><script src="https://cdn.example.org/x.js"></script>';
    expect(hrefsUit(html, 'https://informatica.coderius.nl/robotica/lego_auto/intro')).toEqual([
      { href: '/robotica/models/main.obj', site: 'robotica', pad: '/models/main.obj' },
      { href: '/models/main.mtl', site: 'home', pad: '/models/main.mtl' },
      { href: '../img/foto.png', site: 'robotica', pad: '/img/foto.png' },
    ]);
  });
});

it('CI meldt ontbrekende modellen en assets, ook met een bestaand model ernaast', () => {
  const root = mkdtempSync(join(tmpdir(), 'coderius-links-'));
  try {
    const robotica = join(root, 'robotica');
    const home = join(root, 'home');
    mkdirSync(join(robotica, 'models'), { recursive: true });
    mkdirSync(home);
    writeFileSync(join(robotica, 'models/main.obj'), 'model');
    writeFileSync(join(home, 'index.html'), 'home');
    writeFileSync(
      join(robotica, 'index.html'),
      '<div data-obj-src="/robotica/models/main.obj" data-obj-mtl="/models/main.mtl"></div>' +
        '<img src="/robotica/img/missing.png">',
    );
    const result = controleer(
      new Map([
        ['robotica', robotica],
        ['home', home],
      ]),
    );
    expect(result.kapot.map((k) => k.href)).toEqual([
      '/models/main.mtl',
      '/robotica/img/missing.png',
    ]);
    expect(result.gecontroleerd).toBe(3);
    expect(result.overgeslagen).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
