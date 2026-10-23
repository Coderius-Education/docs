import { describe, expect, it } from 'vitest';
import { isInhoud, siteHash } from '../../scripts/site-hash.mjs';

// De bouwomgeving van een site is de sleutel van de webpack-cache in CI.
// Webpack controleert de inhoud van elke module zelf, maar niet de code die
// vertaalt: daarom telt een les niet mee in de sleutel, en een plugin, de
// config of een gedeeld package wel. Telde een les wel mee, dan bouwde elke
// PR zonder cache; telde een plugin niet mee, dan kwam er een oude vertaling
// uit de cache.

describe('isInhoud', () => {
  const dir = 'sites/informatica/python';
  it('lessen, afbeeldingen en static/ zijn inhoud', () => {
    for (const pad of [
      `${dir}/docs/01-basis/00-print.mdx`,
      `${dir}/docs/projecten/bloemenveld/img/stap-1.svg`,
      `${dir}/static/pyodide/pyodide.js`,
      `${dir}/README.md`,
    ]) {
      expect(isInhoud(pad, dir), pad).toBe(true);
    }
  });

  it('code, config en alles buiten de site zijn omgeving', () => {
    for (const pad of [
      `${dir}/docusaurus.config.ts`,
      `${dir}/sidebars.ts`,
      `${dir}/src/components/ProjectKiezer/index.tsx`,
      `${dir}/src/data/projecten.ts`,
      'packages/shared/plugins/site-links.js',
      'packages/shared/README.md',
      'pnpm-lock.yaml',
    ]) {
      expect(isInhoud(pad, dir), pad).toBe(false);
    }
  });
});

describe('siteHash', () => {
  it('de omgeving is een andere hash dan de hele site, en vast', () => {
    const geheel = siteHash('python').hash;
    const omgeving = siteHash('python', { omgeving: true }).hash;
    expect(omgeving).not.toBe(geheel);
    expect(siteHash('python', { omgeving: true }).hash).toBe(omgeving);
  });
});
