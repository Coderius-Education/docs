# @coderius/editor

Monaco-gebaseerde code-editors voor de Coderius-leersites:

- **`InlineEditor`** — een editor voor in MDX-lespagina's: één bestand of een paar tabs, een Uitvoeren-knop en een console (en bij web een live preview). De moderne opvolger van de oude TryButton/CodeExercise-patronen.
- **`ProjectEditor`** — een volledige browser-IDE: bestandsboom, tabs, projecten met autosave (IndexedDB) en templates. Draait full-screen op `sites/ide`.

Beide componenten zijn SSR-veilig (intern `BrowserOnly`) en volgen automatisch de licht/donker-modus van de site.

## Runners

Code wordt uitgevoerd door een **runner** (zie `src/runners/types.ts`):

| Runner | Uitvoering | Bijzonderheden |
|---|---|---|
| `python` | Pyodide (in de browser) | gestreamde output, NL-foutmeldingen, multi-file `import`, `input()` via prompt |
| `web` | sandboxed iframe | live preview tijdens het typen, `console.*` naar de editor-console |
| `micropython` | WebSerial (Chrome/Edge) | upload naar board + soft reboot, REPL-invoer, Stop = Ctrl-C |

Runners laden lazy: een pagina met alleen een Python-editor krijgt geen serial- of webcode in de bundle. Een nieuwe runtime (bijv. PHP-wasm) implementeert het `Runner`-contract en wordt aan `src/runners/registry.ts` toegevoegd — de UI hoeft er niets voor te weten.

## Gebruik in een lespagina (MDX)

```mdx
import InlineEditor from '@coderius/editor/InlineEditor';

<InlineEditor runner="python" code={'print("Hallo")\n'} />

<InlineEditor
  runner="web"
  files={{ 'index.html': '…', 'style.css': '…', 'script.js': '…' }}
  entry="index.html"
/>
```

Handige props: `readOnly`, `hiddenSetup` (onzichtbare opzetcode vóór de leerlingcode), `persistKey` (bewaar bewerkingen in localStorage), `height`, `title`.

## Een site aansluiten

1. Dependencies in de site:

   ```json
   "@coderius/editor": "workspace:*",
   "@coderius/python-runner": "workspace:*"
   ```

   en `pyodide: "catalog:"` als devDependency, plus het script
   `"copy:pyodide": "node ../../packages/python-runner/scripts/copy-pyodide.mjs"`.

2. In `docusaurus.config.ts`:

   ```ts
   sharedPackages: ['@coderius/shared', '@coderius/editor', '@coderius/python-runner'],
   clientModules: ['./src/client/runtime-paths.ts'],
   ```

   `createConfig` serveert de static-map van elk shared package automatisch, dus Monaco staat op `/monaco/vs` zonder extra configuratie.

3. `src/client/runtime-paths.ts`:

   ```ts
   import {setMonacoBaseUrl} from '@coderius/editor/monaco';
   import {setPyodideBaseUrl} from '@coderius/python-runner/PyodideProvider';

   setPyodideBaseUrl('/pyodide/');
   setMonacoBaseUrl('/monaco/vs');
   ```

4. Eén keer `pnpm --filter <site> copy:pyodide` draaien en `static/pyodide/` committen.

## Waarom self-hosted AMD-Monaco?

`scripts/copy-monaco.mjs` kopieert de kant-en-klare AMD-distributie (`monaco-editor/min/vs`) naar `static/monaco/vs` (gecommit). `@monaco-editor/react` wijst er via `loader.config({paths})` naartoe; Monaco laadt zijn eigen workers vanaf hetzelfde pad.

- **Geen CDN**: schoolnetwerken blokkeren CDN's (zelfde reden waarom Pyodide gevendord wordt).
- **Geen bundler-configuratie**: workers gaan buiten webpack om, dus dit blijft werken als Docusaurus ooit naar rspack (`future.faster`) gaat, en het is ongevoelig voor de transpile-shared-pijplijn (packages zonder build-stap).
- Alle taal-features (Python-highlighting, rijke HTML/CSS/JS/JSON-workers) zitten in de volledige build.

**Afgewezen alternatief:** ESM-`monaco-editor` bundelen met `new Worker(new URL(...))`. Dat geeft tree-shaking, maar de worker-emissie verschilt per bundler en `import.meta.url` moet de babel-transpilatie van onze no-build-packages overleven — te breekbaar. De prijs van AMD (±12 MB gecommitte assets, lazy geladen per pagina) is acceptabel.

**Let op:** na een Monaco-upgrade in de catalog opnieuw `pnpm --filter @coderius/editor copy:monaco` draaien en de wijzigingen in `static/monaco/` committen. De workers vereisen dat het `vs`-pad absoluut wordt gemaakt (gebeurt automatisch in `src/monaco/loader.ts`).

## Beperkingen (v1)

- **Python stoppen kan niet**: Pyodide draait op de main thread; een harde stop vergt een worker met SharedArrayBuffer (COOP/COEP-headers). Het contract ondersteunt het al (`capabilities.stop`), een toekomstige `PyodideWorkerRunner` kan het invullen.
- **MicroPython** werkt alleen in Chrome/Edge (WebSerial) en is gefilterd op RP2040-boards.
- Projecten zijn per browser (IndexedDB); export/import (zip) en delen via URL zijn bewust nog niet gebouwd.
