// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface Window {
    // Matomo tracker queue; alleen aanwezig als de tracking-snippet is geladen
    // (zie $lib/components/Matomo.svelte).
    _paq?: unknown[];
  }
}

export {};
