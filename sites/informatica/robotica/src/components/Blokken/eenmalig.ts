// Laadt iets één keer en geeft daarna steeds dezelfde belofte terug. Mislukt
// het laden, dan vergeet hij die belofte, zodat de volgende poging het
// opnieuw probeert. Anders zegt op een haperend schoolnetwerk één mislukte
// download van Blockly bij elk blokvoorbeeld "De blokken laden niet", tot
// iemand de hele pagina herlaadt.
export function eenmalig<T>(maak: () => Promise<T>): () => Promise<T> {
  let bezig: Promise<T> | null = null;
  return () => {
    if (!bezig) {
      const poging = maak();
      bezig = poging;
      poging.catch(() => {
        if (bezig === poging) bezig = null;
      });
    }
    return bezig;
  };
}
