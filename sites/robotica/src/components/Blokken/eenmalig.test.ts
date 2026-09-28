import { describe, expect, it } from 'vitest';
import { eenmalig } from './eenmalig';

// Blokken laadt Blockly via eenmalig. Een mislukte download mag niet blijven
// hangen: vóór deze fix bewaarde de component de mislukte belofte, en liet
// daarna elk blokvoorbeeld op de pagina "De blokken laden niet" zien.

describe('eenmalig', () => {
  it('laadt maar één keer zolang het lukt', async () => {
    let keer = 0;
    const laad = eenmalig(async () => ++keer);
    expect(await laad()).toBe(1);
    expect(await laad()).toBe(1);
    expect(keer).toBe(1);
  });

  it('twee aanvragen tegelijk delen één download', async () => {
    let keer = 0;
    const laad = eenmalig(async () => ++keer);
    const [a, b] = await Promise.all([laad(), laad()]);
    expect([a, b, keer]).toEqual([1, 1, 1]);
  });

  it('probeert het opnieuw na een mislukte download', async () => {
    let keer = 0;
    const laad = eenmalig(async () => {
      keer++;
      if (keer === 1) throw new Error('netwerk weg');
      return 'Blockly';
    });
    await expect(laad()).rejects.toThrow('netwerk weg');
    await expect(laad()).resolves.toBe('Blockly');
    expect(keer).toBe(2);
  });
});
