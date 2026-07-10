export interface HtmlAnalysisResult {
  elementCounts: Record<string, number>;
  /** Samengevoegde inhoud van alle inline <script>-tags (zonder src). */
  inlineScriptContent: string;
  onclickCount: number;
}

export function analyzeHtml(htmlSources: string[]): HtmlAnalysisResult {
  const elementCounts: Record<string, number> = {};
  const inlineScripts: string[] = [];
  let onclickCount = 0;

  for (const source of htmlSources) {
    const doc = new DOMParser().parseFromString(source, 'text/html');

    for (const el of Array.from(doc.querySelectorAll('*'))) {
      const tag = el.tagName.toLowerCase();
      elementCounts[tag] = (elementCounts[tag] || 0) + 1;
    }

    for (const script of Array.from(doc.querySelectorAll('script:not([src])'))) {
      inlineScripts.push(script.textContent || '');
    }

    onclickCount += doc.querySelectorAll('[onclick]').length;
  }

  return { elementCounts, inlineScriptContent: inlineScripts.join('\n'), onclickCount };
}
