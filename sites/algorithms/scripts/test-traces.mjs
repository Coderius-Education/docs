import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import ts from 'typescript';

const outDir = '.trace-tests';

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

  const diagnostics = compiled.diagnostics ?? [];
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length > 0) {
    const message = errors
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('\n');
    throw new Error(message);
  }

  const outputPath = join(outDir, outputName);
  mkdirSync(dirname(outputPath), {recursive: true});
  writeFileSync(outputPath, compiled.outputText);
  return outputPath;
}

rmSync(outDir, {force: true, recursive: true});
const tracesPath = compileTs(
  'src/lib/algorithmTraces.ts',
  'src/lib/algorithmTraces.js',
);
const catalogPath = compileTs(
  'src/data/algorithmModels.ts',
  'src/data/algorithmModels.js',
);
const steppingStonesPath = compileTs(
  'src/data/steppingStoneModels.ts',
  'src/data/steppingStoneModels.js',
);
const adaptersPath = compileTs(
  'src/lib/studentTraceAdapters.ts',
  'src/lib/studentTraceAdapters.js',
);
const require = createRequire(import.meta.url);
const traces = require(join(process.cwd(), tracesPath));
const catalog = require(join(process.cwd(), catalogPath));
const steppingStones = require(join(process.cwd(), steppingStonesPath));
const adapters = require(join(process.cwd(), adaptersPath));

function finalStep(steps) {
  assert.ok(Array.isArray(steps), 'trace should return an array');
  assert.ok(steps.length > 0, 'trace should contain at least one step');
  return steps.at(-1);
}

{
  const steps = traces.traceLinearSearch([3, 1, 4, 1, 5], 5);
  const final = finalStep(steps);
  assert.equal(final.result, 4);
  assert.equal(final.markers.activeIndex, 4);
}

{
  const steps = traces.traceMaximum([-3, -1, -7]);
  const final = finalStep(steps);
  assert.equal(final.result, -1);
  assert.equal(final.markers.maxIndex, 1);
}

{
  const steps = traces.traceMinAndMax([5, 2, 8, 1, 7, 4]);
  const final = finalStep(steps);
  assert.deepEqual(final.result, {min: 1, max: 8});
  assert.equal(final.markers.minIndex, 3);
  assert.equal(final.markers.maxIndex, 2);
}

{
  const steps = traces.traceBinarySearch([1, 3, 5, 7, 9, 11, 13, 15], 4);
  const final = finalStep(steps);
  assert.equal(final.result, -1);
  assert.equal(final.markers.low > final.markers.high, true);
}

{
  const steps = traces.traceSelectionSort([5, 2, 8, 1, 4]);
  const final = finalStep(steps);
  assert.deepEqual(final.array, [1, 2, 4, 5, 8]);
  assert.equal(final.result, 'gesorteerd');
  assert.equal(final.stats.swaps, 5);
}

{
  const steps = traces.traceBubbleSort([1, 2, 3, 4, 5]);
  const final = finalStep(steps);
  assert.deepEqual(final.array, [1, 2, 3, 4, 5]);
  assert.equal(final.result, 'gesorteerd');
  assert.equal(final.stats.passes, 1);
  assert.equal(final.stats.swaps, 0);
}

{
  const entries = catalog.algorithmModels;
  assert.equal(entries.length, 6);
  const ids = entries.map((entry) => entry.id);
  assert.deepEqual(ids, [
    'linear-search',
    'maximum',
    'min-and-max',
    'binary-search',
    'selection-sort',
    'bubble-sort',
  ]);

  for (const entry of entries) {
    assert.equal(typeof entry.title, 'string');
    assert.equal(typeof entry.trace, 'function');
    assert.equal(typeof entry.traceArgs, 'function');
    assert.ok(entry.defaultInput.values.length > 0);
    assert.ok(entry.exercise.starterCode.includes(`def ${entry.exercise.functionName}`));
    assert.ok(
      entry.exercise.starterCode.includes('Schrijf je oplossing hier'),
      `${entry.id} starter should invite the learner to write the solution`,
    );
    assert.ok(entry.exercise.tests.length >= 3);
    const steps = entry.trace(entry.defaultInput);
    assert.ok(steps.length > 0, `${entry.id} should produce trace steps`);
    assert.ok(Array.isArray(entry.traceArgs(entry.defaultInput)));
  }
}

{
  const entries = steppingStones.steppingStoneModels;
  assert.equal(entries.length, 24);
  const algorithmIds = new Set(catalog.algorithmModels.map((entry) => entry.id));
  const ids = new Set();

  for (const entry of entries) {
    assert.equal(typeof entry.id, 'string');
    assert.equal(ids.has(entry.id), false, `${entry.id} should be unique`);
    ids.add(entry.id);
    assert.ok(algorithmIds.has(entry.algorithm), `${entry.id} has a known algorithm`);
    assert.equal(typeof entry.title, 'string');
    assert.equal(typeof entry.summary, 'string');
    assert.equal(typeof entry.visual.hint, 'string');
    assert.ok(Array.isArray(entry.visual.input.values));
    assert.equal(typeof entry.visual.focusStep, 'number');
    assert.ok(entry.visual.focusStep >= 0);
    assert.ok(entry.exercise.starterCode.includes(`def ${entry.exercise.functionName}`));
    assert.ok(entry.exercise.starterCode.includes('Schrijf je oplossing hier'));
    assert.ok(entry.exercise.tests.length >= 2);

    const model = catalog.algorithmModels.find((item) => item.id === entry.algorithm);
    assert.ok(model.trace(entry.visual.input).length > 0);
  }
}

{
  const steps = adapters.adaptStudentTrace('binary-search', {values: [1, 3, 5, 7, 9], target: 7}, [
    {
      event: 'line',
      line: 4,
      locals: {lijst: [1, 3, 5, 7, 9], doel: 7, laag: 0, hoog: 4},
    },
    {
      event: 'line',
      line: 5,
      locals: {lijst: [1, 3, 5, 7, 9], doel: 7, laag: 0, hoog: 4, midden: 2},
    },
    {
      event: 'line',
      line: 9,
      locals: {lijst: [1, 3, 5, 7, 9], doel: 7, laag: 3, hoog: 4, midden: 2},
    },
  ], undefined);
  assert.equal(steps.at(1).markers.low, 0);
  assert.equal(steps.at(1).markers.high, 4);
  assert.equal(steps.at(1).markers.mid, 2);
  assert.equal(steps.at(2).markers.low, 3);
}

{
  const steps = adapters.adaptStudentTrace('min-and-max', {values: [5, 2, 8, 1]}, [
    {
      event: 'line',
      line: 2,
      locals: {lijst: [5, 2, 8, 1], klein: 5, groot: 5},
    },
    {
      event: 'line',
      line: 5,
      locals: {lijst: [5, 2, 8, 1], waarde: 8, klein: 2, groot: 8},
    },
  ], [1, 8]);
  assert.equal(steps.at(0).markers.minIndex, 0);
  assert.equal(steps.at(0).markers.maxIndex, 0);
  assert.equal(steps.at(1).markers.minIndex, 1);
  assert.equal(steps.at(1).markers.maxIndex, 2);
  assert.deepEqual(steps.at(-1).result, {min: 1, max: 8});
}

{
  const steps = adapters.adaptStudentTrace('bubble-sort', {values: [3, 1, 4]}, [
    {
      event: 'line',
      line: 5,
      locals: {lijst: [3, 1, 4], ronde: 0, i: 0},
    },
    {
      event: 'line',
      line: 7,
      locals: {lijst: [1, 3, 4], ronde: 0, i: 0, geswapt: true},
    },
  ], [1, 3, 4]);
  assert.deepEqual(steps.at(1).array, [1, 3, 4]);
  assert.equal(steps.at(1).markers.swapA, 0);
  assert.equal(steps.at(1).markers.swapB, 1);
  assert.equal(steps.at(1).stats.swaps, 1);
}

{
  const steps = adapters.adaptStudentTrace('linear-search', {values: [3, 1, 4, 1, 5], target: 5}, [
    {event: 'line', line: 2, locals: {lijst: [3, 1, 4, 1, 5], doel: 5}},
    {event: 'line', line: 3, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 0, waarde: 3}},
    {event: 'line', line: 2, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 0, waarde: 3}},
    {event: 'line', line: 3, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 1, waarde: 1}},
    {event: 'line', line: 2, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 1, waarde: 1}},
    {event: 'line', line: 3, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 2, waarde: 4}},
    {event: 'line', line: 2, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 2, waarde: 4}},
    {event: 'line', line: 3, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 3, waarde: 1}},
    {event: 'line', line: 2, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 3, waarde: 1}},
    {event: 'line', line: 3, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 4, waarde: 5}},
    {event: 'line', line: 4, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 4, waarde: 5}},
    {event: 'return', line: 4, locals: {lijst: [3, 1, 4, 1, 5], doel: 5, i: 4, waarde: 5}, returnValue: 4},
  ], 4);
  const visited = steps
    .map((step) => step.markers.activeIndex)
    .filter((index) => index !== undefined);
  assert.deepEqual(visited, [0, 1, 2, 3, 4]);
  assert.equal(steps.at(-1).result, 4);
}

console.log('Trace tests passed');
