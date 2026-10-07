# Algorithm Interactive Models Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build reusable interactive visual models and Python exercise panels for all six existing algorithms.

**Architecture:** Pure TypeScript trace generators feed a generic React/Docusaurus component. MDX pages opt into the component with an algorithm id while the existing Pyodide runner remains available for standalone snippets.

**Tech Stack:** Docusaurus 3, React 19, TypeScript, Pyodide, Node test runner for pure trace tests.

---

### Task 6: Student-Code Tracing

**Files:**
- Create: `src/lib/studentTraceAdapters.ts`
- Modify: `src/data/algorithmModels.ts`
- Modify: `src/components/AlgorithmModel/index.tsx`
- Modify: `src/components/AlgorithmModel/styles.module.css`
- Test: `scripts/test-traces.mjs`

- [ ] **Step 1: Write failing adapter tests**

Add tests that feed captured Python frames into `adaptStudentTrace` and expect
the same marker shape used by the renderer: binary search must expose
`laag`/`hoog`/`midden`; max-and-min must expose `klein` and `groot`; sorting
adapters must detect list mutation swaps.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:traces`
Expected: fail because `src/lib/studentTraceAdapters.ts` does not exist.

- [ ] **Step 3: Implement adapter and catalog args**

Create `adaptStudentTrace`, add `traceArgs(input)` to each algorithm model, and
map curriculum variable names to `TraceStep.markers`.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:traces`
Expected: all trace and adapter tests pass.

### Task 7: Pyodide Trace UI

**Files:**
- Modify: `src/components/AlgorithmModel/index.tsx`
- Modify: `src/components/AlgorithmModel/styles.module.css`

- [ ] **Step 1: Add trace harness builder**

Add a `sys.settrace` Python harness that executes the student function once
with the current visual input and returns serializable local snapshots.

- [ ] **Step 2: Add UI controls**

Add a visual source toggle (`Referentie` / `Mijn code`) and a
`Visualiseer mijn code` button in the code exercise panel.

- [ ] **Step 3: Verify integration**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 4: Verify production build**

Run: `npm run build`
Expected: exit 0.

### Task 1: Trace Engine

**Files:**
- Create: `src/lib/algorithmTraces.ts`
- Create: `src/lib/algorithmTraces.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Add Node tests that import the compiled trace module and assert final results
for linear search, maximum, max/min, binary search, selection sort, and bubble
sort.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:traces`

Expected: fail because `algorithmTraces` does not exist yet.

- [ ] **Step 3: Implement trace generators**

Create typed functions that return arrays of generic trace steps.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:traces`

Expected: all trace tests pass.

### Task 2: Model Catalog

**Files:**
- Create: `src/data/algorithmModels.ts`
- Test: `src/lib/algorithmTraces.test.mjs`

- [ ] **Step 1: Extend failing tests**

Add assertions that every catalog entry has a matching trace generator,
starter code, controls, and tests.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm run test:traces`

Expected: fail because the catalog does not exist yet.

- [ ] **Step 3: Implement catalog**

Define six algorithm entries with default inputs, student-facing labels,
starter Python, and test cases.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:traces`

Expected: all catalog tests pass.

### Task 3: React Model Component

**Files:**
- Create: `src/components/AlgorithmModel/index.tsx`
- Create: `src/components/AlgorithmModel/styles.module.css`
- Modify: `src/theme/MDXComponents.tsx`

- [ ] **Step 1: Write type-level integration test**

Run `npm run typecheck` before implementation and confirm missing component
errors after adding MDX references.

- [ ] **Step 2: Implement component**

Render controls, stepper, array visualization, markers, explanation, metrics,
and Python exercise panel.

- [ ] **Step 3: Register component globally**

Expose `<AlgorithmModel>` through `src/theme/MDXComponents.tsx`.

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`

Expected: exit 0.

### Task 4: MDX Integration

**Files:**
- Modify: complete-algorithm pages for all six chapters.

- [ ] **Step 1: Add one model per algorithm**

Insert `<AlgorithmModel algorithm="..."/>` near each complete algorithm’s run
section.

- [ ] **Step 2: Verify docs build**

Run: `npm run build`

Expected: Docusaurus production build succeeds.

### Task 5: Final Verification

**Files:** all changed files.

- [ ] **Step 1: Run trace tests**

Run: `npm run test:traces`

Expected: all tests pass.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: exit 0.
