// Leest meetwaarden uit REPL-regels voor de live plotter. Een regel als
// "Links: 800 | Rechts: 5000" of een kale "12345" wordt één sample met één
// tot vier reeksen; tekstregels zonder getallen tellen niet mee.

/** Losstaande getallen; het cijfer in een pinnaam als A0 telt niet. */
const GETAL_RE = /(?<![\w.])-?\d+(?:\.\d+)?(?![\w.])/g;

export const MAX_REEKSEN = 4;
export const MAX_SAMPLES = 300;

export function parseGetallen(regel: string): number[] {
  // Editor-statusmeldingen als "[verbonden]" horen niet in de grafiek.
  if (regel.startsWith('[')) return [];
  return [...regel.matchAll(GETAL_RE)].map((m) => Number(m[0])).slice(0, MAX_REEKSEN);
}

/**
 * Voegt de meetwaarden van één regel toe aan de samplebuffer (in place,
 * begrensd op MAX_SAMPLES). Geeft terug of er iets is toegevoegd.
 */
export function voegSample(samples: number[][], regel: string): boolean {
  const getallen = parseGetallen(regel);
  if (getallen.length === 0) return false;
  samples.push(getallen);
  if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES);
  return true;
}
