import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De FastAPI-cursus opende in de navbar direct op Installatie, zonder te
// zeggen wat je aan het eind hebt, wat je al moet kunnen of hoe de route loopt.
// Nu begint hij, net als Veiligheid, met een startpagina. Beide startpagina's
// tonen de route met <Routekaart>, die de sidebar zelf leest: een tabel met
// lessen ernaast liep uit de pas zodra een les verhuisde.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const lees = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');
const STARTPAGINAS = ['FastAPI/index', 'veiligheid/index'];

describe("de startpagina's", () => {
  it('de FastAPI-sidebar begint met de startpagina, en de navbar-link wijst naar die sidebar', () => {
    expect((sidebars.apiSidebar as unknown[])[0]).toBe('FastAPI/index');
    expect((sidebars.veiligheidSidebar as unknown[])[0]).toBe('veiligheid/index');
    const config = readFileSync(
      fileURLToPath(new URL('../../docusaurus.config.ts', import.meta.url)),
      'utf8',
    );
    expect(config).toMatch(/type: 'docSidebar', sidebarId: 'apiSidebar'[^}]*label: 'FastAPI'/);
  });

  it('de knop op de homepage komt op de startpagina uit', () => {
    const home = readFileSync(
      fileURLToPath(new URL('../content/homepage.mdx', import.meta.url)),
      'utf8',
    );
    expect(home).toContain('<Button href="/docs/FastAPI">');
  });

  it.each(STARTPAGINAS)('%s gebruikt de Routekaart en het nagebouwde gastenboek', (id) => {
    const tekst = lees(id);
    expect(tekst).toContain("import Routekaart from '@site/src/components/Routekaart';");
    expect(tekst).toMatch(/<Routekaart\b[^>]*\/>/);
    expect(tekst).toContain("import Gastenboek from '@site/src/components/Gastenboek';");
    expect(tekst).toMatch(/<Gastenboek\b[^>]*\/>/);
  });

  it.each(STARTPAGINAS)('%s heeft alleen absolute links', (id) => {
    // Een index-pagina is bereikbaar met en zonder slash aan het eind; een
    // relatieve link breekt in een van de twee.
    const relatief = [...lees(id).matchAll(/\]\((?!\/|https?:|#)([^)]+)\)/g)].map((m) => m[1]);
    expect(relatief).toEqual([]);
  });

  it.each(STARTPAGINAS)('%s heeft geen code voor de server', (id) => {
    // Een startpagina leert niets nieuws: geen endpoint dat routes.test.ts zou
    // meetellen, en geen code die de leerling al zou overnemen.
    expect(lees(id)).not.toMatch(/```python/);
  });

  it('de FastAPI-startpagina noemt de voorkennis uit de drie cursussen en Hoe start ik?', () => {
    const tekst = lees('FastAPI/index');
    for (const site of ['python', 'web', 'editor']) {
      expect(tekst, site).toContain(`<SiteLink site="${site}"`);
    }
    expect(tekst).toContain('](/docs/starten)');
    expect(tekst).toContain('](/docs/FastAPI/installatie)');
    expect(tekst).toContain('](/docs/veiligheid)');
  });
});
