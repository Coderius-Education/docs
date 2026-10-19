import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteMappenOpSchijf } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// De sites worden gebouwd met de babel-preset van Docusaurus: preset-env in
// losse modus, met de browsers uit .browserslistrc. Zonder dat bestand zette
// hij alles om naar ES5, en in losse modus wordt [...x] dan [].concat(x).
// Voor een array maakt dat niet uit; een Map, Set of string wordt een lijst
// met één element. Zo werkte doorbladeren met dezelfde letter in elke
// keuzelijst niet ([...letters] op een string, Keuzelijst/logica.ts), en
// crashte de docentweergave van de nakijker op een Map — terwijl alle tests
// groen waren, want node draait de bron zonder die omzetting. Deze test
// draait dezelfde preset vanuit elke site en voert het resultaat uit.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** De preset en @babel/core zoals een site ze bij het bouwen vindt. */
function babelVoor(site: string) {
  const vanSite = createRequire(join(site, 'package.json'));
  const presetPad = vanSite.resolve('@docusaurus/babel/preset');
  const vanPreset = createRequire(presetPad);
  const babel = vanPreset('@babel/core') as typeof import('@babel/core');
  const preset = vanPreset(presetPad).default;
  return (code: string) =>
    babel.transformSync(code, {
      filename: join(site, 'src/proef.js'),
      cwd: site,
      root: site,
      babelrc: false,
      configFile: false,
      presets: [preset],
      // Zo noemt Docusaurus de clientbuild; de serverbuild richt zich op node.
      caller: { name: 'client' },
    })?.code ?? '';
}

const PROEF = `
const set = [...new Set([1, 1, 2])];
const letters = [..."ppp"];
const map = [...new Map([["a", 1]])];
globalThis.__browsersProef = { set, letters, map };
`;

const sites = siteMappenOpSchijf(ROOT).map(({ map }) => map);

// De build draait met NODE_ENV=production; vitest met 'test'. Een
// browserslist met lijsten per omgeving zou hier dus een andere lijst
// kiezen dan bij het bouwen.
process.env.BROWSERSLIST_ENV = 'production';

describe('de clientbuild van elke site', () => {
  it('vindt de sites', () => {
    expect(sites.length).toBeGreaterThan(5);
  });

  it('.browserslistrc staat in de root, zodat elke site hem vindt', () => {
    expect(readFileSync(join(ROOT, '.browserslistrc'), 'utf8')).toMatch(/not dead/);
  });

  it.each(sites)('%s heeft geen eigen browserslist naast die in de root', (site) => {
    const pkg = JSON.parse(readFileSync(join(site, 'package.json'), 'utf8'));
    expect(pkg.browserslist).toBeUndefined();
  });

  it.each(sites)('%s spreidt een Set, string en Map zoals de browser zelf', (site) => {
    const code = babelVoor(site)(PROEF);
    expect(code).not.toContain('[].concat(');
    new Function(code)();
    const uit = (globalThis as { __browsersProef?: Record<string, unknown> }).__browsersProef;
    expect(uit).toEqual({ set: [1, 2], letters: ['p', 'p', 'p'], map: [['a', 1]] });
  });
});
