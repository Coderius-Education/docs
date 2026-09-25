import { isTekstbestand } from '../vfs/bestanden';

// Leest een bestand van de computer van de leerling zoals het project het
// bewaart: tekst als tekst, al het andere als data:-URL (zie vfs/bestanden).
export function leesBestand(bestand: File): Promise<string> {
  if (isTekstbestand(bestand.name)) return bestand.text();
  return new Promise((resolve, reject) => {
    const lezer = new FileReader();
    lezer.onload = () => resolve(String(lezer.result));
    lezer.onerror = () => reject(lezer.error);
    lezer.readAsDataURL(bestand);
  });
}
