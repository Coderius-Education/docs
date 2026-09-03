import { describe, expect, it } from 'vitest';
import { filterTraceback } from './PyodideProvider';

// filterTraceback maakt van een Pyodide-traceback de foutmelding die de
// leerling ziet: "Fout op regel N" plus de laatste foutregel. Pyodide zet zijn
// eigen frames (_pyodide/_base.py) vóór de code van de leerling; die
// regelnummers mogen nooit in de melding belanden. De tracebacks hieronder
// volgen de letterlijke vorm van Pyodide 0.29 (Python 3.13).

// Bouwt een traceback op uit losse regels, zoals Pyodide 'm afdrukt.
function traceback(...regels: string[]): string {
  return `${regels.join('\n')}\n`;
}

const PYODIDE_FRAMES = [
  'Traceback (most recent call last):',
  '  File "/lib/python313.zip/_pyodide/_base.py", line 597, in eval_code_async',
  '    await CodeRunner(',
  '    ...<4 lines>...',
  '    ).run_async(globals, locals)',
  '  File "/lib/python313.zip/_pyodide/_base.py", line 411, in run_async',
  '    coroutine = eval(self.code, globals, locals)',
  '                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
];

describe('filterTraceback', () => {
  it('geeft regelnummer en foutregel, zonder de interne frames van Pyodide', () => {
    const raw = traceback(
      ...PYODIDE_FRAMES,
      '  File "<exec>", line 2, in <module>',
      "NameError: name 'onbekende_variabele' is not defined",
    );
    expect(filterTraceback(raw)).toBe(
      "Fout op regel 2\nNameError: name 'onbekende_variabele' is not defined",
    );
  });

  it('wijst bij geneste aanroepen naar de diepste regel in de code van de leerling', () => {
    const raw = traceback(
      ...PYODIDE_FRAMES,
      '  File "<exec>", line 5, in <module>',
      '    print(deel(1, 0))',
      '          ~~~~^^^^^^',
      '  File "<exec>", line 2, in deel',
      '    return a / b',
      '           ~~^~~',
      'ZeroDivisionError: division by zero',
    );
    expect(filterTraceback(raw)).toBe('Fout op regel 2\nZeroDivisionError: division by zero');
  });

  it('begrijpt de vorm van een SyntaxError (regel zonder "in", bronregel en caret)', () => {
    const raw = traceback(
      ...PYODIDE_FRAMES,
      '  File "<exec>", line 1',
      '    print("hoi"',
      '         ^',
      "SyntaxError: '(' was never closed",
    );
    expect(filterTraceback(raw)).toBe("Fout op regel 1\nSyntaxError: '(' was never closed");
  });

  it('neemt bij gekoppelde excepties de laatste regel en de laatste fout', () => {
    const raw = traceback(
      'Traceback (most recent call last):',
      '  File "<exec>", line 3, in <module>',
      "KeyError: 'naam'",
      '',
      'During handling of the above exception, another exception occurred:',
      '',
      ...PYODIDE_FRAMES,
      '  File "<exec>", line 5, in <module>',
      'ValueError: geen naam gevonden',
    );
    expect(filterTraceback(raw)).toBe('Fout op regel 5\nValueError: geen naam gevonden');
  });

  it('laat het regelnummer weg als de fout niet in de code van de leerling zat', () => {
    const raw = traceback(
      'Traceback (most recent call last):',
      '  File "/lib/python313.zip/asyncio/tasks.py", line 3, in run',
      'RuntimeError: kapot',
    );
    expect(filterTraceback(raw)).toBe('RuntimeError: kapot');
  });

  it('valt terug op de laatste niet-lege regel als die niet op ...Error lijkt', () => {
    const raw = traceback(
      'Traceback (most recent call last):',
      '  File "<exec>", line 1, in <module>',
      'KeyboardInterrupt',
      '',
    );
    expect(filterTraceback(raw)).toBe('Fout op regel 1\nKeyboardInterrupt');
  });

  it('geeft een lege invoer ongewijzigd terug', () => {
    expect(filterTraceback('')).toBe('');
  });
});
