import { describe, expect, it } from 'vitest';
import { type TransactieLike, wachtOpTransactie } from './transactie';

// Een schrijfverzoek in IndexedDB kan slagen terwijl de transactie daarna
// wordt afgebroken (opslag vol bij het vastleggen). De eerste versie wachtte
// op het verzoek en dacht dan dat het werk bewaard was.

function nepTransactie() {
  const tx: TransactieLike = { oncomplete: null, onabort: null, onerror: null, error: null };
  const ev = new Event('x');
  return {
    tx,
    voltooi: () => tx.oncomplete?.(ev),
    breekAf: (fout: DOMException) => {
      tx.error = fout;
      tx.onabort?.(ev);
    },
  };
}

describe('wachtOpTransactie', () => {
  it('is pas klaar als de transactie is vastgelegd, met het resultaat van het verzoek', async () => {
    const { tx, voltooi } = nepTransactie();
    let klaar = false;
    const p = wachtOpTransactie(tx, { result: 42 }).then((r) => {
      klaar = true;
      return r;
    });
    await Promise.resolve();
    expect(klaar).toBe(false);
    voltooi();
    expect(await p).toBe(42);
  });

  it('meldt een opslag die bij het vastleggen vol blijkt, ook al slaagde het verzoek', async () => {
    const { tx, breekAf } = nepTransactie();
    const p = wachtOpTransactie(tx, { result: 'gelukt?' });
    breekAf(new DOMException('vol', 'QuotaExceededError'));
    await expect(p).rejects.toMatchObject({ name: 'QuotaExceededError' });
  });
});
