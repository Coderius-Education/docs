// Types voor matomo.js (plain CommonJS-data + helpers). Zo kunnen TS-
// consumenten zoals de SvelteKit-homepage het typed importeren.

export const MATOMO_URL: string;
export const MATOMO_RETENTION_DAYS: number;

export function buildMatomoSnippet(opts: { siteId: string | number; matomoUrl?: string }): string;

export function matomoTrackEvent(
  category: string,
  action: string,
  name?: string,
  value?: number,
): void;

export type MatomoOptOutStatus = 'active' | 'opted-out' | 'unavailable';

export function matomoOptOut(): void;
export function matomoForgetOptOut(): void;
export function matomoIsOptedOut(callback: (status: MatomoOptOutStatus) => void): void;
