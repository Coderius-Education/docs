import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OPDRACHTEN, maakSessie, volgDoelen } from '../components/LinuxTerminal/opdrachten';
import { LEEG, toets } from '../components/LinuxTerminal/regel';

// Elke opdracht in de oefenterminal (terminal/) heeft een eigen oefenterminal, direct onder de
// opdracht en vóór de tip, met de doelen uit opdrachten.ts erboven. Deze test
// bewaakt dat elke opdracht er een heeft (of een reden waarom niet), dat de
// terminal op zijn plek staat, en dat de doelen eerlijk zijn: het antwoord uit
// de les haalt ze allemaal, zonder de laatste stap niet, en wie alleen wat
// rondkijkt haalt er geen.

const TERMINAL = fileURLToPath(new URL('../../docs/terminal', import.meta.url));

/** Opdrachten zonder terminal, met de reden. */
const ZONDER_TERMINAL: Record<string, string> = {
  '4.1.a': 'je leest een regel die in de les staat; er is niets te typen',
};

type Sectie = { id: string; les: string; tekst: string };

const secties: Sectie[] = readdirSync(TERMINAL)
  .filter((n) => n.endsWith('.mdx'))
  .flatMap((les) => {
    const bron = readFileSync(join(TERMINAL, les), 'utf8');
    return [...bron.matchAll(/^## Opdracht (\d\.\d\.[a-z]):/gm)].map((m) => {
      const start = m.index ?? 0;
      const einde = bron.indexOf('\n## ', start + 1);
      return { id: m[1], les, tekst: bron.slice(start, einde === -1 ? undefined : einde) };
    });
  });

function antwoord(s: Sectie): string[] {
  const na = s.tekst.split('<summary>Klik hier voor het antwoord</summary>')[1] ?? '';
  const blok = na.match(/```bash\n([\s\S]*?)```/);
  return (blok?.[1] ?? '').split('\n').filter((r) => r.trim() && !r.trim().startsWith('#'));
}

function speel(id: string, regels: string[], kolommen = 80): boolean[] {
  const sessie = maakSessie(OPDRACHTEN[id].bestanden, { kolommen: () => kolommen });
  let klaar: boolean[] = [];
  for (const regel of regels) klaar = volgDoelen(OPDRACHTEN[id], klaar, sessie.typ(regel).stand);
  return OPDRACHTEN[id].doelen.map((_, i) => klaar[i] ?? false);
}

describe('een terminal per opdracht', () => {
  it('elke opdracht heeft doelen in opdrachten.ts, of een reden waarom niet', () => {
    const ids = secties.map((s) => s.id).sort();
    expect([...Object.keys(OPDRACHTEN), ...Object.keys(ZONDER_TERMINAL)].sort()).toEqual(ids);
  });

  it('de terminal staat in zijn eigen opdracht, onder de tekst en vóór de tip', () => {
    const fout: string[] = [];
    for (const s of secties) {
      const tags = [...s.tekst.matchAll(/<LinuxTerminal opdracht="([^"]+)" \/>/g)];
      const tip = s.tekst.indexOf('<details>');
      if (s.id in ZONDER_TERMINAL) {
        if (tags.length) fout.push(`${s.id}: staat in ZONDER_TERMINAL maar heeft een terminal`);
        continue;
      }
      if (tags.length !== 1 || tags[0][1] !== s.id) fout.push(`${s.id}: niet één eigen terminal`);
      else if ((tags[0].index ?? 0) > tip) fout.push(`${s.id}: terminal na de tip`);
    }
    expect(fout).toEqual([]);
  });

  it('geen terminal met een opdracht buiten die opdracht', () => {
    const totaal = readdirSync(TERMINAL)
      .filter((n) => n.endsWith('.mdx'))
      .flatMap((les) => [
        ...readFileSync(join(TERMINAL, les), 'utf8').matchAll(/<LinuxTerminal opdracht=/g),
      ]).length;
    expect(totaal).toBe(Object.keys(OPDRACHTEN).length);
  });

  it('geen opdracht vraagt nog om de pagina te herladen', () => {
    for (const s of secties) expect(s.tekst, s.id).not.toMatch(/herlaad/);
  });

  for (const s of secties.filter((x) => x.id in OPDRACHTEN)) {
    describe(s.id, () => {
      const regels = antwoord(s);

      it('het antwoord uit de les haalt elk doel', () => {
        expect(regels.length).toBeGreaterThan(0);
        expect(speel(s.id, regels)).toEqual(OPDRACHTEN[s.id].doelen.map(() => true));
      });

      it('zonder de laatste regel van het antwoord is hij niet klaar', () => {
        expect(speel(s.id, regels.slice(0, -1)).every(Boolean)).toBe(false);
      });

      it('rondkijken haalt geen doel', () => {
        expect(speel(s.id, ['help', 'pwd', 'ls']).some(Boolean)).toBe(false);
      });
    });
  }

  // Uit de leerling-doorloop: goede antwoorden die geen vinkje kregen, en
  // foute die het wel kregen. Elk antwoord hier is een reeks regels in een
  // verse terminal met de startbestanden van de opdracht.
  const OOK_GOED: Record<string, string[][]> = {
    '2.1.a': [
      ['wc /etc/passwd', 'tail -n 1 /etc/passwd'],
      ['cat /etc/passwd | wc -l', 'tail -1 /etc/passwd'],
      // Het getal vast aan -n, zoals coreutils het ook leest.
      ['wc -l /etc/passwd', 'tail -n1 /etc/passwd'],
    ],
    '2.2.a': [
      [
        'mkdir lijstjes',
        'cd lijstjes',
        'echo brood > boodschappen.txt',
        'echo kaas >> boodschappen.txt',
        'echo appels >> boodschappen.txt',
        'wc boodschappen.txt',
      ],
    ],
    '2.3.a': [
      ['mkdir oud', 'cp notities.txt oud/kopie.txt', 'mv notities.txt todo.txt', 'rm -r oud', 'ls'],
      // Controleren met ls -l: todo.txt staat aan het eind van de regel.
      ['mkdir oud', 'cp notities.txt oud', 'mv notities.txt todo.txt', 'rm -r oud', 'ls -l'],
      // Alles op één regel: elk commando telt apart, zoals op losse regels.
      // Eerst keek het doel alleen naar het eind van de regel, en dan was oud
      // al weg: nul vinkjes.
      ['mkdir oud && cp notities.txt oud && mv notities.txt todo.txt && rm -r oud && ls'],
      // Een lege map weggooien met rmdir, zoals Ubuntu het kan.
      [
        'mkdir oud',
        'cp notities.txt oud',
        'mv notities.txt todo.txt',
        'rm oud/notities.txt',
        'rmdir oud',
        'ls',
      ],
    ],
    '2.4.a': [
      // Controleren met de jokertekens van daarnet: ls zet de map ervoor.
      ['cd downloads', 'mkdir fotos', 'mv *.jpg *.png fotos', 'ls fotos/*'],
      // Met ls -a staan . en .. erbij; dat zijn geen bestanden in fotos.
      ['cd downloads', 'mkdir fotos', 'mv *.jpg *.png fotos', 'ls -a fotos'],
      ['cd downloads', 'mkdir fotos', 'mv *.jpg *.png fotos', 'ls -la fotos'],
      // [gG] en {jpg,png} vult de shell in, zoals bash.
      ['cd downloads', 'mkdir fotos', 'mv *[gG] fotos', 'ls fotos'],
      ['cd downloads', 'mkdir fotos', 'mv *.{jpg,png} fotos', 'ls fotos'],
      ['cd ~/downloads && mkdir fotos && mv *.jpg *.png fotos && ls fotos'],
    ],
    '2.4.b': [
      // Kijken mag ook met ls -l of echo, en met een ? als jokerteken: dat
      // leert dezelfde les.
      ['cd project', 'ls -l *.tmp', 'rm *.tmp'],
      ['cd project', 'echo *.tmp', 'rm *.tmp'],
      ['cd project', 'ls cache?.tmp', 'rm cache?.tmp'],
      ['cd project', 'echo cache?.tmp', 'rm *.tmp'],
    ],
    '3.1.a': [
      ['grep inloggen /var/log/apache2/access.log'],
      ['cat /var/log/apache2/access.log | grep inloggen.html'],
      // Met een jokerteken zet grep de bestandsnaam voor elke regel.
      ['grep inloggen.html /var/log/apache2/*'],
      ['cd /var/log/apache2', 'grep inloggen.html *'],
    ],
    '1.2.a': [
      // Op één regel: elke cd telt apart, de tweede vanuit /var/log.
      ['cd /var/log && cd ../www/html && cd'],
    ],
    '1.3.b': [
      // Met twee spaties is het hetzelfde commando, zoals in bash.
      ['ls  /etc/hots', 'ls  /etc/hosts'],
    ],
    '1.2.b': [
      // Het absolute pad mag ook uit ls komen.
      ['ls /var/www/html/config', 'ls /var/www/html/config/instellingen.conf'],
    ],
    '3.2.a': [['cd /var/log', "find . -name '*.log'"], ["find / -name '*.log'"]],
    '3.2.b': [['find /var/ -type d'], ['cd /var', 'find . -type d']],
  };
  const NIET_GOED: Record<string, string[][]> = {
    '3.1.a': [
      ['cat /var/log/apache2/access.log'],
      ['grep GET /var/log/apache2/access.log'],
      ['cat /var/log/apache2/access.log | grep .'],
    ],
    '3.2.a': [['find /var/log -type f'], ['find /var/log']],
    '3.2.b': [['find /var'], ['find /var -type f']],
    '2.4.a': [
      [
        'cd downloads',
        'mkdir fotos',
        'mv vakantie1.jpg fotos/',
        'mv vakantie2.jpg fotos/',
        'mv kat.png fotos/',
        'ls fotos',
      ],
      // Twee mv's met een jokerteken: alles staat er, maar niet "met één mv".
      ['cd downloads', 'mkdir fotos', 'mv *.jpg fotos', 'mv *.png fotos', 'ls fotos'],
      // Ook niet op één regel.
      ['cd downloads', 'mkdir fotos', 'mv *.jpg fotos && mv *.png fotos', 'ls fotos'],
      ['cd downloads', 'mkdir fotos', 'mv *.jpg fotos/; mv *.png fotos/', 'ls fotos'],
      // Alles verplaatsen is niet alleen de foto's.
      ['cd downloads', 'mkdir fotos', 'mv * fotos/', 'ls fotos'],
      // Eén mv, maar zonder jokertekens.
      ['cd downloads', 'mkdir fotos', 'mv vakantie1.jpg vakantie2.jpg kat.png fotos/', 'ls fotos'],
      // Een tweede mv met jokertekens, nadat de eerste al een foto deed: de
      // tekst van het laatste commando noemt alles, maar hij deed niet alles.
      ['cd downloads', 'mkdir fotos', 'mv kat.png fotos', 'mv *.jpg *.png fotos', 'ls fotos'],
    ],
    '2.4.b': [
      // Twee keer rm is niet "met één rm".
      ['cd project', 'ls *.tmp', 'rm cache1.tmp', 'rm cache2.tmp'],
      ['cd project', 'ls *.tmp', 'rm cache1.tmp; rm cache2.tmp'],
      // Eén rm, maar zonder jokerteken.
      ['cd project', 'ls *.tmp', 'rm cache1.tmp cache2.tmp'],
    ],
    '1.2.b': [
      // Alleen de map bekijken is nog niet het absolute pad.
      ['cd /var/www/html', 'ls config'],
    ],
    '1.2.a': [
      // Twee stappen op één regel zijn nog steeds twee stappen, net als
      // twee cd's op losse regels (en twee mv's op één regel in 2.4.a). Eerst
      // telde `cd .. && cd www/html` als één relatief pad vanuit /var/log.
      ['cd /var/log', 'cd .. && cd www/html', 'cd'],
    ],
  };

  for (const [id, antwoorden] of Object.entries(OOK_GOED)) {
    it(`${id}: ook een ander goed antwoord haalt elk doel`, () => {
      for (const a of antwoorden)
        expect(speel(id, a), a.join(' ; ')).toEqual(OPDRACHTEN[id].doelen.map(() => true));
    });
  }
  for (const [id, antwoorden] of Object.entries(NIET_GOED)) {
    it(`${id}: een fout antwoord haalt niet elk doel`, () => {
      for (const a of antwoorden) expect(speel(id, a).every(Boolean), a.join(' ; ')).toBe(false);
    });
  }

  // Een opdracht om te filteren moet iets wegfilteren: eerst had het
  // logboek van de webserver één regel en eindigde alles in /var/log op .log,
  // zodat cat en find zonder -name hetzelfde gaven als het antwoord.
  const ONGEFILTERD: Record<string, string> = {
    '3.1.a': 'cat /var/log/apache2/access.log',
    '3.2.a': 'find /var/log',
  };
  for (const [id, zonder] of Object.entries(ONGEFILTERD)) {
    it(`${id}: het antwoord geeft minder dan ${zonder}`, () => {
      const sectie = secties.find((x) => x.id === id);
      if (!sectie) throw new Error(id);
      const regels = antwoord(sectie);
      const sessie = maakSessie(OPDRACHTEN[id].bestanden);
      const met = regels.map((r) => sessie.typ(r).stand.uitvoer).at(-1) ?? [];
      const zonderUit = maakSessie(OPDRACHTEN[id].bestanden).typ(zonder).stand.uitvoer;
      expect(met.length).toBeGreaterThan(0);
      expect(met.length).toBeLessThan(zonderUit.length);
    });
  }

  describe('het antwoord op één regel geeft dezelfde vinkjes als op losse regels', () => {
    // Een doel kijkt per commando in de regel (volgDoelen). Eerst keek het
    // alleen naar het eind van de regel: in 2.3.a gaf het hele antwoord met
    // && ertussen nul vinkjes en geen melding.
    const ANDERS: Record<string, string> = {
      '1.3.c': 'history telt regels, niet commando’s: op één regel is er maar één',
    };
    const ANDERS_MET_EN: Record<string, string> = {
      '1.3.b': 'de typfout geeft een fout, en && stopt daar, net als in bash',
    };
    for (const [scheiding, uitzonderingen] of [
      ['; ', ANDERS],
      [' && ', { ...ANDERS, ...ANDERS_MET_EN }],
    ] as const) {
      it(`met ${scheiding.trim()} ertussen`, () => {
        for (const s of secties.filter((x) => x.id in OPDRACHTEN && !(x.id in uitzonderingen)))
          expect(speel(s.id, [antwoord(s).join(scheiding)]), s.id).toEqual(
            speel(s.id, antwoord(s)),
          );
      });
    }

    it('de uitzonderingen zijn echt anders', () => {
      for (const id of Object.keys({ ...ANDERS, ...ANDERS_MET_EN })) {
        const s = secties.find((x) => x.id === id);
        if (!s) throw new Error(id);
        const scheiding = id in ANDERS ? '; ' : ' && ';
        expect(speel(id, [antwoord(s).join(scheiding)]), id).not.toEqual(speel(id, antwoord(s)));
      }
    });
  });

  it('op een smalle terminal haalt het antwoord uit de les ook elk doel', () => {
    // ls zet zijn namen in kolommen op de breedte van de terminal. Op een
    // telefoon van 320 pixels (36 kolommen) stond vakantie2.jpg dan vóór
    // vakantie1.jpg, en kwam het laatste vinkje van 2.4.a nooit: het doel
    // keek naar de volgorde op het scherm.
    for (const s of secties.filter((x) => x.id in OPDRACHTEN))
      for (const kolommen of [20, 36, 41])
        expect(speel(s.id, antwoord(s), kolommen), `${s.id} bij ${kolommen}`).toEqual(
          OPDRACHTEN[s.id].doelen.map(() => true),
        );
  });

  describe('de melding noemt de echte reden', () => {
    // Uit de tweede doorloop: elke melding klopte voor één scenario, en
    // zei bij de buren iets wat niet waar was.
    const melding = (id: string, regels: string[]) => {
      const opdracht = OPDRACHTEN[id];
      const sessie = maakSessie(opdracht.bestanden);
      let klaar: boolean[] = [];
      let tekst: string | null = null;
      for (const regel of regels) {
        const { stand } = sessie.typ(regel);
        klaar = volgDoelen(opdracht, klaar, stand);
        tekst = opdracht.vast?.(stand, klaar) ?? null;
      }
      return tekst;
    };

    it('1.2.a met een absoluut pad: het relatieve pad ontbreekt', () => {
      expect(melding('1.2.a', ['cd /var/log', 'cd /var/www/html'])).toMatch(/relatief pad/);
    });

    it("2.4.a: een deel verplaatst, meer dan de foto's, of mv vóór mkdir", () => {
      expect(
        melding('2.4.a', ['cd downloads', 'mkdir fotos', 'mv vakantie1.jpg kat.png fotos/']),
      ).toMatch(/^kat.png en vakantie1.jpg staan al in fotos, de rest nog niet/);
      expect(melding('2.4.a', ['cd downloads', 'mkdir fotos', 'mv * fotos/'])).toMatch(
        /meer verplaatst/,
      );
      expect(melding('2.4.a', ['cd downloads', 'mv *.png fotos'])).toMatch(/fotos is een bestand/);
    });

    it("2.4.a: de melding zegt wat er met de foto's gebeurd is", () => {
      // Uit de derde doorloop: drie van de vijf foute routes kregen een
      // melding met een andere oorzaak dan de echte.
      // De map staat in de thuismap: dan staan de foto's daar.
      expect(melding('2.4.a', ['mkdir fotos', 'cd downloads', 'mv *.jpg *.png ../fotos/'])).toMatch(
        /staat nu in ~\/fotos, niet in ~\/downloads\/fotos/,
      );
      // Alles voluit in één mv: alles is verplaatst, niet "een deel".
      const voluit = melding('2.4.a', [
        'cd downloads',
        'mkdir fotos',
        'mv vakantie1.jpg vakantie2.jpg kat.png fotos',
      ]);
      expect(voluit).toMatch(/^Alle foto's staan in fotos, maar niet/);
      expect(voluit).not.toMatch(/een deel/);
      // mv met twee foto's en geen map: de tweede is overschreven.
      expect(melding('2.4.a', ['cd downloads', 'mv *.jpg'])).toMatch(
        /^vakantie1.jpg is weg: mv hernoemde hem naar vakantie2.jpg, en de oude vakantie2.jpg is daarmee overschreven/,
      );
      // Ook als er daarna nog een regel kwam.
      expect(melding('2.4.a', ['cd downloads', 'mv *.jpg', 'ls'])).toMatch(/overschreven/);
    });

    it('2.4.a: overschreven alleen als mv echt een foto overschreef', () => {
      // Uit de vierde doorloop: na rm, na een mv naar /tmp en na een gewone
      // hernoeming zei de melding dat kat.png overschreven was.
      const rm = melding('2.4.a', ['cd downloads', 'rm kat.png']);
      expect(rm).toMatch(/^kat.png is weggegooid/);
      expect(rm).not.toMatch(/overschreven|hernoemt/);
      expect(melding('2.4.a', ['cd downloads', 'rm *.jpg'])).toMatch(
        /^vakantie1.jpg en vakantie2.jpg zijn weggegooid/,
      );
      // Buiten de thuismap: waarIs zoekt in het hele bestandssysteem.
      expect(melding('2.4.a', ['cd downloads', 'mv kat.png /tmp'])).toMatch(
        /^kat.png staat nu in \/tmp, niet in ~\/downloads\/fotos/,
      );
      // Hernoemd, en daarna de rest met jokertekens: niets overschreven.
      for (const route of [
        ['cd downloads', 'mv kat.png poes.png'],
        ['cd downloads', 'mkdir fotos', 'mv kat.png poes.png', 'mv *.jpg *.png fotos'],
      ]) {
        const tekst = melding('2.4.a', route);
        expect(tekst, route.join(' ; ')).toMatch(/^kat.png heet nu poes.png/);
        expect(tekst, route.join(' ; ')).not.toMatch(/overschreven/);
      }
    });

    it('2.4.a: na het tweede vinkje zegt hij wat er met de foto of de map gebeurde', () => {
      // Het derde doel kwam dan nooit, en de terminal zei niets.
      const na = ['cd downloads', 'mkdir fotos', 'mv *.jpg *.png fotos'];
      expect(melding('2.4.a', na)).toBeNull();
      expect(melding('2.4.a', [...na, 'rm fotos/kat.png'])).toMatch(/^kat.png is weggegooid/);
      expect(melding('2.4.a', [...na, 'mv fotos fotos2'])).toMatch(
        /^De foto's staan nu in ~\/downloads\/fotos2, niet meer in ~\/downloads\/fotos/,
      );
      expect(melding('2.4.a', [...na, 'rm -r fotos'])).toMatch(
        /^De map ~\/downloads\/fotos is weggegooid, met de foto's erin/,
      );
      expect(melding('2.4.a', [...na, 'mv fotos/kat.png .'])).toMatch(
        /^kat.png staat nu in ~\/downloads, niet meer in ~\/downloads\/fotos/,
      );
      expect(melding('2.4.a', [...na, 'mv liedje.mp3 fotos'])).toMatch(
        /^In fotos staat nu ook liedje.mp3/,
      );
      // Wie het terugzet, krijgt het derde vinkje en geen melding meer.
      expect(
        melding('2.4.a', [...na, 'mv fotos fotos2', 'mv fotos2 fotos', 'ls fotos']),
      ).toBeNull();
      expect(
        speel('2.4.a', [...na, 'mv fotos fotos2', 'mv fotos2 fotos', 'ls fotos']).every(Boolean),
      ).toBe(true);
    });

    it('2.4.b: met een ? als jokerteken loopt niets vast', () => {
      expect(melding('2.4.b', ['cd project', 'ls cache?.tmp', 'rm cache?.tmp'])).toBeNull();
      expect(melding('2.4.b', ['cd project', 'ls *.tmp', 'rm cache1.tmp cache2.tmp'])).toMatch(
        /niet met één rm en een jokerteken/,
      );
    });

    it('2.4.b: hernoemd is niet weg, en eerst kijken met echo telt', () => {
      expect(melding('2.4.b', ['cd project', 'mv cache1.tmp oud.tmp'])).toMatch(/hernoemd/);
      expect(melding('2.4.b', ['cd project', 'echo *.tmp', 'rm *.tmp'])).toBeNull();
      expect(melding('2.4.b', ['cd project', 'ls *.tmp', 'rm cache1.tmp'])).toMatch(/één rm/);
    });
  });

  describe('een opdracht die is vastgelopen, zegt dat', () => {
    // Uit de doorloop: wie in 2.4.b eerst `rm *.tmp` typte, kon geen doel
    // meer halen, en de terminal bleef "Doe het in deze volgorde" zeggen.
    const vast = (id: string, regels: string[]) => {
      const opdracht = OPDRACHTEN[id];
      const sessie = maakSessie(opdracht.bestanden);
      let klaar: boolean[] = [];
      let melding: string | null = null;
      for (const regel of regels) {
        const { stand } = sessie.typ(regel);
        klaar = volgDoelen(opdracht, klaar, stand);
        melding = opdracht.vast?.(stand, klaar) ?? null;
      }
      return melding;
    };

    it('2.4.b: de .tmp-bestanden zijn weg voordat je ze bekeken hebt', () => {
      expect(vast('2.4.b', ['cd project', 'rm *.tmp'])).toMatch(/Opnieuw beginnen/);
      expect(vast('2.4.b', ['cd project', 'ls *.tmp', 'rm *'])).toMatch(/Opnieuw beginnen/);
    });

    it('2.4.a: met twee mv-regels lukt "met één mv" niet meer', () => {
      expect(vast('2.4.a', ['cd downloads', 'mkdir fotos', 'mv *.jpg fotos'])).toMatch(
        /Opnieuw beginnen/,
      );
    });

    it('1.2.a: na twee stappen moet je terug naar /var/log', () => {
      expect(vast('1.2.a', ['cd /var/log', 'cd ..', 'cd www/html'])).toMatch(/\/var\/log/);
      // Op één regel net zo: twee stappen blijven twee stappen.
      expect(vast('1.2.a', ['cd /var/log', 'cd .. && cd www/html'])).toBe(
        vast('1.2.a', ['cd /var/log', 'cd ..', 'cd www/html']),
      );
      expect(vast('1.2.a', ['cd /var/log', 'cd ..', 'cd log'])).toBeNull();
    });

    it('het antwoord uit de les loopt nergens vast', () => {
      for (const s of secties.filter((x) => OPDRACHTEN[x.id]?.vast)) {
        const regels = antwoord(s);
        for (let n = 1; n <= regels.length; n++)
          expect(vast(s.id, regels.slice(0, n)), `${s.id}: ${regels[n - 1]}`).toBeNull();
      }
    });

    it('elke foute route in 2.4 eindigt met een melding', () => {
      // Een route waarop het doel niet meer te halen is, moet dat zeggen. Bij
      // 2.4.b bleef na `rm cache1.tmp cache2.tmp` de status "Doe het in deze
      // volgorde" staan, terwijl er niets meer te doen was.
      for (const id of ['2.4.a', '2.4.b'])
        for (const route of NIET_GOED[id])
          expect(vast(id, route), `${id}: ${route.join(' ; ')}`).toMatch(/Opnieuw beginnen/);
    });

    it('rondkijken is niet vastlopen', () => {
      for (const id of Object.keys(OPDRACHTEN))
        expect(vast(id, ['pwd', 'ls', 'help']), id).toBeNull();
    });
  });

  it('1.2.a: met een absoluut pad telt de tweede stap niet', () => {
    expect(speel('1.2.a', ['cd /var/log', 'cd /var/www/html', 'cd ~'])).toEqual([
      true,
      false,
      false,
    ]);
  });

  it('2.1.a: het hele bestand laten zien is niet alleen de laatste regel', () => {
    expect(speel('2.1.a', ['cat /etc/passwd'])[1]).toBe(false);
  });

  it('2.3.a: de map oud weggooien telt pas als er een kopie in zat', () => {
    expect(speel('2.3.a', ['ls', 'rm -r oud'])).toEqual([false, false, false, false]);
  });

  it('2.2.a: tellen telt alleen als het bestand klopt', () => {
    expect(
      speel('2.2.a', [
        'mkdir lijstjes',
        'echo brood > lijstjes/boodschappen.txt',
        'echo kaas > lijstjes/boodschappen.txt',
        'wc -l lijstjes/boodschappen.txt',
      ]),
    ).toEqual([true, false, false]);
  });

  it('1.3.b: de toetsen uit de les maken van hots echt hosts', () => {
    // De les zei eerst "drie keer pijltje links" bij hostnme; dat gaf
    // hostanme, en het tweede vinkje kwam nooit.
    const les = readFileSync(join(TERMINAL, 'sneller.mdx'), 'utf8');
    const getallen: Record<string, number> = { een: 1, twee: 2, drie: 3, vier: 4 };
    const keren = [...les.matchAll(/(een|twee|drie|vier) keer (?:op )?pijltje links/g)].map(
      (m) => getallen[m[1]],
    );
    expect(keren.length).toBeGreaterThan(0);
    const sessie = maakSessie();
    sessie.typ('ls /etc/hots');
    for (const n of keren) {
      let stand = toets(LEEG, '\x1b[A', sessie).stand;
      for (let i = 0; i < n; i++) stand = toets(stand, '\x1b[D', sessie).stand;
      expect(toets(stand, 's', sessie).stand.tekst).toBe('ls /etc/hosts');
    }
  });
});
