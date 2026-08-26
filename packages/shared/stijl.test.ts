import { REGELNAMEN, alleenProza, controleer } from '@coderius/shared/stijl';
import { describe, expect, it } from 'vitest';

// De stijlcontrole zelf is niet-blokkerend in CI: de gemigreerde sites hebben
// nog een achterstand. Deze test is dat wél. Zonder blokkerende test kan een
// regex stilletjes stukgaan en blijft de job groen terwijl hij niets meer
// vindt — precies de situatie die de job moest oplossen.

/** De namen van de regels die op dit fragment afgaan. */
function namen(tekst: string): string[] {
  return controleer(tekst).map((m) => m.naam);
}

describe('maskeren', () => {
  it('haalt codeblokken weg maar houdt de regelnummers gelijk', () => {
    const tekst = 'Regel een.\n\n```python\nprint("Klaar!")\n```\n\nRegel twee.\n';
    const proza = alleenProza(tekst);
    expect(proza.split('\n').length).toBe(tekst.split('\n').length);
    expect(proza).not.toContain('Klaar');
    expect(proza).toContain('Regel twee.');
  });

  it('laat een uitroepteken in code met rust', () => {
    expect(namen('Zie hier:\n\n```python\nprint("Klaar!")\n```\n')).toEqual([]);
  });

  it('laat inline code, JSX en linkdoelen met rust', () => {
    expect(namen('Gebruik `u.py` en <Component u="1" /> en [link](/docs/u).')).toEqual([]);
  });
});

describe('fouten', () => {
  it('vindt de u-vorm', () => {
    expect(namen('Hiermee kunt u beginnen.')).toContain('u-vorm');
    expect(namen('Dit is uw bestand.')).toContain('u-vorm');
  });

  it('ziet "juli" niet aan voor een u-vorm', () => {
    expect(namen('In juli begint de uitleg.')).not.toContain('u-vorm');
  });

  it('vindt een uitroepteken in proza', () => {
    expect(namen('Dat is gelukt!')).toContain('uitroepteken');
  });

  it('vindt een emoji, maar laat ✓ en pijlen staan', () => {
    expect(namen('Klaar 🎉')).toContain('emoji');
    expect(namen('Klaar ✓ en dan → verder')).not.toContain('emoji');
  });

  it('vindt schreeuwen, maar kent afkortingen', () => {
    expect(namen('Dit is ECHTWAAR zo.')).toContain('all-caps');
    expect(namen('Je schrijft HTML en CSS.')).not.toContain('all-caps');
  });

  it('vindt een afbeelding zonder alt-tekst', () => {
    expect(namen('![](kat.png)')).toContain('alt-tekst');
    expect(namen('![afbeelding](kat.png)')).toContain('alt-tekst');
    expect(namen('![een slapende kat](kat.png)')).not.toContain('alt-tekst');
  });
});

describe('waarschuwingen', () => {
  it('vindt vulwoorden en superlatieven', () => {
    expect(namen('Dat is eigenlijk simpel.')).toContain('vulwoord');
    expect(namen('Een krachtige bibliotheek.')).toContain('superlatief');
  });

  it('vindt een formulaire opener aan het begin van een regel', () => {
    expect(namen('Laten we eens kijken naar lijsten.')).toContain('formulaire-opener');
  });

  it('vindt een lange zin', () => {
    const lang = `Dit is ${'woord '.repeat(45)}einde.`;
    expect(namen(lang)).toContain('lange-zin');
  });

  it('vindt drie regels op rij met dezelfde opening', () => {
    expect(namen('- Maak een cirkel\n- Maak een blok\n- Maak een tekst\n')).toContain(
      'herhaalde-opening',
    );
  });

  it('vindt een samenvatting aan het eind', () => {
    expect(namen('## Samenvatting\n\nDit was het.')).toContain('samenvatting');
  });

  it('vindt "de leerling" in lestekst', () => {
    expect(namen('Zo leert de leerling variabelen kennen.')).toContain('leerling-vorm');
  });
});

describe('uitzonderingen', () => {
  it('dempt één regel voor de eerstvolgende alinea', () => {
    const tekst =
      '{/* stijl-uitzondering: uitroepteken citaat uit de foutmelding */}\n\nPython zegt: Klaar!\n\nDat is gelukt!\n';
    const meldingen = controleer(tekst);
    expect(meldingen.filter((m) => m.naam === 'uitroepteken')).toHaveLength(1);
  });

  it('dempt een regel voor het hele bestand', () => {
    const tekst =
      '{/* stijl-uitzondering-bestand: uitroepteken citaten */}\n\nEen!\n\nTwee!\n\nDrie!\n';
    expect(namen(tekst)).not.toContain('uitroepteken');
  });

  it('dempt alleen de genoemde regel', () => {
    const tekst = '{/* stijl-uitzondering-bestand: uitroepteken citaten */}\n\nDit kunt u niet!\n';
    const gevonden = namen(tekst);
    expect(gevonden).not.toContain('uitroepteken');
    expect(gevonden).toContain('u-vorm');
  });
});

describe('de regels zelf', () => {
  it('hebben allemaal een naam en een niveau', () => {
    expect(REGELNAMEN.size).toBeGreaterThan(10);
  });

  it('vinden niets in een schone alinea', () => {
    expect(
      namen('Met `clone()` maak je een kopie van een vorm. De kopie staat op dezelfde plek.'),
    ).toEqual([]);
  });
});
