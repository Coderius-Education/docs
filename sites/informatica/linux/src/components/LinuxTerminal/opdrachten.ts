import { vulAan } from './aanvullen';
import { executeCommandLine, parseCommandLine } from './commands';
import { HOME, createFilesystem, getNode, readFile, resolvePath } from './filesystem';

// De terminal bij een opdracht. Elke opdracht in de oefenterminal krijgt een eigen,
// verse oefenterminal direct onder de opdracht, met daarboven de doelen als
// lijstje dat afvinkt terwijl de leerling typt. Eerst stond er één terminal
// bovenaan de les: de opdracht stond zestig regels lager, en een verse start
// kon alleen door de pagina te herladen.
//
// De doelen staan hier en niet in de .mdx, zodat opdrachten.test.ts kan
// naspelen dat het antwoord uit de les elk doel haalt (en een half antwoord
// niet). Een doel dat je niet kunt halen, is een vinkje dat nooit komt.

/** Hoe de terminal erbij staat na de laatste getypte regel. */
export type Stand = {
  fs: object;
  cwd: string;
  /** De map vóór die regel. */
  voor: string;
  regel: string;
  /** De uitvoer van die regel, per regel en zonder kleurcodes. */
  uitvoer: string[];
};

export type Doel = { tekst: string; klaar: (s: Stand) => boolean };

export type Opdracht = {
  doelen: Doel[];
  /**
   * Bestanden die er bij deze opdracht al staan, bovenop de gewone oefenpc
   * (dezelfde vorm als het bestandssysteem: een map is een object, een
   * bestand een tekst). Zo hoeft de leerling niet eerst tien bestanden te
   * maken voordat hij aan het eigenlijke commando toekomt.
   */
  bestanden?: object;
  /**
   * Een doel telt pas als het vorige gehaald is. Nodig als een later doel
   * aan het begin al waar is: "ga terug naar je thuismap" of "gooi de map
   * oud weg" klopt ook voordat je iets gedaan hebt.
   */
  opVolgorde?: boolean;
};

const KLEUR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/** Eén oefenterminal: een eigen bestandssysteem en een eigen map. */
export function maakSessie(extraFs?: object, { clear }: { clear?: () => void } = {}) {
  const env = {
    cwd: HOME,
    fs: createFilesystem(extraFs),
    geschiedenis: [] as string[],
    setCwd(nieuw: string) {
      env.cwd = nieuw;
    },
    clear: () => clear?.(),
  };
  return {
    get cwd() {
      return env.cwd;
    },
    get geschiedenis() {
      return env.geschiedenis;
    },
    aanvullen(voor: string): { invoegen: string; opties: string[] } {
      return vulAan(voor, env);
    },
    typ(regel: string) {
      const voor = env.cwd;
      // Zoals Ubuntu het instelt (HISTCONTROL=ignoreboth in ~/.bashrc): een
      // regel die met een spatie begint of gelijk is aan de vorige, komt er
      // niet bij.
      if (regel.trim() && !regel.startsWith(' ') && env.geschiedenis.at(-1) !== regel)
        env.geschiedenis.push(regel);
      const results: { output?: string; exitCode?: number }[] = executeCommandLine(regel, env);
      const tekst = results
        .map((r) => (r.output ?? '').replace(/\n$/, ''))
        .filter(Boolean)
        .join('\n')
        .replace(KLEUR, '');
      const stand: Stand = {
        fs: env.fs,
        cwd: env.cwd,
        voor,
        regel,
        uitvoer: tekst ? tekst.split('\n') : [],
      };
      return { results, stand };
    },
  };
}

/** Vinkt af wat met deze stand gehaald is; een gehaald doel blijft gehaald. */
export function volgDoelen(opdracht: Opdracht, klaar: boolean[], stand: Stand): boolean[] {
  const nieuw = opdracht.doelen.map((_, i) => klaar[i] ?? false);
  for (let i = 0; i < opdracht.doelen.length; i++) {
    if (nieuw[i]) continue;
    if (opdracht.doelen[i].klaar(stand)) nieuw[i] = true;
    else if (opdracht.opVolgorde) break;
  }
  return nieuw;
}

const pad = (s: Stand, p: string) => resolvePath(s.cwd, p);
const inhoud = (s: Stand, p: string): string | null => {
  const { content } = readFile(s.fs, pad(s, p));
  return content ?? null;
};
const isMap = (s: Stand, p: string) => getNode(s.fs, pad(s, p)).isDir;
/** Staat er in deze map een bestand met deze inhoud, onder welke naam ook? */
const metInhoud = (s: Stand, map: string, tekst: string) => {
  const { node, isDir } = getNode(s.fs, pad(s, map));
  return isDir && Object.values(node as Record<string, unknown>).some((v) => v === tekst);
};
/**
 * Noemt find precies deze paden? Een relatief pad (./x, vanuit cd /var/log)
 * en een / aan het eind (find /var/, met Tab) tellen ook; een Permission
 * denied van find ook, want die is geen fout van de leerling (les 3.2).
 */
const zelfdePaden = (s: Stand, verwacht: string[]) => {
  const paden = s.uitvoer
    .filter((r) => !r.startsWith('find:'))
    .map((r) => resolvePath(s.cwd, r))
    .sort();
  return paden.join('\n') === [...verwacht].sort().join('\n');
};
const bestaat = (s: Stand, p: string) => getNode(s.fs, pad(s, p)).exists;

/** De commando's op de regel, als lijst woorden: `cd ..; ls` -> [['cd','..'],['ls']]. */
const commandos = (s: Stand): string[][] =>
  parseCommandLine(s.regel)
    .map(({ cmd }: { cmd: string }) => cmd.trim().split(/\s+/))
    .filter((w: string[]) => w[0]);
const gebruikt = (s: Stand, naam: string) => commandos(s).some((w) => w[0] === naam);
const woorden = (s: Stand) => new Set(s.uitvoer.flatMap((r) => r.split(/\s+/)));

const begin = createFilesystem();
const NOTITIES = readFile(begin, `${HOME}/notities.txt`).content as string;
const BEZOEKEN = (readFile(begin, '/var/log/apache2/access.log').content as string)
  .split('\n')
  .filter((r) => r.includes('inloggen.html'));

const FOTOS = ['kat.png', 'vakantie1.jpg', 'vakantie2.jpg'];
const LOGS = ['/var/log/apache2/access.log', '/var/log/apache2/error.log', '/var/log/auth.log'];
const MAPPEN_VAR = [
  '/var',
  '/var/log',
  '/var/log/apache2',
  '/var/www',
  '/var/www/html',
  '/var/www/html/config',
];

export const OPDRACHTEN: Record<string, Opdracht> = {
  '1.1.a': {
    doelen: [
      {
        tekst: 'Vraag de naam van de computer op.',
        klaar: (s) => s.uitvoer.includes('oefenpc'),
      },
      {
        tekst: 'Vraag op welk besturingssysteem erop draait.',
        klaar: (s) =>
          (gebruikt(s, 'uname') && s.uitvoer.some((r) => r.startsWith('Linux'))) ||
          s.uitvoer.some((r) => r.includes('Ubuntu')),
      },
      {
        tekst: 'Laat zien wat er in de map /etc staat.',
        klaar: (s) =>
          gebruikt(s, 'ls') && ['passwd', 'hosts', 'os-release'].every((n) => woorden(s).has(n)),
      },
    ],
  },
  '1.2.a': {
    opVolgorde: true,
    doelen: [
      { tekst: 'Ga naar /var/log.', klaar: (s) => s.cwd === '/var/log' },
      {
        tekst: 'Ga van daaruit met een relatief pad naar /var/www/html.',
        klaar: (s) =>
          s.voor === '/var/log' &&
          s.cwd === '/var/www/html' &&
          commandos(s)
            .filter((w) => w[0] === 'cd')
            .every((w) => w[1] && !/^[/~]/.test(w[1])),
      },
      { tekst: 'Ga terug naar je thuismap.', klaar: (s) => s.cwd === HOME },
    ],
  },
  '1.2.b': {
    doelen: [
      {
        tekst: 'Laat zien wat er in de map config staat.',
        klaar: (s) => gebruikt(s, 'ls') && woorden(s).has('instellingen.conf'),
      },
    ],
  },
  '1.3.a': {
    doelen: [
      {
        tekst: 'Lees /etc/os-release.',
        klaar: (s) => gebruikt(s, 'cat') && s.uitvoer.some((r) => r.startsWith('PRETTY_NAME=')),
      },
    ],
  },
  '1.3.b': {
    opVolgorde: true,
    doelen: [
      {
        tekst: 'Typ cat /etc/hostnme, met de typfout.',
        klaar: (s) =>
          s.regel.trim() === 'cat /etc/hostnme' &&
          s.uitvoer[0] === 'cat: /etc/hostnme: No such file or directory',
      },
      {
        tekst: 'Haal hem terug, verbeter hem, en voer hem opnieuw uit.',
        klaar: (s) => s.regel.trim() === 'cat /etc/hostname' && s.uitvoer[0] === 'oefenpc',
      },
    ],
  },
  '1.3.c': {
    doelen: [
      {
        tekst: 'Laat alleen de laatste drie commando’s zien die je typte.',
        klaar: (s) =>
          gebruikt(s, 'history') &&
          s.uitvoer.length === 3 &&
          s.uitvoer.every((r) => /^\s+\d+ {2}/.test(r)),
      },
    ],
  },
  '2.1.a': {
    doelen: [
      {
        tekst: 'Tel de gebruikers in /etc/passwd.',
        // wc zonder -l zet de getallen uitgelijnd, met spaties vooraan.
        klaar: (s) => gebruikt(s, 'wc') && /^\s*7(\s|$)/.test(s.uitvoer[0] ?? ''),
      },
      {
        tekst: 'Laat alleen de laatste regel van /etc/passwd zien.',
        klaar: (s) =>
          s.uitvoer.length === 1 &&
          s.uitvoer[0] === 'student:x:1000:1000:student:/home/student:/bin/bash',
      },
    ],
  },
  '2.2.a': {
    opVolgorde: true,
    doelen: [
      { tekst: 'Maak in je thuismap een map lijstjes.', klaar: (s) => isMap(s, '~/lijstjes') },
      {
        tekst: 'Zet daarin boodschappen.txt met brood, kaas en appels, elk op een eigen regel.',
        klaar: (s) => inhoud(s, '~/lijstjes/boodschappen.txt') === 'brood\nkaas\nappels\n',
      },
      {
        tekst: 'Laat met één commando zien hoeveel regels het bestand heeft.',
        klaar: (s) =>
          gebruikt(s, 'wc') &&
          s.regel.includes('boodschappen.txt') &&
          /^\s*3(\s|$)/.test(s.uitvoer[0] ?? ''),
      },
    ],
  },
  '2.3.a': {
    opVolgorde: true,
    doelen: [
      {
        tekst: 'Maak een map oud met een kopie van notities.txt erin.',
        // Een kopie mag ook een andere naam krijgen.
        klaar: (s) => metInhoud(s, '~/oud', NOTITIES),
      },
      {
        tekst: 'Hernoem het origineel naar todo.txt.',
        klaar: (s) => inhoud(s, '~/todo.txt') === NOTITIES && !bestaat(s, '~/notities.txt'),
      },
      { tekst: 'Gooi de map oud weg.', klaar: (s) => !bestaat(s, '~/oud') },
      {
        tekst: 'Controleer met ls dat alleen todo.txt over is.',
        klaar: (s) => gebruikt(s, 'ls') && s.uitvoer.join(' ').trim() === 'todo.txt',
      },
    ],
  },
  '2.4.a': {
    opVolgorde: true,
    bestanden: {
      home: {
        student: {
          downloads: {
            'vakantie1.jpg': '',
            'vakantie2.jpg': '',
            'kat.png': '',
            'liedje.mp3': '',
            'opdracht.pdf': '',
            'verslag.docx': '',
          },
        },
      },
    },
    doelen: [
      { tekst: 'Maak in downloads een map fotos.', klaar: (s) => isMap(s, '~/downloads/fotos') },
      {
        tekst: 'Verplaats alle .jpg- en .png-bestanden naar fotos, met één mv en jokertekens.',
        klaar: (s) =>
          gebruikt(s, 'mv') &&
          s.regel.includes('*') &&
          FOTOS.every((f) => bestaat(s, `~/downloads/fotos/${f}`)) &&
          FOTOS.every((f) => !bestaat(s, `~/downloads/${f}`)),
      },
      {
        tekst: 'Laat zien wat er nu in fotos staat.',
        klaar: (s) =>
          gebruikt(s, 'ls') && s.uitvoer.join(' ').split(/\s+/).join(' ') === FOTOS.join(' '),
      },
    ],
  },
  '2.4.b': {
    opVolgorde: true,
    bestanden: {
      home: {
        student: {
          project: {
            'main.py': 'print("hallo")\n',
            'README.md': '# Mijn project\n',
            'cache1.tmp': '',
            'cache2.tmp': '',
          },
        },
      },
    },
    doelen: [
      {
        tekst: 'Kijk eerst met ls welke .tmp-bestanden je gaat weggooien.',
        klaar: (s) =>
          gebruikt(s, 'ls') &&
          s.regel.includes('*') &&
          s.uitvoer
            .join(' ')
            .split(/\s+/)
            .map((n) => n.split('/').pop())
            .join(' ') === 'cache1.tmp cache2.tmp',
      },
      {
        tekst: 'Gooi ze weg met één rm, en laat de rest staan.',
        klaar: (s) =>
          gebruikt(s, 'rm') &&
          !bestaat(s, '~/project/cache1.tmp') &&
          !bestaat(s, '~/project/cache2.tmp') &&
          bestaat(s, '~/project/main.py') &&
          bestaat(s, '~/project/README.md'),
      },
    ],
  },
  '3.1.a': {
    doelen: [
      {
        tekst: 'Zoek met één regel alle bezoeken aan inloggen.html.',
        klaar: (s) =>
          gebruikt(s, 'grep') &&
          s.uitvoer.length === BEZOEKEN.length &&
          s.uitvoer.every((r, i) => r === BEZOEKEN[i]),
      },
    ],
  },
  '3.2.a': {
    doelen: [
      {
        tekst: 'Zoek met één commando alle bestanden onder /var/log die op .log eindigen.',
        klaar: (s) => gebruikt(s, 'find') && zelfdePaden(s, LOGS),
      },
    ],
  },
  '3.2.b': {
    doelen: [
      {
        tekst: 'Laat alle mappen onder /var zien, /var zelf meegeteld.',
        klaar: (s) => gebruikt(s, 'find') && zelfdePaden(s, MAPPEN_VAR),
      },
    ],
  },
};
