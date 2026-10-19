import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES_BY_ID, siteDir } from '@coderius/shared/sites';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Issue #139: de installatie van Thonny zei "download het bestand dat begint
// met Installer with 64-bit Python". Thonny 5 (april 2026) noemt zijn
// downloads naar het bestand: thonny-5.0.0-x64.exe, -arm64.exe, en voor de
// Mac -x64.pkg en -arm64.pkg. Een leerling zocht naar een knop die er niet
// meer is. Elke les die naar thonny.org stuurt, noemt nu het bestand.

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

function lessenMetThonnyDownload(): { bestand: string; tekst: string }[] {
  const uit: { bestand: string; tekst: string }[] = [];
  for (const site of Object.keys(SITES_BY_ID)) {
    const docs = join(ROOT, siteDir(site), 'docs');
    if (!existsSync(docs)) continue;
    for (const pad of alleLesbestanden(docs)) {
      const tekst = readFileSync(pad, 'utf8');
      if (tekst.includes('](https://thonny.org'))
        uit.push({ bestand: pad.slice(ROOT.length), tekst });
    }
  }
  return uit;
}

describe('de Thonny-installatie volgt Thonny 5', () => {
  const lessen = lessenMetThonnyDownload();

  it('vindt de installatielessen', () => {
    // play en robotica; zonder vondsten zou de controle hieronder stil groen zijn.
    expect(lessen.length).toBeGreaterThanOrEqual(2);
  });

  it('noemt het downloadbestand van Thonny 5, niet het oude label', () => {
    const fout = lessen
      .filter(({ tekst }) => /Installer with/i.test(tekst) || !/\*\*-x64\.exe\*\*/.test(tekst))
      .map(({ bestand }) => bestand);
    expect(fout).toEqual([]);
  });

  it('zegt dat je Thonny 4 eerst verwijdert', () => {
    // De release notes van 5.0 raden dat aan: oude instellingen wijzen
    // anders naar een Python die er niet meer is.
    const fout = lessen
      .filter(({ tekst }) => !/Thonny 4/.test(tekst))
      .map(({ bestand }) => bestand);
    expect(fout).toEqual([]);
  });
});
