// Wat het veld laat zien als de leerling Stap voor stap sluit.

import type { Opname } from '@coderius/python-runner/PyodideProvider';

/**
 * De uitvoer na het sluiten van Stap voor stap: wat de opname printte, en de
 * fout of het afkappen. Eerst stond er na Sluiten alleen "Klaar", in een leeg
 * vak: dat las als "het programma printte niets".
 */
export function naStappen(opname: Opname): {
  stdout: string;
  errorMsg: string;
  statusMsg: string;
} {
  const fout = opname.fout
    ? `${opname.fout.regel ? `Fout op regel ${opname.fout.regel}\n` : ''}${opname.fout.soort}: ${opname.fout.bericht}`
    : '';
  return {
    stdout: opname.uitvoer,
    errorMsg: fout,
    statusMsg: opname.afgekapt
      ? 'Gestopt na de stappen die Stap voor stap opneemt'
      : fout
        ? 'Er ging iets mis'
        : 'Klaar',
  };
}
