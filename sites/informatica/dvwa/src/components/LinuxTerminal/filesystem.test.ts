import { describe, expect, it, vi } from 'vitest';
import { executeCommand } from './commands';
import { createFilesystem, listDir, readFile, resolvePath } from './filesystem';

// De command-injection-lessen laten de leerling met `cd`, `ls` en `cat` door
// dit namaak-bestandssysteem lopen (`cat /etc/passwd`, `cat ../../etc/shadow`).
// Een pad dat verkeerd oplost of een `cd` in een bestand dat stilzwijgend
// slaagt, laat de terminal iets anders vertellen dan de les belooft. Deze test
// pint de padlogica en de foutmeldingen die de lessen citeren.

describe('resolvePath', () => {
  it('laat een absoluut pad ongemoeid, wat de cwd ook is', () => {
    expect(resolvePath('/home/student', '/etc/passwd')).toBe('/etc/passwd');
  });

  it('plakt een relatief pad achter de cwd', () => {
    expect(resolvePath('/home/student', 'notities.txt')).toBe('/home/student/notities.txt');
  });

  it('verwerkt . en .. zoals een echte shell', () => {
    expect(resolvePath('/home/student', './../student/../../etc/./passwd')).toBe('/etc/passwd');
  });

  it('blijft op de root staan als .. boven de root uitkomt', () => {
    expect(resolvePath('/', '../../..')).toBe('/');
    expect(resolvePath('/home', '../../../etc')).toBe('/etc');
  });

  it('negeert een slash aan het einde', () => {
    expect(resolvePath('/', '/var/www/')).toBe('/var/www');
    expect(resolvePath('/', '/')).toBe('/');
  });
});

describe('listDir', () => {
  it('geeft de namen gesorteerd terug met een dir-vlag', () => {
    const fs = createFilesystem();
    const r = listDir(fs, '/var/www/html');
    expect(r.error).toBeUndefined();
    expect(r.entries).toEqual([
      { name: '.htaccess', isDir: false },
      { name: 'config', isDir: true },
      { name: 'index.php', isDir: false },
      { name: 'login.php', isDir: false },
    ]);
  });

  it('weigert een bestand met "Not a directory"', () => {
    const r = listDir(createFilesystem(), '/etc/passwd');
    expect(r.error).toBe("ls: cannot access '/etc/passwd': Not a directory");
  });
});

describe('readFile', () => {
  it('geeft de inhoud van een bestand terug', () => {
    const r = readFile(createFilesystem(), '/etc/hostname');
    expect(r.content).toBe('dvwa-lab');
  });

  it('meldt een ontbrekend bestand als "No such file or directory"', () => {
    const r = readFile(createFilesystem(), '/etc/bestaatniet');
    expect(r.error).toBe('cat: /etc/bestaatniet: No such file or directory');
  });

  it('weigert een map met "Is a directory"', () => {
    const r = readFile(createFilesystem(), '/etc');
    expect(r.error).toBe('cat: /etc: Is a directory');
  });

  it('weigert /etc/shadow met "Permission denied"', () => {
    const r = readFile(createFilesystem(), '/etc/shadow');
    expect(r.error).toBe('cat: /etc/shadow: Permission denied');
  });
});

describe('cd via executeCommand', () => {
  it('weigert een bestand met exitcode 1 en verandert de cwd niet', () => {
    const setCwd = vi.fn();
    const env = { cwd: '/home/student', fs: createFilesystem(), setCwd, clear() {} };
    const r = executeCommand('cd /etc/passwd', env);
    expect(r.exitCode).toBe(1);
    expect(r.output).toBe('bash: cd: /etc/passwd: Not a directory');
    expect(setCwd).not.toHaveBeenCalled();
  });
});

describe('createFilesystem', () => {
  it('voegt extra bestanden toe zonder de standaardbestanden kwijt te raken', () => {
    const fs = createFilesystem({ home: { student: { 'geheim.txt': 'flag{x}' } } });
    expect(readFile(fs, '/home/student/geheim.txt').content).toBe('flag{x}');
    expect(readFile(fs, '/home/student/notities.txt').content).toContain('TODO');
  });

  it('geeft elke aanroep een eigen diepe kopie', () => {
    const a = createFilesystem();
    const b = createFilesystem();
    a.etc.hostname = 'gewijzigd';
    expect(b.etc.hostname).toBe('dvwa-lab');
    expect(a).not.toBe(b);
  });
});
