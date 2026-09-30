import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// /registreer deed `db[naam] = …` zonder te kijken of de naam al bestond. Wie
// zich als sara registreerde, overschreef Sara's wachtwoord en kon als haar
// inloggen, buiten de controle op het oude wachtwoord uit les 7 om. In een
// reeks over veilige wachtwoorden namen leerlingen dat gat zo over. Elke
// versie van /registreer weigert daarom een naam die al bestaat.

const MAP = fileURLToPath(new URL('../../docs/veiligheid/wachtwoorden', import.meta.url));

const blokken = readdirSync(MAP)
  .filter((naam) => naam.endsWith('.mdx'))
  .flatMap((naam) =>
    [...readFileSync(join(MAP, naam), 'utf8').matchAll(/```python[^\n]*\n([\s\S]*?)```/g)]
      .map((m) => m[1])
      .filter((code) => code.includes('@app.post("/registreer")'))
      .map((code) => ({ naam, code })),
  );

describe('registreren in de wachtwoordenreeks', () => {
  it('vindt de versies van /registreer', () => {
    expect(blokken.length).toBeGreaterThanOrEqual(5);
  });

  it.each(blokken.map((b, i) => [`${b.naam} #${i}`, b.code]))(
    '%s weigert een naam die al bestaat',
    (_, code) => {
      const registreer = code.slice(code.indexOf('@app.post("/registreer")'));
      expect(registreer).toMatch(/if naam in db:\s+raise HTTPException\(status_code=400/);
      expect(code).toMatch(/from fastapi import [^\n]*HTTPException/);
    },
  );
});
