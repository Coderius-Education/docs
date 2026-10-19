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

  it('houdt de echte oorzaak als een verzoek faalt, ook al is tx.error dan nog leeg', async () => {
    const tx: TransactieLike = { oncomplete: null, onabort: null, onerror: null, error: null };
    const p = wachtOpTransactie(tx);
    // Zoals de browser het doet: eerst het error-event van het verzoek, dat
    // naar de transactie opborrelt; daarna pas het afbreken.
    const verzoek = { error: new DOMException('vol', 'QuotaExceededError') };
    tx.onerror?.({ target: verzoek } as unknown as Event);
    tx.error = new DOMException('afgebroken', 'AbortError');
    tx.onabort?.(new Event('abort'));
    await expect(p).rejects.toMatchObject({ name: 'QuotaExceededError' });
  });

  it('meldt een opslag die bij het vastleggen vol blijkt, ook al slaagde het verzoek', async () => {
    const { tx, breekAf } = nepTransactie();
    const p = wachtOpTransactie(tx, { result: 'gelukt?' });
    breekAf(new DOMException('vol', 'QuotaExceededError'));
    await expect(p).rejects.toMatchObject({ name: 'QuotaExceededError' });
  });
});
