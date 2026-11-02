import { describe, expect, it } from 'vitest';
import { executeCommand, executeCommandLine, parseCommandLine } from './commands';
import { createFilesystem } from './filesystem';

// De shell-semantiek van de oefenterminal in de Linux-cursus: `;`, `&&`, `||`
// en `|`, zoals bash ze uitvoert. Wat de lessen over schrijven, rechten en
// foutmeldingen beloven, staat in schrijven.test.ts.

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

describe('bekende beperking van de simulator', () => {
  it('ping slaagt altijd: bereikbaarheid wordt niet gecontroleerd', () => {
    expect(executeCommand('ping 1', omgeving()).exitCode).toBe(0);
  });
});

describe('regels tellen zoals wc en tail', () => {
  it('drie regels met echo en >> zijn drie regels, en tail -n 1 geeft de laatste', () => {
    const env = omgeving();
    executeCommandLine('echo brood > l.txt; echo kaas >> l.txt; echo appels >> l.txt', env);
    expect(executeCommandLine('wc -l l.txt', env)[0].output).toBe('3 l.txt');
    expect(executeCommandLine('tail -n 1 l.txt', env)[0].output).toBe('appels');
    expect(executeCommandLine('wc -l /etc/passwd', env)[0].output).toBe('7 /etc/passwd');
  });
});
