import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// De RoboCup-pagina's (docs/robocup/) waren geschreven voor de liga Redden en
// niet voor Redden Basis: een "aluminiumrand" om de evacuatiezone (er staat een
// muur), een eindpunt dat je met de aluminiumtape zou vinden (het is een zwarte
// driehoek), zwarte ballen (alleen zilveren), en de gaten en drempels die punten
// opleveren ontbraken. De review van november 2026 legde elke bewering naast de
// spelregels (static/docs/RoboCupJuniorReddenBasis2025_rev1.pdf); deze test
// houdt vast wat daaruit kwam.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const ROBOCUP = join(SITE, 'docs', 'robocup');

const paginas = readdirSync(ROBOCUP)
  .filter((n) => /\.mdx?$/.test(n))
  .map((bestand) => {
    const tekst = readFileSync(join(ROBOCUP, bestand), 'utf8');
    const positie = Number(tekst.match(/^sidebar_position: (\d+)$/m)?.[1]);
    const slug = bestand.replace(/\.mdx?$/, '').replace(/^\d+_/, '');
    return { bestand, tekst, positie, slug };
  })
  .sort((a, b) => a.positie - b.positie);

describe('RoboCup Junior', () => {
  it('elke pagina heeft een eigen sidebar_position en een description', () => {
    const posities = paginas.map((p) => p.positie);
    expect(posities.every(Number.isFinite)).toBe(true);
    expect(new Set(posities).size).toBe(posities.length);
    const zonder = paginas.filter((p) => !/^description: \S/m.test(p.tekst)).map((p) => p.bestand);
    expect(zonder).toEqual([]);
  });

  it('elke pagina linkt aan het eind naar de volgende, de laatste terug naar het begin', () => {
    // De uitdagingen liepen niet door: wie klaar was met een pagina, moest
    // terug naar de sidebar.
    const fout: string[] = [];
    paginas.forEach((p, i) => {
      const volgende = paginas[i + 1]?.slug ?? 'start';
      const laatste = p.tekst.trim().split('\n').at(-1) ?? '';
      if (!laatste.includes(`(site:robotica/docs/robocup/${volgende})`))
        fout.push(`${p.bestand}: eindigt niet met een link naar ${volgende}`);
    });
    expect(fout).toEqual([]);
  });

  it('elke hindernis die punten oplevert, heeft een pagina die de startpagina noemt', () => {
    // Regel 4.5.5: een gat (5), een drempel (5) en een obstakel (10).
    const start = paginas.find((p) => p.slug === 'start')?.tekst ?? '';
    const fout = ['gaten', 'drempels', 'obstakels'].filter(
      (slug) =>
        !paginas.some((p) => p.slug === slug) ||
        !start.includes(`site:robotica/docs/robocup/${slug})`),
    );
    expect(fout).toEqual([]);
  });

  it('de beweringen over de baan volgen de spelregels van Redden Basis', () => {
    const fout: string[] = [];
    for (const p of paginas) {
      // 1.6.2: om de evacuatiezone staat een muur; alleen de ingang heeft tape.
      if (/aluminiumrand|aluminium-rand/i.test(p.tekst)) fout.push(`${p.bestand}: aluminiumrand`);
      // 1.7.2: alleen zilveren ballen.
      if (/zwarte bal/i.test(p.tekst)) fout.push(`${p.bestand}: zwarte ballen`);
      // Een piezo meet geen afstand.
      if (/piezo/i.test(p.tekst)) fout.push(`${p.bestand}: piezo als sensor`);
    }
    // 1.6.4: het evacuatiepunt is een zwarte driehoek.
    const punt = paginas.find((p) => p.slug === 'detectie_eindpunt')?.tekst ?? '';
    if (!/zwart/i.test(punt) || !/driehoek/i.test(punt))
      fout.push('evacuatiepunt: niet zwart of geen driehoek');
    expect(fout).toEqual([]);
  });

  it('de afstand komt van een TOF, niet van een ultrasone sensor', () => {
    // Op de RoboCup-robot is de TOF op de multiplexer de standaard: hij kost
    // geen pinnen en meet preciezer. Een ultrasone sensor heeft twee eigen
    // D-pinnen nodig (zie docs/onderdelen/afstandssensor.mdx).
    const fout = paginas.filter((p) => /read_distance\(/.test(p.tekst)).map((p) => p.bestand);
    expect(fout).toEqual([]);
  });
});

describe('de pinnen van het motor shield', () => {
  it('overal precies D2, D3, D4 en D11', () => {
    // De pagina over de evacuatiezone zei D2, D3, D10 en D11; de rest van de
    // site D2, D3, D4 en D11 (zie docs/onderdelen/_delen/dc-motor/let-op.md).
    // Een regel met vier pinnen of meer naast het motor shield is zo'n
    // opsomming; met drie is het meestal een vraag ("D3, D6 of D11?").
    const fout: string[] = [];
    const loop = (map: string) => {
      for (const naam of readdirSync(map)) {
        const pad = join(map, naam);
        if (statSync(pad).isDirectory()) loop(pad);
        else if (/\.mdx?$/.test(naam)) {
          const regels = readFileSync(pad, 'utf8').split('\n');
          regels.forEach((regel, i) => {
            const pinnen = new Set(regel.match(/\bD\d{1,2}\b/g) ?? []);
            const omgeving = regels.slice(i, i + 3).join(' ');
            if (pinnen.size >= 4 && /motor ?shield|DC-motoren/i.test(omgeving)) {
              const gevonden = [...pinnen].sort().join(',');
              if (gevonden !== 'D11,D2,D3,D4')
                fout.push(`${pad.slice(SITE.length)}:${i + 1}: ${gevonden}`);
            }
          });
        }
      }
    };
    for (const map of ['docs', 'lego_auto', 'src/pages']) loop(join(SITE, map));
    expect(fout).toEqual([]);
  });
});
