import { MAX_PLEKKEN, plekkenIn, regelBegins } from './plekken';
import type { CheckReport, CheckerConfig, ConceptMatch, Plek, ProjectFiles } from './types';

// Analyseert een geüpload project tegen de conceptenlijst van een site. Puur
// een functie over ProjectFiles + config; geen DOM of netwerk. Regex-concepten
// tellen hun voorkomens in de tekstbestanden; pad-concepten checken of er een
// bestand met een matchend pad bestaat (mappenstructuur); handmatige concepten
// blijven hier onaangeroerd, want die stelt een mens vast — de docentweergave
// maakt er een vinkvakje van.

function withoutGlobal(re: RegExp): RegExp {
  return re.global ? new RegExp(re.source, re.flags.replace('g', '')) : re;
}

// matchAll gooit bij een patroon zonder g-vlag. validateCheckerConfig meldt
// zo'n patroon al; hier crasht de nakijker er in elk geval niet op.
function withGlobal(re: RegExp): RegExp {
  return re.global ? re : new RegExp(re.source, `${re.flags}g`);
}

export interface AnalyzeOpties {
  /**
   * Zoek ook wat buiten de lesstof valt (standaard aan). Alleen de
   * docentweergave toont dat; de leerlingweergave zet het uit, zodat een
   * leerling niet wacht op een scan waar hij niets van ziet.
   */
  buitenLesstof?: boolean;
}

export function analyze(
  files: ProjectFiles,
  config: CheckerConfig,
  opties: AnalyzeOpties = {},
): CheckReport {
  const values = Object.values(files);

  const byKind: Record<string, number> = {};
  for (const k of config.fileKinds) byKind[k.id] = 0;
  let skippedTooLarge = 0;
  for (const f of values) {
    byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
    if (f.tooLarge) skippedTooLarge++;
  }

  // Groepeer de bestanden per kind, zodat een regex-concept alleen de
  // relevante bestandssoorten scant.
  const textByKind: Record<string, { path: string; content: string }[]> = {};
  for (const f of values) {
    if (f.content === null || !config.textKinds.includes(f.kind)) continue;
    let bucket = textByKind[f.kind];
    if (!bucket) {
      bucket = [];
      textByKind[f.kind] = bucket;
    }
    bucket.push({ path: f.path, content: f.content });
  }
  const allPaths = values.map((f) => f.path).sort((a, b) => a.localeCompare(b));
  // Alleen een tekstbestand kan als code open; een foto of geluid niet.
  const leesbaar = new Set(
    values
      .filter((f) => f.content !== null && config.textKinds.includes(f.kind))
      .map((f) => f.path),
  );
  // Regelstarts één keer per bestand, en alleen als er iets te vinden is.
  const begins = new Map<string, number[]>();
  const beginsVan = (path: string, content: string) => {
    let b = begins.get(path);
    if (!b) {
      b = regelBegins(content);
      begins.set(path, b);
    }
    return b;
  };

  const concepts: ConceptMatch[] = config.concepts.map((c) => {
    if (c.detect.type === 'handmatig') {
      return { id: c.id, count: 0, used: false, plekken: [] };
    }
    if (c.detect.type === 'path') {
      const re = withoutGlobal(c.detect.pattern);
      const paden = allPaths.filter((p) => re.test(p));
      const used = paden.length > 0;
      const plekken = paden
        .filter((p) => leesbaar.has(p))
        .slice(0, MAX_PLEKKEN)
        .map((bestand) => ({ bestand, regel: 1 }));
      return { id: c.id, count: used ? 1 : 0, used, plekken };
    }
    const kinds = c.detect.in ?? config.textKinds;
    const patroon = withGlobal(c.detect.pattern);
    let count = 0;
    const plekken: Plek[] = [];
    for (const kind of kinds) {
      for (const { path, content } of textByKind[kind] ?? []) {
        const posities = Array.from(content.matchAll(patroon), (m) => m.index ?? 0);
        count += posities.length;
        if (posities.length === 0 || plekken.length >= MAX_PLEKKEN) continue;
        plekken.push(
          ...plekkenIn(path, beginsVan(path, content), posities, MAX_PLEKKEN - plekken.length),
        );
      }
    }
    return { id: c.id, count, used: count >= (c.detect.minCount ?? 1), plekken };
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
    buitenLesstof: (opties.buitenLesstof ?? true) ? (config.buitenLesstof?.(files) ?? []) : [],
    warnings,
  };
}
