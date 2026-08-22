// Schrijft de uit de docs geëxtraheerde Python naar lego-tests/extracted/,
// waar compileer.py hem oppakt. Aanroep:
// `pnpm --filter @coderius/robotica-docs lego:extract`

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verzamel } from './extract';

const HIER = dirname(fileURLToPath(import.meta.url));
const SITE = join(HIER, '..', '..');
const UIT = join(SITE, 'lego-tests', 'extracted');

const { fragmenten, overgeslagen } = verzamel([
  join(SITE, 'lego_auto'),
  join(SITE, 'docs'),
  join(SITE, 'src', 'pages'),
]);

rmSync(UIT, { recursive: true, force: true });
mkdirSync(UIT, { recursive: true });

for (const f of fragmenten) {
  writeFileSync(join(UIT, `${f.naam}.py`), f.code);
}

// compileer.py leest deze index om per fout de bronpagina te kunnen noemen.
writeFileSync(
  join(UIT, 'index.json'),
  `${JSON.stringify(
    fragmenten.map((f) => ({
      naam: f.naam,
      bron: f.bron.slice(SITE.length + 1),
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
