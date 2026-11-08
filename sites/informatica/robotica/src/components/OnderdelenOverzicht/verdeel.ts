// Verdeelt de groepen van het overzicht over kolommen, zodat de hele pagina
// op één scherm past. Elke groep gaat in volgorde naar de kolom die tot dan
// het kortst is; de hoogte van een groep is zijn aantal regels plus één voor
// de kop. Met de groepen van nu: Aan de slag en Op de robot links, Sensoren
// in het midden, Actuatoren rechts.

export function verdeel(hoogtes: number[], kolommen: number): number[][] {
  const uit: number[][] = Array.from({ length: kolommen }, () => []);
  const totaal = new Array(kolommen).fill(0);
  hoogtes.forEach((hoogte, i) => {
    const k = totaal.indexOf(Math.min(...totaal));
    uit[k].push(i);
    totaal[k] += hoogte;
  });
  return uit.filter((kolom) => kolom.length > 0);
}
