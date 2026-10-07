import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Filters, executeCommand, executeCommandLine, parseCommandLine } from './commands';
import { createFilesystem } from './filesystem';

// De command-injection-lessen (02-command-injection/{low,medium,high}.mdx) laten
// de leerling in deze terminal ontdekken wat `;`, `&&`, `|` en `||` doen, en hoe
// je een filter omzeilt. Die lessen kloppen alleen zolang de simulator zich ook
// echt zo gedraagt. Deze test legt de belofte van de lestekst naast de motor.

const HIER = fileURLToPath(new URL('.', import.meta.url));

/** Verse omgeving met de standaard-filesystem, cwd zoals de terminal start. */
function omgeving() {
  return { cwd: '/home/student', fs: createFilesystem(), setCwd() {}, clear() {} };
}

/** De zichtbare uitvoer van een hele regel: alle niet-gepipete resultaten. */
function voer(regel: string): string {
  return executeCommandLine(regel, omgeving())
    .map((r) => r.output)
    .join('\n');
}

// De filters komen uit dezelfde Filters-export die de lespagina's importeren, dus
// tekst, terminal en test testen letterlijk hetzelfde. De guard onderaan bewaakt
// dat de pagina's die export ook echt gebruiken.
const mediumFilter = Filters.medium;
const highFilter = Filters.high;

describe('parseCommandLine', () => {
  it('splitst op de scheidingstekens en onthoudt de operator', () => {
    const delen = parseCommandLine('ping 127.0.0.1; ls');
    expect(delen).toEqual([
      { cmd: 'ping 127.0.0.1', operator: ';' },
      { cmd: 'ls', operator: null },
    ]);
  });

  it('herkent &&, || en | als losse operatoren', () => {
    expect(parseCommandLine('a && b').map((d) => d.operator)).toEqual(['&&', null]);
    expect(parseCommandLine('a || b').map((d) => d.operator)).toEqual(['||', null]);
    expect(parseCommandLine('a | b').map((d) => d.operator)).toEqual(['|', null]);
  });

  it('splitst niet op een scheidingsteken binnen aanhalingstekens', () => {
    const delen = parseCommandLine('echo "a; b" | grep a');
    expect(delen.map((d) => d.cmd)).toEqual(['echo "a; b"', 'grep a']);
    expect(delen.map((d) => d.operator)).toEqual(['|', null]);
  });
});

describe('executeCommand', () => {
  it('geeft exitcode 127 en een bash-melding voor een onbekend commando', () => {
    const r = executeCommand('bestaatniet', omgeving());
    expect(r.exitCode).toBe(127);
    expect(r.output).toBe('bash: bestaatniet: command not found');
  });
});

describe('operator-semantiek', () => {
  it('; voert het tweede commando altijd uit', () => {
    const r = executeCommandLine('whoami; pwd', omgeving());
    expect(r).toHaveLength(2);
    expect(r[0].output).toBe('student');
    expect(r[1].output).toBe('/home/student');
  });

  it('&& stopt zodra het eerste commando faalt', () => {
    const r = executeCommandLine('cat /bestaatniet && pwd', omgeving());
    expect(r).toHaveLength(1);
    expect(r[0].output).toContain('No such file or directory');
  });

  it('&& gaat door na een geslaagd eerste commando', () => {
    const r = executeCommandLine('whoami && pwd', omgeving());
    expect(r.map((x) => x.output)).toEqual(['student', '/home/student']);
  });

  it('|| slaat het tweede commando over als het eerste slaagt', () => {
    const r = executeCommandLine('whoami || ls', omgeving());
    expect(r).toHaveLength(1);
    expect(r[0].output).toBe('student');
  });

  it('|| voert het tweede commando pas uit als het eerste faalt', () => {
    const uit = voer('cat /bestaatniet || whoami');
    expect(uit).toContain('No such file or directory');
    expect(uit).toContain('student');
  });

  it('| geeft de uitvoer van het eerste commando door als invoer aan het tweede', () => {
    // grep krijgt "student" via de pipe binnen; de uitvoer van whoami zelf wordt
    // opgeslokt en verschijnt niet als los resultaat.
    const r = executeCommandLine('whoami | grep student', omgeving());
    expect(r).toHaveLength(1);
    expect(r[0].output).toBe('student');
  });
});

describe('command-injection: wat de lessen beloven', () => {
  it('low — "127.0.0.1; ls" toont ping-uitvoer én de bestandslijst', () => {
    const uit = voer('ping 127.0.0.1; ls');
    expect(uit).toContain('PING');
    expect(uit).toContain('notities.txt');
  });

  it('medium — het filter haalt de puntkomma weg, dus ls draait niet meer', () => {
    const uit = voer(mediumFilter('ping 127.0.0.1; ls'));
    expect(uit).toContain('PING');
    expect(uit).not.toContain('notities.txt');
  });

  it('medium — de pipe glipt langs het filter en toont alleen de bestandslijst', () => {
    const uit = voer(mediumFilter('ping 127.0.0.1 | ls'));
    expect(uit).toContain('notities.txt');
    expect(uit).not.toContain('PING');
  });

  it('medium — "127.0.0.1 || ls" toont alleen de ping, want de ping slaagt', () => {
    const uit = voer(mediumFilter('ping 127.0.0.1 || ls'));
    expect(uit).toContain('PING');
    expect(uit).not.toContain('notities.txt');
  });

  it('high — "| " (met spatie) wordt gefilterd, dus de pipe werkt niet meer', () => {
    const uit = voer(highFilter('ping 127.0.0.1 | ls'));
    expect(uit).toContain('PING');
    expect(uit).not.toContain('notities.txt');
  });

  it('high — "|ls" (zonder spatie) glipt er wél door en toont de bestandslijst', () => {
    const uit = voer(highFilter('ping 127.0.0.1|ls'));
    expect(uit).toContain('notities.txt');
  });
});

describe('bekende beperking van de simulator', () => {
  it('ping slaagt altijd — reikbaarheid wordt niet gecontroleerd', () => {
    // Hierdoor kan de terminal het voorbeeld "1 || ls" uit medium.mdx §6 (falende
    // ping, dus ls draait) niet naspelen: op een echte DVWA faalt `ping 1`, hier
    // niet. Verandert dit ooit, dan mag dat lesvoorbeeld ook in de terminal.
    expect(executeCommand('ping 1', omgeving()).exitCode).toBe(0);
  });
});

describe('de lespaginas gebruiken de geteste Filters-export', () => {
  const CI = '../../../docs/dvwa_tutorial/02-command-injection';
  const lees = (bestand: string) =>
    readFileSync(fileURLToPath(new URL(`${CI}/${bestand}`, import.meta.url)), 'utf8');

  it('medium.mdx importeert Filters en voedt de terminal met Filters.medium', () => {
    const bron = lees('medium.mdx');
    expect(bron).toContain("import { Filters } from '@site/src/components/LinuxTerminal/commands'");
    expect(bron).toContain('filter={Filters.medium}');
  });

  it('high.mdx importeert Filters en voedt de terminal met Filters.high', () => {
    const bron = lees('high.mdx');
    expect(bron).toContain("import { Filters } from '@site/src/components/LinuxTerminal/commands'");
    expect(bron).toContain('filter={Filters.high}');
  });
});
