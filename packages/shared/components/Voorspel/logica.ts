// De logica van <Voorspel>, los van React en de DOM, zodat hij in node te
// testen is: wat er gebeurt als de leerling kiest, en wat hij dan te zien
// krijgt. De component is alleen een weergave van deze toestand.

export interface KeuzeInfo {
  goed: boolean;
  uitleg: string;
}

export interface Toestand {
  // De keuze die nu geldt; null zolang er nog niets gekozen is.
  gekozen: number | null;
  // Alles wat de leerling al eens koos, in volgorde. Een eerder foute keuze
  // blijft zo gemarkeerd als hij daarna iets anders probeert.
  geprobeerd: number[];
}

export type Oordeel = 'open' | 'goed' | 'fout';

export const BEGIN: Toestand = { gekozen: null, geprobeerd: [] };

/** Kies keuze `index`. Opnieuw kiezen mag altijd, ook na een goede keuze. */
export function kies(toestand: Toestand, keuzes: KeuzeInfo[], index: number): Toestand {
  if (!Number.isInteger(index) || index < 0 || index >= keuzes.length) return toestand;
  const geprobeerd = toestand.geprobeerd.includes(index)
    ? toestand.geprobeerd
    : [...toestand.geprobeerd, index];
  return { gekozen: index, geprobeerd };
}

/** Is de keuze die nu geldt goed, fout, of is er nog niets gekozen? */
export function oordeel(toestand: Toestand, keuzes: KeuzeInfo[]): Oordeel {
  if (toestand.gekozen === null) return 'open';
  return keuzes[toestand.gekozen]?.goed ? 'goed' : 'fout';
}

/**
 * Hoe keuze `index` er nu uitziet. Alleen keuzes die de leerling zelf heeft
 * geprobeerd krijgen een markering: de goede keuze verklappen we niet bij een
 * foute gok, die moet hij zelf vinden.
 */
export function markering(toestand: Toestand, keuzes: KeuzeInfo[], index: number): Oordeel {
  if (!toestand.geprobeerd.includes(index)) return 'open';
  return keuzes[index]?.goed ? 'goed' : 'fout';
}

/**
 * Of de algemene uitleg zichtbaar is. Die noemt het goede antwoord, dus hij
 * komt pas als de leerling dat zelf heeft gevonden, of als hij elke foute
 * keuze al heeft geprobeerd. Verscheen hij na de eerste foute gok, dan las
 * hij het antwoord voordat hij opnieuw kon kiezen.
 */
export function toonUitleg(toestand: Toestand, keuzes: KeuzeInfo[]): boolean {
  if (toestand.geprobeerd.some((i) => keuzes[i]?.goed)) return true;
  const fout = keuzes.map((k, i) => (k.goed ? -1 : i)).filter((i) => i >= 0);
  return fout.length > 0 && fout.every((i) => toestand.geprobeerd.includes(i));
}

/** De vaste woorden van de terugkoppeling, zonder uitroepteken, met "je". */
export const TEKST = {
  goed: 'Goed.',
  fout: 'Niet goed.',
  opnieuw: 'Je kunt nog een keer kiezen.',
} as const;

/** De eerste zin van de terugkoppeling, ook voor de schermlezer. */
export function kop(toestand: Toestand, keuzes: KeuzeInfo[]): string {
  const o = oordeel(toestand, keuzes);
  if (o === 'open') return '';
  return o === 'goed' ? TEKST.goed : TEKST.fout;
}

/**
 * Wat er mis is met een rij keuzes, als lijst van zinnen; leeg als hij klopt.
 * Precies één keuze is goed (anders is er niets te voorspellen, of twee
 * waarheden), er zijn er minstens twee, en elke keuze legt uit waarom.
 */
export function problemen(keuzes: KeuzeInfo[]): string[] {
  const uit: string[] = [];
  if (keuzes.length < 2) uit.push(`${keuzes.length} keuze(s); minstens twee nodig`);
  const goed = keuzes.filter((k) => k.goed).length;
  if (goed !== 1) uit.push(`${goed} goede keuzes; precies één nodig`);
  keuzes.forEach((k, i) => {
    if (!k.uitleg.trim()) uit.push(`keuze ${i + 1} heeft geen uitleg`);
  });
  return uit;
}
