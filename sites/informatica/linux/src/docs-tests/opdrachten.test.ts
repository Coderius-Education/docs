import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OPDRACHTEN, maakSessie, volgDoelen } from '../components/LinuxTerminal/opdrachten';
import { LEEG, toets } from '../components/LinuxTerminal/regel';

// Elke opdracht in de oefenterminal (terminal/) heeft een eigen oefenterminal, direct onder de
// opdracht en vóór de tip, met de doelen uit opdrachten.ts erboven. Deze test
// bewaakt dat elke opdracht er een heeft (of een reden waarom niet), dat de
// terminal op zijn plek staat, en dat de doelen eerlijk zijn: het antwoord uit
// de les haalt ze allemaal, zonder de laatste stap niet, en wie alleen wat
// rondkijkt haalt er geen.

const TERMINAL = fileURLToPath(new URL('../../docs/terminal', import.meta.url));

/** Opdrachten zonder terminal, met de reden. */
const ZONDER_TERMINAL: Record<string, string> = {
  '4.1.a': 'je leest een regel die in de les staat; er is niets te typen',
};

type Sectie = { id: string; les: string; tekst: string };

const secties: Sectie[] = readdirSync(TERMINAL)
  .filter((n) => n.endsWith('.mdx'))
  .flatMap((les) => {
    const bron = readFileSync(join(TERMINAL, les), 'utf8');
    return [...bron.matchAll(/^## Opdracht (\d\.\d\.[a-z]):/gm)].map((m) => {
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
  const sessie = maakSessie(OPDRACHTEN[id].bestanden);
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

  // Uit de leerling-doorloop: goede antwoorden die geen vinkje kregen, en
  // foute die het wel kregen. Elk antwoord hier is een reeks regels in een
  // verse terminal met de startbestanden van de opdracht.
  const OOK_GOED: Record<string, string[][]> = {
    '2.1.a': [
      ['wc /etc/passwd', 'tail -n 1 /etc/passwd'],
      ['cat /etc/passwd | wc -l', 'tail -1 /etc/passwd'],
    ],
    '2.2.a': [
      [
        'mkdir lijstjes',
        'cd lijstjes',
        'echo brood > boodschappen.txt',
        'echo kaas >> boodschappen.txt',
        'echo appels >> boodschappen.txt',
        'wc boodschappen.txt',
      ],
    ],
    '2.3.a': [
      ['mkdir oud', 'cp notities.txt oud/kopie.txt', 'mv notities.txt todo.txt', 'rm -r oud', 'ls'],
    ],
    '3.1.a': [
      ['grep inloggen /var/log/apache2/access.log'],
      ['cat /var/log/apache2/access.log | grep inloggen.html'],
    ],
    '3.2.a': [['cd /var/log', "find . -name '*.log'"], ["find / -name '*.log'"]],
    '3.2.b': [['find /var/ -type d'], ['cd /var', 'find . -type d']],
  };
  const NIET_GOED: Record<string, string[][]> = {
    '3.1.a': [
      ['cat /var/log/apache2/access.log'],
      ['grep GET /var/log/apache2/access.log'],
      ['cat /var/log/apache2/access.log | grep .'],
    ],
    '3.2.a': [['find /var/log -type f'], ['find /var/log']],
    '3.2.b': [['find /var'], ['find /var -type f']],
    '2.4.a': [
      [
        'cd downloads',
        'mkdir fotos',
        'mv vakantie1.jpg fotos/',
        'mv vakantie2.jpg fotos/',
        'mv kat.png fotos/',
        'ls fotos',
      ],
      // Twee mv's met een jokerteken: alles staat er, maar niet "met één mv".
      ['cd downloads', 'mkdir fotos', 'mv *.jpg fotos', 'mv *.png fotos', 'ls fotos'],
    ],
  };

  for (const [id, antwoorden] of Object.entries(OOK_GOED)) {
    it(`${id}: ook een ander goed antwoord haalt elk doel`, () => {
      for (const a of antwoorden)
        expect(speel(id, a), a.join(' ; ')).toEqual(OPDRACHTEN[id].doelen.map(() => true));
    });
  }
  for (const [id, antwoorden] of Object.entries(NIET_GOED)) {
    it(`${id}: een fout antwoord haalt niet elk doel`, () => {
      for (const a of antwoorden) expect(speel(id, a).every(Boolean), a.join(' ; ')).toBe(false);
    });
  }

  // Een opdracht om te filteren moet iets wegfilteren: eerst had het
  // logboek van de webserver één regel en eindigde alles in /var/log op .log,
  // zodat cat en find zonder -name hetzelfde gaven als het antwoord.
  const ONGEFILTERD: Record<string, string> = {
    '3.1.a': 'cat /var/log/apache2/access.log',
    '3.2.a': 'find /var/log',
  };
  for (const [id, zonder] of Object.entries(ONGEFILTERD)) {
    it(`${id}: het antwoord geeft minder dan ${zonder}`, () => {
      const sectie = secties.find((x) => x.id === id);
      if (!sectie) throw new Error(id);
      const regels = antwoord(sectie);
      const sessie = maakSessie(OPDRACHTEN[id].bestanden);
      const met = regels.map((r) => sessie.typ(r).stand.uitvoer).at(-1) ?? [];
      const zonderUit = maakSessie(OPDRACHTEN[id].bestanden).typ(zonder).stand.uitvoer;
      expect(met.length).toBeGreaterThan(0);
      expect(met.length).toBeLessThan(zonderUit.length);
    });
  }

  describe('een opdracht die is vastgelopen, zegt dat', () => {
    // Uit de doorloop: wie in 2.4.b eerst `rm *.tmp` typte, kon geen doel
    // meer halen, en de terminal bleef "Doe het in deze volgorde" zeggen.
    const vast = (id: string, regels: string[]) => {
      const opdracht = OPDRACHTEN[id];
      const sessie = maakSessie(opdracht.bestanden);
      let klaar: boolean[] = [];
      let melding: string | null = null;
      for (const regel of regels) {
        const { stand } = sessie.typ(regel);
        klaar = volgDoelen(opdracht, klaar, stand);
        melding = opdracht.vast?.(stand, klaar) ?? null;
      }
      return melding;
    };

    it('2.4.b: de .tmp-bestanden zijn weg voordat je ze bekeken hebt', () => {
      expect(vast('2.4.b', ['cd project', 'rm *.tmp'])).toMatch(/Opnieuw beginnen/);
      expect(vast('2.4.b', ['cd project', 'ls *.tmp', 'rm *'])).toMatch(/Opnieuw beginnen/);
    });

    it('2.4.a: met twee mv-regels lukt "met één mv" niet meer', () => {
      expect(vast('2.4.a', ['cd downloads', 'mkdir fotos', 'mv *.jpg fotos'])).toMatch(
        /Opnieuw beginnen/,
      );
    });

    it('1.2.a: na twee stappen moet je terug naar /var/log', () => {
      expect(vast('1.2.a', ['cd /var/log', 'cd ..', 'cd www/html'])).toMatch(/\/var\/log/);
      expect(vast('1.2.a', ['cd /var/log', 'cd ..', 'cd log'])).toBeNull();
    });

    it('het antwoord uit de les loopt nergens vast', () => {
      for (const s of secties.filter((x) => OPDRACHTEN[x.id]?.vast)) {
        const regels = antwoord(s);
        for (let n = 1; n <= regels.length; n++)
          expect(vast(s.id, regels.slice(0, n)), `${s.id}: ${regels[n - 1]}`).toBeNull();
      }
    });

    it('rondkijken is niet vastlopen', () => {
      for (const id of Object.keys(OPDRACHTEN))
        expect(vast(id, ['pwd', 'ls', 'help']), id).toBeNull();
    });
  });

  it('1.2.a: met een absoluut pad telt de tweede stap niet', () => {
    expect(speel('1.2.a', ['cd /var/log', 'cd /var/www/html', 'cd ~'])).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('2.1.a: het hele bestand laten zien is niet alleen de laatste regel', () => {
    expect(speel('2.1.a', ['cat /etc/passwd'])[1]).toBe(false);
  });

  it('2.3.a: de map oud weggooien telt pas als er een kopie in zat', () => {
    expect(speel('2.3.a', ['ls', 'rm -r oud'])).toEqual([false, false, false, false]);
  });

  it('2.2.a: tellen telt alleen als het bestand klopt', () => {
    expect(
      speel('2.2.a', [
        'mkdir lijstjes',
        'echo brood > lijstjes/boodschappen.txt',
        'echo kaas > lijstjes/boodschappen.txt',
        'wc -l lijstjes/boodschappen.txt',
      ]),
    ).toEqual([true, false, false]);
  });

  it('1.3.b: de toetsen uit de les maken van hots echt hosts', () => {
    // De les zei eerst "drie keer pijltje links" bij hostnme; dat gaf
    // hostanme, en het tweede vinkje kwam nooit.
    const les = readFileSync(join(TERMINAL, 'sneller.mdx'), 'utf8');
    const getallen: Record<string, number> = { een: 1, twee: 2, drie: 3, vier: 4 };
    const keren = [...les.matchAll(/(een|twee|drie|vier) keer (?:op )?pijltje links/g)].map(
      (m) => getallen[m[1]],
    );
    expect(keren.length).toBeGreaterThan(0);
    const sessie = maakSessie();
    sessie.typ('ls /etc/hots');
    for (const n of keren) {
      let stand = toets(LEEG, '\x1b[A', sessie).stand;
      for (let i = 0; i < n; i++) stand = toets(stand, '\x1b[D', sessie).stand;
      expect(toets(stand, 's', sessie).stand.tekst).toBe('ls /etc/hosts');
    }
  });
});
