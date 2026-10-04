// De rekenkant van de sensor-simulator, los van React zodat hij in node te
// testen is.
//
// Het getal op A0 is een benadering, geen meting: hoe dichter de bal, hoe meer
// licht er terugkomt en hoe lager het getal. Zonder bal blijft het hoog. Een
// echte sensor geeft andere getallen (hij hangt af van de sensor, het licht in
// de klas en de kleur van de bal); de les zegt dat ook.

export const AFSTAND_MIN = 1;
export const AFSTAND_MAX = 15;

export const GRENS_MIN = 0;
export const GRENS_MAX = 1000;
export const GRENS_STAP = 10;
export const GRENS_START = 300;
export const AFSTAND_START = 12;

// Het getal zonder bal, en het getal met de bal tegen de sensor aan.
export const ZONDER_BAL = 960;
const TEGEN_DE_SENSOR = 150;
// Hoe snel het getal oploopt als de bal verder weg gaat (in cm).
const BEREIK = 3;

// Het getal dat Lees anapin A0 geeft. `afstand` in cm, of `null` als er geen
// bal ligt. Altijd een geheel getal van 0 tot en met 1023.
export function leesA0(afstand: number | null): number {
  if (afstand === null) return ZONDER_BAL;
  const d = Math.min(Math.max(afstand, AFSTAND_MIN), AFSTAND_MAX);
  const terug = 1 / (1 + ((d - AFSTAND_MIN) / BEREIK) ** 2);
  const waarde = ZONDER_BAL - (ZONDER_BAL - TEGEN_DE_SENSOR) * terug;
  return Math.min(1023, Math.max(0, Math.round(waarde)));
}

// Wat het blok als … dan in de les vraagt: is Lees anapin A0 < grens?
export function balGezien(waarde: number, grens: number): boolean {
  return waarde < grens;
}
