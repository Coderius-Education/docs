import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Click Golfer is voor groep 7/8 en draait om hardware die de leerling voor
// zich heeft. Wat de tekst over die hardware zegt, kan hij niet nakijken —
// dus moet het kloppen.
//
// Twee dingen gingen mis. "De houten baan" zei dat je met het blauwe
// stelschroefje de gevoeligheid instelt, terwijl dit project de sensor
// analoog uitleest op A0: dat schroefje hoort bij de digitale uitgang D0, en
// die is in het bedradingsschema niet eens aangesloten. En "Aansluiten"
// noemde geen enkele pin, terwijl `sites/robotica/CLAUDE.md` voorschrijft dat
// hardware-instructies de exacte pin-aansluitingen noemen — drie pagina's
// later dook A0 op zonder dat ergens stond waarom.

const CLICK = fileURLToPath(new URL('../../click_golfer', import.meta.url));
const STATIC = fileURLToPath(new URL('../../static', import.meta.url));

function paginas(): string[] {
  return readdirSync(CLICK)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

function tekst(bestand: string): string {
  return readFileSync(join(CLICK, bestand), 'utf8');
}

describe('de hardware-uitleg klopt', () => {
  it('noemt het stelschroefje alleen met de mededeling dat je het laat zitten', () => {
    // Het schroefje zet de drempel van de digitale uitgang D0, en die is niet
    // eens aangesloten. Wie het noemt zonder erbij te zeggen dat het hier
    // niets doet, stuurt een leerling naar een knop die het getal op zijn
    // scherm niet verandert. Een verbod op de woorden zou te grof zijn: de
    // foto toont het schroefje, dus benoemen mag, mits met die uitleg erbij.
    const zonderUitleg: string[] = [];

    for (const bestand of paginas()) {
      const inhoud = tekst(bestand);
      for (const m of inhoud.matchAll(/schroefje/gi)) {
        const rondom = inhoud.slice(m.index, m.index + 260);
        if (
          !/laat je met rust|laat je zitten|niets? (mee )?te maken|verandert er niet van/i.test(
            rondom,
          )
        ) {
          zonderUitleg.push(`${bestand}: "${rondom.slice(0, 60)}…"`);
        }
      }
    }

    expect(zonderUitleg).toEqual([]);
  });

  it('elke pagina die een pin uitleest, noemt die pin ook in de tekst', () => {
    // `Read anapin A0` in een screenshot-onderschrift is geen aansluitinstructie.
    const zonder: string[] = [];

    for (const bestand of paginas()) {
      const inhoud = tekst(bestand);
      for (const m of inhoud.matchAll(/Read anapin (A\d)/g)) {
        const pin = m[1];
        // De pagina zelf noemt hem in de aansluittabel, of verwijst naar een
        // pagina die de pin uitlegt: aansluiten (waar hij vastzit) of
        // bal-detecteren (waar je hem uitleest, en dat linkt zelf door).
        const legtUit =
          new RegExp(`\\|[^|]*\\*\\*${pin}\\*\\*`).test(inhoud) ||
          /\((aansluiten|bal-detecteren)(\.md)?\)/.test(inhoud);
        if (!legtUit) zonder.push(`${bestand} leest ${pin} uit zonder aansluituitleg`);
      }
    }

    expect(zonder).toEqual([]);
  });

  it('aansluiten noemt de pinnen van beide onderdelen', () => {
    const inhoud = tekst('aansluiten.md');

    expect(inhoud).toMatch(/\*\*A0\*\*/);
    expect(inhoud).toMatch(/\*\*D9\*\*/);
  });
});

describe('elk bestand waar een pagina naar wijst, bestaat', () => {
  // De sectie leunt op downloads en PDF's in `static/`. Docusaurus
  // controleert die paden niet: een hernoemde PDF geeft een lege iframe en
  // een dode downloadknop, zonder dat de build klaagt.
  const verwijzingen: [string, string][] = [];
  for (const bestand of paginas()) {
    const inhoud = tekst(bestand);
    for (const m of inhoud.matchAll(
      /(?:src|href)="\/((?:click_golfer|models|fritzing)\/[^"]+)"/g,
    )) {
      verwijzingen.push([bestand, m[1]]);
    }
    for (const m of inhoud.matchAll(/\]\(@site\/static\/([^)]+)\)/g)) {
      verwijzingen.push([bestand, m[1]]);
    }
  }

  it('vindt de verwijzingen', () => {
    expect(verwijzingen.length).toBeGreaterThan(10);
  });

  it.each(verwijzingen)('%s wijst naar bestaand %s', (_bestand, pad) => {
    expect(existsSync(join(STATIC, pad))).toBe(true);
  });
});
