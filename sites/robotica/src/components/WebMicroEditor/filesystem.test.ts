import { describe, expect, it } from 'vitest';
import { BoardFS } from './filesystem';
import type { SerialClient } from './serial';

// BoardFS praat met het board door Python-snippets te laten draaien. De tests
// vangen die snippets af met een nagemaakte SerialClient: zo controleren we
// dat de gegenereerde Python klopt (paden veilig gequote, base64 in stukken)
// zonder board.

type Antwoord = { stdout: string; stderr: string };

function nepSerial(antwoord: Antwoord | ((code: string) => Antwoord)) {
  const codes: string[] = [];
  const client = {
    runCode: async (code: string) => {
      codes.push(code);
      return typeof antwoord === 'function' ? antwoord(code) : antwoord;
    },
  } as unknown as SerialClient;
  return { client, codes };
}

const OK: Antwoord = { stdout: 'OK\n', stderr: '' };

describe('BoardFS', () => {
  it('maakt bovenliggende mappen aan vóór het schrijven', async () => {
    const { client, codes } = nepSerial(OK);
    await new BoardFS(client).writeFile('/lib/leaphymicropython/sensors/tof.py', 'x = 1\n');

    // eerste snippet: mkdir van elke tussenmap, in volgorde
    expect(codes[0]).toContain(
      "'/lib', '/lib/leaphymicropython', '/lib/leaphymicropython/sensors'",
    );
    expect(codes).toHaveLength(2);
  });

  it('slaat de mkdir-stap over voor een bestand in de root', async () => {
    const { client, codes } = nepSerial(OK);
    await new BoardFS(client).writeFile('main.py', 'x = 1\n');

    expect(codes).toHaveLength(1);
    expect(codes[0]).toContain("open('main.py', 'wb')");
  });

  it('schrijft inhoud als base64 die terugleest naar exact dezelfde bytes', async () => {
    const { client, codes } = nepSerial(OK);
    const inhoud = "from machine import Pin\n\nlampje = Pin('LED', Pin.OUT)\n";
    await new BoardFS(client).writeFile('main.py', inhoud);

    const stukken = [...codes[0].matchAll(/a2b_base64\('([^']*)'\)/g)].map((m) => m[1]);
    expect(stukken.length).toBeGreaterThan(0);
    expect(atob(stukken.join(''))).toBe(inhoud);
  });

  it('hakt grote bestanden in base64-stukken van maximaal 1024 tekens', async () => {
    const { client, codes } = nepSerial(OK);
    await new BoardFS(client).writeFile('groot.py', 'a'.repeat(3000));

    const stukken = [...codes[0].matchAll(/a2b_base64\('([^']*)'\)/g)].map((m) => m[1]);
    expect(stukken.length).toBeGreaterThan(1);
    for (const stuk of stukken) expect(stuk.length).toBeLessThanOrEqual(1024);
    expect(atob(stukken.join(''))).toBe('a'.repeat(3000));
  });

  it('quote apostrofs en backslashes in paden veilig', async () => {
    const { client, codes } = nepSerial(OK);
    await new BoardFS(client).writeFile("d'or\\test.py", 'x = 1');

    expect(codes[0]).toContain("open('d\\'or\\\\test.py', 'wb')");
  });

  it('leest een bestand terug uit base64-stdout', async () => {
    const { client } = nepSerial({ stdout: `${btoa('hoi board')}\n`, stderr: '' });
    const bytes = await new BoardFS(client).readFile('/main.py');

    expect(new TextDecoder().decode(bytes)).toBe('hoi board');
  });

  it('zet een listdir-uitvoer om naar namen met map-vlag', async () => {
    const { client } = nepSerial({ stdout: 'main.py\tf\nlib\td\n\n', stderr: '' });
    const items = await new BoardFS(client).listdir('/');

    expect(items).toEqual([
      { name: 'main.py', isDir: false },
      { name: 'lib', isDir: true },
    ]);
  });

  it('vertaalt stderr van het board naar een fout met het pad erin', async () => {
    const { client } = nepSerial({ stdout: '', stderr: 'OSError: [Errno 2] ENOENT\n' });

    await expect(new BoardFS(client).readFile('/bestaat-niet.py')).rejects.toThrow(
      'readFile(/bestaat-niet.py)',
    );
  });

  it('eist een expliciete OK van het board bij schrijven', async () => {
    const { client } = nepSerial({ stdout: '', stderr: '' });

    await expect(new BoardFS(client).writeFile('main.py', 'x')).rejects.toThrow(
      'writeFile kreeg geen OK',
    );
  });
});
