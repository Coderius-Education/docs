import type { CheckReport, CheckerConfig, ConceptMatch, ProjectFiles } from './types';

// Analyseert een geüpload project tegen de conceptenlijst van een site. Puur
// een functie over ProjectFiles + config; geen DOM of netwerk. Regex-concepten
// tellen hun voorkomens in de tekstbestanden; pad-concepten checken of er een
// bestand met een matchend pad bestaat (mappenstructuur).

function withoutGlobal(re: RegExp): RegExp {
  return re.global ? new RegExp(re.source, re.flags.replace('g', '')) : re;
}

export function analyze(files: ProjectFiles, config: CheckerConfig): CheckReport {
  const values = Object.values(files);

  const byKind: Record<string, number> = {};
  for (const k of config.fileKinds) byKind[k.id] = 0;
  let skippedTooLarge = 0;
  for (const f of values) {
    byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
    if (f.tooLarge) skippedTooLarge++;
  }

  // Groepeer de tekstinhoud per kind, zodat een regex-concept alleen de
  // relevante bestandssoorten scant.
  const textByKind: Record<string, string[]> = {};
  for (const f of values) {
    if (f.content === null || !config.textKinds.includes(f.kind)) continue;
    let bucket = textByKind[f.kind];
    if (!bucket) {
      bucket = [];
      textByKind[f.kind] = bucket;
    }
    bucket.push(f.content);
  }
  const allPaths = values.map((f) => f.path);

  const concepts: ConceptMatch[] = config.concepts.map((c) => {
    if (c.detect.type === 'path') {
      const re = withoutGlobal(c.detect.pattern);
      const used = allPaths.some((p) => re.test(p));
      return { id: c.id, count: used ? 1 : 0, used };
    }
    const kinds = c.detect.in ?? config.textKinds;
    let count = 0;
    for (const kind of kinds) {
      for (const src of textByKind[kind] ?? []) {
        const m = src.match(c.detect.pattern);
        if (m) count += m.length;
      }
    }
    return { id: c.id, count, used: count > 0 };
  });

  const warnings: string[] = [];
  const hasAnyText = config.textKinds.some((k) => (textByKind[k]?.length ?? 0) > 0);
  if (!hasAnyText) {
    warnings.push(
      'Geen leesbare codebestanden gevonden — controleer of je de juiste map of zip hebt geüpload.',
    );
  }

  return {
    fileStats: { total: values.length, byKind, skippedTooLarge },
    concepts,
    warnings,
  };
}
