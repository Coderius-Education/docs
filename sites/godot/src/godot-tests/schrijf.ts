// Schrijft de uit de docs geëxtraheerde GDScript naar het testproject.
// Aanroep: `pnpm --filter @coderius/godot-docs godot:extract`

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { autoloadUit, verzamel } from './extract';

const HIER = dirname(fileURLToPath(import.meta.url));
const SITE = join(HIER, '..', '..');
const UIT = join(SITE, 'godot-tests', 'extracted');

const { fragmenten, overgeslagen } = verzamel([join(SITE, 'docs'), join(SITE, 'src', 'pages')]);

rmSync(UIT, { recursive: true, force: true });
mkdirSync(UIT, { recursive: true });

for (const f of fragmenten) {
  writeFileSync(join(UIT, `${f.naam}.gd`), f.code);
}

// Het Global-autoloadscript komt uit de les zelf, zodat het testproject niet
// naast de cursus kan gaan leven. project.godot wijst hiernaartoe.
const globalPagina = join(SITE, 'docs', '07-signals-en-score', 'global_variables.md');
const global = autoloadUit(readFileSync(globalPagina, 'utf8'));
if (!global) {
  throw new Error(`geen Global-script gevonden in ${globalPagina}`);
}
writeFileSync(join(UIT, 'global.gd'), global);

// Godot leest deze index om per fout de bronpagina te kunnen noemen.
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

console.log(`${fragmenten.length} volledige scripts geschreven, plus het Global-autoload.`);
console.log(`${overgeslagen.length} blokken overgeslagen:`);
for (const [reden, aantal] of Object.entries(
  overgeslagen.reduce<Record<string, number>>((acc, o) => {
    acc[o.reden] = (acc[o.reden] ?? 0) + 1;
    return acc;
  }, {}),
)) {
  console.log(`  ${aantal}x ${reden}`);
}
