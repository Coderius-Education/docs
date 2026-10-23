import { describe, expect, it } from 'vitest';
import type { Vondst } from './types';
import { vondstenPerOnderwerp } from './vondsten';

const v = (label: string, onderwerp?: string): Vondst => ({
  groep: 'x',
  label,
  count: 1,
  files: ['index.html'],
  onderwerp,
});

describe('vondstenPerOnderwerp', () => {
  it('zet elke vondst bij zijn onderwerp, in de volgorde waarin ze kwamen', () => {
    const { per, los } = vondstenPerOnderwerp(
      [v('<canvas>', 'html'), v('@keyframes', 'css'), v('hidden', 'html')],
      ['html', 'css', 'js'],
    );
    expect(per.get('html')?.map((x) => x.label)).toEqual(['<canvas>', 'hidden']);
    expect(per.get('css')?.map((x) => x.label)).toEqual(['@keyframes']);
    expect(per.has('js')).toBe(false);
    expect(los).toEqual([]);
  });

  it('houdt een vondst zonder of met een onbekend onderwerp apart', () => {
    const { per, los } = vondstenPerOnderwerp([v('a'), v('b', 'python')], ['html']);
    expect(per.size).toBe(0);
    expect(los.map((x) => x.label)).toEqual(['a', 'b']);
  });
});
