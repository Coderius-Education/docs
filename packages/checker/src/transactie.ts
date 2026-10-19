// Wachten op een IndexedDB-transactie, los van de browser zodat het in node
// te testen is. Een schrijfverzoek kan slagen terwijl de transactie daarna
// toch wordt afgebroken, bijvoorbeeld omdat de opslag bij het vastleggen vol
// blijkt. Wie op het verzoek wacht, denkt dan dat het werk bewaard is; wie
// op de transactie wacht, krijgt de fout.

export interface TransactieLike {
  oncomplete: ((ev: Event) => unknown) | null;
  onabort: ((ev: Event) => unknown) | null;
  onerror: ((ev: Event) => unknown) | null;
  error: DOMException | null;
}

/** Klaar als de transactie is vastgelegd; met het resultaat van `verzoek`. */
export function wachtOpTransactie<R>(
  tx: TransactieLike,
  verzoek?: { result: R },
): Promise<R | undefined> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(verzoek?.result);
    const fout = () => reject(tx.error ?? new DOMException('Transactie afgebroken', 'AbortError'));
    tx.onabort = fout;
    tx.onerror = fout;
  });
}
