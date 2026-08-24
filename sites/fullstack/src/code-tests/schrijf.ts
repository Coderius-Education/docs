// Schrijft de uit de docs geëxtraheerde Python naar code-tests/extracted/,
// waar scripts/compileer-blokken.py hem oppakt. Aanroep:
// `pnpm --filter @coderius/fullstack-docs code:extract`

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verzamel } from '@coderius/shared/codeblokken';

const HIER = dirname(fileURLToPath(import.meta.url));
const SITE = join(HIER, '..', '..');
const UIT = join(SITE, 'code-tests', 'extracted');

const { fragmenten, overgeslagen } = verzamel([join(SITE, 'docs')]);

rmSync(UIT, { recursive: true, force: true });
mkdirSync(UIT, { recursive: true });

for (const f of fragmenten) {
  writeFileSync(join(UIT, `${f.naam}.py`), f.code);
}

// compileer-blokken.py leest deze index om per fout de bronpagina te kunnen noemen.
writeFileSync(
  join(UIT, 'index.json'),
  `${JSON.stringify(
    fragmenten.map((f) => ({
      naam: f.naam,
      bron: f.bron.startsWith(SITE) ? f.bron.slice(SITE.length + 1) : f.bron,
      regel: f.regel,
      kop: f.kop,
    })),
    null,
    2,
  )}\n`,
);

console.log(`${fragmenten.length} python-blokken geschreven.`);
if (overgeslagen.length > 0) {
  console.log(`${overgeslagen.length} blokken overgeslagen:`);
  for (const [reden, aantal] of Object.entries(
    overgeslagen.reduce<Record<string, number>>((acc, o) => {
      acc[o.reden] = (acc[o.reden] ?? 0) + 1;
      return acc;
    }, {}),
  )) {
    console.log(`  ${aantal}x ${reden}`);
  }
}
