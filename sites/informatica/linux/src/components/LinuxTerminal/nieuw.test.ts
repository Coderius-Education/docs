import { describe, expect, it } from 'vitest';
import { vulAan } from './aanvullen';
import { maakSessie } from './opdrachten';
import { LEEG, toets } from './regel';

// Jokertekens, ls/cp/mv/grep met meer namen, find, history, Tab en het
// bewerken van de regel. Elke verwachte uitvoer is nagedraaid op Ubuntu 24.04
// (bash 5.2, coreutils 9.4, findutils 4.9) met LANG=C.UTF-8, de standaard in
// WSL. Dat bepaalt de ‘…’ van find.

function terminal() {
  const sessie = maakSessie();
  const typ = (regel: string) => sessie.typ(regel).stand.uitvoer.join('\n');
  return { sessie, typ };
}

function metBestanden() {
  const t = terminal();
  t.typ('mkdir project project/sub');
  t.typ('echo hoi > a.txt');
  t.typ('cp a.txt b.txt');
  t.typ('touch c.md .verborgen.txt project/sub/d.txt');
  return t;
}

describe('jokertekens', () => {
  it('de shell vult * in met de namen op alfabet', () => {
    const { typ } = metBestanden();
    expect(typ('echo *.txt')).toBe('a.txt b.txt notities.txt');
    expect(typ('echo *')).toBe('a.txt b.txt c.md notities.txt project');
  });

  it('? is precies één teken', () => {
    const { typ } = metBestanden();
    expect(typ('echo ?.md')).toBe('c.md');
    expect(typ('echo ??.md')).toBe('??.md');
  });

  it('een verborgen bestand telt alleen met een punt vooraan', () => {
    const { typ } = metBestanden();
    expect(typ('echo .*.txt')).toBe('.verborgen.txt');
  });

  it('een joker in een pad', () => {
    const { typ } = metBestanden();
    expect(typ('echo project/*/*.txt')).toBe('project/sub/d.txt');
    expect(typ('ls /var/log/apache2/*.log')).toBe(
      '/var/log/apache2/access.log  /var/log/apache2/error.log',
    );
  });

  it('past er niets, dan krijgt het commando het patroon zelf', () => {
    const { typ } = metBestanden();
    expect(typ('ls *.xyz')).toBe("ls: cannot access '*.xyz': No such file or directory");
  });

  it('tussen aanhalingstekens vult de shell niets in', () => {
    const { typ } = metBestanden();
    expect(typ("echo '*.txt'")).toBe('*.txt');
    expect(typ('echo "*.txt"')).toBe('*.txt');
  });

  it('cp en rm met een joker', () => {
    const { typ } = metBestanden();
    typ('mkdir kopie');
    expect(typ('cp *.txt kopie/')).toBe('');
    expect(typ('ls kopie')).toBe('a.txt  b.txt  notities.txt');
    expect(typ('rm kopie/*.txt')).toBe('');
    expect(typ('ls kopie')).toBe('');
  });
});

describe('ls, cp, mv, grep en cat met meer namen', () => {
  it('ls zet de bestanden samen en elke map met zijn naam erboven', () => {
    const { typ } = metBestanden();
    expect(typ('ls a.txt b.txt project')).toBe('a.txt  b.txt\n\nproject:\nsub');
    expect(typ('ls a.txt nergens')).toBe(
      "ls: cannot access 'nergens': No such file or directory\na.txt",
    );
    expect(typ('ls project project/sub')).toBe('project:\nsub\n\nproject/sub:\nd.txt');
  });

  it('cp en mv: met meer bronnen moet het laatste een bestaande map zijn', () => {
    const { typ } = metBestanden();
    expect(typ('mv a.txt b.txt nergens/')).toBe("mv: target 'nergens/': No such file or directory");
    expect(typ('cp a.txt b.txt c.md')).toBe("cp: target 'c.md': Not a directory");
    expect(typ('mv a.txt b.txt project')).toBe('');
    expect(typ('ls project')).toBe('a.txt  b.txt  sub');
  });

  it('grep in meer bestanden zet de naam voor elke regel', () => {
    const { sessie, typ } = metBestanden();
    expect(typ('grep hoi a.txt b.txt')).toBe('a.txt:hoi\nb.txt:hoi');
    const r = sessie.typ('grep hoi a.txt nergens');
    expect(r.stand.uitvoer.join('\n')).toBe('a.txt:hoi\ngrep: nergens: No such file or directory');
    expect(r.results.at(-1)?.exitCode).toBe(2);
  });

  it('cat plakt bestanden achter elkaar, zonder lege regel ertussen', () => {
    const { typ } = metBestanden();
    expect(typ('cat a.txt b.txt')).toBe('hoi\nhoi');
    typ('cat a.txt b.txt > samen.txt');
    expect(typ('wc -l samen.txt')).toBe('2 samen.txt');
  });
});

describe('find', () => {
  it('noemt de plek zelf en alles eronder, met het pad zoals je het typte', () => {
    const { typ } = metBestanden();
    expect(typ('find project')).toBe('project\nproject/sub\nproject/sub/d.txt');
    expect(typ('find project/ -type d')).toBe('project/\nproject/sub');
    typ('cd project');
    expect(typ('find')).toBe('.\n./sub\n./sub/d.txt');
  });

  it('-name met een patroon, -iname zonder op hoofdletters te letten, -type f', () => {
    const { typ } = metBestanden();
    // find kijkt ook naar verborgen bestanden; alleen de shell slaat ze over.
    expect(typ("find . -name '*.txt'")).toBe(
      './.verborgen.txt\n./a.txt\n./b.txt\n./notities.txt\n./project/sub/d.txt',
    );
    expect(typ("find . -iname 'A.TXT'")).toBe('./a.txt');
    expect(typ('find /var/www -type f')).toBe(
      '/var/www/html/config/instellingen.conf\n/var/www/html/index.html\n/var/www/html/inloggen.html',
    );
  });

  it('een *.txt zonder aanhalingstekens: de shell vult hem al in', () => {
    const { typ } = metBestanden();
    expect(typ('find . -name *.txt')).toBe(
      "find: paths must precede expression: `b.txt'\nfind: possible unquoted pattern after predicate `-name'?",
    );
    // Past er hier precies één, dan gaat het stil mis: find zoekt alleen nog
    // naar d.txt, en niet naar a.txt.
    typ('cd project/sub');
    expect(typ('find ~ -name *.txt')).toBe('/home/student/project/sub/d.txt');
  });

  it('meldingen zoals findutils 4.9 in een UTF-8-locale', () => {
    const { typ } = metBestanden();
    expect(typ('find nergens')).toBe('find: ‘nergens’: No such file or directory');
    expect(typ('find . -nam x')).toBe("find: unknown predicate `-nam'");
    expect(typ('find . -type x')).toBe('find: Unknown argument to -type: x');
    expect(typ('find . -name')).toBe("find: missing argument to `-name'");
  });

  it('een map die je niet mag lezen noemt find, en dan Permission denied', () => {
    const { typ } = terminal();
    expect(typ('find / -name root')).toBe('/root\nfind: ‘/root’: Permission denied');
    expect(typ('find /etc -name shadow')).toBe('/etc/shadow');
  });
});

describe('een pipe', () => {
  it('wc, head en tail lezen wat er door de pipe komt', () => {
    const { typ } = metBestanden();
    typ('echo een > drie.txt');
    typ('echo twee >> drie.txt');
    typ('echo drie >> drie.txt');
    expect(typ('cat drie.txt | wc -l')).toBe('3');
    expect(typ('cat drie.txt | wc')).toBe('      3       3      14');
    expect(typ('cat drie.txt | wc -l -w')).toBe('      3       3');
    expect(typ('ls | head -n 2')).toBe('a.txt\nb.txt');
    expect(typ('cat drie.txt | tail -n 1')).toBe('drie');
    expect(typ('grep e drie.txt | wc -l')).toBe('3');
  });
});

describe('history', () => {
  it('nummert zoals bash, met history zelf als laatste', () => {
    const { typ } = terminal();
    typ('ls');
    typ('echo hoi');
    expect(typ('history')).toBe('    1  ls\n    2  echo hoi\n    3  history');
    expect(typ('history 2')).toBe('    3  history\n    4  history 2');
  });

  it('slaat een herhaling en een regel met een spatie vooraan over (ignoreboth)', () => {
    const { sessie, typ } = terminal();
    typ('ls');
    typ('ls');
    typ(' pwd');
    expect(sessie.geschiedenis).toEqual(['ls']);
  });
});

describe('Tab', () => {
  const env = () => {
    const { sessie, typ } = metBestanden();
    return { env: { fs: (sessie.typ('').stand as { fs: object }).fs, cwd: sessie.cwd }, typ };
  };

  it('vult een commando aan, met een spatie erachter', () => {
    expect(vulAan('hist', env().env)).toEqual({ invoegen: 'ory ', opties: [] });
  });

  it('vult een map aan met een /, en een bestand met een spatie', () => {
    const { env: e } = env();
    expect(vulAan('cd pro', e)).toEqual({ invoegen: 'ject/', opties: [] });
    expect(vulAan('cat project/sub/d', e)).toEqual({ invoegen: '.txt ', opties: [] });
    expect(vulAan('cat /etc/os', e)).toEqual({ invoegen: '-release ', opties: [] });
  });

  it('meer mogelijkheden: aanvullen tot waar ze verschillen, en anders de lijst', () => {
    const { env: e } = env();
    expect(vulAan('cat n', e)).toEqual({ invoegen: 'otities.txt ', opties: [] });
    expect(vulAan('cat ', e).opties).toEqual([
      'a.txt',
      'b.txt',
      'c.md',
      'notities.txt',
      'project/',
    ]);
    expect(vulAan('l', e)).toEqual({ invoegen: 's ', opties: [] });
    expect(vulAan('c', e).opties).toEqual(['cat', 'cd', 'chmod', 'clear', 'cp']);
  });

  it('niets dat past: dan doet Tab niets', () => {
    expect(vulAan('cat xyz', env().env)).toEqual({ invoegen: '', opties: [] });
  });
});

describe('de regel bewerken', () => {
  const sessie = maakSessie();
  const typ = (stand: typeof LEEG, ...toetsen: string[]) =>
    toetsen.reduce((s, t) => toets(s, t, sessie).stand, stand);

  it('pijltje links en verder typen voegt in op de cursor', () => {
    const s = typ(LEEG, ...'cat notitie.txt'.split(''), ...Array(4).fill('\x1b[D'), 's');
    expect(s.tekst).toBe('cat notities.txt');
  });

  it('Backspace en Delete halen weg voor en op de cursor', () => {
    const s = typ(LEEG, ...'lss -l'.split(''), '\x01', '\x1b[C', '\x1b[3~');
    expect(s.tekst).toBe('ls -l');
    expect(typ(s, '\x05', '\x7f').tekst).toBe('ls -');
  });

  it('pijltje omhoog haalt het vorige commando, omlaag weer wat je aan het typen was', () => {
    sessie.typ('pwd');
    sessie.typ('ls /etc');
    const s = typ(LEEG, 'e', 'c', '\x1b[A');
    expect(s.tekst).toBe('ls /etc');
    expect(typ(s, '\x1b[A').tekst).toBe('pwd');
    expect(typ(s, '\x1b[A', '\x1b[B', '\x1b[B').tekst).toBe('ec');
  });

  it('de tweede Tab toont de mogelijkheden', () => {
    const s = typ(LEEG, 'c');
    const een = toets(s, '\t', sessie);
    expect(een.actie).toBe(null);
    const twee = toets(een.stand, '\t', sessie);
    expect(twee.actie).toBe('opties');
    expect(twee.opties).toContain('cd');
  });

  it('Enter, Ctrl+C en Ctrl+L', () => {
    expect(toets(LEEG, '\r', sessie).actie).toBe('uitvoeren');
    expect(toets(LEEG, '\x03', sessie).actie).toBe('afbreken');
    expect(toets(LEEG, '\x0c', sessie).actie).toBe('leeg');
  });
});
