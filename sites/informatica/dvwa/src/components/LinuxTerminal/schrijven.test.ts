import { describe, expect, it } from 'vitest';
import { executeCommandLine } from './commands';
import { createFilesystem, promptPad, readFile, resolvePath } from './filesystem';

// De Linux-cursus (docs/linux/) laat een leerling in deze terminal mappen en
// bestanden maken, kopiëren, verplaatsen en weggooien, en belooft daarbij de
// foutmeldingen van een echte Ubuntu. Deze test legt die beloftes vast. De
// meldingen zijn nagespeeld in bash met GNU coreutils 9 (Ubuntu 24.04):
// mkdir quoteert met ‘…’, de rest met '…'. Rechten nagespeeld als gewone
// gebruiker (niet root).

/** Eén terminal: dezelfde fs en cwd over meerdere regels, zoals in de browser. */
function terminal() {
  const env = {
    cwd: '/home/student',
    fs: createFilesystem(),
    setCwd(nieuw: string) {
      env.cwd = nieuw;
    },
    clear() {},
  };
  const typ = (regel: string) =>
    executeCommandLine(regel, env)
      .map((r) => r.output)
      .filter(Boolean)
      .join('\n');
  const inhoud = (pad: string) => readFile(env.fs, resolvePath(env.cwd, pad)).content;
  return { env, typ, inhoud };
}

describe('mappen en bestanden maken', () => {
  it('mkdir maakt een map waar je met cd in kunt', () => {
    const t = terminal();
    expect(t.typ('mkdir project')).toBe('');
    t.typ('cd project');
    expect(t.typ('pwd')).toBe('/home/student/project');
  });

  it('mkdir zonder -p weigert een map in een map die er nog niet is; met -p niet', () => {
    const t = terminal();
    expect(t.typ('mkdir a/b')).toBe(
      'mkdir: cannot create directory ‘a/b’: No such file or directory',
    );
    expect(t.typ('mkdir -p a/b')).toBe('');
    expect(t.typ('ls a')).toContain('b');
  });

  it('mkdir op een bestaande naam geeft File exists', () => {
    const t = terminal();
    t.typ('mkdir project');
    expect(t.typ('mkdir project')).toBe('mkdir: cannot create directory ‘project’: File exists');
  });

  it('touch maakt een leeg bestand, en laat een bestaand bestand heel', () => {
    const t = terminal();
    t.typ('touch leeg.txt');
    expect(t.inhoud('leeg.txt')).toBe('');
    t.typ('touch notities.txt');
    expect(t.inhoud('notities.txt')).toContain('TODO');
  });

  it('buiten je thuismap en /tmp mag je niet schrijven', () => {
    const t = terminal();
    expect(t.typ('touch /etc/mijn.txt')).toBe(
      "touch: cannot touch '/etc/mijn.txt': Permission denied",
    );
    expect(t.typ('mkdir /etc/map')).toBe(
      'mkdir: cannot create directory ‘/etc/map’: Permission denied',
    );
    expect(t.typ('echo hoi > /etc/hoi.txt')).toBe('bash: /etc/hoi.txt: Permission denied');
    expect(t.typ('touch /tmp/mag.txt')).toBe('');
  });
});

describe('> en >>', () => {
  it('> zet de uitvoer in een bestand in plaats van op het scherm', () => {
    const t = terminal();
    expect(t.typ('echo hallo > groet.txt')).toBe('');
    expect(t.typ('cat groet.txt')).toBe('hallo\n');
  });

  it('> overschrijft, >> vult aan', () => {
    const t = terminal();
    t.typ('echo een > lijst.txt');
    t.typ('echo twee >> lijst.txt');
    expect(t.inhoud('lijst.txt')).toBe('een\ntwee\n');
    t.typ('echo drie > lijst.txt');
    expect(t.inhoud('lijst.txt')).toBe('drie\n');
  });

  it('een > binnen aanhalingstekens is gewone tekst', () => {
    const t = terminal();
    expect(t.typ('echo "a > b"')).toBe('a > b');
  });

  it('werkt na een pipe: alleen de laatste uitvoer gaat het bestand in', () => {
    const t = terminal();
    t.typ('cat /etc/passwd | grep student > ik.txt');
    expect(t.inhoud('ik.txt')).toBe('student:x:1000:1000:student:/home/student:/bin/bash\n');
  });

  it('ls naar een pipe of een bestand geeft één naam per regel', () => {
    const t = terminal();
    expect(t.typ('ls /etc | grep host')).toBe('hostname\nhosts');
    t.typ('ls /var > lijst.txt');
    expect(t.inhoud('lijst.txt')).toBe('log\nwww\n');
  });

  it('een foutmelding komt op het scherm, niet in het bestand', () => {
    const t = terminal();
    expect(t.typ('cat bestaatniet.txt > uit.txt')).toBe(
      'cat: bestaatniet.txt: No such file or directory',
    );
    expect(t.inhoud('uit.txt')).toBe('');
  });
});

describe('kopiëren, verplaatsen en weggooien', () => {
  it('cp maakt een kopie, het origineel blijft', () => {
    const t = terminal();
    t.typ('cp notities.txt kopie.txt');
    expect(t.inhoud('kopie.txt')).toBe(t.inhoud('notities.txt'));
  });

  it('cp en mv naar een map zetten het bestand in die map', () => {
    const t = terminal();
    t.typ('mkdir oud');
    t.typ('cp notities.txt oud');
    expect(t.inhoud('oud/notities.txt')).toContain('TODO');
    t.typ('mv notities.txt oud/verplaatst.txt');
    expect(t.typ('ls')).not.toContain('notities.txt');
    expect(t.inhoud('oud/verplaatst.txt')).toContain('TODO');
  });

  it('mv is ook hernoemen, en verplaatst een hele map', () => {
    const t = terminal();
    t.typ('mkdir -p a/b');
    t.typ('touch a/b/c.txt');
    t.typ('mv a z');
    expect(t.inhoud('z/b/c.txt')).toBe('');
    expect(t.typ('ls a')).toBe("ls: cannot access 'a': No such file or directory");
  });

  it('cp van een bestand dat er niet is', () => {
    const t = terminal();
    expect(t.typ('cp nergens.txt hier.txt')).toBe(
      "cp: cannot stat 'nergens.txt': No such file or directory",
    );
  });

  it('rm gooit een bestand weg, een map alleen met -r', () => {
    const t = terminal();
    t.typ('mkdir map');
    expect(t.typ('rm map')).toBe("rm: cannot remove 'map': Is a directory");
    expect(t.typ('rm -r map')).toBe('');
    expect(t.typ('rm notities.txt')).toBe('');
    expect(t.typ('cat notities.txt')).toBe('cat: notities.txt: No such file or directory');
  });

  it('rm buiten je thuismap: Permission denied', () => {
    const t = terminal();
    expect(t.typ('rm /etc/passwd')).toBe("rm: cannot remove '/etc/passwd': Permission denied");
    expect(t.inhoud('/etc/passwd')).toContain('root');
    expect(t.typ('mv /etc/hostname /tmp/')).toBe(
      "mv: cannot move '/etc/hostname' to '/tmp/hostname': Permission denied",
    );
    expect(t.typ('cp /etc/hostname /etc/k')).toBe(
      "cp: cannot create regular file '/etc/k': Permission denied",
    );
  });
});

describe('randgevallen zoals een echte Ubuntu (nagespeeld als gewone gebruiker)', () => {
  it('/tmp zelf en je thuismap zelf mag je niet weghalen of verplaatsen', () => {
    const t = terminal();
    expect(t.typ('rm -r /tmp')).toBe("rm: cannot remove '/tmp': Permission denied");
    expect(t.typ('mv ~ /tmp/weg')).toBe(
      "mv: cannot move '/home/student' to '/tmp/weg': Permission denied",
    );
    expect(t.typ('ls /')).toContain('tmp');
    expect(t.typ('pwd')).toBe('/home/student');
  });

  it('mv van een map in zichzelf weigert, en de map blijft', () => {
    const t = terminal();
    t.typ('mkdir a');
    expect(t.typ('mv a a/b')).toBe("mv: cannot move 'a' to a subdirectory of itself, 'a/b'");
    expect(t.typ('ls')).toContain('a');
  });

  it('een / aan het eind belooft een map', () => {
    const t = terminal();
    expect(t.typ('cp notities.txt nergens/')).toBe(
      "cp: cannot create regular file 'nergens/': Not a directory",
    );
    expect(t.typ('mv notities.txt nergens/')).toBe(
      "mv: cannot move 'notities.txt' to 'nergens/': Not a directory",
    );
    expect(t.typ('ls')).not.toContain('nergens');
  });

  it('rm -f zwijgt over wat er niet is', () => {
    const t = terminal();
    expect(t.typ('rm -f bestaatniet')).toBe('');
  });

  it('grep met een ongeldig patroon geeft een melding en de terminal gaat door', () => {
    const t = terminal();
    expect(t.typ('grep [ notities.txt')).toBe('grep: Invalid regular expression');
    expect(t.typ('pwd')).toBe('/home/student');
  });

  it('ls van een bestand noemt het bestand', () => {
    const t = terminal();
    expect(t.typ('ls notities.txt')).toBe('notities.txt');
    expect(t.typ('ls -l notities.txt')).toMatch(/^-rw-r--r-- +1 student student .* notities.txt$/);
    expect(t.typ('ls -l /etc/passwd')).toMatch(/^-rw-r--r-- +1 root +root .* \/etc\/passwd$/);
  });
});

describe('paden en meldingen zoals bash', () => {
  it('~ is je thuismap, ook midden in een pad', () => {
    const t = terminal();
    t.typ('cd /etc');
    expect(t.typ('cat ~/notities.txt')).toContain('TODO');
    t.typ('cd ~');
    expect(t.typ('pwd')).toBe('/home/student');
  });

  it('een cd geldt voor de commando’s erna op dezelfde regel', () => {
    const t = terminal();
    expect(t.typ('cd /etc; pwd')).toBe('/etc');
  });

  it('de prompt toont je thuismap als ~, ook als begin van een pad', () => {
    expect(promptPad('/home/student')).toBe('~');
    expect(promptPad('/home/student/project')).toBe('~/project');
    expect(promptPad('/home/studentje')).toBe('/home/studentje');
    expect(promptPad('/var/www')).toBe('/var/www');
  });

  it('ls van een map die er niet is: No such file or directory', () => {
    const t = terminal();
    expect(t.typ('ls nergens')).toBe("ls: cannot access 'nergens': No such file or directory");
  });

  it('head, tail en wc noemen zichzelf en het pad zoals je het typte', () => {
    const t = terminal();
    expect(t.typ('head x.txt')).toBe(
      "head: cannot open 'x.txt' for reading: No such file or directory",
    );
    expect(t.typ('tail x.txt')).toBe(
      "tail: cannot open 'x.txt' for reading: No such file or directory",
    );
    expect(t.typ('wc x.txt')).toBe('wc: x.txt: No such file or directory');
  });

  it('ls -l: van jou in je thuismap, van root in /etc', () => {
    const t = terminal();
    expect(t.typ('ls -l')).toContain('student student');
    expect(t.typ('ls -l /etc')).toMatch(/-rw-r--r-- +1 root +root .*passwd/);
    expect(t.typ('ls -l /etc')).toMatch(/-rw-r----- +1 root +shadow .*shadow/);
    expect(t.typ('ls -l /')).toMatch(/drwx------ +1 root +root .*root/);
  });
});
