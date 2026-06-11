import { loader } from '@monaco-editor/react';

// Monaco wordt self-hosted geserveerd vanuit dit package z'n static-map
// (gekopieerd via scripts/copy-monaco.mjs). De AMD-loader haalt zijn eigen
// workers op vanaf hetzelfde pad, dus er is geen bundler-configuratie nodig
// en alles blijft same-origin (schoolnetwerken blokkeren CDN's).
const DEFAULT_MONACO_BASE_URL = '/monaco/vs';

let monacoBaseUrl = DEFAULT_MONACO_BASE_URL;
let configured = false;

// Monaco's language-workers draaien vanuit een blob-URL en kunnen een
// origin-relatief pad ('/monaco/vs') niet oplossen — maak het absoluut.
function absoluteVsPath(): string {
  if (monacoBaseUrl.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${monacoBaseUrl}`;
  }
  return monacoBaseUrl;
}

export function setMonacoBaseUrl(url: string): void {
  monacoBaseUrl = url.replace(/\/+$/, '');
  if (configured) {
    loader.config({ paths: { vs: absoluteVsPath() } });
  }
}

export function configureMonacoLoader(): void {
  if (configured) return;
  configured = true;
  loader.config({ paths: { vs: absoluteVsPath() } });
}
