import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildsIn,
  controleer,
  doelBestaat,
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
  it('kent alleen de registry-domeinen', () => {
    expect(siteVanHost('editor.coderius.nl')).toBe('editor');
    expect(siteVanHost('coderius.nl')).toBe('home');
    expect(siteVanHost('stats.coderius.nl')).toBeNull();
    expect(siteVanHost('www.python.org')).toBeNull();
  });
});

describe('hrefsUit', () => {
  it('pakt alleen absolute hrefs naar een registry-domein, zonder anker en query', () => {
    const html =
      '<a href="https://editor.coderius.nl/python/stap-4-venv#kop?x=1">a</a>' +
      '<a href="/docs/intern">b</a><a href="https://www.python.org/">c</a>';
    expect(hrefsUit(html)).toEqual([
      {
        href: 'https://editor.coderius.nl/python/stap-4-venv#kop?x=1',
        site: 'editor',
        pad: '/python/stap-4-venv',
      },
    ]);
  });
});

describe('hrefsUit — een pad zonder slash plakt aan de host vast', () => {
  it('meldt een host die met een registry-domein begint als misvormd', () => {
    // <Voorkennis to: 'python/stap-1'> zonder slash geeft
    // https://editor.coderius.nlpython/stap-1: geen bekend domein, dus de
    // guard-tests én dit script zouden hem anders stil laten passeren.
    const html = '<a href="https://editor.coderius.nlpython/stap-1-installeren">x</a>';
    expect(hrefsUit(html)).toEqual([
      {
        href: 'https://editor.coderius.nlpython/stap-1-installeren',
        site: 'editor',
        pad: '/stap-1-installeren',
        misvormd: true,
      },
    ]);
    expect(hrefsUit('<a href="https://editor.coderius.nl.kwaad.nl/x">y</a>')).toHaveLength(1);
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

  it('meldt precies de link met /docs/ naar de editor als kapot', () => {
    const { kapot, gecontroleerd, overgeslagen } = controleer(builds);
    expect(kapot.map((k) => k.href)).toEqual([
      'https://editor.coderius.nl/docs/python/stap-4-venv',
      'https://editor.coderius.nlpython/stap-4-venv',
    ]);
    expect(kapot[0]).toMatchObject({ site: 'fullstack', doelSite: 'editor' });
    expect(kapot[0].bron.split('\\').join('/')).toBe('docs/FastAPI/installatie/index.html');
    // Vier goede links plus de twee kapotte zijn gecontroleerd; de link naar
    // de niet-gebouwde python-site is overgeslagen, niet kapot.
    expect(gecontroleerd).toBe(6);
    expect(overgeslagen).toBe(1);
  });
});
