// Indeling van begrippen in hoofdstukken, afgeleid uit het eerste deel van
// hun url. Gebruikt door de termen-trainer en de termenlijst.

export const hoofdstukken = [
  {id: 'typen', naam: 'Typen onderzoek', mappen: ['typen']},
  {id: 'spelregels', naam: 'De spelregels', mappen: ['spelregels']},
  {id: 'kennisleer', naam: 'Kennisleer', mappen: ['kennisleer']},
  {id: 'opzet', naam: 'Onderzoek opzetten', mappen: ['opzet', 'gegevens']},
  {id: 'literatuurstudie', naam: 'Literatuurstudie', mappen: ['literatuurstudie']},
];

export function hoofdstukVan(begrip) {
  const map = begrip.url.split('/')[1];
  const h = hoofdstukken.find((x) => x.mappen.includes(map));
  return h ? h.id : null;
}
