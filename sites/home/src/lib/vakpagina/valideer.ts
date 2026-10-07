import {
  ACHTERGRONDEN,
  BLOK_TYPES,
  BREEDTES,
  type Blok,
  RUIMTES,
  UITLIJNINGEN,
  type Vakpagina,
} from './types';

// Zelfde regels als backend/app/authoring/vakpagina.py. Een ongeldig bestand
// breekt de build (laden.ts), zodat een kapotte vakpagina nooit live gaat.

export const MAX_BLOKKEN = 200;
export const MAX_DIEPTE = 4;
const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const TEKST_PROPS = ['title', 'tagline', 'subtitle', 'info', 'alt', 'caption'] as const;
const LIJST_PROPS = ['niveaus', 'themas', 'uitgelicht', 'alleen'] as const;

/** Mogen kinderen hebben, en welke. */
const KINDEREN: Partial<Record<Blok['type'], readonly Blok['type'][] | 'alle'>> = {
  Hero: ['Buttons'],
  Section: 'alle',
  Columns: 'alle',
  Buttons: ['Button'],
};

export function veiligeUrl(url: string): boolean {
  if (/[\s\\]/.test(url) || url.length > 1000) return false;
  return /^https:\/\/[^/]/.test(url) || /^\/(?!\/)/.test(url) || url.startsWith('#');
}

/** Contrastverhouding (WCAG) tussen twee hex-kleuren. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hoog, laag] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hoog + 0.05) / (laag + 0.05);
}

export function valideerVakpagina(doc: unknown, vak: string): string[] {
  const fouten: string[] = [];
  const d = doc as Partial<Vakpagina>;
  if (!d || typeof d !== 'object') return ['Geen document'];
  if (d.version !== 1) fouten.push('version moet 1 zijn');
  if (d.vak !== vak) fouten.push(`vak moet '${vak}' zijn`);
  if (!Array.isArray(d.blokken)) return [...fouten, 'blokken ontbreekt'];

  for (const [sleutel, waarde] of Object.entries(d.meta ?? {})) {
    if (typeof waarde !== 'string' || waarde.length > 300)
      fouten.push(`meta.${sleutel} is ongeldig`);
    if (sleutel === 'afbeelding' && typeof waarde === 'string' && !veiligeUrl(waarde))
      fouten.push('meta.afbeelding is geen veilige url');
  }

  const thema = d.thema ?? {};
  for (const modus of ['licht', 'donker'] as const) {
    const kleuren = thema[modus] ?? {};
    for (const [sleutel, waarde] of Object.entries(kleuren)) {
      if (typeof waarde !== 'string' || !HEX.test(waarde))
        fouten.push(`thema.${modus}.${sleutel} moet een kleur als #007e57 zijn`);
    }
    if (
      kleuren.primary &&
      kleuren.primaryForeground &&
      HEX.test(kleuren.primary) &&
      HEX.test(kleuren.primaryForeground)
    ) {
      if (contrast(kleuren.primary, kleuren.primaryForeground) < 4.5)
        fouten.push(`thema.${modus}: tekst op de hoofdkleur haalt geen 4,5:1 contrast`);
    }
  }
  if (thema.kopletter && !['literata', 'atkinson', 'mono'].includes(thema.kopletter))
    fouten.push('thema.kopletter is onbekend');
  for (const [sleutel, waarde] of Object.entries(thema.logo ?? {})) {
    if (typeof waarde !== 'string' || !veiligeUrl(waarde))
      fouten.push(`thema.logo.${sleutel} is geen veilige url`);
  }

  let aantal = 0;
  const ids = new Set<string>();
  const loop = (blokken: unknown[], diepte: number, ouder: Blok['type'] | null) => {
    if (diepte > MAX_DIEPTE) {
      fouten.push('blokken zijn te diep genest');
      return;
    }
    for (const ruw of blokken) {
      aantal++;
      const b = ruw as Blok;
      const plek = `blok ${b?.id ?? '?'}`;
      if (!b || typeof b !== 'object' || !BLOK_TYPES.includes(b.type)) {
        fouten.push(`${plek}: onbekend bloktype`);
        continue;
      }
      if (typeof b.id !== 'string' || !ID.test(b.id) || ids.has(b.id))
        fouten.push(`${plek}: id ontbreekt of is dubbel`);
      ids.add(b.id);
      if (ouder) {
        const mag = KINDEREN[ouder];
        if (!mag || (mag !== 'alle' && !mag.includes(b.type)))
          fouten.push(`${plek}: ${b.type} mag niet in ${ouder}`);
      }
      if (b.type === 'Button' && ouder !== 'Buttons')
        fouten.push(`${plek}: een knop staat in een Knoppen-blok`);
      const p = b.props ?? {};
      if (typeof p !== 'object') fouten.push(`${plek}: props ontbreekt`);
      if (p.width && !BREEDTES.includes(p.width)) fouten.push(`${plek}: width`);
      if (p.spacing && !RUIMTES.includes(p.spacing)) fouten.push(`${plek}: spacing`);
      if (p.align && !UITLIJNINGEN.includes(p.align)) fouten.push(`${plek}: align`);
      if (p.background && !ACHTERGRONDEN.includes(p.background)) fouten.push(`${plek}: background`);
      for (const sleutel of TEKST_PROPS) {
        const waarde = p[sleutel];
        if (waarde !== undefined && (typeof waarde !== 'string' || waarde.length > 300))
          fouten.push(`${plek}: ${sleutel}`);
      }
      for (const sleutel of ['href', 'src'] as const) {
        const waarde = p[sleutel];
        if (waarde !== undefined && (typeof waarde !== 'string' || !veiligeUrl(waarde)))
          fouten.push(`${plek}: ${sleutel} is geen veilige url`);
      }
      for (const sleutel of LIJST_PROPS) {
        const waarde = p[sleutel];
        if (
          waarde !== undefined &&
          (!Array.isArray(waarde) ||
            waarde.length > 50 ||
            waarde.some((v) => typeof v !== 'string' || v.length > 50))
        )
          fouten.push(`${plek}: ${sleutel}`);
      }
      if (p.variant !== undefined) {
        const mag =
          b.type === 'Button'
            ? ['primary', 'secondary']
            : b.type === 'Hero'
              ? ['default', 'compact', 'plain']
              : [];
        if (!mag.includes(p.variant)) fouten.push(`${plek}: variant`);
      }
      if (p.size !== undefined && !(b.type === 'Button' && ['sm', 'lg'].includes(p.size)))
        fouten.push(`${plek}: size`);
      if (p.automatischeKop !== undefined && typeof p.automatischeKop !== 'boolean')
        fouten.push(`${plek}: automatischeKop`);
      if (p.filters !== undefined && typeof p.filters !== 'boolean')
        fouten.push(`${plek}: filters`);
      if (p.count !== undefined && !(Number.isInteger(p.count) && p.count >= 1 && p.count <= 4))
        fouten.push(`${plek}: count is 1 tot 4`);
      if (b.type === 'Picture' && (!p.src || !p.alt))
        fouten.push(`${plek}: een afbeelding heeft src en alt`);
      if (b.tekst !== undefined && (typeof b.tekst !== 'string' || b.tekst.length > 5000))
        fouten.push(`${plek}: tekst`);
      if (b.kinderen !== undefined) {
        if (!Array.isArray(b.kinderen)) fouten.push(`${plek}: kinderen`);
        else if (b.kinderen.length > 0) {
          if (!KINDEREN[b.type]) fouten.push(`${plek}: ${b.type} heeft geen kinderen`);
          loop(b.kinderen, diepte + 1, b.type);
        }
      }
    }
  };
  loop(d.blokken, 1, null);
  if (aantal > MAX_BLOKKEN) fouten.push(`hoogstens ${MAX_BLOKKEN} blokken`);
  return fouten;
}
