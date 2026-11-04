// Leerdoelen per cursus en de beoordeling volgens Bloom (zie README.md).
//
// Elke cursus met leerdoelen heeft één bestand, `src/leerdoelen.json`: per
// concept één rij, met per niveau de moeilijkheid (basis, gevorderd, expert)
// naast elkaar. De niveaus zijn voor elke cursus dezelfde vier (niveaus.json),
// Niveau 1 tot en met Niveau 4; een cursus noemt welke hij heeft. Dat bestand is de
// enige bron voor de pagina /leerdoelen, de nakijker en coderius.nl.
// `bloom.json` hiernaast is voor alle cursussen gelijk: de denkvaardigheden,
// de cijfertabel, het sjabloon en de vuistregels uit het beoordelingsblad.
//
// Hier staat de logica die de plugin, de pagina's en de nakijker delen, zodat
// ze hetzelfde lezen en hetzelfde rekenen.

const BLOOM = require('./bloom.json');
const NIVEAUS = require('./niveaus.json');

/** De moeilijkheden die een concept kan hebben, van makkelijk naar moeilijk. */
const CONCEPT_MOEILIJKHEDEN = ['basis', 'gevorderd', 'expert'];

/** Velden van een rij die geen niveau zijn. */
const VELDEN = ['id', 'onderwerp', 'concept', 'bloom', 'groep', 'toelichting'];

const BLOOM_IDS = BLOOM.denkvaardigheden.map((d) => d.id);

function isLijstMetIds(waarde) {
  return (
    Array.isArray(waarde) &&
    waarde.every((x) => x && typeof x.id === 'string' && x.id !== '' && typeof x.label === 'string')
  );
}

/**
 * Lees en controleer een leerdoelen.json. Geeft de rijen terug met de
 * niveaus bij elkaar in `niveau`, of gooit een fout met alle problemen.
 *
 * @param {unknown} data de inhoud van het bestand
 * @param {string} [bron] de naam van het bestand, voor de foutmelding
 */
function leesLeerdoelen(data, bron = 'leerdoelen.json') {
  const fouten = [];
  if (!data || typeof data !== 'object') throw new Error(`${bron}: geen object`);
  const { niveaus, onderwerpen, concepten } = data;
  for (const sleutel of Object.keys(data)) {
    if (!['niveaus', 'onderwerpen', 'concepten'].includes(sleutel)) {
      fouten.push(`onbekend veld '${sleutel}' (wel: niveaus, onderwerpen, concepten)`);
    }
  }
  const bekend = NIVEAUS.map((n) => n.id);
  if (!Array.isArray(niveaus) || niveaus.length === 0) {
    fouten.push(`niveaus moet een lijst zijn met minstens één niveau (${bekend.join(', ')})`);
  } else {
    for (const n of niveaus) {
      if (!bekend.includes(n)) {
        fouten.push(`onbekend niveau ${JSON.stringify(n)} (wel: ${bekend.join(', ')})`);
      }
    }
    const opVolgorde = [...niveaus].sort((a, b) => bekend.indexOf(a) - bekend.indexOf(b));
    if (niveaus.join() !== opVolgorde.join()) {
      fouten.push(`zet de niveaus op volgorde: ${opVolgorde.join(', ')}`);
    }
  }
  if (!isLijstMetIds(onderwerpen) || onderwerpen.length === 0) {
    fouten.push(
      'onderwerpen moet een lijst zijn van { "id", "label" }, met minstens één onderwerp',
    );
  }
  if (!Array.isArray(concepten) || concepten.length === 0) {
    fouten.push('concepten moet een lijst zijn met minstens één concept');
  }
  if (fouten.length) throw new Error(`${bron}:\n- ${fouten.join('\n- ')}`);

  const niveauIds = niveaus;
  const onderwerpIds = new Set(onderwerpen.map((o) => o.id));
  for (const [soort, lijst] of [
    ['niveau', niveauIds],
    ['onderwerp', onderwerpen.map((o) => o.id)],
  ]) {
    const dubbel = lijst.filter((id, i) => lijst.indexOf(id) !== i);
    for (const id of new Set(dubbel)) fouten.push(`${soort} '${id}' staat er twee keer`);
  }

  const gezien = new Set();
  const rijen = concepten.map((rij, i) => {
    const waar = rij && typeof rij.id === 'string' ? `concept '${rij.id}'` : `concept ${i + 1}`;
    if (!rij || typeof rij !== 'object') {
      fouten.push(`${waar}: geen object`);
      return null;
    }
    if (typeof rij.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(rij.id)) {
      fouten.push(`${waar}: id moet kleine letters, cijfers en streepjes zijn`);
    } else if (gezien.has(rij.id)) {
      fouten.push(`${waar} staat er twee keer`);
    }
    gezien.add(rij.id);
    if (!onderwerpIds.has(rij.onderwerp)) {
      fouten.push(`${waar}: onbekend onderwerp '${rij.onderwerp}'`);
    }
    if (typeof rij.concept !== 'string' || rij.concept.trim() === '') {
      fouten.push(`${waar}: concept (de tekst) ontbreekt`);
    }
    if (rij.bloom !== undefined && !BLOOM_IDS.includes(rij.bloom)) {
      fouten.push(
        `${waar}: onbekende denkvaardigheid '${rij.bloom}' (wel: ${BLOOM_IDS.join(', ')})`,
      );
    }
    for (const veld of ['groep', 'toelichting']) {
      if (rij[veld] !== undefined && typeof rij[veld] !== 'string') {
        fouten.push(`${waar}: ${veld} moet tekst zijn`);
      }
    }
    const niveau = {};
    for (const n of niveauIds) {
      const m = rij[n];
      if (m === undefined) fouten.push(`${waar}: niveau '${n}' ontbreekt`);
      else if (!CONCEPT_MOEILIJKHEDEN.includes(m)) {
        fouten.push(`${waar}: '${m}' bij ${n} (wel: ${CONCEPT_MOEILIJKHEDEN.join(', ')})`);
      } else niveau[n] = m;
    }
    for (const sleutel of Object.keys(rij)) {
      if (!VELDEN.includes(sleutel) && !niveauIds.includes(sleutel)) {
        fouten.push(`${waar}: onbekend veld '${sleutel}' (geen veld en geen niveau)`);
      }
    }
    const uit = { id: rij.id, onderwerp: rij.onderwerp, concept: rij.concept, niveau };
    for (const veld of ['bloom', 'groep', 'toelichting']) {
      if (rij[veld] !== undefined) uit[veld] = rij[veld];
    }
    return uit;
  });
  if (fouten.length) throw new Error(`${bron}:\n- ${fouten.join('\n- ')}`);

  return {
    niveaus: niveauIds.map((id) => NIVEAUS.find((n) => n.id === id)),
    onderwerpen: onderwerpen.map(({ id, label }) => ({ id, label })),
    concepten: rijen,
  };
}

/**
 * De moeilijkheden die een cursus echt gebruikt, als tekst: "basis of
 * gevorderd", of "basis, gevorderd of expert". Een cursus zonder expert
 * noemt hem niet.
 */
function moeilijkhedenTekst(leerdoelen) {
  const gebruikt = CONCEPT_MOEILIJKHEDEN.filter((m) =>
    leerdoelen.concepten.some((c) => Object.values(c.niveau).includes(m)),
  );
  return gebruikt.length <= 1
    ? gebruikt.join('')
    : `${gebruikt.slice(0, -1).join(', ')} of ${gebruikt.at(-1)}`;
}

function denkvaardigheid(id) {
  const d = BLOOM.denkvaardigheden.find((x) => x.id === id);
  if (!d) throw new Error(`onbekende denkvaardigheid '${id}'`);
  return d;
}

function moeilijkheid(id) {
  const m = BLOOM.moeilijkheden.find((x) => x.id === id);
  if (!m) throw new Error(`onbekende moeilijkheid '${id}'`);
  return m;
}

/** Het cijfer uit het beoordelingsblad. Expert telt als gevorderd. */
function cijferVoor(bloom, moeilijkheidId) {
  denkvaardigheid(bloom);
  const m = moeilijkheid(moeilijkheidId);
  return BLOOM.cijfers[bloom][m.cijferAls ?? m.id];
}

/** Een cijfer zoals op een rapport: 6,5 en 5,0. */
function cijferTekst(cijfer) {
  return cijfer.toFixed(1).replace('.', ',');
}

/** De zin uit het sjabloon van het beoordelingsblad, ingevuld. */
function sjabloonZin(bloom, moeilijkheidId) {
  const cijfer = cijferVoor(bloom, moeilijkheidId);
  return BLOOM.sjabloon
    .replace('$BLOOM_NIVEAU', denkvaardigheid(bloom).label.toLowerCase())
    .replace('$MOEILIJKHEIDSNIVEAU', moeilijkheid(moeilijkheidId).label.toLowerCase())
    .replace('$CIJFER', cijferTekst(cijfer));
}

/**
 * Een voorstel voor de moeilijkheid, volgens de vuistregels van het
 * beoordelingsblad. Een onderwerp haalt een moeilijkheid als er minstens één
 * concept van die moeilijkheid of moeilijker is toegepast; hoe vaak telt
 * niet. Een moeilijkheid is gehaald als elk onderwerp dat er concepten voor
 * heeft hem haalt: gevorderd vraagt gevorderd in HTML én CSS én JavaScript.
 *
 * @param {{label: string, basis: {used: number, total: number}, gevorderd: {used: number, total: number}, expert?: {used: number, total: number}}[]} perOnderwerp
 * @returns {{moeilijkheid: string, reden: string}}
 */
function moeilijkheidVoorstel(perOnderwerp) {
  const vanaf = (o, i) =>
    CONCEPT_MOEILIJKHEDEN.slice(i).reduce(
      (acc, m) => ({
        used: acc.used + (o[m]?.used ?? 0),
        total: acc.total + (o[m]?.total ?? 0),
      }),
      { used: 0, total: 0 },
    );
  const lijst = (namen) =>
    namen.length <= 1 ? namen.join('') : `${namen.slice(0, -1).join(', ')} en ${namen.at(-1)}`;

  let gehaald = 'niet-aan-basis';
  let mist = [];
  for (let i = 0; i < CONCEPT_MOEILIJKHEDEN.length; i++) {
    const telt = perOnderwerp.filter((o) => vanaf(o, i).total > 0);
    const zonder = telt.filter((o) => vanaf(o, i).used === 0).map((o) => o.label);
    if (telt.length === 0 || zonder.length > 0) {
      mist = zonder;
      break;
    }
    gehaald = CONCEPT_MOEILIJKHEDEN[i];
    mist = [];
  }

  const volgende = CONCEPT_MOEILIJKHEDEN[CONCEPT_MOEILIJKHEDEN.indexOf(gehaald) + 1];
  const label = (id) => moeilijkheid(id).label.toLowerCase();
  let reden;
  if (gehaald === 'niet-aan-basis') {
    reden = `Geen concept toegepast bij ${lijst(mist)}.`;
  } else if (!volgende) {
    reden = 'Bij elk onderwerp een concept op expert.';
  } else if (mist.length > 0) {
    reden = `Bij elk onderwerp een concept op ${label(gehaald)}, maar bij ${lijst(mist)} geen concept op ${label(volgende)}.`;
  } else {
    reden = `Bij elk onderwerp een concept op ${label(gehaald)}.`;
  }
  return { moeilijkheid: gehaald, reden };
}

module.exports = {
  BLOOM,
  NIVEAUS,
  CONCEPT_MOEILIJKHEDEN,
  VELDEN,
  leesLeerdoelen,
  cijferVoor,
  cijferTekst,
  sjabloonZin,
  moeilijkheidVoorstel,
  moeilijkhedenTekst,
  denkvaardigheid,
  moeilijkheid,
};
