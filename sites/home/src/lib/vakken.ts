import { SUBJECTS } from '@coderius/shared/sites';

/**
 * Het vak bij een hostnaam, of null op coderius.nl en elders. Eén gebouwde
 * homepage dient elke host; welk vak er voorgeselecteerd staat leest de pagina
 * na het laden uit `location.hostname`:
 *  - informatica.coderius.nl, wo.coderius.nl (de url van het vak in SUBJECTS)
 *  - informatica.localtest.me, voor lokaal testen met de delivery-dev-omgeving
 *  - <branch>--wo.preview.coderius.nl, een preview van een branch
 */
export function vakVanHost(hostname: string): string | null {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  for (const vak of SUBJECTS) {
    if (
      host === new URL(vak.url).hostname ||
      host === `${vak.id}.localtest.me` ||
      host.endsWith(`--${vak.id}.preview.coderius.nl`)
    ) {
      return vak.id;
    }
  }
  return null;
}

/**
 * De inleiding onder de kop, per vak. Zonder (of met meer dan één) vak gaat
 * hij over alles. `n` is het aantal cursussen van dat vak.
 */
export function inleiding(vakken: readonly string[], n: number): string {
  const cursussen = n === 1 ? 'Eén cursus' : `${n} cursussen`;
  if (vakken.length === 1 && vakken[0] === 'informatica') {
    return `${cursussen} informatica, van je eerste regel Python tot een website met een eigen back-end. Kies er een en begin in je browser.`;
  }
  if (vakken.length === 1 && vakken[0] === 'wo') {
    return `${cursussen} wetenschapsoriëntatie, over onderzoek doen: van een scherpe vraag tot een eerlijke conclusie.`;
  }
  return `${cursussen} voor het voortgezet onderwijs, van je eerste regel Python tot je eigen onderzoek. Kies er een en begin in je browser.`;
}
