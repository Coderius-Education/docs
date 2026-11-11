import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { exportTips } from './export';
import { CATEGORIEEN, tips } from './tips';

// De tips zijn ook de checklist waarmee we een cursus nalopen. Dat werkt
// alleen als elke tip in een bekende categorie staat, één controlevraag
// heeft, en een detailpagina die hetzelfde zegt. Vóór deze test was de
// categorie een vrij tekstveld (twee tips schreven "Beoordelen", een derde
// had net zo goed "beoordelen" kunnen schrijven) en bestond de vraag niet.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const pagina = (slug: string) => readFileSync(`${DOCS}/${slug}.md`, 'utf8');

describe('de categorieën', () => {
  it('zijn de onderdelen van een les, in de volgorde van het nalopen', () => {
    expect(CATEGORIEEN.map((c) => c.label)).toEqual([
      'Uitleg',
      'Voorbeelden',
      'Opdrachten',
      'Fouten en feedback',
      'Volgorde en opbouw',
      'Beoordelen',
    ]);
    expect(new Set(CATEGORIEEN.map((c) => c.id)).size).toBe(CATEGORIEEN.length);
    for (const c of CATEGORIEEN) expect(c.omschrijving, c.id).toMatch(/\.$/);
  });
});

describe('elke tip', () => {
  it('staat in een categorie uit de lijst', () => {
    const bekend = CATEGORIEEN.map((c) => c.id) as string[];
    expect(tips.filter((t) => !bekend.includes(t.categorie)).map((t) => t.slug)).toEqual([]);
  });

  it('heeft één controlevraag, en die staat woordelijk op de detailpagina', () => {
    const fout: string[] = [];
    for (const t of tips) {
      const v = t.controlevraag;
      // Eén vraag: één vraagteken, aan het eind. Twee vragen in één regel
      // zijn niet met ja of nee te beantwoorden.
      if (!/^[A-Z][^?]*\?$/.test(v)) fout.push(`${t.slug}: geen enkele vraag`);
      if (!pagina(t.slug).includes(`**Controlevraag:** ${v}\n`)) fout.push(`${t.slug}: pagina`);
    }
    expect(fout).toEqual([]);
    expect(new Set(tips.map((t) => t.controlevraag)).size).toBe(tips.length);
  });

  it('heeft een detailpagina op zijn eigen adres, en elke pagina een tip', () => {
    for (const t of tips) {
      expect(t.detailPad, t.slug).toBe(`/bronnen/${t.slug}`);
      expect(existsSync(`${DOCS}/${t.slug}.md`), t.slug).toBe(true);
      expect(pagina(t.slug), t.slug).toContain(`\n# ${t.term}\n`);
    }
    const paginas = readdirSync(DOCS)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
      .sort();
    expect(paginas).toEqual(tips.map((t) => t.slug).sort());
  });

  it('zegt eerlijk waar hij vandaan komt: een paper, of onze eigen praktijk', () => {
    for (const t of tips) {
      const tekst = pagina(t.slug);
      expect(tekst, t.slug).toContain('\n## Waar komt dit vandaan\n');
      expect(tekst, t.slug).toContain('\n## Hoe wij dit toepassen\n');
      if (t.bron === 'onderzoek') {
        expect(tekst, t.slug).toContain('\n## Het onderzoek\n');
        expect(tekst, t.slug).toContain(`(${t.paper.jaar})`);
      } else {
        // Een tip uit de praktijk doet zich niet voor als onderzoek: geen
        // kop Het onderzoek, geen DOI, en de pagina zegt het zelf.
        expect(t.herkomst, t.slug).toMatch(/\.$/);
        expect(tekst, t.slug).not.toContain('## Het onderzoek');
        expect(tekst, t.slug).not.toContain('doi.org');
        expect(tekst, t.slug).toContain('\n## Wat we zagen\n');
        expect(tekst, t.slug).toMatch(/uit onze eigen praktijk, niet uit een onderzoek/);
      }
    }
    expect(tips.some((t) => t.bron === 'praktijk')).toBe(true);
  });
});

describe('de export tips.json', () => {
  const uit = exportTips('https://voorbeeld.nl/didactiek');

  it('heeft elke categorie met zijn aantal, en elke tip met een heel adres', () => {
    expect(uit.categorieen.map((c) => c.id)).toEqual(CATEGORIEEN.map((c) => c.id));
    expect(uit.categorieen.reduce((n, c) => n + c.aantal, 0)).toBe(tips.length);
    expect(uit.tips.map((t) => t.url)).toEqual(
      tips.map((t) => `https://voorbeeld.nl/didactiek/bronnen/${t.slug}`),
    );
  });

  it('geeft bij een tip uit onderzoek de paper en bij een uit de praktijk de herkomst', () => {
    for (const t of uit.tips) {
      expect(t.controlevraag, t.slug).toMatch(/\?$/);
      if (t.bron === 'onderzoek') {
        expect(t.paper, t.slug).toBeDefined();
        expect(t.herkomst, t.slug).toBeUndefined();
      } else {
        expect(t.herkomst, t.slug).toBeDefined();
        expect(t.paper, t.slug).toBeUndefined();
      }
    }
  });
});
