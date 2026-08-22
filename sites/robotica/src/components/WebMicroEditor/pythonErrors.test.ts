import { describe, expect, it } from 'vitest';
import { splitsFoutSegmenten, vindLaatsteFout } from './pythonErrors';

// De foutherkenning voedt de banner en de regelmarkering in de editor.
// De tracebacks hieronder zijn letterlijke MicroPython-uitvoer.

const NAME_ERROR =
  'Traceback (most recent call last):\n' +
  '  File "main.py", line 4, in <module>\n' +
  "NameError: name 'lampie' isn't defined\n";

describe('vindLaatsteFout', () => {
  it('haalt type, melding en regelnummer uit een traceback', () => {
    const fout = vindLaatsteFout(`[main.py opgeslagen]\n${NAME_ERROR}`);
    expect(fout).not.toBeNull();
    expect(fout?.type).toBe('NameError');
    expect(fout?.melding).toBe("name 'lampie' isn't defined");
    expect(fout?.regel).toBe(4);
    expect(fout?.uitleg).toContain('typefout');
  });

  it('geeft null zonder traceback', () => {
    expect(vindLaatsteFout('Links: white | Rechts: black\n')).toBeNull();
  });

  it('pakt de laatste traceback als er meerdere zijn', () => {
    const eerder =
      'Traceback (most recent call last):\n  File "main.py", line 1, in <module>\nTypeError: x\n';
    const fout = vindLaatsteFout(eerder + NAME_ERROR);
    expect(fout?.type).toBe('NameError');
    expect(fout?.regel).toBe(4);
  });

  it('wijst bij een fout in de library naar de aanroep in main.py', () => {
    const fout = vindLaatsteFout(
      'Traceback (most recent call last):\n' +
        '  File "main.py", line 7, in <module>\n' +
        '  File "/lib/leaphymicropython/sensors/tof.py", line 42, in get_distance\n' +
        'OSError: [Errno 5] EIO\n',
    );
    expect(fout?.type).toBe('OSError');
    expect(fout?.regel).toBe(7);
    expect(fout?.uitleg).toContain('bedrading');
  });

  it('werkt ook voor code die via de REPL draaide (<stdin>)', () => {
    const fout = vindLaatsteFout(
      'Traceback (most recent call last):\n' +
        '  File "<stdin>", line 2, in <module>\n' +
        'ZeroDivisionError: divide by zero\n',
    );
    expect(fout?.regel).toBe(2);
    // onbekend type valt terug op de algemene uitleg
    expect(fout?.uitleg).toContain('laatste regel');
  });

  it('behandelt KeyboardInterrupt niet als fout (dat is de Stop-knop)', () => {
    const stop =
      'Traceback (most recent call last):\n' +
      '  File "main.py", line 8, in <module>\n' +
      'KeyboardInterrupt: \n';
    expect(vindLaatsteFout(stop)).toBeNull();
  });

  it('herkent een IndentationError met eigen uitleg', () => {
    const fout = vindLaatsteFout(
      'Traceback (most recent call last):\n' +
        '  File "main.py", line 6\n' +
        'IndentationError: expected an indented block\n',
    );
    expect(fout?.type).toBe('IndentationError');
    expect(fout?.uitleg).toContain('inspring');
  });
});

describe('splitsFoutSegmenten', () => {
  it('laat gewone uitvoer ongemoeid', () => {
    expect(splitsFoutSegmenten('rondje\nrondje\n')).toEqual([
      { tekst: 'rondje\nrondje\n', fout: false },
    ]);
  });

  it('markeert alleen de traceback-regels als fout', () => {
    const segmenten = splitsFoutSegmenten(`voor\n${NAME_ERROR}na\n`);
    expect(segmenten).toEqual([
      { tekst: 'voor\n', fout: false },
      { tekst: NAME_ERROR, fout: true },
      { tekst: 'na\n', fout: false },
    ]);
  });

  it('stopt de markering na de foutregel, ook zonder lege regel ertussen', () => {
    const segmenten = splitsFoutSegmenten(`${NAME_ERROR}Links: white\n`);
    expect(segmenten[segmenten.length - 1]).toEqual({ tekst: 'Links: white\n', fout: false });
  });
});
