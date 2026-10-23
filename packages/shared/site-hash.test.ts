import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { inBouwomgeving, siteHash } from '../../scripts/site-hash.mjs';

// De bouwomgeving van een site is de sleutel van de webpack-cache in CI.
// Webpack controleert de inhoud van elke module die hij bundelt zelf, maar
// niet de code die vertaalt: een gewijzigde remark-plugin gaf met de cache
// 0 van de 248 pagina's met de nieuwe link, zonder cache alle 248. Daarom
// telt die code mee in de sleutel, en een les, component of stijl niet:
// telde die wel mee, dan bouwde bijna elke PR zonder cache.

describe('inBouwomgeving', () => {
  it('code die Node laadt tijdens de build telt mee, met de root-config', () => {
    for (const pad of [
      'packages/shared/plugins/site-links.js',
      'packages/shared/plugins/mdx-inspringing.js',
      'packages/shared/config/index.js',
      'packages/shared/sites.js',
      'sites/informatica/python/docusaurus.config.ts',
      'sites/informatica/robotica/babel.config.js',
      'pnpm-lock.yaml',
      '.browserslistrc',
    ]) {
      expect(inBouwomgeving(pad), pad).toBe(true);
    }
  });

  it('wat webpack zelf op inhoud controleert, tests en static/ tellen niet', () => {
    for (const pad of [
      'sites/informatica/python/docs/01-basis/00-print.mdx',
      'sites/informatica/python/docs/projecten/bloemenveld/_category_.json',
      'sites/informatica/python/docs/projecten/bloemenveld/img/stap-1.svg',
      'sites/informatica/python/src/components/ProjectKiezer/index.tsx',
      'sites/informatica/python/src/css/custom.css',
      'sites/informatica/robotica/static/files/frame.step',
      'sites/informatica/python/static/pyodide/pyodide.js',
      'packages/shared/components/Voorspel/index.tsx',
      'packages/shared/site-hash.test.ts',
      'sites/informatica/python/src/docs-tests/projecten.test.ts',
      'sites/informatica/web/src/checker/__fixtures__/goed/js/app.js',
    ]) {
      expect(inBouwomgeving(pad), pad).toBe(false);
    }
  });
});

describe('siteHash', () => {
  it('de omgeving is een andere hash dan de hele site, en vast', () => {
    const geheel = siteHash('python').hash;
    const omgeving = siteHash('python', { omgeving: true });
    expect(omgeving.hash).not.toBe(geheel);
    expect(omgeving.aantal).toBeGreaterThan(0);
    expect(siteHash('python', { omgeving: true }).hash).toBe(omgeving.hash);
  }, 20_000);

  it('--sleutels geeft beide hashes in één run, als regels die de workflow kan inlezen', () => {
    // De workflow doet `eval "$(… --sleutels)"`: namen die geen andere
    // variabele in die stap overschrijven, en alleen hex als waarde.
    const uit = execFileSync('node', ['scripts/site-hash.mjs', 'python', '--sleutels'], {
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
      encoding: 'utf8',
    });
    expect(uit).toMatch(/^sitehash=[0-9a-f]{32}\nomgevinghash=[0-9a-f]{32}\n$/);
  }, 20_000);
});
