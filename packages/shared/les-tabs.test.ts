import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compile } from '@mdx-js/mdx';
import { describe, expect, it } from 'vitest';

// Les-tabbladen: een remark-stap zet elke `##`-sectie van een les in
// een tabblad. Wat hier vastligt, is wat er misging toen het voor het eerst
// op de web-cursus draaide: de uitleg vóór de eerste `##` bleef boven elk
// tabblad staan, de front matter gaf elke les een leeg tabblad, en de les
// gebruikte de breedte van de inhoudsopgave niet.

const require = createRequire(import.meta.url);
const {
  groepeer,
  metStappen,
  tabLabel,
  remarkLesTabs,
  isDeel,
  deelMetStappen,
} = require('./plugins/les-tabs.js');

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
/** Een lijst met een punt per tekst. */
const punten = (...teksten: string[]): Knoop => ({
  type: 'list',
  children: teksten.map((tekst) => ({ type: 'listItem', children: [alinea(tekst)] })),
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
    // Ook een `###` telt: als stap heeft hij een eigen paneel en een eigen
    // adres, en twee panelen met het id "uitleg" zijn er één te veel.
    const uit = groepeer([alinea('intro'), alinea('meer'), kop(2, 'Predict'), kop(3, 'Uitleg')]);
    expect(tabs(uit).map((t) => t.id)).toEqual(['les-uitleg', 'predict']);
    const vrij = groepeer([alinea('intro'), alinea('meer'), kop(2, 'Predict'), kop(3, 'Meer')]);
    expect(tabs(vrij).map((t) => t.id)).toEqual(['uitleg', 'predict']);
    const bezet = groepeer([alinea('intro'), alinea('meer'), kop(2, 'Uitleg'), kop(2, 'Make')]);
    expect(tabs(bezet).map((t) => t.id)).toEqual(['les-uitleg', 'make']);
  });

  it('een lange rij opdrachten toont na de eerste alleen het nummer', () => {
    // Code beter begrijpen (Lego-auto): acht opdrachten, een uitleg en een
    // afsluiter stonden op 1280 pixels op twee regels.
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const les = (aantal: number) =>
      groepeer([
        titel,
        kop(2, 'Zo werkt het'),
        ...letters.slice(0, aantal).map((l) => kop(2, `Opdracht 5.7.${l}: iets`)),
        kop(2, 'Klaar'),
      ]) as Knoop[];
    const lang = tabs(les(8));
    expect(lang.map((t) => t.kort)).toEqual([
      undefined,
      undefined,
      ...letters.slice(1).map((l) => `5.7.${l}`),
      undefined,
    ]);
    // Het label blijft: de knop Volgende en een schermlezer gebruiken het.
    expect(lang[2].label).toBe('Opdracht 5.7.b');
    // Een rij die op één regel past, houdt zijn labels.
    expect(tabs(les(5)).some((t) => t.kort)).toBe(false);
  });

  it('het tabblad Uitleg krijgt een eigen id als een kop verderop Uitleg heet', () => {
    // De LED-pagina van robotica: uitleg vooraf (tabblad Uitleg) en onder Code
    // een stap `### Uitleg`. Allebei hadden het id "uitleg": wie op het
    // tabblad klikte en de pagina herlaadde, stond in Code › Uitleg.
    const uit = groepeer([
      titel,
      alinea('Een LED is een lampje.'),
      alinea('Hij heeft twee pootjes.'),
      kop(2, 'Materiaal'),
      alinea('a'),
      kop(2, 'Code'),
      alinea('b'),
      alinea('c'),
      kop(3, 'Voorbeeld'),
      alinea('d'),
      kop(3, 'Uitleg'),
      alinea('e'),
    ]);
    expect(tabs(uit).map((t) => t.id)).toEqual(['les-uitleg', 'materiaal', 'code']);
  });

  it('een opdracht met een vraag over code, zonder veld, is voorspellen', () => {
    // Code beter begrijpen (robotica): acht opdrachten "wat print dit?" hadden
    // het potlood van aanpassen, en de laatste de blokken van zelf maken.
    const vraag: Knoop = {
      type: 'paragraph',
      children: [
        { type: 'strong', children: [{ type: 'text', value: 'Vraag:' }] },
        { type: 'text', value: ' hoe vaak draait de lus?' },
      ],
    };
    const uit = groepeer([
      titel,
      kop(2, 'Zo werkt het'),
      alinea('Lees de code en voorspel.'),
      kop(2, 'Opdracht 5.7.a: een loop'),
      { type: 'code', value: 'while True:\n    pass' },
      vraag,
      kop(2, 'Opdracht 5.7.b: schrijf zelf'),
      alinea('Schrijf een loop.'),
    ]);
    expect(tabs(uit).map((t) => t.werkvorm)).toEqual(['uitleg', 'voorspellen', 'maken']);
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

    it('een stap die "Stap 2: …" heet, heeft het stuk na de dubbele punt als label', () => {
      // De stappen in een tabblad hebben al een nummer. Het ingebouwde lampje
      // van robotica had "1 Stap 1, 2 Stap 2, 3 Stap 3" in de rij.
      const uit = groepeer([
        titel,
        kop(2, 'Lampje aanzetten'),
        alinea('a'),
        alinea('b'),
        kop(3, 'Stap 1: haal het gereedschap op'),
        alinea('c'),
        kop(3, 'Stap 2: Kies een pin'),
        alinea('d'),
        kop(2, 'Opdracht 1: Twee kleuren'),
      ]);
      const [aanzetten] = uit[1].children;
      expect(stappenVan(aanzetten).map((st) => st.label)).toEqual([
        'De basis',
        'Haal het gereedschap op',
        'Kies een pin',
      ]);
      // Een tabblad houdt "Stap 1": de rij tabbladen heeft geen nummers.
      const tabbladen = groepeer([titel, kop(2, 'Stap 1: De loop'), kop(2, 'Test het')]);
      expect(tabs(tabbladen).map((t) => t.label)).toEqual(['Stap 1', 'Test het']);
    });

    it('uitleg die samen meer dan acht stappen heeft, blijft losse tabbladen', () => {
      // Het ingebouwde lampje van robotica: aanzetten, knipperen en een kleur
      // kiezen, elk met drie of vier stappen. Samen was dat één tabblad Uitleg
      // met twaalf stappen op twee regels; los staan de vijf tabbladen op één.
      const sectie = (naam: string) => [
        kop(2, naam),
        alinea('a'),
        alinea('b'),
        kop(3, `${naam} een`),
        alinea('c'),
        kop(3, `${naam} twee`),
        alinea('d'),
      ];
      const uit = groepeer([
        titel,
        ...sectie('Aanzetten'),
        ...sectie('Knipperen'),
        ...sectie('Een kleur'),
        kop(2, 'Opdracht 1: Twee kleuren'),
      ]);
      expect(tabs(uit).map((t) => t.label)).toEqual([
        'Aanzetten',
        'Knipperen',
        'Een kleur',
        'Opdracht 1',
      ]);
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

  it('zet een voorbeeld met zijn uitvoer naast elkaar', () => {
    // Code, het woord Uitvoer en het uitvoerblok onder elkaar kostten per
    // voorbeeld honderd pixels meer dan naast elkaar; de Python-cursus heeft
    // er 225.
    const code = (value: string): Knoop => ({ type: 'code', value });
    const uit = groepeer([
      titel,
      kop(2, 'Uitleg van print'),
      code('print(1)'),
      alinea('Uitvoer:'),
      code('1'),
      alinea('Meer tekst.'),
      code('print(2)'),
      alinea('Dit is geen uitvoer:'),
      code('2'),
      kop(2, 'Opdracht 1: Print'),
      code('x = 5'),
      alinea('Uitvoer bij 5:'),
      code('5'),
    ]);
    const [uitleg, opdracht] = uit[1].children;
    expect(uitleg.children.map((n: Knoop) => n.name ?? n.type)).toEqual([
      'heading',
      'LesVoorbeeld',
      'paragraph',
      'code',
      'paragraph',
      'code',
    ]);
    // De code links; rechts, in een eigen vak, het woord Uitvoer en het blok.
    const [links, rechts] = uitleg.children[1].children;
    expect(links.type).toBe('code');
    expect(rechts.name).toBe('div');
    expect(rechts.children.map((n: Knoop) => n.type)).toEqual(['paragraph', 'code']);
    // Ook met een toevoeging achter Uitvoer.
    expect(opdracht.children.map((n: Knoop) => n.name ?? n.type)).toEqual([
      'heading',
      'LesVoorbeeld',
    ]);
  });

  it('de toelichting bij een lang programma staat naast de code, onder de uitvoer', () => {
    // Een programma van 23 regels met één regel uitvoer en drie regels
    // toelichting eronder paste niet op het scherm, terwijl de helft van de
    // breedte naast de code leeg was.
    const code = (value: string): Knoop => ({ type: 'code', value });
    const lang = code(Array.from({ length: 14 }, (_, i) => `regel_${i} = ${i}`).join('\n'));
    const rechtsVan = (...na: Knoop[]) =>
      groepeer([
        titel,
        kop(2, 'Een klasse'),
        lang,
        alinea('Uitvoer:'),
        code('13'),
        ...na,
        kop(2, 'Opdracht 1: Print'),
        alinea('Print.'),
      ])[1].children[0].children;
    const metToelichting = rechtsVan(
      alinea('Niets hiervan is nieuw.'),
      alinea('Het volgende wel.'),
    );
    expect(metToelichting.map((n: Knoop) => n.name ?? n.type)).toEqual(['heading', 'LesVoorbeeld']);
    expect(metToelichting[1].children[1].children.map((n: Knoop) => n.type)).toEqual([
      'paragraph',
      'code',
      'paragraph',
      'paragraph',
    ]);
    // Een zin die het volgende blok aankondigt, hoort daarbij.
    const metAankondiging = rechtsVan(alinea('Met een lijst gaat het zo:'), code('x = []'));
    expect(metAankondiging.map((n: Knoop) => n.name ?? n.type)).toEqual([
      'heading',
      'LesVoorbeeld',
      'paragraph',
      'code',
    ]);
    // Bij een kort voorbeeld is er rechts geen ruimte over.
    const kort = groepeer([
      titel,
      kop(2, 'Een klasse'),
      code('print(1)'),
      alinea('Uitvoer:'),
      code('1'),
      alinea('Dat is alles.'),
      kop(2, 'Opdracht 1: Print'),
      alinea('Print.'),
    ])[1].children[0].children;
    expect(kort.map((n: Knoop) => n.name ?? n.type)).toEqual([
      'heading',
      'LesVoorbeeld',
      'paragraph',
    ]);
  });

  it('zet de code met de voorspelvraag eronder naast elkaar', () => {
    // De code en de vraag onder elkaar waren in de Python-cursus samen tot
    // zeshonderd pixels hoog: meer dan het scherm.
    const code = (value: string): Knoop => ({ type: 'code', value });
    const vraag: Knoop = { type: 'mdxJsxFlowElement', name: 'Voorspel', children: [] };
    const uit = groepeer([
      titel,
      kop(2, 'De for-loop'),
      code('print(1)'),
      vraag,
      kop(2, 'Opdracht 1: Print'),
      alinea('Print.'),
    ]);
    const paar = uit[1].children[0].children[1];
    expect(paar.name).toBe('LesVoorbeeld');
    expect(paar.attributes.map((a: { name: string }) => a.name)).toEqual(['vraag']);
    expect(paar.children.map((n: Knoop) => n.name ?? n.type)).toEqual(['code', 'Voorspel']);
  });

  it('zet bestanden met hun naam erboven naast elkaar, met de voorspelvraag erachter', () => {
    // Een module en het programma dat hem importeert, met de vraag wat het
    // programma print: onder elkaar waren die drie 540 pixels, en de vraag
    // gaat over allebei de bestanden.
    const code = (value: string): Knoop => ({ type: 'code', value });
    const naam = (bestand: string): Knoop => ({
      type: 'paragraph',
      children: [{ type: 'strong', children: [{ type: 'inlineCode', value: bestand }] }],
    });
    const merk: Knoop = { type: 'mdxFlowExpression', value: '/* niet-draaien: twee bestanden */' };
    const vraag: Knoop = { type: 'mdxJsxFlowElement', name: 'Voorspel', children: [] };
    const uit = groepeer([
      titel,
      kop(2, 'Je eigen module'),
      naam('rekenen.py'),
      code('def dubbel(x):\n    return x * 2'),
      naam('main.py'),
      merk,
      code('import rekenen'),
      vraag,
      // Eén bestand is geen rij.
      naam('los.py'),
      code('print(1)'),
      kop(2, 'Opdracht 1: Print'),
      alinea('Print.'),
    ]);
    const [, rij, ...rest] = uit[1].children[0].children;
    expect(rij.name).toBe('LesVoorbeeld');
    expect(rij.attributes.map((a: { name: string }) => a.name)).toEqual(['bestanden']);
    expect(rij.children.map((n: Knoop) => n.name)).toEqual(['div', 'div', 'Voorspel']);
    expect(rij.children[1].children.map((n: Knoop) => n.type)).toEqual([
      'paragraph',
      'mdxFlowExpression',
      'code',
    ]);
    expect(rest.map((n: Knoop) => n.type)).toEqual(['paragraph', 'code']);
  });

  it("twee programma's om te vergelijken (Code A en Code B) staan ook naast elkaar", () => {
    // Opdracht 5.7.f van de Lego-auto: met of zonder sleep. Onder elkaar was
    // dat scherm 240 pixels te lang, en vergelijken doe je naast elkaar.
    const label = (tekst: string): Knoop => ({
      type: 'paragraph',
      children: [{ type: 'strong', children: [{ type: 'text', value: tekst }] }],
    });
    const uit = groepeer([
      titel,
      kop(2, 'Opdracht 1: Met of zonder'),
      label('Code A:'),
      { type: 'code', value: 'print(1)' },
      label('Code B:'),
      { type: 'code', value: 'print(2)' },
      alinea('Wat is het verschil?'),
      kop(2, 'Opdracht 2: Nog een'),
      alinea('Print.'),
    ]) as Knoop[];
    const [, rij, na] = uit[1].children?.[0].children ?? [];
    expect(rij.attributes?.map((a) => [a.name, a.value])).toEqual([['bestanden', 'ja']]);
    expect(rij.children).toHaveLength(2);
    expect(na.type).toBe('paragraph');
    // Met een regel die niet in de halve breedte past (de importregel van
    // leaphymicropython, 57 tekens) staat de code iets kleiner.
    const lang = groepeer([
      titel,
      kop(2, 'Opdracht 1: Met of zonder'),
      label('Code A:'),
      { type: 'code', value: `from ${'x'.repeat(52)}\nprint(1)` },
      label('Code B:'),
      { type: 'code', value: 'print(2)' },
      kop(2, 'Opdracht 2: Nog een'),
      alinea('Print.'),
    ]) as Knoop[];
    expect(lang[1].children?.[0].children?.[1].attributes?.[0].value).toBe('smal');
  });

  it('de uitleg vóór de eerste ## krijgt stappen van zijn ###-koppen', () => {
    // In de Python-cursus begint een les zonder `##`, en staat de
    // voorspelvraag onder `### Voorspel`. Zonder stappen stond alles tot de
    // eerste `##` op één scherm, tot zeshonderd pixels te lang.
    const uit = groepeer([
      titel,
      alinea('Een variabele is een naam.'),
      alinea('Kijk maar.'),
      kop(3, 'Voorspel', 'voorspel'),
      alinea('Wat print dit?'),
      kop(2, 'Een tweede onderwerp', 'tweede'),
      alinea('Meer uitleg.'),
      kop(2, 'Opdracht 1: Print', 'opdracht'),
      alinea('Print.'),
    ]);
    const [uitleg] = tabs(uit);
    expect(uitleg).toMatchObject({ id: 'uitleg', label: 'Uitleg' });
    const stappen = uit[1].children[0].children[0];
    expect(stappen.name).toBe('LesStappen');
    expect(
      stappen.children.map((n: Knoop) => [
        n.attributes?.find((a) => a.name === 'id')?.value,
        n.attributes?.find((a) => a.name === 'label')?.value,
      ]),
    ).toEqual([
      ['uitleg-basis', 'De basis'],
      ['voorspel', 'Voorspel'],
      ['tweede', 'Een tweede onderwerp'],
    ]);
    // Ook als er na die uitleg meteen iets anders komt: dan is het een
    // tabblad Uitleg met zijn eigen stappen.
    const los = groepeer([
      titel,
      alinea('Een variabele is een naam.'),
      alinea('Kijk maar.'),
      kop(3, 'Voorspel', 'voorspel'),
      alinea('Wat print dit?'),
      kop(2, 'Opdracht 1: Print', 'opdracht'),
      alinea('Print.'),
    ]);
    expect(los[1].children[0].children[0].name).toBe('LesStappen');
    expect(los[1].children[0].children[0].children).toHaveLength(2);
  });

  describe('het doel van een opdracht staat in het oefenveld', () => {
    // De verwachte uitvoer of het doelplaatje stond boven het veld en kostte
    // tot driehonderd pixels: van de 222 opdrachtschermen in de Python-cursus
    // pasten er 113. In de uitvoerkolom van het veld staat het naast wat de
    // leerling zelf krijgt.
    const code = (value: string): Knoop => ({ type: 'code', value });
    const veld: Knoop = { type: 'mdxJsxFlowElement', name: 'CodeExercise', children: [] };
    const merk: Knoop = { type: 'mdxFlowExpression', value: '/* niet-draaien: valt om */' };
    const plaatje: Knoop = {
      type: 'paragraph',
      children: [{ type: 'image' }],
    };
    const opdracht = (...inhoud: Knoop[]) =>
      groepeer([
        titel,
        kop(2, 'Uitleg van print'),
        alinea('Uitleg.'),
        kop(2, 'Opdracht 1: Print'),
        ...inhoud,
      ])[1].children[1].children.slice(1);
    const namen = (nodes: Knoop[]) => nodes.map((n) => n.name ?? n.type);

    it('de verwachte uitvoer gaat met zijn kop het veld in', () => {
      const uit = opdracht(alinea('Print 1.'), alinea('Verwachte uitvoer:'), code('1'), merk, veld);
      // Het commentaar zet niets neer en blijft staan.
      expect(namen(uit)).toEqual(['paragraph', 'mdxFlowExpression', 'LesVeld']);
      const [doel, hetVeld] = uit[2].children;
      expect(doel.name).toBe('LesDoel');
      expect(namen(doel.children)).toEqual(['paragraph', 'code']);
      expect(hetVeld).toBe(veld);
    });

    it('ook met een toevoeging achter de kop, en met een alinea tussen doel en veld', () => {
      const uit = opdracht(
        alinea('Verwachte uitvoer als de loop bij 3 begint:'),
        code('3'),
        alinea('Bij jou kan het anders zijn.'),
        veld,
      );
      expect(namen(uit)).toEqual(['paragraph', 'LesVeld']);
      expect(uit[0].children[0].value).toBe('Bij jou kan het anders zijn.');
    });

    it('een punt in de kop, of de kop van een spel met een geheim getal, telt ook', () => {
      // "(bij cijfer = 4.0)" had een punt, en de kop werd niet herkend.
      for (const kopje of ['Verwachte uitvoer (bij cijfer = 4.0):', 'Een spel kan zo gaan:']) {
        expect(namen(opdracht(alinea(kopje), code('1'), veld)), kopje).toEqual(['LesVeld']);
      }
      // Een zin die toevallig op een dubbele punt eindigt, is geen kop.
      expect(namen(opdracht(alinea('Print dit:'), code('1'), veld))).toEqual([
        'paragraph',
        'code',
        'CodeExercise',
      ]);
    });

    it('twee gevallen, elk met hun verwachte uitvoer, gaan allebei het veld in', () => {
      const uit = opdracht(
        alinea('Print een bericht.'),
        alinea('Verwachte uitvoer (bij cijfer = 6.5):'),
        code('Geslaagd'),
        alinea('Verwachte uitvoer (bij cijfer = 4.0):'),
        code('Helaas'),
        veld,
      );
      expect(namen(uit)).toEqual(['paragraph', 'LesVeld']);
      expect(
        uit[1].children[0].children.map((n: Knoop) => n.value ?? n.children?.[0].value),
      ).toEqual([
        'Verwachte uitvoer (bij cijfer = 6.5):',
        'Geslaagd',
        'Verwachte uitvoer (bij cijfer = 4.0):',
        'Helaas',
      ]);
    });

    it('een kop over twee regels telt, en een uitvoer met een plaatje gaan samen', () => {
      // In de bron loopt een lange kop door op de volgende regel; een `.` in
      // een patroon past niet op een regeleinde, en de kop werd gemist.
      const lang = alinea('Verwachte uitvoer als je house en cat typt,\nen daarna tree:');
      const uit = opdracht(alinea('Teken.'), lang, code('Goed.'), plaatje, veld);
      expect(namen(uit)).toEqual(['paragraph', 'LesVeld']);
      expect(namen(uit[1].children[0].children)).toEqual([
        'paragraph',
        'code',
        'paragraph',
        'paragraph',
      ]);
    });

    it('een doelplaatje krijgt een regel erboven die zegt wat het is', () => {
      const uit = opdracht(alinea('Teken een huis.'), plaatje, veld);
      expect(namen(uit)).toEqual(['paragraph', 'LesVeld']);
      const doel = uit[1].children[0];
      expect(doel.children[0].children[0].value).toBe('Zo moet het worden:');
      expect(doel.children[1]).toBe(plaatje);
    });

    it('een blok zonder kop, of een doel dat verder weg staat, blijft waar het is', () => {
      // Gegevens om te kopiëren zijn geen uitvoer.
      expect(namen(opdracht(alinea('Kopieer dit:'), code('x = 1'), veld))).toEqual([
        'paragraph',
        'code',
        'CodeExercise',
      ]);
      // Een plaatje met drie alinea's voor het veld is geen doel: het staat
      // dan met die tekst naast elkaar (plaatjesNaastTekst), het veld eronder.
      expect(
        namen(opdracht(plaatje, alinea('Een.'), alinea('Twee.'), alinea('Drie.'), veld)),
      ).toEqual(['LesVoorbeeld', 'CodeExercise']);
    });

    it('een veld zonder doel blijft een direct kind van het paneel', () => {
      expect(namen(opdracht(alinea('Print 1.'), veld))).toEqual(['paragraph', 'CodeExercise']);
    });
  });

  describe('een plaatje met zijn tekst, en een reeks plaatjes', () => {
    const plaatje: Knoop = {
      type: 'paragraph',
      children: [{ type: 'image', value: 'schema.png' }],
    };
    const figuur = (n: number): Knoop => ({
      type: 'mdxJsxFlowElement',
      name: 'figure',
      children: [alinea(`Stap ${n}`)],
    });
    // De pagina importeert het deel; alleen dan telt het element als tekst.
    const importeert: Knoop = {
      type: 'mdxjsEsm',
      value: "import ShieldRijen from '@site/docs/onderdelen/_delen/shield/rijen.md'",
    };
    const inhoud = (...nodes: Knoop[]): Knoop[] =>
      groepeer([
        importeert,
        titel,
        kop(2, 'Aansluiten'),
        ...nodes,
        kop(2, 'Code'),
        alinea('Typ dit.'),
      ])
        .find((n: Knoop) => n.name === 'LesTabs')
        .children[0].children.slice(1);

    it('een plaatje met de tekst die erop volgt staat naast elkaar', () => {
      // Het aansluitschema van robotica met de pinnen eronder: onder elkaar
      // tot tweehonderd pixels te lang, en het schema was dan zo klein dat de
      // legenda niet te lezen was.
      const deel: Knoop = { type: 'mdxJsxFlowElement', name: 'ShieldRijen', children: [] };
      const lijst = punten('het onderdeel', 'de naam van de pin', 'wat het doet');
      const [blok, ...rest] = inhoud(plaatje, deel, alinea('Pinnen:'), lijst);
      expect(rest).toEqual([]);
      expect(blok.name).toBe('LesVoorbeeld');
      expect(blok.attributes?.map((a) => a.name)).toEqual(['beeld']);
      expect(blok.children?.[0]).toBe(plaatje);
      expect(blok.children?.[1].children?.map((n: Knoop) => n.name ?? n.type)).toEqual([
        'ShieldRijen',
        'paragraph',
        'list',
      ]);
    });

    it('code met de lijst die hem uitlegt staat naast elkaar', () => {
      // De naslag van robotica: een fragment code en per onderdeel een punt.
      // Onder elkaar was zo'n stap tot tachtig pixels te lang.
      const code: Knoop = { type: 'code', value: "oled.text('Hallo', 0, 0)\noled.show()" };
      const lijst = punten('het onderdeel', 'de naam van de pin', 'wat het doet');
      const [blok, na] = inhoud(code, lijst, alinea('Daarna.'));
      expect(blok.name).toBe('LesVoorbeeld');
      expect(blok.attributes?.map((a) => a.name)).toEqual(['toelichting']);
      expect(blok.children?.[0]).toBe(code);
      expect(blok.children?.[1].children).toEqual([lijst]);
      expect(na.type).toBe('paragraph');
      // Code met een alinea erna blijft onder elkaar: dat is lopende uitleg.
      expect(inhoud(code, alinea('Dit doet het.')).map((n) => n.type)).toEqual([
        'code',
        'paragraph',
      ]);
    });

    it('een alinea of een waarschuwing tussen de code en de lijst gaat mee', () => {
      // De joystick en de potmeter van robotica: code, een zin over wat je
      // ziet, en dan de punten. De DC-motor: code, een zin, een waarschuwing.
      const code: Knoop = { type: 'code', value: 'x = ADC("A2")\nprint(x.read_u16())' };
      const lijst = punten('het onderdeel', 'de naam van de pin', 'wat het doet');
      const let_op: Knoop = { type: 'containerDirective', name: 'caution', children: [] };
      const [metLijst, na] = inhoud(
        code,
        alinea('Je ziet twee getallen.'),
        lijst,
        alinea('Daarna.'),
      );
      expect(metLijst.children?.[1].children?.map((n) => n.type)).toEqual(['paragraph', 'list']);
      expect(na.type).toBe('paragraph');
      const [metBlok] = inhoud(code, alinea('Een snelheid van 0 tot 255.'), let_op, alinea('x'));
      expect(metBlok.children?.[1].children?.map((n) => n.type)).toEqual([
        'paragraph',
        'containerDirective',
      ]);
      // Een zin die het volgende aankondigt, hoort bij wat erna komt.
      const [los] = inhoud(code, alinea('Met een lijst gaat het zo:'), code);
      expect(los.type).toBe('code');
    });

    it('code met een regel die naast de toelichting niet past, blijft over de volle breedte', () => {
      // Naast zijn toelichting heeft code hooguit zeventig procent van de
      // breedte: 66 tekens op 1280 pixels. In inline-onclick van de web-cursus
      // viel van een regel van 88 tekens de helft weg.
      const lijst = punten('het onderdeel', 'de naam van de pin', 'wat het doet');
      const smal: Knoop = { type: 'code', value: `${'x'.repeat(66)}\nkort` };
      const breed: Knoop = { type: 'code', value: `${'x'.repeat(67)}\nkort` };
      expect(inhoud(smal, lijst)[0].name).toBe('LesVoorbeeld');
      expect(inhoud(breed, lijst).map((n) => n.type)).toEqual(['code', 'list']);
      // Ook met een vraag eronder.
      const vraag: Knoop = {
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'Vraag:' }] },
          { type: 'text', value: ' wat print dit?' },
        ],
      };
      expect(inhoud(breed, vraag).map((n) => n.type)).toEqual(['code', 'paragraph']);
    });

    it('naast elkaar alleen als het scherm er korter van wordt', () => {
      // events in de web-cursus: één regel code van 66 tekens met een lijst,
      // een alinea en een info-blok. Naast elkaar kreeg de toelichting dertig
      // procent van de breedte, en was het scherm 214 pixels langer dan onder
      // elkaar.
      const code: Knoop = {
        type: 'code',
        value: "document.getElementById('knop').addEventListener('click', zegHoi);",
      };
      const lang = 'De functie geef je mee zonder haakjes: je noemt zijn naam. '.repeat(3);
      const blok: Knoop = { type: 'containerDirective', name: 'info', children: [alinea(lang)] };
      const uit = inhoud(code, punten(lang, lang, lang), alinea(lang), blok);
      expect(uit.map((n) => n.type)).toEqual(['code', 'list', 'paragraph', 'containerDirective']);
      // Dezelfde regel met drie korte punten ernaast wordt wel korter.
      expect(inhoud(code, punten('het element', 'het event', 'de functie'))[0].name).toBe(
        'LesVoorbeeld',
      );
    });

    it('een tabel staat alleen naast code van zes regels of meer', () => {
      // Grotere tekst bij het OLED-scherm (robotica): elf regels code, "Hoe
      // groter de letters …:" en een tabel pasten naast elkaar wel op het
      // scherm. Maar in les 9e van python stonden twee regels code naast een
      // tabel van vier kolommen: elke cel brak, en het scherm werd 40 pixels
      // te lang.
      const tabel: Knoop = { type: 'table', children: [] };
      const regels = (n: number): Knoop => ({
        type: 'code',
        value: Array.from({ length: n }, (_, i) => `regel_${i} = ${i}`).join('\n'),
      });
      const [naast] = inhoud(regels(11), alinea('Hoe groter, hoe minder:'), tabel, alinea('x'));
      expect(naast.children?.[1].children?.map((n) => n.type)).toEqual(['paragraph', 'table']);
      expect(inhoud(regels(2), alinea('Kies een naam:'), tabel).map((n) => n.type)).toEqual([
        'code',
        'paragraph',
        'table',
      ]);
    });

    it('een programma dat in zijn eigen vak schuift, heeft zijn uitleg ernaast', () => {
      // Welke kant op? bij de joystick: 23 regels en een alinea eronder
      // waren samen 73 pixels te lang.
      const lang: Knoop = {
        type: 'code',
        value: Array.from({ length: 20 }, (_, i) => `regel_${i} = ${i}`).join('\n'),
      };
      const [naast, na] = inhoud(lang, alinea('Tussen 15000 en 50000 is het midden.'), {
        type: 'code',
        value: 'print(1)',
      });
      expect(naast.attributes?.map((a) => a.name)).toEqual(['toelichting']);
      expect(naast.children?.[1].children).toHaveLength(1);
      expect(na.type).toBe('code');
    });

    it('code met een vraag eronder staat naast de vraag, met tip en oplossing', () => {
      // "Code beter begrijpen" van de Lego-auto: acht opdrachten met een
      // programma, "**Vraag:** …" en twee uitklapblokken. Onder elkaar was
      // zo'n scherm tot 240 pixels te lang.
      const code: Knoop = { type: 'code', value: 'teller = 0\nwhile teller < 3:\n    teller += 1' };
      const vraag: Knoop = {
        type: 'paragraph',
        children: [
          { type: 'strong', children: [{ type: 'text', value: 'Vraag:' }] },
          { type: 'text', value: ' hoe vaak draait de lus?' },
        ],
      };
      const blok = (): Knoop => ({ type: 'mdxJsxFlowElement', name: 'details', children: [] });
      const [tip, oplossing] = [blok(), blok()];
      const [naast, na] = inhoud(code, vraag, tip, oplossing, alinea('Daarna.'));
      expect(naast.name).toBe('LesVoorbeeld');
      // "vraag": het codevak is hier zo hoog als het scherm toelaat, want de
      // vraag gaat over het hele programma (in 5.7.b viel print("Klaar!")
      // onder de rand van het vak).
      expect(naast.attributes?.map((a) => [a.name, a.value])).toEqual([['toelichting', 'vraag']]);
      expect(naast.children?.[0]).toBe(code);
      expect(naast.children?.[1].children).toEqual([vraag, tip, oplossing]);
      expect(na.type).toBe('paragraph');
    });

    it('een programma in blokken telt als een plaatje, en als code bij een vraag', () => {
      const blokken: Knoop = { type: 'mdxJsxFlowElement', name: 'Blokken', children: [] };
      const vraag: Knoop = { type: 'mdxJsxFlowElement', name: 'Voorspel', children: [] };
      const commentaar: Knoop = { type: 'mdxFlowExpression', value: '/* stijl-uitzondering: x */' };
      // Met de vraag eronder: het programma links, de vraag rechts.
      const [metVraag] = inhoud(blokken, vraag);
      expect(metVraag.attributes?.map((a) => a.name)).toEqual(['vraag']);
      // Met tekst eronder, ook als er commentaar tussen staat.
      const [metTekst] = inhoud(
        blokken,
        commentaar,
        alinea('Is het getal kleiner, dan ligt er een bal.'),
      );
      expect(metTekst.attributes?.map((a) => [a.name, a.value])).toEqual([['beeld', 'ja']]);
      // Alleen commentaar erna is geen tekst.
      expect(inhoud(blokken, commentaar).map((n) => n.name ?? n.type)).toEqual([
        'Blokken',
        'mdxFlowExpression',
      ]);
    });

    it('een onderdeel om mee te oefenen staat breed, met zijn vragen en het antwoord ernaast', () => {
      const simulator: Knoop = { type: 'mdxJsxFlowElement', name: 'SensorSimulator', children: [] };
      const lijst = punten('het onderdeel', 'de naam van de pin', 'wat het doet');
      const antwoord: Knoop = { type: 'mdxJsxFlowElement', name: 'details', children: [] };
      const [blok, ...rest] = inhoud(simulator, lijst, antwoord);
      expect(rest).toEqual([]);
      expect(blok.attributes?.map((a) => [a.name, a.value])).toEqual([['beeld', 'breed']]);
      expect(blok.children?.[1].children).toEqual([lijst, antwoord]);
      // Bij een plaatje hoort een uitklapblok er niet bij.
      expect(inhoud(plaatje, alinea('Tekst.'), antwoord).map((n) => n.name)).toEqual([
        'LesVoorbeeld',
        'details',
      ]);
    });

    it('een ander onderdeel na het plaatje hoort er niet bij', () => {
      // Een oefenveld of een 3D-model is geen tekst bij het plaatje: eerst
      // kwam een veld zonder eigenschappen zo in de rechterkolom terecht.
      const model: Knoop = { type: 'mdxJsxFlowElement', name: 'ObjViewer', children: [] };
      expect(
        inhoud(plaatje, model, alinea('Draai het model.')).map((n) => n.name ?? n.type),
      ).toEqual(['paragraph', 'ObjViewer', 'paragraph']);
    });

    it('een plaatje waar geen tekst op volgt, blijft staan', () => {
      const code: Knoop = { type: 'code', value: 'x = 1' };
      expect(inhoud(alinea('Zo ziet het eruit:'), plaatje, code).map((n) => n.type)).toEqual([
        'paragraph',
        'paragraph',
        'code',
      ]);
      // Twee plaatjes achter elkaar: alleen het tweede heeft tekst.
      expect(inhoud(plaatje, plaatje, alinea('Tekst.')).map((n) => n.name ?? n.type)).toEqual([
        'paragraph',
        'LesVoorbeeld',
      ]);
    });

    it('een kort codeblok na de tekst staat mee naast het plaatje', () => {
      // Easybloqs bij de Golfbot: het knopje RST, "In het scherm verschijnt:"
      // en één regel uitvoer. Onder het plaatje was dat scherm 34 pixels te
      // lang, en stond de uitvoer los van zijn zin.
      const plaatje: Knoop = {
        type: 'paragraph',
        children: [{ type: 'image' }],
      };
      const kort: Knoop = { type: 'code', value: 'Hallo, ik ben de Golfbot' };
      const [naast, na] = inhoud(plaatje, alinea('In het scherm verschijnt:'), kort, alinea('x'));
      expect(naast.attributes?.map((a) => a.name)).toEqual(['beeld']);
      expect(naast.children?.[1].children?.map((n) => n.type)).toEqual([
        'paragraph',
        'code',
        'paragraph',
      ]);
      expect(na).toBeUndefined();
      // Een programma hoort er niet bij, en code direct onder een plaatje ook niet.
      const lang: Knoop = { type: 'code', value: 'a\nb\nc\nd\ne\nf\ng' };
      expect(inhoud(plaatje, alinea('Het programma:'), lang)[1].type).toBe('code');
      expect(inhoud(plaatje, kort).map((n) => n.type)).toEqual(['paragraph', 'code']);
    });

    it('drie of meer plaatjes met een onderschrift achter elkaar zijn een reeks', () => {
      // De toren van de Golfbot: tien bouwstappen onder elkaar, 3375 pixels
      // te lang. In een reeks staat er één tegelijk.
      const [tekst, reeks, na] = inhoud(
        alinea('Bouw de toren.'),
        figuur(1),
        figuur(2),
        figuur(3),
        alinea('Klaar.'),
      );
      expect(tekst.type).toBe('paragraph');
      expect(reeks.name).toBe('LesReeks');
      expect(reeks.children).toHaveLength(3);
      expect(na.type).toBe('paragraph');
      // Twee plaatjes zijn geen reeks.
      expect(inhoud(figuur(1), figuur(2)).map((n) => n.name)).toEqual(['figure', 'figure']);
    });

    it("drie foto's in één alinea zijn ook een reeks, elk op een eigen plek", () => {
      // De IR-sensor in zijn adapter (Lego-auto): drie foto's van 600 pixels
      // onder elkaar, dat scherm was 151 pixels te lang.
      const foto = (n: number): Knoop => ({
        type: 'mdxJsxTextElement',
        name: 'img',
        attributes: [{ name: 'alt', value: `stap ${n}` }],
        children: [],
      });
      const wit: Knoop = { type: 'text', value: '\n' };
      const [reeks, na] = inhoud(
        { type: 'paragraph', children: [foto(1), wit, foto(2), wit, foto(3)] },
        alinea('Klik het geheel aan je frame.'),
      );
      expect(reeks.name).toBe('LesReeks');
      expect(reeks.children?.map((p) => p.children?.[0].attributes?.[0].value)).toEqual([
        'stap 1',
        'stap 2',
        'stap 3',
      ]);
      expect(na.type).toBe('paragraph');
      // Ook als elke foto op een eigen regel staat (MDX maakt er dan losse
      // elementen van, geen alinea).
      const los = (n: number): Knoop => ({ ...foto(n), type: 'mdxJsxFlowElement' });
      expect(inhoud(los(1), los(2), los(3), alinea('x'))[0].name).toBe('LesReeks');
      // Twee foto's naast elkaar blijven een alinea.
      const [twee] = inhoud({ type: 'paragraph', children: [foto(1), wit, foto(2)] }, alinea('x'));
      expect(twee.name).not.toBe('LesReeks');
    });
  });

  it('een codeblok met hetzelfde oefenveld eronder staat er maar één keer', () => {
    // Het voorbeeld en het veld om het te proberen stonden onder elkaar met
    // dezelfde code: 350 pixels dubbel. MDX eet inspringing op, dus alleen de
    // tekst van de regels telt.
    const code = (value: string): Knoop => ({ type: 'code', value });
    const veld = (start: string): Knoop => ({
      type: 'mdxJsxFlowElement',
      name: 'CodeExercise',
      children: [{ type: 'mdxFlowExpression', value: `\`${start}\`` }],
    });
    const merk: Knoop = { type: 'mdxFlowExpression', value: '/* niet-draaien: valt om */' };
    const uit = groepeer([
      titel,
      kop(2, 'Een loop'),
      code('for i in range(3):\n    print(i)'),
      merk,
      veld('for i in range(3):\n  print(i)'),
      alinea('Verander 3 in 5.'),
      code('print(1)'),
      veld('print(2)'),
      kop(2, 'Opdracht 1: Print'),
      alinea('Print.'),
    ]);
    expect(uit[1].children[0].children.map((n: Knoop) => n.name ?? n.type)).toEqual([
      'heading',
      'CodeExercise',
      'mdxFlowExpression',
      'paragraph',
      'code',
      'CodeExercise',
    ]);
    // Met één alinea tussen het blok en het veld komt het veld op de plek
    // van het blok, en de alinea eronder.
    const metAlinea = groepeer([
      titel,
      kop(2, 'Een loop'),
      alinea('Zo tel je tot drie:'),
      code('for i in range(3):\n    print(i)'),
      alinea('Druk op Uitvoeren en kijk wat er gebeurt.'),
      veld('for i in range(3):\n    print(i)'),
      kop(2, 'Opdracht 1: Print'),
      alinea('Print.'),
    ]);
    const blokken = metAlinea[1].children[0].children;
    expect(blokken.map((n: Knoop) => n.name ?? n.type)).toEqual([
      'heading',
      'paragraph',
      'CodeExercise',
      'paragraph',
    ]);
    expect(blokken[3].children[0].value).toBe('Druk op Uitvoeren en kijk wat er gebeurt.');
  });

  describe('de volgorde en het icoon van de opdrachten', () => {
    const veld = (start: string): Knoop => ({
      type: 'mdxJsxFlowElement',
      name: 'CodeExercise',
      children: [{ type: 'mdxFlowExpression', value: `\`${start}\`` }],
    });
    const vormen = (uit: Knoop[]) =>
      (uit[1].children ?? []).map((t: Knoop) => [
        t.attributes?.find((a) => a.name === 'label')?.value,
        t.attributes?.find((a) => a.name === 'werkvorm')?.value,
      ]);

    it('Er gaat iets mis staat na de opdrachten, ook als de bron hem ervoor heeft', () => {
      // In 44 lessen van de Python-cursus stond hij tussen de uitleg en de
      // eerste opdracht: de knop Volgende bracht een leerling langs fouten
      // die hij nog niet had kunnen maken.
      const uit = groepeer([
        titel,
        kop(2, 'De for-loop'),
        alinea('Uitleg.'),
        kop(2, 'Er gaat iets mis'),
        alinea('Een fout.'),
        kop(2, 'Opdracht 1: Tel'),
        alinea('Tel.'),
        kop(2, 'Opdracht 2: Meer'),
        alinea('Meer.'),
        kop(2, 'En nu?'),
        alinea('Door.'),
      ]);
      expect(vormen(uit).map(([label]) => label)).toEqual([
        'De for-loop',
        'Opdracht 1',
        'Opdracht 2',
        'Er gaat iets mis',
        'En nu?',
      ]);
      // Staat hij er al na, dan verandert er niets.
      const erna = groepeer([
        titel,
        kop(2, 'Uitleg van print'),
        alinea('Uitleg.'),
        kop(2, 'Opdracht: print'),
        alinea('Print.'),
        kop(2, 'Er gaat iets mis'),
        alinea('Een fout.'),
      ]);
      expect(vormen(erna).map(([label]) => label)).toEqual([
        'Uitleg van print',
        'Opdracht',
        'Er gaat iets mis',
      ]);
    });

    it('een afsluiter na de opdrachten blijft het laatste tabblad', () => {
      // Maak het je eigen en Verder bouwen zijn zelf maken. Eerst schoof Er
      // gaat iets mis ook daar voorbij: in 13 projectstappen van de
      // Python-cursus eindigde de stap op de fouten in plaats van op de
      // afsluiter met de link naar de volgende stap.
      const labels = (uit: Knoop[]) => vormen(uit).map(([label]) => label);
      expect(
        labels(
          groepeer([
            titel,
            kop(2, 'Een raam'),
            alinea('Uitleg.'),
            kop(2, 'Opdracht: een raam'),
            alinea('Teken.'),
            kop(2, 'Er gaat iets mis'),
            alinea('Een fout.'),
            kop(2, 'Maak het je eigen'),
            alinea('Ideeën.'),
          ]),
        ),
      ).toEqual(['Een raam', 'Opdracht', 'Er gaat iets mis', 'Maak het je eigen']);
    });

    it('een inleiding met een leerdoel is samen het eerste tabblad', () => {
      // Een les van de Lego-auto begint met waar hij over gaat en met Wat je
      // nu gaat toevoegen. Bij Stap 1 erbij was dat scherm tot 270 pixels te
      // lang; samen zijn ze het scherm waar de les mee opent.
      const uit = groepeer([
        titel,
        alinea('Je robot volgt de lijn. Nu stopt hij voor een obstakel.'),
        kop(2, 'Wat je nu gaat toevoegen'),
        alinea('De TOF in je robotscript.'),
        kop(2, 'Stap 1: De TOF erbij'),
        alinea('Typ dit.'),
        kop(2, 'Test het'),
        alinea('Klik op Run.'),
      ]);
      expect(vormen(uit).map(([label]) => label)).toEqual(['Uitleg', 'Stap 1', 'Test het']);
      const uitleg = uit[1].children[0].children;
      expect(uitleg.map((n: Knoop) => n.name ?? n.type)).toEqual(['paragraph', 'LesLeerdoel']);
      // Zonder inleiding staat het leerdoel bij het tabblad erna, zoals bij web.
      const zonder = groepeer([
        titel,
        kop(2, 'Wat je nu gaat toevoegen'),
        alinea('De TOF in je robotscript.'),
        kop(2, 'Stap 1: De TOF erbij'),
        alinea('Typ dit.'),
        kop(2, 'Test het'),
        alinea('Klik op Run.'),
      ]);
      expect(vormen(zonder).map(([label]) => label)).toEqual(['Stap 1', 'Test het']);
    });

    it('fouten bij het werk dat ervoor staat, blijven daar', () => {
      // Een les van de Lego-auto: stappen, testen, en dan wat er bij dat
      // testen mis kan gaan. De opdrachten komen daarna. Die fouten horen
      // bij de stappen, niet bij de opdrachten.
      const uit = groepeer([
        titel,
        kop(2, 'Wat je nu gaat toevoegen'),
        alinea('Een loop.'),
        kop(2, 'Stap 1: De loop erbij'),
        alinea('Typ dit.'),
        kop(2, 'Test het'),
        alinea('Klik op Run.'),
        kop(2, 'Er gaat iets mis'),
        alinea('Een fout.'),
        kop(2, 'Opdracht 2.3.a: Sneller'),
        alinea('Maak het sneller.'),
      ]);
      // "Wat je nu gaat toevoegen" is het leerdoel: het staat bij Stap 1.
      expect(vormen(uit)).toEqual([
        ['Stap 1', 'stap'],
        ['Test het', 'onderzoeken'],
        ['Er gaat iets mis', 'fouten'],
        ['Opdracht 2.3.a', 'aanpassen'],
      ]);
    });

    it('een opdracht met startcode is aanpassen, een opdracht met een leeg veld zelf maken', () => {
      // De docentenhandleiding zegt bij Aanpassen "op code die er al staat".
      // Naar de kop kreeg elke opdracht behalve de laatste dat icoon, en van
      // de 132 lesopdrachten van de Python-cursus begint de helft leeg.
      const uit = groepeer([
        titel,
        kop(2, 'Uitleg van print'),
        alinea('Uitleg.'),
        kop(2, 'Opdracht 1: Leeg'),
        veld('# Schrijf hier je code'),
        kop(2, 'Opdracht 2: Met code'),
        veld('naam = "Sam"\n# maak het af'),
        kop(2, 'Opdracht 3: Zonder veld'),
        alinea('In je eigen editor.'),
      ]);
      expect(vormen(uit)).toEqual([
        ['Uitleg van print', 'uitleg'],
        ['Opdracht 1', 'maken'],
        ['Opdracht 2', 'aanpassen'],
        // Zonder veld beslist de kop: de laatste van de rij is zelf maken.
        ['Opdracht 3', 'maken'],
      ]);
    });
  });

  describe('korte uitleg en voorkennis', () => {
    const blok: Knoop = { type: 'containerDirective', name: 'info', children: [alinea('Uit 6a.')] };

    it('een blok met voorkennis en twee zinnen opent het eerste tabblad', () => {
      // Zes projectstappen hadden een tabblad Uitleg met alleen "Deze stap
      // gebruikt …" en twee zinnen: een scherm met een knop Volgende.
      const uit = groepeer([
        titel,
        blok,
        alinea('Na één gok stopt je programma.'),
        kop(2, 'Opdracht: blijf vragen'),
        alinea('Vraag door.'),
        kop(2, 'Er gaat iets mis'),
        alinea('Een fout.'),
      ]);
      expect(tabs(uit).map((t) => t.label)).toEqual(['Opdracht', 'Er gaat iets mis']);
      expect(uit[1].children[0].children.slice(0, 2).map((n: Knoop) => n.type)).toEqual([
        'containerDirective',
        'paragraph',
      ]);
      // Blijft er anders maar één tabblad over, dan houdt de uitleg het zijne.
      const twee = groepeer([
        titel,
        blok,
        alinea('Na één gok stopt je programma.'),
        kop(2, 'Opdracht: blijf vragen'),
        alinea('Vraag door.'),
      ]);
      expect(tabs(twee).map((t) => t.label)).toEqual(['Uitleg', 'Opdracht']);
    });

    it('alleen een info-blok: een tip om op te warmen is zelf uitleg', () => {
      // Les 6a opent met een zin en een tip Opwarmen van twee lange punten.
      // Bij het eerste tabblad erbij was dat scherm 104 pixels te lang.
      const tip: Knoop = {
        type: 'containerDirective',
        name: 'tip',
        children: [alinea('Speel eerst lightbot.')],
      };
      const uit = groepeer([
        titel,
        alinea('Met een for-loop herhaalt Python het werk.'),
        tip,
        kop(2, 'Opdracht 6a.1: Vijf keer'),
        alinea('Print vijf keer hoera.'),
        kop(2, 'Er gaat iets mis'),
        alinea('Een fout.'),
      ]);
      expect(tabs(uit).map((t) => t.label)).toEqual([
        'Uitleg',
        'Opdracht 6a.1',
        'Er gaat iets mis',
      ]);
      // De vorm van de build (een admonition) telt net zo.
      const alsJsx = (type: string): Knoop => ({
        type: 'mdxJsxFlowElement',
        name: 'admonition',
        attributes: [{ name: 'type', value: type }],
        children: [alinea('Uit 6a.')],
      });
      const metJsx = (type: string) =>
        tabs(
          groepeer([
            titel,
            alsJsx(type),
            kop(2, 'Opdracht 1: Een'),
            alinea('Doe iets.'),
            kop(2, 'Er gaat iets mis'),
            alinea('Een fout.'),
          ]),
        ).map((t) => t.label);
      expect(metJsx('info')).toEqual(['Opdracht 1', 'Er gaat iets mis']);
      expect(metJsx('tip')).toEqual(['Uitleg', 'Opdracht 1', 'Er gaat iets mis']);
    });

    it('een eerste stap met alleen voorkennis heet Vooraf, niet De basis', () => {
      const uit = groepeer([
        titel,
        blok,
        alinea('Dit project tekent een staafdiagram.'),
        kop(3, 'Het diagram', 'diagram'),
        alinea('Vijf staven.'),
        { type: 'code', value: 'x = 1' },
        kop(2, 'Opdracht: een staaf'),
        alinea('Teken.'),
        kop(2, 'Er gaat iets mis'),
        alinea('Een fout.'),
      ]);
      const stappen = uit[1].children[0].children[0].children;
      expect(
        stappen.map((n: Knoop) => n.attributes?.find((a) => a.name === 'label')?.value),
      ).toEqual(['Vooraf', 'Het diagram']);
    });

    it('een les die met de voorspelvraag opent, heeft Voorspel als eerste stap', () => {
      // In 33 lessen heet de stap met de vraag Voorspel; in acht opende de les
      // ermee en heette hij De basis.
      const vraag: Knoop = { type: 'mdxJsxFlowElement', name: 'Voorspel', children: [] };
      const uit = groepeer([
        titel,
        alinea('Soms wil je een ronde overslaan. Wat doet dit?'),
        { type: 'code', value: 'for i in range(6):\n    print(i)' },
        vraag,
        kop(2, 'Wat continue doet', 'continue'),
        alinea('Hij slaat de rest van de ronde over.'),
        kop(2, 'Opdracht 1: Sla over'),
        alinea('Sla over.'),
      ]);
      const stappen = uit[1].children[0].children[0].children;
      expect(
        stappen.map((n: Knoop) => n.attributes?.find((a) => a.name === 'label')?.value),
      ).toEqual(['Voorspel', 'Wat continue doet']);
    });

    it('één losse zin vóór de eerste ### van de uitleg opent die stap', () => {
      // Anders was "De basis" een scherm met één zin.
      const uit = groepeer([
        titel,
        alinea('In 15j schreef je objecten weg.'),
        kop(3, 'Voorspel', 'voorspel'),
        alinea('Wat krijg je terug?'),
        kop(3, 'Van dictionary naar object', 'terug'),
        alinea('Zo.'),
        kop(2, 'Opdracht 1: Lees in'),
        alinea('Lees.'),
      ]);
      const stappen = uit[1].children[0].children[0].children;
      expect(
        stappen.map((n: Knoop) => n.attributes?.find((a) => a.name === 'label')?.value),
      ).toEqual(['Voorspel', 'Van dictionary naar object']);
      expect(stappen[0].children[0].children[0].value).toBe('In 15j schreef je objecten weg.');
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

  it('slaat een deel over dat een pagina importeert', async () => {
    // Bij robotica staat wat twee pagina's delen in docs/onderdelen/_delen/.
    // Docusaurus bouwt zo'n deel met dezelfde stappen als een les: met eigen
    // tabbladen stond er een rij tabbladen midden in de pagina die het
    // deel gebruikt.
    const metPad = async (path: string) =>
      String(
        await compile(
          { value: LES, path, data: { frontMatter: {} } },
          { remarkPlugins: [metIds, remarkLesTabs] },
        ),
      );
    expect(await metPad('/site/docs/onderdelen/_delen/dc-motor/pinnen.md')).not.toMatch(
      /LesTabs?\b/,
    );
    expect(await metPad('/site/docs/onderdelen/_pinnen.mdx')).not.toMatch(/LesTabs?\b/);
    expect(await metPad('/site/docs/onderdelen/dc_motor.mdx')).toMatch(/LesTabs/);
    expect(isDeel('C:\\site\\docs\\_delen\\pinnen.md')).toBe(true);
    expect(isDeel(undefined)).toBe(false);
  });

  it('een deel met ###-koppen krijgt stappen, geen tabbladen', async () => {
    // MicroPython kiezen bij robotica is een deel met zes koppen: in het
    // tabblad van de pagina die het importeert was het duizend pixels te
    // lang, en de stap van de pagina ziet de koppen in een deel niet.
    const deel = '### Downloaden\n\na\n\n### Op het bord zetten\n\nb\n';
    const js = String(
      await compile(
        { value: deel, path: '/site/docs/_delen/installatie/micropython.md', data: {} },
        { remarkPlugins: [metIds, remarkLesTabs] },
      ),
    );
    expect(js).toMatch(/LesStappen/);
    expect(js).not.toMatch(/LesTabs\b/);
    expect(js).toContain('id: "downloaden"');
    // Met tekst vóór de eerste kop is dat de eerste stap.
    const metBasis = deelMetStappen(
      [alinea('Eerst dit.'), alinea('En dit.'), kop(3, 'Stap een', 'een'), alinea('a')],
      'bord',
    );
    const stappen = metBasis?.find((n: Knoop) => n.name === 'LesStappen')?.children ?? [];
    expect(stappen.map((n: Knoop) => n.attributes?.find((a) => a.name === 'id')?.value)).toEqual([
      'deel-bord-basis',
      'een',
    ]);
    // Een deel zonder koppen, of met één, blijft zoals het is.
    expect(deelMetStappen([alinea('Alleen tekst.')], 'x')).toBeNull();
    expect(deelMetStappen([kop(3, 'Een kop', 'k'), alinea('a')], 'x')).toBeNull();
  });

  it('een deel zonder stappen zet toch naast elkaar wat naast elkaar past', async () => {
    // Het bord op de installatiepagina van robotica: een plaatje met twee
    // alinea's eronder. Een deel sloeg de regels over en was 72 pixels te lang.
    const deel = '![Het bord met zijn pinnen](/img/bord.png)\n\nDe namen gebruik je later.\n';
    const js = String(
      await compile(
        { value: deel, path: '/site/docs/_delen/installatie/bord.md', data: {} },
        { remarkPlugins: [remarkLesTabs] },
      ),
    );
    expect(js).toMatch(/LesVoorbeeld/);
    expect(js).not.toMatch(/LesStappen|LesTabs\b/);
  });

  it('een les zonder tabbladen krijgt een marker, en daarmee dezelfde kop en breedte', async () => {
    // De korte pagina's van de Lego-auto (alleen een deel, of één sectie)
    // hielden het kruimelpad, de grote titel en de smalle kolom: de pagina
    // versprong van les tot les, en twee waren daardoor te lang.
    const js = await bouw('# Les\n\nAlleen een alinea.\n');
    expect(js).toMatch(/"data-les-zonder-tabs": ""/);
    expect(js).not.toMatch(/LesTabs\b/);
    // Een les met tabbladen heeft hem niet, en een pagina die zich afmeldt ook niet.
    expect(await bouw('# Les\n\n## Een\n\na\n\n## Twee\n\nb\n')).not.toMatch(/zonder-tabs/);
    const css = readFileSync(
      fileURLToPath(new URL('./components/LesTabs/styles.module.css', import.meta.url)),
      'utf8',
    );
    expect(css).not.toMatch(/html:has\(\[data-les-tabs\]\)/);
    expect(css).toMatch(
      /html:has\(\[data-les-tabs\], \[data-les-zonder-tabs\]\) \.theme-doc-breadcrumbs/,
    );
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
    // Het vak van een codeblok (`pre`) is nooit de ouder van een oefenveld:
    // een programma dat hoger is dan het scherm, mag daarin schuiven.
    const fout = regels
      .filter(({ sel }) => /^\.(wortel|paneel|stappen)\b/.test(sel) && !/ pre$/.test(sel))
      .filter(({ body }) => verboden.test(body))
      .map(({ sel }) => sel);
    expect(fout).toEqual([]);
    expect(regels.some(({ sel }) => sel === '.paneel[hidden]')).toBe(true);
  });

  it('de knop Volgende breekt af als de naam van de volgende stap lang is', () => {
    // Fullstack, Er gaat iets mis: een stap heet daar naar de foutmelding
    // ("network web declared as external, but could not be found"). Infima
    // houdt een knop op één regel, en op een telefoon schoven acht schermen
    // daardoor zijwaarts. Of de pagina past, meet scripts/meet-les-tabs.mjs.
    const knop = regels.find(({ sel }) => sel === '.verder :global(.button)');
    expect(knop?.body).toMatch(/white-space:\s*normal/);
    expect(knop?.body).toMatch(/max-width:\s*100%/);
  });

  it('een codeblok dat in zijn vak schuift, laat zien dat er meer staat', () => {
    // In 15k stond het nieuwe deel van het programma onder de rand van het
    // vak, en niets liet zien dat je kon schuiven. De schaduw staat vast aan
    // de rand (scroll), het vlak dat hem afdekt schuift met de code mee
    // (local): aan het begin en het eind van de code is er dus geen schaduw.
    const vak = regels.find(({ sel, body }) => / pre$/.test(sel) && /max-height/.test(body));
    expect(vak?.body).toMatch(/overflow-y:\s*auto/);
    expect(vak?.body).toMatch(/background-attachment:\s*local,\s*local,\s*scroll,\s*scroll/);
    expect(vak?.body).toMatch(/var\(--prism-background-color\)/);
    // Niet in een uitklapblok: een oplossing lees je in zijn geheel.
    expect(vak?.sel).toMatch(/:not\(details \*\)/);
  });

  it('haalt de inhoudsopgave weg en geeft de les die breedte', () => {
    expect(css).toMatch(
      /html:has\(\[data-les-tabs\][^)]*\) \.col--3:has\(> \.theme-doc-toc-desktop\)/,
    );
    expect(css).toMatch(/html:has\(\[data-les-tabs\][^)]*\) \.theme-doc-toc-mobile/);
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

  it('een scheidingslijn tussen twee secties staat niet in een tabblad', () => {
    // `---` tussen de opdrachten stond in een tabblad onderaan het paneel,
    // boven de knop Volgende: veertig pixels voor een lijn die niets scheidt.
    expect(
      regels.some(({ sel, body }) => sel === '.paneel > hr' && /display:\s*none/.test(body)),
    ).toBe(true);
  });

  it('een voorbeeld en zijn uitvoer staan alleen op een breed scherm naast elkaar', () => {
    const voor = css.slice(0, css.indexOf('.voorbeeld {'));
    expect(voor.slice(voor.lastIndexOf('@media'))).toMatch(/^@media \(min-width: 997px\)/);
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
      /html:has\(\[data-les-tabs\][^)]*\) \.theme-doc-breadcrumbs\)?\s*\{\s*display:\s*none/,
    );
    expect(breed).toMatch(/\.theme-doc-markdown > header > h1\)?\s*\{[^}]*--ifm-h1-font-size/);
    const buiten = css.slice(0, css.indexOf('@media'));
    expect(buiten).not.toMatch(/theme-doc-breadcrumbs/);
  });
});

describe('een controlevraag is een eigen stap', () => {
  // Fullstack sluit een uitleg af met <Voorspel soort="Controlevraag">, na de
  // code, de test en het succesmoment. De vraag is zelf driehonderd pixels
  // hoog: van de 253 schermen die niet pasten, pasten er 67 zonder de vraag.
  const vraag = (soort = 'Controlevraag'): Knoop => ({
    type: 'mdxJsxFlowElement',
    name: 'Voorspel',
    attributes: soort ? [{ name: 'soort', value: soort }] : [],
    children: [],
  });
  const blok: Knoop = { type: 'code', value: 'x = 1' };
  const tip: Knoop = { type: 'containerDirective', name: 'tip', children: [alinea('Tip.')] };
  const stappenIn = (uit: Knoop[], tab: string) =>
    (
      uit
        .find((n) => n.name === 'LesTabs')
        ?.children?.find((t) => t.attributes?.some((a) => a.name === 'id' && a.value === tab))
        ?.children?.find((n) => n.name === 'LesStappen')?.children ?? []
    )
      .filter((n) => n.name === 'LesStap')
      .map((n) => Object.fromEntries((n.attributes ?? []).map((a) => [a.name, a.value])));

  it('na uitleg met code krijgt de vraag een eigen stap, met de tip die erbij hoort', () => {
    const uit = groepeer([
      titel,
      kop(2, 'Redirect'),
      alinea('Uitleg.'),
      blok,
      alinea('Nog een zin.'),
      vraag(),
      tip,
      kop(2, 'Waarom 303'),
      alinea('Daarom.'),
      kop(2, 'Opdrachten'),
      alinea('Doe.'),
    ]);
    const stappen = stappenIn(uit, 'uitleg').length
      ? stappenIn(uit, 'uitleg')
      : stappenIn(uit, 'redirect');
    const namen = stappen.map((st) => st.label);
    expect(namen).toContain('Controlevraag');
    const id = stappen.find((st) => st.label === 'Controlevraag')?.id;
    expect(id).toBe('redirect-controlevraag');
    // De tip na de vraag staat in dezelfde stap, de code niet.
    const tekst = JSON.stringify(uit);
    const stap = tekst.slice(tekst.indexOf('"redirect-controlevraag"'));
    expect(stap.indexOf('Tip.')).toBeGreaterThan(-1);
    expect(stap.indexOf('x = 1')).toBe(-1);
  });

  it('niet als er alleen een alinea voor staat, en niet als er nog uitleg na komt', () => {
    const kort = groepeer([
      titel,
      kop(2, 'Testen'),
      alinea('Kijk.'),
      vraag(),
      kop(2, 'Opdrachten'),
      alinea('Doe.'),
    ]);
    expect(JSON.stringify(kort)).not.toContain('controlevraag');
    const metVervolg = groepeer([
      titel,
      kop(2, 'Testen'),
      blok,
      vraag(),
      alinea('En verder.'),
      blok,
      kop(2, 'Opdrachten'),
      alinea('Doe.'),
    ]);
    expect(JSON.stringify(metVervolg)).not.toContain('controlevraag');
  });

  it('een voorspelvraag zonder soort blijft waar hij staat', () => {
    const uit = groepeer([
      titel,
      kop(2, 'Testen'),
      punten('a', 'b'),
      vraag(''),
      kop(2, 'Opdrachten'),
      alinea('Doe.'),
    ]);
    expect(JSON.stringify(uit)).not.toContain('controlevraag');
  });

  it('een vraag die al onder een eigen kop staat, krijgt er geen tweede', () => {
    const uit = groepeer([
      titel,
      kop(2, 'Aansluiten'),
      blok,
      kop(3, 'Controlevraag'),
      vraag(),
      kop(2, 'Code'),
      alinea('Doe.'),
    ]);
    expect(JSON.stringify(uit).match(/"Controlevraag"/g)?.length).toBeGreaterThan(0);
    expect(JSON.stringify(uit)).not.toContain('aansluiten-controlevraag');
  });

  it('twee vragen in één tabblad heten Controlevraag en Controlevraag 2', () => {
    const uit = groepeer([
      titel,
      kop(2, 'Het formulier'),
      kop(3, 'Een veld'),
      blok,
      alinea('Zo.'),
      vraag(),
      kop(3, 'Een endpoint'),
      blok,
      alinea('Zo.'),
      vraag(),
      kop(2, 'Opdrachten'),
      alinea('Doe.'),
    ]);
    const stappen = stappenIn(uit, 'het-formulier');
    expect(stappen.map((st) => st.label)).toEqual([
      'Een veld',
      'Controlevraag',
      'Een endpoint',
      'Controlevraag 2',
    ]);
    // Elk een eigen adres.
    expect(new Set(stappen.map((st) => st.id)).size).toBe(4);
  });
});

describe('de bestanden waar een voorspelvraag over gaat, staan samen naast de vraag', () => {
  // Fullstack, Opdracht 1 van Formulieren: het formulier, het endpoint en de
  // vraag "wat zie je?". Alleen het laatste bestand stond naast de vraag; het
  // eerste stond erboven, en het scherm was 150 pixels te lang.
  const label = (pad: string): Knoop => ({
    type: 'mdxJsxFlowElement',
    name: 'Bestand',
    attributes: [{ name: 'pad', value: pad }],
    children: [],
  });
  const commentaar: Knoop = { type: 'mdxFlowExpression', value: '/* niet-compileren: fragment */' };
  const blok = (value: string): Knoop => ({ type: 'code', value });
  const vraag: Knoop = {
    type: 'mdxJsxFlowElement',
    name: 'Voorspel',
    attributes: [],
    children: [],
  };
  const voorbeeld = (uit: Knoop[]) => {
    const zoek = (nodes: Knoop[]): Knoop | undefined => {
      for (const n of nodes) {
        if (n.name === 'LesVoorbeeld') return n;
        const dieper = zoek(n.children ?? []);
        if (dieper) return dieper;
      }
      return undefined;
    };
    return zoek(uit);
  };

  it('twee bestanden met hun label gaan samen links', () => {
    const uit = groepeer([
      titel,
      kop(2, 'Opdracht'),
      alinea('Kijk.'),
      label('form.html'),
      blok('<form>'),
      label('main.py'),
      commentaar,
      blok('def f(): ...'),
      vraag,
      kop(2, 'Verder'),
      alinea('x'),
    ]);
    const vb = voorbeeld(uit);
    const [links, rechts] = vb?.children ?? [];
    expect(rechts?.name).toBe('Voorspel');
    expect(links?.name).toBe('div');
    expect(links?.children?.map((n) => n.name ?? n.type)).toEqual([
      'Bestand',
      'code',
      'Bestand',
      'mdxFlowExpression',
      'code',
    ]);
    // De alinea ervoor blijft boven de rij.
    expect(JSON.stringify(links)).not.toContain('Kijk.');
  });

  it('twee korte bestanden zonder vraag staan naast elkaar', () => {
    // Fullstack, Links tussen pagina's: home.html en about.html onder elkaar
    // waren samen 109 pixels te lang. Naast elkaar zie je ook dat ze naar
    // elkaar linken.
    const uit = groepeer([
      titel,
      kop(2, 'Voorbeeld'),
      alinea("Twee pagina's."),
      label('home.html'),
      blok('<a href="/about">Over mij</a>'),
      label('about.html'),
      blok('<a href="/">Terug</a>'),
      kop(2, 'Verder'),
      alinea('x'),
    ]);
    const vb = voorbeeld(uit);
    expect(vb?.attributes?.map((a) => [a.name, a.value])).toEqual([['bestanden', 'ja']]);
    expect(vb?.children?.map((n) => n.children?.map((m) => m.name ?? m.type))).toEqual([
      ['Bestand', 'code'],
      ['Bestand', 'code'],
    ]);
  });

  it('niet met een regel die op de halve breedte niet past, en niet met drie', () => {
    const breed = 'async def bericht_plaatsen(naam: str = Form(), bericht: str = Form()):';
    const metBreed = groepeer([
      titel,
      kop(2, 'Voorbeeld'),
      alinea('Twee bestanden.'),
      label('form.html'),
      blok('<form>'),
      label('main.py'),
      blok(breed),
      kop(2, 'Verder'),
      alinea('x'),
    ]);
    expect(voorbeeld(metBreed)).toBeUndefined();
    const drie = groepeer([
      titel,
      kop(2, 'Voorbeeld'),
      alinea('Drie bestanden.'),
      label('a.html'),
      blok('<p>a</p>'),
      label('b.html'),
      blok('<p>b</p>'),
      label('c.html'),
      blok('<p>c</p>'),
      kop(2, 'Verder'),
      alinea('x'),
    ]);
    expect(voorbeeld(drie)).toBeUndefined();
  });

  it('een codeblok zonder label ervoor hoort bij iets anders', () => {
    const uit = groepeer([
      titel,
      kop(2, 'Opdracht'),
      blok('eerste = 1'),
      alinea('En dan:'),
      blok('tweede = 2'),
      vraag,
      kop(2, 'Verder'),
      alinea('x'),
    ]);
    const [links] = voorbeeld(uit)?.children ?? [];
    expect(links?.type).toBe('code');
    expect(links?.value).toBe('tweede = 2');
  });
});

describe('uitleg met veel stappen blijft losse tabbladen als de rij past', () => {
  // De htmx-recepten van fullstack: zes recepten, elk met twee of drie
  // stappen. Met Er gaat iets mis en Opdrachten zijn dat negen tabbladen, en
  // vanaf negen gingen de recepten samen in één tabblad Uitleg: zestien
  // stappen op drie regels. Met korte namen past de rij tabbladen op één
  // regel, en dan blijven het tabbladen.
  const recept = (naam: string): Knoop[] => [
    kop(2, naam),
    alinea('a'),
    alinea('b'),
    kop(3, `${naam} een`),
    alinea('c'),
    kop(3, `${naam} twee`),
    alinea('d'),
  ];
  const les = (namen: string[]) =>
    groepeer([
      titel,
      alinea('Inleiding.'),
      alinea('Nog een zin.'),
      ...namen.flatMap(recept),
      kop(2, 'Er gaat iets mis'),
      alinea('x'),
      kop(2, 'Opdrachten'),
      alinea('y'),
    ]);

  it('negen tabbladen met korte namen blijven tabbladen', () => {
    const uit = les(['Formulier', 'Verversen', 'Vanzelf', 'Verwijderen', 'Zoeken', 'Doel']);
    expect(tabs(uit).map((t) => t.label)).toEqual([
      'Uitleg',
      'Formulier',
      'Verversen',
      'Vanzelf',
      'Verwijderen',
      'Zoeken',
      'Doel',
      'Er gaat iets mis',
      'Opdrachten',
    ]);
  });

  it('met lange namen past de rij niet, en gaat de uitleg samen', () => {
    const uit = les([
      'Een formulier versturen zonder herladen',
      'Een stuk van de pagina verversen',
      'Vanzelf verversen om de tien seconden',
      'Een bericht verwijderen met een knop',
      'Zoeken terwijl je typt in het veld',
      'Waar het antwoord in de pagina komt',
    ]);
    expect(tabs(uit).map((t) => t.label)).toEqual(['Uitleg', 'Er gaat iets mis', 'Opdrachten']);
  });
});
