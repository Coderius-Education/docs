import type { Opmaak } from './types';

// Opmaak-props → Tailwind-klassen. Tailwind ziet alleen volledige klassennamen
// in de bron, dus staan ze hier letterlijk.
const BREEDTE = {
  full: 'max-w-none',
  wide: 'max-w-[100rem]',
  normal: 'max-w-5xl',
  narrow: 'max-w-3xl',
} as const;
const RUIMTE = { none: 'py-0', small: 'my-4', normal: 'py-6', large: 'py-12' } as const;
const UITLIJNING = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;
const ACHTERGROND = {
  transparent: '',
  muted: 'bg-muted rounded-xl px-4',
  primary: 'bg-primary text-primary-foreground rounded-xl px-4',
} as const;

/** Klassen van een blok op de bovenste laag (met breedte en ruimte). */
export function buitenKlassen(p: Opmaak): string {
  return ['mx-auto w-full px-4', BREEDTE[p.width ?? 'wide'], RUIMTE[p.spacing ?? 'normal']].join(
    ' ',
  );
}

/** Klassen die ook binnen een ander blok gelden. */
export function binnenKlassen(p: Opmaak): string {
  return [UITLIJNING[p.align ?? 'left'], ACHTERGROND[p.background ?? 'transparent']]
    .filter(Boolean)
    .join(' ');
}

export function kolommen(count = 3): string {
  return (
    (
      {
        1: 'grid gap-5 grid-cols-1',
        2: 'grid gap-5 md:grid-cols-2',
        3: 'grid gap-5 md:grid-cols-3',
        4: 'grid gap-5 sm:grid-cols-2 lg:grid-cols-4',
      } as Record<number, string>
    )[count] ?? 'grid gap-5 md:grid-cols-3'
  );
}
