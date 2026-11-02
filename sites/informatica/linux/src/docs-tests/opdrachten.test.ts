import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OPDRACHTEN, maakSessie, volgDoelen } from '../components/LinuxTerminal/opdrachten';

// Elke opdracht in deel 1 heeft een eigen oefenterminal, direct onder de
// opdracht en vóór de tip, met de doelen uit opdrachten.ts erboven. Deze test
// bewaakt dat elke opdracht er een heeft (of een reden waarom niet), dat de
// terminal op zijn plek staat, en dat de doelen eerlijk zijn: het antwoord uit
// de les haalt ze allemaal, zonder de laatste stap niet, en wie alleen wat
// rondkijkt haalt er geen.

const TERMINAL = fileURLToPath(new URL('../../docs/terminal', import.meta.url));

/** Opdrachten zonder terminal, met de reden. */
const ZONDER_TERMINAL: Record<string, string> = {
  '1.7.a': 'je leest een regel die in de les staat; er is niets te typen',
};

type Sectie = { id: string; les: string; tekst: string };

const secties: Sectie[] = readdirSync(TERMINAL)
  .filter((n) => n.endsWith('.mdx'))
  .flatMap((les) => {
    const bron = readFileSync(join(TERMINAL, les), 'utf8');
    return [...bron.matchAll(/^## Opdracht (1\.\d\.[a-z]):/gm)].map((m) => {
      const start = m.index ?? 0;
      const einde = bron.indexOf('\n## ', start + 1);
      return { id: m[1], les, tekst: bron.slice(start, einde === -1 ? undefined : einde) };
    });
  });

function antwoord(s: Sectie): string[] {
  const na = s.tekst.split('<summary>Klik hier voor het antwoord</summary>')[1] ?? '';
  const blok = na.match(/```bash\n([\s\S]*?)```/);
  return (blok?.[1] ?? '').split('\n').filter((r) => r.trim() && !r.trim().startsWith('#'));
}

function speel(id: string, regels: string[]): boolean[] {
  const sessie = maakSessie();
  let klaar: boolean[] = [];
  for (const regel of regels) klaar = volgDoelen(OPDRACHTEN[id], klaar, sessie.typ(regel).stand);
  return OPDRACHTEN[id].doelen.map((_, i) => klaar[i] ?? false);
}

describe('een terminal per opdracht', () => {
  it('elke opdracht heeft doelen in opdrachten.ts, of een reden waarom niet', () => {
    const ids = secties.map((s) => s.id).sort();
    expect([...Object.keys(OPDRACHTEN), ...Object.keys(ZONDER_TERMINAL)].sort()).toEqual(ids);
  });

  it('de terminal staat in zijn eigen opdracht, onder de tekst en vóór de tip', () => {
    const fout: string[] = [];
    for (const s of secties) {
      const tags = [...s.tekst.matchAll(/<LinuxTerminal opdracht="([^"]+)" \/>/g)];
      const tip = s.tekst.indexOf('<details>');
      if (s.id in ZONDER_TERMINAL) {
        if (tags.length) fout.push(`${s.id}: staat in ZONDER_TERMINAL maar heeft een terminal`);
        continue;
      }
      if (tags.length !== 1 || tags[0][1] !== s.id) fout.push(`${s.id}: niet één eigen terminal`);
      else if ((tags[0].index ?? 0) > tip) fout.push(`${s.id}: terminal na de tip`);
    }
    expect(fout).toEqual([]);
  });

  it('geen terminal met een opdracht buiten die opdracht', () => {
    const totaal = readdirSync(TERMINAL)
      .filter((n) => n.endsWith('.mdx'))
      .flatMap((les) => [
        ...readFileSync(join(TERMINAL, les), 'utf8').matchAll(/<LinuxTerminal opdracht=/g),
      ]).length;
    expect(totaal).toBe(Object.keys(OPDRACHTEN).length);
  });

  it('geen opdracht vraagt nog om de pagina te herladen', () => {
    for (const s of secties) expect(s.tekst, s.id).not.toMatch(/herlaad/);
  });

  for (const s of secties.filter((x) => x.id in OPDRACHTEN)) {
    describe(s.id, () => {
      const regels = antwoord(s);

      it('het antwoord uit de les haalt elk doel', () => {
        expect(regels.length).toBeGreaterThan(0);
        expect(speel(s.id, regels)).toEqual(OPDRACHTEN[s.id].doelen.map(() => true));
      });

      it('zonder de laatste regel van het antwoord is hij niet klaar', () => {
        expect(speel(s.id, regels.slice(0, -1)).every(Boolean)).toBe(false);
      });

      it('rondkijken haalt geen doel', () => {
        expect(speel(s.id, ['help', 'pwd', 'ls']).some(Boolean)).toBe(false);
      });
    });
  }

  it('1.2.a: met een absoluut pad telt de tweede stap niet', () => {
    expect(speel('1.2.a', ['cd /var/log', 'cd /var/www/html', 'cd ~'])).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('1.3.a: het hele bestand laten zien is niet alleen de laatste regel', () => {
    expect(speel('1.3.a', ['cat /etc/passwd'])[1]).toBe(false);
  });

  it('1.5.a: de map oud weggooien telt pas als er een kopie in zat', () => {
    expect(speel('1.5.a', ['ls', 'rm -r oud'])).toEqual([false, false, false, false]);
  });

  it('1.4.a: tellen telt alleen als het bestand klopt', () => {
    expect(
      speel('1.4.a', [
        'mkdir lijstjes',
        'echo brood > lijstjes/boodschappen.txt',
        'echo kaas > lijstjes/boodschappen.txt',
        'wc -l lijstjes/boodschappen.txt',
      ]),
    ).toEqual([true, false, false]);
  });
});
