import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { executeCommandLine } from '../components/LinuxTerminal/commands';
import { createFilesystem } from '../components/LinuxTerminal/filesystem';

// Deel 1 belooft in elke les wat de oefenterminal laat zien: een ```bash-blok
// met daaronder een ```-blok met de uitvoer. Een leerling legt die uitvoer
// tot op de spatie naast zijn scherm. Deze test typt elk bash-blok, les voor
// les en in volgorde, in één oefenterminal, en vergelijkt de uitvoer met het
// blok eronder. Zo vond de review dat wc -l na drie keer echo 4 zei, en dat
// ls -l in de les een spatie meer had dan de terminal.
//
// Een bash-blok met een # erin (FOUT/GOED) of zonder uitvoerblok eronder
// wordt wel getypt, maar niet vergeleken. Een opdracht die begint in een
// "verse oefenterminal" begint hier ook met een verse.

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

function terminal() {
  const env = {
    cwd: '/home/student',
    fs: createFilesystem(),
    setCwd(nieuw: string) {
      env.cwd = nieuw;
    },
    clear() {},
  };
  return (regel: string) =>
    executeCommandLine(regel, env)
      .map((r) => r.output.replace(/\n$/, ''))
      .filter(Boolean)
      .join('\n')
      // Kleur weg: in de les staat de tekst zonder.
      .replace(/\x1b\[[0-9;]*m/g, '');
}

const lessen = readdirSync(TERMINAL).filter((n) => n.endsWith('.mdx'));

describe('wat deel 1 belooft, laat de oefenterminal zien', () => {
  for (const les of lessen) {
    it(les, () => {
      const lijst = blokken(readFileSync(join(TERMINAL, les), 'utf8'));
      let typ = terminal();
      const fout: string[] = [];
      let vergeleken = 0;
      lijst.forEach((blok, i) => {
        if (blok.taal !== 'bash') return;
        if (/verse oefenterminal/.test(blok.ervoor) || /verse oefenterminal/.test(lijst[i - 1]?.ervoor ?? ''))
          typ = terminal();
        const uitvoer = blok.regels.map((r) => typ(r)).filter(Boolean).join('\n');
        const volgende = lijst[i + 1];
        const meteenErna = volgende && volgende.taal === '' && volgende.ervoor.trim() === '';
        if (!meteenErna || blok.regels.some((r) => r.includes('#'))) return;
        vergeleken++;
        const belofte = volgende.regels.join('\n');
        if (uitvoer !== belofte) fout.push(`${blok.regels.join(' ; ')}\n  les:      ${JSON.stringify(belofte)}\n  terminal: ${JSON.stringify(uitvoer)}`);
      });
      expect(fout).toEqual([]);
      expect(vergeleken, 'deze les vergelijkt niets: klopt de vorm van de blokken nog?').toBeGreaterThan(0);
    });
  }

  it('de ls -l uit 1.7 staat zo in de oefenterminal', () => {
    const les = readFileSync(join(TERMINAL, 'rechten.mdx'), 'utf8');
    const uitvoer = terminal()('ls -l /etc').split('\n');
    const blok = blokken(les).find((b) => b.regels.some((r) => r.endsWith(' passwd')));
    expect(blok).toBeDefined();
    for (const regel of blok?.regels ?? []) expect(uitvoer).toContain(regel);
  });
});
