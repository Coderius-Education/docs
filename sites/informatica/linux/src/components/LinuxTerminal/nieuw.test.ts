import { describe, expect, it } from 'vitest';
import { vulAan } from './aanvullen';
import { maakSessie } from './opdrachten';
import { LEEG, omKolommen, plekVan, toets, verplaats, zichtbaar } from './regel';

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
    expect(vulAan('c', e).opties).toEqual(['cat', 'cd', 'clear', 'cp']);
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

describe("commando's van een echte Linux", () => {
  it('zeggen dat ze hier niet werken, en in welke les wel', () => {
    const { typ } = terminal();
    expect(typ('sudo apt update')).toBe(
      'oefenterminal: sudo werkt hier niet, wel op je eigen Linux, vanaf les 6.1.',
    );
    expect(typ('man ls')).toBe(
      'oefenterminal: man werkt hier niet, wel op je eigen Linux, vanaf les 5.3.',
    );
    // chmod zei eerst "gewijzigd (gesimuleerd)" en veranderde niets.
    expect(typ('chmod +x notities.txt')).toBe(
      'oefenterminal: chmod werkt hier niet, wel op je eigen Linux, vanaf les 7.2.',
    );
  });

  it('een typfout blijft command not found, zoals in bash', () => {
    const { typ } = terminal();
    expect(typ('hsitory')).toBe('bash: hsitory: command not found');
    // Geen eigenschap van een gewoon object (toString, constructor).
    expect(typ('toString')).toBe('bash: toString: command not found');
  });

  it('elke les die NIET_HIER noemt, bestaat in de sidebar', async () => {
    const { NIET_HIER } = await import('./commands');
    const sidebars = (await import('../../../sidebars')).default as {
      linuxSidebar: (string | { items: string[] })[];
    };
    const aantal = sidebars.linuxSidebar
      .filter((i): i is { items: string[] } => typeof i !== 'string')
      .map((c) => c.items.length);
    for (const les of Object.values(NIET_HIER).filter(Boolean) as string[]) {
      const [thema, nr] = les.split('.').map(Number);
      expect(nr, les).toBeLessThanOrEqual(aantal[thema - 1] ?? 0);
    }
  });
});

describe('de welkomsttekst', () => {
  it('breekt op een smal scherm tussen woorden af', () => {
    const tekst = "Typ help voor een lijst met commando's.";
    expect(omKolommen(tekst, 80)).toEqual([`  ${tekst}`]);
    const smal = omKolommen(tekst, 30);
    expect(smal).toEqual(['  Typ help voor een lijst met', "  commando's."]);
    for (const r of smal) expect(r.length).toBeLessThanOrEqual(30);
    // Een woord dat langer is dan de regel, krijgt een eigen regel.
    expect(omKolommen('a heelergroteswoord b', 8)).toEqual(['  a', '  heelergroteswoord', '  b']);
  });
});

describe('een lange regel opnieuw tekenen', () => {
  // Eerst schreef de terminal na een pijltje de regel vanaf het begin van de
  // huidige schermregel opnieuw: liep hij over twee regels, dan stond hij er
  // dubbel. Nu begint het tekenen op de rij van de prompt.
  it('de plek van de cursor in een regel die over meer rijen loopt', () => {
    const prompt = zichtbaar('\u001b[1;32mstudent@oefenpc\u001b[0m:\u001b[1;34m~\u001b[0m$ ');
    expect(prompt).toBe(19);
    expect(plekVan(prompt, 0, 80)).toEqual({ rij: 0, kolom: 19 });
    expect(plekVan(prompt, 61, 80)).toEqual({ rij: 1, kolom: 0 });
    expect(plekVan(prompt, 100, 80)).toEqual({ rij: 1, kolom: 39 });
  });

  it('omhoog met CSI A, omlaag met regeleinden', () => {
    expect(verplaats(5, 3, 10)).toBe('\u001b[2A\r\u001b[10C');
    expect(verplaats(3, 4, 0)).toBe('\r\n\r');
    expect(verplaats(4, 4, 7)).toBe('\r\u001b[7C');
  });
});

// De simulator zegt wat Ubuntu 24.04 zegt (coreutils 9.4, grep 3.11,
// LANG=C.UTF-8). Elk geval hieronder week eerst af; nagedraaid op Ubuntu.
describe('zoals op Ubuntu', () => {
  it('een ontbrekend argument geeft de melding van coreutils 9.4', () => {
    // mv *.jpg met één jpg zei eerst `mv: missing file operand`; Ubuntu noemt
    // het bestand en verwijst naar --help.
    const { typ } = terminal();
    typ('touch strand.jpg');
    expect(typ('mv *.jpg')).toBe(
      "mv: missing destination file operand after 'strand.jpg'\nTry 'mv --help' for more information.",
    );
    expect(typ('cp strand.jpg')).toBe(
      "cp: missing destination file operand after 'strand.jpg'\nTry 'cp --help' for more information.",
    );
    expect(typ('mv')).toBe("mv: missing file operand\nTry 'mv --help' for more information.");
    expect(typ('mkdir')).toBe("mkdir: missing operand\nTry 'mkdir --help' for more information.");
    expect(typ('touch')).toBe(
      "touch: missing file operand\nTry 'touch --help' for more information.",
    );
    expect(typ('rm')).toBe("rm: missing operand\nTry 'rm --help' for more information.");
    expect(typ('rm -f')).toBe('');
  });

  it('cat, head, tail en wc zonder bestand: die wachten op het toetsenbord', () => {
    // Eerst zei de oefenterminal `cat: missing operand`, een melding die
    // Ubuntu nooit geeft: daar wacht cat op wat je typt, tot Ctrl+D.
    const { typ } = terminal();
    for (const cmd of ['cat', 'head', 'tail', 'wc'])
      expect(typ(cmd)).toBe(
        `oefenterminal: ${cmd} zonder bestand wacht op wat je typt; dat kan hier niet. Zet een bestand achter het commando.`,
      );
    // Door een pipe krijgt cat wel invoer.
    expect(typ('echo hoi | cat')).toBe('hoi');
  });

  it('> maakt een bestaand bestand leeg, ook als het commando faalt of niet bestaat', () => {
    const { sessie, typ } = terminal();
    const inhoud = () => typ('cat l.txt');
    typ('echo brood > l.txt');
    typ('ech kaas > l.txt');
    expect(inhoud()).toBe('');
    typ('echo brood > l.txt');
    typ('cat bestaatniet > l.txt');
    expect(inhoud()).toBe('');
    // Een typfout met > erachter maakt het bestand ook aan.
    typ('ech kaas > nieuw.txt');
    expect(typ('ls nieuw.txt')).toBe('nieuw.txt');
    // >> laat staan wat er stond.
    typ('echo brood > l.txt');
    typ('ech kaas >> l.txt');
    expect(inhoud()).toBe('brood');
    expect(sessie.cwd).toBe('/home/student');
  });

  it('ls toont een bestand dat je niet mag lezen gewoon als bestand', () => {
    const { typ } = terminal();
    expect(typ('ls /etc/shadow')).toBe('/etc/shadow');
    expect(typ('ls -l /etc/shadow')).toBe('-rw-r----- 1 root shadow 1024 Mar 26 10:00 /etc/shadow');
    expect(typ('cat /etc/group')).toContain('shadow:x:42:');
  });

  it('ls -l in de opmaak van coreutils: total, één spatie, echte groottes, -h', () => {
    const { typ } = terminal();
    expect(typ('ls -l /etc').split('\n')).toEqual([
      'total 24',
      '-rw-r--r-- 1 root root     54 Mar 26 10:00 group',
      '-rw-r--r-- 1 root root      8 Mar 26 10:00 hostname',
      '-rw-r--r-- 1 root root     80 Mar 26 10:00 hosts',
      '-rw-r--r-- 1 root root    113 Mar 26 10:00 os-release',
      '-rw-r--r-- 1 root root    318 Mar 26 10:00 passwd',
      '-rw-r----- 1 root shadow 1024 Mar 26 10:00 shadow',
    ]);
    expect(typ('ls -lh /etc').split('\n')[0]).toBe('total 24K');
    expect(typ('ls -lh /etc')).toContain('-rw-r----- 1 root shadow 1.0K Mar 26 10:00 shadow');
    typ('touch leeg.txt');
    expect(typ('ls -l leeg.txt')).toBe('-rw-r--r-- 1 student student 0 Mar 26 10:00 leeg.txt');
    expect(typ('ls -la').split('\n').slice(0, 3)).toEqual([
      'total 16',
      'drwxr-x--- 2 student student 4096 Mar 26 10:00 .',
      'drwxr-xr-x 3 root    root    4096 Mar 26 10:00 ..',
    ]);
  });

  it('grep leest een patroon als GNU grep (BRE), niet als JavaScript', () => {
    const { typ } = terminal();
    typ("echo 'GET /inloggen.html' > g.txt");
    typ("echo 'a+b' >> g.txt");
    typ("echo '*.html' >> g.txt");
    expect(typ("grep '*.html' g.txt")).toBe('*.html');
    expect(typ("grep 'a+b' g.txt")).toBe('a+b');
    expect(typ("grep 'a\\+b' g.txt")).toBe('');
    expect(typ('grep [ g.txt')).toBe('grep: Invalid regular expression');
    expect(typ('grep [a g.txt')).toBe('grep: Unmatched [, [^, [:, [., or [=');
  });

  it('grep -v, -c, -n en -i doen wat ze beloven', () => {
    const { typ } = terminal();
    expect(typ('grep -v Failed /var/log/auth.log')).not.toContain('Failed');
    expect(typ('grep -c Failed /var/log/auth.log')).toMatch(/^\d+$/);
    expect(typ('grep -n Accepted /var/log/auth.log')).toMatch(/^\d+:.*Accepted/);
    expect(typ('grep -ic failed /var/log/auth.log')).toBe(typ('grep -c Failed /var/log/auth.log'));
  });

  it('grep zonder patroon of zonder bestand', () => {
    const { typ } = terminal();
    expect(typ('grep')).toBe(
      "Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.",
    );
    expect(typ('grep Failed')).toMatch(/^oefenterminal: grep zonder bestand/);
  });

  it('een optie die de oefenterminal niet kent, zegt dat in plaats van hem stil over te slaan', () => {
    const { typ } = terminal();
    typ('cp notities.txt kopie.txt');
    expect(typ('cp -i notities.txt kopie.txt')).toBe(
      'oefenterminal: cp -i werkt hier niet, wel op je eigen Linux.',
    );
    expect(typ('rm -i kopie.txt')).toBe(
      'oefenterminal: rm -i werkt hier niet, wel op je eigen Linux.',
    );
    expect(typ('ls kopie.txt')).toBe('kopie.txt');
    expect(typ('ls --all')).toBe('oefenterminal: ls --all werkt hier niet, wel op je eigen Linux.');
  });

  it('tail -1 is tail -n 1', () => {
    const { typ } = terminal();
    expect(typ('tail -1 /etc/passwd')).toBe(typ('tail -n 1 /etc/passwd'));
    expect(typ('head -2 /etc/passwd').split('\n')).toHaveLength(2);
  });
});
