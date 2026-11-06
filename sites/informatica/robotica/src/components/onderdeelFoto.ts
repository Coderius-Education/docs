// Een foto onder docs/onderdelen/img/ als adres in de build. require.context
// is van de bundler (Rspack), niet van node: elke foto in de map komt als
// adres in de build, en een kaart pakt de zijne op naam. Gedeeld door de
// kaarten van het overzicht (OnderdelenOverzicht) en de materiaallijst van een
// pagina (Onderdelenlijst).

type Context = (pad: string) => string | { default: string };
const fotoContext = (
  require as unknown as { context: (map: string, diep: boolean, filter: RegExp) => Context }
).context('@site/docs/onderdelen/img', true, /\.(png|jpe?g|svg)$/i);

export function fotoUrl(pad: string | undefined): string | undefined {
  if (!pad) return undefined;
  const bron = fotoContext(`./${pad}`);
  return typeof bron === 'string' ? bron : bron.default;
}
