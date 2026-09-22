import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Papier en code doen hetzelfde spel. Bij de doorloop zei de hand-out dat het
// recept "ophoudt bij een toren van één schijf" terwijl bouwsteen 2 nul
// schijven als basisgeval kiest en uitlegt waarom, en beloofde hij "drie
// regels Python" waar de compleet-pagina er zeven telt. De getallen op de
// hand-out (de rij 2ⁿ − 1, de monniken) worden hier nagerekend in plaats van
// nagelezen, zoals minimax-papier.test.ts dat doet voor het speelbord.

const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

function lees(pad: string): string {
  return readFileSync(`${DOCS}${pad}`, 'utf8');
}

const HANDOUT = lees('unplugged/07-hanoi-op-tafel.mdx');
const ANTWOORDEN = HANDOUT.slice(HANDOUT.indexOf('## Antwoorden'));

describe('de Hanoi-hand-out zegt hetzelfde als de lessen', () => {
  it('de rij zetten op de hand-out en in de les is 2ⁿ − 1', () => {
    const rij = [1, 2, 3, 4, 5].map((n) => 2 ** n - 1);
    expect(rij).toEqual([1, 3, 7, 15, 31]);
    expect(ANTWOORDEN).toMatch(/\*\*Werkvorm 1\*\*: 1, 3, 7, 15.* 5 schijven kost 31 zetten/);
    const les = lees('hanoi/02-patronen.mdx');
    for (const [n, t] of rij.entries()) expect(les).toContain(`| ${n + 1} | ${t} |`);
  });

  it("de monniken: 2⁶⁴ − 1 zetten is ruim 18 triljoen, zo'n 580 miljard jaar, ruim veertig keer het heelal", () => {
    const zetten = 2 ** 64 - 1;
    expect(Math.floor(zetten / 1e18)).toBe(18);
    const jaren = zetten / (365.25 * 86_400) / 1e9;
    expect(Math.round(jaren / 10) * 10).toBe(580);
    expect(jaren / 13.8).toBeGreaterThan(40);
    expect(ANTWOORDEN).toContain('ruim 18 triljoen');
    expect(ANTWOORDEN).toContain("zo'n 580 miljard jaar");
    expect(ANTWOORDEN).toContain('ruim veertig keer de leeftijd van het heelal');
    expect(lees('hanoi/02-patronen.mdx')).toContain('meer dan 18 triljoen');
  });

  it('hand-out en bouwsteen 2 kiezen hetzelfde basisgeval: nul schijven', () => {
    expect(ANTWOORDEN).toMatch(/houdt op bij een toren van nul schijven/);
    expect(ANTWOORDEN).not.toMatch(/houdt op bij een toren van één schijf/);
    const bouwsteen = lees('hanoi/bouwen/05-basisgeval.mdx');
    expect(bouwsteen).toContain('Bij `n == 0` geef je dus een lege lijst `[]` terug.');
  });

  it('de hand-out belooft geen aantal regels Python dat de les niet waarmaakt', () => {
    expect(ANTWOORDEN).not.toMatch(/in \w+ regels\s+Python/);
  });

  it('het recept op de hand-out heeft dezelfde drie stappen als de les', () => {
    const stappen = [...ANTWOORDEN.matchAll(/^\d\. Verplaats (.*)$/gm)].map((m) => m[1]);
    expect(stappen).toHaveLength(3);
    expect(stappen[0]).toMatch(/toren-op-één-na .* naar het hulpvak/);
    expect(stappen[1]).toMatch(/grootste schijf naar het doelvak/);
    expect(stappen[2]).toMatch(/toren-op-één-na van het hulpvak naar het doelvak/);
    const recept = lees('hanoi/02-patronen.mdx');
    const les = [...recept.matchAll(/^> \d\. verplaats (.*)$/gm)].map((m) => m[1]);
    expect(les).toEqual([
      '`n − 1` schijven van bron naar hulp;',
      'de grootste schijf van bron naar doel;',
      '`n − 1` schijven van hulp naar doel.',
    ]);
  });
});

describe('werkvorm 4 en "voor wie klaar is" op de hand-out kloppen met het spel', () => {
  const T = (n: number): number => 2 ** n - 1;

  it('het recept natellen geeft dezelfde rij als werkvorm 1', () => {
    expect(HANDOUT).toContain('| 2 | 1 + 1 + 1 | 3 |');
    for (const n of [3, 4, 5]) {
      expect(ANTWOORDEN).toContain(`${T(n - 1)} + 1 + ${T(n - 1)} = ${T(n)}`);
    }
  });

  it('de grootste schijf gaat bij zet 2ⁿ⁻¹ van de 2ⁿ − 1', () => {
    const zetten = [2, 3, 4].map((n) => 2 ** (n - 1));
    const totaal = [2, 3, 4].map(T);
    expect(ANTWOORDEN).toContain(
      `zet ${zetten.join(', ').replace(/, (\d+)$/, ' en $1')} van de ${totaal.join(', ').replace(/, (\d+)$/, ' en $1')}`,
    );
  });

  it('de kleinste schijf beweegt om de andere zet', () => {
    // Speel de zetten van het recept na en tel wanneer schijf 1 beweegt.
    const hanoi = (n: number, a: string, c: string, b: string): [string, string][] =>
      n === 0 ? [] : [...hanoi(n - 1, a, b, c), [a, c], ...hanoi(n - 1, b, c, a)];
    for (const n of [3, 4]) {
      const palen: Record<string, number[]> = {
        A: Array.from({ length: n }, (_, i) => n - i),
        B: [],
        C: [],
      };
      const kleinste: number[] = [];
      hanoi(n, 'A', 'C', 'B').forEach(([van, naar], i) => {
        const schijf = palen[van].pop() as number;
        palen[naar].push(schijf);
        if (schijf === 1) kleinste.push(i + 1);
      });
      expect(kleinste).toEqual(kleinste.map((_, i) => 2 * i + 1));
    }
    expect(ANTWOORDEN).toContain('de kleinste schijf beweegt om de andere zet');
  });
});
