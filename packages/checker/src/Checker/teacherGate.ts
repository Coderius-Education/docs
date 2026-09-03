// Pure logica van het docentenslot (TeacherGate), los van React zodat hij
// zonder DOM te testen is. Zacht slot: houdt gewone leerlingen tegen, geen
// echte beveiliging (het wachtwoord staat in de gebundelde JS).

/** Waarde waarmee een ontgrendelde sessie in de opslag staat. */
export const UNLOCKED_VALUE = '1';

/** Het stukje van (session)Storage dat het slot gebruikt. */
export interface GateStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Is het slot in deze sessie al open? Zonder opslag (SSR) nooit. */
export function isUnlocked(storage: GateStorage | null | undefined, storageKey: string): boolean {
  return storage?.getItem(storageKey) === UNLOCKED_VALUE;
}

/** Exacte vergelijking: hoofdlettergevoelig, geen spaties weggehaald. */
export function isCorrectPassword(invoer: string, wachtwoord: string): boolean {
  return invoer === wachtwoord;
}

/**
 * Probeer te ontgrendelen. Bij het juiste wachtwoord wordt de sessie
 * gemarkeerd en is het resultaat true; anders verandert er niets.
 */
export function tryUnlock(
  storage: GateStorage,
  storageKey: string,
  invoer: string,
  wachtwoord: string,
): boolean {
  if (!isCorrectPassword(invoer, wachtwoord)) return false;
  storage.setItem(storageKey, UNLOCKED_VALUE);
  return true;
}

/** sessionStorage in de browser, null tijdens server-side rendering. */
export function sessionStorageOrNull(): GateStorage | null {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}
