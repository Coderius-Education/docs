// Eén bron voor de koppeling tussen deze cursus en de interactieve GDQuest-cursus
// "Learn GDScript From Zero". Zowel de per-les callout (<GDQuestLes>) als de
// centrale tabel (<GDQuestTabel>) lezen hieruit, zodat ze nooit uit elkaar lopen.
// Zelfde opzet als de Code.org-koppeling in web (sites/web/src/data/codeorg.ts).
//
// De lesnummers en Engelse titels komen van de schermafdruk van het
// lessenoverzicht in docs/images/gdscript.png. Alleen wat daarop te zien is
// staat hier: een lesnummer dat we niet kunnen controleren stuurt een leerling
// het bos in. Concepten die verderop in de GDQuest-cursus komen krijgen daarom
// een `onderwerp` in plaats van een lesnummer.

export const GDQUEST_URL = 'https://gdquest.github.io/learn-gdscript/';

// Losse les-URL's zijn vanaf hier niet te controleren, dus verwijzen we naar de
// cursus zelf en noemen we het lesnummer in de tekst. Komt die URL-structuur
// beschikbaar, dan is dit de enige regel die hoeft te veranderen.
export function lesUrl(_nummer: number): string {
  return GDQUEST_URL;
}

export type GDQuestLesInfo = {
  nummer: number;
  titel: string;
};

export const GDQUEST_LESSEN: GDQuestLesInfo[] = [
  { nummer: 1, titel: 'What Code is Like' },
  { nummer: 2, titel: 'Your First Error' },
  { nummer: 3, titel: 'We Stand on the Shoulders of Giants' },
  { nummer: 4, titel: 'Drawing a Rectangle' },
  { nummer: 5, titel: 'Coding Your First Function' },
  { nummer: 6, titel: 'Your First Function Parameter' },
  { nummer: 7, titel: 'Introduction to Member Variables' },
  { nummer: 8, titel: 'Defining Your Own Variables' },
  { nummer: 9, titel: 'Adding and Subtracting' },
  { nummer: 10, titel: 'The Game Loop' },
  { nummer: 11, titel: 'Time Delta' },
];

export type GDQuestKoppeling = {
  /** slug van de godot-lespagina, zonder /docs/-prefix */
  slug: string;
  /** interne route naar die lespagina */
  to: string;
  /** Nederlandse titel van de lespagina */
  nl: string;
  /** wat je op die pagina schrijft, in één of twee begrippen */
  concept: string;
  /** GDQuest-lesnummers die dat concept los oefenen (leeg als het verderop komt) */
  lessen: number[];
  /** onderwerp bij GDQuest als er nog geen gecontroleerd lesnummer is */
  onderwerp?: string;
};

// Volgorde = de volgorde waarin een leerling de lessen doorloopt.
export const gdquestKoppelingen: GDQuestKoppeling[] = (
  [
    {
      slug: 'sprite_movement',
      nl: 'Je eerste eigen script',
      concept: 'extends',
      lessen: [3],
    },
    {
      slug: 'basis_movement_begrijpen',
      nl: 'Deel 1: Een script dat draait',
      concept: 'func en de game loop',
      lessen: [5, 10],
    },
    {
      slug: 'movement-motor',
      nl: 'Deel 2: Vallen',
      concept: 'velocity en +=',
      lessen: [7, 9],
    },
    {
      slug: 'movement-krachten',
      nl: 'Deel 3: Lopen',
      concept: 'const en var',
      lessen: [8],
    },
    {
      slug: 'movement-afsluiter',
      nl: 'Deel 4: Springen',
      concept: 'and, en twee voorwaarden combineren',
      lessen: [],
      onderwerp: 'voorwaarden',
    },
    {
      slug: 'fouten-zoeken',
      nl: 'Fouten zoeken',
      concept: 'een foutmelding lezen',
      lessen: [2],
    },
    {
      slug: 'signals_muntje',
      nl: 'Signals & een muntje oppakken',
      concept: 'een functie met een parameter',
      lessen: [6],
    },
  ] as const
).map((k) => ({ ...k, lessen: [...k.lessen], to: `/docs/${k.slug}` }));

export const gdquestBySlug: Record<string, GDQuestKoppeling> = Object.fromEntries(
  gdquestKoppelingen.map((k) => [k.slug, k]),
);

export function gdquestLes(nummer: number): GDQuestLesInfo | undefined {
  return GDQUEST_LESSEN.find((les) => les.nummer === nummer);
}
