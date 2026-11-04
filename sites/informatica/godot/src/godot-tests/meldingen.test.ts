import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DOCS } from './lessen';

// Een blok "Er gaat iets mis" dat een melding letterlijk citeert, belooft de
// leerling dat Godot precies dat zegt. Zonder controle verouderde dat stil:
// "move_and_slide called without physics frame" en "signal already connected"
// bestonden niet, "Invalid get index 'score' (on base: 'Node2D')" was de
// vorm van Godot 3, en "Expected end of statement" gaf Godot 4.7 niet bij een
// else zonder dubbele punt. Daarom moet zo'n blok een foutvoorbeeld hebben
// met verwacht-fout of verwacht-runtime-fout: de runner laat het Godot echt
// maken, en de extractie eist dat de summary die melding is.

/** Meldingen die de runner niet kan namaken, met de reden. */
const ZONDER_MARKER = new Map([
  [
    "04-personage-en-beweging/sprite_movement.md: Script inherits from native type 'CharacterBody2D', so it can't be assigned to an object of type 'Sprite2D'.",
    'Godot geeft deze melding bij het koppelen van het script; de runner hangt een script altijd aan een node van zijn eigen soort',
  ],
]);

type Blok = { waar: string; citaat: string; heeftMarker: boolean };

/** De geciteerde melding in een summary: code met een spatie erin, of een zin tussen aanhalingstekens. */
function citaatIn(summary: string): string | undefined {
  const code = [...summary.matchAll(/<code>([^<]*)<\/code>/g)]
    .map((m) => m[1])
    .find((c) => /^[A-Z]/.test(c) && /\s/.test(c));
  if (code) return code;
  // Tussen aanhalingstekens pas vanaf drie woorden: "New Project" is een knop.
  return summary.match(/"([A-Z][^"]*\s[^"\s]+\s[^"]*)"/)?.[1];
}

function blokken(): Blok[] {
  const uit: Blok[] = [];
  for (const map of readdirSync(DOCS, { withFileTypes: true })) {
    if (!map.isDirectory()) continue;
    for (const f of readdirSync(join(DOCS, map.name))) {
      if (!/\.mdx?$/.test(f)) continue;
      const tekst = readFileSync(join(DOCS, map.name, f), 'utf8');
      for (const d of tekst.matchAll(/<details[\s>][\s\S]*?<\/details>/g)) {
        const summary = d[0].match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? '';
        const citaat = citaatIn(summary);
        if (!citaat) continue;
        uit.push({
          waar: `${map.name}/${f}`,
          citaat,
          heeftMarker: /\{\/\*\s*verwacht-(?:runtime-)?fout:/.test(d[0]),
        });
      }
    }
  }
  return uit;
}

describe('geciteerde meldingen in de Godot-cursus', () => {
  const alle = blokken();

  it('komen uit een foutvoorbeeld dat Godot echt laat falen', () => {
    const fout = alle
      .filter((b) => !b.heeftMarker && !ZONDER_MARKER.has(`${b.waar}: ${b.citaat}`))
      .map((b) => `${b.waar}: "${b.citaat}" heeft geen verwacht-fout of verwacht-runtime-fout`);
    expect(alle.length).toBeGreaterThan(10);
    expect(fout).toEqual([]);
  });

  it('houdt de uitzonderingen schoon', () => {
    const er = new Set(alle.map((b) => `${b.waar}: ${b.citaat}`));
    expect([...ZONDER_MARKER.keys()].filter((k) => !er.has(k))).toEqual([]);
  });

  it('ziet een citaat, en een codenaam in een summary niet', () => {
    expect(citaatIn('Foutmelding: <code>Expected ":" after "else".</code>')).toBe(
      'Expected ":" after "else".',
    );
    expect(citaatIn('Ik krijg een fout: "Attempt to call function on a null instance"')).toBe(
      'Attempt to call function on a null instance',
    );
    expect(citaatIn('Kies "New Project"')).toBeUndefined();
    expect(citaatIn('Na <code>call_group</code> stopt één vijand niet')).toBeUndefined();
    expect(citaatIn('Mijn karakter speelt altijd de <code>jump</code>-animatie')).toBeUndefined();
  });
});
