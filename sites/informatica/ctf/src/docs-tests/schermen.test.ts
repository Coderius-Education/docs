import { existsSync, readFileSync, readdirSync } from 'node:fs';
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
    .map((n) => ({
      pad: `${cat}/${n}`,
      id: `${cat}/${n.replace(/\.md$/, '')}`,
      bron: readFileSync(join(DOCS, cat, n), 'utf8'),
    })),
);
const intro = readFileSync(join(DOCS, 'intro.md'), 'utf8');
const parse = await mdxParser();
const schermen = (bron: string): Scherm[] => schermenVan(bron, parse, { velden: ['InlineEditor'] });

/** Een veld uit de front matter, zonder aanhalingstekens. */
const veld = (bron: string, naam: string): string | undefined =>
  bron
    .match(/^---\n([\s\S]*?)\n---/)?.[1]
    .match(new RegExp(`^${naam}: (.*)$`, 'm'))?.[1]
    .replace(/^"(.*)"$/, '$1');

/** De bron van het tabblad De challenge, en de tekst van elke hint. */
const deChallenge = (bron: string) =>
  bron.slice(bron.indexOf('## De challenge'), bron.indexOf('## Hints'));
const hintsVan = (bron: string) =>
  [...bron.matchAll(/<summary>Hint \d+<\/summary>\n([\s\S]*?)\n<\/details>/g)].map((m) => m[1]);

/** Wat een stuk tekst vet zet: de term die het introduceert. */
const vet = (tekst: string) => [...tekst.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]);
const noemt = (tekst: string, term: string) =>
  new RegExp(
    `(?<![\\p{L}\\d])${term.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?![\\p{L}\\d])`,
    'iu',
  ).test(tekst);

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
      // Wat de leerling door het oplossen oefent. "Wat je leert" beloofde
      // kennis die de pagina nergens uitlegt (het verschil tussen IPv4 en
      // IPv6 bij België).
      expect(tekst, c.pad).toContain('Wat je oefent');
      expect(tekst, c.pad).not.toContain('Wat je leert');
      // De hints staan er niet: die zie je pas als je ze opzoekt.
      expect(tekst, c.pad).not.toMatch(/Hint \d/);
    }
  });

  // De enige knop op De challenge is "Volgende: Hints". De pagina zegt daarom
  // zelf dat je eerst probeert, en hoeveel hints er klaarstaan.
  it('De challenge zegt dat je eerst zelf probeert, en hoeveel hints er zijn', () => {
    const telwoord = ['nul', 'één', 'twee', 'drie', 'vier'];
    for (const c of challenges) {
      const tekst = deChallenge(c.bron);
      const aantal = hintsVan(c.bron).length;
      expect(aantal, c.pad).toBeGreaterThanOrEqual(2);
      expect(tekst, c.pad).toContain('Probeer het eerst zelf.');
      expect(tekst, c.pad).toContain(`op het tabblad Hints ${telwoord[aantal]} hints`);
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
    const namen = schermen(intro).map((s) => s.naam);
    expect(namen[0]).toBe('Aan de slag');
    expect(namen.at(-1)).toBe('Tips');
    expect(namen.filter((n) => n.startsWith('Aanbevolen volgorde › '))).toHaveLength(4);
  });

  it('de site heeft tabbladen aan', () => {
    expect(readFileSync(join(SITE, 'docusaurus.config.ts'), 'utf8')).toMatch(/lesTabs: true/);
  });
});

// Een pagina die met `## De challenge` begint, kreeg van Docusaurus de naam
// van dat tabblad als omschrijving: 21 kaarten op de overzichtspagina's en
// 21 keer `<meta name="description">` met de tekst "De challenge".
describe('ctf: elke challenge heeft een eigen omschrijving', () => {
  it('een zin in de front matter, geen tabbladnaam en geen tweede keer dezelfde', () => {
    const gezien = new Map<string, string>();
    for (const c of challenges) {
      const omschrijving = veld(c.bron, 'description') ?? '';
      expect(omschrijving.length, c.pad).toBeGreaterThanOrEqual(30);
      expect(omschrijving, c.pad).toMatch(/\.$/);
      for (const tab of schermen(c.bron).map((s) => s.naam))
        expect(omschrijving, c.pad).not.toContain(tab);
      expect(gezien.get(omschrijving), `${c.pad} en ${gezien.get(omschrijving)}`).toBeUndefined();
      gezien.set(omschrijving, c.pad);
    }
  });
});

// De hints lopen op: de richting, het gereedschap, bijna de stap. Bij 11 van
// de 21 challenges gaf De challenge al weg wat hint 1 of 2 achterhield
// ("Onderwerp: robots.txt", "Onderwerp: Caesar cipher", "Gebruik VirusTotal"),
// of zei hint 3 minder dan hint 2. Wat een hint nieuw brengt, zet hij vet;
// die term mag dus niet eerder staan.
describe('ctf: een hint brengt iets nieuws', () => {
  it('een term die een hint vet zet, staat niet op De challenge en niet in een eerdere hint', () => {
    const fout: string[] = [];
    for (const c of challenges) {
      const hints = hintsVan(c.bron);
      hints.forEach((hint, i) => {
        for (const term of vet(hint)) {
          if (noemt(deChallenge(c.bron), term))
            fout.push(`${c.pad}, hint ${i + 1}: "${term}" staat al op De challenge`);
          if (hints.slice(0, i).some((eerder) => noemt(eerder, term)))
            fout.push(`${c.pad}, hint ${i + 1}: "${term}" staat al in een eerdere hint`);
        }
      });
    }
    expect(fout).toEqual([]);
  });

  it('geen zin staat op twee tabbladen', () => {
    const zinnen = (tekst: string) =>
      tekst
        .split(/(?<=[.?!])\s+|\n+/)
        .map((z) => z.trim())
        .filter((z) => z.length >= 30 && !z.startsWith('<'));
    const fout: string[] = [];
    for (const c of challenges) {
      const voor = new Set(zinnen(deChallenge(c.bron)));
      const na = c.bron.slice(c.bron.indexOf('## Hints'));
      for (const z of zinnen(na)) if (voor.has(z)) fout.push(`${c.pad}: ${z}`);
    }
    expect(fout).toEqual([]);
  });

  it('op het tabblad Hints staan alleen hints', () => {
    for (const c of challenges) {
      const hints = c.bron.slice(c.bron.indexOf('## Hints')).split(/\n## /)[0];
      const rest = hints
        .replace(/^## Hints\n/, '')
        .replace(/<details>\n<summary>Hint \d+<\/summary>\n[\s\S]*?\n<\/details>/g, '')
        .trim();
      expect(rest, c.pad).toBe('');
    }
  });
});

// De link Volgende onder een pagina volgde de lessenlijst: de intro eindigde
// bij "Volgende: Forensics", en na Robots (nummer 3) kwam Virus (nummer 9).
// De intro zegt "Begin hier: Hacking - Standaard"; de link zegt nu hetzelfde.
describe('ctf: de link Volgende volgt de aanbevolen volgorde', () => {
  const volgorde = [...intro.matchAll(/^\d+\. \[[^\]]+\]\(site:ctf\/docs\/([\w/-]+)\)/gm)].map(
    (m) => m[1],
  );

  it('de intro noemt elke challenge één keer', () => {
    expect([...volgorde].sort()).toEqual(challenges.map((c) => c.id).sort());
  });

  it('de intro gaat door naar nummer 1, en elke challenge naar de volgende', () => {
    expect(veld(intro, 'pagination_next')).toBe(volgorde[0]);
    for (const c of challenges) {
      const i = volgorde.indexOf(c.id);
      expect(veld(c.bron, 'pagination_prev'), c.pad).toBe(i === 0 ? 'intro' : volgorde[i - 1]);
      expect(veld(c.bron, 'pagination_next'), c.pad).toBe(volgorde[i + 1] ?? 'null');
    }
  });

  it('elk doel van een link Vorige of Volgende is een pagina', () => {
    for (const c of [{ pad: 'intro.md', bron: intro }, ...challenges]) {
      for (const naam of ['pagination_prev', 'pagination_next']) {
        const doel = veld(c.bron, naam);
        if (doel === undefined || doel === 'null') continue;
        expect(existsSync(join(DOCS, `${doel}.md`)), `${c.pad}: ${naam} ${doel}`).toBe(true);
      }
    }
  });
});
