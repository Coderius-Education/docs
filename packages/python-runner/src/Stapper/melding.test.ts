import { describe, expect, it } from 'vitest';
import { afkapMelding } from './melding';

describe('de melding bij een afgekapte opname', () => {
  it('noemt hoeveel stappen er zijn opgenomen', () => {
    expect(afkapMelding(1000)).toContain('1000');
  });

  // De melding komt net zo goed bij een correcte oplossing die veel werk doet.
  // Hem laten vragen of de code eindeloos doorloopt, laat de leerling zoeken
  // naar een fout die er niet is.
  it('beschuldigt correcte code niet van een oneindige lus', () => {
    expect(afkapMelding(1000)).not.toMatch(/loopt je code eindeloos door\?/i);
  });

  it('noemt de grote lus als oorzaak naast de lus zonder eind', () => {
    const tekst = afkapMelding(1000);
    expect(tekst).toMatch(/grote lus/i);
    expect(tekst).toMatch(/zonder eind/i);
  });
});
