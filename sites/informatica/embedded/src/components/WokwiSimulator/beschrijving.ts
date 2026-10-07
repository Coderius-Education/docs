/**
 * De tekst boven de knop. Alle simulators in de lessen openen nu een leeg
 * Arduino-project (`/projects/new/…`), terwijl de kaart beloofde dat je "het
 * circuit" van de les direct kon simuleren: de leerling kreeg een leeg bord
 * zonder LED, weerstand of code. Zolang een les geen eigen Wokwi-project
 * heeft, zegt de kaart eerlijk dat je het circuit zelf nabouwt.
 */
export function isLeegProject(url: string): boolean {
  return /\/projects\/new\//.test(url);
}

export function beschrijving(url: string): string {
  return isLeegProject(url)
    ? 'Open een leeg Arduino-project in je browser en bouw het circuit van deze les na. Zo test je je code zonder hardware.'
    : 'Simuleer het circuit direct in je browser. Je kunt de code aanpassen en het resultaat live zien, zonder hardware.';
}
