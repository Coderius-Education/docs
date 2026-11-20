import { describe, expect, it } from 'vitest';
import { downloadNaam } from './download';

describe('downloadNaam', () => {
  it('geeft main.py als er niets of iets anders dan Python open is', () => {
    expect(downloadNaam(null)).toBe('main.py');
    expect(downloadNaam('/main.py')).toBe('main.py');
    expect(downloadNaam('/lib/leaphymicropython_meta.json')).toBe('main.py');
  });

  it('houdt de naam van een eigen module', () => {
    expect(downloadNaam('/rijden.py')).toBe('rijden.py');
  });
});
