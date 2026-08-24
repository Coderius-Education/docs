import type { RepoState } from './gitEngine';

// Tab-aanvulling, zoals in een echte terminal. Dat is niet alleen gemak: een
// leerling die `git stauts` typt krijgt een foutmelding die over zijn typefout
// gaat in plaats van over git, en dat leidt af van waar de les over gaat.

/** De subcommando's die de simulator begrijpt. */
export const SUBCOMMANDOS = ['add', 'commit', 'init', 'log', 'status'];

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

function vul(invoer: string, laatsteWoord: string, opties: string[]): Aanvulling {
  const passend = opties.filter((o) => o.startsWith(laatsteWoord)).sort();
  if (passend.length === 0) return { aangevuld: null, kandidaten: [] };

  const stam = invoer.slice(0, invoer.length - laatsteWoord.length);
  // Bij één kandidaat een spatie erachter, zodat je meteen door kunt typen —
  // net als bash.
  const aanvulling = passend.length === 1 ? `${passend[0]} ` : gemeenschappelijkBegin(passend);
  return { aangevuld: stam + aanvulling, kandidaten: passend };
}

export function vulAan(invoer: string, state: RepoState): Aanvulling {
  // Alleen achteraan aanvullen; midden in een regel doet een shell dat ook
  // anders en dat hebben we hier niet nodig.
  const woorden = invoer.split(' ');
  const laatste = woorden[woorden.length - 1];

  // Nog niets getypt, of bezig aan het eerste woord: 'git' zelf.
  if (woorden.length === 1) {
    if (laatste === '') return { aangevuld: 'git ', kandidaten: [] };
    return vul(invoer, laatste, ['git']);
  }

  if (woorden[0] !== 'git') return { aangevuld: null, kandidaten: [] };

  // Tweede woord: het subcommando.
  if (woorden.length === 2) return vul(invoer, laatste, SUBCOMMANDOS);

  // Daarna: bestandsnamen, maar alleen waar dat betekenis heeft.
  if (woorden[1] === 'add') {
    const bestanden = Object.keys(state.workingDir)
      .filter((f) => !state.ignored.includes(f))
      .concat('.');
    return vul(invoer, laatste, bestanden);
  }

  if (woorden[1] === 'commit' && laatste === '') {
    return { aangevuld: `${invoer}-m `, kandidaten: [] };
  }

  return { aangevuld: null, kandidaten: [] };
}
