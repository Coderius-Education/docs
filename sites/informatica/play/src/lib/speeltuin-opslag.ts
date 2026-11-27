import { maakOpslag } from '@coderius/shared/oefenveld/opslag';
import { decodeerDeelLink } from './deellink';

// De losse speeltuin (/speeltuin) bewaart de code van de leerling in zijn
// browser, met dezelfde opslag als de oefenvelden in de lessen
// (packages/shared/oefenveld): een eigen database, één veld, de code en de
// bibliotheek (play of pygame-ce). Eerst stond de code alleen in het adres
// (#code=…): herladen hield hem vast, maar wie de speeltuin opnieuw opende
// via het menu, begon weer bij de voorbeeldcode, en het werk was weg.

export type SpeeltuinWerk = { code: string; modus: string };

export const DEFAULT_CODE_PLAY = `import play

play.set_backdrop('white')

play.new_circle(color='red', radius=80)
`;

export const DEFAULT_CODE_PYGAME = `import pygame

pygame.init()

scherm = pygame.display.set_mode((800, 600))
pygame.display.set_caption("Mijn spel")

actief = True

while actief:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            actief = False

    scherm.fill((30, 30, 30))
    pygame.display.flip()

pygame.quit()
`;

/** Waar het veld mee begint; daar hangt ook de sleutel van het werk aan. */
export const SPEELTUIN_START: SpeeltuinWerk = { code: DEFAULT_CODE_PLAY, modus: 'play' };

export const speeltuinOpslag = maakOpslag<SpeeltuinWerk>({
  site: 'play',
  naam: 'speeltuin',
  delen: ['code', 'modus'],
});

/** De startcode bij een bibliotheek. */
export function standaardCode(modus: string): string {
  return modus === 'pygame' ? DEFAULT_CODE_PYGAME : DEFAULT_CODE_PLAY;
}

// Het adres dat deze tab zelf als laatste schreef. Een herlaadbeurt houdt het
// (sessionStorage hoort bij de tab), een link die iemand deelt of die je in
// een nieuwe tab opent niet.
const EIGEN_ADRES = 'coderius:play:speeltuin-adres';

export function leesEigenAdres(): string | null {
  try {
    return sessionStorage.getItem(EIGEN_ADRES);
  } catch {
    return null;
  }
}

export function zetEigenAdres(hash: string): void {
  try {
    sessionStorage.setItem(EIGEN_ADRES, hash);
  } catch {
    // Geen sessionStorage: dan telt een herladen adres als gedeeld, en blijft
    // het eigen werk in de database onaangeroerd.
  }
}

export interface Begin extends SpeeltuinWerk {
  /**
   * Code uit een link van iemand anders (of uit een andere tab). Die toont de
   * speeltuin wel, maar bewaart hij niet: anders overschreef het openen van
   * een gedeelde link het eigen werk van de leerling.
   */
  gedeeld: boolean;
}

/**
 * Waar de speeltuin mee opent. `hash` is het adres na de #, `eigenAdres` wat
 * deze tab er zelf in schreef. Zonder code in het adres: de startcode, en het
 * bewaarde werk komt daarna uit de database. Met code die deze tab zelf
 * schreef (herladen): die code, en het werk wordt gewoon bewaard. Met andere
 * code: een gedeelde link.
 */
export function beginVanAdres(hash: string, eigenAdres: string | null): Begin {
  const schoon = hash.replace(/^#/, '');
  const params = new URLSearchParams(schoon);
  const ruw = params.get('code');
  const code = ruw ? decodeerDeelLink(ruw) : null;
  const m = params.get('mode');
  const modus = m === 'play' || m === 'pygame' ? m : 'play';
  if (code === null) return { ...SPEELTUIN_START, gedeeld: false };
  const eigen = eigenAdres !== null && eigenAdres.replace(/^#/, '') === schoon;
  return { code, modus, gedeeld: !eigen };
}
