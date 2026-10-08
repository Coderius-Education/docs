// De onderwerpen van een Voorkennis-blok als één leesbare opsomming, voor in
// de kop: "Dictionaries", "Dictionaries en Lijsten", "A, B en C". Het blok is
// standaard dicht; met alleen "Hier bouw je op verder" in de kop las niemand
// het. Met de onderwerpen erachter zie je zonder te klikken wat de les
// aanneemt, en klap je hem open als je een ervan niet meer weet.
export function opsomming(labels: string[]): string {
  const schoon = labels.map((l) => l.trim()).filter((l) => l.length > 0);
  if (schoon.length <= 1) return schoon.join('');
  return `${schoon.slice(0, -1).join(', ')} en ${schoon.at(-1)}`;
}
