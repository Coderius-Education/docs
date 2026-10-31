import type { Opname, PyodideInterface } from './PyodideProvider';
import type { Tekening } from './Tekening/tekening';

// Een nagemaakte Pyodide voor de componenttests: wat Python doet, testen de
// node-tests met de echte; hier gaat het om wat de componenten ermee doen.
// `volgende` zegt wat de volgende run print, op stderr zet, tekent, of dat hij
// wacht; `runs` houdt bij welke code de leerling liet draaien.

export interface Nep {
  pyodide: PyodideInterface;
  /** Elke code die de leerling liet draaien, in volgorde. */
  runs: string[];
  /** Zet wat de volgende run print, op stderr zet, en of hij wacht. */
  volgende: {
    stdout?: string;
    stderr?: string;
    wacht?: Promise<void>;
    opname?: Opname;
    tekening?: Tekening;
  };
}

export function nepPyodide(): Nep {
  const nep: Nep = { pyodide: undefined as unknown as PyodideInterface, runs: [], volgende: {} };
  let stdout = '';
  let stderr = '';
  nep.pyodide = {
    runPython: (code) => {
      if (code.includes('sys.stdout.getvalue()')) return stdout;
      if (code.includes('sys.stderr.getvalue()')) return stderr;
      if (code.includes('_coderius_tekening')) {
        return nep.volgende.tekening ? JSON.stringify(nep.volgende.tekening) : '';
      }
      return undefined;
    },
    runPythonAsync: async (code) => {
      if (code.includes('_stapper_neem_op')) {
        return JSON.stringify(nep.volgende.opname);
      }
      nep.runs.push(code);
      const { wacht, stdout: uit = '', stderr: fout = '' } = nep.volgende;
      if (wacht) await wacht;
      stdout = uit;
      stderr = fout;
      if (fout) throw new Error(fout);
      return undefined;
    },
    loadPackage: async () => {},
    setStdout: () => {},
    setStderr: () => {},
    setStdin: () => {},
  };
  return nep;
}
