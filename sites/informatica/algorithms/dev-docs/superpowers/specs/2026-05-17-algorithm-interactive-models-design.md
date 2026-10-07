# Algorithm Interactive Models Design

## Context

The site is a Dutch Docusaurus curriculum for six beginner algorithms:
lineair zoeken, vind maximum, max en min in een pass, binair zoeken,
selection sort, and bubble sort. The current experience already supports
editable Python snippets through Pyodide, but the visuals are mostly static
text, matplotlib plots, or print output.

The request is to make every algorithm easier to see, test, and practice:
students should be able to edit Python, add test cases, and watch their own
code move step by step. The current `max-en-min` chapter is not minimax; it is
the list algorithm that finds the minimum and maximum in one pass, so it stays
array-based. A future minimax/game-tree chapter would get a dedicated tree
renderer when those materials exist.

## Goals

- Add one reusable interactive model component that can render both reference
  traces and traces captured from student-written Python.
- Add algorithm-specific trace generators for the six current algorithms.
- Let students choose inputs and targets where the algorithm needs them.
- Show each step with array cells, active pointers, comparisons, swaps,
  accumulators, binary-search bounds, sorted regions, and final results.
- Provide a code-and-tests exercise mode that runs user Python in Pyodide,
  reports per-test pass/fail results, and can visualize the same user code
  against the currently selected visual input.
- Keep the implementation static-site friendly. No backend, no remote code
  execution, and no new curriculum topics in this pass.

## Non-Goals

- Do not replace all existing `<PyRunner>` snippets.
- Do not add minimax or graph algorithms until those materials exist.
- Do not build a full debugger for arbitrary Python code. The tracer captures
  student function locals, and algorithm-specific adapters interpret the
  variable names taught in the curriculum.
- Do not add user accounts, saved progress, or server-side grading.

## Architecture

The feature has three layers:

1. `src/data/algorithmModels.ts` defines the catalog for visual models and
   exercises.
2. `src/lib/algorithmTraces.ts` contains pure trace generators. These are
   deterministic and unit-testable without React or Pyodide.
3. `src/lib/studentTraceAdapters.ts` converts captured Python execution frames
   into the shared `TraceStep` shape.
4. `src/components/AlgorithmModel/` renders the interactive UI: controls,
   visualization, stepper, explanation, and optional Python exercise panel.

MDX pages opt in with:

```mdx
<AlgorithmModel algorithm="binary-search" />
```

The component reads the algorithm definition and computes reference trace steps
from the current input controls. The exercise panel uses the existing Pyodide
loader and highlighted editor. It wraps user code with:

- a structured test harness for pass/fail results;
- and a `sys.settrace` harness for line-by-line local snapshots when the
  student asks to visualize their code.

## Trace Model

Each trace step contains:

- `array`: current list values.
- `markers`: semantic highlights such as active index, compared pair,
  min/max candidate, sorted region, low/high/mid bounds, and swap pair.
- `stats`: comparisons, swaps, passes, or steps.
- `title` and `description`: Dutch student-facing explanation.
- `result`: optional final answer.

This keeps rendering generic while allowing both trusted reference traces and
student-code traces to expose the state that matters pedagogically.

## Algorithm Coverage

- **Lineair zoeken**: index pointer, current comparison, stop at first match,
  `-1` when not found.
- **Vind maximum**: current index, maximum-so-far marker, accumulator update.
- **Max en min**: current index, min and max markers, both accumulator states.
- **Binair zoeken**: `laag`, `hoog`, `midden`, active search window, left/right
  discard decisions, found/not-found result.
- **Selection sort**: outer position, scan index, min candidate, swap pair,
  sorted prefix.
- **Bubble sort**: pass number, neighbor comparison, swap pair, sorted suffix,
  early-exit state.

## Exercise Mode

Each algorithm gets a default starter function and visible tests. Students can
edit:

- the Python solution,
- test inputs and expected outputs as JSON-like Python literals,
- and the visual model input separately.

Running tests executes:

```python
result = student_function(*args)
assert result == expected
```

The panel reports which tests pass, which fail, and what result was returned.
Errors show the same simplified traceback style as `PyRunner`.

Running "Visualiseer mijn code" executes the student function once with the
current visual input, captures frames from that function only, converts them to
algorithm steps, switches the visual tab to "Mijn code", and lets the student
step through what actually happened.

## UI

The UI should feel like a practical learning tool rather than a marketing
page:

- compact tabs for `Visualisatie` and `Code-oefening`;
- icon-sized stepper buttons with clear labels;
- stable array cells that do not resize during stepping;
- small metric chips for steps, comparisons, swaps, and result;
- mobile layout that stacks controls, visualization, and explanation.

The component should use the existing Docusaurus theme variables and stay
visually compatible with the current PyRunner.

## Testing

Unit tests cover all pure trace generators:

- expected final results,
- key step markers,
- binary-search not-found termination,
- sort mutation behavior,
- and early-exit behavior for bubble sort.

Typecheck and production build verify React/Docusaurus integration.
