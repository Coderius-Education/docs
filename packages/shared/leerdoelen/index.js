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
const VELDEN = ['id', 'onderwerp', 'concept', 'bloom', 'groep', 'toelichting', 'les'];

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
    if (
      !['niveaus', 'onderwerpen', 'concepten', 'tentamen', 'gevorderdInGroepen'].includes(sleutel)
    ) {
      fouten.push(
        `onbekend veld '${sleutel}' (wel: niveaus, onderwerpen, concepten, tentamen, gevorderdInGroepen)`,
      );
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
  const tentamen = data.tentamen === undefined ? undefined : leesTentamen(data.tentamen);
  const manierIds = new Set((tentamen?.manieren ?? []).map((m) => m.id));
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
    // De les waar je het concept leert: een doc-id van de eigen cursus
    // ("html-css/koppen-lijsten"), of een lijst als het in meer lessen zit.
    // De plugin zoekt titel en adres op en stopt de build bij een onbekende.
    let lessen;
    if (rij.les !== undefined) {
      lessen = Array.isArray(rij.les) ? rij.les : [rij.les];
      const goedeLes = (l) =>
        typeof l === 'string' &&
        (/^(?!site:)([\w-]+:)?[\w-]+(\/[\w-]+)*$/.test(l) ||
          /^site:[\w-]+(\/[\w.-]+)+(#[\w-]+)?$/.test(l));
      if (lessen.length === 0 || !lessen.every(goedeLes)) {
        fouten.push(
          `${waar}: les moet een doc-id zijn ("html-css/koppen-lijsten", of met de docs-plugin ervoor: "lego_auto:intro"), een site:-link naar een andere cursus, of een lijst daarvan`,
        );
      }
    }
    const niveau = {};
    let manieren;
    for (const n of niveauIds) {
      const m = rij[n];
      if (m === undefined) fouten.push(`${waar}: niveau '${n}' ontbreekt`);
      // null: dit concept hoort niet bij dit niveau. Expliciet, zodat een
      // vergeten niveau een fout blijft.
      else if (m === null) niveau[n] = null;
      else if (tentamen && n === tentamen.niveau) {
        // Op het tentamen-niveau: welke manieren van kennen voor dit concept
        // gelden. Leeg mag: dan is het concept zelf de vaardigheid.
        if (!Array.isArray(m) || !m.every((x) => manierIds.has(x))) {
          fouten.push(
            `${waar}: bij ${n} (het tentamen) een lijst manieren (wel: ${[...manierIds].join(', ')})`,
          );
        } else if (new Set(m).size !== m.length) {
          fouten.push(`${waar}: bij ${n} staat een manier twee keer`);
        } else manieren = m;
      } else if (!CONCEPT_MOEILIJKHEDEN.includes(m)) {
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
    if (lessen) uit.lessen = lessen.map((id) => ({ id }));
    if (manieren) uit.manieren = manieren;
    if (manieren?.length && !lessen?.some((l) => !l.startsWith('site:'))) {
      fouten.push(
        `${waar}: met manieren hoort een les uit de eigen cursus, in de map waar de lessen per manier staan`,
      );
    }
    return uit;
  });
  // Op een niveau kan gevorderd bij een onderwerp een gevorderd concept in
  // meer groepen vragen: { "2": { "play": 2 } }. Zo vraagt niveau 2 van play
  // iets gevorderds in twee hoofdstukken, waar niveau 1 er één vraagt.
  const gevorderdInGroepen = data.gevorderdInGroepen;
  if (gevorderdInGroepen !== undefined) {
    if (!gevorderdInGroepen || typeof gevorderdInGroepen !== 'object') {
      fouten.push(
        'gevorderdInGroepen moet een object zijn: { "<niveau>": { "<onderwerp>": <aantal> } }',
      );
    } else {
      for (const [n, perOnderwerp] of Object.entries(gevorderdInGroepen)) {
        if (!niveauIds.includes(n)) fouten.push(`gevorderdInGroepen: onbekend niveau '${n}'`);
        // { "2": 2 } in plaats van { "2": { "play": 2 } } ging er eerst stil
        // doorheen, en dan deed de regel niets.
        if (!perOnderwerp || typeof perOnderwerp !== 'object' || Array.isArray(perOnderwerp)) {
          fouten.push(
            `gevorderdInGroepen: bij niveau ${n} een object per onderwerp, zoals { "${n}": { "<onderwerp>": 2 } }`,
          );
          continue;
        }
        const opNiveau = rijen.filter((r) => r && r.niveau[n] != null);
        const onderwerpenOpNiveau = new Set(opNiveau.map((r) => r.onderwerp));
        for (const [o, aantal] of Object.entries(perOnderwerp)) {
          const vanOnderwerp = opNiveau.filter((r) => r.onderwerp === o);
          const groepen = new Set(
            vanOnderwerp
              .filter((r) => ['gevorderd', 'expert'].includes(r.niveau[n]))
              .map((r) => r.groep),
          );
          if (!onderwerpIds.has(o)) fouten.push(`gevorderdInGroepen: onbekend onderwerp '${o}'`);
          else if (!Number.isInteger(aantal) || aantal < 2) {
            fouten.push(`gevorderdInGroepen: bij ${n}/${o} een geheel getal van 2 of meer`);
          } else if (vanOnderwerp.some((r) => !r.groep)) {
            // Zonder groep krijgt een concept in de nakijker de moeilijkheid
            // als kop: dan telt de regel iets anders dan hier.
            fouten.push(`gevorderdInGroepen: bij ${n}/${o} heeft niet elke rij een groep`);
          } else if (onderwerpenOpNiveau.size === 1) {
            // Met één onderwerp gaat het voorstel al per groep en eist het
            // gevorderd in élke groep: de regel zou dan niets doen.
            fouten.push(
              `gevorderdInGroepen: niveau ${n} heeft alleen ${o}; dan vraagt gevorderd al een concept in elke groep`,
            );
          } else if (aantal > groepen.size) {
            fouten.push(
              `gevorderdInGroepen: bij ${n}/${o} ${aantal} groepen, maar er zijn er maar ${groepen.size} met een gevorderd concept`,
            );
          }
        }
      }
    }
  }
  if (fouten.length) throw new Error(`${bron}:\n- ${fouten.join('\n- ')}`);

  return {
    ...(gevorderdInGroepen ? { gevorderdInGroepen } : {}),
    niveaus: niveauIds.map((id) => NIVEAUS.find((n) => n.id === id)),
    onderwerpen: onderwerpen.map(({ id, label }) => ({ id, label })),
    concepten: rijen,
    ...(tentamen ? { tentamen } : {}),
  };

  /**
   * Een niveau dat met een tentamen wordt getoetst, in plaats van met een
   * project: de vorm, de bron, de manieren waarop je een concept kunt kennen
   * en per onderwerp een inleiding.
   */
  function leesTentamen(t) {
    const waar = 'tentamen';
    if (!t || typeof t !== 'object') {
      fouten.push(`${waar}: geen object`);
      return undefined;
    }
    for (const sleutel of Object.keys(t)) {
      if (!['niveau', 'vorm', 'bron', 'manieren', 'onderwerpen'].includes(sleutel)) {
        fouten.push(
          `${waar}: onbekend veld '${sleutel}' (wel: niveau, vorm, bron, manieren, onderwerpen)`,
        );
      }
    }
    if (!niveauIds.includes(t.niveau)) {
      fouten.push(`${waar}: niveau '${t.niveau}' staat niet in niveaus`);
    }
    for (const veld of ['vorm', 'bron']) {
      if (typeof t[veld] !== 'string' || t[veld].trim() === '') {
        fouten.push(`${waar}: ${veld} moet tekst zijn`);
      }
    }
    if (typeof t.bron === 'string' && !/^\/bronnen\/[\w-]+$/.test(t.bron)) {
      fouten.push(`${waar}: bron is het pad van een pagina bij vakdidactiek (/bronnen/<slug>)`);
    }
    const manieren = Array.isArray(t.manieren) ? t.manieren : [];
    if (manieren.length === 0)
      fouten.push(`${waar}: manieren moet een lijst zijn met minstens één manier`);
    const ids = [];
    for (const [i, m] of manieren.entries()) {
      const w = `${waar}: manier ${m?.id ?? i + 1}`;
      if (!m || typeof m.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(m.id)) {
        fouten.push(`${w}: id moet kleine letters, cijfers en streepjes zijn`);
        continue;
      }
      if (ids.includes(m.id)) fouten.push(`${w} staat er twee keer`);
      ids.push(m.id);
      for (const veld of ['label', 'uitleg', 'vraagtype']) {
        if (typeof m[veld] !== 'string' || m[veld].trim() === '') {
          fouten.push(`${w}: ${veld} moet tekst zijn`);
        }
      }
      if (
        !Array.isArray(m.lessen) ||
        m.lessen.length === 0 ||
        !m.lessen.every((l) => typeof l === 'string' && /^[\w-]+\/?$/.test(l))
      ) {
        fouten.push(
          `${w}: lessen is een lijst lesnamen in de map van het concept ("stellingen", of "bouwen/" voor de eerste les in die submap)`,
        );
      }
      for (const sleutel of Object.keys(m)) {
        if (!['id', 'label', 'uitleg', 'vraagtype', 'lessen'].includes(sleutel)) {
          fouten.push(`${w}: onbekend veld '${sleutel}'`);
        }
      }
    }
    const inleidingen = t.onderwerpen ?? {};
    if (typeof inleidingen !== 'object' || Array.isArray(inleidingen)) {
      fouten.push(`${waar}: onderwerpen is een object van onderwerp-id naar een inleiding`);
    } else {
      for (const [id, tekst] of Object.entries(inleidingen)) {
        if (!onderwerpIds.has(id)) fouten.push(`${waar}: onbekend onderwerp '${id}'`);
        if (typeof tekst !== 'string' || tekst.trim() === '') {
          fouten.push(`${waar}: de inleiding bij '${id}' moet tekst zijn`);
        }
      }
    }
    return {
      niveau: t.niveau,
      vorm: t.vorm,
      bron: t.bron,
      manieren: manieren
        .filter((m) => m && typeof m.id === 'string')
        .map(({ id, label, uitleg, vraagtype, lessen }) => ({
          id,
          label,
          uitleg,
          vraagtype,
          lessen,
        })),
      onderwerpen: { ...inleidingen },
    };
  }
}

/**
 * De niveaus die met een project worden beoordeeld: alle niveaus, behalve
 * dat van het tentamen. Alleen deze hebben per concept een moeilijkheid.
 */
function projectNiveaus(leerdoelen) {
  return leerdoelen.niveaus.filter((n) => n.id !== leerdoelen.tentamen?.niveau);
}

/**
 * De onderwerpen van één niveau, elk met zijn concepten op dat niveau. Een
 * onderwerp zonder concept op dat niveau (overal null) staat er niet in: bij
 * fullstack gaf niveau 3 anders een lege tabel FastAPI, en niveau 1 drie lege
 * tabellen voor Linux, Veiligheid en Online zetten.
 *
 * Op het niveau van een tentamen heeft een concept geen moeilijkheid maar
 * manieren (zijn niveau staat dan niet in `niveau`); daar valt alleen een
 * concept met null af. Zonder die uitzondering stonden bij algoritmes de
 * projecten van niveau 1 op de tentamenpagina van niveau 2.
 *
 * @param {{onderwerpen: {id: string}[], concepten: {onderwerp: string, niveau: Record<string, unknown>}[], tentamen?: {niveau: string}}} leerdoelen
 * @param {string} niveau
 */
function onderwerpenOpNiveau(leerdoelen, niveau) {
  const opTentamen = leerdoelen.tentamen?.niveau === niveau;
  const hoortErbij = (c) => (opTentamen ? c.niveau[niveau] !== null : c.niveau[niveau] != null);
  return leerdoelen.onderwerpen
    .map((onderwerp) => ({
      onderwerp,
      concepten: leerdoelen.concepten.filter((c) => c.onderwerp === onderwerp.id && hoortErbij(c)),
    }))
    .filter((o) => o.concepten.length > 0);
}

/**
 * De kolommen van de tabel van één onderwerp op een niveau. Basis en
 * gevorderd staan er zodra het niveau ze heeft, ook als dit onderwerp er geen
 * concept in heeft: een lege kolom gevorderd zegt de leerling iets. Expert
 * staat er alleen als dit onderwerp een expert-concept heeft. Bij algoritmes
 * is Traffic van CS50 het enige expert-concept, en zonder die regel stond er
 * bij Python een lege kolom Expert.
 *
 * @param {{concepten: {niveau: Record<string, unknown>}[]}} leerdoelen
 * @param {string} niveau
 * @param {{niveau: Record<string, unknown>}[]} rijen de concepten van het onderwerp
 */
function kolommenVoorOnderwerp(leerdoelen, niveau, rijen) {
  return CONCEPT_MOEILIJKHEDEN.filter((m) => {
    const bron = m === 'expert' ? rijen : leerdoelen.concepten;
    return bron.some((c) => c.niveau[niveau] === m);
  });
}

/**
 * Voor de vergelijking: per niveau het niveau ervoor waarvan de moeilijkheid
 * van dit concept verschilt, of null. Een niveau waar het concept niet bij
 * hoort (null) slaat hij over: "gevorderd, –, gevorderd" is geen verschil,
 * en het streepje zelf ook niet.
 *
 * @param {{niveau: Record<string, string | null>}} concept
 * @param {{id: string}[]} niveaus in de volgorde van de kolommen
 * @returns {Record<string, string | null>} per niveau-id het id van het vorige niveau
 */
function andersDan(concept, niveaus) {
  const uit = {};
  let vorige = null;
  for (const n of niveaus) {
    const m = concept.niveau[n.id];
    uit[n.id] = m !== null && vorige !== null && m !== concept.niveau[vorige] ? vorige : null;
    if (m !== null) vorige = n.id;
  }
  return uit;
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

/**
 * Of een cursus concepten op expert heeft, of met `niveau` alleen op dat
 * niveau. Zo'n niveau zegt op zijn pagina waar expert voor is.
 */
function heeftExpert(leerdoelen, niveau) {
  return leerdoelen.concepten.some((c) =>
    niveau === undefined
      ? Object.values(c.niveau).includes('expert')
      : c.niveau[niveau] === 'expert',
  );
}

/**
 * De kolommen van de cijfertabel: niet aan basis voldaan, basis en gevorderd.
 * Expert heeft geen eigen kolom: het telt voor het cijfer als gevorderd, en
 * dient vooral om te laten zien dat je meer kunt dan het lesmateriaal. Een
 * kolom met dezelfde cijfers als gevorderd suggereerde dat expert een hoger
 * cijfer gaf.
 */
function cijferKolommen(_leerdoelen) {
  return BLOOM.moeilijkheden.filter((m) => m.id !== 'expert');
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
  // "voor de moeilijkheid niet aan basis voldaan" is geen zin.
  if (moeilijkheidId === 'niet-aan-basis') {
    return `Ik heb bij jou Bloom niveau ${denkvaardigheid(bloom).label.toLowerCase()} gezien, maar je voldoet nog niet aan basis, en daarbij hoort het cijfer ${cijferTekst(cijfer)}.`;
  }
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

  // Een onderdeel kan voor gevorderd meer groepen vragen (gevorderdInGroepen):
  // dan telt hoeveel groepen een gevorderd concept hebben, niet of er één is.
  const iGevorderd = CONCEPT_MOEILIJKHEDEN.indexOf('gevorderd');
  const teWeinigGroepen = (o, i) =>
    i === iGevorderd && o.gevorderdGroepen && o.gevorderdGroepen.gehaald < o.gevorderdGroepen.nodig;
  let gehaald = 'niet-aan-basis';
  let mist = [];
  let groepenMist = [];
  // De onderwerpen die voor de gehaalde moeilijkheid meetelden: een onderwerp
  // zonder concepten op die moeilijkheid telt daar niet mee.
  let geteld = [];
  for (let i = 0; i < CONCEPT_MOEILIJKHEDEN.length; i++) {
    // Voor basis telt een onderwerp met basisconcepten; voor gevorderd en
    // expert een onderwerp met concepten op die moeilijkheid of moeilijker.
    // Een groep met alleen gevorderde concepten (Accounts bij fullstack) hoeft
    // voor basis dus niets te hebben.
    const telt = perOnderwerp.filter((o) =>
      i === 0 ? (o.basis?.total ?? 0) > 0 : vanaf(o, i).total > 0,
    );
    const zonder = telt.filter((o) => vanaf(o, i).used === 0).map((o) => o.label);
    const teWeinig = telt.filter((o) => vanaf(o, i).used > 0 && teWeinigGroepen(o, i));
    if (telt.length === 0 || zonder.length > 0 || teWeinig.length > 0) {
      mist = zonder;
      groepenMist = teWeinig.map(
        (o) =>
          `bij ${o.label} in ${o.gevorderdGroepen.gehaald} van de ${o.gevorderdGroepen.nodig} groepen die nodig zijn een concept op gevorderd`,
      );
      break;
    }
    gehaald = CONCEPT_MOEILIJKHEDEN[i];
    geteld = telt.map((o) => o.label);
    mist = [];
  }

  const volgende = CONCEPT_MOEILIJKHEDEN[CONCEPT_MOEILIJKHEDEN.indexOf(gehaald) + 1];
  const label = (id) => moeilijkheid(id).label.toLowerCase();
  // "Bij elk onderwerp", of bij welke als er niet alle meetelden. Fullstack
  // niveau 3 heeft alleen bij Online zetten expert; "bij elk onderwerp een
  // concept op expert" klopte daar niet.
  const alle = perOnderwerp.filter((o) => vanaf(o, 0).total > 0).length;
  const bijElk = geteld.length < alle ? `Bij ${lijst(geteld)}` : 'Bij elk onderwerp';
  let reden;
  if (gehaald === 'niet-aan-basis') {
    reden =
      mist.length > 0
        ? `Geen concept toegepast bij ${lijst(mist)}.`
        : 'Er zijn geen concepten voor dit niveau.';
  } else if (!volgende) {
    reden = `${bijElk} een concept op expert.`;
  } else if (mist.length > 0 || groepenMist.length > 0) {
    const delen = [
      ...(mist.length > 0 ? [`bij ${lijst(mist)} geen concept op ${label(volgende)}`] : []),
      ...groepenMist,
    ];
    reden = `${bijElk} een concept op ${label(gehaald)}, maar ${lijst(delen)}.`;
  } else {
    reden = `${bijElk} een concept op ${label(gehaald)}.`;
  }
  return { moeilijkheid: gehaald, reden };
}

module.exports = {
  projectNiveaus,
  onderwerpenOpNiveau,
  kolommenVoorOnderwerp,
  andersDan,
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
  cijferKolommen,
  heeftExpert,
  denkvaardigheid,
  moeilijkheid,
};
