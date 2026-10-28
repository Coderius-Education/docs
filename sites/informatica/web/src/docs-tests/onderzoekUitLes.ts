import type { OnderzoekVraag } from '../components/CodeEditor/onderzoek';

/**
 * De onderzoeksvragen van een les: de `export const onderzoek = [...]` onder
 * de H1, zoals de les hem aan het hoofdveld meegeeft. Een les zonder geeft
 * null.
 */
export function onderzoekVan(inhoud: string): OnderzoekVraag[] | null {
  const m = inhoud.match(/^export const onderzoek = (\[[\s\S]*?\n\]);$/m);
  if (!m) return null;
  // Het is een gewone JavaScript-array uit onze eigen lessen; zo leest de
  // test precies wat MDX ervan maakt, met de escapes erbij.
  return new Function(`return ${m[1]};`)() as OnderzoekVraag[];
}
