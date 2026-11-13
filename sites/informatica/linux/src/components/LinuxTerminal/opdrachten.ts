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

/** Waarom het volgende doel zo niet meer te halen is, en wat de leerling dan doet. */
export type Vast = (s: Stand, klaar: boolean[]) => string | null;

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
  /**
   * Zegt het als de leerling zo niet meer verder kan. In 2.4.b gooide wie
   * eerst `rm *.tmp` typte (de fout waar de opdracht over gaat) de bestanden
   * weg die het eerste doel wil zien, en de terminal bleef "Doe het in deze
   * volgorde" zeggen. De tekst komt onder de doelen te staan.
   */
  vast?: Vast;
};

const KLEUR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/** Eén oefenterminal: een eigen bestandssysteem en een eigen map. */
export function maakSessie(
  extraFs?: object,
  { clear, kolommen }: { clear?: () => void; kolommen?: () => number } = {},
) {
  const env = {
    // De breedte van de terminal: `ls` zet zijn namen in kolommen die erop passen.
    kolommen: () => kolommen?.() ?? 80,
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
const OPNIEUW = 'Klik op Opnieuw beginnen en probeer het nog een keer.';
const woorden = (s: Stand) => new Set(s.uitvoer.flatMap((r) => r.split(/\s+/)));
/**
 * De namen in de uitvoer van ls of echo, op alfabet en zonder map ervoor.
 * Niet in de volgorde van het scherm: `ls` zet ze in kolommen op de breedte
 * van de terminal, en op een smalle terminal (een telefoon) stond
 * vakantie2.jpg dan vóór vakantie1.jpg, en kwam het vinkje nooit. Van een
 * regel van `ls -l` telt het laatste woord, en de regel `total` telt niet.
 */
const namen = (s: Stand) =>
  s.uitvoer
    .filter((r) => !/^total \d+$/.test(r))
    .flatMap((r) => (/^[-dl][rwx-]{9} /.test(r) ? [r.split(/\s+/).at(-1) ?? ''] : r.split(/\s+/)))
    .filter(Boolean)
    .map((n) => n.split('/').pop() ?? n)
    .sort();
/** Past dit woord (een naam of een jokerteken, met of zonder map) op deze naam? */
const pastOp = (woord: string, naam: string) => {
  const kaal = woord.split('/').pop() ?? '';
  const regex = kaal
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regex}$`).test(naam);
};
/**
 * Het enige commando met deze naam op de regel noemt elk van deze namen, en
 * gebruikt een jokerteken. Zo telt "met één mv" alleen voor één commando
 * dat alles in één keer doet: twee regels mv, of twee op één regel, niet.
 */
const inEenKeer = (s: Stand, naam: string, wat: string[], laatsteIsDoel = false) => {
  const cmds = commandos(s).filter((w) => w[0] === naam);
  if (cmds.length !== 1) return false;
  const bronnen = cmds[0]
    .slice(1, laatsteIsDoel ? -1 : undefined)
    .filter((a) => !a.startsWith('-'));
  return bronnen.some((a) => /[*?]/.test(a)) && wat.every((n) => bronnen.some((a) => pastOp(a, n)));
};

const begin = createFilesystem();
const NOTITIES = readFile(begin, `${HOME}/notities.txt`).content as string;
const BEZOEKEN = (readFile(begin, '/var/log/apache2/access.log').content as string)
  .split('\n')
  .filter((r) => r.includes('inloggen.html'));

const FOTOS = ['kat.png', 'vakantie1.jpg', 'vakantie2.jpg'];
const ANDERE = ['liedje.mp3', 'opdracht.pdf', 'verslag.docx'];
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
        tekst: 'Ga van daaruit in één keer, met een relatief pad, naar /var/www/html.',
        klaar: (s) =>
          s.voor === '/var/log' &&
          s.cwd === '/var/www/html' &&
          commandos(s)
            .filter((w) => w[0] === 'cd')
            .every((w) => w[1] && !/^[/~]/.test(w[1])),
      },
      { tekst: 'Ga terug naar je thuismap.', klaar: (s) => s.cwd === HOME },
    ],
    // Twee stappen (cd .. en dan cd www/html), of een absoluut pad: het
    // vinkje komt pas na één relatief pad vanuit /var/log. De melding noemt
    // beide: "in één keer" alleen klonk als een verwijt aan wie het met een
    // absoluut pad in één keer deed.
    vast: (s, klaar) =>
      klaar[0] && !klaar[1] && s.cwd !== '/var/log'
        ? `Je staat in ${s.cwd}. Het tweede doel telt alleen met één relatief pad (zonder / vooraan) vanuit /var/log. Ga terug naar /var/log en probeer het opnieuw.`
        : null,
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
      { tekst: 'Ga naar /var/www/html/config.', klaar: (s) => s.cwd === '/var/www/html/config' },
    ],
  },
  '1.3.b': {
    opVolgorde: true,
    doelen: [
      {
        tekst: 'Typ ls /etc/hots, met de typfout.',
        klaar: (s) =>
          s.regel.trim() === 'ls /etc/hots' &&
          s.uitvoer[0] === "ls: cannot access '/etc/hots': No such file or directory",
      },
      {
        tekst: 'Haal hem terug, verbeter hem, en voer hem opnieuw uit.',
        klaar: (s) => s.regel.trim() === 'ls /etc/hosts' && s.uitvoer[0] === '/etc/hosts',
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
        // Ook met ls -l: dan staat todo.txt aan het eind van de regel.
        klaar: (s) => gebruikt(s, 'ls') && namen(s).join(' ') === 'todo.txt',
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
        // Eén mv-commando met een jokerteken, en daarna staan precies de
        // foto's in fotos. Twee losse mv's (ook op één regel, met ; of &&)
        // tellen niet, en `mv * fotos/` ook niet: dan staan het liedje, de
        // pdf en het verslag er ook in.
        klaar: (s) =>
          inEenKeer(s, 'mv', FOTOS, true) &&
          FOTOS.every((f) => bestaat(s, `~/downloads/fotos/${f}`)) &&
          FOTOS.every((f) => !bestaat(s, `~/downloads/${f}`)) &&
          ANDERE.every((f) => bestaat(s, `~/downloads/${f}`)),
      },
      {
        tekst: 'Laat zien wat er nu in fotos staat.',
        // `ls fotos` en `ls fotos/*` allebei; de volgorde op het scherm doet
        // er niet toe (zie namen).
        klaar: (s) => gebruikt(s, 'ls') && namen(s).join(' ') === FOTOS.join(' '),
      },
    ],
    vast: (s, klaar) => {
      // Eerst mv en dan pas mkdir: dan heet de foto nu fotos, als bestand.
      const node = getNode(s.fs, pad(s, '~/downloads/fotos'));
      if (node.exists && !node.isDir)
        return `fotos is een bestand geworden en geen map: mv hernoemt een bestand als de map er nog niet is. ${OPNIEUW}`;
      if (klaar[1]) return null;
      if (ANDERE.some((f) => !bestaat(s, `~/downloads/${f}`)))
        return `Er is meer verplaatst dan de .jpg- en .png-bestanden. ${OPNIEUW}`;
      if (FOTOS.some((f) => !bestaat(s, `~/downloads/${f}`)))
        return `Een deel van de foto's staat al niet meer in downloads. Het doel vraagt één mv met jokertekens die ze allemaal tegelijk verplaatst. ${OPNIEUW}`;
      return null;
    },
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
        tekst:
          'Kijk eerst met ls (of echo) en een jokerteken welke .tmp-bestanden je gaat weggooien.',
        // Ook ls -l en echo: de voorspelvraag van de les raadt `ls *` of
        // `echo *` aan.
        klaar: (s) =>
          (gebruikt(s, 'ls') || gebruikt(s, 'echo')) &&
          s.regel.includes('*') &&
          namen(s).join(' ') === 'cache1.tmp cache2.tmp',
      },
      {
        tekst: 'Gooi ze weg met één rm, en laat de rest staan.',
        klaar: (s) =>
          inEenKeer(s, 'rm', ['cache1.tmp', 'cache2.tmp']) &&
          !bestaat(s, '~/project/cache1.tmp') &&
          !bestaat(s, '~/project/cache2.tmp') &&
          bestaat(s, '~/project/main.py') &&
          bestaat(s, '~/project/README.md'),
      },
    ],
    vast: (s, klaar) => {
      const weg = (naam: string) => !bestaat(s, `~/project/${naam}`);
      if (!klaar[1] && (weg('main.py') || weg('README.md')))
        return `Er is meer weg dan de .tmp-bestanden. ${OPNIEUW}`;
      if (!klaar[0] && (weg('cache1.tmp') || weg('cache2.tmp')))
        return `cache1.tmp of cache2.tmp is weg of hernoemd voordat je bekeek welke bestanden je jokerteken vindt. ${OPNIEUW}`;
      if (klaar[0] && !klaar[1] && weg('cache1.tmp') !== weg('cache2.tmp'))
        return `Eén .tmp-bestand is al weg: met één rm lukt het zo niet meer. ${OPNIEUW}`;
      return null;
    },
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
