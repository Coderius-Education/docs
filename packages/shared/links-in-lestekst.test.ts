import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES_BY_ID, linkDoel, parseSiteUrl, siteDir } from '@coderius/shared/sites';
import { alleLesbestanden, siteMappenOpSchijf } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';
import { CONTENTMAPPEN, isPaginaLink, linksInBron } from '../../scripts/links-in-bron.mjs';

// Stijlgids §12: elke link naar een pagina in lestekst is een site:-link,
// [tekst](site:<cursus>/<pad>#anker), ook binnen de eigen cursus. Deze guard
// bewaakt de vorm, in de bron. Of het doel en het anker bestaan, controleren
// Docusaurus (onBrokenLinks, binnen een cursus) en de cross-links-job (tussen
// cursussen, ook ankers) op de gebouwde HTML: dat is precies, waar een
// nabouw van de routing hier dat niet is.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const OVERSLAAN = new Set([
  'node_modules',
  'build',
  '.docusaurus',
  'static',
  '__fixtures__',
  'extracted',
]);

type Bestand = { pad: string; kort: string; content: boolean };

// Bewust over alle mappen, niet over de registry: een site die daar niet in
// staat, valt anders stil buiten deze guard.
function alleBronbestanden(): Bestand[] {
  const uit: Bestand[] = [];
  for (const { map: siteMap } of siteMappenOpSchijf(ROOT)) {
    const contentMappen = CONTENTMAPPEN.map((m) => join(siteMap, m));
    for (const entry of readdirSync(siteMap, { withFileTypes: true })) {
      if (!entry.isDirectory() || OVERSLAAN.has(entry.name)) continue;
      for (const pad of alleLesbestanden(join(siteMap, entry.name))) {
        if (pad.split(/[\\/]/).some((deel) => OVERSLAAN.has(deel))) continue;
        uit.push({
          pad,
          kort: relative(ROOT, pad).split('\\').join('/'),
          content: contentMappen.some((m) => pad.startsWith(`${m}/`) || pad.startsWith(`${m}\\`)),
        });
      }
    }
  }
  return uit;
}

const bestanden = alleBronbestanden();
const geparst = bestanden.map((b) => ({ ...b, ...linksInBron(readFileSync(b.pad, 'utf8')) }));

describe('links naar pagina’s zijn site:-links', () => {
  it('vindt überhaupt links om te controleren', () => {
    // Een kapotte walk of parser zou de tests hieronder leeg en groen laten.
    const siteLinks = geparst.flatMap((b) => b.links).filter((l) => l.url.startsWith('site:'));
    expect(siteLinks.length).toBeGreaterThan(1000);
    expect(new Set(siteLinks.map((l) => parseSiteUrl(l.url)?.site)).size).toBeGreaterThan(8);
  });

  it('elke registry-id heeft een map onder sites/<vak>/', () => {
    const zonderMap = Object.keys(SITES_BY_ID).filter((id) => !existsSync(join(ROOT, siteDir(id))));
    expect(zonderMap).toEqual([]);
  });

  it('elk lesbestand is te lezen zoals Docusaurus het leest', () => {
    const fout = geparst.filter((b) => b.content && b.fout).map((b) => `${b.kort}: ${b.fout}`);
    expect(fout).toEqual([]);
  });

  it('geen <SiteLink> in lestekst', () => {
    const fout = geparst.flatMap((b) =>
      b.links.filter((l) => l.soort === 'sitelink').map((l) => `${b.kort}:${l.regel}`),
    );
    expect(fout).toEqual([]);
  });

  it('geen pagina-link als pad of .md-bestand', () => {
    // [x](./02-patronen), [x](/docs/a) en [x](../a.md) breken stil als een
    // les verhuist; schrijf [x](site:<cursus>/docs/a). Ankers (#kop),
    // afbeeldingen en downloads mogen wel.
    const fout = geparst
      .filter((b) => b.content)
      .flatMap((b) =>
        b.links
          .filter((l) => l.soort !== 'sitelink' && isPaginaLink(l.url))
          .map((l) => `${b.kort}:${l.regel} ${l.url}`),
      );
    expect(fout).toEqual([]);
  });

  it('elke site:-link is geldig en wijst naar een bekende cursus', () => {
    const fout: string[] = [];
    for (const b of geparst)
      for (const l of b.links) {
        if (!l.url.startsWith('site:')) continue;
        try {
          const link = parseSiteUrl(l.url);
          if (!link || !linkDoel(link.site)) fout.push(`${b.kort}:${l.regel} ${l.url}`);
        } catch {
          fout.push(`${b.kort}:${l.regel} ${l.url}`);
        }
      }
    expect(fout).toEqual([]);
  });

  it('site:-links alleen waar de content-plugins ze omzetten', () => {
    // Buiten docs/, src/pages en blog/ (bv. src/content/homepage.mdx) draait
    // de remark-plugin niet, en zou er href="site:..." in de pagina komen.
    const fout = geparst
      .filter((b) => !b.content)
      .flatMap((b) =>
        b.links.filter((l) => l.url.startsWith('site:')).map((l) => `${b.kort}:${l.regel}`),
      );
    expect(fout).toEqual([]);
  });

  it('isPaginaLink herkent pagina’s en laat de rest met rust', () => {
    for (const url of ['./02-patronen', '/docs/a#kop', '../a.md', '@site/docs/a.mdx', 'les'])
      expect(isPaginaLink(url), url).toBe(true);
    for (const url of [
      '#kop',
      'site:python/docs/a',
      'https://x.nl',
      './img/a.png',
      '/files/a.pdf',
      '@site/static/a.zip',
    ])
      expect(isPaginaLink(url), url).toBe(false);
  });
});

describe('geen hardcoded cursus-URL in lestekst', () => {
  // Stijlgids §12: de registry is de enige bron van waarheid. Een hardcoded
  // URL overleeft een domeinwijziging niet. stats.coderius.nl (Matomo) is
  // infrastructuur, geen cursus, en telt niet mee.
  const UITZONDERINGEN: string[] = [];

  it('lestekst linkt via site: of <Voorkennis>, niet via een URL', () => {
    const HARDCODED = /https?:\/\/(?!stats\.)[a-z]+\.coderius\.nl/;
    const fout: string[] = [];
    for (const { pad, kort } of bestanden) {
      if (UITZONDERINGEN.includes(kort)) continue;
      readFileSync(pad, 'utf8')
        .split('\n')
        .forEach((regel, i) => {
          if (HARDCODED.test(regel)) fout.push(`${kort}:${i + 1}`);
        });
    }
    expect(fout).toEqual([]);
  });

  it('de uitzonderingenlijst bevat geen dode paden', () => {
    const dood = UITZONDERINGEN.filter((p) => !existsSync(join(ROOT, p)));
    expect(dood).toEqual([]);
  });
});
