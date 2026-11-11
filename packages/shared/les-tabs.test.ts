import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compile } from '@mdx-js/mdx';
import { describe, expect, it } from 'vitest';

// Les-tabbladen (proef): een remark-stap zet elke `##`-sectie van een les in
// een tabblad. Wat hier vastligt, is wat er misging toen het voor het eerst
// op de web-cursus draaide: de uitleg vóór de eerste `##` bleef boven elk
// tabblad staan, de front matter gaf elke les een leeg tabblad, en de les
// gebruikte de breedte van de inhoudsopgave niet.

const require = createRequire(import.meta.url);
const { groepeer, tabLabel, remarkLesTabs } = require('./plugins/les-tabs.js');

type Knoop = {
  type: string;
  name?: string;
  depth?: number;
  value?: string;
  children?: Knoop[];
  attributes?: { name: string; value: string }[];
  data?: { id?: string };
};

const kop = (depth: number, tekst: string, id?: string): Knoop => ({
  type: 'heading',
  depth,
  children: [{ type: 'text', value: tekst }],
  data: id === undefined ? { id: tekst.toLowerCase().replace(/[^a-z0-9]+/g, '-') } : { id },
});
const alinea = (tekst: string): Knoop => ({
  type: 'paragraph',
  children: [{ type: 'text', value: tekst }],
});
const titel: Knoop = { type: 'mdxJsxFlowElement', name: 'header', children: [kop(1, 'Les')] };
const esm = (value: string): Knoop => ({ type: 'mdxjsEsm', value });

const tabs = (uit: Knoop[]) =>
  (uit.find((n) => n.name === 'LesTabs')?.children ?? []).map((t) =>
    Object.fromEntries((t.attributes ?? []).map((a) => [a.name, a.value])),
  );

describe('tabLabel', () => {
  it('kort een kop met een dubbele punt in tot het stuk ervoor', () => {
    expect(tabLabel('Opdracht 1: Tel de klikken')).toBe('Opdracht 1');
    expect(tabLabel('else: anders dit')).toBe('else');
  });

  it('laat een kop zonder dubbele punt zoals hij is', () => {
    expect(tabLabel('Probeer en onderzoek')).toBe('Probeer en onderzoek');
    expect(tabLabel('Wat ga je leren?')).toBe('Wat ga je leren?');
    // Een tijd met een dubbele punt, zonder spatie erna, is geen titel met ondertitel.
    expect(tabLabel('Om 12:30 lunch')).toBe('Om 12:30 lunch');
  });
});

describe('groepeer', () => {
  it('zet elke ##-sectie in een tabblad, met de kop erin', () => {
    const uit = groepeer([titel, kop(2, 'Theorie'), alinea('a'), kop(3, 'Koppen'), kop(2, 'Make')]);
    expect(uit.map((n: Knoop) => n.name ?? n.type)).toEqual(['header', 'LesTabs']);
    expect(tabs(uit)).toEqual([
      { id: 'theorie', titel: 'Theorie', label: 'Theorie' },
      { id: 'make', titel: 'Make', label: 'Make' },
    ]);
    const [theorie] = uit[1].children;
    // De kop blijft in het paneel: hij is het doel van een link naar #theorie.
    expect(theorie.children.map((n: Knoop) => n.type)).toEqual(['heading', 'paragraph', 'heading']);
  });

  it('laat de titel en de startcode boven de tabbladen, en een export verderop op de root', () => {
    // De startcode staat in `export const …` onder de titel. Docusaurus hangt
    // de inhoudsopgave als laatste export aan de pagina; in een paneel hoort
    // geen van beide.
    const start = esm('export const startHtml = ``');
    const toc = esm('');
    const uit = groepeer([titel, start, kop(2, 'Predict'), kop(2, 'Make'), alinea('x'), toc]);
    expect(uit[0]).toBe(titel);
    expect(uit[1]).toBe(start);
    expect(uit.at(-1)).toBe(toc);
    expect(uit[2].children.at(-1).children).not.toContain(toc);
  });

  it('maakt van uitleg vóór de eerste ## een eerste tabblad Uitleg', () => {
    // De lessen over JavaScript beginnen met uitleg zonder `##`. Die bleef
    // boven elk tabblad staan: tot 750 pixels, waarna geen oefenveld meer in
    // beeld stond.
    const uit = groepeer([titel, alinea('Dit is je eerste regel.'), kop(2, 'Predict')]);
    expect(tabs(uit)).toEqual([
      { id: 'uitleg', titel: 'Uitleg', label: 'Uitleg' },
      { id: 'predict', titel: 'Predict', label: 'Predict' },
    ]);
    expect(uit[1].children[0].children[0].children[0].value).toBe('Dit is je eerste regel.');
  });

  it('maakt geen tabblad Uitleg van wat niets op de pagina zet', () => {
    // De front matter en een commentaar staan ook vóór de eerste `##`. Elke
    // les van html-css kreeg er een leeg tabblad Uitleg door.
    const uit = groepeer([
      { type: 'yaml', value: '' },
      titel,
      esm('import X from "x"'),
      { type: 'mdxFlowExpression', value: '/* niet-compileren: reden */' },
      kop(2, 'Theorie'),
      kop(2, 'Make'),
    ]);
    expect(tabs(uit).map((t) => t.label)).toEqual(['Theorie', 'Make']);
  });

  it('geeft Uitleg een eigen id als een kop al zo heet', () => {
    const uit = groepeer([alinea('intro'), kop(2, 'Uitleg'), kop(2, 'Make')]);
    expect(tabs(uit).map((t) => t.id)).toEqual(['les-uitleg', 'uitleg', 'make']);
  });

  it('doet niets met minder dan twee tabbladen', () => {
    expect(groepeer([titel, alinea('alleen tekst')])).toBeNull();
    expect(groepeer([titel, kop(2, 'Enige sectie'), alinea('x')])).toBeNull();
    // Eén sectie met uitleg ervoor zijn er wel twee.
    expect(groepeer([titel, alinea('intro'), kop(2, 'Enige sectie')])).not.toBeNull();
  });

  it('weigert een kop zonder id: dan staat de stap vóór die van Docusaurus', () => {
    expect(() => groepeer([kop(2, 'A', ''), kop(2, 'B', '')])).toThrow(/heeft geen id/);
  });
});

describe('remarkLesTabs', () => {
  // Docusaurus geeft elke kop een id voordat deze stap draait; hier doet een
  // kleine stap dat na.
  const metIds = () => (tree: Knoop) => {
    for (const n of tree.children ?? []) {
      if (n.type === 'heading')
        n.data = { id: (n.children?.[0]?.value ?? '').toLowerCase().replace(/\W+/g, '-') };
    }
  };
  const bouw = async (bron: string, frontMatter: object = {}) =>
    String(
      await compile(
        { value: bron, data: { frontMatter } },
        { remarkPlugins: [metIds, remarkLesTabs] },
      ),
    );

  const LES = '# Les\n\n## Theorie\n\nTekst.\n\n## Opdracht 1: Tel "alles" & meer\n\nDoe iets.\n';

  it('wat eruit komt, compileert als MDX met LesTabs en LesTab', async () => {
    const js = await bouw(LES);
    expect(js).toMatch(/LesTabs/);
    expect(js).toContain('id: "theorie"');
    // Een titel met aanhalingstekens en een & komt heel door als eigenschap.
    expect(js).toContain('titel: "Opdracht 1: Tel \\"alles\\" & meer"');
    expect(js).toContain('label: "Opdracht 1"');
  });

  it('slaat een pagina over met les_tabs: false in de front matter', async () => {
    expect(await bouw(LES, { les_tabs: false })).not.toMatch(/LesTab/);
  });

  it('telt een ## in een uitklapblok niet als sectie', async () => {
    const js = await bouw(
      '# Les\n\n## Theorie\n\n<details>\n\n## Verstopt\n\n</details>\n\n## Make\n\nx\n',
    );
    expect(js.match(/id: "/g)).toHaveLength(2);
  });
});

describe('de opmaak van de tabbladen', () => {
  const css = readFileSync(
    fileURLToPath(new URL('./components/LesTabs/styles.module.css', import.meta.url)),
    'utf8',
  ).replace(/\/\*[\s\S]*?\*\//g, '');
  const regels = [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
    sel: sel.trim(),
    body,
  }));

  it('maakt op de wortel en de panelen geen eigen laag', () => {
    // Een oefenveld op Groter is position: fixed. Een transform, filter,
    // contain, overflow of z-index op een ouder maakt een eigen laag: het
    // veld valt dan onder de navbar of wordt afgesneden. De rij tabbladen
    // zelf is geen ouder van een paneel en mag wel schuiven.
    const verboden =
      /(^|[\s;])(transform|filter|contain|will-change|overflow(-[xy])?|z-index|isolation|animation|transition|container-type)\s*:/;
    const fout = regels
      .filter(({ sel }) => /^\.(wortel|paneel)\b/.test(sel))
      .filter(({ body }) => verboden.test(body))
      .map(({ sel }) => sel);
    expect(fout).toEqual([]);
    expect(regels.some(({ sel }) => sel === '.paneel[hidden]')).toBe(true);
  });

  it('haalt de inhoudsopgave weg en geeft de les die breedte', () => {
    expect(css).toMatch(/html:has\(\[data-les-tabs\]\) \.col--3:has\(> \.theme-doc-toc-desktop\)/);
    expect(css).toMatch(/html:has\(\[data-les-tabs\]\) \.theme-doc-toc-mobile/);
    // Docusaurus zet de kolom op 75% met !important in een cascade layer.
    // Een losse regel verliest daarvan, hoe specifiek ook: de les bleef op
    // driekwart staan, met een leeg vlak rechts. Alleen een regel in een
    // eerdere layer wint.
    expect(css).toMatch(
      /@layer docusaurus\.infima\s*\{[^}]*docItemCol[^}]*max-width:\s*100%\s*!important/,
    );
  });

  it('zet op papier alle onderdelen onder elkaar', () => {
    const print = css.slice(css.indexOf('@media print'));
    expect(print).toMatch(/\.paneel\[hidden\]\s*\{\s*display:\s*block/);
    expect(print).toMatch(/\.tablist[\s\S]*display:\s*none/);
  });
});
