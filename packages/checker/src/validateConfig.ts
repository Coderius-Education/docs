import type { CheckerConfig } from './types';

// Controleert de conceptenlijst van een site op fouten die anders stil
// verkeerd scoren: er verschijnt geen foutmelding, er telt alleen iets niet
// mee. Elke site heeft hier een test op, zodat een wijziging in de
// conceptenlijst niet ongemerkt de beoordeling verandert.
//
// Geeft een lijst met leesbare problemen terug; leeg betekent in orde.

export function validateCheckerConfig(config: CheckerConfig): string[] {
  const problems: string[] = [];

  const kindIds = new Set(config.fileKinds.map((k) => k.id));
  const subjectIds = new Set(config.subjects.map((s) => s.id));
  const trackIds = (config.tracks ?? []).map((t) => t.id);
  const seenIds = new Set<string>();

  // De bewaarde beoordelingen krijgen een database per site, met de naam
  // afgeleid uit de docentsleutel (databaseNaam). Die sleutel moet dus via
  // storageKey(site, …) lopen; anders delen twee cursussen op dezelfde
  // origin elkaars leerlingwerk.
  if (!/^coderius:[a-z0-9-]+:[^:]/.test(config.teacher.storageKey)) {
    problems.push(
      `teacher.storageKey '${config.teacher.storageKey}' komt niet uit storageKey(site, …).`,
    );
  }

  for (const kind of [...config.textKinds, ...(config.imageKinds ?? [])]) {
    if (!kindIds.has(kind)) {
      problems.push(`Bestandssoort '${kind}' wordt gelezen maar staat niet in fileKinds.`);
    }
  }

  for (const extra of config.extra ?? []) {
    // Extra concepten delen de id-ruimte: het rapport zoekt matches op id.
    if (config.concepts.some((c) => c.id === extra.id)) {
      problems.push(`Extra concept '${extra.id}' heeft dezelfde id als een concept uit de tabel.`);
    }
  }

  for (const concept of [...config.concepts, ...(config.extra ?? [])]) {
    const { detect } = concept;
    if (detect.type === 'regex' && Array.isArray(detect.delen)) {
      // Elk onderdeel heeft een benoemde groep d0, d1, …; anders wordt het
      // nooit als gevonden gemeld.
      detect.delen.forEach((deel, i) => {
        if (!detect.pattern.source.includes(`(?<d${i}>`)) {
          problems.push(
            `Concept '${concept.id}': onderdeel '${deel}' heeft geen groep d${i} in het patroon.`,
          );
        }
      });
    }
  }

  const afgeleid = new Set<string>();
  for (const a of config.afgeleid ?? []) {
    if (kindIds.has(a.kind) || afgeleid.has(a.kind)) {
      problems.push(`Afgeleide soort '${a.kind}' heeft de naam van een andere bestandssoort.`);
    }
    afgeleid.add(a.kind);
    for (const van of a.van) {
      if (!config.textKinds.includes(van)) {
        problems.push(
          `Afgeleide soort '${a.kind}' komt uit '${van}', maar die soort wordt niet als tekst ingelezen.`,
        );
      }
    }
  }

  for (const concept of [...config.concepts, ...(config.extra ?? [])]) {
    const { detect } = concept;
    if (detect.type !== 'regex') continue;
    for (const kind of detect.in ?? []) {
      if (afgeleid.has(kind)) continue;
      if (!kindIds.has(kind)) {
        problems.push(
          `Concept '${concept.id}' zoekt in bestandssoort '${kind}', die niet in fileKinds staat.`,
        );
      }
      if (!config.textKinds.includes(kind)) {
        problems.push(
          `Concept '${concept.id}' zoekt in '${kind}', maar die soort wordt niet als tekst ingelezen.`,
        );
      }
    }
  }

  for (const concept of config.concepts) {
    if (seenIds.has(concept.id)) {
      problems.push(`Concept-id '${concept.id}' komt meer dan één keer voor.`);
    }
    seenIds.add(concept.id);

    if (!subjectIds.has(concept.subject)) {
      // Zonder bestaand onderwerp valt het concept buiten computeLevelSummary:
      // het telt dan nergens mee, zonder waarschuwing.
      problems.push(
        `Concept '${concept.id}' hoort bij onderwerp '${concept.subject}', dat niet in subjects staat.`,
      );
    }

    if (typeof concept.level !== 'string') {
      // Een niveau per track: elke track moet erin staan, anders valt het
      // concept in die route terug op een willekeurig ander niveau.
      if (trackIds.length === 0) {
        problems.push(
          `Concept '${concept.id}' geeft een niveau per track, maar de config heeft geen tracks.`,
        );
      }
      for (const track of trackIds) {
        if (!concept.level[track]) {
          problems.push(`Concept '${concept.id}' heeft geen niveau voor track '${track}'.`);
        }
      }
    }

    if (concept.detect.type === 'regex') {
      if (!concept.detect.pattern.global) {
        // analyze() telt via src.match(pattern).length. Zonder /g geeft match()
        // één treffer mét capture-groepen terug, en telt .length de groepen in
        // plaats van de voorkomens — een stille verkeerde telling.
        problems.push(`Patroon van concept '${concept.id}' mist de g-vlag.`);
      }
      const { minCount } = concept.detect;
      if (minCount !== undefined && (!Number.isInteger(minCount) || minCount < 1)) {
        problems.push(`Concept '${concept.id}' heeft een minCount die geen geheel getal ≥ 1 is.`);
      }
    }
  }

  return problems;
}
