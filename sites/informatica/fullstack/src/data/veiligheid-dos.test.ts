import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// In de reeks Te veel verzoeken stond nergens dat @limiter.limit ónder
// @app.get moet. De uitleg van de regel, de tekst onder het voorbeeld en het
// diagram zeiden zelfs "erboven". Andersom start de server gewoon, maar telt
// slowapi stil niets: twintig van de twintig verzoeken lukken (nagedraaid met
// slowapi 0.1.10). Deze test eist die fout met FOUT/GOED in Er gaat iets mis
// van les 4, en weert "erboven" bij de limiter in de lessen en in het diagram.
//
// Les 5 gaf bij de None-fout ook een ontbrekende response: Response als
// oorzaak, maar dan komt er bij verzoek 6 wel een header mee (429, nog 0 over,
// wacht 60 seconden). En de praktijk zette onder Wat jij zelf doet cachen en
// het afbreken van lange verzoeken, niet de limiet die de leerling bouwde.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const MAP = join(DOCS, 'veiligheid/dos');
const DIAGRAM = fileURLToPath(new URL('../components/VerzoekCyclus/index.tsx', import.meta.url));
const lees = (stap: string) => readFileSync(join(MAP, `${stap}.mdx`), 'utf8');
const blokken = (tekst: string, taal = 'python') =>
  [...tekst.matchAll(new RegExp(`\`\`\`${taal}[^\\n]*\\n([\\s\\S]*?)\`\`\``, 'g'))].map(
    (m) => m[1],
  );
const sectie = (tekst: string, kop: string) =>
  tekst.split(new RegExp(`^## ${kop}\\s*$`, 'm'))[1]?.split(/^## /m)[0] ?? '';
const zinnen = (tekst: string) => tekst.split(/(?<=[.?!])\s+|\n\s*\n/);

describe('Te veel verzoeken (DoS)', () => {
  it('Er gaat iets mis in les 4 heeft de verkeerde volgorde met FOUT en GOED', () => {
    const fouten = sectie(lees('limiet'), 'Er gaat iets mis');
    const volgorde = blokken(fouten).find((blok) => {
      const [fout, goed = ''] = blok.split('# GOED');
      const limietFout = fout.indexOf('@limiter.limit');
      const limietGoed = goed.indexOf('@limiter.limit');
      return (
        fout.includes('# FOUT') &&
        limietFout !== -1 &&
        limietFout < fout.indexOf('@app.') &&
        goed.indexOf('@app.') !== -1 &&
        goed.indexOf('@app.') < limietGoed
      );
    });
    expect(volgorde, 'FOUT: @limiter.limit boven @app., GOED: eronder').toBeDefined();
    expect(fouten).toContain('Gelukt: 20 van de 20');
  });

  it('de uitleg van de regel met @limiter.limit zegt: direct onder @app.get', () => {
    const uitleg = lees('limiet').split('<CodeUitleg>')[1]?.split('</CodeUitleg>')[0] ?? '';
    const regels = (blokken(uitleg)[0] ?? '').split('\n');
    const n = regels.findIndex((r) => r.startsWith('@limiter.limit')) + 1;
    expect(n).toBeGreaterThan(0);
    const regel = uitleg.match(new RegExp(`<Regel n=\\{${n}\\}>([\\s\\S]*?)</Regel>`))?.[1] ?? '';
    expect(regel).toContain('onder `@app.get`');
  });

  it('nergens staat de limiet "erboven", ook niet in het diagram', () => {
    const fout: string[] = [];
    for (const naam of readdirSync(MAP).filter((n) => n.endsWith('.mdx'))) {
      for (const zin of zinnen(readFileSync(join(MAP, naam), 'utf8'))) {
        if (/erboven/i.test(zin) && /limi(ter|et)/i.test(zin)) fout.push(`${naam}: ${zin}`);
      }
    }
    const dos = readFileSync(DIAGRAM, 'utf8').match(/const DOS_STAPPEN[\s\S]*?\n\];/)?.[0] ?? '';
    expect(dos).toContain('@limiter.limit');
    for (const zin of zinnen(dos)) {
      if (/erboven/i.test(zin)) fout.push(`DOS_STAPPEN: ${zin.trim()}`);
    }
    expect(fout).toEqual([]);
  });

  it('les 5: None komt van een server zonder headers_enabled, niet van response', () => {
    const delen = sectie(lees('te-veel'), 'Er gaat iets mis').split(/^### /m).slice(1);
    const none = delen.find((d) => d.includes('nog None over')) ?? '';
    const oorzaak = none.split('**Oorzaak:**')[1]?.split('**Oplossing:**')[0] ?? '';
    expect(oorzaak).toContain('headers_enabled');
    expect(oorzaak).not.toContain('response');
    // Zonder response: Response zijn de eerste vijf een 500, en heeft de 429
    // van slowapi de headers wel.
    const zonderResponse = delen.find((d) => d.includes('must be an instance')) ?? '';
    expect(zonderResponse).toContain('Verzoek 5: 500, nog None over');
    expect(zonderResponse).toContain('Verzoek 6: 429, nog 0 over, wacht 60 seconden');
  });

  it('de praktijk begint bij de limiet, en houdt cachen in een uitklapblok', () => {
    const tekst = lees('praktijk');
    const zelf = sectie(tekst, 'Wat jij zelf doet');
    expect(zelf).toContain('@limiter.limit');
    expect(zelf).toContain('](./limiet)');
    expect(zelf).not.toMatch(/cachen/i);
    expect(zelf).not.toMatch(/te lang duurt/);
    const groot = sectie(tekst, 'Wat grote sites nog meer doen');
    expect(groot).toMatch(/<details>\s*<summary>[^<]*<\/summary>[\s\S]*Cachen[\s\S]*?<\/details>/);
    // Wie om en om bij drie servers aanklopt, mag drie keer zo vaak; de
    // situatie zei eerst dat de limiet "maar voor een derde" werkte.
    expect(tekst).toMatch(/drie servers, en iemand mag\s+ineens\s+drie keer zo vaak/);
  });
});
