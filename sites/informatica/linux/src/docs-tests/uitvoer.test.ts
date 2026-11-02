import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OPDRACHTEN, maakSessie } from '../components/LinuxTerminal/opdrachten';

// Elke les in terminal/ belooft wat de oefenterminal laat zien: een ```bash-blok
// met daaronder een ```-blok met de uitvoer. Een leerling legt die uitvoer
// tot op de spatie naast zijn scherm. Deze test typt elk bash-blok, les voor
// les en in volgorde, in één oefenterminal, en vergelijkt de uitvoer met het
// blok eronder. Zo vond de review dat wc -l na drie keer echo 4 zei, en dat
// ls -l in de les een spatie meer had dan de terminal.
//
// Een bash-blok met een # erin (FOUT/GOED) of zonder uitvoerblok eronder
// wordt wel getypt, maar niet vergeleken. Een opdracht heeft een eigen, verse
// terminal (opdrachten.ts): het antwoord van een opdracht draait hier dus ook
// in een verse, en na de opdracht gaat het verder in de terminal van de les.

const TERMINAL = fileURLToPath(new URL('../../docs/terminal', import.meta.url));

type Blok = { taal: string; regels: string[]; ervoor: string };

function blokken(tekst: string): Blok[] {
  const uit: Blok[] = [];
  const regels = tekst.split('\n');
  let ervoor: string[] = [];
  for (let i = 0; i < regels.length; i++) {
    const hek = regels[i].match(/^```(\w*)\s*$/);
    if (!hek) {
      ervoor.push(regels[i]);
      continue;
    }
    const inhoud: string[] = [];
    for (i++; i < regels.length && !/^```\s*$/.test(regels[i]); i++) inhoud.push(regels[i]);
    uit.push({ taal: hek[1], regels: inhoud, ervoor: ervoor.join('\n') });
    ervoor = [];
  }
  return uit;
}

function terminal(bestanden?: object) {
  const sessie = maakSessie(bestanden);
  return (regel: string) => sessie.typ(regel).stand.uitvoer.join('\n');
}

const lessen = readdirSync(TERMINAL).filter((n) => n.endsWith('.mdx'));

describe('wat de lessen in terminal/ beloven, laat de oefenterminal zien', () => {
  for (const les of lessen) {
    it(les, () => {
      const lijst = blokken(readFileSync(join(TERMINAL, les), 'utf8'));
      const lesTerminal = terminal();
      let typ = lesTerminal;
      const fout: string[] = [];
      let vergeleken = 0;
      lijst.forEach((blok, i) => {
        if (blok.taal !== 'bash') return;
        const kop = [...blok.ervoor.matchAll(/^## (.*)$/gm)].pop();
        // Een opdracht begint vers, met de bestanden die er bij die opdracht staan.
        const opdracht = kop?.[1].match(/^Opdracht (\S+):/)?.[1];
        if (kop) typ = opdracht ? terminal(OPDRACHTEN[opdracht]?.bestanden) : lesTerminal;
        const uitvoer = blok.regels
          .map((r) => typ(r))
          .filter(Boolean)
          .join('\n');
        const volgende = lijst[i + 1];
        const meteenErna = volgende && volgende.taal === '' && volgende.ervoor.trim() === '';
        if (!meteenErna || blok.regels.some((r) => r.includes('#'))) return;
        vergeleken++;
        const belofte = volgende.regels.join('\n');
        if (uitvoer !== belofte)
          fout.push(
            `${blok.regels.join(' ; ')}\n  les:      ${JSON.stringify(belofte)}\n  terminal: ${JSON.stringify(uitvoer)}`,
          );
      });
      expect(fout).toEqual([]);
      expect(
        vergeleken,
        'deze les vergelijkt niets: klopt de vorm van de blokken nog?',
      ).toBeGreaterThan(0);
    });
  }

  it('de ls -l uit 4.1 staat zo in de oefenterminal', () => {
    const les = readFileSync(join(TERMINAL, 'rechten.mdx'), 'utf8');
    const uitvoer = terminal()('ls -l /etc').split('\n');
    const blok = blokken(les).find((b) => b.regels.some((r) => r.endsWith(' passwd')));
    expect(blok).toBeDefined();
    for (const regel of blok?.regels ?? []) expect(uitvoer).toContain(regel);
  });
});
