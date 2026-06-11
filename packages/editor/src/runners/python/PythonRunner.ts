import { getPyodide, runPythonStream } from '@coderius/python-runner/PyodideProvider';
import type { RunContext, Runner, RunnerState } from '../types';

// Vóór elke run: eerder geïmporteerde gebruikersmodules vergeten, zodat een
// gewijzigd hulpbestand bij de volgende run opnieuw geladen wordt.
const RESET_USER_MODULES = `
import importlib, sys
importlib.invalidate_caches()
for _name, _mod in list(sys.modules.items()):
    _file = getattr(_mod, '__file__', None) or ''
    if _file.startswith('/home/pyodide'):
        del sys.modules[_name]
del _name, _mod, _file
`;

export function createPythonRunner(): Runner {
  // biome-ignore lint/suspicious/noExplicitAny: Pyodide levert geen TypeScript-types.
  let pyodide: any = null;

  return {
    id: 'python',
    label: 'Python',
    languages: { py: 'python', txt: 'plaintext', json: 'json', csv: 'plaintext' },
    capabilities: {
      // Pyodide draait op de main thread; hard stoppen vergt een worker met
      // SharedArrayBuffer (COOP/COEP-headers) — bewust buiten v1 gehouden.
      stop: false,
      preview: false,
      connect: false,
      autoRun: false,
    },

    async init(onState: (state: RunnerState, detail?: string) => void) {
      if (pyodide) {
        onState('ready');
        return;
      }
      onState('loading', 'Python laden…');
      try {
        pyodide = await getPyodide();
        onState('ready');
      } catch (err) {
        onState('error', 'Python kon niet geladen worden. Controleer je internetverbinding.');
        throw err;
      }
    },

    async run(ctx: RunContext) {
      if (!pyodide) throw new Error('Runner is niet geïnitialiseerd');

      // Schrijf alle projectbestanden naar het Pyodide-bestandssysteem zodat
      // `import` en open() tussen bestanden werken.
      for (const [path, content] of Object.entries(ctx.files)) {
        if (path === ctx.entry) continue;
        const parts = path.split('/');
        let dir = '/home/pyodide';
        for (const part of parts.slice(0, -1)) {
          dir = `${dir}/${part}`;
          try {
            pyodide.FS.mkdir(dir);
          } catch {
            // map bestaat al
          }
        }
        pyodide.FS.writeFile(`/home/pyodide/${path}`, content);
      }
      pyodide.runPython(RESET_USER_MODULES);

      // Elke run start met schone globals, zodat variabelen van een vorige
      // run niet stiekem blijven bestaan.
      const namespace = pyodide.toPy({ __name__: '__main__' });
      const stream = {
        onStdout: (text: string) => ctx.emit({ kind: 'stdout', text }),
        onStderr: (text: string) => ctx.emit({ kind: 'stderr', text }),
        globals: namespace,
      };

      try {
        if (ctx.setup) {
          const setupResult = await runPythonStream(pyodide, ctx.setup, stream);
          if (!setupResult.ok) {
            ctx.emit({
              kind: 'system',
              text: 'Er ging iets mis in de opzetcode van deze opdracht.\n',
            });
            return;
          }
        }

        const entryCode = ctx.files[ctx.entry] ?? '';
        const result = await runPythonStream(pyodide, entryCode, stream);
        if (!result.ok && result.error) {
          ctx.emit({ kind: 'stderr', text: `${result.error}\n` });
        }
      } finally {
        namespace.destroy();
      }
    },

    dispose() {
      // De Pyodide-singleton blijft leven voor andere editors op de pagina.
    },
  };
}
