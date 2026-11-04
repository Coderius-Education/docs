import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';
import { BLOK, markerBoven } from './extract';

// Een bestand dat je met FileAccess.WRITE opent, staat pas op de schijf als
// het gesloten is: met close(), of doordat de variabele aan het eind van de
// functie verdwijnt. Leest hetzelfde blok het bestand daarvóór alweer, dan
// krijgt het een lege tekst, en JSON.parse_string geeft null. Zo stond het in
// de GDScript-tips; nagespeeld in Godot 4.7.2 gaf dat "Invalid access to
// property or key 'highscore' on a base object of type 'Nil'". De extractie
// compileert zo'n fragment niet en voert het niet uit, dus dit staat hier.

const SITE = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Of een blok een bestand leest terwijl een schrijf-handle in een variabele
 * nog open is. Een handle zonder variabele (`FileAccess.open(…).store_string(…)`
 * op één regel) sluit Godot meteen; alleen `bestand.close()` van díé variabele
 * of het einde van de functie sluit een bewaarde handle.
 */
function leestVoorSluiten(code: string): boolean {
  const open = new Set<string>();
  for (const regel of code.split('\n')) {
    if (/^func\s/.test(regel)) open.clear();
    const schrijf = regel.match(
      /\bvar\s+(\w+)\s*(?::\s*\w+\s*)?:?=\s*FileAccess\.open\(.*FileAccess\.WRITE/,
    );
    if (schrijf) {
      open.add(schrijf[1]);
      continue;
    }
    for (const m of regel.matchAll(/\b(\w+)\.close\(\)/g)) open.delete(m[1]);
    if (open.size && /FileAccess\.open\(.*FileAccess\.READ|get_file_as_string\(/.test(regel))
      return true;
  }
  return false;
}

describe('bestanden in GDScript-voorbeelden', () => {
  it('herkent lezen vóór sluiten, en niet lezen in een andere functie', () => {
    const fout =
      'var b = FileAccess.open(P, FileAccess.WRITE)\nb.store_string("x")\nvar l = FileAccess.open(P, FileAccess.READ)';
    expect(leestVoorSluiten(fout)).toBe(true);
    expect(leestVoorSluiten(fout.replace('\nvar l', '\nb.close()\nvar l'))).toBe(false);
    const tweeFuncties =
      'func schrijf():\n    var b = FileAccess.open(P, FileAccess.WRITE)\n\nfunc lees():\n    var l = FileAccess.open(P, FileAccess.READ)';
    expect(leestVoorSluiten(tweeFuncties)).toBe(false);
  });

  it('ziet geneste haakjes in het pad, en sluiten van een ander bestand telt niet', () => {
    const genest =
      'var b = FileAccess.open(pad_voor("x"), FileAccess.WRITE)\nb.store_string("x")\nvar t = FileAccess.get_file_as_string(pad_voor("x"))';
    expect(leestVoorSluiten(genest)).toBe(true);
    const ander =
      'var b = FileAccess.open(P, FileAccess.WRITE)\nlog.close()\nvar l = FileAccess.open(P, FileAccess.READ)';
    expect(leestVoorSluiten(ander)).toBe(true);
  });

  it('ziet ook een getypeerde variabele', () => {
    const getypeerd =
      'var f: FileAccess = FileAccess.open(P, FileAccess.WRITE)\nf.store_string("x")\nvar l = FileAccess.open(P, FileAccess.READ)';
    expect(leestVoorSluiten(getypeerd)).toBe(true);
  });

  it('laat een handle zonder variabele toe: die sluit Godot meteen', () => {
    // Nagespeeld in Godot 4.7.2: het lezen gaf daarna de geschreven tekst.
    const eenRegel =
      'FileAccess.open(P, FileAccess.WRITE).store_string("hallo")\nvar t = FileAccess.get_file_as_string(P)';
    expect(leestVoorSluiten(eenRegel)).toBe(false);
  });

  it('leest nergens een bestand dat het in hetzelfde blok schreef en nog niet sloot', () => {
    const fout: string[] = [];
    for (const wortel of [join(SITE, 'docs'), join(SITE, 'src', 'pages')]) {
      for (const pad of alleLesbestanden(wortel)) {
        const inhoud = readFileSync(pad, 'utf8');
        for (const m of inhoud.matchAll(BLOK)) {
          // Een foutvoorbeeld mag deze fout juist laten zien.
          const ervoor = inhoud.slice(0, m.index);
          if (/^\s*#\s*FOUT\b/m.test(m[1]) || markerBoven(ervoor)) continue;
          if (leestVoorSluiten(m[1])) {
            fout.push(`${pad.slice(SITE.length)}:${inhoud.slice(0, m.index).split('\n').length}`);
          }
        }
      }
    }
    expect(fout).toEqual([]);
  });
});
