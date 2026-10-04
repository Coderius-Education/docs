import { createRequire } from 'node:module';
import { HOME, SITES, SITES_BY_ID, SUBJECTS_BY_ID } from '@coderius/shared/sites';
import { describe, expect, it } from 'vitest';

// createConfig leest host en pad van een cursus uit de registry: elke cursus
// staat onder de host van zijn vak (https://informatica.coderius.nl/python/).
// Gaat dat mis, dan bouwt de site wel, maar wijst elke asset en elke link naar
// de root van de vak-host, en daar staat de homepage.

const require = createRequire(import.meta.url);
const { createConfig } = require('./config');

type NavItem = { label: string; href?: string; to?: string; type?: string; items?: NavItem[] };

function dropdown(config: { themeConfig: { navbar: { items: NavItem[] } } }): NavItem[] {
  const menu = config.themeConfig.navbar.items.find(
    (i) => i.type === 'dropdown' && i.label === 'Cursussen',
  );
  return menu?.items ?? [];
}

describe('createConfig — host en pad uit de registry', () => {
  it('zet url op de vak-host en baseUrl op het pad van de cursus', () => {
    const config = createConfig({ siteId: 'algorithms' });
    expect(config.url).toBe('https://informatica.coderius.nl');
    expect(config.baseUrl).toBe('/algoritmes/');
    // siteId is van de factory, niet van Docusaurus (die weigert onbekende velden).
    expect(config).not.toHaveProperty('siteId');
  });

  it('werkt voor elke site in de registry, ook de docentensites', () => {
    for (const site of Object.values(SITES_BY_ID)) {
      const config = createConfig({ siteId: site.id });
      expect(config.url + config.baseUrl).toBe(site.url);
      expect(SUBJECTS_BY_ID[site.subject].url).toBe(config.url);
    }
  });

  it('herkent een oude subdomein-URL, zodat oudere configs blijven bouwen', () => {
    const config = createConfig({ url: 'https://algoritmes.coderius.nl' });
    expect(config.url).toBe('https://informatica.coderius.nl');
    expect(config.baseUrl).toBe('/algoritmes/');
  });

  it('wint van een url of baseUrl die de site zelf meegeeft', () => {
    const config = createConfig({ siteId: 'python', url: 'https://elders.nl', baseUrl: '/' });
    expect(config.url).toBe('https://informatica.coderius.nl');
    expect(config.baseUrl).toBe('/python/');
  });

  it('weigert een onbekende siteId', () => {
    expect(() => createConfig({ siteId: 'bestaat-niet' })).toThrow(/bestaat-niet/);
  });
});

describe('createConfig — de Cursussen-dropdown toont alleen het eigen vak', () => {
  it('bevat de andere cursussen van het vak, het overzicht en "Andere vakken"', () => {
    const items = dropdown(createConfig({ siteId: 'python' }));
    const verwacht = SITES.filter((s) => s.subject === 'informatica' && s.id !== 'python');
    expect(items.filter((i) => i.href && i.href !== HOME.url).map((i) => i.href)).toEqual(
      verwacht.map((s) => s.url),
    );
    expect(items).toContainEqual({ label: 'Alle cursussen', to: '/cursussen' });
    expect(items).toContainEqual({ label: 'Andere vakken', href: HOME.url });
    expect(items.some((i) => i.href === SITES_BY_ID.python.url)).toBe(false);
  });

  it('linkt geen enkele cursus via een oud subdomein', () => {
    const items = dropdown(createConfig({ siteId: 'web' }));
    expect(
      items.filter((i) => /https:\/\/(?!informatica\.)[a-z]+\.coderius\.nl/.test(i.href ?? '')),
    ).toEqual([]);
  });
});
