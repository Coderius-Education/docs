import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../../sidebars';
import { type SidebarItem, etappes, zonderNummer } from './logica';
import { MIJLPALEN, ZINNEN } from './zinnen';

// De Routekaart zet de sidebar om in een route. Hier de omzetting zelf, en de
// koppeling met sidebars.ts: elke categorie heeft een zin, en geen zin hoort bij
// een categorie die niet meer bestaat.

type Config = string | { type: string; label: string; items: Config[] };

// Zoals Docusaurus de sidebar aan de pagina geeft: een doc-id wordt een link
// met een href; het label is hier het id, want de titels staan in de lessen.
function alsProp(items: Config[]): SidebarItem[] {
  return items.map((i) =>
    typeof i === 'string'
      ? { type: 'link', label: i, href: `/docs/${i.replace(/\/index$/, '')}` }
      : { type: 'category', label: i.label, items: alsProp(i.items) },
  );
}

const fastapi = sidebars.apiSidebar as unknown as Config[];
const veiligheid = sidebars.veiligheidSidebar as unknown as Config[];

describe('etappes', () => {
  it('laat de startpagina weg, met en zonder slash aan het eind', () => {
    const items = alsProp(fastapi);
    expect(etappes(items, { huidig: '/docs/FastAPI' })[0].label).toBe('Je eerste server');
    expect(etappes(items, { huidig: '/docs/FastAPI/' })[0].label).toBe('Je eerste server');
  });

  it('maakt van elke categorie één etappe met al zijn lessen, in volgorde', () => {
    const route = etappes(alsProp(fastapi), { huidig: '/docs/FastAPI' });
    const categorieen = fastapi.filter((c) => typeof c !== 'string');
    expect(route).toHaveLength(categorieen.length);
    expect(route[0].lessen.map((l) => l.href)).toEqual([
      '/docs/FastAPI/eerste-server/installatie',
      '/docs/FastAPI/eerste-server/eerste_endpoint',
      '/docs/FastAPI/eerste-server/verzoek-eerste',
      '/docs/FastAPI/eerste-server/devtools-netwerk',
    ]);
    // Zonder eigen pagina linkt de kop naar de eerste les.
    expect(route[0].href).toBe('/docs/FastAPI/eerste-server/installatie');
  });

  it('haalt "Uitbreiding:" uit de naam en markeert de etappe', () => {
    const route = etappes(alsProp(fastapi));
    const htmx = route.find((e) => e.sidebarLabel === 'Uitbreiding: zonder herladen (htmx)');
    expect(htmx).toMatchObject({ label: 'Zonder herladen (htmx)', uitbreiding: true });
    expect(route.find((e) => e.label === 'Afronden')?.uitbreiding).toBe(false);
  });

  it('een losse pagina wordt een etappe zonder lessen', () => {
    const route = etappes(alsProp(veiligheid), { huidig: '/docs/veiligheid/' });
    expect(route[0]).toMatchObject({ href: '/docs/veiligheid/gereedschap', lessen: [] });
    expect(route.at(-1)).toMatchObject({ href: '/docs/veiligheid/eigen-project', lessen: [] });
  });

  it('platte geneste categorieën, slaat unlisted en html over', () => {
    const route = etappes([
      {
        type: 'category',
        label: 'A',
        items: [
          { type: 'link', label: '1. Een', href: '/a/1' },
          { type: 'link', label: 'Verborgen', href: '/a/x', unlisted: true },
          { type: 'html', label: '<hr>' },
          { type: 'category', label: 'B', items: [{ type: 'link', label: 'Twee', href: '/a/2' }] },
        ],
      },
      { type: 'category', label: 'Leeg', items: [] },
    ]);
    expect(route).toHaveLength(1);
    expect(route[0].lessen).toEqual([
      { label: 'Een', href: '/a/1' },
      { label: 'Twee', href: '/a/2' },
    ]);
  });

  it('zet de zin en de mijlpaal bij de juiste etappe', () => {
    const route = etappes(alsProp(fastapi), { zinnen: ZINNEN, mijlpalen: MIJLPALEN });
    const basisEinde = route.find((e) => e.sidebarLabel === 'Accounts');
    expect(basisEinde?.zin).toBe(ZINNEN.Accounts);
    expect(basisEinde?.mijlpaal).toMatch(/gastenboek/);
  });
});

describe('zonderNummer', () => {
  it('haalt alleen een nummer vooraan weg: de kaart nummert zelf', () => {
    expect(zonderNummer('1. maxlength is geen controle')).toBe('maxlength is geen controle');
    expect(zonderNummer('12. Iets')).toBe('Iets');
    expect(zonderNummer('Eén item tonen: path-parameters en 404')).toBe(
      'Eén item tonen: path-parameters en 404',
    );
    expect(zonderNummer('3.1 Acties')).toBe('3.1 Acties');
  });
});

describe('zinnen bij sidebars.ts', () => {
  // De kaart toont de categorieën uit de sidebar; de zinnen staan apart. Een
  // nieuwe of hernoemde categorie zonder zin viel anders stil leeg op de kaart.
  // Een losse pagina (gereedschap, eigen-project) heeft zijn sidebar_label als
  // sleutel, zoals Docusaurus hem aan de kaart geeft. De startpagina zelf staat
  // niet op de kaart.
  const label = (id: string) => {
    const bron = readFileSync(
      fileURLToPath(new URL(`../../../docs/${id}.mdx`, import.meta.url)),
      'utf8',
    );
    return bron.match(/^sidebar_label: '([^']+)'/m)?.[1] ?? bron.match(/^# (.+)$/m)?.[1] ?? id;
  };
  const sleutels = [...fastapi, ...veiligheid].flatMap((i) => {
    if (typeof i !== 'string') return [i.label];
    return i.endsWith('/index') ? [] : [label(i)];
  });

  it('elke categorie en losse pagina op de kaart heeft een zin', () => {
    expect(sleutels.filter((s) => !(s in ZINNEN))).toEqual([]);
  });

  it('geen zin of mijlpaal voor iets wat niet meer in de sidebar staat', () => {
    expect(Object.keys(ZINNEN).filter((s) => !sleutels.includes(s))).toEqual([]);
    expect(Object.keys(MIJLPALEN).filter((s) => !sleutels.includes(s))).toEqual([]);
  });

  it('een zin is één zin, of één vraag met een korte toelichting', () => {
    const lang = Object.entries(ZINNEN).filter(([, zin]) => zin.split(/\s+/).length > 20);
    expect(lang).toEqual([]);
  });
});
