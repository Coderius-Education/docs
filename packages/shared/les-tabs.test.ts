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
const { groepeer, metStappen, tabLabel, remarkLesTabs } = require('./plugins/les-tabs.js');

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
      { id: 'theorie', titel: 'Theorie', label: 'Theorie', werkvorm: 'uitleg' },
      { id: 'make', titel: 'Make', label: 'Make', werkvorm: 'maken' },
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
    const uit = groepeer([
      titel,
      alinea('Dit is je eerste regel.'),
      alinea('Er gebeuren twee dingen.'),
      kop(2, 'Predict'),
    ]);
    expect(tabs(uit)).toEqual([
      { id: 'uitleg', titel: 'Uitleg', label: 'Uitleg', werkvorm: 'uitleg' },
      { id: 'predict', titel: 'Predict', label: 'Predict', werkvorm: 'voorspellen' },
    ]);
    expect(uit[1].children[0].children[0].children[0].value).toBe('Dit is je eerste regel.');
  });

  it('uitleg van één alinea krijgt geen eigen tabblad: hij opent het eerste', () => {
    // Vijf lessen over JavaScript begonnen met een tabblad Uitleg van één
    // alinea en een knop Volgende: een scherm zonder inhoud.
    const uit = groepeer([
      titel,
      alinea('Tot nu toe stond alles vast.'),
      kop(2, 'alert()'),
      kop(2, 'Predict'),
    ]);
    expect(tabs(uit).map((t) => t.label)).toEqual(['alert()', 'Predict']);
    const [eerste] = uit[1].children;
    expect(eerste.children.map((n: Knoop) => n.type)).toEqual(['paragraph', 'heading']);
    expect(eerste.children[0].children[0].value).toBe('Tot nu toe stond alles vast.');
  });

  it('het leerdoel van de les krijgt geen eigen tabblad: het staat bovenaan het tabblad erna', () => {
    // "Wat ga je leren?" was in achttien lessen een scherm met één zin.
    const uit = groepeer([
      titel,
      kop(2, 'Wat ga je leren?'),
      alinea('Koppen en lijsten.'),
      kop(2, 'Theorie'),
      alinea('Uitleg.'),
      kop(2, 'Make'),
    ]);
    expect(tabs(uit).map((t) => t.label)).toEqual(['Theorie', 'Make']);
    const [theorie] = uit[1].children;
    expect(theorie.children.map((n: Knoop) => n.name ?? n.type)).toEqual([
      'LesLeerdoel',
      'heading',
      'paragraph',
    ]);
    // De kop gaat mee: hij is het doel van een link naar #wat-ga-je-leren.
    const [leerdoel] = theorie.children;
    expect(leerdoel.children.map((n: Knoop) => n.type)).toEqual(['heading', 'paragraph']);
    expect(leerdoel.children[0].data?.id).toBe('wat-ga-je-leren-');
  });

  it('een leerdoel met meer dan een paar zinnen, of als laatste sectie, blijft een tabblad', () => {
    const lang = groepeer([
      titel,
      kop(2, 'Wat ga je leren?'),
      alinea('a'),
      alinea('b'),
      alinea('c'),
      kop(2, 'Theorie'),
      kop(2, 'Make'),
    ]);
    expect(tabs(lang).map((t) => t.label)).toEqual(['Wat ga je leren?', 'Theorie', 'Make']);
    const laatste = groepeer([
      titel,
      kop(2, 'Theorie'),
      kop(2, 'Make'),
      kop(2, 'Wat ga je leren?'),
    ]);
    expect(tabs(laatste).map((t) => t.label)).toEqual(['Theorie', 'Make', 'Wat ga je leren?']);
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
    const uit = groepeer([alinea('intro'), alinea('meer'), kop(2, 'Predict'), kop(3, 'Uitleg')]);
    expect(tabs(uit).map((t) => t.id)).toEqual(['uitleg', 'predict']);
    const bezet = groepeer([alinea('intro'), alinea('meer'), kop(2, 'Uitleg'), kop(2, 'Make')]);
    expect(tabs(bezet).map((t) => t.id)).toEqual(['les-uitleg', 'make']);
  });

  it('geeft elk tabblad zijn werkvorm, en van een rij opdrachten is de laatste zelf maken', () => {
    // De werkvorm is de schakel naar vakdidactiek: het icoon op het tabblad,
    // en in de docentenhandleiding de tip die hem onderbouwt.
    const uit = groepeer([
      titel,
      kop(2, 'Stap 1: een functie'),
      kop(2, 'Probeer en onderzoek'),
      kop(2, 'Opdracht 1: Tel'),
      kop(2, 'Opdracht 2: Reset'),
      kop(2, 'Er gaat iets mis'),
    ]);
    expect(tabs(uit).map((t) => t.werkvorm)).toEqual([
      'stap',
      'onderzoeken',
      'aanpassen',
      'maken',
      'fouten',
    ]);
  });

  describe('de uitleg waar een les mee begint, is één tabblad met stappen', () => {
    // Een les over JavaScript begint met drie of vier secties uitleg. Als
    // losse tabbladen stond de rij in acht van de zestien lessen op 1280
    // pixels op twee regels (arrays: tien tabbladen).
    const stappenVan = (tab: Knoop) =>
      (tab.children?.find((n) => n.name === 'LesStappen')?.children ?? []).map((st) =>
        Object.fromEntries((st.attributes ?? []).map((a) => [a.name, a.value])),
      );
    const les = () =>
      groepeer([
        titel,
        alinea('intro'),
        alinea('meer'),
        kop(2, 'Een item ophalen'),
        alinea('a'),
        kop(2, 'Combineren met een loop'),
        alinea('b'),
        kop(2, 'Predict'),
        kop(2, 'Opdracht 1: Tel'),
      ]);

    it('voegt ze samen tot Uitleg, met elke sectie als stap', () => {
      const uit = les();
      expect(tabs(uit).map((t) => [t.id, t.label, t.werkvorm])).toEqual([
        ['uitleg', 'Uitleg', 'uitleg'],
        ['predict', 'Predict', 'voorspellen'],
        ['opdracht-1-tel', 'Opdracht 1', 'aanpassen'],
      ]);
      expect(stappenVan(uit[1].children[0])).toEqual([
        { id: 'uitleg-basis', titel: 'De basis', label: 'De basis' },
        { id: 'een-item-ophalen', titel: 'Een item ophalen', label: 'Een item ophalen' },
        {
          id: 'combineren-met-een-loop',
          titel: 'Combineren met een loop',
          label: 'Combineren met een loop',
        },
      ]);
    });

    it('de kop van een sectie gaat mee in zijn stap: daar komt een link naar de kop uit', () => {
      const [, ophalen] = les()[1].children[0].children[0].children;
      expect(ophalen.children.map((n: Knoop) => n.type)).toEqual(['heading', 'paragraph']);
      expect(ophalen.children[0].data.id).toBe('een-item-ophalen');
    });

    it('een sectie die zelf stappen had, levert die stappen op hetzelfde niveau', () => {
      const uit = groepeer([
        titel,
        kop(2, 'De for-loop'),
        alinea('a'),
        alinea('b'),
        kop(3, 'De teller gebruiken'),
        alinea('c'),
        kop(2, 'De while-loop'),
        alinea('d'),
        kop(2, 'Predict'),
      ]);
      expect(tabs(uit).map((t) => t.label)).toEqual(['Uitleg', 'Predict']);
      const [uitleg] = uit[1].children;
      // De basis van De for-loop heet nu naar zijn sectie, en heeft de ## erin.
      expect(stappenVan(uitleg).map((st) => [st.id, st.label])).toEqual([
        ['de-for-loop', 'De for-loop'],
        ['de-teller-gebruiken', 'De teller gebruiken'],
        ['de-while-loop', 'De while-loop'],
      ]);
      const [forLoop] = uitleg.children[0].children;
      expect(forLoop.children.map((n: Knoop) => n.type)).toEqual([
        'heading',
        'paragraph',
        'paragraph',
      ]);
    });

    it('één uitleg-tabblad blijft wat het was, ook met Bonus verderop', () => {
      const uit = groepeer([
        titel,
        kop(2, 'Theorie'),
        kop(2, 'Predict'),
        kop(2, 'Bonus'),
        kop(2, 'Er gaat iets mis'),
      ]);
      expect(tabs(uit).map((t) => t.label)).toEqual([
        'Theorie',
        'Predict',
        'Bonus',
        'Er gaat iets mis',
      ]);
    });

    it('een les die alleen uit uitleg bestaat, houdt zijn tabbladen', () => {
      // Anders bleef er één tabblad over, en dat is geen rij.
      const uit = groepeer([titel, kop(2, 'Wat kan het?'), kop(2, 'Waar staat het?')]);
      expect(tabs(uit).map((t) => t.label)).toEqual(['Wat kan het?', 'Waar staat het?']);
    });
  });

  it('doet niets met minder dan twee tabbladen', () => {
    expect(groepeer([titel, alinea('alleen tekst')])).toBeNull();
    expect(groepeer([titel, kop(2, 'Enige sectie'), alinea('x')])).toBeNull();
    // Eén sectie met uitleg van meer dan een alinea ervoor zijn er wel twee.
    expect(
      groepeer([titel, alinea('intro'), alinea('meer'), kop(2, 'Enige sectie')]),
    ).not.toBeNull();
    // Eén alinea ervoor hoort bij die ene sectie: nog steeds één tabblad.
    expect(groepeer([titel, alinea('intro'), kop(2, 'Enige sectie')])).toBeNull();
  });

  it('weigert een kop zonder id: dan staat de stap vóór die van Docusaurus', () => {
    expect(() => groepeer([kop(2, 'A', ''), kop(2, 'B', '')])).toThrow(/heeft geen id/);
  });
});

// Een tabblad Theorie met vijf koppen was zelf nog tot 1330 pixels te lang.
// Elke `###` is daarom een stap binnen het tabblad.
describe('metStappen', () => {
  const eigenschappen = (n: Knoop) =>
    Object.fromEntries((n.attributes ?? []).map((a) => [a.name, a.value]));
  const stappen = (uit: Knoop[]) =>
    (uit.find((n) => n.name === 'LesStappen')?.children ?? []).map(eigenschappen);

  it('maakt van elke ### een stap, met de kop erin', () => {
    const uit = metStappen(
      [kop(2, 'Theorie'), kop(3, 'Koppen'), alinea('a'), kop(3, 'Lijsten'), alinea('b')],
      'theorie',
    );
    // De ## blijft boven de stappen: hij is het doel van een link naar #theorie.
    expect(uit.map((n: Knoop) => n.name ?? n.type)).toEqual(['heading', 'LesStappen']);
    expect(stappen(uit)).toEqual([
      { id: 'koppen', titel: 'Koppen', label: 'Koppen' },
      { id: 'lijsten', titel: 'Lijsten', label: 'Lijsten' },
    ]);
    const [eerste] = uit[1].children;
    expect(eerste.name).toBe('LesStap');
    expect(eerste.children.map((n: Knoop) => n.type)).toEqual(['heading', 'paragraph']);
  });

  it('maakt van de uitleg vóór de eerste ### de eerste stap, De basis', () => {
    // Bleef die boven de stappen staan, dan stond hij boven elke stap: in
    // tekst-opmaken-css 21 regels, en dan paste geen enkele stap.
    const uit = metStappen(
      [kop(2, 'Theorie'), alinea('a'), alinea('b'), kop(3, 'Extra'), alinea('c')],
      'theorie',
    );
    expect(uit.map((n: Knoop) => n.name ?? n.type)).toEqual(['heading', 'LesStappen']);
    expect(stappen(uit)).toEqual([
      { id: 'theorie-basis', titel: 'De basis', label: 'De basis' },
      { id: 'extra', titel: 'Extra', label: 'Extra' },
    ]);
    expect(uit[1].children[0].children.map((n: Knoop) => n.type)).toEqual([
      'paragraph',
      'paragraph',
    ]);
  });

  it('zet één losse alinea in de eerste stap, vóór zijn kop', () => {
    // "CSS kent meerdere eenheden:" is als stap een scherm met één zin. Boven
    // de stappen stond hij bij elke stap opnieuw: in css-selectors zes keer
    // "Je weet al hoe je elementen selecteert".
    const uit = metStappen(
      [kop(2, 'Theorie'), alinea('kort'), kop(3, 'Een'), kop(3, 'Twee')],
      'theorie',
    );
    expect(uit.map((n: Knoop) => n.name ?? n.type)).toEqual(['heading', 'LesStappen']);
    expect(stappen(uit).map((st) => st.id)).toEqual(['een', 'twee']);
    const [een, twee] = uit[1].children;
    expect(een.children.map((n: Knoop) => n.type)).toEqual(['paragraph', 'heading']);
    expect(twee.children.map((n: Knoop) => n.type)).toEqual(['heading']);
  });

  it('wat vooraf komt, staat op het eerste scherm van het tabblad', () => {
    const vooraf = [alinea('leerdoel')];
    // Met een lange inleiding: in De basis, vooraan.
    const metBasis = metStappen(
      [kop(2, 'Theorie'), alinea('a'), alinea('b'), kop(3, 'Extra')],
      'theorie',
      vooraf,
    );
    expect(metBasis[1].children[0].children.map((n: Knoop) => n.children?.[0].value)).toEqual([
      'leerdoel',
      'a',
      'b',
    ]);
    // Zonder inleiding: in de eerste stap.
    const zonder = metStappen(
      [kop(2, 'Theorie'), kop(3, 'Een'), kop(3, 'Twee')],
      'theorie',
      vooraf,
    );
    expect(zonder[1].children[0].children.map((n: Knoop) => n.type)).toEqual([
      'paragraph',
      'heading',
    ]);
    // Zonder stappen: boven de kop van het tabblad.
    const plat = metStappen([kop(2, 'Predict'), alinea('x')], 'predict', vooraf);
    expect(plat.map((n: Knoop) => n.type)).toEqual(['paragraph', 'heading', 'paragraph']);
  });

  it('het leerdoel staat boven de rij stappen, niet in stap 1', () => {
    // Onder de rij las het als een deel van de eerste stap ("Elementen
    // binnen elementen"), terwijl het over de hele les gaat.
    const leerdoel: Knoop = { type: 'mdxJsxFlowElement', name: 'LesLeerdoel', children: [] };
    const uit = metStappen([kop(2, 'Theorie'), kop(3, 'Een'), kop(3, 'Twee')], 'theorie', [
      leerdoel,
      alinea('kort'),
    ]);
    const [, lijst] = uit;
    expect(lijst.children.map((n: Knoop) => n.name)).toEqual(['LesLeerdoel', 'LesStap', 'LesStap']);
    // Een korte inleiding hoort wel bij de eerste stap.
    expect(lijst.children[1].children.map((n: Knoop) => n.type)).toEqual(['paragraph', 'heading']);
  });

  it('laat een sectie met maar één stap zoals hij is', () => {
    const zonder = [kop(2, 'Predict'), alinea('a')];
    expect(metStappen(zonder, 'predict')).toBe(zonder);
    const een = [kop(2, 'Theorie'), alinea('kort'), kop(3, 'Een'), alinea('a')];
    expect(metStappen(een, 'theorie')).toBe(een);
  });

  it('een tabblad krijgt zijn stappen van groepeer', () => {
    const uit = groepeer([
      titel,
      kop(2, 'Theorie'),
      kop(3, 'Koppen'),
      kop(3, 'Lijsten'),
      kop(2, 'Make'),
    ]);
    const [theorie, make] = uit[1].children;
    expect(theorie.children.map((n: Knoop) => n.name ?? n.type)).toEqual(['heading', 'LesStappen']);
    expect(make.children.map((n: Knoop) => n.name ?? n.type)).toEqual(['heading']);
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

  it('een sectie met meer ###-koppen compileert met LesStappen en LesStap', async () => {
    const js = await bouw(
      '# Les\n\n## Theorie\n\n### Koppen\n\na\n\n### Lijsten\n\nb\n\n## Make\n\nx\n',
    );
    expect(js).toMatch(/LesStappen/);
    expect(js).toMatch(/LesStap\b/);
    expect(js).toContain('id: "koppen"');
    expect(js).toContain('id: "lijsten"');
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
      .filter(({ sel }) => /^\.(wortel|paneel|stappen)\b/.test(sel))
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
    // Ook de stappen: een stap is een paneel, en zijn rij knoppen vervalt.
    expect(print).toMatch(/\.staplist[\s\S]*display:\s*none/);
    expect(print).toMatch(/\.kopOpStap > h3[\s\S]*position:\s*static/);
    expect(print).toMatch(/\.leerdoelTekst > h2/);
  });

  it('verbergt de kop van een tabblad of stap ook als hij niet vooraan staat', () => {
    // Vóór de kop kan het leerdoel of een korte inleiding staan. Met
    // `:first-child` stond de kop "Theorie" dan weer zichtbaar onder het
    // tabblad dat al zo heet.
    expect(css).toMatch(/\.kopOpTab > h2\s*\{/);
    expect(css).toMatch(/\.kopOpStap > h3\s*\{/);
    expect(css).not.toMatch(/\.kopOp(Tab|Stap) > h[23]:first-child/);
    // Een stap in het tabblad Uitleg is een hele ##-sectie.
    expect(css).toMatch(/\.kopOpStap > h2,/);
  });

  it('een verborgen kop maakt de pagina niet breder', () => {
    // clip-path verbergt de tekst, maar hij telt nog mee voor de breedte: op
    // een telefoon schoven 18 schermen zijwaarts, tot 236 pixels (de kop
    // "Spatie tussen tag en klasse (p .opvallend vs p.opvallend)").
    const verborgen = regels.filter(
      ({ body }) => /clip-path:\s*inset/.test(body) && /white-space:\s*nowrap/.test(body),
    );
    expect(verborgen.length).toBeGreaterThanOrEqual(3);
    for (const { sel, body } of verborgen) {
      expect(body, sel).toMatch(/overflow:\s*hidden/);
    }
  });

  it('de marge om een oefenveld geldt niet als het veld het scherm vult', () => {
    // Op Groter is het veld position: fixed met inset 0. De marge van het
    // paneel won van die van het veld (twee klassen tegen één), en dan bleef
    // er boven en onder 16 pixels van de les zichtbaar. Gezien in Chromium.
    expect(regels.some(({ sel }) => sel === '.paneel [data-zaad]:not([data-groot])')).toBe(true);
    expect(regels.some(({ sel }) => sel === '.paneel [data-zaad]')).toBe(false);
  });

  it('op een telefoon schuift de rij stappen, in plaats van zes regels te vullen', () => {
    const smal = css.slice(css.indexOf('@media (max-width: 996px)'));
    expect(smal).toMatch(/\.staplist\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/);
  });

  it('haalt het kruimelpad alleen weg waar de lessenlijst ernaast staat', () => {
    // Boven elk paneel stond 276 pixels; het kruimelpad en een titel van 3rem
    // waren daar 100 van. Op een telefoon is de lessenlijst dicht en zegt het
    // kruimelpad nog wel waar je bent.
    const breed = css.slice(
      css.lastIndexOf('@media (min-width: 997px)'),
      css.indexOf('@media print'),
    );
    expect(breed).toMatch(
      /html:has\(\[data-les-tabs\]\) \.theme-doc-breadcrumbs\)?\s*\{\s*display:\s*none/,
    );
    expect(breed).toMatch(/\.theme-doc-markdown > header > h1\)?\s*\{[^}]*--ifm-h1-font-size/);
    const buiten = css.slice(0, css.indexOf('@media'));
    expect(buiten).not.toMatch(/theme-doc-breadcrumbs/);
  });
});
