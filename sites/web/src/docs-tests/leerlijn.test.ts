import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import {
  INTRODUCEERT,
  VOORUITWIJZINGEN,
  alleConcepten,
  htmlConcepten,
  noemtConcept,
} from '../data/leerlijn';

// Een les mag alleen concepten gebruiken die eerder in de leerlijn zijn
// uitgelegd. De eenheden-les gebruikte klassen (les 9) en geneste selectors
// (les 14) terwijl hij zelf op plek 4 staat; wie dat leest denkt dat hij iets
// gemist heeft, en zoekt terug in lessen waar het niet staat.
//
// De volgorde komt uit sidebars.ts (de handmatige volgorde is de waarheid,
// niet het bestandsnummer), de concepten uit src/data/leerlijn.ts.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

const VOLGORDE: string[] = [
  ...(sidebars.htmlCssSidebar as string[]),
  ...(sidebars.jsSidebar as string[]),
];

const PLEK = new Map(VOLGORDE.map((les, i) => [les, i]));

const AANGEKONDIGD = new Set(VOORUITWIJZINGEN.map((v) => `${v.les}|${v.concept}`));

/** Waar een concept wordt uitgelegd. */
const INTRO_VAN = new Map<string, string>();
for (const [les, ids] of Object.entries(INTRODUCEERT)) {
  for (const id of ids) INTRO_VAN.set(id, les);
}

/**
 * Alle code op een lespagina: de codeblokken én de startcode die in
 * MDX-exports staat. Lopende tekst telt niet mee — daar mag je een concept
 * noemen en vooruitwijzen, zoals tekst-opmaken-css met `rem` doet.
 */
function codeUit(bron: string): string {
  const stukken: string[] = [];
  for (const m of bron.matchAll(/```(?:html|css|js|javascript)\n([\s\S]*?)```/g)) {
    stukken.push(m[1]);
  }
  for (const m of bron.matchAll(/export const \w+ = `([\s\S]*?)`;/g)) {
    stukken.push(m[1]);
  }
  return stukken.join('\n');
}

function lesTekst(les: string): string {
  return readFileSync(`${DOCS}/${les}.mdx`, 'utf8');
}

/** De concept-ids die in deze code voorkomen. */
function conceptenIn(code: string): Set<string> {
  const gevonden = new Set<string>();
  for (const techniek of alleConcepten()) {
    const los = new RegExp(techniek.pattern.source, techniek.pattern.flags.replace('g', ''));
    if (los.test(code)) gevonden.add(techniek.id);
  }
  for (const id of htmlConcepten()) {
    const tag = id.slice('html-'.length);
    if (new RegExp(`<${tag}[\\s>/]`).test(code)) gevonden.add(id);
  }
  return gevonden;
}

describe('de leerlijn is compleet', () => {
  it('elke les uit de sidebar staat in de tabel', () => {
    const ontbreekt = VOLGORDE.filter((les) => !(les in INTRODUCEERT));

    expect(ontbreekt).toEqual([]);
  });

  it('de tabel noemt geen lessen die niet in de sidebar staan', () => {
    const zwevend = Object.keys(INTRODUCEERT).filter((les) => !PLEK.has(les));

    expect(zwevend).toEqual([]);
  });

  it('elk herkenbaar concept heeft een les die het uitlegt', () => {
    // Een nieuw concept in curriculum.ts dwingt zo een keuze af: waar hoort
    // het thuis in de leerlijn? Zonder deze test glipt het er stil in.
    const ids = [...alleConcepten().map((t) => t.id), ...htmlConcepten()];
    const wees = [...new Set(ids)].filter((id) => !INTRO_VAN.has(id)).sort();

    expect(wees).toEqual([]);
  });

  it('geen concept wordt door twee lessen geclaimd', () => {
    const geteld = new Map<string, string[]>();
    for (const [les, ids] of Object.entries(INTRODUCEERT)) {
      for (const id of ids) geteld.set(id, [...(geteld.get(id) ?? []), les]);
    }
    const dubbel = [...geteld].filter(([, lessen]) => lessen.length > 1);

    expect(dubbel).toEqual([]);
  });
});

describe('geen les loopt op de leerlijn vooruit', () => {
  it('gebruikt geen concept dat pas later wordt uitgelegd', () => {
    const tevroeg: string[] = [];

    for (const les of VOLGORDE) {
      const hier = PLEK.get(les) ?? 0;
      for (const id of conceptenIn(codeUit(lesTekst(les)))) {
        const bron = INTRO_VAN.get(id);
        if (!bron) continue;
        const daar = PLEK.get(bron) ?? 0;
        if (daar > hier && !AANGEKONDIGD.has(`${les}|${id}`)) {
          tevroeg.push(`${les} (${hier}) gebruikt ${id}, uitgelegd in ${bron} (${daar})`);
        }
      }
    }

    expect(tevroeg.sort()).toEqual([]);
  });

  it('elke les noemt de concepten die hij zelf introduceert', () => {
    // Andersom: staat een concept in de tabel bij een les die het nergens
    // noemt, dan klopt de tabel niet of mist de les zijn eigen voorbeeld.
    // Hier telt de hele pagina mee, niet alleen de code: `<h6>` en
    // `nth-child` worden in lopende tekst uitgelegd zonder eigen voorbeeld.
    const ongenoemd: string[] = [];

    for (const [les, ids] of Object.entries(INTRODUCEERT)) {
      if (ids.length === 0) continue;
      const pagina = lesTekst(les);
      for (const id of ids) {
        if (!noemtConcept(pagina, id)) {
          ongenoemd.push(`${les} introduceert ${id} maar noemt het niet`);
        }
      }
    }

    expect(ongenoemd.sort()).toEqual([]);
  });
});

describe('een vooruitwijzing wijst de leerling verder', () => {
  it('elke uitzondering heeft een reden', () => {
    const zonder = VOORUITWIJZINGEN.filter((v) => v.reden.trim().length < 10).map(
      (v) => `${v.les} — ${v.concept}`,
    );

    expect(zonder).toEqual([]);
  });

  it('elke uitzondering staat op een bestaande les en een bestaand concept', () => {
    const onbekend = VOORUITWIJZINGEN.filter(
      (v) => !PLEK.has(v.les) || !INTRO_VAN.has(v.concept),
    ).map((v) => `${v.les} — ${v.concept}`);

    expect(onbekend).toEqual([]);
  });

  it('de les linkt naar de les die het concept uitlegt', () => {
    // Dit is het verschil tussen vooruitlopen en de leerling laten zitten:
    // "dat leer je in Eenheden" met een link erbij kost één zin en scheelt
    // een zoektocht door lessen waar het niet staat.
    const zonderLink: string[] = [];

    for (const { les, concept } of VOORUITWIJZINGEN) {
      const doel = INTRO_VAN.get(concept);
      if (!doel) continue;
      if (!lesTekst(les).includes(`/docs/${doel}`)) {
        zonderLink.push(`${les} loopt vooruit op ${concept} zonder link naar ${doel}`);
      }
    }

    expect(zonderLink.sort()).toEqual([]);
  });

  it('noemt geen uitzondering die niet meer nodig is', () => {
    // Een uitzondering die blijft staan nadat de les is opgeschoond, verbergt
    // de volgende echte overtreding op diezelfde regel.
    const overbodig: string[] = [];

    for (const { les, concept } of VOORUITWIJZINGEN) {
      if (!conceptenIn(codeUit(lesTekst(les))).has(concept)) {
        overbodig.push(`${les} heeft ${concept} niet meer nodig`);
      }
    }

    expect(overbodig.sort()).toEqual([]);
  });
});

describe('de sidebar is de enige navigatie', () => {
  it('geen les schrijft zijn eigen vorige/volgende-links', () => {
    // Op 24 pagina's stond onderaan `[← Vorige] | [Volgende →]`, gevuld
    // volgens de oude bestandsnummering. Ze spraken de sidebar tegen zodra er
    // iets verschoof, en Docusaurus zet er zelf al een prev/next onder.
    const eigen = VOLGORDE.filter((les) => /\[←|→\]/.test(lesTekst(les)));

    expect(eigen).toEqual([]);
  });
});
