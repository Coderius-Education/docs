import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Deze tutorials zijn geen naslag: de leerling zit erbij met VS Code open en
// doet mee. Wie klikt en daarna niet weet of het gelukt is, gaat door met een
// verkeerde aanname en loopt drie stappen verderop vast op iets anders. In de
// simulator lost het `Doel:`-vinkje dat op; op de eigen computer moet de tekst
// het doen.

const GIT = fileURLToPath(new URL('../../docs/git', import.meta.url));

/** Tutorials waar de leerling zelf klikt en typt op zijn eigen computer. */
const DOE_TUTORIALS = ['vscode', 'push', 'pull-clone', 'branches', 'pull-request'];

function stappen(map: string): string[] {
  return readdirSync(join(GIT, map))
    .filter((f) => f.startsWith('stap-') && f.endsWith('.md'))
    .sort();
}

function tekst(map: string, bestand: string): string {
  return readFileSync(join(GIT, map, bestand), 'utf8');
}

describe('elke stap vertelt je wat je moet zien', () => {
  for (const map of DOE_TUTORIALS) {
    it(`${map}: geen enkele stap laat je in het ongewisse`, () => {
      // Een eigen kopje, niet een zin ergens in de lopende tekst: de leerling
      // moet het kunnen vinden zonder te lezen wat hij net gedaan heeft.
      const zonder = stappen(map).filter(
        (f) => !/\n## (Wat je nu ziet|Controleer op GitHub)/.test(tekst(map, f)),
      );

      expect(zonder).toEqual([]);
    });
  }
});

describe('elke doe-tutorial vangt op wat er misgaat', () => {
  it('heeft een "Er gaat iets mis"-pagina', () => {
    // Foutgestuurd leren staat in het didactisch kader van de organisatie.
    // Alleen push had zo'n pagina; de rest liet je met je fout zitten.
    const zonder = DOE_TUTORIALS.filter(
      (map) => !readdirSync(join(GIT, map)).includes('problemen.md'),
    );

    expect(zonder).toEqual([]);
  });

  it('elke probleempagina noemt oorzaak en oplossing bij elk probleem', () => {
    const scheef: string[] = [];

    for (const map of DOE_TUTORIALS) {
      if (!readdirSync(join(GIT, map)).includes('problemen.md')) continue;
      const inhoud = tekst(map, 'problemen.md');
      // Elk H2 dat een probleem beschrijft (dus niet de afsluitende kopjes)
      // hoort een oorzaak en een oplossing te hebben.
      const secties = inhoud.split(/\n## /).slice(1);
      for (const sectie of secties) {
        const kop = sectie.split('\n')[0];
        if (/Volgende tutorial|Wat je nu kunt|Loopt er iets vast/.test(kop)) continue;
        if (!sectie.includes('**Oorzaak:**') || !sectie.includes('**Oplossing:**')) {
          scheef.push(`${map}/problemen.md — "${kop}"`);
        }
      }
    }

    expect(scheef).toEqual([]);
  });
});

describe('de stappen zijn uitvoerbaar zonder voorkennis van de interface', () => {
  it('noemt hoe je een terminal opent voordat er een commando in moet', () => {
    // "Typ dit in de terminal" is nutteloos als je niet weet waar die zit.
    const fout: string[] = [];

    for (const map of DOE_TUTORIALS) {
      for (const bestand of readdirSync(join(GIT, map)).filter((f) => f.endsWith('.md'))) {
        const inhoud = tekst(map, bestand);
        const vraagtTerminal = /\bterminal\b/i.test(inhoud) && /```bash/.test(inhoud);
        if (!vraagtTerminal) continue;
        if (!/New Terminal/.test(inhoud)) {
          fout.push(`${relative(GIT, join(GIT, map, bestand))}`);
        }
      }
    }

    expect(fout).toEqual([]);
  });
});

describe('de mappen die geen doe-tutorial zijn', () => {
  it('staan niet per ongeluk in de lijst', () => {
    // basis draait in de simulator (die heeft zijn eigen vinkje) en github
    // speelt zich op de website af. Verschuift dat, dan hoort deze lijst mee
    // te verschuiven.
    const alle = readdirSync(GIT).filter((d) => statSync(join(GIT, d)).isDirectory());
    const buiten = alle.filter((d) => !DOE_TUTORIALS.includes(d));

    expect(buiten.sort()).toEqual(['basis', 'github']);
  });
});
