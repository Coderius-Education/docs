// Schrijft de uit de docs geëxtraheerde GDScript naar het testproject.
// Aanroep: `pnpm --filter @coderius/godot-docs godot:extract`
//
// Met `-- --alleen <absoluut pad naar changed.json>` (uit de plan-job van CI)
// krijgt elk blok dat de wijziging niet raakt `overslaan: true` in de index;
// de testrunner compileert dat blok dan niet en slaat de gedragstest over die
// erop leunt. Alle .gd-bestanden worden wel geschreven.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Gewijzigd, binnenWijziging, runnerAlles } from '@coderius/shared/wijzigingen';
import { autoloadUit, verzamel } from './extract';
import { verzamelLabels } from './labels';

const HIER = dirname(fileURLToPath(import.meta.url));
const SITE = join(HIER, '..', '..');
const UIT = join(SITE, 'godot-tests', 'extracted');
const ROOT = join(SITE, '..', '..', '..');

const vlag = process.argv.indexOf('--alleen');
const gewijzigd: Gewijzigd | null =
  vlag === -1 ? null : JSON.parse(readFileSync(process.argv[vlag + 1], 'utf8'));
const alles = !gewijzigd || runnerAlles(gewijzigd, 'godot');

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
      ...(alles ||
      binnenWijziging(
        gewijzigd ?? {},
        relative(ROOT, f.bron).split('\\').join('/'),
        f.begin,
        f.eind,
      )
        ? {}
        : { overslaan: true }),
    })),
    null,
    2,
  )}\n`,
);

// De UI-labels gaan als platte lijst mee; de godot-job zoekt ze op in de
// strings van de binary. Een hernoemd menu-item valt zo op bij een upgrade.
const labels = verzamelLabels([join(SITE, 'docs')]);
writeFileSync(join(UIT, 'labels.txt'), `${labels.join('\n')}\n`);

console.log(`${fragmenten.length} volledige scripts geschreven, plus het Global-autoload.`);
if (!alles) {
  const gekozen = fragmenten.filter((f) =>
    binnenWijziging(gewijzigd ?? {}, relative(ROOT, f.bron).split('\\').join('/'), f.begin, f.eind),
  );
  console.log(`--alleen: ${gekozen.length} daarvan geraakt door de wijziging:`);
  for (const f of gekozen) console.log(`  blok ${f.bron.slice(SITE.length + 1)}:${f.regel}`);
}
console.log(`${labels.length} UI-labels om tegen de Godot-binary te controleren.`);
console.log(`${overgeslagen.length} blokken overgeslagen:`);
for (const [reden, aantal] of Object.entries(
  overgeslagen.reduce<Record<string, number>>((acc, o) => {
    acc[o.reden] = (acc[o.reden] ?? 0) + 1;
    return acc;
  }, {}),
)) {
  console.log(`  ${aantal}x ${reden}`);
}
