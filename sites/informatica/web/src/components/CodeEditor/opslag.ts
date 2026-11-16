import { maakOpslag } from '@coderius/shared/oefenveld/opslag';

// Het werk in een oefenveld blijft bewaard in deze browser. De opslag zelf
// staat in packages/shared/oefenveld (het veld van python gebruikt hem ook);
// hier staat alleen wat van web is: de database en de drie bestanden.

export interface Code extends Record<string, string> {
  html: string;
  css: string;
  js: string;
}

// De naam van de database: wat een leerling op web.coderius.nl bewaarde,
// zet `oudeOpslag` in docusaurus.config.ts hierheen over.
export const opslag = maakOpslag<Code>({
  site: 'web',
  naam: 'oefenvelden',
  delen: ['html', 'css', 'js'],
});
