import type { Technique, TechniqueMatch } from './types';

/**
 * Telt voor elke techniek hoe vaak zijn patroon in de brontekst voorkomt.
 * String.prototype.match() met een 'g'-regex scant altijd vanaf het begin —
 * geen lastIndex-statefulness zoals bij .exec()/.test(), dus veilig om
 * dezelfde Technique-lijst voor meerdere bronnen te hergebruiken.
 */
export function detectTechniques(source: string, techniques: Technique[]): TechniqueMatch[] {
  return techniques.map((t) => {
    const matches = source.match(t.pattern);
    const count = matches ? matches.length : 0;
    return { id: t.id, count, used: count > 0 };
  });
}
