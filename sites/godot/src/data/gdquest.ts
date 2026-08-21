// De lessen van de interactieve GDQuest-cursus "Learn GDScript From Zero", die
// de leerling naast deze cursus doorloopt. Elke keer dat een les hier een regel
// GDScript toevoegt, verwijzen we naar de GDQuest-les waar dat concept los
// geoefend wordt — zie src/components/GDQuestLes.
//
// Alleen lessen die op de schermafdruk in docs/images/gdscript.png te zien zijn
// staan hier. GDQuest heeft meer lessen (onder andere over voorwaarden en
// vergelijkingsoperatoren); daar verwijzen we voorlopig op naam naar, want een
// lesnummer dat we niet kunnen controleren stuurt een leerling het bos in.

export const GDQUEST_URL = 'https://gdquest.github.io/learn-gdscript/';

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

export function gdquestLes(nummer: number): GDQuestLesInfo | undefined {
  return GDQUEST_LESSEN.find((les) => les.nummer === nummer);
}
