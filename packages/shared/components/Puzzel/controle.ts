// Wat een test van een puzzel in een les kan zien. Een puzzel keurt één
// volgorde goed, en of dat de enige goede is, weet alleen wie de code leest.
// De vorm is wel te controleren: staat hij op een eigen tabblad, zegt de
// opdracht wat de code moet doen, is er uitleg bij de goede volgorde, en past
// elke regel. De tests van een cursus (`puzzels.test.ts`) gebruiken dit; zo
// geldt in elke cursus dezelfde regel.

import { regelsVan } from './logica';

export interface PuzzelInLes {
  /** De `##`-kop waar de puzzel onder staat. */
  kop: string;
  /** De `##`-kop ervoor en erna, voor de plek in de les. */
  kopVoor: string | undefined;
  kopNa: string | undefined;
  /** De tekst tussen de kop en de puzzel: de opdracht. */
  opdracht: string;
  taal: string | undefined;
  /** De code, of undefined als de les hem niet als tekst meegeeft. */
  code: string | undefined;
  /** Wat de leerling leest als alles klopt. */
  uitleg: string;
}

/** Een regel breekt in de puzzel niet af: zoveel tekens passen er op 1280 pixels. */
export const LANGSTE_REGEL = 62;
/** Met twaalf regels past het tabblad nog op 1280×720. */
export const MEESTE_REGELS = 12;
export const MINSTE_REGELS = 5;

const letterlijkeTekst = (tekst: string) => tekst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Elke `<Puzzel>` in de bron van een les, met wat eromheen staat. */
export function puzzelsIn(bron: string): PuzzelInLes[] {
  const koppen = [...bron.matchAll(/^## (.+)$/gm)].map((m) => ({
    titel: m[1].replace(/\s*\\?\{#[^}]*\}\s*$/, '').trim(),
    plek: m.index ?? 0,
    eind: (m.index ?? 0) + m[0].length,
  }));
  const uit: PuzzelInLes[] = [];
  const tag = /<Puzzel\b((?:[^>{`]|\{`[\s\S]*?`\}|\{[^}]*\})*)>([\s\S]*?)<\/Puzzel>/g;
  for (const m of bron.matchAll(tag)) {
    const plek = m.index ?? 0;
    const nummer = koppen.filter((k) => k.plek < plek).length - 1;
    const kop = koppen[nummer];
    const props = m[1];
    const letterlijk = /\bcode=\{`([\s\S]*?)`\}/.exec(props)?.[1];
    const naam = /\bcode=\{(\w+)\}/.exec(props)?.[1];
    const uitExport = naam
      ? new RegExp(`^export const ${letterlijkeTekst(naam)} = \`([\\s\\S]*?)\`;`, 'm').exec(
          bron,
        )?.[1]
      : undefined;
    uit.push({
      kop: kop?.titel ?? '',
      kopVoor: koppen[nummer - 1]?.titel,
      kopNa: koppen[nummer + 1]?.titel,
      opdracht: kop ? bron.slice(kop.eind, plek).trim() : '',
      taal: /\btaal="([^"]+)"/.exec(props)?.[1],
      code: letterlijk ?? uitExport,
      uitleg: m[2].trim(),
    });
  }
  return uit;
}

/** Wat er aan de vorm van een puzzel mankeert; een lege lijst is goed. */
export function gebreken(puzzel: PuzzelInLes): string[] {
  const uit: string[] = [];
  if (puzzel.kop !== 'Puzzel') uit.push('staat niet onder een eigen kop `## Puzzel`');
  // Zonder die zin is de volgorde van twee alinea's of twee items een gok.
  // `\s+`: in de bron breekt een alinea af waar de auteur dat wil.
  if (!/door\s+elkaar/.test(puzzel.opdracht))
    uit.push('de opdracht zegt niet dat de regels door elkaar staan');
  if (puzzel.opdracht.length <= 60)
    uit.push('de opdracht zegt niet wat de code moet doen en wat boven wat hoort');
  if (puzzel.uitleg.length <= 60) uit.push('er is geen uitleg bij de goede volgorde');
  if (!puzzel.taal) uit.push('er staat geen taal bij (taal="python")');
  if (puzzel.code === undefined) {
    uit.push('de code staat niet in de les (code={`…`} of een export)');
    return uit;
  }
  const regels = regelsVan(puzzel.code).map((r) => r.tekst);
  if (regels.length < MINSTE_REGELS || regels.length > MEESTE_REGELS)
    uit.push(`${regels.length} regels: een puzzel heeft er ${MINSTE_REGELS} tot ${MEESTE_REGELS}`);
  for (const regel of regels)
    if (regel.length > LANGSTE_REGEL)
      uit.push(`een regel van ${regel.length} tekens breekt af: ${regel.trim()}`);
  if (regels.some((r) => r.includes('\t'))) uit.push('een regel springt in met een tab');
  return uit;
}
