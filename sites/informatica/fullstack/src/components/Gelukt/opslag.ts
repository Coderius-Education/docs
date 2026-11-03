// Wat het Gelukt-blok onthoudt: per stap of de leerling "Het werkt" aanvinkte.
// Het staat in localStorage van de browser van de leerling, en nergens anders.
// Elke toegang staat in een try: in een privévenster of met geblokkeerde
// opslag gooit localStorage een fout, en dan werkt het blok gewoon zonder
// geheugen.

/** De sleutel voor één stap: het pad van de pagina, zonder slash aan het eind. */
export const sleutel = (pad: string): string => `coderius:gelukt:${pad.replace(/\/+$/, '')}`;

type Opslag = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function opslag(): Opslag | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function isGelukt(pad: string, bron: Opslag | null = opslag()): boolean {
  try {
    return bron?.getItem(sleutel(pad)) === 'ja';
  } catch {
    return false;
  }
}

export function zetGelukt(pad: string, gelukt: boolean, bron: Opslag | null = opslag()): void {
  try {
    if (gelukt) bron?.setItem(sleutel(pad), 'ja');
    else bron?.removeItem(sleutel(pad));
    // Een andere component op dezelfde pagina (de Routekaart) luistert mee.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('coderius-gelukt'));
  } catch {
    // Zonder opslag blijft het vinkje alleen op deze pagina staan.
  }
}
