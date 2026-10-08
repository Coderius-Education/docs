// De actieve klas in de browser: het cookie `cdx_klas` (gezet door de
// delivery op /klas/<code>) plus de klas zelf van /_cdx/klas/<code>.json.
// Eén verzoek per pagina-lading, en een korte cache in sessionStorage zodat
// doorklikken binnen een cursus niet elke keer de server vraagt.
//
// Geen @docusaurus/theme-common: zie plugins/transpile-shared.js.

import { useEffect, useState } from 'react';
import { storageKey } from '../opslag';
import { VERLAAT_COOKIE, leesKlasCookie } from './index';

export interface Klas {
  code: string;
  naam: string;
  vak: string;
  intro: string;
  groepen: unknown[];
  cursussen: Record<string, { volgorde?: string[]; verborgen?: string[] }>;
}

const CACHE_MS = 60 * 1000;
// Bewust vak-breed (geen site-id): de klas geldt voor alle cursussen van het vak.
const cacheSleutel = (code: string) => storageKey('klas', `cache.${code}`);

let lopend: { code: string; belofte: Promise<Klas | null> } | null = null;

function uitCache(code: string): Klas | null | undefined {
  try {
    const opgeslagen = JSON.parse(sessionStorage.getItem(cacheSleutel(code)) || 'null');
    if (opgeslagen && Date.now() - opgeslagen.t < CACHE_MS) return opgeslagen.klas;
  } catch {}
  return undefined;
}

function haalKlas(code: string): Promise<Klas | null> {
  if (lopend?.code === code) return lopend.belofte;
  const bewaard = uitCache(code);
  const belofte: Promise<Klas | null> =
    bewaard !== undefined
      ? Promise.resolve(bewaard)
      : fetch(`/_cdx/klas/${code}.json`, { credentials: 'same-origin' })
          .then((antwoord) => {
            if (antwoord.status === 404) {
              // Klas weg of nieuwe code: dan ook geen klasweergave meer.
              document.cookie = VERLAAT_COOKIE;
              return null;
            }
            return antwoord.ok ? antwoord.json() : null;
          })
          .then((klas) => {
            try {
              sessionStorage.setItem(cacheSleutel(code), JSON.stringify({ t: Date.now(), klas }));
            } catch {}
            return klas;
          })
          .catch(() => null);
  lopend = { code, belofte };
  return belofte;
}

/** Laat de sidebar weer zien (de head-script verbergt hem tot de klas er is). */
export function markeerKlaar() {
  document.documentElement.setAttribute('data-klas-klaar', '');
}

/** Klasweergave verlaten: cookie en cache weg, pagina opnieuw laden. */
export function verlaatKlas(code: string) {
  document.cookie = VERLAAT_COOKIE;
  try {
    sessionStorage.removeItem(cacheSleutel(code));
  } catch {}
  window.location.reload();
}

/** `{ klaar, klas }`; klas is null zonder (geldige) klas. */
export function useKlas() {
  const [staat, zetStaat] = useState<{ klaar: boolean; klas: Klas | null }>({
    klaar: false,
    klas: null,
  });
  useEffect(() => {
    const code = leesKlasCookie(document.cookie);
    if (!code) {
      zetStaat({ klaar: true, klas: null });
      return undefined;
    }
    let weg = false;
    haalKlas(code).then((klas) => {
      if (!weg) zetStaat({ klaar: true, klas });
    });
    return () => {
      weg = true;
    };
  }, []);
  return staat;
}
