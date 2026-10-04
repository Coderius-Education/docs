// Schrijft de uit de docs geëxtraheerde Python naar lego-tests/extracted/,
// waar scripts/compileer-blokken.py hem oppakt. Aanroep:
// `pnpm --filter @coderius/robotica-docs lego:extract`

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES } from '../components/WebMicroEditor/templates';
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

// De editor-templates zijn een tweede codebron naast de docs; die compileren
// mee zodat een kapot startsjabloon net zo hard opvalt als een kapotte les.
for (const t of TEMPLATES) {
  const naam = `template_${t.id.replace(/[^a-z0-9]+/gi, '_')}`;
  writeFileSync(join(UIT, `${naam}.py`), `${t.code.replace(/\s+$/, '')}\n`);
  fragmenten.push({
    naam,
    bron: 'src/components/WebMicroEditor/templates.ts',
    // 0, zodat compileer-blokken.py (regel + e.lineno) het regelnummer bínnen de
    // template meldt — een bestandsregel van templates.ts zou nergens op slaan.
    regel: 0,
    kop: t.label ?? t.id,
    code: t.code,
  });
}

// compileer-blokken.py leest deze index om per fout de bronpagina te kunnen noemen.
writeFileSync(
  join(UIT, 'index.json'),
  `${JSON.stringify(
    fragmenten.map((f) => ({
      naam: f.naam,
      // Docs-fragmenten hebben een absoluut pad, template-entries al een
      // relatief — alleen het eerste geval afkorten.
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
