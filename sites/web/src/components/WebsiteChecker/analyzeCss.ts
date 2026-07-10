import { detectTechniques } from './matchTechniques';
import type { Technique, TechniqueMatch } from './types';

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

export function analyzeCss(cssSources: string[], techniques: Technique[]): TechniqueMatch[] {
  const combined = cssSources.map(stripComments).join('\n');
  return detectTechniques(combined, techniques);
}
