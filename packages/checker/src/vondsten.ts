import type { Vondst } from './types';

/**
 * Verdeelt de vondsten van Buiten de lesstof over de onderwerpen van het
 * rapport. Een vondst met een onderwerp dat het rapport kent, komt bij dat
 * onderwerp; de rest blijft over voor een eigen sectie. Eerst stond alles in
 * één sectie onderaan, ver van de rijen HTML en CSS waar de docent hem naast
 * wil leggen.
 */
export function vondstenPerOnderwerp(
  vondsten: Vondst[],
  onderwerpen: string[],
): { per: Map<string, Vondst[]>; los: Vondst[] } {
  const bekend = new Set(onderwerpen);
  const per = new Map<string, Vondst[]>();
  const los: Vondst[] = [];
  for (const v of vondsten) {
    if (v.onderwerp && bekend.has(v.onderwerp)) {
      per.set(v.onderwerp, [...(per.get(v.onderwerp) ?? []), v]);
    } else {
      los.push(v);
    }
  }
  return { per, los };
}
