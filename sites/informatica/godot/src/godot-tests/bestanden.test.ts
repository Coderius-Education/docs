import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alleLesbestanden } from '@coderius/shared/voorkennis';
import { describe, expect, it } from 'vitest';

// Een bestand dat je met FileAccess.WRITE opent, staat pas op de schijf als
// het gesloten is: met close(), of doordat de variabele aan het eind van de
// functie verdwijnt. Leest hetzelfde blok het bestand daarvóór alweer, dan
// krijgt het een lege tekst, en JSON.parse_string geeft null. Zo stond het in
// de GDScript-tips; nagespeeld in Godot 4.7.2 gaf dat "Invalid access to
// property or key 'highscore' on a base object of type 'Nil'". De extractie
// compileert zo'n fragment niet en voert het niet uit, dus dit staat hier.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const BLOK = /```gdscript\n([\s\S]*?)```/g;

/** Of een blok een bestand leest nadat het er een schreef, zonder close() ertussen. */
function leestVoorSluiten(code: string): boolean {
  let open = false;
  for (const regel of code.split('\n')) {
    if (/FileAccess\.open\([^)]*FileAccess\.WRITE/.test(regel)) open = true;
    else if (/\.close\(\)/.test(regel)) open = false;
    else if (/^func\s/.test(regel)) open = false;
    else if (open && /FileAccess\.open\([^)]*FileAccess\.READ|get_file_as_string/.test(regel)) {
      return true;
    }
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

  it('leest nergens een bestand dat het in hetzelfde blok schreef en nog niet sloot', () => {
    const fout: string[] = [];
    for (const wortel of [join(SITE, 'docs'), join(SITE, 'src', 'pages')]) {
      for (const pad of alleLesbestanden(wortel)) {
        const inhoud = readFileSync(pad, 'utf8');
        for (const m of inhoud.matchAll(BLOK)) {
          if (leestVoorSluiten(m[1])) {
            fout.push(`${pad.slice(SITE.length)}:${inhoud.slice(0, m.index).split('\n').length}`);
          }
        }
      }
    }
    expect(fout).toEqual([]);
  });
});
