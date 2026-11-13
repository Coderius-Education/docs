import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Met les-tabbladen is elke ##-sectie van een pagina een tabblad. Een
// challenge had vier secties van één of twee regels (Onderwerp, Beschrijving,
// Wat je leert, Hints): vijf tabbladen die elk bijna leeg waren, voor een
// pagina die op één scherm past. Een challenge heeft daarom twee tabbladen:
// De challenge, met alles wat je vooraf wilt weten, en Hints, voor wie
// vastloopt. Deze test leest elke pagina zoals de build hem in schermen
// verdeelt.

const require = createRequire(import.meta.url);
const GEDEELD = '../../../../../packages/shared/plugins';
const { schermenVan } = require(`${GEDEELD}/les-schermen.js`);
const { mdxParser } = require(`${GEDEELD}/werkvormen.js`);

type Blok = { soort: string; tekst: string };
type Scherm = { tab: string; naam: string; blokken: Blok[] };

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const DOCS = join(SITE, 'docs');
const challenges = ['code', 'forensics', 'hacking'].flatMap((cat) =>
  readdirSync(join(DOCS, cat))
    .filter((n) => n.endsWith('.md'))
    .map((n) => ({ pad: `${cat}/${n}`, bron: readFileSync(join(DOCS, cat, n), 'utf8') })),
);
const parse = await mdxParser();
const schermen = (bron: string): Scherm[] => schermenVan(bron, parse, { velden: ['InlineEditor'] });

describe('ctf: een challenge heeft twee tabbladen', () => {
  it('De challenge en Hints, en alleen bij Plakken een editor erbij', () => {
    expect(challenges).toHaveLength(21);
    for (const c of challenges) {
      const tabs = schermen(c.bron).map((s) => s.naam);
      const verwacht =
        c.pad === 'code/plakken.md'
          ? ['De challenge', 'Hints', 'Probeer het hier']
          : ['De challenge', 'Hints'];
      expect(tabs, c.pad).toEqual(verwacht);
    }
  });

  it('De challenge zegt wat je vooraf wilt weten', () => {
    for (const c of challenges) {
      const [eerste] = schermen(c.bron);
      const tekst = eerste.blokken.map((b) => b.tekst).join('\n');
      expect(c.bron, c.pad).toMatch(/^> \*\*\[Open deze challenge op ctf\.hackchallenges\.nl\]/m);
      expect(c.bron, c.pad).toMatch(
        /^- \*\*Moeilijkheid:\*\* (Makkelijk|Gemiddeld|Moeilijk|Expert)$/m,
      );
      expect(c.bron, c.pad).toMatch(/^- \*\*Onderwerp:\*\* \S/m);
      expect(tekst, c.pad).toContain('Wat je leert');
      // De hints staan er niet: die zie je pas als je ze opzoekt.
      expect(tekst, c.pad).not.toMatch(/Hint \d/);
    }
  });

  it('"hieronder" wijst naar iets dat in hetzelfde scherm volgt', () => {
    const fout: string[] = [];
    for (const c of challenges) {
      for (const s of schermen(c.bron)) {
        s.blokken.forEach((b, i) => {
          if (b.soort !== 'tekst' || !/\b(hieronder|hierboven|onderstaande?)\b/i.test(b.tekst))
            return;
          const rest = /hierboven/i.test(b.tekst) ? s.blokken.slice(0, i) : s.blokken.slice(i + 1);
          if (!rest.some((x) => x.soort !== 'tekst' && x.soort !== 'antwoord'))
            fout.push(`${c.pad} | ${s.naam}: ${b.tekst.slice(0, 80)}`);
        });
      }
    }
    expect(fout).toEqual([]);
  });

  it('de intro heeft drie tabbladen, met de volgorde in stappen per moeilijkheid', () => {
    const namen = schermen(readFileSync(join(DOCS, 'intro.md'), 'utf8')).map((s) => s.naam);
    expect(namen[0]).toBe('Aan de slag');
    expect(namen.at(-1)).toBe('Tips');
    expect(namen.filter((n) => n.startsWith('Aanbevolen volgorde › '))).toHaveLength(4);
  });

  it('de site heeft tabbladen aan', () => {
    expect(readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8')).toMatch(/lesTabs: true/);
  });
});
