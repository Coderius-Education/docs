// De onderzoeksvragen van een les staan in het oefenveld zelf, boven de code.
// Ze stonden eerst in een lijst onder het veld, en dan scrolde de leerling
// voor elke vraag tussen de vraag en de code heen en weer (issue #154).

export type OnderzoekVraag = { vraag: string; antwoord: string };

export type Stuk = { code: boolean; tekst: string };

/** Splitst tekst in stukken gewone tekst en `code`, zoals in markdown. */
export function stukken(tekst: string): Stuk[] {
  const delen = tekst.split('`');
  // Een oneven aantal backticks laat de laatste open; die toon je dan gewoon.
  if (delen.length % 2 === 0) return [{ code: false, tekst }];
  return delen
    .map((deel, i) => ({ code: i % 2 === 1, tekst: deel }))
    .filter((stuk) => stuk.tekst !== '');
}
