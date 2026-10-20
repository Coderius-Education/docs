import { MAX_PLEKKEN, plekkenIn, regelBegins } from './plekken';
import type {
  CheckReport,
  CheckerConfig,
  Concept,
  ConceptMatch,
  Plek,
  ProjectFiles,
} from './types';

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
  /**
   * Onthoud waar elk concept staat (standaard aan). Alleen de docent kan de
   * code openen; de leerlingweergave zet het uit en telt alleen.
   */
  plekken?: boolean;
}

export function analyze(
  files: ProjectFiles,
  config: CheckerConfig,
  opties: AnalyzeOpties = {},
): CheckReport {
  const values = Object.values(files);
  const metPlekken = opties.plekken ?? true;

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
  const bibliotheken: string[] = [];
  let tekstbestanden = 0;
  for (const f of values) {
    if (f.content === null || !config.textKinds.includes(f.kind)) continue;
    tekstbestanden++;
    if (config.bibliotheek?.(f.path, f.content)) {
      bibliotheken.push(f.path);
      continue;
    }
    let bucket = textByKind[f.kind];
    if (!bucket) {
      bucket = [];
      textByKind[f.kind] = bucket;
    }
    bucket.push({ path: f.path, content: f.content });
  }
  for (const a of config.afgeleid ?? []) {
    const bucket: { path: string; content: string }[] = [];
    for (const van of a.van) {
      for (const f of textByKind[van] ?? []) {
        const content = a.maak(f.content, van);
        // Een andere lengte zou de regelnummers laten verschuiven; dan liever
        // niets dan een plek in de verkeerde regel.
        if (content.length === f.content.length) bucket.push({ path: f.path, content });
      }
    }
    textByKind[a.kind] = bucket;
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

  const meet = (c: Pick<Concept, 'id' | 'detect'>): ConceptMatch => {
    if (c.detect.type === 'handmatig') {
      return { id: c.id, count: 0, used: false, plekken: [] };
    }
    if (c.detect.type === 'path') {
      const re = withoutGlobal(c.detect.pattern);
      const paden = allPaths.filter((p) => re.test(p));
      const used = paden.length > 0;
      if (!metPlekken) return { id: c.id, count: used ? 1 : 0, used };
      const plekken = paden
        .filter((p) => leesbaar.has(p))
        .slice(0, MAX_PLEKKEN)
        .map((bestand) => ({ bestand, regel: 1 }));
      return { id: c.id, count: used ? 1 : 0, used, plekken };
    }
    const { delen } = c.detect;
    const kinds = c.detect.in ?? config.textKinds;
    const patroon = withGlobal(c.detect.pattern);
    const minimum = c.detect.minCount ?? 1;
    const gevonden = new Set<string>();
    const noteerDeel = (m: RegExpMatchArray) => {
      if (delen === true) {
        const deel = m.slice(1).find((g) => g !== undefined && g !== '');
        if (deel) gevonden.add(deel.toLowerCase());
      } else if (delen) {
        const i = delen.findIndex((_, j) => m.groups?.[`d${j}`] !== undefined);
        if (i !== -1) gevonden.add(delen[i]);
      }
    };
    const metDelen = (m: ConceptMatch): ConceptMatch =>
      delen ? { ...m, delen: Array.from(gevonden).sort((a, b) => a.localeCompare(b)) } : m;
    if (!metPlekken && !delen) {
      let n = 0;
      for (const kind of kinds) {
        for (const { content } of textByKind[kind] ?? []) n += content.match(patroon)?.length ?? 0;
      }
      return { id: c.id, count: n, used: n >= minimum };
    }
    let count = 0;
    const plekken: Plek[] = [];
    for (const kind of kinds) {
      for (const { path, content } of textByKind[kind] ?? []) {
        const treffers = Array.from(content.matchAll(patroon));
        for (const m of treffers) noteerDeel(m);
        count += treffers.length;
        if (!metPlekken || treffers.length === 0 || plekken.length >= MAX_PLEKKEN) continue;
        const posities = treffers.map((m) => m.index ?? 0);
        plekken.push(
          ...plekkenIn(path, beginsVan(path, content), posities, MAX_PLEKKEN - plekken.length),
        );
      }
    }
    const match: ConceptMatch = metPlekken
      ? { id: c.id, count, used: count >= minimum, plekken }
      : { id: c.id, count, used: count >= minimum };
    return metDelen(match);
  };

  const concepts = config.concepts.map(meet);
  const extra = (config.extra ?? []).map(meet);

  const warnings: string[] = [];
  if (tekstbestanden === 0) {
    warnings.push(
      'Geen leesbare codebestanden gevonden — controleer of je de juiste map of zip hebt geüpload.',
    );
  }
  if (bibliotheken.length > 0) {
    const lijst = bibliotheken.sort((a, b) => a.localeCompare(b));
    const namen =
      lijst.length === 1 ? lijst[0] : `${lijst.slice(0, -1).join(', ')} en ${lijst.at(-1)}`;
    warnings.push(
      `Niet meegeteld: ${namen}. ${lijst.length === 1 ? 'Dat is een bibliotheek' : 'Dat zijn bibliotheken'}, geen eigen code.`,
    );
  }
  const eigen = new Set(bibliotheken);
  const eigenBestanden: ProjectFiles = Object.fromEntries(
    values.filter((f) => !eigen.has(f.path)).map((f) => [f.path, f]),
  );

  return {
    fileStats: { total: values.length, byKind, skippedTooLarge },
    concepts,
    extra,
    buitenLesstof:
      (opties.buitenLesstof ?? true) ? (config.buitenLesstof?.(eigenBestanden) ?? []) : [],
    warnings,
  };
}
