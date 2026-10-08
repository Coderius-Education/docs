import { REPO_URL } from '@coderius/shared/sites';
import type { Vakpagina } from './types';

// De vakpagina zonder eigen ontwerp: precies de homepage van vóór de
// vakpagina's. Kop en inleiding volgen het gekozen vak (automatischeKop), de
// kaarten staan met filters, en onderaan Lesmateriaal en Visie. Die moet op een
// laptopscherm passen (zie CLAUDE.md); meet opnieuw als je hier iets wijzigt.
export function standaardDocument(vak: string | null): Vakpagina {
  return {
    version: 1,
    vak: vak ?? '',
    blokken: [
      {
        id: 'cursussen',
        type: 'Courses',
        props: { automatischeKop: true, filters: true, spacing: 'none' },
      },
      {
        id: 'over',
        type: 'Columns',
        props: { count: 2, spacing: 'small', width: 'wide' },
        kinderen: [
          {
            id: 'lesmateriaal',
            type: 'Section',
            props: { title: 'Lesmateriaal' },
            tekst: `Wij maken ons eigen lesmateriaal en geven het gratis weg. Alles is open source, dus \
docenten mogen het gebruiken, aanpassen en delen zoals het bij hun leerlingen past. Ideeën of een \
bijdrage? Het materiaal staat [op GitHub](${REPO_URL}).`,
          },
          {
            id: 'visie',
            type: 'Section',
            props: { title: 'Visie' },
            tekst: `Leren gaat het best door te doen. Elke cursus combineert korte uitleg met opdrachten, \
projecten en voorbeelden die je direct uitvoert, meestal in de browser zelf. Zo pas je kennis meteen \
toe, en samen met docenten verbeteren we het materiaal steeds verder.`,
          },
        ],
      },
    ],
  };
}
