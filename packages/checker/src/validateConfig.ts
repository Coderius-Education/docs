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
  const seenIds = new Set<string>();

  for (const kind of [...config.textKinds, ...(config.imageKinds ?? [])]) {
    if (!kindIds.has(kind)) {
      problems.push(`Bestandssoort '${kind}' wordt gelezen maar staat niet in fileKinds.`);
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

    if (concept.detect.type === 'regex') {
      if (!concept.detect.pattern.global) {
        // analyze() telt via src.match(pattern).length. Zonder /g geeft match()
        // één treffer mét capture-groepen terug, en telt .length de groepen in
        // plaats van de voorkomens — een stille verkeerde telling.
        problems.push(`Patroon van concept '${concept.id}' mist de g-vlag.`);
      }
      for (const kind of concept.detect.in ?? []) {
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
  }

  return problems;
}
