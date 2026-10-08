import { SITES_BY_ID } from '@coderius/shared/sites';

// De klaspagina (/klas/<code>): een docent stelt in docs-management een
// klasweergave samen; de delivery levert hem als /_cdx/klas/<code>.json op de
// host van het vak. Wat hier binnenkomt is al gevalideerd, maar de pagina
// vertrouwt het niet blind: onbekende cursussen en vreemde links vallen weg.

export type KlasItem =
  | { type: 'cursus'; site: string; label?: string | null }
  | { type: 'pagina'; site: string; docId: string; pad: string; label: string }
  | { type: 'link'; url: string; host: string; label: string };

export type KlasGroep = { id: string; titel: string; items: KlasItem[] };

export type Klas = {
  code: string;
  naam: string;
  vak: string;
  intro: string;
  groepen: KlasGroep[];
};

const tekst = (waarde: unknown, max = 2000) =>
  typeof waarde === 'string' ? waarde.slice(0, max) : '';

// Alleen een pad binnen de cursus zelf: /<pad-van-de-cursus>/…, zonder spaties,
// stuurtekens of backslashes. Browsers halen tabs en regeleinden uit een URL,
// dus '/\t/x' zou anders '//x' worden: een link naar een andere host.
const VEILIG_PAD = /^\/[A-Za-z0-9._~!$&'()*+,;=:@%/#?-]*$/;

function padVanCursus(pad: string, site: string): boolean {
  const cursus = SITES_BY_ID[site];
  return !!cursus && VEILIG_PAD.test(pad) && pad.startsWith(`/${cursus.path}/`);
}

/** De host van een https-link, of null als het geen geldige https-link is. */
function httpsHost(url: string): string | null {
  if (/[\s\\]/.test(url)) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname ? parsed.hostname : null;
  } catch {
    return null;
  }
}

function item(ruw: unknown): KlasItem | null {
  if (!ruw || typeof ruw !== 'object') return null;
  const i = ruw as Record<string, unknown>;
  if (i.type === 'cursus' && typeof i.site === 'string' && SITES_BY_ID[i.site]) {
    return { type: 'cursus', site: i.site, label: tekst(i.label, 100) || null };
  }
  if (
    i.type === 'pagina' &&
    typeof i.site === 'string' &&
    SITES_BY_ID[i.site] &&
    typeof i.pad === 'string' &&
    padVanCursus(i.pad, i.site)
  ) {
    return {
      type: 'pagina',
      site: i.site,
      docId: tekst(i.docId, 300),
      pad: i.pad,
      label: tekst(i.label, 100) || i.pad,
    };
  }
  if (i.type === 'link' && typeof i.url === 'string') {
    const host = httpsHost(i.url);
    if (host) return { type: 'link', url: i.url, host, label: tekst(i.label, 100) || i.url };
  }
  return null;
}

/** Klas uit de JSON van de delivery; null als het geen klas is. */
export function normaliseerKlas(ruw: unknown): Klas | null {
  if (!ruw || typeof ruw !== 'object') return null;
  const k = ruw as Record<string, unknown>;
  if (typeof k.code !== 'string' || typeof k.naam !== 'string') return null;
  const groepen = Array.isArray(k.groepen) ? k.groepen : [];
  return {
    code: k.code,
    naam: tekst(k.naam, 100),
    vak: tekst(k.vak, 50),
    intro: tekst(k.intro),
    groepen: groepen
      .filter((g): g is Record<string, unknown> => !!g && typeof g === 'object')
      .map((g) => ({
        id: tekst(g.id, 32),
        titel: tekst(g.titel, 100),
        items: (Array.isArray(g.items) ? g.items : [])
          .map(item)
          .filter((i): i is KlasItem => i !== null),
      }))
      .filter((g) => g.items.length > 0 || g.titel),
  };
}

/** Cookie dat de delivery op /klas/<code> zet; weg = geen klasweergave meer. */
export const VERLAAT_COOKIE = 'cdx_klas=; Path=/; Max-Age=0; SameSite=Lax';
