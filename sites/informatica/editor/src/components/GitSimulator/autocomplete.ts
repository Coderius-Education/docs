import { type RepoState, genegeerd, indexVan, woordenVan } from './gitEngine';

// Tab-aanvulling, zoals in een echte terminal. Dat is niet alleen gemak: een
// leerling die `git stauts` typt krijgt een foutmelding die over zijn typefout
// gaat in plaats van over git, en dat leidt af van waar de les over gaat.

/** De subcommando's die de simulator begrijpt. */
export const SUBCOMMANDOS = ['add', 'commit', 'init', 'log', 'restore', 'rm', 'status'];

export type Aanvulling = {
  /** De nieuwe inhoud van het invoerveld, of null als er niets aan te vullen valt. */
  aangevuld: string | null;
  /** Alle passende opties; bij meer dan één toont de terminal ze. */
  kandidaten: string[];
};

/** Het langste stuk dat alle kandidaten gemeen hebben. */
function gemeenschappelijkBegin(opties: string[]): string {
  if (opties.length === 0) return '';
  let kort = opties[0];
  for (const optie of opties.slice(1)) {
    let i = 0;
    while (i < kort.length && i < optie.length && kort[i] === optie[i]) i++;
    kort = kort.slice(0, i);
  }
  return kort;
}

/**
 * Een naam zoals je hem typt: met een spatie erin tussen aanhalingstekens.
 * `heel` is false als er nog meer kan volgen: dan blijft het aanhalingsteken
 * open, zoals bash dat ook doet.
 */
function getypt(naam: string, heel: boolean): string {
  if (!naam.includes(' ')) return naam;
  return heel ? `"${naam}"` : `"${naam}`;
}

/** Waar het laatste woord begint, met een aanhalingsteken dat nog open staat. */
function beginLaatsteWoord(invoer: string): number {
  let begin = 0;
  let quote: string | null = null;
  for (let i = 0; i < invoer.length; i++) {
    const ch = invoer[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ' ') begin = i + 1;
  }
  return begin;
}

function vul(invoer: string, opties: string[]): Aanvulling {
  const begin = beginLaatsteWoord(invoer);
  const laatsteWoord = woordenVan(invoer.slice(begin)).woorden[0] ?? '';
  const passend = opties.filter((o) => o.startsWith(laatsteWoord)).sort();
  if (passend.length === 0) return { aangevuld: null, kandidaten: [] };

  const stam = invoer.slice(0, begin);
  // Bij één kandidaat een spatie erachter, zodat je meteen door kunt typen —
  // net als bash.
  const aanvulling =
    passend.length === 1
      ? `${getypt(passend[0], true)} `
      : getypt(gemeenschappelijkBegin(passend), false);
  return { aangevuld: stam + aanvulling, kandidaten: passend };
}

export function vulAan(invoer: string, state: RepoState): Aanvulling {
  // Alleen achteraan aanvullen; midden in een regel doet een shell dat ook
  // anders en dat hebben we hier niet nodig. Een naam tussen
  // aanhalingstekens telt als één woord.
  const { woorden } = woordenVan(invoer);
  const nieuwWoord = beginLaatsteWoord(invoer) === invoer.length;
  const aantal = woorden.length + (nieuwWoord ? 1 : 0);

  // Nog niets getypt, of bezig aan het eerste woord: 'git' zelf.
  if (aantal <= 1) {
    if (invoer === '') return { aangevuld: 'git ', kandidaten: [] };
    return vul(invoer, ['git']);
  }

  if (woorden[0] !== 'git') return { aangevuld: null, kandidaten: [] };

  // Tweede woord: het subcommando.
  if (aantal === 2) return vul(invoer, SUBCOMMANDOS);

  // Daarna: bestandsnamen, maar alleen waar dat betekenis heeft. Bij add wat
  // in de werkmap staat of git volgt (ook een bestand dat weg is), bij rm en
  // restore wat git volgt.
  const gevolgdeNamen = Object.keys(indexVan(state));
  if (woorden[1] === 'add') {
    const bestanden = [...new Set([...Object.keys(state.workingDir), ...gevolgdeNamen])]
      .filter((f) => !genegeerd(state, f))
      .concat('.');
    return vul(invoer, bestanden);
  }
  if (woorden[1] === 'rm' || woorden[1] === 'restore') return vul(invoer, gevolgdeNamen);

  if (woorden[1] === 'commit' && aantal === 3 && nieuwWoord) {
    return { aangevuld: `${invoer}-m `, kandidaten: [] };
  }

  return { aangevuld: null, kandidaten: [] };
}
