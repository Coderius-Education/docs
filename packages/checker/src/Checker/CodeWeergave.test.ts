import { describe, expect, it } from 'vitest';
import type { ProjectFiles } from '../types';
import { bestandenOpVolgorde } from './CodeWeergave';

const files = (paden: string[]): ProjectFiles =>
  Object.fromEntries(
    paden.map((path) => [path, { path, kind: 'py', content: 'x', sizeBytes: 1, tooLarge: false }]),
  );

describe('bestandenOpVolgorde', () => {
  it('zet de eigen code vooraan en opent main.py, niet de bibliotheek', () => {
    // Robotica: Code bekijken opende eerst lib/leaphymicropython/actuators/buzzer.py,
    // met 23 bestanden van de bibliotheek vóór main.py.
    const { bestanden, start } = bestandenOpVolgorde(
      files(['lib/leaphymicropython/actuators/buzzer.py', 'motoren.py', 'main.py']),
      ['py'],
      (pad) => pad.startsWith('lib/'),
    );
    expect(bestanden).toEqual([
      'main.py',
      'motoren.py',
      'lib/leaphymicropython/actuators/buzzer.py',
    ]);
    expect(start).toBe('main.py');
  });

  it('opent de main.py die het bord uitvoert, niet een kopie', () => {
    const { start } = bestandenOpVolgorde(files(['backup/main.py', 'deel1/main.py', 'main.py']), [
      'py',
    ]);
    expect(start).toBe('main.py');
  });

  it('opent index.html bij een website', () => {
    const { start } = bestandenOpVolgorde(
      {
        ...files(['app.js']),
        'index.html': {
          path: 'index.html',
          kind: 'py',
          content: '',
          sizeBytes: 0,
          tooLarge: false,
        },
      },
      ['py'],
    );
    expect(start).toBe('index.html');
  });
});
