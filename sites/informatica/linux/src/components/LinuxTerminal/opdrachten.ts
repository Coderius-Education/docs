import { vulAan } from './aanvullen';
import { argumenten, executeCommandLine, parseCommandLine } from './commands';
import {
  HOME,
  createFilesystem,
  getNode,
  promptPad,
  readFile,
  resolvePath,
  splitPad,
} from './filesystem';

// De terminal bij een opdracht. Elke opdracht in de oefenterminal krijgt een eigen,
// verse oefenterminal direct onder de opdracht, met daarboven de doelen als
// lijstje dat afvinkt terwijl de leerling typt. Eerst stond er één terminal
// bovenaan de les: de opdracht stond zestig regels lager, en een verse start
// kon alleen door de pagina te herladen.
//
// De doelen staan hier en niet in de .mdx, zodat opdrachten.test.ts kan
// naspelen dat het antwoord uit de les elk doel haalt (en een half antwoord
// niet). Een doel dat je niet kunt halen, is een vinkje dat nooit komt.

/** Hoe de terminal erbij staat na een regel, of na één stap in een regel. */
export type Stap = {
  fs: object;
  cwd: string;
  /** De map vóór die regel (of stap). */
  voor: string;
  /** Het bestandssysteem vóór die regel (of stap): wat deed dit ene commando? */
  voorFs: object;
  regel: string;
  /** De uitvoer van die regel, per regel en zonder kleurcodes. */
  uitvoer: string[];
};

/** Hoe de terminal erbij staat na de laatste getypte regel. */
export type Stand = Stap & {
  /**
   * Elke stap van die regel apart: `mkdir oud && cp a oud` is twee stappen,
   * `history | tail -3` één. De doelen kijken per stap (volgDoelen).
   */
  stappen: Stap[];
  /** Elke stap sinds het begin van deze oefenterminal: wat is er eerder gebeurd? */
  verloop: Stap[];
};

export type Doel = { tekst: string; klaar: (s: Stap) => boolean };

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
  {
    clear,
    kolommen,
    rijen,
  }: { clear?: () => void; kolommen?: () => number; rijen?: () => number } = {},
) {
  const env = {
    // De breedte van de terminal: `ls` zet zijn namen in kolommen die erop passen.
    kolommen: () => kolommen?.() ?? 80,
    // De hoogte: `help` kort zijn lijst in als hij er niet in past.
    rijen: () => rijen?.() ?? 24,
    cwd: HOME,
    fs: createFilesystem(extraFs),
    geschiedenis: [] as string[],
    setCwd(nieuw: string) {
      env.cwd = nieuw;
    },
    clear: () => clear?.(),
    naStap: (_regel: string, _result: { output?: string }) => {},
  };
  const verloop: Stap[] = [];
  const zonderKleur = (tekst: string) => tekst.replace(/\n$/, '').replace(KLEUR, '');
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
      const voorFs = structuredClone(env.fs);
      // Na elke stap een momentopname: het bestandssysteem van de vorige
      // stap is het voorFs van de volgende.
      const stappen: Stap[] = [];
      let stapVoor = voor;
      let stapVoorFs = voorFs;
      env.naStap = (tekst, result) => {
        const na = structuredClone(env.fs);
        const uit = zonderKleur(result.output ?? '');
        stappen.push({
          fs: na,
          cwd: env.cwd,
          voor: stapVoor,
          voorFs: stapVoorFs,
          regel: tekst,
          uitvoer: uit ? uit.split('\n') : [],
        });
        stapVoor = env.cwd;
        stapVoorFs = na;
      };
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
      verloop.push(...stappen);
      const stand: Stand = {
        fs: env.fs,
        cwd: env.cwd,
        voor,
        voorFs,
        regel,
        uitvoer: tekst ? tekst.split('\n') : [],
        stappen,
        verloop: [...verloop],
      };
      return { results, stand };
    },
  };
}

/**
 * Vinkt af wat met deze stand gehaald is; een gehaald doel blijft gehaald.
 * Elk doel kijkt naar elke stap van de regel apart, in volgorde, alsof de
 * leerling ze op losse regels typte. Eerst keek het alleen naar de eindstand
 * van de regel: `mkdir oud && cp notities.txt oud && … && rm -r oud && ls`
 * gaf in 2.3.a geen enkel vinkje, want aan het eind was de map oud er al niet
 * meer. En `cd .. && cd www/html` telde in 1.2.a als één relatief pad, terwijl
 * het op twee regels terecht een melding gaf.
 */
export function volgDoelen(opdracht: Opdracht, klaar: boolean[], stand: Stand): boolean[] {
  const nieuw = opdracht.doelen.map((_, i) => klaar[i] ?? false);
  for (const stap of stand.stappen.length ? stand.stappen : [stand]) {
    for (let i = 0; i < opdracht.doelen.length; i++) {
      if (nieuw[i]) continue;
      if (opdracht.doelen[i].klaar(stap)) nieuw[i] = true;
      else if (opdracht.opVolgorde) break;
    }
  }
  return nieuw;
}

const pad = (s: Stap, p: string) => resolvePath(s.cwd, p);
const inhoud = (s: Stap, p: string): string | null => {
  const { content } = readFile(s.fs, pad(s, p));
  return content ?? null;
};
const isMap = (s: Stap, p: string) => getNode(s.fs, pad(s, p)).isDir;
/** Staat er in deze map een bestand met deze inhoud, onder welke naam ook? */
const metInhoud = (s: Stap, map: string, tekst: string) => {
  const { node, isDir } = getNode(s.fs, pad(s, map));
  return isDir && Object.values(node as Record<string, unknown>).some((v) => v === tekst);
};
/**
 * Noemt find precies deze paden? Een relatief pad (./x, vanuit cd /var/log)
 * en een / aan het eind (find /var/, met Tab) tellen ook; een Permission
 * denied van find ook, want die is geen fout van de leerling (les 3.2).
 */
const zelfdePaden = (s: Stap, verwacht: string[]) => {
  const paden = s.uitvoer
    .filter((r) => !r.startsWith('find:'))
    .map((r) => resolvePath(s.cwd, r))
    .sort();
  return paden.join('\n') === [...verwacht].sort().join('\n');
};
const bestaat = (s: Stap, p: string) => getNode(s.fs, pad(s, p)).exists;

/** De commando's op de regel, als lijst woorden: `cd ..; ls` -> [['cd','..'],['ls']]. */
const commandos = (s: Stap): string[][] =>
  parseCommandLine(s.regel)
    .map(({ cmd }: { cmd: string }) => cmd.trim().split(/\s+/))
    .filter((w: string[]) => w[0]);
const gebruikt = (s: Stap, naam: string) => commandos(s).some((w) => w[0] === naam);
const OPNIEUW = 'Klik op Opnieuw beginnen en probeer het nog een keer.';
const woorden = (s: Stap) => new Set(s.uitvoer.flatMap((r) => r.split(/\s+/)));
/**
 * De namen in de uitvoer van ls of echo, op alfabet en zonder map ervoor.
 * Niet in de volgorde van het scherm: `ls` zet ze in kolommen op de breedte
 * van de terminal, en op een smalle terminal (een telefoon) stond
 * vakantie2.jpg dan vóór vakantie1.jpg, en kwam het vinkje nooit. Van een
 * regel van `ls -l` telt het laatste woord, en de regel `total` telt niet.
 * `.` en `..` (van `ls -a`) zijn geen namen in de map: met ls -a fotos kwam
 * het vinkje van 2.4.a eerst nooit.
 */
const namen = (s: Stap) =>
  s.uitvoer
    .filter((r) => !/^total \d+$/.test(r))
    .flatMap((r) => (/^[-dl][rwx-]{9} /.test(r) ? [r.split(/\s+/).at(-1) ?? ''] : r.split(/\s+/)))
    .filter(Boolean)
    .map((n) => n.split('/').pop() ?? n)
    .filter((n) => n !== '.' && n !== '..')
    .sort();
/** Gebruikt de regel een jokerteken (`*`, `?` of `[…]`) in een woord na dit commando? */
const metJokerteken = (s: Stap, naam: string) =>
  commandos(s).some((w) => w[0] === naam && w.slice(1).some((a) => /[*?[]/.test(a)));
/**
 * Eén commando met deze naam op de regel, met een jokerteken, en dat ene
 * commando deed het hele werk: vóór de regel stonden al deze bestanden er
 * nog. Zo telt "met één mv" niet voor twee regels mv, niet voor twee op één
 * regel, en niet voor een tweede mv nadat de eerste al een deel deed (de
 * tekst van het laatste commando zei eerst genoeg).
 */
const inEenKeer = (s: Stap, naam: string, wasEr: string[]) =>
  commandos(s).filter((w) => w[0] === naam).length === 1 &&
  metJokerteken(s, naam) &&
  wasEr.every((p) => getNode(s.voorFs, pad(s, p)).exists);
/** De absolute paden van de bestanden met deze naam, in het hele bestandssysteem. */
const padenVan = (fs: object, naam: string): string[] => {
  const gevonden: string[] = [];
  const zoek = (node: Record<string, unknown>, map: string) => {
    for (const [kind, waarde] of Object.entries(node)) {
      const pd = `${map}/${kind}`;
      if (kind === naam && typeof waarde === 'string') gevonden.push(pd);
      if (waarde && typeof waarde === 'object') zoek(waarde as Record<string, unknown>, pd);
    }
  };
  zoek(fs as Record<string, unknown>, '');
  return gevonden;
};
/**
 * In welke mappen staat een bestand met deze naam nu? Overal, niet alleen
 * onder de thuismap: na `mv kat.png /tmp` zei de melding eerst dat kat.png
 * weg was. Zoals de prompt ze schrijft (~/downloads).
 */
const waarIs = (s: Stap, naam: string): string[] =>
  padenVan(s.fs, naam).map((p) => promptPad(splitPad(p)[0]));

/** Wat een commando met een bestand deed waarvan de naam daarna nergens meer stond. */
type Gebeurd =
  | { soort: 'weggegooid' }
  | { soort: 'map weggegooid'; map: string }
  | { soort: 'hernoemd'; naar: string; overschreven: boolean }
  | { soort: 'onbekend' };

/**
 * Wat er gebeurde met het laatste bestand met deze naam: de stap waarin de
 * naam uit het bestandssysteem verdween, en het commando daarin. Een mv met
 * twee namen en geen map erachter hernoemt (en overschrijft als het tweede
 * bestand er al was), rm gooit weg, ook een map met het bestand erin. Zo
 * noemt de melding de echte reden: eerst zei hij na `rm kat.png` en na
 * `mv kat.png poes.png` dat kat.png overschreven was.
 */
function watGebeurdeMet(s: Stand, naam: string): Gebeurd {
  // De laatste zo'n stap (geen findLast: dat kent niet elke schoolbrowser).
  const stap = [...s.verloop]
    .reverse()
    .find((st) => padenVan(st.voorFs, naam).length > 0 && padenVan(st.fs, naam).length === 0);
  if (!stap) return { soort: 'onbekend' };
  const waren = padenVan(stap.voorFs, naam);
  for (const deel of parseCommandLine(stap.regel) as { cmd: string }[]) {
    const { name, args } = argumenten(deel.cmd, { fs: stap.voorFs, cwd: stap.voor });
    const paden = (args as string[])
      .filter((a) => !a.startsWith('-'))
      .map((a) => resolvePath(stap.voor, a));
    if (name === 'rm' || name === 'rmdir') {
      if (paden.some((p) => waren.includes(p))) return { soort: 'weggegooid' };
      const map = paden.find((p) => waren.some((w) => w.startsWith(`${p}/`)));
      if (map) return { soort: 'map weggegooid', map: promptPad(map) };
    }
    if (name === 'mv' && paden.length === 2 && waren.includes(paden[0])) {
      const doel = getNode(stap.voorFs, paden[1]);
      if (!doel.isDir)
        return { soort: 'hernoemd', naar: splitPad(paden[1])[1], overschreven: doel.exists };
    }
  }
  return { soort: 'onbekend' };
}

/** a, b en c */
const opsomming = (namen: string[]) =>
  namen.length < 2 ? namen.join('') : `${namen.slice(0, -1).join(', ')} en ${namen.at(-1)}`;

/** De melding bij foto's die weg zijn: wat er echt mee gebeurde. */
function fotosWeg(s: Stand, weg: string[]): string {
  const gebeurd = weg.map((f) => watGebeurdeMet(s, f));
  if (weg.length > 1 && gebeurd.every((g) => g.soort === 'weggegooid'))
    return `${opsomming(weg)} zijn weggegooid, en rm gooit voorgoed weg. ${OPNIEUW}`;
  return fotoWeg(weg[0], gebeurd[0]);
}

/** De melding bij een foto die weg is: wat er echt met hem gebeurde. */
function fotoWeg(f: string, g: Gebeurd): string {
  if (g.soort === 'hernoemd' && g.overschreven)
    return `${f} is weg: mv hernoemde hem naar ${g.naar}, en de oude ${g.naar} is daarmee overschreven. Een mv met twee bestanden en geen map erachter hernoemt het eerste naar het tweede. ${OPNIEUW}`;
  if (g.soort === 'hernoemd')
    return `${f} heet nu ${g.naar}: een mv met twee namen en geen map erachter hernoemt het bestand. Het doel vraagt de foto's met hun eigen naam. Zet de naam terug met mv, of klik op Opnieuw beginnen.`;
  if (g.soort === 'weggegooid') return `${f} is weggegooid, en rm gooit voorgoed weg. ${OPNIEUW}`;
  if (g.soort === 'map weggegooid')
    return `De map ${g.map} is weggegooid, met ${f} erin. ${OPNIEUW}`;
  return `${f} is weg of hernoemd. ${OPNIEUW}`;
}

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
      {
        // De tip noemt pwd voor het absolute pad; eerst vroeg het doel
        // alleen een ls, en kwam er na pwd geen vinkje.
        tekst: 'Laat het absolute pad van de map config zien, bijvoorbeeld met pwd.',
        klaar: (s) =>
          s.uitvoer.some(
            (r) => r === '/var/www/html/config' || r === '/var/www/html/config/instellingen.conf',
          ),
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
        // Met meer spaties ertussen is het hetzelfde commando, zoals in bash.
        klaar: (s) =>
          s.regel.trim().split(/\s+/).join(' ') === 'ls /etc/hots' &&
          s.uitvoer[0] === "ls: cannot access '/etc/hots': No such file or directory",
      },
      {
        tekst: 'Haal hem terug, verbeter hem, en voer hem opnieuw uit.',
        klaar: (s) =>
          s.regel.trim().split(/\s+/).join(' ') === 'ls /etc/hosts' &&
          s.uitvoer[0] === '/etc/hosts',
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
          inEenKeer(
            s,
            'mv',
            FOTOS.map((f) => `~/downloads/${f}`),
          ) &&
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
      if (klaar[2]) return null;
      // Waar elke foto nu staat. Voor het tweede doel mag hij nog in
      // downloads staan; daarna hoort hij in fotos.
      const thuis = klaar[1] ? ['~/downloads/fotos'] : ['~/downloads', '~/downloads/fotos'];
      const anders = FOTOS.flatMap((f) =>
        thuis.some((m) => bestaat(s, `${m}/${f}`)) ? [] : [{ f, waar: waarIs(s, f) }],
      );
      // Elke melding noemt wat er met de foto's gebeurd is: een foto die
      // ergens anders staat, een die weg is, of alles al in fotos.
      const weg = anders.filter((e) => e.waar.length === 0);
      if (klaar[1]) {
        // Het tweede vinkje is er, maar daarna is er iets met de foto's of
        // de map gebeurd: dan kwam het derde nooit, zonder melding.
        const gebeurd = weg.map((e) => watGebeurdeMet(s, e.f));
        const mapWeg = gebeurd.find((g) => g.soort === 'map weggegooid');
        if (
          mapWeg &&
          gebeurd.every((g) => g.soort === 'map weggegooid') &&
          weg.length === FOTOS.length
        )
          return `De map ${mapWeg.map} is weggegooid, met de foto's erin. ${OPNIEUW}`;
        if (weg.length)
          return fotosWeg(
            s,
            weg.map((e) => e.f),
          );
        const plekken = [...new Set(anders.map((e) => e.waar[0]))];
        if (anders.length === FOTOS.length && plekken.length === 1)
          return `De foto's staan nu in ${plekken[0]}, niet meer in ~/downloads/fotos. Zet ze terug, of klik op Opnieuw beginnen.`;
        if (anders.length)
          return `${anders[0].f} staat nu in ${anders[0].waar[0]}, niet meer in ~/downloads/fotos. Zet hem terug, of klik op Opnieuw beginnen.`;
        const { node: inMap, isDir } = getNode(s.fs, pad(s, '~/downloads/fotos'));
        const extra = isDir ? Object.keys(inMap as object).filter((n) => !FOTOS.includes(n)) : [];
        if (extra.length)
          return `In fotos staat nu ook ${extra.join(' en ')}, en dan laat ls meer zien dan de foto's. Haal ${extra.length === 1 ? 'het' : 'ze'} eruit, of klik op Opnieuw beginnen.`;
        return null;
      }
      if (ANDERE.some((f) => !bestaat(s, `~/downloads/${f}`)))
        return `Er is meer verplaatst dan de .jpg- en .png-bestanden. ${OPNIEUW}`;
      if (weg.length)
        return fotosWeg(
          s,
          weg.map((e) => e.f),
        );
      if (anders.length)
        return `${anders[0].f} staat nu in ${anders[0].waar[0]}, niet in ~/downloads/fotos. Het doel vraagt de map fotos in downloads. ${OPNIEUW}`;
      const inFotos = FOTOS.filter((f) => bestaat(s, `~/downloads/fotos/${f}`));
      if (inFotos.length === FOTOS.length)
        return `Alle foto's staan in fotos, maar niet verplaatst door één mv met jokertekens. Het doel vraagt één mv die ze met een jokerteken allemaal tegelijk verplaatst. ${OPNIEUW}`;
      if (inFotos.length)
        return `${inFotos.join(' en ')} ${inFotos.length === 1 ? 'staat' : 'staan'} al in fotos, de rest nog niet: met één mv lukt het zo niet meer. ${OPNIEUW}`;
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
        // Ook ls -l, echo en een ? als jokerteken: ls cache?.tmp vindt ze ook.
        klaar: (s) =>
          (metJokerteken(s, 'ls') || metJokerteken(s, 'echo')) &&
          namen(s).join(' ') === 'cache1.tmp cache2.tmp',
      },
      {
        tekst: 'Gooi ze weg met één rm en een jokerteken, en laat de rest staan.',
        klaar: (s) =>
          inEenKeer(s, 'rm', ['~/project/cache1.tmp', '~/project/cache2.tmp']) &&
          !bestaat(s, '~/project/cache1.tmp') &&
          !bestaat(s, '~/project/cache2.tmp') &&
          bestaat(s, '~/project/main.py') &&
          bestaat(s, '~/project/README.md'),
      },
    ],
    vast: (s, klaar) => {
      const weg = (naam: string) => !bestaat(s, `~/project/${naam}`);
      if (klaar[1]) return null;
      if (weg('main.py') || weg('README.md'))
        return `Er is meer weg dan de .tmp-bestanden. ${OPNIEUW}`;
      const tmp = ['cache1.tmp', 'cache2.tmp'].filter(weg);
      if (tmp.length === 0) return null;
      if (!klaar[0])
        return `${tmp.join(' en ')} ${tmp.length === 1 ? 'is' : 'zijn'} weg of hernoemd, en je hebt nog niet met ls of echo en een jokerteken bekeken welke bestanden je jokerteken vindt. ${OPNIEUW}`;
      if (tmp.length === 1)
        return `${tmp[0]} is al weg: met één rm voor allebei lukt het zo niet meer. ${OPNIEUW}`;
      return `De .tmp-bestanden zijn weg, maar niet met één rm en een jokerteken. Het doel vraagt rm met een jokerteken dat ze allebei in één keer vindt. ${OPNIEUW}`;
    },
  },
  '3.1.a': {
    doelen: [
      {
        tekst: 'Zoek met één regel alle bezoeken aan inloggen.html.',
        klaar: (s) =>
          gebruikt(s, 'grep') &&
          s.uitvoer.length === BEZOEKEN.length &&
          // Met een jokerteken (apache2/*) zoekt grep in meer bestanden en
          // zet hij de naam van het bestand voor elke regel.
          s.uitvoer.every((r, i) => r.replace(/^(?:\S*\/)?access\.log:/, '') === BEZOEKEN[i]),
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
