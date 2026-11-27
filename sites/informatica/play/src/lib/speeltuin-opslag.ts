import { type Opslag, maakOpslag, veldSleutel } from '@coderius/shared/oefenveld/opslag';
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

/**
 * Eigen code: niet leeg, niet een van de twee startcodes en geen voorbeeld.
 * Die gaat bij Reset of een voorbeeld verloren, dus dan vraagt de speeltuin
 * het eerst. Eerst telde alleen de startcode van de gekozen bibliotheek, en
 * vroeg Reset het ook na alleen wisselen van bibliotheek, zonder getypte
 * code; en bij een lege editor, waar niets te verliezen valt.
 */
export function isEigenCode(code: string, voorbeelden: readonly string[]): boolean {
  return (
    code.trim() !== '' &&
    code !== DEFAULT_CODE_PLAY &&
    code !== DEFAULT_CODE_PYGAME &&
    !voorbeelden.includes(code)
  );
}

/** De plek van het werk van de speeltuin in de opslag (één veld per pad). */
function plek(opslag: Opslag<SpeeltuinWerk>, pad: string) {
  const zaad = opslag.zaadVan(SPEELTUIN_START);
  return { zaad, sleutel: veldSleutel(pad, zaad, 0) };
}

/**
 * Maakt code uit een link het eigen werk: de knop Bewaar deze code als de
 * mijne. Zonder die knop kon een leerling die al eigen werk had, de startcode
 * van een docent wel openen en bewerken, maar nooit houden. De noodkopie van
 * het oude werk gaat eerst weg: bij het volgende laden gaat die vóór de
 * database, en dan stond het oude werk er weer.
 */
export async function neemOver(
  opslag: Opslag<SpeeltuinWerk>,
  pad: string,
  werk: SpeeltuinWerk,
): Promise<void> {
  const { zaad, sleutel } = plek(opslag, pad);
  await opslag.bewaar(sleutel, werk, SPEELTUIN_START, zaad);
  opslag.wisNood(sleutel);
}

/**
 * Het adres van de speeltuin zonder de code uit de link. Een klik op
 * Speeltuin in het menu helpt vanaf een gedeelde link niet: het pad is
 * hetzelfde, dus Docusaurus laadt de pagina niet opnieuw en de gedeelde code
 * blijft staan. Een volledige navigatie naar dit adres wel.
 */
export function adresZonderLink(loc: { pathname: string; search: string }): string {
  return `${loc.pathname}${loc.search}`;
}

// Hoe lang de speeltuin wacht op de database voordat hij een link voorzichtig
// als gedeeld behandelt (zoals useOpslag het lezen opgeeft na anderhalve seconde).
const WACHT_OP_DATABASE_MS = 1500;

/**
 * Waar de speeltuin mee opent, met de database erbij. Een link geldt alleen als
 * gedeeld (tonen, niet bewaren) als er ander eigen werk is dat hij zou
 * overschrijven. Is er niets bewaard, dan is de code uit het adres het eigen
 * werk: zo bleef wie de speeltuin vóór de opslag gebruikte (de code stond toen
 * alleen in het adres) bij herladen zijn werk houden. Is het bewaarde werk
 * gelijk aan de code uit het adres (je eigen adres in een nieuwe tab), dan is
 * het ook gewoon eigen werk. Antwoordt de database niet, dan blijft het
 * voorzichtig: gedeeld.
 */
export async function kiesBegin(
  hash: string,
  eigenAdres: string | null,
  pad: string,
  opslag: Opslag<SpeeltuinWerk>,
  wachtMs = WACHT_OP_DATABASE_MS,
): Promise<Begin> {
  const begin = beginVanAdres(hash, eigenAdres);
  if (!begin.gedeeld) return begin;
  const { zaad, sleutel } = plek(opslag, pad);
  const uitAdres: SpeeltuinWerk = { code: begin.code, modus: begin.modus };
  // De noodkopie gaat bij het laden vóór de database (useOpslag): die is dan
  // het eigen werk.
  const nood = opslag.leesNood(sleutel, zaad);
  if (nood) return { ...begin, gedeeld: !opslag.gelijk(nood, uitAdres) };
  const bewaard = await Promise.race([
    opslag.laad(sleutel, zaad).then(
      (werk) => (werk ? werk : 'leeg'),
      () => 'onbekend' as const,
    ),
    new Promise<'onbekend'>((klaar) => setTimeout(() => klaar('onbekend'), wachtMs)),
  ]);
  if (bewaard === 'onbekend') return begin;
  if (bewaard === 'leeg') return { ...begin, gedeeld: false };
  return { ...begin, gedeeld: !opslag.gelijk(bewaard, uitAdres) };
}
