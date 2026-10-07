import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// "Klik op de grote blauwe Download-knop" stond in de installatietutorial tot
// de website van VS Code een nieuw ontwerp kreeg en de knop niet meer blauw
// was. In VS Code zelf hangt de kleur van een knop bovendien van het thema af.
// Een leerling die de beschreven kleur niet ziet, denkt dat hij verkeerd zit.
// Daarom: knoppen beschrijven bij hun opschrift en plek. Deze test weert
// kleurwoorden vlak bij het woord "knop" op de pagina's over VS Code zelf.
// De GitHub-pagina's (git/github, git/push, git/pull-clone, git/pull-request)
// vallen erbuiten: daar is groen of grijs betekenisvol (mergebaar of niet).
// git/basis speelt zich af in de browser-simulator, niet in VS Code, en valt
// daarom ook buiten de lijst; git/branches gebeurt wél in VS Code en telt mee.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const OVER_VSCODE = ['installatie-vscode', 'python', 'web', 'git/vscode', 'git/branches'];
const KLEUR =
  /\b(blauwe?|groene?|rode|paarse|gele|grijze|oranje)\b[^.\n]{0,40}\bknop|\bknop\b[^.\n]{0,40}\b(blauw|groen|rood|paars|geel|grijs|oranje)\b/i;

describe('knoppen in VS Code worden niet bij hun kleur beschreven', () => {
  it("vindt überhaupt pagina's om te controleren", () => {
    const totaal = OVER_VSCODE.flatMap((m) => alleLesbestanden(join(DOCS, m))).length;
    expect(totaal).toBeGreaterThan(20);
  });

  it('geen kleurwoord bij "knop" op de pagina\'s over VS Code zelf', () => {
    const fout: string[] = [];
    for (const map of OVER_VSCODE) {
      for (const pad of alleLesbestanden(join(DOCS, map))) {
        readFileSync(pad, 'utf8')
          .split('\n')
          .forEach((regel, i) => {
            if (KLEUR.test(regel)) fout.push(`${relative(DOCS, pad)}:${i + 1}: ${regel.trim()}`);
          });
      }
    }
    expect(fout).toEqual([]);
  });

  it('de regex herkent de oude formuleringen wel', () => {
    // Anders is de test hierboven groen omdat hij niets ziet.
    expect(KLEUR.test('Klik op de grote blauwe **Download** knop')).toBe(true);
    expect(KLEUR.test('Klik op de blauwe knop **Commit**')).toBe(true);
    expect(KLEUR.test('Klik op **Install**')).toBe(false);
    expect(KLEUR.test('de regels die je toevoegde in het groen')).toBe(false);
  });
});
