export interface KlasInstelling {
  volgorde?: string[];
  verborgen?: string[];
}
export const COOKIE: string;
export const VERLAAT_COOKIE: string;
export function hoofdstukSleutel(item: unknown): string | null;
export function pasKlasToe<T>(items: T[], instelling: KlasInstelling | null | undefined): T[];
export function leesKlasCookie(cookies: string | null | undefined): string | null;
export function slug(tekst: string): string;
