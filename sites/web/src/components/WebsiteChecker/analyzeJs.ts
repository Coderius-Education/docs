import { detectTechniques } from './matchTechniques';
import type { Technique, TechniqueMatch } from './types';

export function analyzeJs(jsSources: string[], techniques: Technique[]): TechniqueMatch[] {
  const combined = jsSources.join('\n');
  return detectTechniques(combined, techniques);
}
