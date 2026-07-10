import { analyzeCss } from './analyzeCss';
import { analyzeHtml } from './analyzeHtml';
import { analyzeJs } from './analyzeJs';
import { CSS_TECHNIQUES, JS_TECHNIQUES } from './curriculum';
import type { AnalysisReport, FileKind, ProjectFiles } from './types';

export function analyze(files: ProjectFiles, priorWarnings: string[] = []): AnalysisReport {
  const values = Object.values(files);

  const byKind: Record<FileKind, number> = { html: 0, css: 0, js: 0, image: 0, other: 0 };
  let skippedTooLarge = 0;
  for (const f of values) {
    byKind[f.kind]++;
    if (f.tooLarge) skippedTooLarge++;
  }

  const htmlSources = values
    .filter((f) => f.kind === 'html' && f.content !== null)
    .map((f) => f.content as string);
  const cssSources = values
    .filter((f) => f.kind === 'css' && f.content !== null)
    .map((f) => f.content as string);
  const jsSources = values
    .filter((f) => f.kind === 'js' && f.content !== null)
    .map((f) => f.content as string);

  const htmlResult = analyzeHtml(htmlSources);
  const cssMatches = analyzeCss(cssSources, CSS_TECHNIQUES);
  const jsMatches = analyzeJs([...jsSources, htmlResult.inlineScriptContent], JS_TECHNIQUES);

  // De onclick-teller komt uit HTML-attributen, niet uit JS-broncode.
  const jsMatchesWithOnclick = jsMatches.map((m) =>
    m.id === 'js-onclick-attribute'
      ? { ...m, count: htmlResult.onclickCount, used: htmlResult.onclickCount > 0 }
      : m,
  );

  const warnings = [...priorWarnings];
  if (byKind.html === 0) {
    warnings.push(
      'Geen HTML-bestanden gevonden — het rapport kan dus geen HTML-elementen of technieken uit HTML tonen.',
    );
  }

  return {
    fileStats: { total: values.length, byKind, skippedTooLarge },
    html: { elementCounts: htmlResult.elementCounts },
    css: cssMatches,
    js: jsMatchesWithOnclick,
    warnings,
  };
}
