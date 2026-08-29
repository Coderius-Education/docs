// Bewaakt dat src/data/conceptenkaart.ts gelijk blijft aan de werkelijke
// <Voorkennis>-blokken in docs/**/*.mdx. Bij drift: duidelijke fout, exit 1.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import ts from 'typescript';

const outDir = '.voorkennis-check';

function compileTs(sourcePath, outputName) {
  const source = readFileSync(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      strict: true,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) {
    const message = errors
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('\n');
    throw new Error(message);
  }
  const outputPath = join(outDir, outputName);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, compiled.outputText);
  return outputPath;
}

rmSync(outDir, { force: true, recursive: true });
const kaartPath = compileTs('src/data/conceptenkaart.ts', 'src/data/conceptenkaart.js');
const algoritmesPath = compileTs('src/data/algorithms.ts', 'src/data/algorithms.js');
const require = createRequire(import.meta.url);
const { pythonConcepten, voorkennisPerAlgoritme } = require(join(process.cwd(), kaartPath));
const { algoritmes } = require(join(process.cwd(), algoritmesPath));
rmSync(outDir, { force: true, recursive: true });

// 1. Verzamel per hoofdstuk de unie van python-voorkennis uit de MDX-bron.
const ITEM_RE = /\{site: 'python', to: '([^']+)', label: '([^']+)'\}/g;
const perHoofdstuk = new Map(); // hoofdstuk -> Set<to>
const labelsPerPad = new Map(); // to -> Set<label>

for (const entry of readdirSync('docs', { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;
  const filePath = join(entry.parentPath, entry.name);
  const hoofdstuk = relative('docs', filePath).split(sep)[0];
  const inhoud = readFileSync(filePath, 'utf8');
  for (const match of inhoud.matchAll(ITEM_RE)) {
    const [, to, label] = match;
    if (!perHoofdstuk.has(hoofdstuk)) perHoofdstuk.set(hoofdstuk, new Set());
    perHoofdstuk.get(hoofdstuk).add(to);
    if (!labelsPerPad.has(to)) labelsPerPad.set(to, new Set());
    labelsPerPad.get(to).add(label);
  }
}

const padPerId = new Map(pythonConcepten.map((c) => [c.id, c.to]));

// 2. Hoofdstukken, slugs en datafile-keys moeten dezelfde set vormen.
const slugs = algoritmes.map((a) => a.slug).sort();
assert.deepEqual(
  [...perHoofdstuk.keys()].sort(),
  slugs,
  'Hoofdstukken met python-voorkennis in docs/ wijken af van algoritmes[].slug',
);
assert.deepEqual(
  Object.keys(voorkennisPerAlgoritme).sort(),
  slugs,
  'Keys van voorkennisPerAlgoritme wijken af van algoritmes[].slug',
);

// 3. Per hoofdstuk: unie uit MDX == datafile.
for (const [hoofdstuk, mdxPaden] of perHoofdstuk) {
  const dataPaden = new Set(
    (voorkennisPerAlgoritme[hoofdstuk] ?? []).map((id) => {
      const pad = padPerId.get(id);
      assert.ok(pad, `Onbekend concept-id '${id}' bij '${hoofdstuk}' in conceptenkaart.ts`);
      return pad;
    }),
  );
  assert.deepEqual(
    [...dataPaden].sort(),
    [...mdxPaden].sort(),
    `Voorkennis van '${hoofdstuk}' wijkt af tussen conceptenkaart.ts en de <Voorkennis>-blokken in docs/${hoofdstuk}/`,
  );
}

// 4. De conceptenlijst moet exact de paden dekken die in de MDX voorkomen.
assert.deepEqual(
  pythonConcepten.map((c) => c.to).sort(),
  [...labelsPerPad.keys()].sort(),
  'pythonConcepten dekt niet exact de python-paden die in docs/ voorkomen',
);

// 5. Waarschuw (geen fail) bij meerdere labels voor hetzelfde pad.
for (const [to, labels] of labelsPerPad) {
  if (labels.size > 1) {
    console.warn(
      `waarschuwing: '${to}' heeft meerdere labels in docs/: ${[...labels].join(' / ')}`,
    );
  }
}

// 6. De omgekeerde richting: elke concept-les in de python-cursus draagt een
// "Waar kom je dit later weer tegen?"-blok dat terugwijst naar deze cursus.
// De kaart en die blokken vertellen hetzelfde verhaal; drijft één van de twee
// weg, dan hoort dat hier te knallen. Of de links in die blokken ook echt
// ergens op uitkomen bewaakt packages/shared/sitelink.test.ts al monorepo-breed. De python-cursus stript puur numerieke
// prefixen uit zijn URL's (06-data/12-tuples.mdx → /docs/data/tuples), dus zo
// vinden we het bronbestand bij een kaart-pad.
const pythonDocs = join('..', 'python', 'docs');
const padNaarBestand = new Map(); // publiek pad -> bronbestand
for (const entry of readdirSync(pythonDocs, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;
  const bron = join(entry.parentPath, entry.name);
  const publiek = relative(pythonDocs, bron)
    .replace(/\.mdx$/, '')
    .split(sep)
    .map((deel) => deel.replace(/^\d+-/, ''))
    .join('/');
  padNaarBestand.set(`/docs/${publiek}`, bron);
}

const TERUG_KOP = 'Waar kom je dit later weer tegen?';
for (const concept of pythonConcepten) {
  const bron = padNaarBestand.get(concept.to);
  assert.ok(bron, `Kaart-pad '${concept.to}' hoort bij geen bestand in ../python/docs`);
  const inhoud = readFileSync(bron, 'utf8');
  assert.ok(
    inhoud.includes(TERUG_KOP) && inhoud.includes('site="algorithms"'),
    `'${concept.label}' (${bron}) mist het "${TERUG_KOP}"-blok met een link naar deze cursus`,
  );
}

console.log(
  `check-voorkennis: ${perHoofdstuk.size} hoofdstukken, ${pythonConcepten.length} concepten, ` +
    `${pythonConcepten.length} terugverwijzingen — alles consistent`,
);
